import type { Comment, CommentInput, CommentStore, Unsubscribe } from "../types.js";

const DEFAULT_KEY = "__prototype_comments__";
const STORAGE_EVENT = "prototype-comments:change";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalStorageStore(options?: { key?: string }): CommentStore {
  const key = options?.key ?? DEFAULT_KEY;

  const readAll = (): Comment[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeAll = (comments: Comment[]) => {
    localStorage.setItem(key, JSON.stringify(comments));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  };

  return {
    async list(url) {
      return readAll().filter((c) => c.url === url);
    },
    async create(input: CommentInput) {
      const comment: Comment = { ...input, id: makeId(), createdAt: Date.now() };
      writeAll([...readAll(), comment]);
      return comment;
    },
    async remove(id) {
      writeAll(readAll().filter((c) => c.id !== id));
    },
    onChange(listener: () => void): Unsubscribe {
      const handler = () => listener();
      window.addEventListener(STORAGE_EVENT, handler);
      // Cross-tab updates via native `storage` event.
      const storageHandler = (e: StorageEvent) => {
        if (e.key === key) listener();
      };
      window.addEventListener("storage", storageHandler);
      return () => {
        window.removeEventListener(STORAGE_EVENT, handler);
        window.removeEventListener("storage", storageHandler);
      };
    },
  };
}
