import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { BlogPost } from '../types';

interface BlogContextType {
  blogs: BlogPost[];
  loading: boolean;
  addOrUpdateBlog: (blog: Partial<BlogPost>) => Promise<boolean>;
  deleteBlog: (id: string) => Promise<boolean>;
  refreshBlogs: () => Promise<void>;
  getBlogBySlug: (slug: string) => BlogPost | undefined;
}

const STORAGE_KEY_CUSTOM_BLOGS = 'news_tracker_custom_blogs';
const STORAGE_KEY_PERMANENT_BACKUP = 'news_tracker_permanent_blogs_backup';
const STORAGE_KEY_DELETED_IDS = 'news_tracker_deleted_blog_ids';

function getDeletedIds(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item) {
            const str = String(item).trim().toLowerCase();
            set.add(str);
            set.add(decodeURIComponent(str));
          }
        });
      }
    }
  } catch {}
  return set;
}

function saveDeletedIds(ids: string[]) {
  const existing = getDeletedIds();
  ids.forEach(id => {
    if (id) {
      const str = String(id).trim().toLowerCase();
      existing.add(str);
      existing.add(decodeURIComponent(str));
    }
  });
  try {
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(existing)));
  } catch {}
}

function removeDeletedId(id: string) {
  const existing = getDeletedIds();
  const str = String(id).trim().toLowerCase();
  existing.delete(str);
  existing.delete(decodeURIComponent(str));
  try {
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(existing)));
  } catch {}
}

function isBlogDeleted(b: any, deletedSet: Set<string>): boolean {
  if (!b) return true;
  const bId = String(b.id || '').trim().toLowerCase();
  const bSlug = String(b.slug || '').trim().toLowerCase();
  const bDecodedSlug = decodeURIComponent(bSlug);

  if (deletedSet.has(bId) || deletedSet.has(bSlug) || deletedSet.has(bDecodedSlug)) {
    return true;
  }
  return false;
}

function getStoredBlogs(): BlogPost[] {
  const deletedSet = getDeletedIds();
  const map = new Map<string, BlogPost>();

  const collect = (raw: string | null) => {
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((b: any) => {
          if (b && (b.id || b.slug) && !isBlogDeleted(b, deletedSet)) {
            const key = String(b.id || b.slug).trim().toLowerCase();
            if (!map.has(key)) map.set(key, b);
          }
        });
      }
    } catch {}
  };

  collect(localStorage.getItem(STORAGE_KEY_CUSTOM_BLOGS));
  collect(localStorage.getItem(STORAGE_KEY_PERMANENT_BACKUP));

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return list;
}

function persistAllLocal(blogs: BlogPost[]) {
  try {
    const json = JSON.stringify(blogs);
    localStorage.setItem(STORAGE_KEY_CUSTOM_BLOGS, json);
    localStorage.setItem(STORAGE_KEY_PERMANENT_BACKUP, json);
  } catch {}
}

