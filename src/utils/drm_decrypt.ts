/**
 * Checks if the buffer starts with PDF or ZIP magic bytes,
 * indicating it is a raw unencrypted file.
 */
export function isUnencryptedFile(buffer: ArrayBuffer): boolean {
     if (buffer.byteLength < 4) return false;
     const view = new DataView(buffer);
     const magic = view.getUint32(0, false);
     // PDF magic bytes: 0x25504446 (%PDF)
     // ZIP/EPUB magic bytes: 0x504B0304 (PK\x03\x04)
     return magic === 0x25504446 || magic === 0x504B0304;
}

/**
 * Converts a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
     const len = hex.length;
     const bytes = new Uint8Array(len / 2);
     for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
     }
     return bytes;
}

/**
 * Decrypts a server-encrypted book buffer in-memory using Web Crypto API.
 * 
 * Assumes the server sends: [16-byte Auth Tag] + [Ciphertext]
 * Web Crypto API expects: [Ciphertext] + [16-byte Auth Tag]
 */
export async function decryptBookBuffer(
     encryptedBuffer: ArrayBuffer,
     keyHex: string,
     ivHex: string
): Promise<ArrayBuffer> {
     // 1. Fallback: If it's not encrypted (starts with PDF or ZIP magic bytes), return as-is
     if (isUnencryptedFile(encryptedBuffer)) {
          console.warn('[DRM] File is already unencrypted. Skipping decryption.');
          return encryptedBuffer;
     }

     if (encryptedBuffer.byteLength <= 16) {
          throw new Error('Encrypted buffer is too short to contain auth tag and ciphertext');
     }

     // 2. Parse key and iv
     const keyBytes = hexToBytes(keyHex);
     const ivBytes = hexToBytes(ivHex);

     // 3. Extract Node-style prepended auth tag (first 16 bytes) and ciphertext (rest)
     const authTag = encryptedBuffer.slice(0, 16);
     const ciphertext = encryptedBuffer.slice(16);

     // 4. Reconstruct Web Crypto GCM format: [Ciphertext] + [Auth Tag]
     const webCryptoCiphertext = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
     webCryptoCiphertext.set(new Uint8Array(ciphertext), 0);
     webCryptoCiphertext.set(new Uint8Array(authTag), ciphertext.byteLength);

     // 5. Import the raw AES-GCM key
     const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyBytes as any,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
     );

     // 6. Decrypt using Web Crypto API
     const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
               name: 'AES-GCM',
               iv: ivBytes as any,
               tagLength: 128 // 16 bytes auth tag = 128 bits
          },
          cryptoKey,
          webCryptoCiphertext as any
     );

     return decryptedBuffer;
}
