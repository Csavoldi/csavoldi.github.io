import fs from 'node:fs';
import path from 'node:path';

import { assertUniqueSlugs, loadAllPosts } from './posts.mjs';
import { renderArchivePage, renderPostPage } from './templates.mjs';

export async function buildPostsSite({ contentDir = 'content/posts', blogDir = 'blog' } = {}) {
  const posts = loadAllPosts(contentDir).sort((left, right) => right.date.localeCompare(left.date));
  assertUniqueSlugs(posts);

  const postsDir = path.join(blogDir, 'posts');
  fs.mkdirSync(postsDir, { recursive: true });

  for (const fileName of fs.readdirSync(postsDir)) {
    if (fileName.endsWith('.html')) {
      fs.rmSync(path.join(postsDir, fileName));
    }
  }

  fs.writeFileSync(path.join(blogDir, 'index.html'), renderArchivePage(posts));

  for (const post of posts) {
    fs.writeFileSync(path.join(postsDir, `${post.slug}.html`), renderPostPage(post));
  }

  return posts;
}
