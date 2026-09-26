import Parser from 'rss-parser';

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

async function fetchArticles(topic: string, timeRange?: string): Promise<any[]> {
  const cleanTopic = (topic || '').trim();
  const lowerTopic = cleanTopic.toLowerCase();

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
      return feed.items.slice(0, 60).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        source: item.source || 'Google News',
        contentSnippet: item.contentSnippet || item.content || ''
      }));
    }
  } catch (err: any) {
    console.warn(`[News RSS] Google News unavailable (${err?.message || err}), switching to trusted fallback sources`);
  }

  // 2. Fallback to trusted international feeds
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

  // Filter if specific search query
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

  return result.slice(0, 60);
}

export default async function handler(req: any, res: any) {
  // Prevent caching so every day's and minute's latest news is fresh
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const { topic, timeRange } = body || {};
    const articles = await fetchArticles(topic, timeRange);
    res.status(200).json({ articles, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("RSS Handler Error:", error);
    res.status(200).json({ articles: [], updatedAt: new Date().toISOString() });
  }
}
