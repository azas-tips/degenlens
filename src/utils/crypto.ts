// Crypto Utility for API Key Encryption
// Uses Web Crypto API to encrypt/decrypt sensitive data

/**
 * Generate a device-specific encryption key
 * The key is derived from a combination of:
 * - A random UUID generated once per device
 * - Browser/extension information
 *
 * This key is stored in chrome.storage.local and reused for encryption/decryption
 */
async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const DEVICE_KEY_ID = '__crypto_device_key_id';

  // Check if we have a stored key ID
  const storage = await chrome.storage.local.get(DEVICE_KEY_ID);
  let keyId = storage[DEVICE_KEY_ID] as string | undefined;

  if (!keyId) {
    // Generate a new random key ID
    keyId = crypto.randomUUID();
    await chrome.storage.local.set({ [DEVICE_KEY_ID]: keyId });
  }

  // Derive a cryptographic key from the key ID
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(keyId);

  // Import the key material
  const importedKey = await crypto.subtle.importKey('raw', keyMaterial, { name: 'PBKDF2' }, false, [
    'deriveKey',
  ]);

  // Derive a stronger key using PBKDF2
  const salt = encoder.encode('degenlens-salt-v1'); // Static salt for consistency
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt a string value using AES-GCM
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encryptString(plaintext: string): Promise<string> {
  try {
    const key = await getOrCreateDeviceKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string value that was encrypted with encryptString
 * @param ciphertext - Base64-encoded encrypted data with IV prepended
 * @returns Decrypted plaintext string
 */
export async function decryptString(ciphertext: string): Promise<string> {
  try {
    const key = await getOrCreateDeviceKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Mask an API key for display purposes
 * Shows only first 6 and last 4 characters
 * Example: "sk-or-v1-abcdef123456" → "sk-or-****3456"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '****';
  }

  const firstPart = apiKey.substring(0, 6);
  const lastPart = apiKey.substring(apiKey.length - 4);

  return `${firstPart}****${lastPart}`;
}

/**
 * Check if a string is an encrypted value
 * Encrypted values are base64 strings with minimum length
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 20) return false;

  // Check if it's a valid base64 string
  try {
    const decoded = atob(value);
    return decoded.length >= 12; // At least IV length
  } catch {
    return false;
  }
}
