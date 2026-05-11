import type { Identity } from "../types.js";

const STORAGE_KEY = "__prototype_comments_identity__";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Identity).name === "string" &&
      typeof (parsed as Identity).email === "string" &&
      (parsed as Identity).name.length > 0 &&
      EMAIL_RE.test((parsed as Identity).email)
    ) {
      return parsed as Identity;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // localStorage disabled or quota — identity stays in-memory for the session only
  }
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}
