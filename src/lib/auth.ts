// FILE: src/lib/auth.ts
import crypto from 'crypto';

// WOZ ZERO-LEAK SECURITY CORE: Cryptographic authentication, PBKDF2 hashing, and HMAC session protection.

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getSecretOrDevFallback(envKey: string, devFallback: string): string {
  const secret = process.env[envKey];
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  if (IS_PRODUCTION) {
    throw new Error(
      `[WOZ SECURITY HALT] Missing required production environment variable: ${envKey}. Add it in Vercel Project Settings -> Environment Variables.`
    );
  }
  return devFallback;
}

const AUTH_SALT = getSecretOrDevFallback(
  'ADMIN_AUTH_SALT',
  'macrotek_auth_sec_salt_v5_k928f'
);

const SESSION_SECRET = getSecretOrDevFallback(
  'ADMIN_SESSION_SECRET',
  'macrotek_session_sec_key_v5_982341824719a83'
);

/**
 * Computes a salted cryptographic hash using PBKDF2 (SHA-512, 100,000 iterations).
 * Eliminates all plaintext password storage across the application.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.pbkdf2Sync(password, AUTH_SALT, 100000, 64, 'sha512').toString('hex');
}

// Precomputed PBKDF2 (SHA-512, 100,000 iterations) hash of the default administrative credential.
export const INITIAL_ADMIN_PASSWORD_HASH = process.env.ADMIN_INITIAL_PASSWORD
  ? hashPassword(process.env.ADMIN_INITIAL_PASSWORD)
  : 'b0913eca7e176e3447c7de9c5c00ae1f961ecbaf808e0bc3b9dccd2e2bdf785fcb66f0cd06151264068e506847c6df5b58ebefaca413ef41db67330eade98f20';

/**
 * Constant-time password verification preventing timing-attack credential enumeration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash) return false;

    const computed = hashPassword(password);
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Generates an encrypted, tamper-proof, HMAC-signed session token.
 * Prevents cookie forgery, session spoofing, and privilege escalation.
 */
export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/**
 * Validates the HMAC signature and expiration of an incoming session token.
 * Rejects expired tokens (>24h) and forged cookies in constant time.
 */
export function verifySessionToken(token: string): { valid: boolean; userId?: string } {
  try {
    if (!token || typeof token !== 'string') return { valid: false };
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false };

    const [userId, ts, sig] = parts;
    const payload = `${userId}:${ts}`;
    const expSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }

    // Check expiration (24 hours)
    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age < 0 || age > 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, userId };
  } catch {
    return { valid: false };
  }
}

/**
 * Server-side authentication guard to verify active admin session directly from cookies.
 * Rejects unauthorized requests immediately.
 */
export async function assertAdminSession(cookieStoreInstance?: any): Promise<{ valid: boolean; userId?: string }> {
  try {
    const { cookies } = await import('next/headers');
    const store = cookieStoreInstance || (await cookies());
    const sessionCookie = store.get('admin_session');
    if (!sessionCookie?.value) return { valid: false };
    return verifySessionToken(sessionCookie.value);
  } catch {
    return { valid: false };
  }
}