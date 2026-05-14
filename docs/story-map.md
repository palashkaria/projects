# Story map — prototype comments

_v2 draft, 2026-05-12. Extension-first, Claude-Code-as-addresser-surface._

## How to read this map

Patton-shape, two-axis:

- **Horizontal (backbone)** — the user journey of a feedback round, in narrative order. **Six activities, left-to-right.**
- **Vertical (release slices)** — depth in each release. Top row = walking skeleton (smallest end-to-end). Lower rows add depth.

Personas:

- **R** — Reviewer (leaves comments)
- **A** — Addresser (acts on comments in Claude Code)
- **R + A** — both personas
- **R → A** — handoff between them

Both install the same Chrome extension. The reviewer composes feedback inside the extension; the addresser's primary tool is **Claude Code**, not a panel inside the extension. The exported artifact is what bridges the two surfaces.

---

## The backbone

| # | Activity | Persona | Plain-language sentence |
|---|---|---|---|
| 1 | Install | R + A | "Get the extension on my browser." |
| 2 | Visit | R | "Open the page I want to leave feedback on." |
| 3 | Comment | R | "Point at the thing and say what I think." |
| 4 | Export | R | "Turn my feedback into something I can hand over." |
| 5 | Hand off | R → A | "Get it to the person who can act on it." |
| 6 | Act | A + Claude Code | "Translate the feedback into a code change." |

The interesting cells are **#4 (Export)** — the format determines whether the workflow is useful at all — and **#6 (Act)** — Claude Code is doing most of the work, so the prompt we hand it has to be good.

---

## The walking skeleton

The minimum-end-to-end product. Everything below this row is depth.

| Activity | Walking-skeleton task | Status |
|---|---|---|
| 1. Install | Load unpacked in Chrome (developer mode) | New — to build |
| 2. Visit | Open any URL; extension auto-injects on user-permitted origins | New — content script |
| 3. Comment | Hover → bbox highlight → click → write → submit (identity modal first time) | Engine shipped ✓ |
| 4. **Export** | **"Copy as Claude Code prompt" (primary) + "Download JSON" (secondary)** | **New — the key feature** |
| 5. Hand off | Reviewer pastes prompt into Slack / DM / email | Out of our hands |
| 6. Act | Addresser pastes prompt into Claude Code in their repo; Claude finds the element and proposes the change | Out of our hands (we shape the prompt) |

The engine already ships everything for column 3. Columns 1–2 are extension shell work. Column 4 is the new feature that carries the product. Columns 5–6 are handled by tools the user already has.

---

## Full map

Each section = one column. Walking-skeleton row labelled "Phase 1 (extension MVP)". Rows beneath = deeper slices.

### 1. Install — R + A

> Reviewer and addresser install the same extension. The addresser may rarely open it (their work happens in Claude Code) but installs it for the times they're also reviewing.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton) | clone repo · `pnpm build` the extension package · `chrome://extensions` → load unpacked |
| 2 | publish to Chrome Web Store · signed CRX for direct install · auto-update on new versions |
| 3 | Firefox port (manifest v3 compatible) · Edge listing |
| Later | Safari extension · hosted-version onboarding flow |

### 2. Visit — R

> Reviewer opens any URL where they want to leave feedback.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton) | content script injects on all permitted origins · FAB visible bottom-right · click FAB → selection mode |
| 1 polish | per-domain enable/disable in popup · suppress on chrome:// / extension-store / about: pages |
| 2 | badge on extension icon showing comment count on this page · keyboard shortcut to toggle widget |
| 3 | site-specific defaults (accent colour, position) saved per origin · respect CSP for high-security sites |
| Later | mobile / Android Chrome support · long-press anchoring on touch |

### 3. Comment — R

> Reviewer anchors on an element and writes what they think. This is the engine we've already shipped.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton) | hover → bbox highlight · click → pin anchored · multi-selector anchor (id, css, xpath, fingerprint, text snippet, neighbour text) · textarea composer · identity modal first time · Cmd-Enter to submit · ESC to cancel |
| 1 polish | identity persisted in chrome.storage.local · Floating-UI position · focus management |
| 2 | anchor-lost indicator when resolver confidence drops · richer hover feedback for nested clickable elements |
| 3 | drag-rectangle as opt-in alternative anchor mode · screenshot capture of the anchor region · comment type pills (question / change / bug) |
| Later | voice comments (transcribed on submit) · paste-image into composer · @-mentions to other reviewers |

### 4. Export — R — **the column carrying the product**

> Reviewer turns their comments into something they can hand to the addresser. The format determines value.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton, **not yet shipped**) | **"Copy as Claude Code prompt" button in FAB menu — copies a single-comment prompt to clipboard** · **"Export all for this page" — generates a multi-comment prompt** · **"Download JSON" — raw structured data for non-Claude workflows** |
| 1 polish | preview the prompt before copying · edit identity / context before export |
| 2 | "Share via link" — extension uploads to `@org/comments-server`, returns a short URL · auto-batch export at end of browsing session |
| 3 | format presets: Claude Code, GitHub issue, Linear ticket, raw markdown |
| Later | realtime stream to backend — no manual export step |

**Prompt template (v1):**

