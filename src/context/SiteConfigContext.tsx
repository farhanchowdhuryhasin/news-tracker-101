import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

export interface SiteConfig {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  redirectUrl: string;
  privacyContent?: string;
  termsContent?: string;
  disclaimerContent?: string;
  aboutContent?: string;
  contactContent?: string;
  privacyPublished?: boolean;
  termsPublished?: boolean;
  disclaimerPublished?: boolean;
  aboutPublished?: boolean;
  contactPublished?: boolean;
  footerDescription?: string;
  footerEmail?: string;
  // Analytics
  googleAnalyticsEnabled?: boolean;
  googleAnalyticsId?: string;
  // AdSense Settings
  adsenseEnabled?: boolean;
  adsensePublisherId?: string;
  adsenseHomeTopSlot?: string;
  adsenseHomeSidebarSlot?: string;
  adsenseHomeInFeedSlot?: string;
  adsenseHomeBottomSlot?: string;
  adsenseCustomSnippet?: string;
  // Google Search Console & Webmasters
  googleSearchConsoleVerificationCode?: string;
  googleSearchConsoleHtmlFile?: string;
  bingWebmasterVerificationCode?: string;
  // Google Tag Manager & Custom Tags
  gtmEnabled?: boolean;
  gtmContainerId?: string;
  gtmCustomDataLayerName?: string;
  gtmTrackEvents?: boolean;
  customHeadScript?: string;
  customBodyScript?: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'worldnewstracker.online',
  siteTagline: 'Live Global Intelligence & Breaking Headlines',
  logoUrl: '',
  redirectUrl: '',
  privacyContent: '',
  termsContent: '',
  disclaimerContent: '',
  aboutContent: '',
  contactContent: '',
  privacyPublished: true,
  termsPublished: true,
  disclaimerPublished: true,
  aboutPublished: true,
  contactPublished: true,
  footerDescription: '',
  footerEmail: '',
  googleAnalyticsEnabled: false,
  googleAnalyticsId: '',
  adsenseEnabled: true,
  adsensePublisherId: 'ca-pub-7732318796164413',
  adsenseHomeTopSlot: '',
  adsenseHomeSidebarSlot: '',
  adsenseHomeInFeedSlot: '',
  adsenseHomeBottomSlot: '',
  adsenseCustomSnippet: '',
  googleSearchConsoleVerificationCode: '',
  googleSearchConsoleHtmlFile: '',
  bingWebmasterVerificationCode: '',
  gtmEnabled: false,
  gtmContainerId: '',
  gtmCustomDataLayerName: 'dataLayer',
  gtmTrackEvents: true,
  customHeadScript: '',
  customBodyScript: '',
};

const LEGACY_SITE_NAMES = new Set([
  'World News Tracker Online',
  'World Latest News Tracker',
  'News Tracker',
  'World News Tracker'
]);

function sanitizeSiteName(name?: string): string {
  if (!name || !name.trim() || LEGACY_SITE_NAMES.has(name.trim())) {
    return 'worldnewstracker.online';
  }
  return name.trim();
}

