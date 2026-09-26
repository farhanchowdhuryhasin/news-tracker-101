import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_choice');
    if (!consent) {
      // Delay slightly for smooth UX
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_choice', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent_choice', 'essential_only');
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside aria-label="Cookie consent" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-neutral-200/90 text-neutral-800 text-xs sm:text-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center space-x-2 text-neutral-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Privacy & Cookie Preferences</span>
          </div>
          <button
            type="button"
            onClick={handleDecline}
            className="text-neutral-400 hover:text-neutral-700 p-0.5"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-neutral-600 leading-relaxed mb-4 text-xs">
          We and our advertising partner (<strong>Google AdSense</strong>) use cookies to analyze site traffic and deliver relevant, personalized or non-personalized advertisements in accordance with our{' '}
          <Link to="/privacy-policy" className="text-blue-600 underline font-medium">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium text-xs transition-colors shadow-xs"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium text-xs transition-colors"
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
