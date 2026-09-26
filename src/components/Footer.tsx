import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, Mail, BookOpen, AlertTriangle, Info, Heart } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { config } = useSiteConfig();

  return (
    <footer className="bg-white border-t border-neutral-200 mt-20 text-neutral-600 text-sm">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Bottom Disclaimer & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          <p className="text-center sm:text-left leading-relaxed">
            © {currentYear} {config.siteName || 'worldnewstracker.online'}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
            {[
              { path: '/blog', label: 'Blog', show: true },
              { path: '/privacy-policy', label: 'Privacy', show: config.privacyPublished !== false },
              { path: '/terms-of-service', label: 'Terms', show: config.termsPublished !== false },
              { path: '/disclaimer', label: 'Disclaimer', show: config.disclaimerPublished !== false },
              { path: '/contact', label: 'Contact', show: config.contactPublished !== false },
            ]
              .filter(item => item.show)
              .map((item, index, arr) => (
                <React.Fragment key={item.path}>
                  <Link to={item.path} className="hover:text-neutral-600 transition-colors">
                    {item.label}
                  </Link>
                  {index < arr.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
