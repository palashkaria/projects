import { serve } from "@hono/node-server";
import { openDb } from "./db.js";
import { createServer, type ProjectKeys } from "./server.js";

const port = Number(process.env.PORT ?? 4040);
const dbPath = process.env.DB_PATH ?? "./data/comments.db";
const corsEnv = process.env.CORS_ORIGIN ?? "*";
const corsOrigin = corsEnv === "*" ? "*" : corsEnv.split(",").map((s) => s.trim());

const projectsRaw = process.env.PROJECTS ?? "{}";
let projects: ProjectKeys;
try {
  const parsed = JSON.parse(projectsRaw);
  if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
    throw new Error("PROJECTS must be a JSON object");
  }
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v !== "string") throw new Error(`project key for "${k}" must be a string`);
  }
  projects = parsed as ProjectKeys;
} catch (err) {
  console.error("[comments-server] invalid PROJECTS env var:", err);
  process.exit(1);
}

if (Object.keys(projects).length === 0) {
  console.warn(
    '[comments-server] no projects configured. set PROJECTS=\'{"demo":"sk_..."}\' to enable.',
  );
}

const db = openDb(dbPath);
const app = createServer({ db, projects, corsOrigin });

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[comments-server] listening on http://localhost:${info.port}`);
  console.log(`[comments-server] db: ${dbPath}`);
  console.log(`[comments-server] projects: ${Object.keys(projects).join(", ") || "(none)"}`);
});

const shutdown = (signal: string) => {
  console.log(`[comments-server] ${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
