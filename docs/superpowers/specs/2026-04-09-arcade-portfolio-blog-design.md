# Arcade Portfolio and Blog Design

Date: 2026-04-09
Branch: `dev/arcade-portfolio-blog`
Status: Approved for planning, pending implementation

## Overview

Build a static personal portfolio and resume site with a real blog, using plain HTML, CSS, and vanilla JavaScript only. The site should preserve GitHub Pages compatibility, remain easy to maintain by hand, and use placeholder content for the initial launch.

The visual direction is `Retro CRT Minimal`: the site should feel like entering an old arcade interface while staying readable, professional, and lightweight.

## Goals

- Replace the current placeholder homepage with a complete landing page.
- Include distinct sections for hero, about, links, resume snapshot, featured writing, and contact.
- Add a real static blog with an archive page and individual post pages.
- Support both light and dark themes with explicit user-selectable buttons.
- Persist the chosen theme across the homepage and blog pages.
- Keep the implementation mobile-first, accessible, and simple to extend.

## Non-Goals

- No framework, package manager, or build step.
- No CMS, markdown pipeline, or server-side rendering.
- No contact form backend.
- No animations that are heavy, distracting, or autoplaying.
- No attempt to create a full resume management system.

## User Experience

The homepage should feel like a personal intro screen for a creative professional. The page should quickly answer:

- Who is this person?
- What kind of work do they do?
- Where can I read their writing?
- How can I contact them?

The blog should feel like part of the same site rather than a separate product. A visitor should be able to move cleanly between the homepage, archive, and posts.

## Visual Direction

### Core Theme

Use a restrained retro CRT aesthetic rather than loud neon arcade styling.

- Typography should suggest retro technology or printed scorecards without sacrificing legibility.
- Layout should be clean and structured, with visible panel boundaries and deliberate spacing.
- Decorative effects should stay subtle: faint grid lines, scanline texture, or panel glow are acceptable if contrast remains strong.

### Dark Theme

- Deep charcoal or near-black background.
- Phosphor-inspired green, cyan, or muted electric blue accents.
- Light text with strong contrast.
- Panels should feel like old monitor overlays or machine UI frames.

### Light Theme

- Off-white, pale gray, or lightly warm background.
- Dark ink text with green-blue accent colors carried over from dark mode.
- The light theme should feel like an arcade manual or service sheet rather than a generic bright website.

### Theme Switching

- Include visible `Light` and `Dark` buttons in the site header.
- Indicate the active theme clearly.
- Theme choice should use `localStorage`.
- On first visit, default to `prefers-color-scheme` if no saved choice exists.
- Theme behavior must be shared across all site pages.

## Information Architecture

### Homepage

`/index.html`

Sections:

1. Hero
2. About
3. Resume Snapshot
4. Links
5. Featured Posts
6. Contact

### Blog Archive

`/blog/index.html`

Purpose:

- List available posts with title, date, and summary.
- Provide a lightweight entry point into the writing section.

### Blog Posts

`/blog/posts/<slug>.html`

Purpose:

- House standalone HTML posts that can be created manually over time.
- Share the same header, navigation, theme toggle, and base styles as the homepage.

## Content Model

Initial content should use simple placeholder copy so the structure is complete without blocking on real personal details.

### Hero

- Name placeholder
- One-line descriptor
- Two primary calls to action, likely `Read the Blog` and `Get in Touch`

### About

- Short paragraph introducing the person and the kind of work they do

### Resume Snapshot

- Experience
- Skills
- Education

These should be shown as short structured entries rather than long prose.

### Links

- GitHub
- LinkedIn
- Resume
- Blog

### Featured Posts

- Show two or three post previews from the blog archive

### Contact

- Email link
- Optional social links

## Technical Approach

### File Structure

```text
/
  index.html
  blog/
    index.html
    posts/
      first-post.html
      second-post.html
  assets/
    css/
      site.css
    js/
      theme.js
```

### Shared Styling

- Move styling out of inline CSS into a shared stylesheet.
- Use CSS custom properties for theme tokens.
- Keep the CSS organized by page structure and component roles rather than by visual effects alone.

### Shared JavaScript

- Use one small script for theme initialization and button handling.
- Keep JavaScript narrowly scoped to theme behavior.

### Navigation

- Shared top navigation across the homepage, blog archive, and blog posts.
- Include links to `Home`, `Blog`, and `Contact`.

## Accessibility and Quality Requirements

- Meet strong text-to-background contrast in both themes.
- Ensure all interactive controls are keyboard accessible.
- Provide visible focus styles.
- Preserve readable font sizes and spacing on mobile devices.
- Do not rely on color alone to indicate active theme state.
- Keep decorative overlays subtle enough that they never reduce readability.
- Ensure all internal links are valid.

## Responsive Behavior

- Mobile-first layout.
- Sections stack cleanly on narrow screens.
- Resume and links content may shift into columns on larger screens.
- Theme controls should remain easy to tap on mobile.

## Blog Authoring Approach

- Posts are manually authored as standalone HTML files.
- The blog archive is manually updated with links, dates, and summaries.
- The homepage featured-post section is also maintained manually.

This keeps the site extremely simple and aligned with GitHub Pages hosting, even though it means publishing a post requires editing multiple files.

## Risks and Mitigations

- Risk: retro styling hurts readability.
  Mitigation: keep typography, spacing, and contrast conservative; use effects sparingly.

- Risk: theme toggle becomes inconsistent across pages.
  Mitigation: centralize theme logic in one shared JavaScript file and one shared set of theme variables.

- Risk: maintaining blog links by hand causes broken navigation.
  Mitigation: keep the blog structure shallow and verify internal links after implementation.

## Acceptance Criteria

- The homepage includes hero, about, resume snapshot, links, featured posts, and contact sections.
- The site has explicit `Light` and `Dark` theme buttons.
- Theme selection persists between visits and across pages.
- The blog archive page exists and links to at least two placeholder posts.
- Individual blog post pages exist and match the shared site styling.
- The site remains plain HTML, CSS, and vanilla JavaScript.
- The result works on GitHub Pages without any build tooling.

## Workflow Notes

- All work should happen on `dev/arcade-portfolio-blog` until the user approves merging to `main`.
- The first implementation pass should prioritize structure, readability, and working navigation before visual polish.
