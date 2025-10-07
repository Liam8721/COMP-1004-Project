// Cryptographic utilities for hashing, key derivation, encryption, and decryption
class Crypto_Web_API {
  static async hash_data(data) {
    return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  }

  static async create_recovery_key(hashed_password, salt) {
    const imported_key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(hashed_password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const recoveryKeyBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      imported_key,
      256
    );

    return btoa(String.fromCharCode(...new Uint8Array(recoveryKeyBits)));
  }

  static async encrypt_recovery_key(data, salt, recovery_key) {
    const base_key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(data),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derived_encryption_key = await crypto.subtle.deriveKey({
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
      base_key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derived_encryption_key,
      new TextEncoder().encode(recovery_key)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  }

  static compare_hashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
      return false;
    }
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        return false;
      }
    }
    return true;
  }

  static async decrypt_recovery_key(encrypted_data, combined_hash) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(combined_hash),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derivedDecryptionKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(encrypted_data.salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt", "encrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encrypted_data.iv) },
      derivedDecryptionKey,
      new Uint8Array(encrypted_data.ciphertext)
    );
    
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(decrypted);
  }
}