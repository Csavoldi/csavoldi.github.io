import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildPostsSite } from '../scripts/lib/build.mjs';
import {
  assertUniqueSlugs,
  assertValidFrontMatter,
  createPostDraft,
  deletePostBySlug,
  loadPostFile,
  slugifyTitle
} from '../scripts/lib/posts.mjs';
import { renderArchivePage, renderPostPage } from '../scripts/lib/templates.mjs';

const siteCssPath = path.resolve(process.cwd(), 'assets/css/site.css');

function writePostSource(contentDir, {
  title = 'Sample Post',
  date = '2026-04-09',
  summary = 'A short summary for the generated archive.',
  slug = 'sample-post',
  body = '# Sample Post\n\nThis is a generated post body.'
} = {}) {
  fs.mkdirSync(contentDir, { recursive: true });

  const filePath = path.join(contentDir, `${date}-${slug}.md`);
  fs.writeFileSync(
    filePath,
    [
      '---',
      `title: ${title}`,
      `date: ${date}`,
      `summary: ${summary}`,
      `slug: ${slug}`,
      '---',
      '',
      body,
      ''
    ].join('\n')
  );

  return filePath;
}

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
  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-post-'));
  const sourcePath = writePostSource(contentDir, {
    title: 'Fixture Post',
    slug: 'fixture-post',
    body: 'Fixture intro.\n\n## What tends to hold up\n\nUseful copy.'
  });

  const post = loadPostFile(sourcePath);

  assert.equal(post.slug, 'fixture-post');
  assert.match(post.html, /<h2>What tends to hold up<\/h2>/);
  assert.match(post.html, /<p>Fixture intro\.<\/p>/);
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

test('site header CSS allows the top-right theme switcher to stay on screen', () => {
  const css = fs.readFileSync(siteCssPath, 'utf8');
  const siteHeaderRule = css.match(/\.site-header\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const themeSwitcherRule = css.match(/\.theme-switcher\s*\{[\s\S]*?\}/)?.[0] ?? '';

  assert.match(siteHeaderRule, /flex-wrap:\s*wrap;/);
  assert.match(themeSwitcherRule, /max-width:\s*100%;/);
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

  fs.mkdirSync(postsDir, { recursive: true });
  writePostSource(contentDir);
  fs.writeFileSync(path.join(postsDir, 'stale.html'), '<p>old</p>');

  const posts = await buildPostsSite({ contentDir, blogDir });

  assert.equal(posts.length, 1);
  assert.equal(fs.existsSync(path.join(blogDir, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(postsDir, 'sample-post.html')), true);
  assert.equal(fs.existsSync(path.join(postsDir, 'stale.html')), false);

  assert.match(fs.readFileSync(path.join(blogDir, 'index.html'), 'utf8'), /posts\/sample-post\.html/);
  assert.match(fs.readFileSync(path.join(postsDir, 'sample-post.html'), 'utf8'), /Sample Post/);
});

test('deletePostBySlug removes the matching markdown source and rejects missing slugs', () => {
  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'delete-post-'));
  const sourcePath = writePostSource(contentDir, {
    title: 'Delete Me',
    slug: 'delete-me'
  });

  const result = deletePostBySlug({ slug: 'delete-me', contentDir });

  assert.equal(result.slug, 'delete-me');
  assert.equal(result.filePath, sourcePath);
  assert.equal(fs.existsSync(sourcePath), false);
  assert.throws(() => deletePostBySlug({ slug: 'missing-post', contentDir }), /No post found/i);
});

test('deletePostBySlug plus rebuild removes generated pages and archive entries', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'delete-build-'));
  const contentDir = path.join(root, 'content/posts');
  const blogDir = path.join(root, 'blog');
  const postsDir = path.join(blogDir, 'posts');

  writePostSource(contentDir, {
    title: 'Keep Me',
    slug: 'keep-me'
  });
  writePostSource(contentDir, {
    title: 'Delete Me',
    slug: 'delete-me'
  });

  await buildPostsSite({ contentDir, blogDir });

  deletePostBySlug({ slug: 'delete-me', contentDir });
  await buildPostsSite({ contentDir, blogDir });

  const archiveHtml = fs.readFileSync(path.join(blogDir, 'index.html'), 'utf8');

  assert.equal(fs.existsSync(path.join(postsDir, 'delete-me.html')), false);
  assert.equal(fs.existsSync(path.join(postsDir, 'keep-me.html')), true);
  assert.doesNotMatch(archiveHtml, /delete-me\.html/);
  assert.match(archiveHtml, /keep-me\.html/);
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
