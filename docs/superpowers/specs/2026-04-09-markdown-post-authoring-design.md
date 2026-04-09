# Markdown Post Authoring Design

Date: 2026-04-09
Branch: `dev/arcade-portfolio-blog-impl`
Status: Approved for planning, pending implementation

## Overview

Add a lightweight markdown-based authoring workflow for blog posts so new writing does not require hand-writing HTML. The site should keep shipping as plain static HTML on GitHub Pages, but authors should be able to create posts from markdown source files and regenerate the archive and post pages with a simple local command.

The design goal is to provide a Jekyll-like editing experience without turning the site into a full static-site generator or changing the current deployment model.

## Goals

- Make blog posts authorable in markdown instead of raw HTML.
- Add a `new post` command to scaffold a markdown file with required metadata.
- Add a `build posts` command to regenerate the blog archive and individual post pages.
- Keep the published site fully static and compatible with GitHub Pages.
- Commit generated HTML output into the repository so no hosting-side build step is required.
- Preserve the current shared header, navigation, theme controls, and visual language for generated pages.

## Non-Goals

- Do not convert the whole site to a framework or a full static-site generator.
- Do not auto-generate the homepage featured-post section.
- Do not add CMS behavior, remote authoring, or browser-side markdown rendering.
- Do not support every markdown extension in the first version.
- Do not introduce a GitHub Actions deployment build unless explicitly requested later.

## User Experience

The writing workflow should feel like this:

1. Run a command to scaffold a new post from a title.
2. Open the generated markdown file in the editor.
3. Write content in markdown with minimal front matter.
4. Run one build command.
5. Commit both the markdown source and the generated HTML output.

The author should not need to manually edit `blog/index.html` or hand-craft `blog/posts/*.html` for normal publishing.

## Authoring Model

### Source of Truth

Markdown files under `content/posts/*.md` are the source of truth for blog content.

Generated files under `blog/` and `blog/posts/` are build artifacts derived from those markdown sources, but they are still committed to git because the live site is static.

### Front Matter

Each markdown file uses minimal front matter:

- `title`
- `date`
- `summary`
- `slug`

Example:

```md
---
title: Why calm interfaces age better than loud ones
date: 2026-04-09
summary: A short note about restraint, readability, and interface longevity.
slug: why-calm-interfaces-age-better-than-loud-ones
---

# Intro

Markdown body goes here.
```

### Slug Behavior

A slug is the URL-safe identifier for a post. It becomes the generated filename and part of the permanent path.

Example:

- title: `Why calm interfaces age better than loud ones`
- slug: `why-calm-interfaces-age-better-than-loud-ones`
- output: `blog/posts/why-calm-interfaces-age-better-than-loud-ones.html`

The `new post` command should auto-generate the slug from the title so the author rarely needs to edit it manually.

## Commands

### New Post Command

Command shape:

```bash
npm run post:new -- "My New Post"
```

Responsibilities:

- Create a new markdown file in `content/posts/`.
- Auto-fill front matter with:
  - title from the command argument
  - date using the current local date in `YYYY-MM-DD`
  - summary placeholder text for the author to replace
  - slug derived from the title
- Generate a stable filename based on the date and slug.
- Refuse to overwrite an existing file if the target path already exists.

Suggested source filename shape:

```text
content/posts/2026-04-09-my-new-post.md
```

### Build Posts Command

Command shape:

```bash
npm run build:posts
```

Responsibilities:

- Read all markdown files in `content/posts/`.
- Parse and validate front matter.
- Convert markdown bodies to HTML.
- Regenerate `blog/index.html`.
- Regenerate all post pages in `blog/posts/`.
- Fail with clear errors if metadata is missing, malformed, or duplicated.

## Content Features

The first version should support standard writing features:

- headings
- paragraphs
- links
- lists
- emphasis
- code blocks
- blockquotes
- images

This is intentionally broader than plain text posts, but narrower than a documentation-oriented markdown system with tables or footnotes.

