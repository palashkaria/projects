// Three structural answers to “what needs attention across workspaces?”
// Throwaway /prototype/activity?variant=attention|explorer|activity.
import { fixture } from './fixtures.js';
import { connectActivity } from './adapter.js';
const variants = ['attention', 'explorer', 'activity'];
const names = {
  attention: 'Attention first',
  explorer: 'Workspace explorer',
  activity: 'Activity overview',
};
const params = new URLSearchParams(location.search);
const state = {
  variant: variants.includes(params.get('variant'))
    ? params.get('variant')
    : 'attention',
  source: params.get('source') === 'live' ? 'live' : 'demo',
  scenario: 'connected',
  search: '',
  filter: 'all',
  workspace: 'projects',
  snapshot: fixture('connected'),
  error: null,
  receivedAt: null,
};
const app = document.querySelector('#app');
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        c
      ])
  );
const titleCase = (value) => value[0].toUpperCase() + value.slice(1);
const age = (value) =>
  value === null
    ? 'Time unknown'
    : `${
        Math.max(0, Math.floor((Date.now() - value) / 1000)) < 60
          ? Math.max(0, Math.floor((Date.now() - value) / 1000)) + 's'
          : Math.floor((Date.now() - value) / 60000) + 'm'
      } ago`;
const workspaceName = (id) =>
  state.snapshot.workspaces.find((w) => w.id === id)?.name ||
  'Unassigned workspace';
const repo = (p) =>
  p.cwd?.split('/').filter(Boolean).at(-1) || 'Directory unknown';
const agents = () => state.snapshot.panes.filter((p) => p.agent);
const fresh = () =>
  !state.error && state.snapshot.connection.state === 'connected';
const isAttention = (p) =>
  fresh() &&
  p.agent &&
  (p.rawStatus === 'blocked' || p.attention === 'turn-ended');
const label = (p) => (!p.agent ? 'Shell' : titleCase(p.rawStatus));
const badge = (p) =>
  `<span class="badge ${
    p.agent ? p.rawStatus : 'shell'
  }"><span aria-hidden="true">${
    p.rawStatus === 'working' && p.agent
      ? '◉'
      : p.rawStatus === 'blocked' && p.agent
      ? '!'
      : '○'
  }</span> ${label(p)}</span>${
    p.attention === 'turn-ended'
      ? `<span class="badge ${fresh() ? 'ended' : ''}">${
          fresh() ? 'Turn ended · inferred' : 'Stale turn-end inference'
        }</span>`
      : ''
  }`;
const matches = (p) =>
  `${p.title} ${p.cwd} ${p.agent} ${workspaceName(p.workspaceId)} ${p.id}`
    .toLowerCase()
    .includes(state.search.toLowerCase()) &&
  (state.filter === 'all' ||
    (state.filter === 'attention' && isAttention(p)) ||
    (state.filter === 'shell' && !p.agent) ||
    (state.filter === p.rawStatus && p.agent));
const filtered = () => state.snapshot.panes.filter(matches);
const empty = (text) =>
  `<div class="empty"><strong>${text}</strong><p>Try a broader search or choose All states.</p><button data-action="clear">Clear filters</button></div>`;
