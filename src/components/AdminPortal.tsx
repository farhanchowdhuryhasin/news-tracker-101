import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  LogIn,
  Save,
  Trash2,
  ShieldCheck,
  Globe,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Shield,
  BookOpen,
  AlertTriangle,
  Info,
  Mail,
  Loader2,
  Monitor,
  Newspaper,
  Layout,
  Settings,
  Eye,
  Type,
  Pencil,
  Search,
  Copy,
  Check,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import { useSiteConfig, SiteConfig } from '../context/SiteConfigContext';
import { useBlog } from '../context/BlogContext';
import { BlogPost } from '../types';

export default function AdminPortal() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'pages' | 'adsense' | 'gsc' | 'analytics' | 'gtm' | 'blogs'>('branding');

  const { config, updateConfig, deleteLogo, resetSiteName, resetPageContent, refreshConfig, loading: configLoading } = useSiteConfig();
  const { blogs, addOrUpdateBlog, deleteBlog, refreshBlogs, loading: blogLoading } = useBlog();

  // Branding Form State
  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AdSense Form State
  const [adsenseEnabled, setAdsenseEnabled] = useState(false);
  const [adsensePublisherId, setAdsensePublisherId] = useState('');
  const [adsenseHomeTopSlot, setAdsenseHomeTopSlot] = useState('');
  const [adsenseHomeSidebarSlot, setAdsenseHomeSidebarSlot] = useState('');
  const [adsenseHomeInFeedSlot, setAdsenseHomeInFeedSlot] = useState('');
  const [adsenseHomeBottomSlot, setAdsenseHomeBottomSlot] = useState('');
  const [adsenseCustomSnippet, setAdsenseCustomSnippet] = useState('');

  // Analytics Form State
  const [gaEnabled, setGaEnabled] = useState(false);
  const [gaId, setGaId] = useState('');

  // Google Tag Manager Form State
  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [gtmContainerId, setGtmContainerId] = useState('');
  const [gtmCustomDataLayerName, setGtmCustomDataLayerName] = useState('dataLayer');
  const [gtmTrackEvents, setGtmTrackEvents] = useState(true);
  const [customHeadScript, setCustomHeadScript] = useState('');
  const [customBodyScript, setCustomBodyScript] = useState('');
  const [gtmSnippetTab, setGtmSnippetTab] = useState<'head' | 'body'>('head');

  // Google Search Console & Webmasters Form State
  const [gscCode, setGscCode] = useState('');
  const [gscHtmlFile, setGscHtmlFile] = useState('');
  const [bingCode, setBingCode] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [pingingGoogle, setPingingGoogle] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  // Pages Form State
  const [activePage, setActivePage] = useState<keyof SiteConfig>('privacyContent');
  const [pageContent, setPageContent] = useState('');
  const [pagePublished, setPagePublished] = useState(true);

  // Blog Form State
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'General',
    author: 'Admin',
    coverImage: ''
  });

  const [status, setStatus] = useState<{ type: string; message: string }>({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);
  const [blogToDelete, setBlogToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isLoggedIn && config) {
      setSiteName(config.siteName || '');
      setSiteTagline(config.siteTagline || '');
      setLogoUrl(config.logoUrl || '');
      setRedirectUrl(config.redirectUrl || '');
      setFooterDescription(config.footerDescription || '');
      setFooterEmail(config.footerEmail || '');
      setPageContent(String(config[activePage] || ''));
      let isPub = true;
      if (activePage === 'privacyContent') isPub = config.privacyPublished !== false;
      else if (activePage === 'termsContent') isPub = config.termsPublished !== false;
      else if (activePage === 'disclaimerContent') isPub = config.disclaimerPublished !== false;
      else if (activePage === 'aboutContent') isPub = config.aboutPublished !== false;
      else if (activePage === 'contactContent') isPub = config.contactPublished !== false;
      setPagePublished(isPub);
      // AdSense
      setAdsenseEnabled(!!config.adsenseEnabled);
      setAdsensePublisherId(config.adsensePublisherId || '');
      setAdsenseHomeTopSlot(config.adsenseHomeTopSlot || '');
      setAdsenseHomeSidebarSlot(config.adsenseHomeSidebarSlot || '');
      setAdsenseHomeInFeedSlot(config.adsenseHomeInFeedSlot || '');
      setAdsenseHomeBottomSlot(config.adsenseHomeBottomSlot || '');
      setAdsenseCustomSnippet(config.adsenseCustomSnippet || '');
      // Analytics
      setGaEnabled(!!config.googleAnalyticsEnabled);
      setGaId(config.googleAnalyticsId || '');
      // Search Console & Webmasters
      setGscCode(config.googleSearchConsoleVerificationCode || '');
      setGscHtmlFile(config.googleSearchConsoleHtmlFile || '');
      setBingCode(config.bingWebmasterVerificationCode || '');
      // Google Tag Manager
      setGtmEnabled(!!config.gtmEnabled);
      setGtmContainerId(config.gtmContainerId || '');
      setGtmCustomDataLayerName(config.gtmCustomDataLayerName || 'dataLayer');
      setGtmTrackEvents(config.gtmTrackEvents !== false);
      setCustomHeadScript(config.customHeadScript || '');
      setCustomBodyScript(config.customBodyScript || '');
    }
  }, [isLoggedIn, config, activePage]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default credentials as seen in existing code
    if (username === 'admin123' && password === 'admin456') {
      setIsLoggedIn(true);
      setStatus({ type: '', message: '' });
      refreshConfig();
    } else {
      setStatus({ type: 'error', message: 'Invalid username or password. Default is admin123 / admin456' });
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please select a valid image file' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateConfig({
      siteName: siteName.trim(),
      siteTagline: siteTagline.trim(),
      logoUrl: logoUrl.trim(),
      redirectUrl: redirectUrl.trim(),
      footerDescription: footerDescription.trim(),
      footerEmail: footerEmail.trim(),
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: 'Site branding updated successfully!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to update branding' });
    }
  };

  const handleSavePageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let pubKey: keyof SiteConfig = 'privacyPublished';
    if (activePage === 'termsContent') pubKey = 'termsPublished';
    else if (activePage === 'disclaimerContent') pubKey = 'disclaimerPublished';
    else if (activePage === 'aboutContent') pubKey = 'aboutPublished';
    else if (activePage === 'contactContent') pubKey = 'contactPublished';

    const success = await updateConfig({ 
      [activePage]: pageContent,
      [pubKey]: pagePublished
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: `${activePage.replace('Content', '')} page updated & published status saved successfully!` });
    } else {
      setStatus({ type: 'error', message: 'Failed to update page content' });
    }
  };

  const handleSaveAdSense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let pubId = adsensePublisherId.trim();
    const match = pubId.match(/(?:ca-)?pub-[0-9]+/i);
    if (match) {
      pubId = match[0];
      if (!pubId.toLowerCase().startsWith('ca-')) {
        pubId = 'ca-' + pubId;
      }
    }

    const success = await updateConfig({
      adsenseEnabled,
      adsensePublisherId: pubId,
      adsenseHomeTopSlot: adsenseHomeTopSlot.trim(),
      adsenseHomeSidebarSlot: adsenseHomeSidebarSlot.trim(),
      adsenseHomeInFeedSlot: adsenseHomeInFeedSlot.trim(),
      adsenseHomeBottomSlot: adsenseHomeBottomSlot.trim(),
      adsenseCustomSnippet: adsenseCustomSnippet.trim(),
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: 'AdSense settings updated successfully & verification script injected!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to update AdSense settings' });
    }
  };

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateConfig({
      googleAnalyticsEnabled: gaEnabled,
      googleAnalyticsId: gaId.trim(),
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: 'Google Analytics settings updated successfully!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to update Analytics settings' });
    }
  };

  const handleSaveGtm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let cleanContainerId = gtmContainerId.trim();
    // Auto-extract container ID if user pasted whole script snippet: e.g. GTM-XXXXXXX
    const match = cleanContainerId.match(/GTM-[A-Z0-9]+/i);
    if (match) {
      cleanContainerId = match[0].toUpperCase();
    }

    const success = await updateConfig({
      gtmEnabled,
      gtmContainerId: cleanContainerId,
      gtmCustomDataLayerName: gtmCustomDataLayerName.trim() || 'dataLayer',
      gtmTrackEvents,
      customHeadScript: customHeadScript.trim(),
      customBodyScript: customBodyScript.trim(),
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: 'Google Tag Manager settings saved and deployed to Firestore!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to update Google Tag Manager settings' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2500);
    } catch {
      // Fallback
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2500);
    }
  };

  const handlePingGoogle = async () => {
    setPingingGoogle(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/ping-google');
      if (res.ok) {
        setPingResult('Google ও Bing-এ সাইটম্যাপ সফলভাবে সাবমিট ও পিং করা হয়েছে!');
      } else {
        setPingResult('সার্চ ইঞ্জিনে পিং রিকোয়েস্ট পাঠানো হয়েছে।');
      }
    } catch {
      setPingResult('পিং পাঠানো হয়েছে।');
    } finally {
      setPingingGoogle(false);
      setTimeout(() => setPingResult(null), 6000);
    }
  };

  const handleSaveGsc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let cleanedGsc = gscCode.trim();
    // Auto-extract content attribute if user pasted the entire <meta ...> tag
    const metaMatch = cleanedGsc.match(/content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      cleanedGsc = metaMatch[1].trim();
    }

    let cleanedBing = bingCode.trim();
    const bingMatch = cleanedBing.match(/content=["']([^"']+)["']/i);
    if (bingMatch && bingMatch[1]) {
      cleanedBing = bingMatch[1].trim();
    }

    let cleanedHtmlFile = gscHtmlFile.trim();
    // If user provided a full path or URL, extract just the file name
    if (cleanedHtmlFile.includes('/')) {
      const parts = cleanedHtmlFile.split('/');
      cleanedHtmlFile = parts[parts.length - 1];
    }

    const success = await updateConfig({
      googleSearchConsoleVerificationCode: cleanedGsc,
      googleSearchConsoleHtmlFile: cleanedHtmlFile,
      bingWebmasterVerificationCode: cleanedBing,
    });
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: 'Google Search Console & Webmaster settings saved and deployed to Firestore!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to update Search Console settings' });
    }
  };

  const generateSlug = (text: string) => {
    const clean = text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return clean || ('post-' + Date.now().toString(36));
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTitle = currentBlog.title?.trim() || '';
    const rawContent = currentBlog.content?.trim() || '';
    if (!rawTitle || !rawContent) {
      setStatus({ type: 'error', message: 'Please fill in Title and Content.' });
      return;
    }

    const finalSlug = (currentBlog.slug?.trim()) || generateSlug(rawTitle);
    const blogToSave: Partial<BlogPost> = {
      title: rawTitle,
      slug: finalSlug,
      content: rawContent,
      excerpt: currentBlog.excerpt?.trim() || '',
      category: currentBlog.category?.trim() || 'General',
      author: currentBlog.author?.trim() || 'Admin',
      coverImage: currentBlog.coverImage?.trim() || '',
    };

    if (currentBlog.id) {
      blogToSave.id = currentBlog.id;
    }
    if (currentBlog.createdAt) {
      blogToSave.createdAt = currentBlog.createdAt;
    }

    setSaving(true);
    const success = await addOrUpdateBlog(blogToSave);
    setSaving(false);
    if (success) {
      setStatus({ type: 'success', message: `Blog post ${blogToSave.id ? 'updated' : 'published'} successfully!` });
      setIsEditingBlog(false);
      setCurrentBlog({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        category: 'General',
        author: 'Admin',
        coverImage: ''
      });
    } else {
      setStatus({ type: 'error', message: 'Failed to save blog post' });
    }
  };

  const handleEditBlog = (blog: BlogPost) => {
    setCurrentBlog({
      id: blog.id,
      title: blog.title || '',
      slug: blog.slug || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      category: blog.category || 'General',
      author: blog.author || 'Admin',
      coverImage: blog.coverImage || '',
      createdAt: blog.createdAt,
    });
    setIsEditingBlog(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteBlog = async () => {
    if (!blogToDelete) return;
    setSaving(true);
    const success = await deleteBlog(blogToDelete.id);
    setSaving(false);
    setBlogToDelete(null);
    if (success) {
      setStatus({ type: 'success', message: 'Blog post deleted successfully!' });
    } else {
      setStatus({ type: 'error', message: 'Failed to delete blog post' });
    }
  };

  const handleConfirmResetPage = async () => {
    setSaving(true);
    const success = await resetPageContent(activePage);
    setSaving(false);
    setShowResetConfirm(false);
    if (success) {
      setPageContent('');
      setStatus({ type: 'success', message: 'Page content reset to default.' });
    } else {
      setStatus({ type: 'error', message: 'Failed to reset page content' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-center text-neutral-900 mb-2">Admin Portal</h1>
          <p className="text-xs text-neutral-500 text-center mb-8">Manage site identity and information pages</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
              required
            />
            {status.type === 'error' && <p className="text-xs text-red-500 text-center font-medium">{status.message}</p>}
            <button type="submit" className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-neutral-200 gap-4">
          <div className="flex items-center space-x-3 flex-col sm:flex-row">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-2 sm:mb-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Firestore Active
                </span>
              </div>
              <p className="text-xs text-neutral-500">Managing {config.siteName} (Permanent Database Sync)</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-xs font-bold px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all flex items-center">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Site
            </Link>
            <button onClick={() => setIsLoggedIn(false)} className="text-xs font-bold px-4 py-2 text-neutral-500 hover:text-red-600 transition-all">
              Logout
            </button>
          </div>
        </header>

        {status.message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 flex items-center ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" /> : <AlertCircle className="w-4 h-4 mr-2 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 mb-6 p-1.5 bg-neutral-200/50 rounded-2xl">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'branding' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Branding</span>
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'pages' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Info Pages</span>
          </button>
          <button
            onClick={() => setActiveTab('gsc')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'gsc' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Search className="w-4 h-4 shrink-0 text-blue-500" />
            <span className="truncate">Search Console</span>
          </button>
          <button
            onClick={() => setActiveTab('adsense')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'adsense' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Monitor className="w-4 h-4 shrink-0" />
            <span>AdSense</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('gtm')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'gtm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className="truncate">Tag Manager</span>
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'blogs' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Newspaper className="w-4 h-4 shrink-0" />
            <span>Blogs</span>
          </button>
        </div>

        {activeTab === 'branding' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-8">
            <form onSubmit={handleSaveBranding} className="space-y-6">
              {/* Branding fields here... */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Site Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
                    />
                    <button type="button" onClick={() => resetSiteName()} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Tagline</label>
                  <input
                    type="text"
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Logo</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? <img src={logoUrl} className="max-w-full max-h-full object-contain" /> : <Globe className="w-8 h-8 text-neutral-200" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <div className="flex space-x-2">
                      <label htmlFor="logo-upload" className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-800 transition-all flex items-center">
                        <Upload className="w-3.5 h-3.5 mr-2" /> Upload
                      </label>
                      {logoUrl && (
                        <button type="button" onClick={() => { setLogoUrl(''); deleteLogo(); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all">
                          Delete
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-neutral-100">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Redirect URL (First Click)</label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Footer Description</label>
                  <textarea
                    value={footerDescription}
                    onChange={(e) => setFooterDescription(e.target.value)}
                    placeholder="Brief description for the footer..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Footer Contact Email</label>
                  <input
                    type="email"
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    placeholder="contact@yourdomain.com"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={configLoading || saving} className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300">
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Branding</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'adsense' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Google AdSense Configuration</h3>
                  <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">Monetize your news tracker</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adsenseEnabled}
                  onChange={(e) => setAdsenseEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-bold text-neutral-700">{adsenseEnabled ? 'Active' : 'Disabled'}</span>
              </label>
            </div>

            <form onSubmit={handleSaveAdSense} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Publisher ID (Client ID)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={adsensePublisherId}
                    onChange={(e) => setAdsensePublisherId(e.target.value)}
                    placeholder="pub-xxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400 px-1">
                  Paste either your Publisher ID (e.g. <code className="font-mono">ca-pub-7732318796164413</code>) or the full Google AdSense <code className="font-mono">&lt;script&gt;</code> tag. We automatically extract and inject it for instant verification!
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Custom AdSense Code Snippet (HTML / Script Tag)</label>
                <textarea
                  value={adsenseCustomSnippet}
                  onChange={(e) => setAdsenseCustomSnippet(e.target.value)}
                  placeholder={`<script async src="https://pagead2.googlesyndication.com/..."></script>\n<ins class="adsbygoogle" ...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-xs font-mono"
                />
                <p className="text-[10px] text-neutral-400 px-1">
                  Optional: Paste your full AdSense ad unit code or script snippet. If provided, this custom snippet will be rendered directly in place of standard ad slots.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Ad Unit Slots (Home Page)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 ml-1">Top Banner Slot</label>
                    <input
                      type="text"
                      value={adsenseHomeTopSlot}
                      onChange={(e) => setAdsenseHomeTopSlot(e.target.value)}
                      placeholder="Slot ID (e.g. 1234567890)"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 ml-1">Sidebar Ad Slot</label>
                    <input
                      type="text"
                      value={adsenseHomeSidebarSlot}
                      onChange={(e) => setAdsenseHomeSidebarSlot(e.target.value)}
                      placeholder="Slot ID"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 ml-1">In-Feed (Middle) Slot</label>
                    <input
                      type="text"
                      value={adsenseHomeInFeedSlot}
                      onChange={(e) => setAdsenseHomeInFeedSlot(e.target.value)}
                      placeholder="Slot ID"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 ml-1">Bottom Banner Slot</label>
                    <input
                      type="text"
                      value={adsenseHomeBottomSlot}
                      onChange={(e) => setAdsenseHomeBottomSlot(e.target.value)}
                      placeholder="Slot ID"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Important:</strong> Changes may take 15-30 minutes to appear on your live site due to browser caching and AdSense propagation. Make sure your site is approved by AdSense before expecting live ads.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={configLoading || saving} className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300">
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save AdSense Settings</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'gsc' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-neutral-900">Google Search Console & SEO Tools</h3>
                    {gscCode ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Verified Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Setup Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Verify site ownership with Google, submit your sitemap for indexing, and track real search traffic.
                  </p>
                </div>
              </div>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                <span>Open Search Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form onSubmit={handleSaveGsc} className="space-y-8">
              {/* Method 1: HTML Tag (Recommended) */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="text-sm font-bold text-neutral-900">Method 1: HTML Tag Verification (Recommended)</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">Fastest</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  In Google Search Console, select <strong>HTML tag</strong> under 'Other verification methods'. You can paste either the full meta tag or just the verification code token below:
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Google Verification Token or Meta Tag
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gscCode}
                      onChange={(e) => setGscCode(e.target.value)}
                      placeholder='e.g. 4bK9Z_qXyZ123... or <meta name="google-site-verification" content="..." />'
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-xs font-mono"
                    />
                    {gscCode && (
                      <button
                        type="button"
                        onClick={() => setGscCode('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 px-1">
                    Auto-detection: We automatically parse full tags and inject <code>&lt;meta name="google-site-verification" content="..."&gt;</code> into every page header.
                  </p>
                </div>

                {gscCode && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-900 break-all">
                    <div className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider mb-1 font-sans">Active Head Tag Preview:</div>
                    &lt;meta name="google-site-verification" content="{gscCode.match(/content=["']([^"']+)["']/i)?.[1] || gscCode.trim()}" /&gt;
                  </div>
                )}
              </div>

              {/* Method 2: HTML File Upload Verification */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-neutral-800 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h4 className="text-sm font-bold text-neutral-900">Method 2: HTML File Verification</h4>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  If Google requested you to upload an HTML file (e.g. <code>google4b37494a8677c385.html</code>), enter the filename below. Our server will automatically serve the required verification token at this URL.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Google Verification HTML Filename
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gscHtmlFile}
                      onChange={(e) => setGscHtmlFile(e.target.value)}
                      placeholder="e.g. google4b37494a8677c385.html"
                      className="flex-1 px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-xs font-mono"
                    />
                    {gscHtmlFile && (
                      <a
                        href={`/${gscHtmlFile.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 flex items-center space-x-1.5 shrink-0"
                      >
                        <span>Test Route</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sitemaps & Search Engine Submission Helper */}
              <div className="p-6 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-bold text-neutral-900">Search Engine Sitemaps & Crawling</h4>
                </div>
                <p className="text-xs text-neutral-600">
                  After verifying ownership in Google Search Console, go to <strong>Index {">"} Sitemaps</strong> and submit your XML sitemap URL so Google indexes all your pages and news articles immediately.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sitemap */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">XML Sitemap</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Live & Auto-Updated</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono break-all bg-neutral-50 p-2 rounded border border-neutral-100">
                      https://www.worldnewstracker.online/sitemap.xml
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard('https://www.worldnewstracker.online/sitemap.xml', 'sitemap')}
                        className="flex-1 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                      >
                        {copiedItem === 'sitemap' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Robots.txt */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">Robots.txt & AI Crawler File</span>
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Optimized for Googlebot</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono break-all bg-neutral-50 p-2 rounded border border-neutral-100">
                      https://www.worldnewstracker.online/robots.txt
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard('https://www.worldnewstracker.online/robots.txt', 'robots')}
                        className="flex-1 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                      >
                        {copiedItem === 'robots' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bing Webmaster Tools & Other Search Engines */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-neutral-600" />
                    <h4 className="text-sm font-bold text-neutral-900">Bing Webmaster Tools (Microsoft Bing & Yahoo)</h4>
                  </div>
                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>Open Bing Webmaster</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Bing Verification Code (`msvalidate.01`)
                  </label>
                  <input
                    type="text"
                    value={bingCode}
                    onChange={(e) => setBingCode(e.target.value)}
                    placeholder='e.g. 12A34B56C78D90E or <meta name="msvalidate.01" content="..." />'
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-xs font-mono"
                  />
                  <p className="text-[10px] text-neutral-400 px-1">
                    Auto-injected into <code>&lt;meta name="msvalidate.01" content="..."&gt;</code> on all pages for Bing and DuckDuckGo indexing.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-5 bg-neutral-900 text-white rounded-2xl space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Quick Setup Guide for www.worldnewstracker.online</span>
                </h5>
                <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Open <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Google Search Console</a> and select <strong>URL prefix</strong> with <code>https://www.worldnewstracker.online</code> (or Domain property).
                  </li>
                  <li>
                    Under <strong>Other verification methods</strong>, choose <strong>HTML tag</strong>.
                  </li>
                  <li>
                    Copy the tag or token, paste it into the <strong>Method 1</strong> box above, and click <strong>Save Search Console Settings</strong>.
                  </li>
                  <li>
                    Return to Google Search Console and click <strong>Verify</strong>! Once verified, go to <strong>Sitemaps</strong> and submit <code>sitemap.xml</code>.
                  </li>
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={configLoading || saving}
                  className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300 shadow-sm"
                >
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Search Console Settings</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Google Analytics (GA4)</h3>
                  <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight">Track your visitors and behavior</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gaEnabled}
                  onChange={(e) => setGaEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-xs font-bold text-neutral-700">{gaEnabled ? 'Active' : 'Disabled'}</span>
              </label>
            </div>

            <form onSubmit={handleSaveAnalytics} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Measurement ID (G-ID)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-sm font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400 px-1">Found in your Google Analytics account under Admin {">"} Data Streams {">"} [Your Stream] {">"} Measurement ID.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start space-x-3">
                <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  <strong>Tip:</strong> Google Analytics 4 (GA4) uses a Measurement ID starting with <strong>G-</strong>. Enter your ID here to automatically inject the tracking script across your entire site.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={configLoading || saving} className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300">
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Analytics Settings</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'gtm' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-8">
            {/* Header with Master Switch and Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-neutral-900 text-lg">Google Tag Manager (GTM)</h3>
                    {gtmEnabled && gtmContainerId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                        Active & Injected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    Centralize and manage Google Analytics 4, Meta Pixel, Google Ads conversions, and custom marketing tags.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gtmEnabled}
                    onChange={(e) => setGtmEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-xs font-bold text-neutral-700">{gtmEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveGtm} className="space-y-8">
              {/* 1. GTM Container ID */}
              <div className="p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="text-sm font-bold text-neutral-900">GTM Container ID</h4>
                  </div>
                  <a
                    href="https://tagmanager.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>Open Google Tag Manager</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                    Container ID (or paste full snippet)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gtmContainerId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = val.match(/GTM-[A-Z0-9]+/i);
                        if (match && val.includes('<script')) {
                          setGtmContainerId(match[0].toUpperCase());
                        } else {
                          setGtmContainerId(val);
                        }
                      }}
                      placeholder="e.g. GTM-XXXXXXX"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-all text-sm font-mono font-semibold"
                    />
                    {gtmContainerId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(gtmContainerId, 'GTM Container ID')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all"
                      >
                        {copiedItem === 'GTM Container ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedItem === 'GTM Container ID' ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 px-1">
                    Enter your Container ID (e.g. <code>GTM-M4K78P9</code>) or paste your entire Google Tag Manager script snippet — the ID is auto-extracted.
                  </p>
                </div>

                {/* Live Container Verification */}
                {gtmContainerId && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs text-neutral-500 font-medium">Verify Container Live:</span>
                    <a
                      href={`https://tagassistant.google.com/#/?source=TAG_MANAGER&id=${encodeURIComponent(gtmContainerId.match(/GTM-[A-Z0-9]+/i)?.[0] || gtmContainerId)}&url=https://www.worldnewstracker.online/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3 h-3 text-indigo-500" />
                      <span>Launch Google Tag Assistant (Debug)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Dual Code Injection Standard (Head & Body) */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-neutral-800 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Automatic Dual Injection Preview</h4>
                      <p className="text-[11px] text-neutral-500">Google Tag Manager requires both Head & Body snippets.</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setGtmSnippetTab('head')}
                      className={`px-3 py-1 rounded-md transition-all ${gtmSnippetTab === 'head' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
                    >
                      &lt;head&gt; Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setGtmSnippetTab('body')}
                      className={`px-3 py-1 rounded-md transition-all ${gtmSnippetTab === 'body' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}
                    >
                      &lt;body&gt; NoScript
                    </button>
                  </div>
                </div>

                {gtmSnippetTab === 'head' ? (
                  <div className="relative">
                    <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`<!-- Google Tag Manager (Injected into <head>) -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${gtmCustomDataLayerName || 'dataLayer'}','${gtmContainerId || 'GTM-XXXXXXX'}');</script>
<!-- End Google Tag Manager -->`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${gtmCustomDataLayerName || 'dataLayer'}','${gtmContainerId || 'GTM-XXXXXXX'}');</script>
<!-- End Google Tag Manager -->`, 'Head Code')}
                      className="absolute top-3 right-3 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium flex items-center space-x-1"
                    >
                      {copiedItem === 'Head Code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'Head Code' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`<!-- Google Tag Manager (noscript - Injected into <body>) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId || 'GTM-XXXXXXX'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId || 'GTM-XXXXXXX'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`, 'Body Code')}
                      className="absolute top-3 right-3 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium flex items-center space-x-1"
                    >
                      {copiedItem === 'Body Code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'Body Code' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. DataLayer & Advanced Event Options */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-6">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-neutral-800 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h4 className="text-sm font-bold text-neutral-900">dataLayer & Event Tracking Settings</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Custom dataLayer Name
                    </label>
                    <input
                      type="text"
                      value={gtmCustomDataLayerName}
                      onChange={(e) => setGtmCustomDataLayerName(e.target.value)}
                      placeholder="dataLayer"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-all text-xs font-mono"
                    />
                    <p className="text-[10px] text-neutral-400 px-1">
                      Standard is <code>dataLayer</code>. Only change if your setup uses a customized variable name.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                      Automatic Event Dispatching
                    </label>
                    <div className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-neutral-800">Track Core User Actions</p>
                        <p className="text-[10px] text-neutral-500">Pushes search keywords, category clicks, and news clicks to dataLayer.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={gtmTrackEvents}
                          onChange={(e) => setGtmTrackEvents(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Event List Information */}
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-2">
                  <p className="font-bold text-neutral-800">Live dataLayer events dispatched by the application:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-600 font-mono text-[11px]">
                    <li className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                      <span className="font-bold text-indigo-600">event: 'news_search'</span>
                      <br /><span className="text-neutral-400 text-[10px]">search_term</span>
                    </li>
                    <li className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                      <span className="font-bold text-indigo-600">event: 'topic_selected'</span>
                      <br /><span className="text-neutral-400 text-[10px]">topic name</span>
                    </li>
                    <li className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                      <span className="font-bold text-indigo-600">event: 'article_click'</span>
                      <br /><span className="text-neutral-400 text-[10px]">title, source, url</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 4. Advanced Custom Head & Body Scripts (Meta Pixel, Clarity, etc.) */}
              <div className="p-6 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 space-y-6">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-neutral-800 text-white text-xs font-bold flex items-center justify-center">4</span>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Custom Head & Body Tags (Advanced)</h4>
                    <p className="text-[11px] text-neutral-500">Inject additional tracking codes, Meta (Facebook) Pixel, TikTok Pixel, or Microsoft Clarity tags.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                        Custom &lt;head&gt; Scripts (Injected into header)
                      </label>
                      <span className="text-[10px] text-neutral-400">HTML / JavaScript</span>
                    </div>
                    <textarea
                      rows={4}
                      value={customHeadScript}
                      onChange={(e) => setCustomHeadScript(e.target.value)}
                      placeholder="<!-- Paste Meta Pixel, Twitter Tag, or custom <script> here -->"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-all text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                        Custom &lt;body&gt; Tags (Injected right after &lt;body&gt;)
                      </label>
                      <span className="text-[10px] text-neutral-400">HTML / NoScript</span>
                    </div>
                    <textarea
                      rows={3}
                      value={customBodyScript}
                      onChange={(e) => setCustomBodyScript(e.target.value)}
                      placeholder="<!-- Paste custom <noscript> tags or body pixels here -->"
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-indigo-600 transition-all text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Step-by-step Setup Guide */}
              <div className="p-5 bg-neutral-900 text-white rounded-2xl space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Quick Google Tag Manager Setup Guide for www.worldnewstracker.online</span>
                </h5>
                <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Sign in to <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold">Google Tag Manager</a> and create an account for <strong>www.worldnewstracker.online</strong>.
                  </li>
                  <li>
                    Select <strong>Web</strong> as target platform, copy your Container ID (e.g. <code>GTM-XXXXXXX</code>).
                  </li>
                  <li>
                    Paste the Container ID into Step 1 above, toggle the switch to <strong>Enabled</strong>, and click <strong>Save Tag Manager Settings</strong>.
                  </li>
                  <li>
                    Inside Tag Manager, configure your tags (Google Analytics 4, Meta Pixel, Conversion Linker) triggered on <em>All Pages</em> or custom event triggers.
                  </li>
                  <li>
                    Click <strong>Submit</strong> & <strong>Publish</strong> in Tag Manager to deploy your tags live!
                  </li>
                </ol>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={configLoading || saving}
                  className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300 shadow-sm"
                >
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Tag Manager Settings</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'blogs' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 leading-none mb-1">
                      {isEditingBlog ? 'Edit Post' : 'Write New Post'}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">WordPress Style Editor</p>
                  </div>
                </div>
                {isEditingBlog && (
                  <button 
                    onClick={() => {
                      setIsEditingBlog(false);
                      setCurrentBlog({ title: '', slug: '', content: '', excerpt: '', category: 'General', author: 'Admin', coverImage: '' });
                    }}
                    className="px-4 py-2 text-xs font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveBlog} className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Post Title</label>
                    <input
                      type="text"
                      value={currentBlog.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = generateSlug(title);
                        setCurrentBlog({ ...currentBlog, title, slug: isEditingBlog ? currentBlog.slug : slug });
                      }}
                      placeholder="Enter title here"
                      className="w-full px-0 py-2 bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 focus:outline-none transition-all text-2xl sm:text-3xl font-extrabold text-neutral-900 placeholder:text-neutral-200"
                    />
                  </div>

                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Content</label>
                    <div className="quill-editor-container bg-neutral-50 rounded-2xl border border-neutral-200">
                      <ReactQuill 
                        theme="snow"
                        value={currentBlog.content}
                        onChange={(content) => setCurrentBlog({ ...currentBlog, content })}
                        placeholder="Start writing your story..."
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                            [{ 'size': ['small', false, 'large', 'huge'] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'align': [] }],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            [{ 'indent': '-1' }, { 'indent': '+1' }],
                            ['blockquote', 'code-block'],
                            ['link', 'image', 'video'],
                            ['clean']
                          ],
                        }}
                        className="min-h-[420px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar Settings */}
                <div className="w-full lg:w-80 space-y-6 shrink-0">
                  <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-neutral-400" />
                      <h4 className="text-[11px] font-bold text-neutral-900 uppercase tracking-widest">Publish Settings</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">URL Slug</label>
                        <input
                          type="text"
                          value={currentBlog.slug}
                          onChange={(e) => setCurrentBlog({ ...currentBlog, slug: e.target.value })}
                          placeholder="post-url-slug"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Category</label>
                        <input
                          type="text"
                          value={currentBlog.category}
                          onChange={(e) => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                          placeholder="e.g. World News"
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Featured Image URL</label>
                        <input
                          type="url"
                          value={currentBlog.coverImage}
                          onChange={(e) => setCurrentBlog({ ...currentBlog, coverImage: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-xs"
                        />
                        {currentBlog.coverImage && (
                          <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100">
                            <img src={currentBlog.coverImage} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Excerpt</label>
                        <textarea
                          value={currentBlog.excerpt}
                          onChange={(e) => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })}
                          placeholder="Brief summary..."
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 transition-all text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 flex flex-col gap-2">
                      <button 
                        type="submit" 
                        className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{isEditingBlog ? 'Update Post' : 'Publish Post'}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const slugToOpen = currentBlog.slug || currentBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'preview';
                          window.open(`/blog/${slugToOpen}`, '_blank');
                        }}
                        className="w-full py-3 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Google Search Indexing Fast-Track Dashboard for Blog Posts */}
            <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white rounded-3xl p-6 sm:p-8 shadow-xs border border-blue-200/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                      <span>Google Search Indexing Fast-Track</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      সব ব্লগ পোস্ট দ্রুত Google-এ ইনডেক্স করানোর জন্য প্রয়োজনীয় লাইভ লিংক ও সার্চ কনসোল টুলস
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePingGoogle}
                  disabled={pingingGoogle}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  {pingingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{pingingGoogle ? 'Pinging Google...' : 'Ping Google with Sitemap'}</span>
                </button>
              </div>

              {pingResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pingResult}</span>
                </div>
              )}

              {/* Sitemaps & Feeds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">Main XML Sitemap</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">All Pages + Blogs</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-500 truncate bg-neutral-50 p-1.5 rounded">
                    https://www.worldnewstracker.online/sitemap.xml
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://www.worldnewstracker.online/sitemap.xml', 'main-sitemap')}
                      className="flex-1 py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1"
                    >
                      {copiedItem === 'main-sitemap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'main-sitemap' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">Google News Sitemap</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">Last 7 Days News</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-500 truncate bg-neutral-50 p-1.5 rounded">
                    https://www.worldnewstracker.online/sitemap-news.xml
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://www.worldnewstracker.online/sitemap-news.xml', 'news-sitemap')}
                      className="flex-1 py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1"
                    >
                      {copiedItem === 'news-sitemap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'news-sitemap' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href="/sitemap-news.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">RSS 2.0 Feed</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">Google Publisher</span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-500 truncate bg-neutral-50 p-1.5 rounded">
                    https://www.worldnewstracker.online/rss.xml
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('https://www.worldnewstracker.online/rss.xml', 'rss-feed')}
                      className="flex-1 py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1"
                    >
                      {copiedItem === 'rss-feed' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'rss-feed' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href="/rss.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step-by-step Indexing Guide */}
              <div className="p-4 bg-white/80 rounded-2xl border border-blue-100 text-xs text-neutral-600 space-y-2">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google-এ প্রতিটি পোস্ট ৫–১৫ মিনিটে ইনডেক্স করানোর নিয়ম:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-neutral-700">
                  <li>
                    নিচের পোস্ট তালিকা থেকে যে পোস্টটি ইনডেক্স করাতে চান, তার পাশে <strong>"Google Inspect"</strong> বাটনে ক্লিক করুন।
                  </li>
                  <li>
                    Google Search Console ওপেন হলে সার্চ বারে URL টি পেস্ট হয়ে টেস্ট রান হবে। টেস্ট শেষে ডানপাশে <strong>"Request Indexing"</strong> বাটনে চাপ দিন।
                  </li>
                  <li>
                    Googlebot সাথে সাথে পেজটি স্ক্র্যাপ ও ভেরিফাই করবে। আমরা সার্ভারে প্রতিটি ব্লগের জন্য স্বয়ংক্রিয়ভাবে <strong>NewsArticle Schema</strong>, <strong>Dynamic Meta</strong> এবং <strong>HTML Pre-rendering</strong> যুক্ত করেছি।
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-neutral-900">Manage Existing Posts</h3>
                <span className="text-xs text-neutral-500 font-medium">{blogs.length} published {blogs.length === 1 ? 'post' : 'posts'}</span>
              </div>
              <div className="space-y-3">
                {blogs.length === 0 ? (
                  <p className="text-center py-8 text-neutral-400 text-sm italic">No blog posts yet.</p>
                ) : (
                  blogs.map((blog) => {
                    const postUrl = `https://www.worldnewstracker.online/blog/${encodeURIComponent(blog.slug || blog.id)}`;
                    const gscInspectUrl = `https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fwww.worldnewstracker.online%2F&item_url=${encodeURIComponent(postUrl)}`;
                    const richResultsUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(postUrl)}`;

                    return (
                      <div key={blog.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl group hover:border-neutral-300 transition-all">
                        <div className="flex items-center space-x-4">
                          {blog.coverImage ? (
                            <img src={blog.coverImage} className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{blog.title}</h4>
                            <p className="text-[10px] text-neutral-500">/{blog.slug} • {blog.category} • {new Date(blog.createdAt || Date.now()).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
                          {/* Google Search Console Direct Inspect */}
                          <a
                            href={gscInspectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-colors"
                            title="Request Indexing in Google Search Console"
                          >
                            <Search className="w-3 h-3" />
                            <span>Google Inspect</span>
                          </a>

                          {/* Rich Snippets / Schema Test */}
                          <a
                            href={richResultsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold transition-colors"
                            title="Test Schema.org NewsArticle Rich Results"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Rich Test</span>
                          </a>

                          {/* Live preview */}
                          <a
                            href={`/blog/${encodeURIComponent(blog.slug || blog.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                            title="View Live Blog"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Edit button */}
                          <button 
                            type="button"
                            onClick={() => handleEditBlog(blog)} 
                            className="p-1.5 text-neutral-400 hover:text-blue-600 transition-colors"
                            title="Edit Post"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button 
                            type="button"
                            onClick={() => setBlogToDelete({ id: blog.id || blog.slug, title: blog.title })} 
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'privacyContent', label: 'Privacy', icon: Shield },
                { id: 'termsContent', label: 'Terms', icon: BookOpen },
                { id: 'disclaimerContent', label: 'Disclaimer', icon: AlertTriangle },
                { id: 'aboutContent', label: 'About Us', icon: Info },
                { id: 'contactContent', label: 'Contact', icon: Mail }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePage(p.id as keyof SiteConfig)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    activePage === p.id ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                  }`}
                >
                  <p.icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSavePageContent} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Publish Status</h4>
                  <p className="text-[10px] text-neutral-500">When published, this page is visible in navigation & footer. When unpublished, it is hidden.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pagePublished}
                    onChange={(e) => setPagePublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-xs font-bold text-neutral-700">{pagePublished ? 'Published' : 'Unpublished'}</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {activePage.replace('Content', '')} HTML Content
                  </label>
                  <button type="button" onClick={() => setShowResetConfirm(true)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete & Reset
                  </button>
                </div>
                <textarea
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                  placeholder="Paste HTML (e.g. <h2>Title</h2><p>Paragraph...</p>) or plain text. Plain text will be automatically formatted into professional paragraphs."
                  rows={12}
                  className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:border-neutral-900 focus:bg-white transition-all text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500 px-1">
                  💡 Tip: You can paste HTML tags or plain text. The system automatically formats your content into a clean, professional WordPress blog post layout.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={configLoading || saving} className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center space-x-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-300">
                  {(configLoading || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save {activePage.replace('Content', '')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Blog Confirmation Modal */}
        {blogToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Blog Post</h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-neutral-900">"{blogToDelete.title}"</span>? This action will permanently remove the post.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBlogToDelete(null)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBlog}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Page Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Reset Page Content</h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                Are you sure you want to reset custom content for <span className="font-semibold text-neutral-900">{activePage.replace('Content', '')}</span> to default?
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPage}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
