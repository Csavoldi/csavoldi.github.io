# Markdown Post Authoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a markdown-based authoring workflow that scaffolds new posts, rebuilds the blog archive and post pages into committed static HTML, and keeps the current homepage hand-curated.

**Architecture:** Introduce a small Node-based authoring toolchain alongside the existing static site. Markdown files in `content/posts/` become the source of truth, thin generator scripts render HTML through shared templates, and the generated archive plus post pages are committed back into `blog/` so GitHub Pages can continue serving plain static files.

**Tech Stack:** Node.js, npm, `gray-matter`, `markdown-it`, built-in `node:test`, HTML, CSS, vanilla JavaScript

---

## References

- Spec: `docs/superpowers/specs/2026-04-09-markdown-post-authoring-design.md`
- Existing site shell: `index.html`, `blog/index.html`, `blog/posts/first-post.html`, `blog/posts/second-post.html`
- Shared assets: `assets/css/site.css`, `assets/js/theme.js`
- Project rules: `AGENTS.md`

## Planned File Map

- Modify: `.gitignore`
  Responsibility: ignore `node_modules/` while preserving the existing `.worktrees/` rule.
- Create: `package.json`
  Responsibility: define the Node authoring scripts and small dependencies.
- Create: `package-lock.json`
  Responsibility: lock the dependency graph for reproducible builds.
- Create: `content/posts/2026-04-09-why-calm-interfaces-age-better-than-loud-ones.md`
  Responsibility: markdown source for the migrated first post.
- Create: `content/posts/2026-04-08-shipping-a-tiny-static-site-with-a-big-point-of-view.md`
  Responsibility: markdown source for the migrated second post.
- Create: `scripts/lib/posts.mjs`
  Responsibility: slug generation, front matter validation, post loading, and new-post scaffolding helpers.
- Create: `scripts/lib/templates.mjs`
  Responsibility: shared HTML template functions for the archive and individual post pages.
- Create: `scripts/lib/build.mjs`
  Responsibility: orchestrate archive and post page generation, including stale generated-file cleanup.
- Create: `scripts/build-posts.mjs`
  Responsibility: CLI entrypoint for rebuilding the archive and post pages.
- Create: `scripts/new-post.mjs`
  Responsibility: CLI entrypoint for scaffolding a new markdown post.
- Create: `tests/posts.test.mjs`
  Responsibility: verify slug behavior, metadata validation, rendering, archive generation, cleanup, and new-post scaffolding.
- Modify: `blog/index.html`
  Responsibility: generated archive output owned by the build script.
- Delete/Replace: `blog/posts/first-post.html`
  Responsibility: remove the legacy hand-authored placeholder once slug-based generated output exists.
- Delete/Replace: `blog/posts/second-post.html`
  Responsibility: remove the legacy hand-authored placeholder once slug-based generated output exists.
- Create: `blog/posts/why-calm-interfaces-age-better-than-loud-ones.html`
  Responsibility: generated slug-based post output.
- Create: `blog/posts/shipping-a-tiny-static-site-with-a-big-point-of-view.html`
  Responsibility: generated slug-based post output.
- Modify: `index.html`
  Responsibility: keep featured-post links hand-curated, but update them to the generator-owned slug paths.
- Modify: `README.md`
  Responsibility: document install, `post:new`, `build:posts`, and source-versus-generated ownership.

## Testing Strategy

Use lightweight automated tests plus build verification:

- `npm test` with Node’s built-in test runner for helper logic and end-to-end generator behavior.
- `npm run build:posts` to regenerate archive and post pages from markdown.
- `git diff --check` for whitespace and patch hygiene.
- `rg` checks for generated slug paths and markdown front matter presence.

## Chunk 1: Tooling and Metadata Helpers

### Task 1: Bootstrap the Node authoring toolchain

**Files:**
- Modify: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tests/posts.test.mjs`
- Create: `scripts/lib/posts.mjs`

- [ ] **Step 1: Extend `.gitignore` for Node tooling**

Update `.gitignore` so it contains at least:

```gitignore
.worktrees/
node_modules/
```

- [ ] **Step 2: Create `package.json` with the authoring scripts and dependencies**

Start with:

```json
{
  "name": "csavoldi.github.io",
  "private": true,
  "type": "module",
  "scripts": {
    "build:posts": "node scripts/build-posts.mjs",
    "post:new": "node scripts/new-post.mjs",
    "test": "node --test"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "markdown-it": "^14.1.0"
  }
}
```

- [ ] **Step 3: Install dependencies and generate `package-lock.json`**

Run: `npm install`
Expected: `node_modules/` is created locally and `package-lock.json` is written.

- [ ] **Step 4: Write the first failing metadata tests in `tests/posts.test.mjs`**

Use Node’s built-in test runner and target the helper API you want in `scripts/lib/posts.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { slugifyTitle, assertValidFrontMatter, assertUniqueSlugs } from '../scripts/lib/posts.mjs';

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
```

- [ ] **Step 5: Run the tests to confirm they fail before implementation**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` or missing export errors for `scripts/lib/posts.mjs`.

