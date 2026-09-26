import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { config } = useSiteConfig();

  const navLinks = [
    { name: 'Live Tracker', path: '/', published: true },
    { name: 'Blog', path: '/blog', published: true },
    { name: 'About Us', path: '/about', published: config.aboutPublished !== false },
    { name: 'Contact', path: '/contact', published: config.contactPublished !== false },
  ].filter(link => link.published);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group overflow-hidden">
          {config.logoUrl ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src={config.logoUrl}
                alt={config.siteName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <div className="overflow-hidden">
            <span className="font-bold text-sm sm:text-lg text-neutral-900 tracking-tight block leading-tight truncate max-w-[160px] sm:max-w-none">
              {config.siteName || 'worldnewstracker.online'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 block -mt-0.5 truncate max-w-[120px] sm:max-w-none">
              {config.siteTagline || 'Live Global Intelligence'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 sm:px-6 py-4 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
