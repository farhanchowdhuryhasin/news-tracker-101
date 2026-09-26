import fs from 'fs';
import path from 'path';

const tempBlogsPath = '/tmp/blogs.json';
const rootBlogsPath = path.join(process.cwd(), 'blogs.json');
const tempDeletedPath = '/tmp/deleted_blogs.json';
const rootDeletedPath = path.join(process.cwd(), 'deleted_blogs.json');

function getDeletedSet(): Set<string> {
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
  tryRead(rootDeletedPath);
  tryRead(tempDeletedPath);
  return set;
}

function recordDeleted(ids: string[]) {
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
  try { fs.writeFileSync(rootDeletedPath, json); } catch {}
  try { fs.writeFileSync(tempDeletedPath, json); } catch {}
}

function unrecordDeleted(ids: string[]) {
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
  try { fs.writeFileSync(rootDeletedPath, json); } catch {}
  try { fs.writeFileSync(tempDeletedPath, json); } catch {}
}

function getBlogsList(): any[] {
  let blogs: any[] = [];
  try {
    if (fs.existsSync(tempBlogsPath)) {
      const data = fs.readFileSync(tempBlogsPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        blogs = parsed;
      }
    } else if (fs.existsSync(rootBlogsPath)) {
      const data = fs.readFileSync(rootBlogsPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        blogs = parsed;
      }
    }
  } catch {}

  const deletedSet = getDeletedSet();
  blogs = blogs.filter((b: any) => {
    if (!b || (!b.id && !b.slug)) return false;
    const bId = String(b.id || '').trim().toLowerCase();
    const bSlug = String(b.slug || '').trim().toLowerCase();
    const bDecodedSlug = decodeURIComponent(bSlug);

    if (deletedSet.has(bId) || deletedSet.has(bSlug) || deletedSet.has(bDecodedSlug)) {
      return false;
    }
    return true;
  });

  blogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return blogs;
}

function persistBlogs(blogs: any[]) {
  const json = JSON.stringify(blogs, null, 2);
  try { fs.writeFileSync(rootBlogsPath, json); } catch {}
  try { fs.writeFileSync(tempBlogsPath, json); } catch {}
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const blogs = getBlogsList();
      return res.status(200).json(blogs);
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to fetch blogs', details: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let payload = req.body;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {}
      }

      const itemsToSave: any[] = Array.isArray(payload) ? payload : [payload];
      let blogs = getBlogsList();
      const now = new Date().toISOString();

      itemsToSave.forEach(blog => {
        if (!blog || !blog.title) return;

        const rawTitle = String(blog.title).trim();
        const slug = blog.slug && String(blog.slug).trim()
          ? String(blog.slug).trim()
          : rawTitle.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || ('post-' + Date.now().toString(36));

        const decodedSlug = decodeURIComponent(slug).toLowerCase();
        const cleanId = String(blog.id || '').trim();

        // If this post was previously in deleted list, remove it
        unrecordDeleted([cleanId, slug, decodedSlug]);

        const index = blogs.findIndex((b: any) => {
          const bId = String(b.id || '').trim();
          const bSlug = String(b.slug || '').trim();
          const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();
          return (cleanId && bId && cleanId === bId) ||
                 (slug && bSlug && slug === bSlug) ||
                 (decodedSlug && bDecodedSlug && decodedSlug === bDecodedSlug);
        });

        if (index !== -1) {
          blogs[index] = {
            ...blogs[index],
            ...blog,
            slug,
            updatedAt: now,
          };
        } else {
          blogs.unshift({
            ...blog,
            id: cleanId || ('post-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
            slug,
            createdAt: blog.createdAt || now,
            updatedAt: now,
          });
        }
      });

      persistBlogs(blogs);
      return res.status(200).json({ success: true, blogs });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to save blog', details: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      let id = req.query?.id || req.body?.id;
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          id = id || parsed.id;
        } catch {}
      }
      if (!id && req.url) {
        const cleanUrl = req.url.split('?')[0];
        const segments = cleanUrl.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last !== 'blogs') {
          id = last;
        }
      }

      if (!id) {
        return res.status(400).json({ error: 'Missing blog id' });
      }

      const target = String(id).trim().toLowerCase();
      const decoded = decodeURIComponent(target).toLowerCase();

      // Permanently mark as deleted
      recordDeleted([target, decoded]);

      let blogs = getBlogsList();
      blogs = blogs.filter((b: any) => {
        const bId = String(b.id || '').trim().toLowerCase();
        const bSlug = String(b.slug || '').trim().toLowerCase();
        const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();

        return bId !== target &&
               bId !== decoded &&
               bSlug !== target &&
               bSlug !== decoded &&
               bDecodedSlug !== target &&
               bDecodedSlug !== decoded;
      });

      persistBlogs(blogs);
      return res.status(200).json({ success: true, blogs });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to delete blog', details: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
