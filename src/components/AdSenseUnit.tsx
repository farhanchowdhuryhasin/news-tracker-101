import React, { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';

interface AdSenseUnitProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSenseUnit({
  slot,
  format = 'auto',
  className = '',
  style = { display: 'block' },
}: AdSenseUnitProps) {
  const { config } = useSiteConfig();
  const insRef = React.useRef<HTMLModElement>(null);

  useEffect(() => {
    if (config.adsenseEnabled && (slot || config.adsenseCustomSnippet)) {
      try {
        if (insRef.current && !insRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        // Suppress duplicate push errors safely
      }
    }
  }, [config.adsenseEnabled, slot, config.adsenseCustomSnippet]);

  // If custom snippet is provided, render custom snippet container
  if (config.adsenseEnabled && config.adsenseCustomSnippet && config.adsenseCustomSnippet.trim()) {
    return (
      <div className={`my-8 flex flex-col items-center justify-center overflow-hidden ${className}`}>
        <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-1.5 select-none">
          Advertisement
        </span>
        <div 
          className="w-full flex justify-center"
          dangerouslySetInnerHTML={{ __html: config.adsenseCustomSnippet }}
          ref={(node) => {
            if (node) {
              const scripts = node.getElementsByTagName('script');
              Array.from(scripts).forEach((oldScript) => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode?.replaceChild(newScript, oldScript);
              });
              try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
              } catch (e) {}
            }
          }}
        />
      </div>
    );
  }

  if (!config.adsenseEnabled || !config.adsensePublisherId || !slot) {
    return (
      <div className={`my-8 flex flex-col items-center justify-center ${className}`}>
        <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-1.5 select-none">
          Advertisement
        </span>
        <div className="w-full max-w-3xl min-h-[90px] sm:min-h-[110px] bg-neutral-100/70 border border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-xs text-neutral-500 transition-colors">
          <p className="font-medium text-neutral-600">
            {!config.adsenseEnabled ? 'Ad Space (Disabled)' : 'Ad Space (Pending Slot ID or Custom Snippet)'}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Configure this in the Admin Portal under AdSense settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-8 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-1.5 select-none">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={config.adsensePublisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
