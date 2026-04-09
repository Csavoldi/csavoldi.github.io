# Arcade Portfolio and Blog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static personal portfolio and resume homepage with a real blog, plus persistent light and dark CRT-inspired themes, on the `dev/arcade-portfolio-blog` branch.

**Architecture:** Keep the site as a small GitHub Pages-friendly static site with one homepage, one blog archive, two initial blog posts, one shared stylesheet, and one small shared theme script. Reuse the same header, navigation, and theme controls across pages so the experience feels cohesive and the maintenance surface stays small.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Git, GitHub Pages

---

## References

- Spec: `docs/superpowers/specs/2026-04-09-arcade-portfolio-blog-design.md`
- Project rules: `AGENTS.md`
- Existing entrypoint: `index.html`

## Planned File Map

- Modify: `index.html`
  Responsibility: portfolio landing page with hero, about, resume snapshot, links, featured posts, and contact.
- Create: `assets/css/site.css`
  Responsibility: shared theme tokens, layout, typography, CRT effects, responsive rules, and focus states.
- Create: `assets/js/theme.js`
  Responsibility: initialize theme from storage or system preference, handle theme button clicks, and sync active states.
- Create: `blog/index.html`
  Responsibility: blog archive page with post cards and shared site shell.
- Create: `blog/posts/first-post.html`
  Responsibility: first placeholder article using the shared site shell.
- Create: `blog/posts/second-post.html`
  Responsibility: second placeholder article using the shared site shell.

## Testing Strategy

This repo intentionally has no framework, package manager, or automated test runner. Verification should stay lightweight:

- Use command-line checks with `rg`, `git diff --check`, and `git status --short`.
- Use a local static server with `python3 -m http.server 4173` for browser checks.
- Manually verify navigation, theme persistence, readability, keyboard focus states, and responsive layout on the homepage, blog archive, and post pages.

## Chunk 1: Shared Foundation

### Task 1: Create the shared asset structure

**Files:**
- Create: `assets/css/site.css`
- Create: `assets/js/theme.js`
- Modify: `index.html`

- [ ] **Step 1: Confirm the current homepage is still the placeholder page**

Run: `rg -n 'Hello, internet|<style>|My Site' index.html`
Expected: matches from the starter page only.

- [ ] **Step 2: Create the shared asset directories**

Run: `mkdir -p assets/css assets/js blog/posts`
Expected: the command exits successfully and the directories exist.

- [ ] **Step 3: Replace inline asset usage in `index.html` with shared file references**

Add this page-shell wiring near the top of `index.html`:

```html
<link rel="stylesheet" href="assets/css/site.css">
<script src="assets/js/theme.js" defer></script>
```

Also remove the existing inline `<style>` block so `index.html` becomes the first consumer of the shared assets.

- [ ] **Step 4: Add the shared CSS token scaffold**

Start `assets/css/site.css` with the theme contract and global layout primitives:

```css
:root {
  color-scheme: light dark;
  --bg: #f2f5ef;
  --panel: rgba(255, 255, 255, 0.78);
  --text: #142218;
  --muted: #456154;
  --accent: #1f8f72;
  --accent-strong: #0e6b63;
  --border: rgba(20, 34, 24, 0.18);
  --shadow: 0 18px 48px rgba(8, 15, 12, 0.12);
}

:root[data-theme='dark'] {
  --bg: #07110d;
  --panel: rgba(7, 17, 13, 0.82);
  --text: #e6fff0;
  --muted: #8eb7a0;
  --accent: #6dffbd;
  --accent-strong: #a6ffe1;
  --border: rgba(109, 255, 189, 0.22);
  --shadow: 0 22px 60px rgba(0, 0, 0, 0.45);
}
```

Follow that with base rules for `body`, `a`, `img`, `.site-shell`, `.panel`, and `:focus-visible`.

- [ ] **Step 5: Add the shared theme script scaffold**

Start `assets/js/theme.js` with the storage and button contract:

