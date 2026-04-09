import { buildPostsSite } from './lib/build.mjs';
import { deletePostBySlug } from './lib/posts.mjs';

const slug = process.argv.slice(2).join(' ').trim();

if (!slug) {
  throw new Error('Usage: npm run post:delete -- my-post-slug');
}

const result = deletePostBySlug({ slug });
await buildPostsSite();
console.log(`Deleted ${result.filePath} and rebuilt the blog.`);
