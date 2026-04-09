import { createPostDraft } from './lib/posts.mjs';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  throw new Error('Usage: npm run post:new -- "My New Post"');
}

const today = new Date().toISOString().slice(0, 10);
const result = createPostDraft({ title, date: today });
console.log(`Created ${result.filePath}`);
