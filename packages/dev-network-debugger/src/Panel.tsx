import React, { useState, useRef, useCallback, useMemo } from "react";
import type { DebuggerStore, RequestRecord } from "./interceptor";
import { toggleBlock, isBlocked, setNote, getNote } from "./interceptor";
import { useDebuggerStore } from "./useStore";
import { formatReport } from "./report";

type EndpointGroup = {
  method: string;
  pattern: string;
  urls: string[];
  lastStatus: RequestRecord["status"];
  count: number;
};

function groupRequests(requests: RequestRecord[]): EndpointGroup[] {
  const map = new Map<string, EndpointGroup>();

  for (const req of requests) {
    const key = `${req.method} ${req.pattern}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.urls.includes(req.url)) {
        existing.urls.push(req.url);
      }
      existing.lastStatus = req.status;
      existing.count++;
    } else {
      map.set(key, {
        method: req.method,
        pattern: req.pattern,
        urls: [req.url],
        lastStatus: req.status,
        count: 1,
      });
    }
  }

  return Array.from(map.values());
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#61affe",
  POST: "#49cc90",
  PUT: "#fca130",
  PATCH: "#50e3c2",
  DELETE: "#f93e3e",
};

function MethodBadge({ method }: { method: string }) {
  const bg = METHOD_COLORS[method] ?? "#888";
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        padding: "1px 6px",
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "monospace",
        marginRight: 6,
      }}
    >
      {method}
    </span>
  );
}

function StatusBadge({ status }: { status: RequestRecord["status"] }) {
  if (status === "pending") return null;
  const isErr =
    status === "blocked" || status === 0 || (typeof status === "number" && status >= 400);
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "monospace",
        color: isErr ? "#f93e3e" : "#49cc90",
        marginLeft: 6,
      }}
    >
      {status === "blocked" ? "BLOCKED" : status === 0 ? "ERR" : status}
    </span>
  );
}

function EndpointRow({
  group,
  blocked,
  onToggle,
  note,
  onNote,
}: {
  group: EndpointGroup;
  blocked: boolean;
  onToggle: () => void;
  note: string;
  onNote: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMultiple = group.urls.length > 1;

  return (
    <div style={{ borderBottom: "1px solid #333", padding: "6px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
        }}
      >
        {/* Expand arrow */}
        {hasMultiple ? (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              padding: 0,
              fontSize: 10,
              width: 14,
            }}
          >
            {expanded ? "v" : ">"}
          </button>
        ) : (
          <span style={{ width: 14, display: "inline-block" }} />
        )}

        <MethodBadge method={group.method} />

        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: blocked ? "#f93e3e" : "#e0e0e0",
            textDecoration: blocked ? "line-through" : "none",
          }}
          title={group.pattern}
        >
          {group.pattern}
        </span>

        {hasMultiple && (
          <span style={{ fontSize: 9, color: "#888" }}>x{group.count}</span>
        )}

        <StatusBadge status={group.lastStatus} />

        {/* Block toggle */}
        <button
          onClick={onToggle}
          style={{
            background: blocked ? "#f93e3e" : "#333",
            color: "#fff",
            border: "1px solid " + (blocked ? "#f93e3e" : "#555"),
            borderRadius: 3,
            padding: "2px 8px",
            fontSize: 10,
            cursor: "pointer",
            minWidth: 52,
          }}
        >
          {blocked ? "Unblock" : "Block"}
        </button>
      </div>

      {/* Expanded individual URLs */}
      {expanded && (
        <div style={{ paddingLeft: 20, marginTop: 4 }}>
          {group.urls.map((url, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "#888",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {url}
            </div>
          ))}
        </div>
      )}

      {/* Notes field (U11) */}
      {blocked && (
        <div style={{ marginTop: 4, paddingLeft: 18 }}>
          <input
            type="text"
            placeholder="What happened? e.g. stuck on loading..."
            value={note}
            onChange={(e) => onNote(e.target.value)}
            style={{
              width: "100%",
              background: "#252525",
              border: "1px solid #444",
              borderRadius: 3,
              color: "#e0e0e0",
              fontSize: 10,
              padding: "3px 6px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function DebuggerPanel({ store }: { store: DebuggerStore }) {
  const data = useDebuggerStore(store);
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const groups = useMemo(() => groupRequests(data.requests), [data._version]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        setPosition({
          x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
          y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
        });
      };

      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [position]
  );

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: minimized ? 180 : 380,
        maxHeight: minimized ? "auto" : "70vh",
        background: "#1a1a1a",
        color: "#e0e0e0",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 12,
        zIndex: 2147483647,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #333",
      }}
    >
      {/* Header / Drag Handle (U1, U2) */}
      <div
        onMouseDown={onDragStart}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#252525",
          cursor: "grab",
          userSelect: "none",
          borderBottom: "1px solid #333",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 12 }}>
          Network Debugger
          {groups.length > 0 && (
            <span style={{ color: "#888", fontWeight: 400, marginLeft: 6 }}>
              ({groups.length})
            </span>
          )}
        </span>
        <button
          onClick={() => setMinimized(!minimized)}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 4px",
          }}
        >
          {minimized ? "+" : "-"}
        </button>
      </div>

      {/* Endpoint List (U3-U10) */}
      {!minimized && (
        <div style={{ overflow: "auto", flex: 1, padding: "4px 12px" }}>
          {groups.length === 0 ? (
            <div
              style={{
                color: "#666",
                textAlign: "center",
                padding: "20px 0",
                fontSize: 11,
              }}
            >
              No requests observed yet.
              <br />
              Navigate the app to see endpoints.
            </div>
          ) : (
            groups.map((group) => (
              <EndpointRow
                key={`${group.method} ${group.pattern}`}
                group={group}
                blocked={isBlocked(store, group.method, group.pattern)}
                onToggle={() => toggleBlock(store, group.method, group.pattern)}
                note={getNote(store, group.method, group.pattern)}
                onNote={(text) => setNote(store, group.method, group.pattern, text)}
              />
            ))
          )}
        </div>
      )}

      {/* Copy Report button (U12) */}
      {!minimized && groups.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid #333",
            background: "#252525",
          }}
        >
          <button
            onClick={async () => {
              const report = formatReport(store);
              await navigator.clipboard.writeText(report);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              width: "100%",
              background: copied ? "#49cc90" : "#333",
              color: "#fff",
              border: "1px solid " + (copied ? "#49cc90" : "#555"),
              borderRadius: 3,
              padding: "4px 8px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy Report"}
          </button>
        </div>
      )}
    </div>
  );
}