- [ ] **Step 6: Implement the minimal metadata helpers in `scripts/lib/posts.mjs`**

Create the module with these exports and behavior:

```js
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
```

- [ ] **Step 7: Run the tests again and confirm the helper layer passes**

Run: `npm test`
Expected: PASS for the slug and metadata validation tests.

- [ ] **Step 8: Commit the tooling foundation**

```bash
git add .gitignore package.json package-lock.json tests/posts.test.mjs scripts/lib/posts.mjs
git commit -m "feat: add markdown authoring toolchain"
```

## Chunk 2: Markdown Sources and Shared Templates

### Task 2: Migrate the existing posts into markdown source files

**Files:**
- Create: `content/posts/2026-04-09-why-calm-interfaces-age-better-than-loud-ones.md`
- Create: `content/posts/2026-04-08-shipping-a-tiny-static-site-with-a-big-point-of-view.md`

- [ ] **Step 1: Create the markdown source directory**

Run: `mkdir -p content/posts`
Expected: the directory exists and is ready for source posts.

- [ ] **Step 2: Migrate the first placeholder post into markdown**

Create `content/posts/2026-04-09-why-calm-interfaces-age-better-than-loud-ones.md` with front matter and markdown body:

```md
---
title: Why calm interfaces age better than loud ones
date: 2026-04-09
summary: A placeholder note on why pacing, clarity, and legibility usually outlast trend-driven flash.
slug: why-calm-interfaces-age-better-than-loud-ones
---

Loud interfaces get attention quickly, but they often become tiring just as fast.

## What tends to hold up

In practice, the interfaces that age well usually share the same traits: strong information structure, readable text, deliberate spacing, and a small set of visual rules repeated consistently.
```

- [ ] **Step 3: Migrate the second placeholder post into markdown**

Create `content/posts/2026-04-08-shipping-a-tiny-static-site-with-a-big-point-of-view.md` with matching front matter and markdown body.
Use the same post text already present in the HTML placeholder as the source content.

- [ ] **Step 4: Write failing rendering tests for markdown parsing and HTML shell output**

Extend `tests/posts.test.mjs` to target a richer helper API:

```js
import { loadPostFile } from '../scripts/lib/posts.mjs';
import { renderPostPage, renderArchivePage } from '../scripts/lib/templates.mjs';

test('loadPostFile parses front matter and renders markdown', () => {
  const post = loadPostFile('content/posts/2026-04-09-why-calm-interfaces-age-better-than-loud-ones.md');
  assert.equal(post.slug, 'why-calm-interfaces-age-better-than-loud-ones');
  assert.match(post.html, /<h2>What tends to hold up<\/h2>/);
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
  assert.match(html, /assets\/css\/site\.css/);
});
```

- [ ] **Step 5: Run the rendering tests and confirm they fail**

Run: `npm test`
Expected: FAIL because `loadPostFile`, `renderPostPage`, and `renderArchivePage` do not exist yet.

- [ ] **Step 6: Implement markdown loading in `scripts/lib/posts.mjs`**

Add `gray-matter` and `markdown-it` integration:

```js
import fs from 'node:fs';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function loadPostFile(sourcePath) {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const { data, content } = matter(raw);
  const post = {
    title: String(data.title ?? '').trim(),
    date: String(data.date ?? '').trim(),
    summary: String(data.summary ?? '').trim(),
    slug: String(data.slug ?? '').trim(),
    sourcePath,
    body: content.trim(),
    html: md.render(content)
  };

  assertValidFrontMatter(post, sourcePath);
  return post;
}
```

- [ ] **Step 7: Implement `scripts/lib/templates.mjs` for the shared archive and post shell**

Create template functions that reuse the current site shell structure:

```js
function renderHeader(prefix) {
  return `
  <header class="site-header site-shell panel">
    <a class="brand" href="${prefix}">PLAYER ONE</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="${prefix}index.html#about">About</a>
      <a href="${prefix}index.html#links">Links</a>
      <a href="${prefix}blog/">Blog</a>
      <a href="${prefix}index.html#contact">Contact</a>
    </nav>
    <div class="theme-switcher" role="group" aria-label="Theme">
      <button type="button" data-theme-choice="light" aria-pressed="false">Light</button>
      <button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button>
    </div>
  </header>`;
}
```

Also export `renderPostPage(post)` and `renderArchivePage(posts)` using the same header, shared assets, and footer structure the site already uses.

