# csavoldi.github.io

Static personal portfolio and blog for GitHub Pages.

## Setup

Run `npm install` to install the local markdown authoring dependencies.

## Local Preview

From the repository root, start a simple static server with:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser to preview the site locally.

If you have changed any markdown posts, run `npm run build:posts` before refreshing so the generated blog pages stay in sync.

## Blog Authoring Workflow

Write source posts in `content/posts/` using markdown with this front matter:

```md
---
title: My Post Title
date: 2026-04-09
summary: A short summary for the archive and meta description.
slug: my-post-title
---
```

Create a new draft with:

```sh
npm run post:new -- "My New Post"
```

Delete a post by slug with:

```sh
npm run post:delete -- my-post-slug
```

This removes the source markdown file, rebuilds `blog/index.html`, and removes the generated post page automatically.

Rebuild the generated blog pages manually with:

```sh
npm run build:posts
```

Run the test suite with:

```sh
npm test
```

## Source vs Generated Files

Source content lives in `content/posts/*.md`.

Generated output lives in:
- `blog/index.html`
- `blog/posts/*.html`

Commit both the markdown source files and the generated HTML after creating, deleting, or editing posts.

## Notes

The homepage featured posts in `index.html` stay hand-curated. The build script only owns the blog archive and the individual post pages.
