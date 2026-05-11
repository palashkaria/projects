import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import type { Comment, CommentInput } from "./types.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  url TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  anchor_json TEXT NOT NULL,
  pin_x REAL NOT NULL,
  pin_y REAL NOT NULL,
  placement TEXT NOT NULL,
  fallback_doc_x REAL NOT NULL,
  fallback_doc_y REAL NOT NULL,
  viewport_w INTEGER NOT NULL,
  viewport_h INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_project_url ON comments(project_id, url);
`;

type Row = {
  id: string;
  project_id: string;
  url: string;
  body: string;
  author_name: string | null;
  author_email: string | null;
  anchor_json: string;
  pin_x: number;
  pin_y: number;
  placement: string;
  fallback_doc_x: number;
  fallback_doc_y: number;
  viewport_w: number;
  viewport_h: number;
  created_at: number;
};

export type Db = {
  list(projectId: string, url: string): Comment[];
  create(projectId: string, input: CommentInput): Comment;
  remove(projectId: string, id: string): boolean;
  close(): void;
};

export function openDb(path: string): Db {
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(SCHEMA);

  const listStmt = sqlite.prepare<[string, string], Row>(
    "SELECT * FROM comments WHERE project_id = ? AND url = ? ORDER BY created_at ASC",
  );
  const insertStmt = sqlite.prepare(
    `INSERT INTO comments
     (id, project_id, url, body, author_name, author_email, anchor_json,
      pin_x, pin_y, placement, fallback_doc_x, fallback_doc_y,
      viewport_w, viewport_h, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const deleteStmt = sqlite.prepare(
    "DELETE FROM comments WHERE project_id = ? AND id = ?",
  );

  const fromRow = (r: Row): Comment => ({
    id: r.id,
    projectId: r.project_id,
    url: r.url,
    body: r.body,
    author:
      r.author_name && r.author_email
        ? { name: r.author_name, email: r.author_email }
        : undefined,
    anchor: JSON.parse(r.anchor_json),
    pin: { x: r.pin_x, y: r.pin_y },
    placement: r.placement === "viewport" ? "viewport" : "document",
    fallbackDocX: r.fallback_doc_x,
    fallbackDocY: r.fallback_doc_y,
    viewportW: r.viewport_w,
    viewportH: r.viewport_h,
    createdAt: r.created_at,
  });

  return {
    list(projectId, url) {
      return listStmt.all(projectId, url).map(fromRow);
    },
    create(projectId, input) {
      const id = randomId();
      const createdAt = Date.now();
      insertStmt.run(
        id,
        projectId,
        input.url,
        input.body,
        input.author?.name ?? null,
        input.author?.email ?? null,
        JSON.stringify(input.anchor),
        input.pin.x,
        input.pin.y,
        input.placement,
        input.fallbackDocX,
        input.fallbackDocY,
        input.viewportW,
        input.viewportH,
        createdAt,
      );
      return { ...input, id, projectId, createdAt };
    },
    remove(projectId, id) {
      const result = deleteStmt.run(projectId, id);
      return result.changes > 0;
    },
    close() {
      sqlite.close();
    },
  };
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
