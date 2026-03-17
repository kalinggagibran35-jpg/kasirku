/**
 * Production-grade password hashing using Web Crypto API (SHA-256)
 * No external dependencies needed - runs natively in all modern browsers
 */

const SALT_PREFIX = 'KasirKu_v2_';

/**
 * Hash a password using SHA-256 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salted = SALT_PREFIX + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Check if a string looks like a hashed password (64 hex chars = SHA-256)
 */
export function isHashed(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
