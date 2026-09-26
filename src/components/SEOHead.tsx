import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  type?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  jsonLd?: Record<string, any>;
}

const DEFAULT_TITLE = 'worldnewstracker.online – Real-Time Global Headlines';
const DEFAULT_DESC =
  'Search any global topic and retrieve live breaking news from BBC, Reuters, AP, CNN, and 20+ verified international media networks at worldnewstracker.online.';
const DEFAULT_IMAGE = 'https://www.worldnewstracker.online/icons/icon-512.png';

export default function SEOHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonicalPath,
  type = 'website',
  image = DEFAULT_IMAGE,
  author,
  publishedTime,
  modifiedTime,
  section,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();
  const { config, trackGtmEvent } = useSiteConfig();
  const currentPath = canonicalPath || location.pathname;
  const canonicalUrl = `https://www.worldnewstracker.online${currentPath === '/' ? '' : currentPath}`;

  useEffect(() => {
    // 1. Update document title
    document.title = title;

    // 2. Helper to set or create meta tags
    const updateMeta = (nameOrProperty: string, value: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${nameOrProperty}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, nameOrProperty);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    };

    // Standard SEO
    updateMeta('description', description);
    updateMeta('title', title);

    // Google Search Console Site Verification Meta Tag
    if (config.googleSearchConsoleVerificationCode) {
      let gscToken = config.googleSearchConsoleVerificationCode.trim();
      const match = gscToken.match(/content=["']([^"']+)["']/i);
      if (match && match[1]) {
        gscToken = match[1];
      }
      if (gscToken) {
        updateMeta('google-site-verification', gscToken);
      }
    }

    // Bing Webmaster Verification Meta Tag
    if (config.bingWebmasterVerificationCode) {
      let bingToken = config.bingWebmasterVerificationCode.trim();
      const match = bingToken.match(/content=["']([^"']+)["']/i);
      if (match && match[1]) {
        bingToken = match[1];
      }
      if (bingToken) {
        updateMeta('msvalidate.01', bingToken);
      }
    }

    // OpenGraph (SEO / Social)
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('og:type', type, true);
    if (image) {
      updateMeta('og:image', image, true);
    }
    if (publishedTime) {
      updateMeta('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMeta('article:modified_time', modifiedTime, true);
    }
    if (author) {
      updateMeta('article:author', author, true);
    }
    if (section) {
      updateMeta('article:section', section, true);
    }

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:url', canonicalUrl);
    if (image) {
      updateMeta('twitter:image', image);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('id', 'canonical-link');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Dynamic JSON-LD structured data injection for Google Rich Results
    let jsonLdScript = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-page-schema';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    // GTM Page View Tracking
    trackGtmEvent('page_view', {
      page_title: title,
      page_location: canonicalUrl,
      page_path: currentPath,
    });

    return () => {
      // Clean up dynamic schema on route leave
      const activeSchema = document.getElementById('dynamic-page-schema');
      if (activeSchema) {
        activeSchema.remove();
      }
    };
  }, [
    title,
    description,
    canonicalUrl,
    type,
    image,
    author,
    publishedTime,
    modifiedTime,
    section,
    jsonLd,
    config.googleSearchConsoleVerificationCode,
    config.bingWebmasterVerificationCode,
    currentPath,
  ]);

  return null;
}
