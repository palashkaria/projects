export type Anchor = {
  cssSelector: string;
  xpath: string;
  elementTag: string;
  elementId?: string;
  textSnippet: string;
  fingerprint: string;
  neighborText?: string;
};

export type PinAnchor = {
  /** 0–1 horizontal position within the anchor element */
  x: number;
  /** 0–1 vertical position within the anchor element */
  y: number;
};

export type Placement = "document" | "viewport";

export type Comment = {
  id: string;
  body: string;
  url: string;
  authorName?: string;
  createdAt: number;
  anchor: Anchor;
  pin: PinAnchor;
  placement: Placement;
  /** Fallback when the element can no longer be resolved. Document-space. */
  fallbackDocX: number;
  fallbackDocY: number;
  viewportW: number;
  viewportH: number;
};

export type CommentInput = Omit<Comment, "id" | "createdAt">;

export type Unsubscribe = () => void;

export interface CommentStore {
  list(url: string): Promise<Comment[]>;
  create(input: CommentInput): Promise<Comment>;
  remove(id: string): Promise<void>;
  onChange(listener: () => void): Unsubscribe;
}

export type PrototypeCommentsConfig = {
  /** Where the FAB renders. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** CSS color used for highlights, pins, focus rings. Default "#02527E". */
  accentColor?: string;
  /** Storage backend. Defaults to a localStorage adapter scoped to the current origin. */
  store?: CommentStore;
  /** Optional author name; if absent, the widget prompts and persists in localStorage. */
  authorName?: string;
  /** Override the URL key used for scoping comments. Defaults to `location.pathname`. */
  pageKey?: () => string;
  /** Fired after a comment is successfully created. */
  onCreate?: (comment: Comment) => void;
};

export type PrototypeCommentsInstance = {
  /** Programmatically enter selection mode. */
  start(): void;
  /** Cancel selection / close composer. */
  stop(): void;
  /** Tear down the widget completely. */
  destroy(): void;
};
