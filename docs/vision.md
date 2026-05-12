# Vision — prototype comments

_Last updated 2026-05-12._

## What we're building

A drop-in widget — one `<script>` tag, no framework lock-in — that lets reviewers leave comments anchored to specific elements on a prototype, and a small self-hostable server that collects those comments per project.

Two packages, one product:

- **`@org/prototype-comments`** — the embeddable widget (pure DOM, ESM + IIFE).
- **`@org/comments-server`** — Hono + SQLite, project-keyed REST API, deployable anywhere Node runs.

## The problem

Feedback on a prototype is currently a mess of Loom recordings, Figma stickies, Slack screenshots, and "the button on the third card" tickets. The reviewer's intent gets stranded in another tool, the builder has to context-switch, and there's no single thread per element.

The closest existing tools fall short for prototype work:

- **SitePing** is a polished production feedback widget. Its drag-rectangle selection is great for "this section is broken" reports on a shipped site, but it's heavier than needed for "should this button say Subscribe?" on a prototype.
- **Faster Fixes** has the right interaction — hover an element, click to anchor — but it's React-only and tightly coupled to a tRPC + Prisma backend. You can't drop it onto a static HTML prototype.
- **Figma comments** require Figma. Most prototypes that aren't pure design pass through a real-DOM stage (Vercel preview, internal dev server, a clickable HTML mockup).

We want the Faster Fixes interaction in a SitePing-grade pure-DOM widget, with the storage backend explicitly under our control.

## Who it's for

**Primary:** the builder who ships a prototype to a handful of named reviewers.

- An indie designer / dev sharing a Vercel preview link with a client.
- An internal team running design reviews on a feature branch's preview deploy.
- A founder asking three early customers to react to a clickable HTML mockup.

**Anti-targets right now:**

- Production feedback at scale — that's [SitePing](https://github.com/NeosiaNexus/SitePing) / [Faster Fixes](https://github.com/manucoffin/faster-fixes) / Pendo territory.
- Public commenting / Disqus-style threads — different trust model.
- Anything inside Figma itself.
- Mobile prototypes — desktop-first; mobile is reachable later but not designed-for yet.

## Design principles

These are the calls we've made — and want to keep making — that distinguish what we're building from the obvious alternatives.

1. **Hover-to-anchor, not drag-to-region.** Reviewers identify _things_, not rectangles. Picking the semantic element gives us a stable anchor and survives layout changes.
2. **Pure DOM, no framework.** The widget has to work in a Vercel HTML export, a Vite app, a Rails view, a static mockup. No React peer dep, no Vue plugin, just a script tag.
3. **Closed Shadow DOM by default.** The host page can't break our styles; our styles can't bleed into their page. The boundary is real and we treat it as a privacy line.
4. **Bring your own backend.** The library ships with a `CommentStore` interface and two adapters (localStorage and HTTP). Adding a Supabase / D1 / Postgres adapter is a 100-line file, not a rewrite.
5. **No accounts in v1.** A reviewer types name + email once, persisted locally. The project key is the only auth boundary. Friction is the enemy of feedback.
6. **Self-hostable from day one.** The server is a single Node process with a SQLite file. Deploy it on Fly, Railway, a Pi, whatever. We do not want anyone's prototype feedback funnelling through us by accident.
7. **The anchoring is the moat.** Five-strategy resolution (id → CSS → XPath → text-verified → fingerprint smart-scan) is the part that takes work to get right, and it's the part that makes the rest possible.

## Where we are (Phase 1, shipped)

- Widget with hover-element selection, normalised pin math, Floating-UI composer and bubble, Shadow-DOM isolation, identity modal, localStorage default.
- Self-hosted Hono + better-sqlite3 server with project-key auth and Zod validation.
- HTTP adapter with polling-based change detection.
- Demo at `packages/prototype-comments/demo/index.html`.

What's deliberately _not_ in Phase 1: threading, resolve/reopen, screenshot capture, realtime, accounts, ownership, billing.

