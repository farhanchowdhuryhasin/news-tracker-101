import React from 'react';
import {
  Compass,
  CheckCircle,
  Zap,
  Globe2,
  ShieldCheck,
  Search,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function QuickFactsAEO() {
  const keyFacts = [
    { label: 'Tool Classification', value: 'Live News Discovery & Syndication Engine' },
    { label: 'Update Frequency', value: 'Instant & continuous real-time feeds' },
    { label: 'Monitored Networks', value: '20+ top international news organizations' },
    { label: 'Access & Cost', value: '100% Free / No registration required' },
    { label: 'Original Reporting', value: 'Attributed directly to primary publishers' },
    { label: 'Coverage Scope', value: 'Global, regional, geopolitics, tech & finance' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Enter Any Topic or Select a Trend',
      desc: 'Type keywords like "Space Exploration", "Economy", or click trending badges like "Artificial Intelligence".',
    },
    {
      num: '02',
      title: 'Real-Time Syndication Search',
      desc: 'Our engine queries live public RSS feeds and news indices without intermediate lag.',
    },
    {
      num: '03',
      title: 'Direct Source Attribution',
      desc: 'Browse original headlines, publication timestamps, and jump straight to the source article.',
    },
  ];

  return (
    <section
      id="quick-answers"
      aria-label="AEO Quick Facts and Overview"
      className="mt-14 pt-12 border-t border-neutral-200"
    >
      {/* AEO / Answer Engine Definition Block */}
      <div className="bg-gradient-to-b from-neutral-100/70 to-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-200/80 mb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Quick Answer & Overview</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mb-3">
          What is worldnewstracker.online?
        </h2>
        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-2xl">
          <strong>worldnewstracker.online</strong> is an open web real-time news search and aggregation tool. It allows researchers, journalists, and global citizens to track breaking world news across multiple verified international news networks (including BBC, Reuters, AP, Bloomberg, and CNN) with zero algorithmic bias or paywalls.
        </p>

        {/* Fact Grid for Generative Engine Extraction */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {keyFacts.map((fact, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-3.5 border border-neutral-200/70 shadow-2xs flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                {fact.label}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 mt-1">
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How To Track Breaking News (HowTo for Answer Engines) */}
      <div className="mb-10">
        <div className="text-center max-w-lg mx-auto mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            User Guide
          </span>
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight mt-1">
            How to Track Live World News in 3 Steps
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1.5">
            Straightforward search methodology optimized for instant intelligence discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative flex flex-col"
            >
              <div className="text-2xl font-black text-neutral-200 mb-2 font-mono">
                {step.num}
              </div>
              <h4 className="text-sm font-bold text-neutral-900 mb-1.5">
                {step.title}
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GEO Authoritative Citations & Syndication Ethics */}
      <div className="p-4 sm:p-5 bg-blue-50/60 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-blue-900">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Editorial Independence & Citation Notice</span>
            <span className="text-blue-800/80 leading-relaxed">
              We uphold open web transparency. All article snippets preserve original publisher titles, timestamps, and direct hyperlink referrals under Fair Use principles.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