const BlogContext = createContext<BlogContextType>({
  blogs: [],
  loading: true,
  addOrUpdateBlog: async () => false,
  deleteBlog: async () => false,
  refreshBlogs: async () => {},
  getBlogBySlug: () => undefined,
});

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    return getStoredBlogs();
  });

  const [loading, setLoading] = useState(true);
  const blogsRef = useRef<BlogPost[]>(blogs);
  blogsRef.current = blogs;

  // Real-time Firestore sync & initial load
  const refreshBlogs = useCallback(async () => {
    try {
      const deletedSet = getDeletedIds();
      const combinedMap = new Map<string, BlogPost>();

      // 0. Seed with existing memory & local storage so no items are ever lost
      blogsRef.current.forEach(b => {
        if (!isBlogDeleted(b, deletedSet)) {
          const key = String(b.id || b.slug).trim().toLowerCase();
          combinedMap.set(key, b);
        }
      });
      getStoredBlogs().forEach(b => {
        if (!isBlogDeleted(b, deletedSet)) {
          const key = String(b.id || b.slug).trim().toLowerCase();
          if (!combinedMap.has(key)) combinedMap.set(key, b);
        }
      });

      // 1. Primary: Load from Cloud Firestore Database
      const firestoreBlogs: BlogPost[] = [];
      try {
        const snap = await getDocs(collection(db, 'blogs'));
        if (!snap.empty) {
          snap.forEach(docSnap => {
            const data = docSnap.data() as BlogPost;
            if (data && (data.id || data.slug || data.title) && !isBlogDeleted(data, deletedSet)) {
              const item: BlogPost = {
                ...data,
                id: data.id || docSnap.id,
              };
              firestoreBlogs.push(item);
              const key = String(item.id || item.slug).trim().toLowerCase();
              combinedMap.set(key, item);
            }
          });
        }
      } catch (firestoreErr: any) {
        console.warn('Firestore fetch failed, checking server API:', firestoreErr);
      }

      // 2. Secondary: Load from Server API
      try {
        const res = await fetch(`/api/blogs?_t=${Date.now()}`);
        if (res.ok) {
          const serverList = await res.json();
          if (Array.isArray(serverList)) {
            serverList.forEach((b: BlogPost) => {
              if (b && (b.id || b.slug || b.title) && !isBlogDeleted(b, deletedSet)) {
                const key = String(b.id || b.slug).trim().toLowerCase();
                if (!combinedMap.has(key)) {
                  combinedMap.set(key, b);
                  // Push server-only post to Firestore to guarantee database permanence
                  try {
                    const docId = String(b.id || b.slug);
                    if (docId) {
                      setDoc(doc(db, 'blogs', docId), b, { merge: true }).catch(() => {});
                    }
                  } catch {}
                }
              }
            });
          }
        }
      } catch (serverErr) {
        console.warn('Server blog sync fallback error:', serverErr);
      }

      const mergedList = Array.from(combinedMap.values());
      mergedList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (mergedList.length > 0) {
        setBlogs(mergedList);
        persistAllLocal(mergedList);
      }
    } catch (err) {
      console.warn('Blog sync failed, fallback to local storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time Firestore Listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(collection(db, 'blogs'), (snapshot) => {
        const deletedSet = getDeletedIds();
        const map = new Map<string, BlogPost>();

        // Keep existing memory items
        blogsRef.current.forEach(b => {
          if (!isBlogDeleted(b, deletedSet)) {
            const key = String(b.id || b.slug).trim().toLowerCase();
            map.set(key, b);
          }
        });

        // Overlay Firestore snapshot
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as BlogPost;
          if (data && (data.id || data.slug || data.title) && !isBlogDeleted(data, deletedSet)) {
            const item: BlogPost = {
              ...data,
              id: data.id || docSnap.id,
            };
            const key = String(item.id || item.slug).trim().toLowerCase();
            map.set(key, item);
          }
        });

        const updated = Array.from(map.values());
        updated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (updated.length > 0) {
          setBlogs(updated);
          persistAllLocal(updated);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firestore onSnapshot listener error:', error);
        handleFirestoreError(error, OperationType.GET, 'blogs');
      });
    } catch (e) {
      console.warn('Could not establish Firestore onSnapshot listener:', e);
    }

    refreshBlogs();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [refreshBlogs]);

  const addOrUpdateBlog = async (blog: Partial<BlogPost>): Promise<boolean> => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const rawTitle = String(blog.title || 'Untitled').trim();
      
      let slug = (blog.slug && String(blog.slug).trim()) ? String(blog.slug).trim() : '';
      if (!slug) {
        slug = rawTitle
          .toLowerCase()
          .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '') || ('post-' + Date.now().toString(36));
      }

      const cleanId = String(blog.id || ('post-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6))).trim();

      // Remove from deleted registry if it's being added or updated
      removeDeletedId(cleanId);
      removeDeletedId(slug);

      const fullBlog: BlogPost = {
        id: cleanId,
        title: rawTitle,
        slug,
        content: blog.content ? String(blog.content) : '',
        excerpt: blog.excerpt ? String(blog.excerpt) : (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160).trim() : ''),
        coverImage: blog.coverImage ? String(blog.coverImage) : '',
        category: blog.category ? String(blog.category) : 'General',
        author: blog.author ? String(blog.author) : 'Admin',
        createdAt: blog.createdAt || now,
        updatedAt: now,
      };

      // 1. Instantly update React state & local backup
      setBlogs(prev => {
        const next = [fullBlog, ...prev.filter(b => b.id !== cleanId && b.slug !== slug)];
        persistAllLocal(next);
        return next;
      });

      // 2. Persist to Cloud Firestore Database
      const firestorePayload: Record<string, any> = {};
      Object.entries(fullBlog).forEach(([key, val]) => {
        if (val !== undefined) {
          firestorePayload[key] = val;
        }
      });

      try {
        await setDoc(doc(db, 'blogs', cleanId), firestorePayload, { merge: true });
      } catch (firestoreErr: any) {
        console.warn('Firestore blog save error:', firestoreErr);
        if (firestoreErr?.message?.toLowerCase().includes('permission') || firestoreErr?.code === 'permission-denied') {
          handleFirestoreError(firestoreErr, OperationType.WRITE, `blogs/${cleanId}`);
        }
      }

      // 3. Persist to server API as secondary mirror
      try {
        await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullBlog),
        });
      } catch (err) {
        console.warn('Server blog save mirror notice:', err);
      }

      return true;
    } catch (e) {
      console.error('Failed to save blog:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const cleanId = String(id).trim().toLowerCase();
      const decodedId = decodeURIComponent(cleanId);

      // 1. Permanently record into deleted registry
      saveDeletedIds([cleanId, decodedId]);

      // 2. Immediately remove from state and local storage
      setBlogs(prev => {
        const filtered = prev.filter(b => {
          const bId = String(b.id || '').trim().toLowerCase();
          const bSlug = String(b.slug || '').trim().toLowerCase();
          const bDecodedSlug = decodeURIComponent(bSlug);

          return bId !== cleanId &&
                 bId !== decodedId &&
                 bSlug !== cleanId &&
                 bSlug !== decodedId &&
                 bDecodedSlug !== cleanId &&
                 bDecodedSlug !== decodedId;
        });
        persistAllLocal(filtered);
        return filtered;
      });

      // 3. Delete permanently from Cloud Firestore Database
      try {
        await deleteDoc(doc(db, 'blogs', cleanId));
        const delDocRef = doc(db, 'system', 'deleted_blogs');
        const delSnap = await getDoc(delDocRef);
        const existingList = delSnap.exists() ? (delSnap.data().deletedIds || []) : [];
        await setDoc(delDocRef, {
          deletedIds: Array.from(new Set([...existingList, cleanId, decodedId])),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr: any) {
        console.warn('Firestore blog delete error:', firestoreErr);
        if (firestoreErr?.message?.toLowerCase().includes('permission') || firestoreErr?.code === 'permission-denied') {
          handleFirestoreError(firestoreErr, OperationType.DELETE, `blogs/${cleanId}`);
        }
      }

      // 4. Notify Server API
      try {
        await fetch(`/api/blogs/${encodeURIComponent(cleanId)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Server blog delete mirror notice:', err);
      }

      return true;
    } catch (e) {
      console.error('Failed to delete blog:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBlogBySlug = (slug: string): BlogPost | undefined => {
    if (!slug) return undefined;
    const cleanSlug = slug.toLowerCase().trim();
    const decodedSlug = decodeURIComponent(cleanSlug);
    return blogs.find(
      b => (b.slug && (b.slug.toLowerCase().trim() === cleanSlug || b.slug.toLowerCase().trim() === decodedSlug)) ||
           (b.id && (b.id.toLowerCase().trim() === cleanSlug || b.id.toLowerCase().trim() === decodedSlug))
    );
  };

  return (
    <BlogContext.Provider
      value={{
        blogs,
        loading,
        addOrUpdateBlog,
        deleteBlog,
        refreshBlogs,
        getBlogBySlug,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}
