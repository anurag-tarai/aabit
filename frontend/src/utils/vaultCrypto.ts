/**
 * vaultCrypto.ts
 *
 * All cryptographic primitives for the Aabit Experience Vault.
 * Uses the browser's native Web Crypto API — no external libraries needed.
 *
 * Architecture:
 *   - Master Key  (AES-GCM-256) → encrypts/decrypts journal content
 *   - PIN KEK     (PBKDF2 → AES-GCM) → wraps the Master Key
 *   - Phrase KEK  (PBKDF2 → AES-GCM) → wraps the Master Key (recovery copy)
 *
 * The server stores only the two wrapped (encrypted) Master Key blobs.
 * The server never sees the raw Master Key or the user's PIN/phrase.
 */

const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommended minimum
const SALT_BYTES = 16;
const IV_BYTES = 12;

// ── Encoding helpers ──────────────────────────────────────────────────────────
// Safe base64 that handles multi-byte characters (emojis, Hindi, etc.)

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Key derivation ────────────────────────────────────────────────────────────

async function deriveKEK(secret: string, salt: BufferSource): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

// ── Master Key generation ─────────────────────────────────────────────────────

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // must be extractable so it can be wrapped
    ["encrypt", "decrypt"],
  );
}

// ── Wrap / Unwrap ─────────────────────────────────────────────────────────────
// Output format: base64( salt[16] | iv[12] | wrappedKey[variable] )

export async function wrapMasterKey(
  masterKey: CryptoKey,
  secret: string,
): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(SALT_BYTES));
  crypto.getRandomValues(salt);

  const iv = new Uint8Array(new ArrayBuffer(IV_BYTES));
  crypto.getRandomValues(iv);
  const kek = await deriveKEK(secret, salt);

  const wrapped = await crypto.subtle.wrapKey("raw", masterKey, kek, {
    name: "AES-GCM",
    iv,
  });

  const payload = new Uint8Array(SALT_BYTES + IV_BYTES + wrapped.byteLength);
  payload.set(salt, 0);
  payload.set(iv, SALT_BYTES);
  payload.set(new Uint8Array(wrapped), SALT_BYTES + IV_BYTES);

  return toBase64(payload.buffer);
}

export async function unwrapMasterKey(
  wrappedB64: string,
  secret: string,
): Promise<CryptoKey> {
  const payload = fromBase64(wrappedB64);
  const salt = payload.slice(0, SALT_BYTES);
  const iv = payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const wrapped = payload.slice(SALT_BYTES + IV_BYTES);
  const kek = await deriveKEK(secret, salt);

  return crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    kek,
    { name: "AES-GCM", iv },
    { name: "AES-GCM", length: 256 },
    false,  // ← NON-EXTRACTABLE for session use
    ["encrypt", "decrypt"],  // ← no wrapKey here
  );
}

// Special variant that returns an extractable key — used only for the
// PIN-reset flow where we need to re-wrap with a new PIN.
export async function unwrapMasterKeyExtractable(
  wrappedB64: string,
  secret: string,
): Promise<CryptoKey> {
  const payload = fromBase64(wrappedB64);
  const salt = payload.slice(0, SALT_BYTES);
  const iv = payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const wrapped = payload.slice(SALT_BYTES + IV_BYTES);
  const kek = await deriveKEK(secret, salt);

  return crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    kek,
    { name: "AES-GCM", iv },
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed to re-wrap with new PIN
    ["encrypt", "decrypt", "wrapKey"],
  );
}

// ── Content encryption / decryption ──────────────────────────────────────────
// Output format: base64( iv[12] | ciphertext )

export async function encryptContent(
  plaintext: string,
  masterKey: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    encoded,
  );

  const payload = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), IV_BYTES);

  return toBase64(payload.buffer);
}

export async function decryptContent(
  ciphertextB64: string,
  masterKey: CryptoKey,
): Promise<string> {
  const payload = fromBase64(ciphertextB64);
  const iv = payload.slice(0, IV_BYTES);
  const ciphertext = payload.slice(IV_BYTES);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    masterKey,
    ciphertext,
  );
  return new TextDecoder().decode(plainBuffer);
}

export function generateRecoveryPhrase(): string {
  // 16 random bytes = 128 bits of entropy, encoded as 32 hex chars
  // Presented as 8 groups of 4 for readability.
  // Users copy this as their backup — no word-list dependency needed.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  // Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx (8 groups of 4)
  return hex.match(/.{4}/g)!.join('-');
}

// ── In-memory session store ───────────────────────────────────────────────────
// The CryptoKey object never touches localStorage or sessionStorage.
// It lives only in this module's closure for the lifetime of the browser tab.

let _sessionKey: CryptoKey | null = null;

export const vault = {
  lock: () => {
    _sessionKey = null;
  },
  unlock: (key: CryptoKey) => {
    _sessionKey = key;
  },
  getKey: (): CryptoKey | null => _sessionKey,
  isOpen: (): boolean => _sessionKey !== null,
};

// ── localStorage flag helpers ─────────────────────────────────────────────────
// localStorage only holds the ENCRYPTED envelopes, never the raw master key.

export const VAULT_LS = {
  INITIALIZED: "aabit_vault_init", // 'true' once setup is complete
} as const;

export function isVaultInitialized(): boolean {
  return localStorage.getItem(VAULT_LS.INITIALIZED) === "true";
}
