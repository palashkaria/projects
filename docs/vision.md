# Vision — prototype comments

_Last updated 2026-05-12. v2 — extension-first framing._

## What we're building

A **Chrome extension** that turns design feedback into Claude Code prompts.

Reviewer installs the extension, opens any URL, hovers an element, types a comment. One click copies a prompt to the clipboard — a few sentences that include the comment text plus the anchoring data Claude Code needs to find the element in source. Addresser pastes it into Claude Code in their repo. Claude finds the element and proposes a change.

The product's job is the **bridge** between "I see this on the page" and "Claude, change this in the code."

Three packages, one product:

- **`@org/prototype-comments`** — the engine. Anchoring (multi-selector resolver), pin math, hover-select overlay, composer, identity. Reused by the extension. Still exports an IIFE bundle for embed-on-prototype use cases, but the script-tag distribution path is no longer the headline.
- **`@org/prototype-comments-extension`** — the Chrome MV3 extension. Content script that calls the engine, popup that manages exports, options page.
- **`@org/comments-server`** — Hono + SQLite. Phase 2 work; powers the "Share via link" path. Optional for solo use.

## The problem

Feedback on a prototype is currently a mess of Loom recordings, Figma stickies, Slack screenshots, and "the button on the third card" tickets. The reviewer's intent gets stranded in another tool, the builder has to context-switch, and even when the comment is clear, translating "this button label is wrong" into "find this button in 800 source files and update it" is a 5-minute job that gets done 30 times a week.

The closest existing tools fall short for prototype work:

- **SitePing** is a polished production feedback widget. Its drag-rectangle selection is great for "this section is broken" reports on a shipped site, but it's heavier than needed for "should this button say Subscribe?" on a prototype. Also: you have to integrate it.
- **Faster Fixes** has the right interaction — hover an element, click to anchor — but it's React-only, tightly coupled to a tRPC + Prisma backend, and the addresser's flow ends at "see comment in a dashboard." There's no bridge to *fixing the code*.
- **Figma comments** require Figma. And the comment stays trapped in Figma — the engineer still has to translate it manually.
- **Browser annotations** (Hypothes.is, etc.) are general-purpose. They have no concept of "the element in the codebase that this anchor points at."

The unique thing we do: **capture a stable enough anchor that Claude Code can find it in source**, and package the comment in a format Claude can actually act on.

## Who it's for

**Primary:** any team where the same person — or two people on the same Slack — does both design review and code changes.

- An indie designer / dev iterating on a Vercel preview.
- A small team where the designer leaves comments and the engineer addresses them via Claude Code.
- A founder reviewing their own deployed product, leaving comments, then asking Claude Code to fix them later that day.

**Anti-targets right now:**

- Production feedback at scale — that's [SitePing](https://github.com/NeosiaNexus/SitePing) / [Faster Fixes](https://github.com/manucoffin/faster-fixes) / Pendo territory.
- Teams that don't use Claude Code. We can ship JSON for them, but the value prop weakens.
- Public commenting / Disqus-style threads — different trust model.
- Anything inside Figma itself.
- Mobile prototypes — desktop-first; Chrome on macOS / Windows / Linux is the target. Touch anchoring is Phase 3+.

## Design principles

These are the calls we've made — and want to keep making — that distinguish what we're building from the obvious alternatives.

1. **Hover-to-anchor, not drag-to-region.** Reviewers identify _things_, not rectangles. Picking the semantic element gives us a stable anchor and a CSS selector Claude can use to find the element in source.
2. **The exported prompt is the product.** Everything in the extension exists to produce one good prompt. The reviewer's UX, the anchoring engine, the identity capture — all in service of that one paste-into-Claude-Code moment.
3. **Closed Shadow DOM by default.** The host page can't break our styles; our styles can't bleed into their page. The boundary is real and we treat it as a privacy line. Especially important for an extension that runs on arbitrary sites.
4. **No addresser UI inside the extension.** Claude Code is the addresser's UI. We don't build a comment list, a kanban, or a triage view inside the extension popup — the addresser's tool is Claude Code, and that's where they work. The popup is reviewer-shaped.
5. **No accounts in v1.** Reviewer types name + email once, persisted in `chrome.storage.local`. No projects, no auth. Friction is the enemy of feedback.
6. **The anchoring is the moat.** Five-strategy resolution (id → CSS → XPath → text-verified → fingerprint smart-scan) is the part that takes work to get right, and it's the part that makes the Claude Code handoff possible. Without robust anchoring, Claude can't find the element in source.
7. **The engine is reusable.** The `@org/prototype-comments` library is the engine. The extension is one consumer; the script-tag IIFE bundle is another (kept as available-but-unsupported); future consumers (Claude Code MCP server, Figma plugin, etc.) reuse the same anchoring + composer code.

## Where we are (shipped)

Engine work — directly reused by the extension:

- Hover-element selection with bbox highlight (`selection/overlay.ts`)
- Multi-selector anchoring + smart-scan resolver (`anchoring/`)
- Pin math + render with viewport-fixed positioning (`pins/`)
- Floating-UI composer popover (`composer/`)
- Identity modal capturing name + email in Shadow DOM (`ui/identity-dialog.ts`)
- Closed Shadow DOM host with `adoptedStyleSheets` (`isolation/host.ts`)
- `CommentStore` interface with localStorage adapter and HTTP adapter to `@org/comments-server`