function row(p, showWorkspace = true) {
  return `<button class="agent-row" data-pane="${esc(
    p.id
  )}"><span class="agent-avatar" aria-hidden="true">${
    p.agent ? esc(p.agent.slice(0, 2)) : '⌘'
  }</span><span class="row-body"><strong>${esc(
    p.title
  )}</strong><span class="row-meta">${
    showWorkspace ? esc(workspaceName(p.workspaceId)) + ' / ' : ''
  }${esc(repo(p))} · ${esc(
    p.agent || 'Shell pane'
  )}</span></span><span class="row-state">${badge(p)}<small>${age(
    p.lastActivityAt
  )}</small></span><span class="row-arrow" aria-hidden="true">↗</span></button>`;
}
function section(title, description, panes) {
  return `<section class="queue-section"><div class="section-heading"><h2>${title} <span class="count">${
    panes.length
  }</span></h2><p>${description}</p></div>${
    panes.map((p) => row(p)).join('') ||
    '<p class="quiet">No matching panes in this group.</p>'
  }</section>`;
}
export function VariantAttention() {
  const panes = filtered();
  if (!fresh())
    return section(
      'Last known inventory',
      'Attention prioritization is paused while disconnected. These are retained observations.',
      panes
    );
  return `<div class="attention-layout"><div>${section(
    'Needs your attention',
    'Blocked agents first. Open a row to inspect the observation.',
    panes.filter((p) => p.agent && p.rawStatus === 'blocked')
  )}${section(
    'Turn ended',
    'Working → idle observed. Review the result in your agent; success is unknown.',
    panes.filter(
      (p) =>
        p.agent && p.attention === 'turn-ended' && p.rawStatus !== 'blocked'
    )
  )}${section(
    'In progress',
    'Agents currently reported as working.',
    panes.filter((p) => p.agent && p.rawStatus === 'working' && !p.attention)
  )}<details class="other-panes" ${
    state.search || ['idle', 'unknown', 'shell'].includes(state.filter)
      ? 'open'
      : ''
  }><summary>Other panes · ${
    panes.filter((p) => !isAttention(p) && p.rawStatus !== 'working').length
  }</summary>${panes
    .filter((p) => !isAttention(p) && p.rawStatus !== 'working')
    .map((p) => row(p))
    .join('')}</details>${
    !panes.length ? empty('No panes match these filters') : ''
  }</div><aside class="context-panel"><h2>Across your desk</h2><p class="aside-intro">${
    agents().length
  } agents in ${
    state.snapshot.workspaces.length
  } workspaces.</p><dl class="summary-list"><div><dt>Working</dt><dd>${
    agents().filter((p) => p.rawStatus === 'working').length
  }</dd></div><div><dt>Blocked</dt><dd>${
    agents().filter((p) => p.rawStatus === 'blocked').length
  }</dd></div><div><dt>Idle, including turn ended</dt><dd>${
    agents().filter((p) => p.rawStatus === 'idle').length
  }</dd></div><div><dt>Unknown</dt><dd>${
    agents().filter((p) => p.rawStatus === 'unknown').length
  }</dd></div><div><dt>Shell panes</dt><dd>${
    state.snapshot.panes.filter((p) => !p.agent).length
  }</dd></div></dl><h3>Workspace inventory</h3>${state.snapshot.workspaces
    .map(
      (w) =>
        `<button class="workspace-shortcut" data-workspace="${esc(
          w.id
        )}"><span>${esc(w.name)}</span><span>${
          state.snapshot.panes.filter((p) => p.workspaceId === w.id).length
        } <span aria-hidden="true">→</span></span></button>`
    )
    .join(
      ''
    )}<p class="footnote">Counts describe the full snapshot, before search and filters.</p></aside></div>`;
}
export function VariantExplorer() {
  const workspaces = [...state.snapshot.workspaces];
  if (
    state.snapshot.panes.some(
      (p) => !p.workspaceId || !workspaces.some((w) => w.id === p.workspaceId)
    )
  )
    workspaces.push({ id: 'unassigned', name: 'Unassigned workspace' });
  const current =
    workspaces.find((w) => w.id === state.workspace) || workspaces[0];
  if (!current) return empty('No workspaces reported');
  const belongs = (p) =>
    current.id === 'unassigned'
      ? !state.snapshot.workspaces.some((w) => w.id === p.workspaceId)
      : p.workspaceId === current.id;
  const all = state.snapshot.panes.filter(belongs),
    panes = all.filter(matches);
  const directories = [...new Set(panes.map((p) => p.cwd))];
  return `<div class="explorer-layout"><nav class="workspace-nav" aria-label="Workspaces"><div class="nav-heading">Workspaces <span>${
    workspaces.length
  }</span></div>${workspaces
    .map((w) => {
      const ws = state.snapshot.panes.filter((p) => p.workspaceId === w.id);
      return `<button class="workspace-item ${
        current.id === w.id ? 'selected' : ''
      }" data-select-workspace="${esc(w.id)}" aria-pressed="${
        current.id === w.id
      }"><span class="folder" aria-hidden="true">▱</span><span><strong>${esc(
        w.name
      )}</strong><small>${
        ws.length
          ? `${ws.filter((p) => p.agent).length} agents · ${
              ws.filter((p) => !p.agent).length
            } shells`
          : 'Empty workspace'
      }</small></span>${
        ws.some(isAttention)
          ? '<span class="attention-dot" aria-label="Needs attention">!</span>'
          : ''
      }</button>`;
    })
    .join(
      ''
    )}</nav><section class="workspace-content"><div class="workspace-title"><span class="breadcrumb">Workspace inventory /</span><h2>${esc(
    current.name
  )}</h2><p>${all.filter((p) => p.agent).length} agents · ${
    all.filter((p) => !p.agent).length
  } shell panes · ${
    all.filter(isAttention).length
  } attention signals</p></div>${directories
    .map(
      (directory) =>
        `<section class="repo-group"><h3><span aria-hidden="true">⌁</span> ${esc(
          directory || 'Directory unknown'
        )}</h3>${panes
          .filter((p) => p.cwd === directory)
          .map((p) => row(p, false))
          .join('')}</section>`
    )
    .join('')}${
    !all.length
      ? '<div class="empty"><strong>A workspace with room to start.</strong><p>No attached panes were reported. Empty workspaces stay visible in this view.</p></div>'
      : !panes.length
      ? empty('No matching panes in this workspace')
      : ''
  }<div class="workspace-note"><strong>Workspace context stays in view.</strong><p>Select another workspace on the left. Search and state filters apply to its pane list; workspace inventory stays visible.</p></div></section></div>`;
}
export function VariantActivity() {
  const panes = filtered().sort(
    (a, b) => (b.lastActivityAt ?? -1) - (a.lastActivityAt ?? -1)
  );
  return `<div class="activity-layout"><section class="pulse"><div><h2>Workspace pulse</h2><p>Current observations, grouped by workspace.</p></div><div class="pulse-strip">${state.snapshot.workspaces
    .map((w) => {
      const ps = state.snapshot.panes.filter((p) => p.workspaceId === w.id);
      return `<button data-workspace="${esc(w.id)}"><strong>${esc(
        w.name
      )}</strong><span class="marks">${
        ps
          .map(
            (p) =>
              `<span class="mark ${
                p.agent ? p.rawStatus : 'shell'
              }" title="${esc(p.title)}: ${label(p)}">${
                p.agent
                  ? { working: '◉', blocked: '!', idle: '○', unknown: '?' }[
                      p.rawStatus
                    ]
                  : '○'
              }</span>`
          )
          .join('') || '<span>—</span>'
      }</span><small>${ps.length} panes</small></button>`;
    })
    .join(
      ''
    )}</div></section><div class="activity-columns"><section><div class="section-heading"><h2>Latest observed activity</h2><p>One latest observation per pane. This is not an event history or a transcript.</p></div><ol class="timeline">${panes
    .map(
      (p) =>
        `<li><time>${age(
          p.lastActivityAt
        )}</time><div class="timeline-observation">${row(p)}<p>${
          p.attention === 'turn-ended'
            ? 'Observed working → idle. Turn end is inferred; outcome unknown.'
            : !p.agent
            ? 'Shell inventory only. No agent status.'
            : p.rawStatus === 'unknown'
            ? 'The observer cannot classify this agent’s current state.'
            : `Latest raw status: ${p.rawStatus}.`
        }</p></div></li>`
    )
    .join('')}</ol>${
    !panes.length ? empty('No activity matches these filters') : ''
  }</section><aside class="attention-digest"><h2>Review next</h2><p>Attention signals in the filtered snapshot.</p>${
    panes
      .filter(isAttention)
      .map(
        (p) =>
          `<button class="digest-item" data-pane="${esc(p.id)}">${badge(
            p
          )}<strong>${esc(p.title)}</strong><small>${esc(
            workspaceName(p.workspaceId)
          )}</small></button>`
      )
      .join('') || '<p>No matching attention signals.</p>'
  }<div class="legend"><h3>Reading this view</h3><p>◉ Working · ! Blocked · ○ Idle / shell</p><p>Unknown means insufficient status information. Disconnected means the entire inventory may be stale.</p></div></aside></div></div>`;
}
function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set('variant', state.variant);
  url.searchParams.set('source', state.source);
  history.replaceState(null, '', url);
}
function render() {
  const openPane = document.querySelector('#pane-dialog[open]')?.dataset.pane;
  const focused = document.activeElement?.id;
  const cursor = document.activeElement?.selectionStart;
  const snapshot = state.snapshot;
  const stale = state.error || snapshot.connection.state !== 'connected';
  app.innerHTML = `<header class="app-header"><a class="brand" href="/prototype/activity"><span aria-hidden="true">h</span> Herdr <small>Activity</small></a><span class="prototype-tag">Layout prototype · read only</span><div class="source-controls"><label>Data <select id="source"><option value="demo" ${
    state.source === 'demo' ? 'selected' : ''
  }>Demo fixtures</option><option value="live" ${
    state.source === 'live' ? 'selected' : ''
  }>Live read-only feed</option></select></label>${
    state.source === 'demo'
      ? `<label>Connection <select id="scenario"><option value="connected" ${
          state.scenario === 'connected' ? 'selected' : ''
        }>Connected example</option><option value="disconnected" ${
          state.scenario === 'disconnected' ? 'selected' : ''
        }>Disconnected example</option></select></label>`
      : ''
  }</div></header><main><div class="page-heading"><div><p class="location-label">All workspaces / ${
    names[state.variant]
  }</p><h1>${
    state.variant === 'attention'
      ? 'Know what needs you.'
      : state.variant === 'explorer'
      ? 'A place for every agent.'
      : 'See what is moving.'
  }</h1><p class="subtitle">${
    state.variant === 'attention'
      ? 'Scan attention signals, then get back to your work.'
      : state.variant === 'explorer'
      ? 'Explore agents, working directories, and shells in their workspace context.'
      : 'Follow the latest observations across your workspaces.'
  }</p></div><div class="connection ${
    stale ? 'is-stale' : ''
  }" role="status"><strong>${state.source === 'demo' ? 'Demo data · ' : ''}${
    state.error ? 'Feed unavailable' : titleCase(snapshot.connection.state)
  }</strong><span id="freshness"></span></div></div><div class="data-notice ${
    stale ? 'warning' : ''
  }">${
    state.source === 'demo'
      ? '<strong>Synthetic fixtures.</strong> No live agents are shown. '
      : '<strong>Live read-only observations.</strong> '
  }${
    stale
      ? esc(state.error || snapshot.connection.error || 'Connection lost.') +
        ' Retained statuses may be stale. Attention prioritization is paused until connected.'
      : 'Raw status comes from the observer. “Turn ended” is an inference, never proof of task success.'
  }</div><div class="toolbar"><label class="search-label"><span aria-hidden="true">⌕</span><input id="search" type="search" value="${esc(
    state.search
  )}" placeholder="Search agents, repositories, workspaces…" aria-label="Search agents, repositories, workspaces"></label><label>Show <select id="filter">${[
    ['all', 'All states'],
    ['attention', 'Needs attention'],
    ['working', 'Working'],
    ['blocked', 'Blocked'],
    ['idle', 'Idle'],
    ['unknown', 'Unknown'],
    ['shell', 'Shells only'],
  ]
    .map(
      ([key, name]) =>
        `<option value="${key}" ${
          state.filter === key ? 'selected' : ''
        }>${name}</option>`
    )
    .join('')}</select></label><span class="result-count">${
    filtered().length
  } of ${snapshot.panes.length} panes</span></div><div id="variant-content">${
    state.source === 'live' && state.receivedAt === null
      ? '<div class="empty"><strong>Waiting for the first live snapshot.</strong><p>Start the shared Herdr activity server on port 43187. This view will reconnect automatically. Demo fixtures remain available in the Data menu.</p></div>'
      : state.variant === 'attention'
      ? VariantAttention()
      : state.variant === 'explorer'
      ? VariantExplorer()
      : VariantActivity()
  }</div><details class="snapshot-state"><summary>Prototype state · ${
    names[state.variant]
  } · revision ${
    snapshot.revision
  }</summary><p>Shared state remains the same when switching layouts. Titles are pane titles, not verified task briefs.</p><pre>${esc(
    JSON.stringify({ ...state, snapshot }, null, 2)
  )}</pre></details></main><dialog id="pane-dialog" aria-labelledby="detail-title"></dialog>${
    __PROTOTYPE_DEV__
      ? `<nav class="prototype-switcher" aria-label="Prototype variants"><button id="previous-variant" data-action="previous" aria-label="Previous variant">←</button><span><small>Compare layouts</small><strong aria-live="polite">${
          variants.indexOf(state.variant) + 1
        } / 3 · ${
          names[state.variant]
        }</strong></span><button id="next-variant" data-action="next" aria-label="Next variant">→</button><span class="keyboard-hint">← → keys</span></nav>`
      : ''
  }`;
  if (focused) {
    const next = document.getElementById(focused);
    next?.focus();
    if (typeof cursor === 'number' && next?.type === 'search')
      next.setSelectionRange(cursor, cursor);
  }
  updateFreshness();
  if (openPane) details(openPane);
}
function updateFreshness() {
  const el = document.querySelector('#freshness');
  if (el)
    el.textContent = `${
      state.source === 'demo' ? 'Fixture captured' : 'Observer last success'
    } ${age(state.snapshot.connection.lastSuccessAt)}${
      state.error ? ' · stale' : ''
    }${
      state.source === 'live' && state.receivedAt
        ? ' · received ' + age(state.receivedAt)
        : ''
    }`;
}
function switchVariant(delta) {
  state.variant =
    variants[
      (variants.indexOf(state.variant) + delta + variants.length) %
        variants.length
    ];
  syncUrl();
  render();
  window.scrollTo(0, 0);
}
function details(id) {
  const p = state.snapshot.panes.find((p) => p.id === id);
  if (!p) return;
  const dialog = document.querySelector('#pane-dialog');
  dialog.dataset.pane = id;
  dialog.innerHTML = `<form method="dialog"><button class="close-dialog" aria-label="Close details">×</button></form><p class="location-label">${esc(
    workspaceName(p.workspaceId)
  )} / ${esc(p.agent || 'Shell pane')}</p><h2 id="detail-title">${esc(
    p.title
  )}</h2><div class="detail-badges">${badge(
    p
  )}</div><p class="detail-explanation">${
    p.attention === 'turn-ended'
      ? 'The observer saw working → idle while connected. The turn may have ended; task success is not known.'
      : p.rawStatus === 'blocked'
      ? 'The agent reports blocked. The reason is not provided by this contract; inspect the agent in Herdr for context.'
      : !p.agent
      ? 'This pane has no detected agent. It remains part of workspace inventory.'
      : 'This is a read-only observation. The pane title may not describe the current work.'
  }</p><dl class="detail-fields">${[
    ['Raw status', p.rawStatus],
    ['Reported status', p.reportedStatus || 'Not supplied'],
    ['Attention inference', p.attention || 'None'],
    ['Last observed activity', age(p.lastActivityAt)],
    ['Directory', p.cwd || 'Unknown'],
    ['Pane ID', p.id],
    ['Session ID', p.sessionId || 'Not supplied'],
    ['Endpoint', state.snapshot.endpoint],
    [
      'Connection',
      state.error ? 'Feed disconnected' : state.snapshot.connection.state,
    ],
  ]
    .map(([key, value]) => `<div><dt>${key}</dt><dd>${esc(value)}</dd></div>`)
    .join(
      ''
    )}</dl><p class="footnote">Identity is endpoint + pane ID. Duplicate session attachments are retained. This prototype does not focus, prompt, or control panes.</p>`;
  dialog.showModal();
}
let disconnect;
function setSource() {
  disconnect?.();
  state.error = null;
  state.receivedAt = null;
  if (state.source === 'demo') {
    state.snapshot = fixture(state.scenario);
    render();
    return;
  }
  state.snapshot = {
    version: 1,
    revision: 0,
    endpoint: 'Shared activity server',
    connection: { state: 'connecting', lastSuccessAt: null, error: null },
    workspaces: [],
    panes: [],
  };
  render();
  disconnect = connectActivity(
    (snapshot) => {
      state.snapshot = snapshot;
      state.receivedAt = Date.now();
      state.error = null;
      render();
    },
    (error) => {
      state.error = error;
      render();
    }
  );
}
app.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.search = event.target.value;
    render();
  }
});
app.addEventListener('change', (event) => {
  if (event.target.id === 'filter') {
    state.filter = event.target.value;
    render();
  }
  if (event.target.id === 'source') {
    state.source = event.target.value;
    syncUrl();
    setSource();
  }
  if (event.target.id === 'scenario') {
    state.scenario = event.target.value;
    state.snapshot = fixture(state.scenario);
    render();
  }
});
app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.pane) details(button.dataset.pane);
  if (button.dataset.action === 'next') switchVariant(1);
  if (button.dataset.action === 'previous') switchVariant(-1);
  if (button.dataset.action === 'clear') {
    state.search = '';
    state.filter = 'all';
    render();
  }
  if (button.dataset.workspace) {
    state.workspace = button.dataset.workspace;
    state.variant = 'explorer';
    syncUrl();
    render();
  }
  if (button.dataset.selectWorkspace) {
    state.workspace = button.dataset.selectWorkspace;
    render();
  }
});
document.addEventListener('keydown', (event) => {
  if (
    !__PROTOTYPE_DEV__ ||
    event.target.closest(
      'input,textarea,select,[contenteditable="true"],dialog'
    )
  )
    return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    switchVariant(event.key === 'ArrowRight' ? 1 : -1);
  }
});
window.addEventListener('popstate', () => {
  const p = new URLSearchParams(location.search);
  state.variant = variants.includes(p.get('variant'))
    ? p.get('variant')
    : 'attention';
  render();
});
setSource();
setInterval(() => {
  if (
    state.source === 'live' &&
    state.receivedAt &&
    !state.error &&
    Date.now() - state.receivedAt > 10000
  ) {
    state.error =
      'No snapshot received for 10 seconds. Cached inventory may be stale.';
    render();
  }
  updateFreshness();
}, 1000);
