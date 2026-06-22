import { customAlphabet } from "nanoid";

// base62, length 7 → ~3.5 trillion combinations. Collisions are handled at
// insert time by the table's UNIQUE(slug) constraint + retry in /api/links.
const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateSlug = customAlphabet(ALPHABET, 7);