```js
const STORAGE_KEY = 'site-theme';
const THEME_OPTIONS = new Set(['light', 'dark']);

function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (THEME_OPTIONS.has(saved)) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
```

Continue with `applyTheme(theme)` and `bindThemeButtons()` so every page can opt in by rendering buttons with `data-theme-choice` attributes.

- [ ] **Step 6: Verify the shared asset wiring exists**

Run: `rg -n 'assets/css/site.css|assets/js/theme.js|STORAGE_KEY|data-theme' index.html assets/css/site.css assets/js/theme.js`
Expected: matches in all three files, with no inline `<style>` block left in `index.html`.

- [ ] **Step 7: Commit the foundation scaffold**

```bash
git add index.html assets/css/site.css assets/js/theme.js
git commit -m "refactor: create shared site assets"
```

### Task 2: Establish the shared site shell and theme controls

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`
- Modify: `assets/js/theme.js`

- [ ] **Step 1: Add the shared header shell to `index.html`**

Add a reusable header pattern that later pages will copy:

```html
<header class="site-header panel">
  <a class="brand" href="/">PLAYER ONE</a>
  <nav class="site-nav" aria-label="Primary">
    <a href="#about">About</a>
    <a href="#links">Links</a>
    <a href="blog/">Blog</a>
    <a href="#contact">Contact</a>
  </nav>
  <div class="theme-switcher" role="group" aria-label="Theme">
    <button type="button" data-theme-choice="light">Light</button>
    <button type="button" data-theme-choice="dark">Dark</button>
  </div>
</header>
```

- [ ] **Step 2: Finish the button state logic in `assets/js/theme.js`**

Use this behavior contract:

```js
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    const active = button.dataset.themeChoice === theme;
    button.setAttribute('aria-pressed', String(active));
    button.dataset.active = String(active);
  });
}
```

Call `applyTheme(getPreferredTheme())` on load and attach click handlers that call `applyTheme()`.

- [ ] **Step 3: Style the site shell and the theme switcher**

Add rules for `.site-header`, `.site-nav`, `.brand`, `.theme-switcher`, and `.theme-switcher button[data-active='true']`.
Make the active state obvious with both color and shape changes, not color alone.

- [ ] **Step 4: Verify the site shell contract before more markup is added**

Run: `rg -n 'site-header|site-nav|theme-switcher|aria-pressed' index.html assets/css/site.css assets/js/theme.js`
Expected: each selector or attribute appears where intended.

- [ ] **Step 5: Do a quick browser smoke test on the current page shell**

Run in a separate terminal: `python3 -m http.server 4173`
Open: `http://127.0.0.1:4173/`
Expected: the page loads, the header appears, and clicking the theme buttons changes the page theme without console errors.

- [ ] **Step 6: Commit the shared shell and theme controls**

```bash
git add index.html assets/css/site.css assets/js/theme.js
git commit -m "feat: add shared header and theme controls"
```

## Chunk 2: Homepage Buildout

### Task 3: Replace the placeholder homepage with the portfolio landing page

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Confirm the required sections do not exist yet**

Run: `rg -n 'id="hero"|id="about"|id="resume"|id="links"|id="featured-posts"|id="contact"' index.html`
Expected: no matches or only partial work from the shell task.

- [ ] **Step 2: Replace the placeholder body copy with the final section structure**

Build `index.html` around a single `<main class="site-shell">` containing these panels in order:

```html
<section id="hero" class="hero panel">...</section>
<section id="about" class="panel">...</section>
<section id="resume" class="panel">...</section>
<section id="links" class="panel">...</section>
<section id="featured-posts" class="panel">...</section>
<section id="contact" class="panel">...</section>
```

- [ ] **Step 3: Add placeholder portfolio and resume content**

Use concise placeholder copy only. Include:
- one strong headline and one short intro in the hero
- a short about paragraph
- three resume sub-blocks for experience, skills, and education
- a list of external links with placeholder URLs such as `https://github.com/username`
- contact links using `mailto:` and placeholder socials