- [ ] **Step 8: Run the tests again and confirm the markdown/template layer passes**

Run: `npm test`
Expected: PASS for the new parsing and rendering tests.

- [ ] **Step 9: Commit the migrated markdown sources and template layer**

```bash
git add content/posts scripts/lib/posts.mjs scripts/lib/templates.mjs tests/posts.test.mjs
git commit -m "feat: add markdown sources and templates"
```

## Chunk 3: Archive and Post Generation

### Task 3: Implement the build pipeline and replace the hand-authored blog output

**Files:**
- Create: `scripts/lib/build.mjs`
- Create: `scripts/build-posts.mjs`
- Modify: `tests/posts.test.mjs`
- Modify: `blog/index.html`
- Delete/Replace: `blog/posts/first-post.html`
- Delete/Replace: `blog/posts/second-post.html`
- Create: `blog/posts/why-calm-interfaces-age-better-than-loud-ones.html`
- Create: `blog/posts/shipping-a-tiny-static-site-with-a-big-point-of-view.html`
- Modify: `index.html`

- [ ] **Step 1: Write a failing integration test for end-to-end generation**

Extend `tests/posts.test.mjs` with a temp-directory build test:

```js
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { buildPostsSite } from '../scripts/lib/build.mjs';

test('buildPostsSite writes archive and slug-based post pages', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-build-'));
  // create temp content/posts fixture here
  await buildPostsSite({
    contentDir: path.join(root, 'content/posts'),
    blogDir: path.join(root, 'blog')
  });

  assert.equal(fs.existsSync(path.join(root, 'blog/index.html')), true);
  assert.equal(
    fs.existsSync(path.join(root, 'blog/posts/sample-post.html')),
    true
  );
});
```

Add a stale-file assertion too: the build should remove an old generated post HTML file that no longer has a source markdown file.

- [ ] **Step 2: Run the tests and confirm the build layer fails before implementation**

Run: `npm test`
Expected: FAIL because `scripts/lib/build.mjs` and `buildPostsSite` do not exist yet.

- [ ] **Step 3: Implement `buildPostsSite` in `scripts/lib/build.mjs`**

The build flow should:

```js
export async function buildPostsSite({ contentDir = 'content/posts', blogDir = 'blog' } = {}) {
  const posts = loadAllPosts(contentDir).sort((a, b) => b.date.localeCompare(a.date));
  assertUniqueSlugs(posts);

  fs.mkdirSync(path.join(blogDir, 'posts'), { recursive: true });

  // remove stale generated output before rewriting
  for (const file of fs.readdirSync(path.join(blogDir, 'posts'))) {
    if (file.endsWith('.html')) {
      fs.rmSync(path.join(blogDir, 'posts', file));
    }
  }

  fs.writeFileSync(path.join(blogDir, 'index.html'), renderArchivePage(posts));
  for (const post of posts) {
    fs.writeFileSync(
      path.join(blogDir, 'posts', `${post.slug}.html`),
      renderPostPage(post)
    );
  }

  return posts;
}
```

Use a stricter stale cleanup if needed, but the end state should reflect generator ownership of normal post output.

- [ ] **Step 4: Implement the CLI entrypoint in `scripts/build-posts.mjs`**

Keep it thin:

```js
import { buildPostsSite } from './lib/build.mjs';

await buildPostsSite();
console.log('Blog archive and post pages rebuilt.');
```

- [ ] **Step 5: Run the full test suite and confirm the generator passes**

Run: `npm test`
Expected: PASS for helper, rendering, and end-to-end build tests.

- [ ] **Step 6: Build the real site output**

Run: `npm run build:posts`
Expected:
- `blog/index.html` is regenerated from markdown metadata
- `blog/posts/why-calm-interfaces-age-better-than-loud-ones.html` exists
- `blog/posts/shipping-a-tiny-static-site-with-a-big-point-of-view.html` exists
- legacy `blog/posts/first-post.html` and `blog/posts/second-post.html` are removed

- [ ] **Step 7: Update the homepage featured-post links to the generated slug paths**

Modify `index.html` so the hand-curated featured cards point to:

```html
<a href="blog/posts/why-calm-interfaces-age-better-than-loud-ones.html">...</a>
<a href="blog/posts/shipping-a-tiny-static-site-with-a-big-point-of-view.html">...</a>
```

Keep the section hand-authored; only fix the links to the new generator-owned outputs.

- [ ] **Step 8: Verify the generated paths are consistent**

Run: `rg -n 'why-calm-interfaces-age-better-than-loud-ones|shipping-a-tiny-static-site-with-a-big-point-of-view' index.html blog/index.html blog/posts/*.html`
Expected: the homepage, archive, and both generated post pages all reference the slug-based paths.

