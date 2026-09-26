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

  let id = Array.isArray(req.query?.id) ? req.query.id[0] : (req.query?.id || req.body?.id);
  if (!id && req.url) {
    const cleanUrl = req.url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last !== 'blogs') {
      id = last;
    }
  }

  const target = String(id || '').trim().toLowerCase();
  const decodedTarget = decodeURIComponent(target).toLowerCase();

  const deletedSet = getDeletedSet();
  if (deletedSet.has(target) || deletedSet.has(decodedTarget)) {
    if (req.method === 'GET') {
      return res.status(404).json({ error: 'Blog not found' });
    }
  }

  if (req.method === 'GET') {
    const blogs = getBlogsList();
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

    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    return res.status(200).json(blog);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing blog id' });

    recordDeleted([target, decodedTarget]);

    let blogs = getBlogsList();
    blogs = blogs.filter((b: any) => {
      const bId = String(b.id || '').trim().toLowerCase();
      const bSlug = String(b.slug || '').trim().toLowerCase();
      const bDecodedSlug = decodeURIComponent(bSlug).toLowerCase();

      return bId !== target &&
             bId !== decodedTarget &&
             bSlug !== target &&
             bSlug !== decodedTarget &&
             bDecodedSlug !== target &&
             bDecodedSlug !== decodedTarget;
    });

    persistBlogs(blogs);
    return res.status(200).json({ success: true, blogs });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