- [ ] **Step 4: Add the CRT-minimal homepage styling**

Add layout rules for `.hero`, `.hero-copy`, `.cta-row`, `.resume-grid`, `.link-grid`, `.post-grid`, and `.contact-list`.
Use subtle visual effects only: thin panel borders, restrained glow, and a faint background texture on the page root.

- [ ] **Step 5: Verify the homepage structure and anchors**

Run: `rg -n 'id="(hero|about|resume|links|featured-posts|contact)"|class="cta-row"|class="resume-grid"' index.html`
Expected: every required section and helper class is present.

- [ ] **Step 6: Manually verify homepage readability and navigation**

With the local server running, open `http://127.0.0.1:4173/` and confirm:
- the hero is the first visible section below the header
- `About`, `Links`, and `Contact` nav items jump to the correct anchors
- the page remains readable in both light and dark themes

- [ ] **Step 7: Commit the homepage buildout**

```bash
git add index.html assets/css/site.css
git commit -m "feat: build portfolio homepage"
```

### Task 4: Wire the homepage featured-post section to real blog destinations

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Add two or three featured-post cards to the homepage**

Use a structure like:

```html
<article class="post-card">
  <p class="eyebrow">Featured Post</p>
  <h3><a href="blog/posts/first-post.html">First Post Title</a></h3>
  <p>One-sentence summary for the placeholder post.</p>
</article>
```

- [ ] **Step 2: Add hover and focus styles for post cards**

Style `.post-card`, `.post-card h3 a`, and `.post-card:focus-within` so the cards feel interactive without relying on heavy animation.

- [ ] **Step 3: Verify every homepage blog link targets a page that will exist**

Run: `rg -n 'blog/|blog/posts/' index.html`
Expected: links point only to `blog/`, `blog/posts/first-post.html`, and `blog/posts/second-post.html`.

- [ ] **Step 4: Commit the featured-post wiring**

```bash
git add index.html assets/css/site.css
git commit -m "feat: add homepage featured posts"
```

## Chunk 3: Blog Pages

### Task 5: Build the blog archive page

**Files:**
- Create: `blog/index.html`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Create `blog/index.html` with the shared shell**

Reuse the same header pattern as the homepage, but adjust asset paths:

```html
<link rel="stylesheet" href="../assets/css/site.css">
<script src="../assets/js/theme.js" defer></script>
```

Keep the header links valid from the `blog/` directory.

- [ ] **Step 2: Add the archive intro and post listing markup**

Include:
- an archive heading and short intro
- two post preview cards with title, date, summary, and `Read post` links
- a path back to the homepage

- [ ] **Step 3: Add blog-archive layout styling**

Style `.archive-header`, `.archive-list`, and any blog-specific spacing helpers in `assets/css/site.css`.
Keep the cards visually consistent with the homepage panels.

- [ ] **Step 4: Verify relative paths and archive links**

Run: `rg -n '../assets|posts/first-post.html|posts/second-post.html|href="../#contact"|href="../index.html"' blog/index.html`
Expected: all asset and navigation paths are valid from the `blog/` directory.

- [ ] **Step 5: Browser-check the archive page**

Open: `http://127.0.0.1:4173/blog/`
Expected: shared header loads correctly, the theme buttons still work, and both post cards link to post pages.

- [ ] **Step 6: Commit the blog archive page**

```bash
git add blog/index.html assets/css/site.css
git commit -m "feat: add static blog archive"
```

### Task 6: Create the initial blog post pages

**Files:**
- Create: `blog/posts/first-post.html`
- Create: `blog/posts/second-post.html`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Create `blog/posts/first-post.html` using the shared page shell**

Use these relative shared assets:

```html
<link rel="stylesheet" href="../../assets/css/site.css">
<script src="../../assets/js/theme.js" defer></script>
```

Add a simple article structure with title, publication date, short body copy, and a `Back to blog` link.

- [ ] **Step 2: Create `blog/posts/second-post.html` with the same structure**

Change the title, date, summary, and article body so the archive does not look duplicated.