- [ ] **Step 9: Commit the build pipeline and generated output**

```bash
git add scripts/lib/build.mjs scripts/build-posts.mjs tests/posts.test.mjs blog/index.html blog/posts index.html
git commit -m "feat: generate blog pages from markdown"
```

## Chunk 4: New Post Scaffolding and Docs

### Task 4: Implement the `new post` scaffold command and document the workflow

**Files:**
- Create: `scripts/new-post.mjs`
- Modify: `scripts/lib/posts.mjs`
- Modify: `tests/posts.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Write a failing test for new-post scaffolding**

Add a helper-focused test so the CLI can stay thin:

```js
import { createPostDraft } from '../scripts/lib/posts.mjs';

test('createPostDraft writes a dated markdown source file and does not overwrite', () => {
  const result = createPostDraft({
    title: 'Generator Smoke Test',
    date: '2026-04-09',
    contentDir: tempDir
  });

  assert.match(result.filePath, /2026-04-09-generator-smoke-test\.md$/);
  assert.match(fs.readFileSync(result.filePath, 'utf8'), /^---[\s\S]*summary:/);
  assert.throws(() => createPostDraft({ title: 'Generator Smoke Test', date: '2026-04-09', contentDir: tempDir }), /already exists/);
});
```

- [ ] **Step 2: Run the tests and confirm the scaffolding test fails**

Run: `npm test`
Expected: FAIL because `createPostDraft` is not implemented yet.

- [ ] **Step 3: Implement `createPostDraft` in `scripts/lib/posts.mjs`**

Use a helper like:

```js
export function createPostDraft({ title, date, contentDir = 'content/posts' }) {
  const slug = slugifyTitle(title);
  const filePath = path.join(contentDir, `${date}-${slug}.md`);
  if (fs.existsSync(filePath)) {
    throw new Error(`Post already exists: ${filePath}`);
  }

  const draft = `---\ntitle: ${title}\ndate: ${date}\nsummary: Replace this summary before publishing.\nslug: ${slug}\n---\n\n# ${title}\n\nStart writing here.\n`;

  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(filePath, draft);
  return { filePath, slug };
}
```

- [ ] **Step 4: Implement the CLI entrypoint in `scripts/new-post.mjs`**

Keep the CLI simple and user-facing:

```js
import { createPostDraft } from './lib/posts.mjs';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  throw new Error('Usage: npm run post:new -- "My New Post"');
}

const today = new Date().toISOString().slice(0, 10);
const result = createPostDraft({ title, date: today });
console.log(`Created ${result.filePath}`);
```

- [ ] **Step 5: Update `README.md` with the authoring workflow**

Document:
- `npm install`
- `npm run post:new -- "My New Post"`
- `npm run build:posts`
- source files in `content/posts/`
- generated files in `blog/` and `blog/posts/`
- the expectation to commit both source and generated output

- [ ] **Step 6: Run the full test suite again**

Run: `npm test`
Expected: PASS, including the new-post scaffolding tests.

- [ ] **Step 7: Commit the scaffolding command and docs**

```bash
git add scripts/new-post.mjs scripts/lib/posts.mjs tests/posts.test.mjs README.md
git commit -m "feat: add markdown post scaffolding"
```

## Chunk 5: Final Verification

### Task 5: Verify the complete markdown authoring workflow end to end

**Files:**
- Modify as needed if verification reveals issues.

- [ ] **Step 1: Run the complete automated test suite fresh**

Run: `npm test`
Expected: PASS with zero failing tests.

- [ ] **Step 2: Rebuild the real blog output fresh**

Run: `npm run build:posts`
Expected: the archive and the slug-based post pages are regenerated from the markdown sources without errors.

- [ ] **Step 3: Confirm the markdown source files contain the required front matter**

Run: `rg -n '^title: |^date: |^summary: |^slug: ' content/posts/*.md`
Expected: each source file includes all four required fields.

- [ ] **Step 4: Run repository hygiene checks**

Run: `git diff --check`
Expected: no whitespace or malformed patch issues.

Run: `rg -n 'first-post\.html|second-post\.html|href="#"|TODO' index.html blog/index.html blog/posts/*.html README.md scripts tests content`
Expected: no legacy placeholder post filenames, dead `href="#"` links, or `TODO` markers remain.

- [ ] **Step 5: Review the final working tree and changed files**

Run: `git status --short`
Expected: only the intended markdown authoring, README, and generated blog files are modified.

- [ ] **Step 6: Commit final cleanup if needed**

```bash
git add .
git commit -m "chore: finalize markdown post workflow"
```

- [ ] **Step 7: Stop and report the result for review**

Be ready to summarize:
- how to create a new post
- how to rebuild the blog
- which files are source content versus generated output
- that the homepage featured posts remain hand-curated
