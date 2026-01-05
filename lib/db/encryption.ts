import CryptoJS from "crypto-js";

/**
 * Derives an encryption key from a password using PBKDF2
 * This provides stronger security than using the password directly
 *
 * @param password - User's password
 * @param salt - Salt for key derivation (should be unique per encryption)
 * @returns Derived key as a hex string
 */
function deriveKey(password: string, salt: string): string {
  // Use PBKDF2 with 10,000 iterations (balance between security and performance)
  // This makes brute-force attacks much slower
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 10000, // 10k iterations (takes ~100ms, good security)
  }).toString();
}

/**
 * Encrypts a string using AES encryption with proper key derivation
 * Uses PBKDF2 to derive a strong key from the password
 *
 * @param text - Text to encrypt
 * @param password - User's password
 * @param salt - Optional salt (if not provided, generates one)
 * @returns Encrypted text in format: salt$encryptedData
 */
export function encrypt(text: string, password: string, salt?: string): string {
  // Generate salt if not provided (random 16 bytes = 32 hex chars)
  const encryptionSalt = salt || CryptoJS.lib.WordArray.random(16).toString();

  // Derive key from password using PBKDF2
  const key = deriveKey(password, encryptionSalt);

  // Encrypt with derived key
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();

  // Return salt + encrypted data (salt needed for decryption)
  return `${encryptionSalt}$${encrypted}`;
}

/**
 * Decrypts an encrypted string using AES decryption with proper key derivation
 * Supports both new format (PBKDF2) and old format (direct password) for backward compatibility
 *
 * @param encryptedText - Encrypted text in format: salt$encryptedData (new) or just encrypted (old)
 * @param password - User's password
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string, password: string): string {
  try {
    // Check if we have the new format (salt$encrypted) or old format (just encrypted)
    const parts = encryptedText.split("$");

    if (parts.length === 2) {
      // New format: salt$encrypted (PBKDF2-based)
      const [salt, encrypted] = parts;

      // Derive key from password using PBKDF2
      const key = deriveKey(password, salt);

      // Decrypt with derived key
      const bytes = CryptoJS.AES.decrypt(encrypted, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error("Decryption failed - empty result");
      }

      return decrypted;
    } else {
      // Old format: just encrypted (CryptoJS's built-in EVP_BytesToKey)
      // Try to decrypt using the old method for backward compatibility
      const bytes = CryptoJS.AES.decrypt(encryptedText, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error("Decryption failed - empty result");
      }

      return decrypted;
    }
  } catch {
    throw new Error(
      "Failed to decrypt data. Invalid password or corrupted data."
    );
  }
}

/**
 * Generates a hash from a string (for password verification)
 */
export function hash(text: string): string {
  return CryptoJS.SHA256(text).toString();
}
