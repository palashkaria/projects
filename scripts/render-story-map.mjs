// Renders docs/story-map.md into docs/story-map.tldr (a tldraw 5.x file).
// Run: node scripts/render-story-map.mjs
//
// Markdown is the source of truth; this script produces the visual render.
// Regenerate after edits to the story-map structure below.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Data — keep in sync with docs/story-map.md
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAS = {
  R: { color: "blue", label: "Reviewer" },
  A: { color: "orange", label: "Addresser" },
  X: { color: "violet", label: "Both / handoff" },
};

const SHIPPED = "green";
const GAP = "red";

const ACTIVITIES = [
  { id: 1, title: "Install", persona: "X" },
  { id: 2, title: "Visit", persona: "R" },
  { id: 3, title: "Comment", persona: "R" },
  { id: 4, title: "Export", persona: "R" },
  { id: 5, title: "Hand off", persona: "X" },
  { id: 6, title: "Act in Claude Code", persona: "A" },
];

// Each row = a release tier. Each cell = task text + (optional) status flag.
// status: "shipped" → green; "gap" → red; otherwise persona color.
const ROWS = [
  {
    label: "Walking skeleton (Phase 1 extension MVP)",
    cells: [
      { text: "load unpacked\nin Chrome\ndeveloper mode", status: "gap" },
      { text: "content script\nauto-injects\non permitted origins", status: "gap" },
      { text: "hover → bbox\nclick → pin\ntype + identity modal", status: "shipped" },
      { text: "Copy as Claude\nCode prompt\n+ Download JSON", status: "gap" },
      { text: "reviewer pastes\nprompt into\nSlack / email" },
      { text: "addresser pastes\ninto Claude Code\nClaude finds element\nproposes diff" },
    ],
  },
  {
    label: "Phase 1 polish",
    cells: [
      { text: "per-domain\nenable / disable\nin popup" },
      { text: "suppress on\nchrome:// / store /\nabout: pages" },
      { text: "identity persisted\nin chrome.storage\nFloating-UI position", status: "shipped" },
      { text: "preview prompt\nbefore copying\nedit context" },
      { text: "share via copy-paste\n(OS clipboard)" },
      { text: "the addresser\nuses Claude Code\nin their repo" },
    ],
  },
  {
    label: "Phase 2",
    cells: [
      { text: "publish to\nChrome Web Store\nauto-update" },
      { text: "badge on icon\nshowing comment count\nkeyboard shortcut" },
      { text: "anchor-lost indicator\nrich feedback for\nnested clickables" },
      { text: "Share via link:\nextension uploads\nto comments-server\nreturns short URL" },
      { text: "auto-deliver\nvia comments-server\nlink-based" },
      { text: "MCP server /\nClaude Code skill\nimports JSON\nstreams into chat" },
    ],
  },
  {
    label: "Phase 3 / teams",
    cells: [
      { text: "Firefox port\nEdge listing\nmanifest v3" },
      { text: "site-specific\ndefaults persisted\nrespect strict CSP" },
      { text: "drag-rectangle\nopt-in\nscreenshot capture\ntype pills" },
      { text: "format presets:\nClaude / GH issue /\nLinear / markdown" },
      { text: "Slack auto-post\nemail digest\nconfigurable cadence" },
      { text: "AI cluster /\ndedupe related\ncomments before\nClaude addresses" },
    ],
  },
  {
    label: "Later",
    cells: [
      { text: "Safari extension\nhosted-version\nonboarding" },
      { text: "mobile / touch\nlong-press anchoring" },
      { text: "voice comments\ntranscribed\npaste-image\n@-mentions" },
      { text: "realtime stream\nno manual export" },
      { text: "webhook target\ncustom integrations" },
      { text: "direct PR creation\nfrom comment thread\nverify-the-fix loop" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

const COL_W = 240;
const ROW_H = 240;
const HEADER_H = 90;
const TITLE_BLOCK_H = 140;
const ROW_LABEL_W = 220;
const PAD = 20;

const ORIGIN_X = 0;
const ORIGIN_Y = 0;

const BACKBONE_Y = ORIGIN_Y + TITLE_BLOCK_H;
const FIRST_ROW_Y = BACKBONE_Y + HEADER_H + PAD;

const colX = (i) => ORIGIN_X + ROW_LABEL_W + PAD + i * COL_W;
const rowY = (i) => FIRST_ROW_Y + i * ROW_H;

// ─────────────────────────────────────────────────────────────────────────────
// .tldr building blocks
// ─────────────────────────────────────────────────────────────────────────────

const SCHEMA = {
  schemaVersion: 2,
  sequences: {
    "com.tldraw.store": 5,
    "com.tldraw.asset": 1,
    "com.tldraw.camera": 1,
    "com.tldraw.document": 2,
    "com.tldraw.instance": 26,
    "com.tldraw.instance_page_state": 5,
    "com.tldraw.page": 1,
    "com.tldraw.instance_presence": 6,
    "com.tldraw.pointer": 1,
    "com.tldraw.shape": 4,
    "com.tldraw.user": 1,
    "com.tldraw.asset.image": 6,
    "com.tldraw.asset.video": 5,
    "com.tldraw.asset.bookmark": 2,
    "com.tldraw.shape.arrow": 8,
    "com.tldraw.shape.bookmark": 2,
    "com.tldraw.shape.draw": 4,
    "com.tldraw.shape.embed": 4,
    "com.tldraw.shape.frame": 1,
    "com.tldraw.shape.geo": 11,
    "com.tldraw.shape.group": 0,
    "com.tldraw.shape.highlight": 3,
    "com.tldraw.shape.image": 5,
    "com.tldraw.shape.line": 5,
    "com.tldraw.shape.note": 12,
    "com.tldraw.shape.text": 4,
    "com.tldraw.shape.video": 4,
    "com.tldraw.binding.arrow": 1,
  },
};

const INDEX_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// Start at 2 so we never collide with page:page's literal "a1" index.
let indexCounter = 2;
const nextIndex = () => {
  const i = indexCounter++;
  if (i < 62) return "a" + INDEX_CHARS[i];
  const j = i - 62;
  if (j < 62 * 62) return "b" + INDEX_CHARS[Math.floor(j / 62)] + INDEX_CHARS[j % 62];
  throw new Error("ran out of valid jittered indices; expand the generator");
};

let idCounter = 0;
const nextId = (prefix = "shape") => `${prefix}:s${(idCounter++).toString(36)}`;

const toRichText = (text) => ({
  type: "doc",
  attrs: { dir: "auto" },
  content: text.split("\n").map((line) =>
    line
      ? {
          type: "paragraph",
          attrs: { dir: "auto" },
          content: [{ type: "text", text: line }],
        }
      : { type: "paragraph", attrs: { dir: "auto" } },
  ),
});

const note = ({ x, y, color, text, size = "m" }) => ({
  id: nextId(),
  typeName: "shape",
  type: "note",
  parentId: "page:page",
  index: nextIndex(),
  x,
  y,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  props: {
    color,
    richText: toRichText(text),
    size,
    font: "draw",
    align: "middle",
    verticalAlign: "middle",
    labelColor: "black",
    growY: 0,
    fontSizeAdjustment: 1,
    url: "",
    scale: 1,
    textFirstEditedBy: null,
  },
});

const geo = ({ x, y, w, h, color, fill = "semi", text = "", size = "m" }) => ({
  id: nextId(),
  typeName: "shape",
  type: "geo",
  parentId: "page:page",
  index: nextIndex(),
  x,
  y,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  props: {
    geo: "rectangle",
    dash: "draw",
    url: "",
    w,
    h,
    growY: 0,
    scale: 1,
    labelColor: "black",
    color,
    fill,
    size,
    font: "draw",
    align: "middle",
    verticalAlign: "middle",
    richText: toRichText(text),
  },
});

const label = ({ x, y, color = "black", text, size = "m", w = 400 }) => ({
  id: nextId(),
  typeName: "shape",
  type: "text",
  parentId: "page:page",
  index: nextIndex(),
  x,
  y,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  props: {
    color,
    size,
    font: "draw",
    textAlign: "start",
    w,
    richText: toRichText(text),
    scale: 1,
    autoSize: true,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────

const records = [
  {
    meta: {},
    id: "page:page",
    name: "Story map",
    index: "a1",
    typeName: "page",
  },
  {
    gridSize: 10,
    name: "Prototype comments — story map",
    meta: {},
    id: "document:document",
    typeName: "document",
  },
];

// Title block
records.push(
  label({
    x: ORIGIN_X,
    y: ORIGIN_Y,
    text: "Prototype comments — story map",
    size: "xl",
    w: 800,
  }),
  label({
    x: ORIGIN_X,
    y: ORIGIN_Y + 50,
    text: "Patton-shape: backbone horizontal, depth vertical. Phase rows from top (walking skeleton) to bottom (Later).",
    size: "s",
    color: "grey",
    w: 900,
  }),
  label({
    x: ORIGIN_X,
    y: ORIGIN_Y + 80,
    text: "Persona colour: blue = Reviewer · orange = Addresser · violet = handoff · green = shipped · red = gap (Phase 1 walking-skeleton incomplete).",
    size: "s",
    color: "grey",
    w: 1200,
  }),
);

// Backbone (activity headers)
for (let i = 0; i < ACTIVITIES.length; i++) {
  const a = ACTIVITIES[i];
  const personaColor = PERSONAS[a.persona].color;
  records.push(
    geo({
      x: colX(i),
      y: BACKBONE_Y,
      w: COL_W - PAD,
      h: HEADER_H,
      color: personaColor,
      fill: "solid",
      text: `${a.id}. ${a.title}\n(${PERSONAS[a.persona].label})`,
      size: "m",
    }),
  );
}

// Row labels + cells
for (let r = 0; r < ROWS.length; r++) {
  const row = ROWS[r];

  // Row label on the left
  records.push(
    label({
      x: ORIGIN_X,
      y: rowY(r) + 20,
      text: row.label,
      size: "m",
      color: "black",
      w: ROW_LABEL_W - PAD,
    }),
  );

  // Cells across the row
  for (let c = 0; c < row.cells.length; c++) {
    const cell = row.cells[c];
    const persona = ACTIVITIES[c].persona;
    let color = PERSONAS[persona].color;
    if (cell.status === "shipped") color = SHIPPED;
    else if (cell.status === "gap") color = GAP;

    records.push(
      note({
        x: colX(c),
        y: rowY(r),
        color,
        text: cell.text,
      }),
    );
  }
}

// Legend at the bottom
const legendY = rowY(ROWS.length) + 40;
records.push(
  label({
    x: ORIGIN_X,
    y: legendY,
    text: "Legend",
    size: "l",
    w: 200,
  }),
);
const legendItems = [
  { color: "blue", text: "Reviewer task" },
  { color: "orange", text: "Addresser task" },
  { color: "violet", text: "Handoff / both" },
  { color: "green", text: "Shipped (walking skeleton)" },
  { color: "red", text: "GAP — not yet built" },
];
for (let i = 0; i < legendItems.length; i++) {
  records.push(
    note({
      x: ORIGIN_X + i * 240,
      y: legendY + 50,
      color: legendItems[i].color,
      text: legendItems[i].text,
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate indices, write file
// ─────────────────────────────────────────────────────────────────────────────

const file = {
  tldrawFileFormatVersion: 1,
  schema: SCHEMA,
  records,
};

// Validate index format before write — fail loudly here, not in the tldraw UI.
const INDEX_RE = /^a[0-9A-Za-z]$|^b[0-9A-Za-z]{2}$/;
const bad = records.filter((r) => r.index !== undefined && !INDEX_RE.test(r.index));
if (bad.length > 0) {
  console.error("invalid indices:", bad.slice(0, 5));
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "..", "docs", "story-map.tldr");
writeFileSync(out, JSON.stringify(file));
console.log(`wrote ${out}`);
console.log(`  records: ${records.length}`);
console.log(`  activities: ${ACTIVITIES.length}`);
console.log(`  rows: ${ROWS.length}`);
