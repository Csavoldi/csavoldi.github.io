import fs from 'node:fs';
import path from 'node:path';

import { escapeHtml } from './templates.mjs';
import { SITE_NAME, SITE_TAGLINE } from './site-meta.mjs';

function rfc822Date(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toUTCString();
}

export function renderFeed(posts, { siteUrl }) {
  const items = posts
    .map((post) => {
      const postUrl = `${siteUrl}/blog/posts/${post.slug}.html`;

      return `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(postUrl)}</link>
      <guid>${escapeHtml(postUrl)}</guid>
      <pubDate>${rfc822Date(post.date)}</pubDate>
      <description>${escapeHtml(post.summary)}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(SITE_NAME)}</title>
    <link>${escapeHtml(siteUrl)}</link>
    <description>${escapeHtml(SITE_TAGLINE)}</description>
    <language>en-us</language>
    <atom:link href="${escapeHtml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export function renderSitemap(posts, { siteUrl }) {
  const staticEntries = ['', 'blog/']
    .map((pagePath) => `  <url>
    <loc>${escapeHtml(`${siteUrl}/${pagePath}`)}</loc>
  </url>`)
    .join('\n');

  const postEntries = posts
    .map((post) => `  <url>
    <loc>${escapeHtml(`${siteUrl}/blog/posts/${post.slug}.html`)}</loc>
    <lastmod>${post.date}</lastmod>
  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>
`;
}

export function writeSiteFiles(posts, { siteUrl, rootDir = '.' }) {
  fs.writeFileSync(path.join(rootDir, 'feed.xml'), renderFeed(posts, { siteUrl }));
  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), renderSitemap(posts, { siteUrl }));
}
