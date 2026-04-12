const siteOwner = 'Jordan Carter';
const archiveDescription = 'Archive of placeholder notes and essays from a retro-CRT inspired portfolio site.';
const archiveIntro = 'This archive holds placeholder writing for a portfolio that treats notes and process as part of the work itself. Each post is a standalone static page, easy to maintain and fast to serve.';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDisplayDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${dateString}T00:00:00Z`));
}

function renderHeader({ homeHref, aboutHref, linksHref, blogHref, contactHref }) {
  return `
  <header class="site-header site-shell panel">
    <a class="brand" href="${homeHref}">PLAYER ONE</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="${aboutHref}">About</a>
      <a href="${linksHref}">Links</a>
      <a href="${blogHref}">Blog</a>
      <a href="${contactHref}">Contact</a>
    </nav>
    <div class="theme-switcher" role="group" aria-label="Theme">
      <button type="button" data-theme-choice="light" aria-pressed="false">Light</button>
      <button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button>
    </div>
  </header>`;
}

function renderFooter(homeHref, text = 'Return to the homepage') {
  return `
  <footer class="site-footer site-shell">
    <p><a href="${homeHref}">${text}</a></p>
  </footer>`;
}

function renderDocument({ title, description, stylesheetHref, scriptHref, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${stylesheetHref}">
  <script src="${scriptHref}" defer></script>
</head>
<body>
${body}
</body>
</html>
`;
}

export function renderPostPage(post) {
  const safeTitle = escapeHtml(post.title);
  const safeSummary = escapeHtml(post.summary);
  const displayDate = formatDisplayDate(post.date);

  return renderDocument({
    title: `${post.title} | ${siteOwner}`,
    description: post.summary,
    stylesheetHref: '../../assets/css/site.css',
    scriptHref: '../../assets/js/theme.js',
    body: `${renderHeader({
      homeHref: '../../',
      aboutHref: '../../index.html#about',
      linksHref: '../../index.html#links',
      blogHref: '../',
      contactHref: '../../index.html#contact'
    })}

  <main id="main-content" class="site-shell page-stack">
    <article class="post-layout panel" aria-labelledby="post-title">
      <p class="post-meta">${displayDate}</p>
      <h1 id="post-title">${safeTitle}</h1>
      <p class="post-summary">${safeSummary}</p>
      <div class="post-content">
${post.html}
      </div>
      <a class="back-link" href="../">Back to blog</a>
    </article>
  </main>
${renderFooter('../../')}`
  });
}

export function renderArchivePage(posts) {
  const cards = posts
    .map((post) => {
      const title = escapeHtml(post.title);
      const summary = escapeHtml(post.summary);
      const displayDate = formatDisplayDate(post.date);
      const href = `posts/${post.slug}.html`;

      return `        <article class="archive-card">
          <p class="post-meta">${displayDate}</p>
          <h2><a href="${href}">${title}</a></h2>
          <p>${summary}</p>
          <a class="back-link" href="${href}">Read post</a>
        </article>`;
    })
    .join('\n');

  return renderDocument({
    title: `Blog`,
    description: archiveDescription,
    stylesheetHref: '../assets/css/site.css',
    scriptHref: '../assets/js/theme.js',
    body: `${renderHeader({
      homeHref: '../',
      aboutHref: '../index.html#about',
      linksHref: '../index.html#links',
      blogHref: './',
      contactHref: '../index.html#contact'
    })}

  <main id="main-content" class="site-shell page-stack">
    <section class="archive-header panel" aria-labelledby="archive-title">
      <p class="eyebrow">Blog Archive</p>
      <h1 id="archive-title">Field notes, build logs, and small essays</h1>
      <p class="archive-intro">${escapeHtml(archiveIntro)}</p>
    </section>

    <section class="section-block panel" aria-labelledby="archive-list-title">
      <div class="section-heading">
        <p class="eyebrow">Entries</p>
        <h2 id="archive-list-title">Current posts</h2>
      </div>
      <div class="archive-list">
${cards}
      </div>
    </section>
  </main>
${renderFooter('../')}`
  });
}
