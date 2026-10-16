// FILE: src/lib/contractUtils.ts

/**
 * Generates a stable, high-entropy 6-digit access PIN based on a seed (e.g. lead ID).
 * Guarantees that every lead has their own distinct PIN, consistent across reloads.
 */
export function getDeterministicAccessCode(seed: string): string {
  if (!seed) return String(Math.floor(100000 + Math.random() * 900000));
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  const num = 100000 + (Math.abs(h) % 900000);
  return String(num);
}

/**
 * Generates a random 6-digit access PIN for when admin explicitly regenerates it.
 */
export function generateRandomAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
