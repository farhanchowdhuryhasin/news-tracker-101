import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";
import fs from "fs";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  timeout: 4000,
});

const TOPIC_FEEDS: Record<string, string[]> = {
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.theguardian.com/world/rss',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://feeds.npr.org/1001/rss.xml',
  ],
  technology: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
  ],
  tech: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://www.theverge.com/rss/index.xml',
  ],
  business: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    'https://www.theguardian.com/business/rss',
  ],
  finance: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
  ],
  science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
  ],
  health: [
    'https://feeds.bbci.co.uk/news/health/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
  ],
  entertainment: [
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
  ],
  sports: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.theguardian.com/sport/rss',
  ],
  sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.theguardian.com/sport/rss',
  ],
};

// In-memory cache for news articles to provide fast responses and prevent 503s
const newsCache = new Map<string, { articles: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

async function fetchArticles(topic: string, timeRange?: string): Promise<any[]> {
  const cleanTopic = (topic || '').trim();
  const lowerTopic = cleanTopic.toLowerCase();
  const cacheKey = `${lowerTopic}_${timeRange || 'all'}`;

  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.articles.length > 0) {
    return cached.articles;
  }

  let timeFilter = '';
  if (timeRange === '1h') timeFilter = ' when:1h';
  else if (timeRange === '1d') timeFilter = ' when:1d';
  else if (timeRange === '7d') timeFilter = ' when:7d';
  else if (timeRange === '30d') timeFilter = ' when:30d';

  // 1. First attempt: Google News RSS
  let googleRssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
  if (cleanTopic && lowerTopic !== 'world news' && lowerTopic !== 'latest') {
    googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanTopic + timeFilter)}&hl=en-US&gl=US&ceid=US:en`;
  } else if (timeFilter) {
    googleRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('world news' + timeFilter)}&hl=en-US&gl=US&ceid=US:en`;
  }

  try {
    const feed = await parser.parseURL(googleRssUrl);
    if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
      const articles = feed.items.slice(0, 60).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        source: item.source || 'Google News',
        contentSnippet: item.contentSnippet || item.content || ''
      }));
      newsCache.set(cacheKey, { articles, timestamp: Date.now() });
      return articles;
    }
  } catch (err: any) {
    console.warn(`[News RSS] Google News unavailable (${err?.message || err}), switching to trusted fallback sources`);
  }

  // 2. Resilient fallback: Query premier international RSS feeds
  let fallbackUrls = TOPIC_FEEDS.world;
  for (const [key, urls] of Object.entries(TOPIC_FEEDS)) {
    if (lowerTopic.includes(key)) {
      fallbackUrls = urls;
      break;
    }
  }

  const collectedArticles: any[] = [];
  for (const url of fallbackUrls) {
    try {
      const feed = await parser.parseURL(url);
      if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
        const sourceName = feed.title?.replace(/RSS Feed|News/gi, '').trim() || 'Global News';
        feed.items.forEach(item => {
          if (item.title && item.link) {
            collectedArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              source: item.source || sourceName,
              contentSnippet: item.contentSnippet || item.content || ''
            });
          }
        });
        if (collectedArticles.length >= 40) break;
      }
    } catch (fallbackErr: any) {
      console.warn(`[News RSS] Fallback feed ${url} skipped:`, fallbackErr?.message);
    }
  }

  // If specific search keyword was requested, filter items
  let result = collectedArticles;
  if (cleanTopic && lowerTopic !== 'world news' && lowerTopic !== 'latest') {
    const keywords = lowerTopic.split(/\s+/).filter(w => w.length > 2);
    if (keywords.length > 0) {
      const filtered = collectedArticles.filter(a => {
        const combined = `${a.title} ${a.contentSnippet}`.toLowerCase();
        return keywords.some(k => combined.includes(k));
      });
      if (filtered.length > 0) {
        result = filtered;
      }
    }
  }

  if (result.length > 0) {
    const finalArticles = result.slice(0, 60);
    newsCache.set(cacheKey, { articles: finalArticles, timestamp: Date.now() });
    return finalArticles;
  }

  // 3. If everything failed, check any previously cached articles or return general world cache
  const generalCached = newsCache.get('world news_all');
  if (generalCached && generalCached.articles.length > 0) {
    return generalCached.articles;
  }

  return [];
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const CONFIG_FILE = path.join(process.cwd(), 'config.json');
  const BLOGS_FILE = path.join(process.cwd(), 'blogs.json');
  const TMP_BLOGS_FILE = '/tmp/blogs.json';
  const DELETED_FILE = path.join(process.cwd(), 'deleted_blogs.json');
  const TMP_DELETED_FILE = '/tmp/deleted_blogs.json';

  // Firestore DB Instance Helper
  let firestoreDb: any = null;
  function getFirestoreInstance() {
    if (firestoreDb) return firestoreDb;
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(config);
        firestoreDb = getFirestore(appInstance, config.firestoreDatabaseId);
      }
    } catch (e) {
      console.warn('[Server] Firestore init note:', e);
    }
    return firestoreDb;
  }

  const getDeletedSet = (): Set<string> => {
    const set = new Set<string>();
    const tryRead = (filePath: string) => {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => {
              if (id) {
                const str = String(id).trim().toLowerCase();
                set.add(str);
                set.add(decodeURIComponent(str));
              }
            });
          }
        }
      } catch {}
    };
    tryRead(DELETED_FILE);
    tryRead(TMP_DELETED_FILE);
    return set;
  };

  const recordDeleted = (ids: string[]) => {
    const existing = getDeletedSet();
    ids.forEach(id => {
      if (id) {
        const str = String(id).trim().toLowerCase();
        existing.add(str);
        existing.add(decodeURIComponent(str));
      }
    });
    const arr = Array.from(existing);
    const json = JSON.stringify(arr, null, 2);
    try { fs.writeFileSync(DELETED_FILE, json); } catch {}
    try { fs.writeFileSync(TMP_DELETED_FILE, json); } catch {}
  };

  const unrecordDeleted = (ids: string[]) => {
    const existing = getDeletedSet();
    ids.forEach(id => {
      if (id) {
        const str = String(id).trim().toLowerCase();
        existing.delete(str);
        existing.delete(decodeURIComponent(str));
      }
    });
    const arr = Array.from(existing);
    const json = JSON.stringify(arr, null, 2);
    try { fs.writeFileSync(DELETED_FILE, json); } catch {}
    try { fs.writeFileSync(TMP_DELETED_FILE, json); } catch {}
  };

  const readServerBlogs = (): any[] => {
    const map = new Map<string, any>();
    const mergeFrom = (filePath: string) => {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((b: any) => {
              if (b && (b.id || b.slug || b.title)) {
                const key = String(b.id || b.slug).trim().toLowerCase();
                if (!map.has(key)) {
                  map.set(key, b);
                }
              }
            });
          }
        }
      } catch (e) {
        console.error("Error reading blogs file:", filePath, e);
      }
    };

    mergeFrom(BLOGS_FILE);
    mergeFrom(TMP_BLOGS_FILE);

    const deletedSet = getDeletedSet();
    let blogs = Array.from(map.values()).filter((b: any) => {
      if (!b || (!b.id && !b.slug)) return false;
      const bId = String(b.id || '').trim().toLowerCase();
      const bSlug = String(b.slug || '').trim().toLowerCase();
      const bDecodedSlug = decodeURIComponent(bSlug);

      return !deletedSet.has(bId) && !deletedSet.has(bSlug) && !deletedSet.has(bDecodedSlug);
    });

    blogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return blogs;
  };

  const writeServerBlogs = (blogs: any[]) => {
    const json = JSON.stringify(blogs, null, 2);
    try {
      fs.writeFileSync(BLOGS_FILE, json);
    } catch (e) {
      console.error("Failed to write to BLOGS_FILE:", e);
    }
    try {
      fs.writeFileSync(TMP_BLOGS_FILE, json);
    } catch {}
  };

  async function syncBlogsFromFirestore(): Promise<any[]> {
    const db = getFirestoreInstance();
    const current = readServerBlogs();
    const map = new Map<string, any>();
    current.forEach(b => {
      const key = String(b.id || b.slug).trim().toLowerCase();
      if (key) map.set(key, b);
    });

    if (!db) return current;

    try {
      const snap = await getDocs(collection(db, 'blogs'));
      const deletedSet = getDeletedSet();
      if (!snap.empty) {
        snap.forEach(d => {
          const data = d.data();
          if (data && (data.id || data.slug || data.title)) {
            const item: any = { ...data, id: data.id || d.id };
            const bId = String(item.id || '').trim().toLowerCase();
            const bSlug = String(item.slug || '').trim().toLowerCase();
            if (!deletedSet.has(bId) && !deletedSet.has(bSlug)) {
              // Prefer Firestore or update existing
              map.set(bId || bSlug, item);
            }
          }
        });
      }

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      writeServerBlogs(merged);

      // Bidirectional sync: make sure all local blogs are also pushed to Firestore
      for (const item of merged) {
        const id = String(item.id || item.slug);
        if (id) {
          try {
            await setDoc(doc(db, 'blogs', id), item, { merge: true });
          } catch (writeErr) {
            console.warn('[Server] Firestore push error for blog:', id, writeErr);
          }
        }
      }

      return merged;
    } catch (e) {
      console.warn('[Server] Firestore sync note:', e);
    }
    return current;
  }

  // Initial sync on server launch
  syncBlogsFromFirestore().catch(() => {});
  // Recurring sync every 4 minutes to guarantee up-to-date sitemaps and indexing
  setInterval(() => {
    syncBlogsFromFirestore().catch(() => {});
  }, 4 * 60 * 1000);

  const sanitizeServerConfig = (cfg: any) => {
    const legacy = ['World News Tracker Online', 'World Latest News Tracker', 'News Tracker', 'World News Tracker'];
    if (!cfg) {
      return {
        url: '',
        siteName: 'worldnewstracker.online',
        siteTagline: 'Live Global Intelligence & Breaking Headlines',
        logoUrl: '',
      };
    }
    if (!cfg.siteName || legacy.includes(String(cfg.siteName).trim())) {
      cfg.siteName = 'worldnewstracker.online';
    }
    return cfg;
  };

  const readServerConfig = () => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return sanitizeServerConfig(JSON.parse(data));
      }
    } catch {}
    return sanitizeServerConfig(null);
  };

  // AdSense & Search Engine Crawler endpoints
  app.get("/ads.txt", (req, res) => {
    const adsFile = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(adsFile)) {
      res.type('text/plain').sendFile(adsFile);
    } else {
      res.type('text/plain').send('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0');
    }
  });

  app.get("/robots.txt", (req, res) => {
    const robotsFile = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsFile)) {
      res.type('text/plain').sendFile(robotsFile);
    } else {
      res.type('text/plain').send(
        "User-agent: *\nAllow: /\nAllow: /blog\nAllow: /blog/*\nDisallow: /admin\n\nSitemap: https://www.worldnewstracker.online/sitemap.xml\nSitemap: https://www.worldnewstracker.online/sitemap-news.xml\nSitemap: https://www.worldnewstracker.online/rss.xml\n"
      );
    }
  });

  // Comprehensive Main XML Sitemap (Google, Bing, Yandex)
  app.get("/sitemap.xml", async (req, res) => {
    try {
      let blogs = readServerBlogs();
      if (blogs.length === 0) {
        blogs = await syncBlogsFromFirestore();
      }
      const today = new Date().toISOString().split('T')[0];
      const baseUrl = 'https://www.worldnewstracker.online';

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;

      blogs.forEach((b: any) => {
        if (b && (b.slug || b.id)) {
          const slug = encodeURIComponent(String(b.slug || b.id));
          const mod = b.updatedAt ? b.updatedAt.split('T')[0] : (b.createdAt ? b.createdAt.split('T')[0] : today);
          const postDate = new Date(b.createdAt || Date.now());
          const isRecent = (Date.now() - postDate.getTime()) < (7 * 24 * 60 * 60 * 1000);

          xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>`;

          if (isRecent) {
            xml += `
    <news:news>
      <news:publication>
        <news:name>worldnewstracker.online</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${b.createdAt || new Date().toISOString()}</news:publication_date>
      <news:title>${escapeXml(b.title)}</news:title>
    </news:news>`;
          }

          xml += `
  </url>`;
        }
      });

      xml += `
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/disclaimer</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
      res.send(xml);
    } catch (e) {
      const sitemapFile = path.join(process.cwd(), 'public', 'sitemap.xml');
      if (fs.existsSync(sitemapFile)) {
        res.type('application/xml').sendFile(sitemapFile);
      } else {
        res.status(500).send('Error generating sitemap');
      }
    }
  });

  // Dedicated Google News XML Sitemap
  app.get("/sitemap-news.xml", async (req, res) => {
    try {
      let blogs = readServerBlogs();
      if (blogs.length === 0) {
        blogs = await syncBlogsFromFirestore();
      }
      const baseUrl = 'https://www.worldnewstracker.online';

      const recentBlogs = blogs.filter((b: any) => {
        const postDate = new Date(b.createdAt || 0).getTime();
        return (Date.now() - postDate) < (7 * 24 * 60 * 60 * 1000);
      });

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

      recentBlogs.forEach((b: any) => {
        const slug = encodeURIComponent(String(b.slug || b.id));
        xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <news:news>
      <news:publication>
        <news:name>worldnewstracker.online</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${b.createdAt || new Date().toISOString()}</news:publication_date>
      <news:title>${escapeXml(b.title)}</news:title>
    </news:news>
  </url>`;
      });

      xml += `\n</urlset>`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900');
      res.send(xml);
    } catch (e) {
      res.status(500).send('Error generating news sitemap');
    }
  });

  // RSS 2.0 Feed for Google Publisher Center and Fast Indexing
  const rssFeedHandler = async (req: express.Request, res: express.Response) => {
    try {
      let blogs = readServerBlogs();
      if (blogs.length === 0) {
        blogs = await syncBlogsFromFirestore();
      }
      const baseUrl = 'https://www.worldnewstracker.online';

      let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>worldnewstracker.online – Global News &amp; In-Depth Analysis</title>
    <link>${baseUrl}</link>
    <description>Live world news tracking, breaking headlines, and editorial reporting from worldnewstracker.online.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

      blogs.slice(0, 50).forEach((b: any) => {
        const slug = encodeURIComponent(String(b.slug || b.id));
        const postUrl = `${baseUrl}/blog/${slug}`;
        const pubDate = new Date(b.createdAt || Date.now()).toUTCString();
        const excerpt = escapeXml(b.excerpt || (b.content ? b.content.replace(/<[^>]*>?/gm, '').substring(0, 200) : b.title));

        rss += `
    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(b.author || 'worldnewstracker.online')}</author>
      <category>${escapeXml(b.category || 'News')}</category>
      <description>${excerpt}</description>
    </item>`;
      });

      rss += `
  </channel>
</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
      res.send(rss);
    } catch (e) {
      res.status(500).send('Error generating RSS feed');
    }
  };

  app.get("/rss.xml", rssFeedHandler);
  app.get("/feed.xml", rssFeedHandler);
  app.get("/feed", rssFeedHandler);

  // Ping Google and Bing with updated sitemap
  app.get("/api/ping-google", async (req, res) => {
    const sitemapUrl = encodeURIComponent('https://www.worldnewstracker.online/sitemap.xml');
    const results: Record<string, any> = {};

    try {
      const gRes = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
      results.google = { ok: gRes.ok, status: gRes.status };
    } catch (e: any) {
      results.google = { ok: false, error: e.message };
    }

    try {
      const bRes = await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`);
      results.bing = { ok: bRes.ok, status: bRes.status };
    } catch (e: any) {
      results.bing = { ok: false, error: e.message };
    }

    res.json({ success: true, timestamp: new Date().toISOString(), results });
  });

  app.get("/llms.txt", (req, res) => {
    const llmsFile = path.join(process.cwd(), 'public', 'llms.txt');
    if (fs.existsSync(llmsFile)) {
      res.type('text/plain').sendFile(llmsFile);
    } else {
      res.status(404).send('Not found');
    }
  });

  // Google Search Console HTML File verification handler
  app.get("/:googlefile(google[a-zA-Z0-9_-]+\\.html)", (req, res) => {
    const filename = req.params.googlefile;
    res.type('text/html').send(`google-site-verification: ${filename}`);
  });

  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        res.json(sanitizeServerConfig(JSON.parse(data)));
      } else {
        res.json(sanitizeServerConfig(null));
      }
    } catch (e) {
      res.json(sanitizeServerConfig(null));
    }
  });

  app.post("/api/config", (req, res) => {
    try {
      const data = req.body;
      let existingData: any = {};
      if (fs.existsSync(CONFIG_FILE)) {
        try {
          existingData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        } catch (err) {
          console.error("Error reading existing config file:", err);
        }
      }

      const newData = {
        ...existingData,
        ...data
      };

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true, config: newData });
    } catch (e) {
      console.error("Critical error saving config:", e);
      res.status(500).json({ error: 'Failed to save config' });
    }
  });

  app.get("/api/blogs", async (req, res) => {
    try {
      let blogs = readServerBlogs();
      if (blogs.length === 0) {
        blogs = await syncBlogsFromFirestore();
      }
      res.json(blogs);
    } catch (e) {
      console.error("Error reading blogs:", e);
      res.json([]);
    }
  });

  app.post("/api/blogs", async (req, res) => {
    try {
      const payload = req.body;
      const itemsToSave: any[] = Array.isArray(payload) ? payload : [payload];
      let currentBlogs = readServerBlogs();
      const now = new Date().toISOString();

      itemsToSave.forEach(blog => {
        if (!blog || !blog.title || !String(blog.title).trim()) return;

        const rawTitle = String(blog.title).trim();
        const slug = (blog.slug && String(blog.slug).trim())
          ? String(blog.slug).trim()
          : rawTitle.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || ('post-' + Date.now().toString(36));

        const decodedSlug = decodeURIComponent(slug).toLowerCase();
        const cleanId = String(blog.id || '').trim();

        // Unrecord from deleted if previously deleted
        unrecordDeleted([cleanId, slug, decodedSlug]);

        const index = currentBlogs.findIndex(b => {
          const bId = String(b.id || '').trim();
          const bSlug = String(b.slug || '').trim();
          const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();
          return (cleanId && bId && cleanId === bId) ||
                 (slug && bSlug && slug === bSlug) ||
                 (decodedSlug && bDecodedSlug && decodedSlug === bDecodedSlug);
        });

        if (index !== -1) {
          currentBlogs[index] = {
            ...currentBlogs[index],
            ...blog,
            slug,
            updatedAt: now,
          };
        } else {
          currentBlogs.unshift({
            ...blog,
            id: cleanId || ('post-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
            slug,
            createdAt: blog.createdAt || now,
            updatedAt: now,
          });
        }
      });

      writeServerBlogs(currentBlogs);

      // Also mirror write to Firestore
      try {
        const db = getFirestoreInstance();
        if (db) {
          for (const b of itemsToSave) {
            const id = String(b.id || b.slug);
            if (id) {
              await setDoc(doc(db, 'blogs', id), b, { merge: true });
            }
          }
        }
      } catch (fErr) {
        console.warn('[Server] Firestore mirror write notice:', fErr);
      }

      res.json({ success: true, blogs: currentBlogs });
    } catch (e: any) {
      console.error("Critical error saving blog post:", e);
      res.status(500).json({ error: 'Failed to save blog', details: e.message });
    }
  });

  const deleteBlogHandler = (id: string, res: any) => {
    try {
      if (!id || !String(id).trim()) {
        return res.status(400).json({ error: 'Valid blog id is required' });
      }

      const decodedId = decodeURIComponent(String(id).trim()).toLowerCase();
      const rawId = String(id).trim().toLowerCase();

      recordDeleted([rawId, decodedId]);

      let blogs = readServerBlogs();
      blogs = blogs.filter((b: any) => {
        const bId = String(b.id || '').trim().toLowerCase();
        const bSlug = String(b.slug || '').trim().toLowerCase();
        const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();

        return bId !== rawId &&
               bId !== decodedId &&
               bSlug !== rawId &&
               bSlug !== decodedId &&
               bDecodedSlug !== rawId &&
               bDecodedSlug !== decodedId;
      });

      writeServerBlogs(blogs);
      res.json({ success: true, blogs });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete blog', details: e.message });
    }
  };

  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const target = String(id || '').trim().toLowerCase();
      const decodedTarget = decodeURIComponent(target).toLowerCase();

      let blogs = readServerBlogs();
      if (blogs.length === 0) {
        blogs = await syncBlogsFromFirestore();
      }

      const blog = blogs.find((b: any) => {
        const bId = String(b.id || '').trim().toLowerCase();
        const bSlug = String(b.slug || '').trim().toLowerCase();
        const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();

        return bId === target ||
               bId === decodedTarget ||
               bSlug === target ||
               bSlug === decodedTarget ||
               bDecodedSlug === target ||
               bDecodedSlug === decodedTarget;
      });

      if (blog) return res.json(blog);
      res.status(404).json({ error: 'Blog not found' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch blog', details: e.message });
    }
  });

  app.delete("/api/blogs/:id", (req, res) => {
    deleteBlogHandler(req.params.id, res);
  });

  app.delete("/api/blogs", (req, res) => {
    const id = (req.query.id || req.body?.id) as string;
    if (!id) return res.status(400).json({ error: 'Missing blog id' });
    deleteBlogHandler(id, res);
  });

  app.post("/api/news", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const { topic, timeRange } = req.body;
      const articles = await fetchArticles(topic, timeRange);
      res.json({ articles, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("RSS Handler Error:", error);
      res.json({ articles: [], updatedAt: new Date().toISOString() });
    }
  });

  // HTML SEO Pre-rendering Functions for Googlebot & Web Crawlers
  function injectBlogPostSEO(html: string, blog: any, reqUrl: string, config: any): string {
    const siteName = config?.siteName || 'worldnewstracker.online';
    const slug = encodeURIComponent(String(blog.slug || blog.id));
    const canonicalUrl = `https://www.worldnewstracker.online/blog/${slug}`;
    const title = `${escapeHtml(blog.title)} | ${siteName}`;
    const cleanRawExcerpt = blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) : blog.title);
    const excerpt = escapeHtml(cleanRawExcerpt);
    const coverImg = blog.coverImage || (blog.content ? (blog.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || '') : '') || 'https://www.worldnewstracker.online/icons/icon-512.png';
    const authorName = escapeHtml(blog.author || 'worldnewstracker.online Editorial Team');
    const pubDate = blog.createdAt || new Date().toISOString();
    const modDate = blog.updatedAt || blog.createdAt || new Date().toISOString();
    const category = escapeHtml(blog.category || 'World News');

    // 1. Dynamic Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

    // 2. Dynamic Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${excerpt}" />`);
    } else {
      html = html.replace('</head>', `<meta name="description" content="${excerpt}" />\n</head>`);
    }

    // 3. Fix Canonical URL: Overwrite the root canonical tag with the precise blog post canonical URL
    if (html.includes('rel="canonical"')) {
      html = html.replace(/<link[^>]*rel="canonical"[^>]*\/?>/i, `<link rel="canonical" id="canonical-link" href="${canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `<link rel="canonical" id="canonical-link" href="${canonicalUrl}" />\n</head>`);
    }

    // 4. Overwrite OpenGraph & Twitter tags
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${excerpt}" />`);
    html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="article" />`);

    html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${excerpt}" />`);

    // 5. Append Schema.org NewsArticle JSON-LD structured data and article meta
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "headline": blog.title,
      "description": cleanRawExcerpt,
      "image": [coverImg],
      "datePublished": pubDate,
      "dateModified": modDate,
      "author": {
        "@type": "Person",
        "name": blog.author || "worldnewstracker.online Editorial Team"
      },
      "publisher": {
        "@type": "NewsMediaOrganization",
        "name": siteName,
        "url": "https://www.worldnewstracker.online/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.worldnewstracker.online/icons/icon-512.png"
        }
      },
      "articleSection": blog.category || "General"
    };

    const extraTags = `
    <!-- Google Rich Results & Article Metadata -->
    <meta property="og:image" content="${coverImg}" />
    <meta name="twitter:image" content="${coverImg}" />
    <meta property="article:published_time" content="${pubDate}" />
    <meta property="article:modified_time" content="${modDate}" />
    <meta property="article:author" content="${authorName}" />
    <meta property="article:section" content="${category}" />
    <script type="application/ld+json" id="dynamic-page-schema">
      ${JSON.stringify(articleSchema)}
    </script>
`;
    html = html.replace('</head>', `${extraTags}\n</head>`);

    // 6. Inject crawlable semantic HTML content inside <noscript> so Googlebot indexes the complete article text immediately
    const noscriptArticle = `
    <noscript>
      <article style="max-width:800px;margin:30px auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;line-height:1.7;">
        <header>
          <span style="display:inline-block;padding:4px 12px;background:#f3f4f6;border-radius:9999px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#4b5563;">${category}</span>
          <h1 style="font-size:32px;font-weight:800;margin:16px 0;line-height:1.2;color:#111;">${escapeHtml(blog.title)}</h1>
          <p style="color:#666;font-size:14px;margin-bottom:24px;">By <strong>${authorName}</strong> | Published on ${new Date(pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </header>
        ${coverImg ? `<img src="${coverImg}" alt="${escapeHtml(blog.title)}" style="width:100%;max-height:480px;object-fit:cover;border-radius:16px;margin-bottom:24px;" />` : ''}
        <div style="font-size:18px;color:#222;">
          ${blog.content || `<p>${excerpt}</p>`}
        </div>
        <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;">
          <p><a href="https://www.worldnewstracker.online/blog" style="color:#2563eb;text-decoration:none;font-weight:bold;">← Read more world news &amp; analysis at ${siteName}</a></p>
        </footer>
      </article>
    </noscript>
`;
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${noscriptArticle}`);

    return html;
  }

  function injectBlogListSEO(html: string, blogs: any[], config: any): string {
    const siteName = config?.siteName || 'worldnewstracker.online';
    const canonicalUrl = `https://www.worldnewstracker.online/blog`;
    const title = `Latest News Analysis & Blogs | ${siteName}`;
    const desc = `Read in-depth editorial reports, real-time investigative analyses, and breaking world updates from ${siteName}.`;

    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
    html = html.replace(/<link[^>]*rel="canonical"[^>]*\/?>/i, `<link rel="canonical" id="canonical-link" href="${canonicalUrl}" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${desc}" />`);

    const listItems = blogs.slice(0, 30).map(b => `
        <li style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee;">
          <a href="https://www.worldnewstracker.online/blog/${encodeURIComponent(b.slug || b.id)}" style="font-size:18px;font-weight:bold;color:#111;text-decoration:none;">${escapeHtml(b.title)}</a>
          <p style="color:#666;font-size:14px;margin:4px 0;">${escapeHtml(b.excerpt || '')}</p>
        </li>
    `).join('\n');

    const noscriptList = `
    <noscript>
      <div style="max-width:800px;margin:30px auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
        <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;">${siteName} – Blog &amp; News Analysis</h1>
        <p style="color:#666;margin-bottom:24px;">${desc}</p>
        <ul style="list-style:none;padding:0;">
          ${listItems}
        </ul>
      </div>
    </noscript>
`;
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${noscriptList}`);
    return html;
  }

  // Vite or Production Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Custom SEO & Crawling route for blog posts in development / preview
    app.get(['/blog', '/blog/:slug'], async (req, res, next) => {
      try {
        const templatePath = path.join(process.cwd(), 'index.html');
        let rawHtml = fs.readFileSync(templatePath, 'utf-8');
        rawHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);

        let blogs = readServerBlogs();
        if (blogs.length === 0) {
          blogs = await syncBlogsFromFirestore();
        }
        const config = readServerConfig();

        if (req.params.slug) {
          const slug = req.params.slug.trim().toLowerCase();
          const decodedSlug = decodeURIComponent(slug);
          const blog = blogs.find((b: any) => {
            const bSlug = String(b.slug || '').trim().toLowerCase();
            const bId = String(b.id || '').trim().toLowerCase();
            return bSlug === slug || bSlug === decodedSlug || bId === slug || bId === decodedSlug;
          });

          if (blog) {
            const transformed = injectBlogPostSEO(rawHtml, blog, req.originalUrl, config);
            return res.type('text/html').send(transformed);
          }
        } else {
          const transformed = injectBlogListSEO(rawHtml, blogs, config);
          return res.type('text/html').send(transformed);
        }

        res.type('text/html').send(rawHtml);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Custom SEO & Crawling route for blog posts in production
    app.get(['/blog', '/blog/:slug'], async (req, res, next) => {
      try {
        const distIndex = path.join(distPath, 'index.html');
        const rawHtml = fs.readFileSync(distIndex, 'utf-8');

        let blogs = readServerBlogs();
        if (blogs.length === 0) {
          blogs = await syncBlogsFromFirestore();
        }
        const config = readServerConfig();

        if (req.params.slug) {
          const slug = req.params.slug.trim().toLowerCase();
          const decodedSlug = decodeURIComponent(slug);
          const blog = blogs.find((b: any) => {
            const bSlug = String(b.slug || '').trim().toLowerCase();
            const bId = String(b.id || '').trim().toLowerCase();
            return bSlug === slug || bSlug === decodedSlug || bId === slug || bId === decodedSlug;
          });

          if (blog) {
            const transformed = injectBlogPostSEO(rawHtml, blog, req.originalUrl, config);
            return res.type('text/html').send(transformed);
          }
        } else {
          const transformed = injectBlogListSEO(rawHtml, blogs, config);
          return res.type('text/html').send(transformed);
        }

        res.type('text/html').send(rawHtml);
      } catch (e) {
        next(e);
      }
    });

    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      let html = fs.readFileSync(distIndex, 'utf-8');

      // Dynamically fix canonical URL and OG URL for any non-root path to prevent duplicate root penalty
      if (req.path !== '/') {
        const pageCanonical = `https://www.worldnewstracker.online${req.path}`;
        html = html.replace(/<link[^>]*id="canonical-link"[^>]*\/?>/i, `<link rel="canonical" id="canonical-link" href="${pageCanonical}" />`);
        html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${pageCanonical}" />`);
        html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${pageCanonical}" />`);
      }

      res.type('text/html').send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
