import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { BlogPost as BlogPostType } from '../types';
import { Clock, Calendar, ArrowLeft, User, Share2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function BlogPost() {
  const { slug } = useParams();
  const { getBlogBySlug, loading: contextLoading, refreshBlogs } = useBlog();
  const { config } = useSiteConfig();

  const [directBlog, setDirectBlog] = useState<BlogPostType | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // 1. First attempt: match from context
  const contextBlog = getBlogBySlug(slug || '');

  // 2. Fallback: if not in context, check localStorage directly or fetch from API / Firestore
  useEffect(() => {
    if (contextBlog) {
      setDirectBlog(contextBlog);
      return;
    }

    if (!slug) return;

    const clean = slug.trim().toLowerCase();
    const decoded = decodeURIComponent(clean);

    // Check localStorage directly for immediate recovery
    try {
      const keys = ['news_tracker_custom_blogs', 'news_tracker_permanent_blogs_backup'];

      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const found = arr.find((b: any) => {
              const bSlug = String(b.slug || '').trim().toLowerCase();
              const bDecodedSlug = decodeURIComponent(bSlug);
              const bId = String(b.id || '').trim().toLowerCase();
              return bSlug === clean || bDecodedSlug === clean || bSlug === decoded || bId === clean;
            });
            if (found) {
              setDirectBlog(found);
              return;
            }
          }
        }
      }
    } catch {}

    // Fetch directly from server endpoint & Cloud Firestore
    let isMounted = true;
    setDirectLoading(true);

    const fetchDirect = async () => {
      try {
        // Attempt 1: Fetch from Server endpoint
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title && isMounted) {
            setDirectBlog(data);
            return;
          }
        }

        // Attempt 2: Fetch list and search
        const listRes = await fetch(`/api/blogs?_t=${Date.now()}`);
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list)) {
            const found = list.find((b: any) => {
              const bSlug = String(b.slug || '').trim().toLowerCase();
              const bDecodedSlug = decodeURIComponent(bSlug);
              const bId = String(b.id || '').trim().toLowerCase();
              return bSlug === clean || bDecodedSlug === clean || bSlug === decoded || bId === clean;
            });
            if (found && isMounted) {
              setDirectBlog(found);
              return;
            }
          }
        }

        // Attempt 3: Query Cloud Firestore directly
        try {
          const snap = await getDocs(collection(db, 'blogs'));
          if (!snap.empty) {
            for (const docSnap of snap.docs) {
              const data = docSnap.data() as BlogPostType;
              const bSlug = String(data.slug || '').trim().toLowerCase();
              const bDecodedSlug = decodeURIComponent(bSlug);
              const bId = String(data.id || docSnap.id).trim().toLowerCase();
              if (bSlug === clean || bDecodedSlug === clean || bSlug === decoded || bId === clean) {
                if (isMounted) {
                  setDirectBlog({ ...data, id: data.id || docSnap.id });
                  return;
                }
              }
            }
          }
        } catch (fsErr) {
          console.warn('Direct Firestore fetch note:', fsErr);
        }
      } catch (e) {
        console.warn('Direct blog fetch error:', e);
      } finally {
        if (isMounted) {
          setDirectLoading(false);
          setHasAttemptedFetch(true);
        }
      }
    };

    fetchDirect();

    return () => {
      isMounted = false;
    };
  }, [slug, contextBlog]);

  const blog = contextBlog || directBlog;
  const isLoading = (contextLoading && !blog) || directLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-500 font-medium text-sm">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog && hasAttemptedFetch) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Article Not Found</h1>
          <p className="text-neutral-500 mb-8 text-sm leading-relaxed">
            The requested blog post could not be located. It might have a different URL or be under review.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/blog"
              className="px-6 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-all"
            >
              Browse All Blog Posts
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-500 font-medium text-sm">Verifying story...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const coverImg = blog.coverImage && blog.coverImage.trim() 
    ? blog.coverImage.trim() 
    : ((blog as any).imageUrl && (blog as any).imageUrl.trim() 
        ? (blog as any).imageUrl.trim() 
        : (blog.content ? (blog.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || '') : ''));

  const blogCanonicalUrl = `https://www.worldnewstracker.online/blog/${encodeURIComponent(blog.slug || blog.id)}`;
  const cleanExcerpt = blog.excerpt || blog.content?.replace(/<[^>]*>?/gm, '').substring(0, 160).trim() || blog.title;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": blogCanonicalUrl,
    },
    "headline": blog.title,
    "description": cleanExcerpt,
    "image": coverImg ? [coverImg] : ["https://www.worldnewstracker.online/icons/icon-512.png"],
    "datePublished": blog.createdAt || new Date().toISOString(),
    "dateModified": blog.updatedAt || blog.createdAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": blog.author || "worldnewstracker.online Editorial Team",
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": config.siteName || "worldnewstracker.online",
      "url": "https://www.worldnewstracker.online/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.worldnewstracker.online/icons/icon-512.png",
      },
    },
    "articleSection": blog.category || "General",
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <SEOHead 
        title={`${blog.title} - ${config.siteName || 'worldnewstracker.online'}`}
        description={cleanExcerpt}
        canonicalPath={`/blog/${blog.slug || blog.id}`}
        type="article"
        image={coverImg || 'https://www.worldnewstracker.online/icons/icon-512.png'}
        author={blog.author || 'worldnewstracker.online Editorial Team'}
        publishedTime={blog.createdAt}
        modifiedTime={blog.updatedAt || blog.createdAt}
        section={blog.category || 'General'}
        jsonLd={articleJsonLd}
      />
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link 
          to="/blog" 
          className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-neutral-100 shadow-sm"
        >
          {coverImg && (
            <div className="w-full aspect-video bg-neutral-100 overflow-hidden">
              <img 
                src={coverImg} 
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="p-6 sm:p-12 lg:p-16">
            <header className="mb-10 sm:mb-16">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-900 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {blog.category || 'General'}
                </span>
                <span className="text-neutral-300">•</span>
                <div className="flex items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 mb-8 leading-[1.1] tracking-tight">
                {blog.title}
              </h1>

              <div className="flex items-center justify-between py-6 border-y border-neutral-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{blog.author || 'Editorial Team'}</p>
                    <p className="text-[10px] text-neutral-500 font-medium">News Analyst</p>
                  </div>
                </div>
                <button 
                  onClick={handleShare}
                  aria-label="Share article"
                  className="p-2.5 rounded-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div 
              className="blog-content w-full text-neutral-800 text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
            />
          </div>
        </motion.article>

        {/* Footer Navigation within Blog */}
        <div className="mt-12 flex justify-center">
           <Link to="/" className="text-sm font-bold px-8 py-4 bg-neutral-900 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
             Explore Latest World News
           </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
