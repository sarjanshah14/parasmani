# Parasmani Enterprise — website

Website for **Parasmani Enterprise**, an industrial bearing exporter in Bhavnagar/Alang, Gujarat. Built by me for the business.

**Live:** https://parasmanienterprise.com

## What it is

A catalog site for over 1,000 new and used bearing models across 20 categories (spherical roller, deep groove ball, tapered roller and more). Visitors browse by category, open a product page, and send an inquiry by WhatsApp or email.

It is one plain HTML/CSS/JavaScript page with no framework. At deploy time, a small Node script prerenders a static page for every category and product so search engines can index them.

## How it's built

- `parasmani_enterprise.html`: the whole app, including the catalog data (`BEARS`, `TYPE_META`).
- `generate_pages.js`: the build step Vercel runs (`vercel.json`). It pulls the data out into `data.js` and writes one page per category (`/type/...`) and per bearing (`/bearing/...`) into `dist/`, each with its own title and description.
- `photos/`: product images. `sitemap.xml`, `robots.txt` and `llms.txt` are for search engines and AI crawlers.
- `vercel.json`: security headers (CSP, HSTS), caching, and URL rewrites.

Performance and SEO work (July 2026): compressed images, async fonts, contrast fixes for accessibility, crawlable links, and prerendered pages.

## Run it locally

```bash
node generate_pages.js
npx serve dist
```
