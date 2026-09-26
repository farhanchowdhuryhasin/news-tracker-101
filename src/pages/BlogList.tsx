import React from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function BlogList() {
  const { blogs, loading } = useBlog();
  const { config } = useSiteConfig();

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const blogCollectionSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://www.worldnewstracker.online/blog#blog",
    "name": `${config.siteName || 'worldnewstracker.online'} - News & Editorial Analysis`,
    "description": "Read our latest updates, news analysis, and global intelligence reports.",
    "url": "https://www.worldnewstracker.online/blog",
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": config.siteName || "worldnewstracker.online",
      "url": "https://www.worldnewstracker.online/",
    },
    "blogPost": blogs.slice(0, 10).map((b) => ({
      "@type": "BlogPosting",
      "headline": b.title,
      "url": `https://www.worldnewstracker.online/blog/${encodeURIComponent(b.slug || b.id)}`,
      "datePublished": b.createdAt,
      "author": {
        "@type": "Person",
        "name": b.author || "worldnewstracker.online Editorial Team"
      }
    }))
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <SEOHead 
        title={`News & Analysis Blog - ${config.siteName || 'worldnewstracker.online'}`}
        description="Read in-depth editorial reports, real-time investigative analyses, and breaking world updates."
        canonicalPath="/blog"
        type="website"
        jsonLd={blogCollectionSchema}
      />
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">Our Blog</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
            Stay informed with the latest insights, in-depth analysis, and updates from the world of news.
          </p>
        </header>

        {loading && blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4"></div>
            <p>Loading our latest stories...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100 shadow-sm">
            <p className="text-neutral-400 italic">No blog posts published yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => {
              const coverImg = blog.coverImage && blog.coverImage.trim() 
                ? blog.coverImage.trim() 
                : ((blog as any).imageUrl && (blog as any).imageUrl.trim() 
                    ? (blog as any).imageUrl.trim() 
                    : (blog.content ? (blog.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || '') : ''));

              return (
                <motion.article
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  <Link to={`/blog/${blog.slug}`} className="block aspect-[16/10] overflow-hidden bg-neutral-100 relative">
                    {coverImg ? (
                      <img 
                        src={coverImg} 
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Calendar className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-neutral-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {blog.category}
                      </span>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center space-x-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h2>
                    <p className="text-neutral-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                      {blog.excerpt || stripHtml(blog.content).substring(0, 150) + '...'}
                    </p>
                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="inline-flex items-center text-sm font-bold text-neutral-900 hover:gap-2 transition-all"
                    >
                      Read Story
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
