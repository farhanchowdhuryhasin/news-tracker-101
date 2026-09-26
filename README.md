# worldnewstracker.online

> **Live Global News Aggregation & Real-Time Intelligence Engine**  
> Official Domain: [worldnewstracker.online](https://worldnewstracker.online/)  
> Repository: [farhanchowdhuryhasin/news-tracker-101](https://github.com/farhanchowdhuryhasin/news-tracker-101)

---

## 🌐 Overview

**worldnewstracker.online** is a modern, high-performance real-time news search and aggregation platform. It queries open web syndication streams (RSS) from authoritative international news networks—including BBC News, Reuters, Associated Press (AP), CNN, and Bloomberg—delivering live breaking headlines directly to researchers, journalists, and global citizens without algorithmic bias or intermediary paywalls.

The platform is designed with a full-stack architecture featuring a responsive **React 19** frontend, an **Express.js** backend, **Vercel Serverless Function** handlers, an authenticated **Admin Portal**, and advanced **SEO/AEO** structured data.

---

## ✨ Features

### 📰 Live News Aggregator & Search Engine
* **Real-Time News Stream**: Continuous live updates aggregated from 20+ verified global publishers.
* **Instant Keyword Search**: Search any global topic, geopolitical event, or country to retrieve live breaking stories.
* **Topic Quick Filters**: Pre-curated filters for World, Technology, AI & Future Tech, Business & Markets, Science & Space, Climate, and Sports.
* **Time Range Filtering**: Filter breaking headlines from the past hour, past 24 hours, or past week.
* **Direct Source Attribution**: Every headline links directly to the original reporting publisher with exact publication timestamps.

### 🛡️ Secure Admin Portal (`/admin`)
* **Secret Key Authentication**: Protected administrator dashboard access.
* **WordPress-Style Blog Manager**:
  * Rich-text article editor with formatting tools, headings, lists, blockquotes, and image embedding.
  * Automatic slug generation and custom slug editing.
  * Permanent delete and instant draft/publish controls.
* **Custom Pages Manager**:
  * Individual management for **Privacy Policy**, **Terms of Service**, **Disclaimer**, **About Us**, and **Contact Us**.
  * **Strict Zero-Default Policy**: No hardcoded dummy or boilerplate text is displayed. Only content explicitly published by the administrator is rendered.
  * One-click publish / unpublish toggle for each individual legal page.
* **Branding & Site Customization**:
  * Configure Site Name (`worldnewstracker.online`), Site Tagline, and custom Logo URL.
  * Reset to system defaults at any time.
* **Traffic & Redirect Routing**:
  * Configure instant global traffic redirects directly from the admin panel.
* **Google AdSense & Monetization Suite**:
  * Toggle Google AdSense on/off with Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`).
  * Custom ad slot units for Header/Top Banner, Sidebar, In-Feed, and Bottom Banner.
  * Fully compliant `ads.txt` served from the root.
* **Google Search Console & Webmaster Tools**:
  * Dual Verification methods: Instant HTML Meta Tag (`google-site-verification`) and HTML File upload route (`google[...].html`).
  * Instant XML Sitemap submission helper (`sitemap.xml`) with 1-click copy for Google Search Console.
  * Bing Webmaster Tools verification code support (`msvalidate.01`).
* **Google Analytics 4 (GA4)**:
  * Dynamic Measurement ID injection (`G-XXXXXXXXXX`).
* **GDPR & CCPA Cookie Consent Banner**:
  * Automatic consent storage and preference management.

### 🔍 Advanced SEO, AEO & GEO Optimization
* **Schema.org Structured Data**: Comprehensive Multi-Entity JSON-LD graph (`WebSite`, `WebApplication`, `NewsMediaOrganization`, `FAQPage`).
* **Social Sharing**: OpenGraph (OG) and Twitter / X Cards for rich social previews.
* **Crawler Directives**: Clean `robots.txt` and comprehensive `sitemap.xml` mapping all pages and dynamic blog posts.
* **AI Engine Optimization (AEO & GEO)**: `llms.txt` and machine-readable quick-answer blocks for LLMs and Generative Search engines.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion (Framer Motion)
* **Cloud Database**: Google Cloud Firestore (Permanent database storage for blogs, pages, and configuration)
* **Rich Text Editing**: React Quill (`react-quill-new`) & DOMPurify
* **Routing**: React Router v7
* **Backend**: Express.js (Node.js runtime) with Vite middleware in development
* **RSS Syndication**: `rss-parser` with multi-source fallback
* **Serverless Deployment**: Vercel Serverless Functions (`api/` handlers)
* **Build System**: Vite 6, TSX, esbuild

---

## 📁 Project Structure

```text
├── api/                     # Vercel Serverless Function handlers
│   ├── blogs/
│   │   └── [id].ts          # Get / Update / Delete individual blog post
│   ├── blogs.ts             # Blog list & save API
│   ├── config.ts            # Site configuration & branding API
│   └── news.ts              # RSS syndication & live search API
├── public/                  # Static assets & SEO files
│   ├── ads.txt              # Google AdSense publisher verification
│   ├── llms.txt             # AI & LLM search engine indexing
│   ├── robots.txt           # Search engine crawling rules
│   └── sitemap.xml          # XML sitemap for search engines
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AdminPortal.tsx  # Admin dashboard & editor suite
│   │   ├── AdSenseUnit.tsx  # Dynamic Google AdSense ad slots
│   │   ├── CookieBanner.tsx # GDPR/CCPA cookie consent
│   │   ├── FaqSection.tsx   # Interactive FAQ accordion
│   │   ├── Footer.tsx       # Global footer & legal links
│   │   ├── Header.tsx       # Global header & navigation
│   │   ├── NewsTracker.tsx  # Main news feed & search engine
│   │   ├── QuickFactsAEO.tsx# Answer Engine Optimization block
│   │   └── SEOHead.tsx      # Dynamic SEO meta tags & canonicals
│   ├── context/             # Global application state
│   │   ├── BlogContext.tsx  # Blog persistence & CRUD
│   │   └── SiteConfigContext.tsx # Site branding, ads, & page config
│   ├── pages/               # Route pages
│   │   ├── AboutUs.tsx      # About page (admin published content)
│   │   ├── BlogList.tsx     # Blog directory listing
│   │   ├── BlogPost.tsx     # Single blog post article view
│   │   ├── ContactUs.tsx    # Contact page (admin published content)
│   │   ├── Disclaimer.tsx   # Disclaimer & Fair Use page
│   │   ├── PrivacyPolicy.tsx# Privacy Policy page
│   │   └── TermsOfService.tsx# Terms of Service page
│   ├── utils/
│   │   └── formatContent.ts # Rich text & HTML sanitize utility
│   ├── App.tsx              # Main routing & layout wrapper
│   └── main.tsx             # Application entry point
├── blogs.json               # Server blog database file
├── index.html               # HTML5 entry with metadata & Schema graph
├── server.ts                # Express backend server with RSS aggregator
└── vercel.json              # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** or **bun**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/farhanchowdhuryhasin/news-tracker-101.git
   cd news-tracker-101
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

### Build for Production
```bash
npm run build
```
This compiles the client with Vite and bundles the Node.js server with `esbuild` into `dist/server.cjs`.

### Start Production Server
```bash
npm start
```

### Vercel Deployment
The repository is pre-configured with `vercel.json` and standalone serverless API endpoints in `/api`. Simply link your GitHub repository to Vercel for zero-configuration deployments.

---

## 🔐 Admin Dashboard Access

1. Open your browser and navigate to:
   ```text
   http://localhost:3000/admin
   ```
   (or `https://worldnewstracker.online/admin` in production)
2. Enter your administrator secret key to unlock full dashboard privileges.
3. Manage blogs, custom legal pages, site branding, ads, and analytics in real time.

---

## 📄 License & Attribution

* **Fair Use Notice**: All headlines, excerpts, and news articles retrieved through this service belong to their respective copyright holders. Displayed strictly under Fair Use for educational and discovery purposes.
* Developed and maintained for **worldnewstracker.online**.