interface SiteConfigContextType {
  config: SiteConfig;
  updateConfig: (newConfig: Partial<SiteConfig>) => Promise<boolean>;
  deleteLogo: () => Promise<boolean>;
  resetSiteName: () => Promise<boolean>;
  resetPageContent: (page: keyof SiteConfig) => Promise<boolean>;
  refreshConfig: () => Promise<void>;
  trackGtmEvent: (event: string, payload?: Record<string, any>) => void;
  loading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: async () => false,
  deleteLogo: async () => false,
  resetSiteName: async () => false,
  resetPageContent: async () => false,
  refreshConfig: async () => {},
  trackGtmEvent: () => {},
  loading: false,
});

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('site_branding_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          siteName: sanitizeSiteName(parsed.siteName),
        };
      }
    } catch {}
    return DEFAULT_CONFIG;
  });
  const [loading, setLoading] = useState(false);

  const refreshConfig = async () => {
    try {
      let fetchedConfig: any = null;

      // 1. Primary: Fetch from Cloud Firestore Database
      try {
        const configDoc = await getDoc(doc(db, 'config', 'global'));
        if (configDoc.exists()) {
          fetchedConfig = configDoc.data();
        }
      } catch (firestoreErr) {
        console.warn('Firestore config read notice:', firestoreErr);
      }

      // 2. Secondary fallback: Fetch from server API
      if (!fetchedConfig) {
        try {
          const res = await fetch(`/api/config?_t=${Date.now()}`);
          if (res.ok) {
            fetchedConfig = await res.json();
          }
        } catch (serverErr) {
          console.warn('Server config read notice:', serverErr);
        }
      }

      if (fetchedConfig) {
        const merged: SiteConfig = {
          ...DEFAULT_CONFIG,
          ...fetchedConfig,
          siteName: sanitizeSiteName(fetchedConfig.siteName),
          siteTagline: (fetchedConfig.siteTagline && fetchedConfig.siteTagline.trim()) || DEFAULT_CONFIG.siteTagline,
          logoUrl: (fetchedConfig.logoUrl && fetchedConfig.logoUrl.trim()) || '',
          redirectUrl: typeof fetchedConfig.url === 'string' ? fetchedConfig.url : (fetchedConfig.redirectUrl || ''),
        };
        setConfig(merged);
        localStorage.setItem('site_branding_config', JSON.stringify(merged));
        if (merged.redirectUrl !== undefined) {
          localStorage.setItem('admin_redirect_url', merged.redirectUrl);
        }
      }
    } catch (e) {
      console.warn('Config refresh notice:', e);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  useEffect(() => {
    if (config.googleAnalyticsEnabled && config.googleAnalyticsId) {
      const scriptId = 'google-analytics';
      if (!document.getElementById(scriptId)) {
        // Load the main gtag.js script
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
        document.head.appendChild(script);

        // Initialize gtag
        const inlineScript = document.createElement('script');
        inlineScript.id = 'google-analytics-init';
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${config.googleAnalyticsId}', {
            page_path: window.location.pathname,
          });
        `;
        document.head.appendChild(inlineScript);
      }
    }
  }, [config.googleAnalyticsEnabled, config.googleAnalyticsId]);

  useEffect(() => {
    if (config.adsenseEnabled && (config.adsensePublisherId || config.adsenseCustomSnippet)) {
      const scriptId = 'adsense-script';
      let pubId = (config.adsensePublisherId || '').trim();
      
      // Auto-extract ca-pub or pub ID if user pasted full script tag
      const match = pubId.match(/(?:ca-)?pub-[0-9]+/i);
      if (match) {
        pubId = match[0];
        if (!pubId.toLowerCase().startsWith('ca-')) {
          pubId = 'ca-' + pubId;
        }
      } else if (config.adsenseCustomSnippet) {
        const snippetMatch = config.adsenseCustomSnippet.match(/(?:ca-)?pub-[0-9]+/i);
        if (snippetMatch) {
          pubId = snippetMatch[0];
          if (!pubId.toLowerCase().startsWith('ca-')) {
            pubId = 'ca-' + pubId;
          }
        }
      }

      if (pubId) {
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
      }
    } else {
      const script = document.getElementById('adsense-script');
      if (script) {
        script.remove();
      }
    }
  }, [config.adsenseEnabled, config.adsensePublisherId, config.adsenseCustomSnippet]);

  // Google Tag Manager & Custom Scripts Injection
  useEffect(() => {
    const headScriptId = 'gtm-head-script';
    const noscriptId = 'gtm-body-noscript';
    const customHeadId = 'custom-head-tag';
    const customBodyId = 'custom-body-tag';

    if (config.gtmEnabled && config.gtmContainerId) {
      // Auto-extract container ID if user pasted full script snippet or ID
      const match = config.gtmContainerId.match(/GTM-[A-Z0-9]+/i);
      const containerId = (match ? match[0] : config.gtmContainerId.trim()).toUpperCase();
      const dataLayerName = (config.gtmCustomDataLayerName && config.gtmCustomDataLayerName.trim()) || 'dataLayer';

      if (containerId.startsWith('GTM-')) {
        // 1. Inject Head Script
        let headScript = document.getElementById(headScriptId) as HTMLScriptElement | null;
        if (!headScript) {
          headScript = document.createElement('script');
          headScript.id = headScriptId;
          headScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${dataLayerName}','${containerId}');`;
          document.head.appendChild(headScript);
        }

        // 2. Inject Body NoScript Fallback (per Google Tag Manager standard)
        let bodyNoScript = document.getElementById(noscriptId);
        if (!bodyNoScript) {
          bodyNoScript = document.createElement('noscript');
          bodyNoScript.id = noscriptId;
          bodyNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.insertBefore(bodyNoScript, document.body.firstChild);
        }
      }
    } else {
      // Remove GTM scripts if disabled
      const headScript = document.getElementById(headScriptId);
      if (headScript) headScript.remove();
      const bodyNoScript = document.getElementById(noscriptId);
      if (bodyNoScript) bodyNoScript.remove();
    }

    // Custom Head Script injection
    if (config.customHeadScript && config.customHeadScript.trim()) {
      let customHead = document.getElementById(customHeadId);
      if (!customHead) {
        customHead = document.createElement('div');
        customHead.id = customHeadId;
        customHead.innerHTML = config.customHeadScript;
        document.head.appendChild(customHead);
      } else {
        customHead.innerHTML = config.customHeadScript;
      }
    } else {
      const customHead = document.getElementById(customHeadId);
      if (customHead) customHead.remove();
    }

    // Custom Body Script injection
    if (config.customBodyScript && config.customBodyScript.trim()) {
      let customBody = document.getElementById(customBodyId);
      if (!customBody) {
        customBody = document.createElement('div');
        customBody.id = customBodyId;
        customBody.innerHTML = config.customBodyScript;
        document.body.appendChild(customBody);
      } else {
        customBody.innerHTML = config.customBodyScript;
      }
    } else {
      const customBody = document.getElementById(customBodyId);
      if (customBody) customBody.remove();
    }
  }, [
    config.gtmEnabled,
    config.gtmContainerId,
    config.gtmCustomDataLayerName,
    config.customHeadScript,
    config.customBodyScript
  ]);

  const updateConfig = async (newConfig: Partial<SiteConfig>): Promise<boolean> => {
    setLoading(true);
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('site_branding_config', JSON.stringify(updated));
    if (updated.redirectUrl !== undefined) {
      localStorage.setItem('admin_redirect_url', updated.redirectUrl);
    }

    // 1. Persist permanently to Cloud Firestore Database
    try {
      await setDoc(doc(db, 'config', 'global'), {
        ...updated,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (firestoreErr) {
      handleFirestoreError(firestoreErr, OperationType.WRITE, 'config/global');
    }

    // 2. Mirror to Server API
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          ...(newConfig.redirectUrl !== undefined && { url: newConfig.redirectUrl })
        }),
      });
      setLoading(false);
      return res.ok;
    } catch (e) {
      setLoading(false);
      return true; // Still true since saved to Firestore
    }
  };

  const deleteLogo = async (): Promise<boolean> => {
    return await updateConfig({ logoUrl: '' });
  };

  const resetSiteName = async (): Promise<boolean> => {
    return await updateConfig({
      siteName: DEFAULT_CONFIG.siteName,
      siteTagline: DEFAULT_CONFIG.siteTagline,
    });
  };

  const resetPageContent = async (page: keyof SiteConfig): Promise<boolean> => {
    return await updateConfig({ [page]: '' });
  };

  const trackGtmEvent = (event: string, payload?: Record<string, any>) => {
    try {
      if (!config.gtmEnabled || !config.gtmTrackEvents) return;
      const dlName = (config.gtmCustomDataLayerName && config.gtmCustomDataLayerName.trim()) || 'dataLayer';
      const win = window as any;
      win[dlName] = win[dlName] || [];
      win[dlName].push({
        event,
        ...payload,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        updateConfig,
        deleteLogo,
        resetSiteName,
        resetPageContent,
        refreshConfig,
        trackGtmEvent,
        loading,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
