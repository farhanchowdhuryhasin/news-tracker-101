import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { formatWordPressHtml } from '../utils/formatContent';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function PrivacyPolicy() {
  const { config } = useSiteConfig();

  if (config.privacyPublished === false) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col justify-between">
        <Header />
        <main className="max-w-md mx-auto px-6 py-24 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center text-neutral-500 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Page Unpublished</h1>
          <p className="text-sm text-neutral-500 mb-6">This page is currently unpublished by the administrator and is not available.</p>
          <Link to="/" className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all">
            Return to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const hasContent = Boolean(config.privacyContent && config.privacyContent.trim());

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col justify-between">
      <SEOHead
        title={`Privacy Policy – ${config.siteName}`}
        description={`Privacy Policy for ${config.siteName}.`}
        canonicalPath="/privacy-policy"
      />
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to Live News Tracker
        </Link>

        <article className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden mb-12">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white px-8 sm:px-12 py-10">
            <div className="flex items-center space-x-3 mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                Legal & Compliance
              </span>
              <span className="text-neutral-400 text-xs">•</span>
              <span className="text-neutral-300 text-xs font-medium">Published on {config.siteName}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Privacy Policy</h1>
            <p className="text-neutral-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Official Privacy Policy document for {config.siteName}.
            </p>
          </div>

          {/* Post Body */}
          <div className="p-8 sm:p-12 prose prose-neutral sm:prose-lg max-w-none w-full break-words text-neutral-700 leading-relaxed [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-neutral-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-neutral-100 [&>h2]:pb-2 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-neutral-900 [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>li]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-neutral-600 [&>a]:text-blue-600 [&>a]:underline">
            {hasContent ? (
              <div dangerouslySetInnerHTML={{ __html: formatWordPressHtml(config.privacyContent || '') }} />
            ) : (
              <div className="text-center py-16 px-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <ShieldCheck className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-neutral-800 mb-1">No Content Published Yet</h3>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  The Privacy Policy for this website has not been published by the administrator yet.
                </p>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
