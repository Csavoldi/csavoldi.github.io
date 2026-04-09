import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPostsSite } from '../scripts/lib/build.mjs';
import {
  assertUniqueSlugs,
  assertValidFrontMatter,
  createPostDraft,
  loadPostFile,
  slugifyTitle
} from '../scripts/lib/posts.mjs';
import { renderArchivePage, renderPostPage } from '../scripts/lib/templates.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const firstPostPath = path.join(
  repoRoot,
  'content/posts/2026-04-09-why-calm-interfaces-age-better-than-loud-ones.md'
);

test('slugifyTitle creates lowercase dash-separated slugs', () => {
  assert.equal(
    slugifyTitle('Shipping a Tiny Static Site with a Big Point of View'),
    'shipping-a-tiny-static-site-with-a-big-point-of-view'
  );
});

test('assertValidFrontMatter rejects missing summary', () => {
  assert.throws(() => {
    assertValidFrontMatter({ title: 'Post', date: '2026-04-09', slug: 'post' }, 'content/posts/post.md');
  }, /summary/);
});

test('assertUniqueSlugs rejects duplicate slugs', () => {
  assert.throws(() => {
    assertUniqueSlugs([
      { slug: 'repeat', sourcePath: 'content/posts/a.md' },
      { slug: 'repeat', sourcePath: 'content/posts/b.md' }
    ]);
  }, /duplicate slug/i);
});

test('loadPostFile parses front matter and renders markdown', () => {
  const post = loadPostFile(firstPostPath);

  assert.equal(post.slug, 'why-calm-interfaces-age-better-than-loud-ones');
  assert.match(post.html, /<h2>What tends to hold up<\/h2>/);
  assert.match(post.html, /<p>Loud interfaces get attention quickly/);
});

test('renderPostPage includes the shared shell and theme controls', () => {
  const html = renderPostPage({
    title: 'Sample',
    date: '2026-04-09',
    summary: 'Summary',
    slug: 'sample',
    html: '<p>Hello</p>'
  });

  assert.match(html, /data-theme-choice="light"/);
  assert.match(html, /Back to blog/);
  assert.match(html, /\.\.\/\.\.\/assets\/css\/site\.css/);
  assert.match(html, /<h1 id="post-title">Sample<\/h1>/);
});

test('renderArchivePage includes post cards that link to slug-based pages', () => {
  const html = renderArchivePage([
    {
      title: 'Sample',
      date: '2026-04-09',
      summary: 'Summary',
      slug: 'sample',
      html: '<p>Hello</p>'
    }
  ]);

  assert.match(html, /data-theme-choice="dark"/);
  assert.match(html, /Blog Archive/);
  assert.match(html, /posts\/sample\.html/);
  assert.match(html, /Read post/);
});

test('buildPostsSite writes archive and slug-based post pages and removes stale output', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-build-'));
  const contentDir = path.join(root, 'content/posts');
  const blogDir = path.join(root, 'blog');
  const postsDir = path.join(blogDir, 'posts');

  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(postsDir, { recursive: true });

  fs.writeFileSync(
    path.join(contentDir, '2026-04-09-sample-post.md'),
    [
      '---',
      'title: Sample Post',
      'date: 2026-04-09',
      'summary: A short summary for the generated archive.',
      'slug: sample-post',
      '---',
      '',
      '# Sample Post',
      '',
      'This is a generated post body.'
    ].join('\n')
  );

  fs.writeFileSync(path.join(postsDir, 'stale.html'), '<p>old</p>');

  const posts = await buildPostsSite({ contentDir, blogDir });

  assert.equal(posts.length, 1);
  assert.equal(fs.existsSync(path.join(blogDir, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(postsDir, 'sample-post.html')), true);
  assert.equal(fs.existsSync(path.join(postsDir, 'stale.html')), false);

  assert.match(fs.readFileSync(path.join(blogDir, 'index.html'), 'utf8'), /posts\/sample-post\.html/);
  assert.match(fs.readFileSync(path.join(postsDir, 'sample-post.html'), 'utf8'), /Sample Post/);
});

test('createPostDraft writes a dated markdown source file and does not overwrite', () => {
  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'post-draft-'));
  const result = createPostDraft({
    title: 'Generator Smoke Test',
    date: '2026-04-09',
    contentDir
  });

  assert.match(result.filePath, /2026-04-09-generator-smoke-test\.md$/);
  assert.match(fs.readFileSync(result.filePath, 'utf8'), /^---[\s\S]*summary:/);
  assert.equal(result.slug, 'generator-smoke-test');
  assert.throws(() => {
    createPostDraft({
      title: 'Generator Smoke Test',
      date: '2026-04-09',
      contentDir
    });
  }, /already exists/);
});
