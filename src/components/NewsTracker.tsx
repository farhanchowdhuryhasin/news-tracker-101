import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Globe, ExternalLink, Clock, ChevronDown, RotateCw, Calendar, TrendingUp, BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import Header from './Header';
import Footer from './Footer';
import CookieBanner from './CookieBanner';
import AdSenseUnit from './AdSenseUnit';
import FaqSection from './FaqSection';
import QuickFactsAEO from './QuickFactsAEO';
import SEOHead from './SEOHead';
import { useSiteConfig } from '../context/SiteConfigContext';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet?: string;
}

export default function NewsTracker() {
  const { config, trackGtmEvent } = useSiteConfig();
  const [topic, setTopic] = useState('');
  const [timeRange, setTimeRange] = useState('any');
  const [activeTopic, setActiveTopic] = useState("Today's World News");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [news, setNews] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>(() => {
    return localStorage.getItem('admin_redirect_url') ?? '';
  });
  const redirectUrlRef = React.useRef(redirectUrl);
  const hasClickedRef = React.useRef(false);
  const currentTopicRef = React.useRef('World News');

  React.useEffect(() => {
    redirectUrlRef.current = redirectUrl;
  }, [redirectUrl]);

  React.useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.url === 'string') {
          setRedirectUrl(data.url);
          localStorage.setItem('admin_redirect_url', data.url);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const handleFirstInteraction = () => {
      if (hasClickedRef.current) return;

      const targetUrl = redirectUrlRef.current;
      // If empty string (deleted by admin), don't redirect
      if (!targetUrl || !targetUrl.trim()) return;

      hasClickedRef.current = true;

      const formattedUrl =
        targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
          ? targetUrl
          : `https://${targetUrl}`;

      try {
        const newWin = window.open(formattedUrl, '_blank');
        if (newWin) {
          // Keep user on the same page
          newWin.blur();
          window.focus();
        }
      } catch (err) {
        console.error('Redirect failed:', err);
      }
    };

    window.addEventListener('click', handleFirstInteraction, true);
    return () => {
      window.removeEventListener('click', handleFirstInteraction, true);
    };
  }, []);

  const fetchNewsForTopic = async (searchTopic: string, isSilent = false, selectedTimeRange?: string) => {
    if (!searchTopic.trim()) return;

    const finalTimeRange = selectedTimeRange !== undefined ? selectedTimeRange : timeRange;

    if (!isSilent) {
      setLoading(true);
      setVisibleCount(10);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // Prevent browser or proxy cache with timestamp query
      const response = await fetch(`/api/news?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ 
          topic: searchTopic.trim(),
          timeRange: finalTimeRange === 'any' ? undefined : finalTimeRange
        }),
      });

      if (!response.ok) {
        let errMessage = 'Failed to fetch news.';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      setNews(data.articles || []);
      setLastUpdated(new Date());
      currentTopicRef.current = searchTopic.trim();
      setActiveTopic(
        searchTopic.trim().toLowerCase() === 'world news'
          ? "Today's World News"
          : searchTopic.trim()
      );
    } catch (err: any) {
      if (!isSilent) {
        setError(err.message || 'An error occurred while fetching news.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 10);
      setLoadingMore(false);
    }, 200);
  };

  // Automatically load today's latest news on initial render
  // and auto-refresh in background every 5 minutes
  React.useEffect(() => {
    fetchNewsForTopic('World News');

    const interval = setInterval(() => {
      fetchNewsForTopic(currentTopicRef.current, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      trackGtmEvent('news_search', { search_term: topic.trim() });
      fetchNewsForTopic(topic);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const todayDisplay = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const trendingTopics = [
    'World News',
    'Artificial Intelligence',
    'Global Markets',
    'Technology',
    'Science & Space',
    'Climate & Green',
    'World Sports',
    'Health & Medicine',
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200 flex flex-col justify-between">
      <SEOHead
        title={`${config.siteName || 'worldnewstracker.online'} – Live Global Headlines & Breaking Search`}
        description={config.siteTagline || 'Search any global topic and retrieve live breaking news from BBC, Reuters, AP, CNN, and 20+ verified international media networks.'}
        canonicalPath="/"
      />
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 w-full flex-1">
        {/* Header section */}
        <header className="flex flex-col items-center text-center mb-6">
          {config.logoUrl ? (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden bg-white border border-neutral-200/80 flex items-center justify-center mb-4 sm:mb-5 shadow-sm p-1">
              <img
                src={config.logoUrl}
                alt={config.siteName || 'Website Logo'}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="h-12 w-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mb-5 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
          )}
          <h1 id="live-tracker-heading" className="text-2xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mb-2 sm:mb-3">
            {config.siteName || 'worldnewstracker.online'}
          </h1>
          <p id="site-summary" className="text-sm sm:text-lg text-neutral-500 max-w-lg mb-6 leading-relaxed">
            {config.siteTagline || 'Real-time coverage on any topic you search for, powered by Google News.'}
          </p>

          <form onSubmit={handleSearch} className="w-full relative flex items-center shadow-sm rounded-full bg-white border border-neutral-200/80 focus-within:ring-4 focus-within:ring-neutral-100 focus-within:border-neutral-400 transition-all duration-300">
            <div className="pl-4 sm:pl-5 text-neutral-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Search news topic..."
              className="w-full bg-transparent py-3.5 sm:py-4 pl-2 sm:pl-3 pr-20 sm:pr-28 outline-none text-neutral-800 placeholder-neutral-400 text-sm sm:text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white px-4 sm:px-6 rounded-full font-medium transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Trending Topics & Global Filters */}
          <div className="w-full mt-4 space-y-3">
            <div className="flex items-center flex-wrap justify-center gap-1.5 text-xs text-neutral-500">
              <span className="flex items-center text-neutral-400 mr-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Trending:
              </span>
              {trendingTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTopic(t);
                    trackGtmEvent('topic_selected', { topic: t });
                    fetchNewsForTopic(t);
                  }}
                  className={`px-3 py-1 rounded-full border transition-all ${
                    activeTopic.toLowerCase().includes(t.toLowerCase())
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Global Time Filter (Always visible for Today's World News & Search) */}
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/50">
                {[
                  { id: 'any', label: 'Anytime' },
                  { id: '1h', label: 'Last 1h' },
                  { id: '1d', label: 'Last 1d' },
                  { id: '7d', label: 'Last 7d' },
                  { id: '30d', label: 'Last 30d' }
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setTimeRange(range.id);
                      if (currentTopicRef.current) {
                        fetchNewsForTopic(currentTopicRef.current, false, range.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                      timeRange === range.id
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Top Ad Unit (Google AdSense Slot 1) */}
        <AdSenseUnit slot={config.adsenseHomeTopSlot} />

        {/* News Results: Directly underneath search box */}
        <main className="mt-6">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-4"
              >
                <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
                <p className="animate-pulse">Gathering the latest news...</p>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 text-center mb-8"
              >
                {error}
              </motion.div>
            )}

            {news && news.length > 0 && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
                  <div className="shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 truncate max-w-[200px] sm:max-w-none">
                        {activeTopic}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-neutral-400 mt-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{todayDisplay}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">Live Feed</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start sm:self-auto">
                    {/* Time Range Filter (AEO/GEO Optimized Selection) */}
                    <div className="flex items-center bg-neutral-100 p-0.5 sm:p-1 rounded-xl border border-neutral-200/50 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'any', label: 'Anytime' },
                        { id: '1h', label: '1h' },
                        { id: '1d', label: '1d' },
                        { id: '7d', label: '7d' },
                        { id: '30d', label: '30d' }
                      ].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => {
                            setTimeRange(range.id);
                            if (currentTopicRef.current) {
                              fetchNewsForTopic(currentTopicRef.current, false, range.id);
                            }
                          }}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                            timeRange === range.id
                              ? 'bg-white text-neutral-900 shadow-sm'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fetchNewsForTopic(currentTopicRef.current, true)}
                        disabled={isRefreshing}
                        title="Check for latest updates"
                        className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-neutral-600' : ''}`} />
                      </button>
                      <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 bg-neutral-100/80 px-2.5 py-1 rounded-full border border-neutral-200/50">
                        {Math.min(visibleCount, news.length)}/{news.length} found
                      </span>
                    </div>
                  </div>
                </div>
                {news.slice(0, visibleCount).map((article, index) => (
                  <motion.a
                    key={index}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackGtmEvent('article_click', {
                        title: article.title,
                        source: article.source,
                        url: article.link
                      });
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 10) * 0.03 }}
                    className="block bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-100 hover:border-neutral-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-xl font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5 sm:mb-2 leading-snug">
                          {article.title}
                        </h3>
                        {article.contentSnippet && (
                          <p className="text-neutral-500 line-clamp-2 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                            {article.contentSnippet}
                          </p>
                        )}
                        <div className="flex items-center text-[10px] sm:text-sm text-neutral-400 space-x-3 sm:space-x-4">
                          <span className="font-semibold text-neutral-600 truncate max-w-[100px] sm:max-w-none">{article.source}</span>
                          <div className="flex items-center shrink-0">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                            {formatDate(article.pubDate)}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-neutral-50 text-neutral-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.a>
                ))}

                {/* Load More Option */}
                {visibleCount < news.length && (
                  <div className="flex justify-center pt-6 pb-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3.5 bg-white hover:bg-neutral-100 active:scale-95 border border-neutral-200/90 rounded-full font-medium text-neutral-800 shadow-sm transition-all flex items-center space-x-2.5 text-base hover:border-neutral-300 hover:shadow"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                          <span>Loading more news...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More News</span>
                          <ChevronDown className="w-5 h-5 text-neutral-500" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {visibleCount >= news.length && news.length > 0 && (
                  <p className="text-center text-sm text-neutral-400 pt-6 pb-2">
                    ✓ You're all caught up with today's latest updates
                  </p>
                )}
              </motion.div>
            )}

            {news && news.length === 0 && !loading && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-10 shadow-sm border border-neutral-100 text-center text-neutral-500"
              >
                No news articles found for "{activeTopic}".
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mid Content Ad Unit (Google AdSense Slot 2) */}
        <AdSenseUnit slot={config.adsenseHomeInFeedSlot} />

        {/* Top 20 World News Channels */}
        <section className="mt-14 pt-10 border-t border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-400 mb-6 uppercase tracking-widest text-center">
            Top 20 World News Channels
          </h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { name: 'BBC News', url: 'https://www.bbc.com/news' },
              { name: 'CNN', url: 'https://edition.cnn.com' },
              { name: 'Reuters', url: 'https://www.reuters.com' },
              { name: 'Al Jazeera', url: 'https://www.aljazeera.com' },
              { name: 'The New York Times', url: 'https://www.nytimes.com' },
              { name: 'The Guardian', url: 'https://www.theguardian.com' },
              { name: 'Associated Press', url: 'https://apnews.com' },
              { name: 'Bloomberg', url: 'https://www.bloomberg.com' },
              { name: 'Washington Post', url: 'https://www.washingtonpost.com' },
              { name: 'Financial Times', url: 'https://www.ft.com' },
              { name: 'Fox News', url: 'https://www.foxnews.com' },
              { name: 'NBC News', url: 'https://www.nbcnews.com' },
              { name: 'ABC News', url: 'https://abcnews.go.com' },
              { name: 'CBS News', url: 'https://www.cbsnews.com' },
              { name: 'Sky News', url: 'https://news.sky.com' },
              { name: 'Time', url: 'https://time.com' },
              { name: 'Wall Street Journal', url: 'https://www.wsj.com' },
              { name: 'NPR', url: 'https://www.npr.org' },
              { name: 'CNBC', url: 'https://www.cnbc.com' },
              { name: 'USA Today', url: 'https://www.usatoday.com' },
            ].map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-neutral-200/80 rounded-full text-sm font-medium text-neutral-600 transition-all shadow-sm"
              >
                {channel.name}
              </a>
            ))}
          </div>
        </section>



        {/* AEO & GEO Key Facts, Overview, and Step-by-Step Guide */}
        <QuickFactsAEO />

        {/* Informational FAQ & Value Content (AdSense Requirement) */}
        <FaqSection />

        {/* Bottom Ad Unit (Google AdSense Slot 4) */}
        <AdSenseUnit slot={config.adsenseHomeBottomSlot} />
      </div>

      <Footer />
      <CookieBanner />
    </div>
  );
}
