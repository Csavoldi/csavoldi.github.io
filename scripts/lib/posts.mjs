import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { full as emoji } from 'markdown-it-emoji';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
}).use(emoji);

function normalizeDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? '').trim();
}

export function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function assertValidFrontMatter(post, sourcePath) {
  for (const key of ['title', 'date', 'summary', 'slug']) {
    if (!String(post[key] ?? '').trim()) {
      throw new Error(`${sourcePath}: missing required front matter field '${key}'`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
    throw new Error(`${sourcePath}: date must use YYYY-MM-DD`);
  }
}

export function assertUniqueSlugs(posts) {
  const seen = new Map();

  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`duplicate slug '${post.slug}' in ${seen.get(post.slug)} and ${post.sourcePath}`);
    }

    seen.set(post.slug, post.sourcePath);
  }
}

export function loadPostFile(sourcePath) {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const { data, content } = matter(raw);
  const post = {
    title: String(data.title ?? '').trim(),
    date: normalizeDateValue(data.date),
    summary: String(data.summary ?? '').trim(),
    slug: String(data.slug ?? '').trim(),
    sourcePath,
    body: content.trim(),
    html: markdown.render(content)
  };

  assertValidFrontMatter(post, sourcePath);
  return post;
}

export function loadAllPosts(contentDir = 'content/posts') {
  return fs
    .readdirSync(contentDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => loadPostFile(path.join(contentDir, fileName)));
}

export function createPostDraft({ title, date, contentDir = 'content/posts' }) {
  const normalizedTitle = String(title ?? '').trim();
  const normalizedDate = String(date ?? '').trim();
  const slug = slugifyTitle(normalizedTitle);
  const filePath = path.join(contentDir, `${normalizedDate}-${slug}.md`);

  if (!normalizedTitle) {
    throw new Error('A post title is required.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error('Post date must use YYYY-MM-DD.');
  }

  if (!slug) {
    throw new Error('Unable to derive a slug from the post title.');
  }

  if (fs.existsSync(filePath)) {
    throw new Error(`Post already exists: ${filePath}`);
  }

  const draft = [
    '---',
    `title: ${normalizedTitle}`,
    `date: ${normalizedDate}`,
    'summary: Replace this summary before publishing.',
    `slug: ${slug}`,
    '---',
    '',
    `# ${normalizedTitle}`,
    '',
    'Start writing here.',
    ''
  ].join('\n');

  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(filePath, draft);

  return { filePath, slug };
}

export function deletePostBySlug({ slug, contentDir = 'content/posts' }) {
  const normalizedSlug = String(slug ?? '').trim();

  if (!normalizedSlug) {
    throw new Error('A post slug is required.');
  }

  const matches = loadAllPosts(contentDir).filter((post) => post.slug === normalizedSlug);

  if (matches.length === 0) {
    throw new Error(`No post found for slug '${normalizedSlug}'.`);
  }

  if (matches.length > 1) {
    throw new Error(`Multiple posts found for slug '${normalizedSlug}'.`);
  }

  fs.rmSync(matches[0].sourcePath);
  return { filePath: matches[0].sourcePath, slug: normalizedSlug };
}
