import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { commentInputSchema } from "./types.js";
import type { Db } from "./db.js";

export type ProjectKeys = Record<string, string>;

export type ServerOptions = {
  db: Db;
  /** Map of projectId → secret key. Loaded from env in main.ts. */
  projects: ProjectKeys;
  /** Allowed CORS origins. "*" to allow any. */
  corsOrigin: string | string[];
};

export function createServer({ db, projects, corsOrigin }: ServerOptions) {
  const app = new Hono();

  app.use(
    "/projects/*",
    cors({
      origin: corsOrigin,
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type"],
      maxAge: 3600,
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));

  // Auth middleware: read project key from Authorization header or ?key=, check against env.
  app.use("/projects/:projectId/*", async (c, next) => {
    const projectId = c.req.param("projectId");
    const expected = projects[projectId];
    if (!expected) {
      throw new HTTPException(404, { message: "unknown project" });
    }
    const provided = extractKey(c.req.header("authorization"), c.req.query("key"));
    if (!provided || provided !== expected) {
      throw new HTTPException(401, { message: "invalid project key" });
    }
    await next();
  });

  app.get("/projects/:projectId/comments", (c) => {
    const projectId = c.req.param("projectId");
    const url = c.req.query("url");
    if (!url) throw new HTTPException(400, { message: "url query param required" });
    return c.json({ comments: db.list(projectId, url) });
  });

  app.post("/projects/:projectId/comments", async (c) => {
    const projectId = c.req.param("projectId");
    const raw = await c.req.json().catch(() => null);
    const parsed = commentInputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new HTTPException(400, { message: parsed.error.message });
    }
    const created = db.create(projectId, parsed.data);
    return c.json({ comment: created }, 201);
  });

  app.delete("/projects/:projectId/comments/:id", (c) => {
    const projectId = c.req.param("projectId");
    const id = c.req.param("id");
    const removed = db.remove(projectId, id);
    if (!removed) throw new HTTPException(404, { message: "comment not found" });
    return c.body(null, 204);
  });

  return app;
}

function extractKey(authHeader: string | undefined, queryKey: string | undefined): string | null {
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  if (queryKey) return queryKey;
  return null;
}