## Where we're going

### Phase 2 — collaboration (multi-reviewer feels right)

The smallest steps that turn this from "personal note-taker" into "team review tool":

- **Threaded replies on a pin.** One reply level is enough.
- **Resolve / reopen state.** Comments transition `open → resolved`. Hide resolved by default.
- **Server-Sent Events on the same Hono server.** Replace polling with `EventSource` for the live feel without taking on WebSockets.
- **Screenshot capture.** Lazy-load `modern-screenshot` for an anchor-area thumbnail attached to each comment (SitePing's pattern; we'll respect a `data-prototype-comments-ignore` attribute for masking).
- **Anchor-lost indicator.** When resolution drops below a confidence threshold, render the pin with a dotted ring and show "this element may have moved or been removed" in the bubble.

### Phase 3 — multi-tenancy that doesn't need accounts yet

The server already namespaces every comment by `projectId`. Phase 3 moves from "project keys in an env var" to "projects you can create yourself":

- A minimal admin route (`POST /projects` with a master key) so a host can create / rotate project keys without a deploy.
- Per-project allowed origins (CORS allow-list per project, not global).
- Per-project rate limits.
- Soft delete + comment history (audit log).

### Phase 4 — accounts, ownership, billing (only if we decide to host it)

A hosted version is _optional_, not the goal. If we host:

- Magic-link auth (no passwords).
- Projects own a domain + an API key.
- Free tier with a hard comment cap; paid tier with usage-based pricing.
- The self-hosted path stays first-class. Same library, same protocol.

### Phase 5 — speculative

Two adjacencies worth tracking, neither committed:

1. **AI-mediated triage.** "Cluster these 40 comments by theme," "summarise this thread," "draft a reply." Backend-side, opt-in.
2. **Reuse the anchoring engine elsewhere.** See [project_clicky_web_idea](../notes/clicky-web-wedges.md) — the `[POINT:selector:label]` pattern for a DOM-aware AI assistant uses the same multi-selector resolution we built here. A library named `@org/dom-anchor` could be extracted if the second consumer materialises.

## Boundaries we won't drift past

- **No production-site feedback features.** No issue assignment, no Linear sync, no triage dashboards. Those exist elsewhere. Saying yes to one is saying no to the focus that makes the library useful.
- **No iframe embeds.** A prototype is the host page, not an iframe target. Adding iframe support pulls in postMessage plumbing and a different anchoring model.
- **No telemetry from the widget.** Reviewers are guests in someone else's page. We don't phone home.
- **No "magic" inference.** Comment routing, auto-categorisation, reviewer matching — all out of scope until/unless Phase 5 happens.

## Open questions

These are real decisions we haven't made yet. Worth revisiting before each phase.

- **Is the project key actually private enough?** It lives in the host page's JS. Anyone with the prototype URL has the key. That's fine when the URL is itself the secret (Vercel preview, private link). It's not fine if a prototype ever gets indexed. Phase 2 may need short-lived signed tokens.
- **How much does the bubble want to be a panel?** Today it's a small popover. A side panel with the full thread (faster-fixes-style) is better once we have threaded replies. We pay UX rent until we make that decision.
- **Should the widget ever auto-anchor without a click?** Programmatic API: `instance.commentOn(selector, body)` for AI-driven comment placement. Cheap to add, but only worth doing if a real consumer asks.
- **What's the right URL key for SPAs?** `location.pathname` is fine for static prototypes; an SPA needs a hook. We expose `pageKey: () => string` already — good enough to defer until someone hits it.

## Related work / inspiration

- [SitePing](https://github.com/NeosiaNexus/SitePing) — closed Shadow DOM, multi-selector anchoring, adapter pattern. We borrowed liberally from the plumbing.
- [Faster Fixes](https://github.com/manucoffin/faster-fixes) — the hover-element interaction. The reason the widget feels light.
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) — the spec our anchoring strategy quietly implements (CSS, XPath, TextQuote, structural selectors with fallback).
