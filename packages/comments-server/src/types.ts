import { z } from "zod";

export const anchorSchema = z.object({
  cssSelector: z.string(),
  xpath: z.string(),
  elementTag: z.string(),
  elementId: z.string().optional(),
  textSnippet: z.string(),
  fingerprint: z.string(),
  neighborText: z.string().optional(),
});

export const pinAnchorSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const identitySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
});

export const placementSchema = z.enum(["document", "viewport"]);

export const commentInputSchema = z.object({
  body: z.string().min(1).max(5000),
  url: z.string().min(1).max(2048),
  author: identitySchema.optional(),
  anchor: anchorSchema,
  pin: pinAnchorSchema,
  placement: placementSchema,
  fallbackDocX: z.number(),
  fallbackDocY: z.number(),
  viewportW: z.number().int().positive(),
  viewportH: z.number().int().positive(),
});

export type Anchor = z.infer<typeof anchorSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type Placement = z.infer<typeof placementSchema>;
export type CommentInput = z.infer<typeof commentInputSchema>;

export type Comment = CommentInput & {
  id: string;
  projectId: string;
  createdAt: number;
};
