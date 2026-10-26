import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { renderFeed, renderSitemap, writeSiteFiles } from '../scripts/lib/site-files.mjs';

const fixturePosts = [
  {
    title: 'Wiring up an LLM & lights',
    date: '2026-04-20',
    summary: 'Summary with <tag> & ampersand',
    slug: 'wiring-up-an-llm-lights',
    sourcePath: 'content/posts/2026-04-20-wiring-up-an-llm-lights.md',
    body: '',
    html: ''
  },
  {
    title: 'Interfacing with the machine',
    date: '2026-04-10',
    summary: 'Discussing protocols.',
    slug: 'interfacing-with-the-machine',
    sourcePath: 'content/posts/2026-04-10-interfacing-with-the-machine.md',
    body: '',
    html: ''
  }
];

test('renderFeed produces an RSS 2.0 document with escaped entries', () => {
  const feed = renderFeed(fixturePosts, { siteUrl: 'https://www.csavoldi.net' });

  assert.match(feed, /<rss[^>]*version="2\.0"/);
  assert.match(feed, /<title>Csavoldi\.net<\/title>/);
  assert.match(feed, /<link>https:\/\/www\.csavoldi\.net<\/link>/);
  assert.match(feed, /<atom:link href="https:\/\/www\.csavoldi\.net\/feed\.xml" rel="self"/);

  assert.match(feed, /<title>Wiring up an LLM &amp; lights<\/title>/);
  assert.match(feed, /<link>https:\/\/www\.csavoldi\.net\/blog\/posts\/wiring-up-an-llm-lights\.html<\/link>/);
  assert.match(feed, /<pubDate>Mon, 20 Apr 2026 00:00:00 GMT<\/pubDate>/);
  assert.doesNotMatch(feed, /<tag>/);
  assert.match(feed, /Summary with &lt;tag&gt; &amp; ampersand/);
});

test('renderSitemap lists the static pages and every post URL', () => {
  const sitemap = renderSitemap(fixturePosts, { siteUrl: 'https://www.csavoldi.net' });

  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<loc>https:\/\/www\.csavoldi\.net\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.csavoldi\.net\/blog\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.csavoldi\.net\/blog\/posts\/interfacing-with-the-machine\.html<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-04-10<\/lastmod>/);
});

test('writeSiteFiles writes feed.xml and sitemap.xml under the site root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-files-'));

  writeSiteFiles(fixturePosts, { siteUrl: 'https://www.csavoldi.net', rootDir: root });

  const feed = fs.readFileSync(path.join(root, 'feed.xml'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  assert.match(feed, /<rss[^>]*version="2\.0"/);
  assert.match(sitemap, /blog\/posts\/wiring-up-an-llm-lights\.html/);
});