```
On https://example.com/checkout, the element matching selector `.cta-button`
(tag: BUTTON, text: "Choose") has this feedback from Palash:

  "Should this say Subscribe? Choose feels passive."

Please find this element in the codebase and propose a change.
```

Three sentences. The addresser pastes into Claude Code in their repo and gets a real diff. The anchor data (selector, tag, text) is what lets Claude reliably find the element in source.

### 5. Hand off — R → A

> Reviewer transmits the artifact to the addresser. Mostly outside our product surface.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton) | reviewer pastes prompt into Slack / DM / email — done via OS clipboard |
| 2 | "Share via link" puts the comments on the comments-server with a short URL · addresser opens link, copies prompt |
| 3 | Slack integration (auto-post to a configured channel) · email digest (configurable cadence) |
| Later | direct push: extension auto-delivers to a per-project inbox the addresser configured · webhook target for custom integrations |

### 6. Act — A + Claude Code — **out of our hands by design**

> Addresser uses Claude Code to translate feedback into code changes. We don't build the addresser's UI — Claude Code is the addresser's UI.

| Phase | Tasks |
|---|---|
| 1 (walking skeleton) | addresser pastes prompt into Claude Code in their repo · Claude searches for the element by selector/text · Claude proposes a diff · addresser accepts or edits |
| 2 | dedicated `claude-code-prototype-comments` MCP server / skill that imports JSON and streams comments into a Claude Code session · "addressed" state syncs back to the extension |
| 3 | AI cluster/dedupe related comments before Claude addresses ("3 reviewers said the same thing about the checkout button") · auto-link to the resulting commit/PR |
| Later | direct PR creation from a comment thread · "verify the fix" flow that re-runs the resolver on the new build |

**Not on this map:**
- triage state machines, kanban boards, assigned-to fields — that's the issue tracker's job, not ours
- Linear / Jira sync — let the addresser glue this in their own automation
- real-time presence between reviewer + addresser — different product

---

## Release slices

The walking-skeleton row = **Phase 1 (extension MVP)**. To ship a coherent v1, the unbuilt cells are:

- **Column 1 (Install):** the extension package itself (manifest v3, content script, popup, options page)
- **Column 2 (Visit):** content script injection, per-origin permission UX
- **Column 4 (Export):** the "Copy as Claude Code prompt" button + JSON export, with the prompt template

Columns 3 (Comment), 5 (Hand off), 6 (Act) need no new code from us at the walking-skeleton level.

Approximate effort vs the previous (v1) map:

| Cell | v1 story map | v2 story map | Delta |
|---|---|---|---|
| Embed widget on prototype (Stand up + Embed + distribute) | Phase 1 walking skeleton | dropped from backbone | **removed** |
| Triage panel inside the widget | Phase 1 walking skeleton (gap) | dropped from backbone (Claude Code is the surface) | **removed** |
| Resolve/delete inside the widget | Phase 1 walking skeleton (gap) | thin reviewer-side only (edit/delete own comment) | **demoted** |
| Export/import JSON | Phase 1 walking skeleton (gap) | Phase 1 walking skeleton — now the carrying feature | **promoted** |
| Comments-server (HTTP backend) | Phase 1 alternative | Phase 2 ("Share via link" enhancement) | **demoted** |
| Threaded replies | Phase 4 | dropped (Claude Code is the thread) | **removed** |
| MCP server for live ingestion | not in vision doc | Phase 2 | **new** |

The v1 map's eight columns collapse to six. Three of the v1 columns (stand up, embed + distribute, triage) dissolve. Two new framings appear (extension install, Claude Code as the act-surface). The product becomes substantively smaller and the value prop substantively sharper.

## Persona evolution

| Phase | Reviewer | Addresser |
|---|---|---|
| 1 | install extension; comment on any site; copy-as-prompt; share | install extension (for the times they review); paste prompt into Claude Code |
| 2 | same plus share-via-link, auto-export | runs an MCP server / Claude Code skill that ingests comments without copy-paste |
| 3 | same plus screenshot, type pills | gets clustered/deduped comments; sees the resulting PR linked back |
| Later | realtime, voice, mobile | full bidirectional loop: "addressed" status syncs back; reviewer sees the fix |

Personas stay distinct throughout. They never merge into one role the way the old map suggested — because Claude Code is genuinely a different tool, with different affordances, used by a different person at a different time.

## Open questions raised by the map

1. **Permissioning model:** does the extension auto-inject on all sites by default, or do users have to explicitly enable per origin? Chrome's permission model nudges toward "click extension icon to activate" (host_permissions with `activeTab`). User-friction tradeoff.
2. **The exported prompt's identity field:** does it include the reviewer's email, or just name? Email is useful for routing in larger teams; "just name" is privacy-friendly.
3. **Multi-comment export shape:** when reviewer exports all comments for a page, is it one big prompt with all comments enumerated, or N copy-paste-able blocks? My instinct: one enumerated prompt, but Claude Code may handle them better as N.
4. **The widget's existing IIFE bundle:** keep building it as "available but unsupported," or stop publishing it? Costs little to keep around; risk is split focus in docs. My instinct: keep building, drop the README mentions.
5. **Per-site comment scoping:** in the popup, do we show "comments on this URL only" or "comments on this whole domain"? Domain is more useful for multi-page prototypes; URL is more precise. Could ship both views in the popup.
