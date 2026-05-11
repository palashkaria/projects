import type { Comment, CommentInput, CommentStore, Unsubscribe } from "../types.js";

export type HttpStoreConfig = {
  /** Base URL of the comments-server, e.g. "https://comments.example.com". No trailing slash. */
  endpoint: string;
  /** Project identifier that namespaces comments on the server. */
  projectId: string;
  /** Secret key passed as `Authorization: Bearer <key>` on every request. */
  projectKey: string;
  /** How often to poll for changes, in ms. Default 5000. Set to 0 to disable polling. */
  pollMs?: number;
  /** Fetch override (testing). */
  fetch?: typeof fetch;
};

export function createHttpStore(config: HttpStoreConfig): CommentStore {
  const base = config.endpoint.replace(/\/+$/, "");
  const projectId = encodeURIComponent(config.projectId);
  const projectUrl = `${base}/projects/${projectId}/comments`;
  const fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
  const pollMs = config.pollMs ?? 5000;

  const headers = (): HeadersInit => ({
    Authorization: `Bearer ${config.projectKey}`,
    "Content-Type": "application/json",
  });

  const listeners = new Set<() => void>();
  const notify = () => {
    for (const l of listeners) l();
  };

  // Track last-seen comment fingerprints per URL so polling only notifies on real change.
  const lastSeen = new Map<string, string>();
  const fingerprint = (comments: Comment[]) =>
    comments.map((c) => c.id).join("|") + ":" + comments.length;

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let currentUrl: string | null = null;

  const startPolling = (url: string) => {
    currentUrl = url;
    if (pollTimer || pollMs <= 0) return;
    pollTimer = setInterval(async () => {
      if (!currentUrl) return;
      try {
        const list = await listInternal(currentUrl);
        const fp = fingerprint(list);
        const prev = lastSeen.get(currentUrl);
        if (prev !== fp) {
          lastSeen.set(currentUrl, fp);
          notify();
        }
      } catch {
        // Network blip — try again on next tick.
      }
    }, pollMs);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const listInternal = async (url: string): Promise<Comment[]> => {
    const res = await fetchImpl(
      `${projectUrl}?url=${encodeURIComponent(url)}`,
      { headers: headers() },
    );
    if (!res.ok) throw new Error(`comments-server list failed: ${res.status}`);
    const json = (await res.json()) as { comments: Comment[] };
    return json.comments;
  };

  return {
    async list(url: string): Promise<Comment[]> {
      const comments = await listInternal(url);
      lastSeen.set(url, fingerprint(comments));
      startPolling(url);
      return comments;
    },
    async create(input: CommentInput): Promise<Comment> {
      const res = await fetchImpl(projectUrl, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`comments-server create failed: ${res.status} ${text}`);
      }
      const json = (await res.json()) as { comment: Comment };
      // Bust local fingerprint so the polling loop notifies any other tabs immediately
      // on its next tick, and force a refresh locally.
      if (currentUrl) lastSeen.delete(currentUrl);
      notify();
      return json.comment;
    },
    async remove(id: string): Promise<void> {
      const res = await fetchImpl(`${projectUrl}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok && res.status !== 404) {
        throw new Error(`comments-server remove failed: ${res.status}`);
      }
      if (currentUrl) lastSeen.delete(currentUrl);
      notify();
    },
    onChange(listener: () => void): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stopPolling();
      };
    },
  };
}
