import fs from 'node:fs';

import { buildPostsSite } from './lib/build.mjs';
import { writeSiteFiles } from './lib/site-files.mjs';

function resolveSiteUrl() {
  try {
    const cname = fs.readFileSync('CNAME', 'utf8').trim();
    return `https://${cname}`;
  } catch {
    return 'https://csavoldi.github.io';
  }
}

const siteUrl = resolveSiteUrl();
const posts = await buildPostsSite();
writeSiteFiles(posts, { siteUrl });
console.log('Blog archive, post pages, feed.xml, and sitemap.xml rebuilt.');
