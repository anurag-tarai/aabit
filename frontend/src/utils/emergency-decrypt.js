// tools/emergency-decrypt.js
// Execution command: node emergency-decrypt.js

const { subtle } = globalThis.crypto;

// =========================================================================
// ── 💡 WHERE TO UPDATE VARIABLES ─────────────────────────────────────────
// =========================================================================
// Cut and paste the exact text strings from your database columns here:

const TARGET_VAULT_BLOB_B64 = 'PASTE_vault_pin_wrapped_FROM_DATABASE_HERE';
const USER_PLAINTEXT_SECRET = 'PASTE_THE_USER_PIN_HERE';
const TARGET_CIPHERTEXT_B64 = 'PASTE_markdown_content_FROM_DATABASE_HERE';

// =========================================================================
// ── CRYPTOGRAPHIC ENGINE LOGIC (DO NOT ALTER) ────────────────────────────
// =========================================================================

const ITERATIONS = 310000;

async function runEmergencyExtraction() {
  if (TARGET_VAULT_BLOB_B64.startsWith('PASTE_') || TARGET_CIPHERTEXT_B64.startsWith('PASTE_')) {
    console.error("\n[!] ERROR: Please paste actual base64 strings from your database columns into the configuration variables first.\n");
    return;
  }

  console.log("1. Parsing data structural envelopes...");
  const blob = Buffer.from(TARGET_VAULT_BLOB_B64, 'base64');
  const salt = blob.subarray(0, 16);
  const wrapIv = blob.subarray(16, 28);
  const rawKeyData = blob.subarray(28);

  console.log("2. Deriving internal Key Encryption Keys via PBKDF2...");
  const rawSecretMaterial = await subtle.importKey(
    'raw', 
    Buffer.from(USER_PLAINTEXT_SECRET, 'utf8'), 
    'PBKDF2', 
    false, 
    ['deriveKey']
  );
  
  const kek = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    rawSecretMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['unwrapKey']
  );

  console.log("3. Unwrapping the Master Data Encryption Key...");
  const masterKey = await subtle.unwrapKey(
    'raw',
    rawKeyData,
    kek,
    { name: 'AES-GCM', iv: wrapIv },
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  console.log("4. Parsing log entry content streams...");
  const contentBytes = Buffer.from(TARGET_CIPHERTEXT_B64, 'base64');
  const contentIv = contentBytes.subarray(0, 12);
  const ciphertext = contentBytes.subarray(12);

  console.log("5. Decrypting payload to cleartext...");
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: contentIv },
    masterKey,
    ciphertext
  );

  console.log("\n=======================================================");
  console.log("         DECRYPTED CONTENT PAYLOAD SUCCESS             ");
  console.log("=======================================================");
  console.log(Buffer.from(decryptedBuffer).toString('utf8'));
  console.log("=======================================================\n");
}

runEmergencyExtraction().catch(err => {
  console.error("\n[CRITICAL ERROR] Decryption failed.");
  console.error("Reason:", err.message);
  console.error("Verification hint: Check if the user PIN matches the target database row exactly.\n");
});