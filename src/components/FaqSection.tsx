import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Newspaper, Globe, Sparkles, ShieldCheck } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How does worldnewstracker.online collect live news?',
    answer:
      'Our tool connects to authoritative, publicly available syndication feeds (RSS) and open web news indices provided by leading global news organizations (such as BBC, Reuters, CNN, AP, and others). When you search for any topic or open the page, our backend aggregates real-time updates without intermediary caching, giving you the latest headlines immediately.',
  },
  {
    question: 'How frequently are headlines updated?',
    answer:
      'Headlines are synchronized continuously in real time. The main feed updates automatically in the background every few minutes, and you can also click the refresh icon at any time to pull newly published breaking stories.',
  },
  {
    question: 'Does worldnewstracker.online publish original reporting?',
    answer:
      'No. worldnewstracker.online operates as an independent discovery tool and news indexer. We do not alter original news reporting. Each headline and summary snippet directs you straight to the primary publisher website so you can read the complete article at the original source.',
  },
  {
    question: 'Is this news tracking tool completely free to use?',
    answer:
      'Yes, 100% free! You can track breaking world news, search specific topics, and explore global media channels without any subscription fees or account creation required.',
  },
  {
    question: 'How are advertising and user privacy handled?',
    answer:
      'We partner with Google AdSense to sustain our server infrastructure. We strictly follow Google Publisher Policies, GDPR, and CCPA standards. Advertisements are clearly designated, and you have full control over cookie and personalized advertising preferences.',
  },
  {
    question: 'What search tips can I use for best results?',
    answer:
      'You can search for broad topics like "Technology", "Space", "Economy", "Climate", or specific subjects like "Artificial Intelligence", "Premier League", "Stock Market", or specific countries and cities. The engine will retrieve the most relevant real-time news articles from verified global outlets.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-16 pt-12 border-t border-neutral-200">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
          About worldnewstracker.online & Coverage
        </h2>
        <p className="text-sm text-neutral-500 mt-2">
          Everything you need to know about our real-time news syndication engine, coverage sources, and privacy commitments.
        </p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-neutral-800 hover:text-neutral-900"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-neutral-800' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
