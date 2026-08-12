const DB_NAME = 'OakbridgeOfflineDB';
const DB_VERSION = 1;
const BOOK_STORE = 'encrypted_books';

interface OfflineBookRecord {
     bookId: string;
     encryptedBlob: Blob;
     iv: string; // Base64
     encryptedKey: string; // Base64
     keyIv: string; // Base64
     savedAt: number;
}

export async function openOfflineDB(): Promise<IDBDatabase> {
     return new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          request.onupgradeneeded = () => {
               const db = request.result;
               if (!db.objectStoreNames.contains(BOOK_STORE)) {
                    db.createObjectStore(BOOK_STORE, { keyPath: 'bookId' });
               }
          };
     });
}

// Derive a Key Encrypting Key (KEK) deterministically from user ID
async function deriveKEK(userId: string): Promise<CryptoKey> {
     const encoder = new TextEncoder();
     const rawInput = encoder.encode(userId + '_oakbridge_offline_salt_2026_pepper');
     const hash = await window.crypto.subtle.digest('SHA-256', rawInput);
     return window.crypto.subtle.importKey(
          'raw',
          hash,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
     );
}

// Save book to IndexedDB (encrypt in background)
export async function saveBookOffline(bookId: string, userId: string, rawBuffer: ArrayBuffer): Promise<void> {
     try {
          const db = await openOfflineDB();

          // 1. Generate unique file key
          const fileKey = await window.crypto.subtle.generateKey(
               { name: 'AES-GCM', length: 256 },
               true,
               ['encrypt', 'decrypt']
          );

          // 2. Encrypt book buffer
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const encryptedBuffer = await window.crypto.subtle.encrypt(
               { name: 'AES-GCM', iv },
               fileKey,
               rawBuffer
          );

          // 3. Export file key
          const rawFileKey = await window.crypto.subtle.exportKey('raw', fileKey);

          // 4. Encrypt file key with user-specific KEK
          const kek = await deriveKEK(userId);
          const keyIv = window.crypto.getRandomValues(new Uint8Array(12));
          const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
               { name: 'AES-GCM', iv: keyIv },
               kek,
               rawFileKey
          );

          // Helper to convert buffer to base64
          const bufToBase64 = (buf: ArrayBuffer) => {
               const bytes = new Uint8Array(buf);
               let binary = '';
               for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
               }
               return btoa(binary);
          };

          const record: OfflineBookRecord = {
               bookId,
               encryptedBlob: new Blob([encryptedBuffer]),
               iv: bufToBase64(iv.buffer),
               encryptedKey: bufToBase64(encryptedKeyBuffer),
               keyIv: bufToBase64(keyIv.buffer),
               savedAt: Date.now(),
          };

          return new Promise<void>((resolve, reject) => {
               const transaction = db.transaction(BOOK_STORE, 'readwrite');
               const store = transaction.objectStore(BOOK_STORE);
               const request = store.put(record);
               request.onsuccess = () => resolve();
               request.onerror = () => reject(request.error);
          });
     } catch (err) {
          console.error('Failed to save book offline:', err);
          throw err;
     }
}

// Load book from IndexedDB (decrypt in-memory)
export async function loadBookOffline(bookId: string, userId: string): Promise<ArrayBuffer | null> {
     try {
          const db = await openOfflineDB();
          const record: OfflineBookRecord | undefined = await new Promise((resolve, reject) => {
               const transaction = db.transaction(BOOK_STORE, 'readonly');
               const store = transaction.objectStore(BOOK_STORE);
               const request = store.get(bookId);
               request.onsuccess = () => resolve(request.result);
               request.onerror = () => reject(request.error);
          });

          if (!record) return null;

          const base64ToBuf = (b64: string) => {
               const binary = atob(b64);
               const bytes = new Uint8Array(binary.length);
               for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
               }
               return bytes;
          };

          const iv = base64ToBuf(record.iv);
          const encryptedKey = base64ToBuf(record.encryptedKey);
          const keyIv = base64ToBuf(record.keyIv);

          // 1. Derive KEK
          const kek = await deriveKEK(userId);

          // 2. Decrypt file key
          const rawFileKey = await window.crypto.subtle.decrypt(
               { name: 'AES-GCM', iv: keyIv },
               kek,
               encryptedKey
          );

          const fileKey = await window.crypto.subtle.importKey(
               'raw',
               rawFileKey,
               { name: 'AES-GCM' },
               false,
               ['decrypt']
          );

          // 3. Decrypt book buffer
          const encryptedBuffer = await record.encryptedBlob.arrayBuffer();
          const decryptedBuffer = await window.crypto.subtle.decrypt(
               { name: 'AES-GCM', iv },
               fileKey,
               encryptedBuffer
          );

          return decryptedBuffer;
     } catch (err) {
          console.error('Failed to load book offline:', err);
          return null;
     }
}

// Check if book exists in IndexedDB
export async function isBookCached(bookId: string): Promise<boolean> {
     try {
          const db = await openOfflineDB();
          return new Promise<boolean>((resolve) => {
               const transaction = db.transaction(BOOK_STORE, 'readonly');
               const store = transaction.objectStore(BOOK_STORE);
               const request = store.getKey(bookId);
               request.onsuccess = () => resolve(request.result !== undefined);
               request.onerror = () => resolve(false);
          });
     } catch {
          return false;
     }
}