- [ ] **Step 3: Add article-specific styling**

Add rules for `.post-layout`, `.post-meta`, `.post-content`, and `.back-link`.
Keep the reading width comfortable and preserve strong contrast in both themes.

- [ ] **Step 4: Verify both post pages reference the shared assets and shared navigation**

Run: `rg -n '../../assets|Back to blog|article class="post-layout"|data-theme-choice' blog/posts/*.html`
Expected: both post files contain the shared shell and article structure.

- [ ] **Step 5: Browser-check both posts and cross-page navigation**

Open:
- `http://127.0.0.1:4173/blog/posts/first-post.html`
- `http://127.0.0.1:4173/blog/posts/second-post.html`

Expected: each post loads with the shared styling, each `Back to blog` link works, and navigation still reaches the homepage.

- [ ] **Step 6: Commit the initial post pages**

```bash
git add blog/posts/first-post.html blog/posts/second-post.html assets/css/site.css
git commit -m "feat: add initial blog posts"
```

## Chunk 4: Polish and Verification

### Task 7: Finalize responsive behavior, accessibility, and theme persistence

**Files:**
- Modify: `index.html`
- Modify: `blog/index.html`
- Modify: `blog/posts/first-post.html`
- Modify: `blog/posts/second-post.html`
- Modify: `assets/css/site.css`
- Modify: `assets/js/theme.js`

- [ ] **Step 1: Ensure theme controls exist on every page**

Run: `rg -n 'data-theme-choice="light"|data-theme-choice="dark"' index.html blog/index.html blog/posts/*.html`
Expected: both buttons appear on the homepage, archive, and both post pages.

- [ ] **Step 2: Add or adjust accessibility affordances**

Confirm and refine:
- semantic landmarks (`header`, `main`, `nav`, `section`, `article`, `footer` if added)
- visible `:focus-visible` styles
- active theme button states using `aria-pressed`
- descriptive link text for blog and contact links

- [ ] **Step 3: Add responsive CSS breakpoints only where the layout actually needs them**

Use small-screen-first rules and add wider breakpoints only for:
- multi-column resume blocks
- link or post grids
- header layout refinement

Keep the CSS DRY and avoid one-off breakpoints.

- [ ] **Step 4: Run command-line hygiene checks**

Run: `git diff --check`
Expected: no trailing-whitespace or malformed patch warnings.

Run: `rg -n '<style>|TODO|href="#"' index.html blog/index.html blog/posts/*.html assets/css/site.css assets/js/theme.js`
Expected: no inline styles, no TODO markers, and no dead placeholder `#` links.

- [ ] **Step 5: Run the full manual QA pass**

With the local server running, verify all of the following:
- homepage, archive, and both posts load without broken styling
- light and dark themes both render legibly
- selecting a theme on one page persists when navigating to another page and when refreshing
- keyboard focus can reach nav links, theme buttons, post links, and contact links
- the layout remains readable at approximately `375px`, `768px`, and `1280px` widths

- [ ] **Step 6: Commit the final polish**

```bash
git add index.html blog/index.html blog/posts/first-post.html blog/posts/second-post.html assets/css/site.css assets/js/theme.js
git commit -m "feat: finish arcade portfolio and blog"
```

### Task 8: Prepare the branch for review and merge

**Files:**
- No content changes required unless QA finds issues.

- [ ] **Step 1: Confirm the branch and worktree state**

Run: `git branch --show-current && git status --short`
Expected: branch is `dev/arcade-portfolio-blog` and the working tree is clean.

- [ ] **Step 2: Review the change summary before asking for merge approval**

Run: `git log --oneline --decorate -5`
Expected: the latest commits correspond to the implementation sequence above.

- [ ] **Step 3: Capture a final review checklist for the user**

Be ready to show:
- which files were added
- which files were modified
- how to preview the site locally
- what still uses placeholder content

- [ ] **Step 4: Stop before merging to `main`**

Do not merge until the user explicitly says the site looks right.