## Technical Approach

### Runtime

Use Node.js for the authoring tooling.

### Dependencies

Use small focused dependencies rather than a framework. Likely choices:

- `gray-matter` for front matter parsing
- `markdown-it` for markdown-to-HTML conversion

The implementation should keep the dependency surface small and understandable.

### File Structure

```text
/
  package.json
  content/
    posts/
      2026-04-09-example-post.md
  scripts/
    new-post.mjs
    build-posts.mjs
    lib/
      templates.mjs
      posts.mjs
  blog/
    index.html
    posts/
      example-post.html
```

Exact helper module names may shift during implementation, but responsibilities should stay separated.

### Shared Template Reuse

Generated pages should reuse the structure already established in the site:

- shared header
- nav links
- theme buttons
- footer
- shared CSS and JavaScript assets

The generator should not duplicate styling logic. It should output HTML that consumes the existing shared site shell and assets.

## Archive Generation

The generator owns `blog/index.html`.

It should:

- collect all posts from markdown source files
- sort them by date descending
- render archive cards using `title`, `date`, `summary`, and `slug`
- link each entry to the corresponding generated page under `blog/posts/`

The archive becomes generated content rather than a hand-maintained page.

## Individual Post Generation

The generator owns the blog post HTML pages corresponding to markdown sources.

Each generated page should include:

- document title and meta description
- shared site header and theme controls
- post date
- post title
- post summary
- rendered markdown body
- back link to the archive
- footer

Generated post paths should use the slug-based filename under `blog/posts/`.

## Ownership Rules

The generator should be treated as the owner of normal blog post output in `blog/posts/`.

Rationale:

- mixed manual and generated ownership in the same output folder becomes confusing quickly
- a single source of truth is easier to maintain
- authors should edit markdown, not the generated HTML

If the repo already contains legacy hand-authored posts, the implementation should either migrate them into markdown sources or define a clear rule for preserving non-generated files. The preferred direction is to migrate toward generator-owned post pages.

## Homepage Interaction

The homepage `Featured Posts` section remains hand-curated.

The generator should not rewrite `index.html` in the first version. This keeps editorial control over which posts appear there and avoids unnecessary coupling between the blog build tool and the homepage content.

## Validation and Error Handling

The build should fail loudly when:

- required front matter keys are missing
- `date` is malformed
- `slug` is missing or invalid
- two posts share the same slug
- markdown source files cannot be parsed

Error output should point to the specific source file so the author can fix the problem quickly.

## README and Developer Guidance

Update `README.md` to document:

- how to install dependencies
- how to create a new post
- how to rebuild generated pages
- which files are source content versus generated output
- the expectation that both markdown and generated HTML are committed

## Risks and Mitigations

- Risk: generated HTML drifts from the current site shell.
  Mitigation: centralize shared page template generation and keep it aligned with the existing site structure.

- Risk: mixed ownership of generated and hand-edited blog files causes confusion.
  Mitigation: define generator ownership of markdown-backed post output and document it clearly.

- Risk: dependency creep turns the tool into a mini framework.
  Mitigation: limit the tool to small markdown and front matter libraries only.

- Risk: homepage and archive drift in editorial tone.
  Mitigation: keep the homepage hand-curated and the archive generator narrowly scoped.

## Acceptance Criteria

- New posts can be authored in markdown under `content/posts/`.
- A `new post` command scaffolds a markdown file with the required front matter.
- A `build posts` command regenerates the blog archive and post pages.
- Generated post pages reuse the current site shell and shared assets.
- The archive is generated from markdown metadata and sorted by date descending.
- The homepage featured posts remain hand-authored.
- The final site output remains plain static HTML compatible with GitHub Pages.
- The repository includes both markdown source files and the generated HTML output.

## Workflow Notes

- This feature should be implemented on the current feature branch or a child branch of it, not on `main`.
- The first implementation pass should prioritize a reliable authoring flow and correct output generation before adding extra markdown extensions or content features.