Distribution work — not the headline anymore, but built:

- IIFE bundle at `packages/prototype-comments/dist/index.global.js` (script-tag drop-in)
- Demo at `packages/prototype-comments/demo/index.html`
- `@org/comments-server` with project-key auth and Zod validation

## Where we're going

The walking skeleton of the new map (see [story-map.md](./story-map.md)) is:

> Install the extension → visit any URL → leave a comment → click "Copy as Claude Code prompt" → paste into Claude Code → Claude proposes a diff.

### Phase 1 — extension MVP (next)

The smallest end-to-end extension. Six concrete things:

- Manifest v3 extension package (`@org/prototype-comments-extension`)
- Content script that calls `initPrototypeComments({ store: createChromeStore(...) })` on user-permitted origins
- `chrome.storage.local` adapter implementing `CommentStore`
- **"Copy as Claude Code prompt" button** in the FAB menu — primary action
- **"Download JSON"** button — secondary action for non-Claude workflows
- Popup with per-site comment list (reviewer-shaped only): edit, delete, batch export

Distribution: load-unpacked in Chrome for v1. Chrome Web Store listing is Phase 1 polish.

### Phase 2 — share via link

The walking skeleton hands off via OS clipboard. Phase 2 makes the handoff smoother:

- **Share via link.** The extension posts the comments to `@org/comments-server`; reviewer copies a short URL. Addresser opens link, clicks "Copy prompt." The server we already built does this job.
- **MCP server for Claude Code.** A `@org/prototype-comments-mcp` package the addresser runs inside Claude Code — ingests JSON or polls the comments-server, surfaces comments inside Claude's chat. No more copy-paste.
- **Per-page comment count badge** on the extension icon.
- **Anchor-lost indicator** when the resolver confidence drops below threshold (the prototype changed between visits).
- **Screenshot capture** — lazy-load `modern-screenshot` for an anchor-area thumbnail attached to the comment.

### Phase 3 — team workflows

- Authenticated backend (per-project keys; magic-link auth if accounts become real).
- Slack / email digest of new comments per project.
- AI clustering: "3 reviewers said the same thing about the checkout button — address once."
- "Addressed" state syncs back from Claude Code to the extension and the reviewer.

### Later — speculative

Two adjacencies worth tracking, neither committed:

1. **Direct PR creation from Claude Code.** Claude addresses the comment, opens a PR, links back to the comment thread. Closes the loop visibly.
2. **Reuse the anchoring engine elsewhere.** The `[POINT:selector:label]` pattern for a DOM-aware AI assistant uses the same multi-selector resolution. See [project_clicky_web_idea](../notes/clicky-web-wedges.md). A library named `@org/dom-anchor` could be extracted if the second consumer materialises.

## Boundaries we won't drift past

- **No addresser UI inside the extension.** Triage, assignment, kanban — all happen in Claude Code or the issue tracker, not in our popup. Saying yes to one is saying no to the focus that makes the product useful.
- **No telemetry from the extension.** Reviewers are guests on someone else's page. We don't phone home.
- **No production-site feedback features.** No issue assignment routing, no Linear sync, no triage dashboards. Those exist elsewhere.
- **No "magic" inference for the reviewer.** Comment categorisation, auto-tagging, reviewer matching — all out of scope until Phase 3, and only if a real user asks.
- **No iframe / cross-origin embedding.** The extension runs in the top frame. Iframes have a different anchoring model; revisit if/when we hit a real use case.

## Open questions

These are real decisions we haven't made yet. Worth revisiting before each phase.

- **Permissioning model.** Auto-inject on every site, or `activeTab` (extension activates only when the user clicks the icon)? Chrome reviewers and privacy-conscious users prefer `activeTab`; UX is smoother with auto-inject. Trial both during Phase 1.
- **The prompt template's identity field.** Does it include the reviewer's email, or just name? Useful for routing in larger teams; "just name" is privacy-friendlier.
- **Multi-comment export shape.** When the reviewer exports all comments for a page, is it one enumerated prompt or N separate copy-paste blocks? Probably one prompt; Claude can handle a numbered list.
- **The widget's existing IIFE bundle.** Keep publishing it (as available-but-unsupported), or formally deprecate? Costs little to keep around; risk is split focus.
- **Per-site comment scoping in the popup.** URL-exact or per-domain? Probably domain, with a "this URL only" filter.
- **What "Claude Code" actually means at v1.** We assume `claude-code` CLI in a repo; the prompt is generic enough to work in any LLM chat (ChatGPT, Cursor, etc.) — we just rename the button label later if the product positions away from Claude-specifically.

## Related work / inspiration

- [SitePing](https://github.com/NeosiaNexus/SitePing) — closed Shadow DOM, multi-selector anchoring, adapter pattern. We borrowed liberally from the plumbing.
- [Faster Fixes](https://github.com/manucoffin/faster-fixes) — the hover-element interaction. The reason the widget feels light.
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) — the spec our anchoring strategy quietly implements (CSS, XPath, TextQuote, structural selectors with fallback).
- [Hypothes.is](https://web.hypothes.is/) — closest analogue for a browser-extension annotation tool, though their use case (academic / web annotation) is fundamentally different from ours (translate comments into code).
