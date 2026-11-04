const DB_NAME = "secure_key_db";
const DB_VERSION = 1;
const STORE_NAME = "crypto_keys";
const KEY_ID = "gemini_aes_gcm_key";

const ENCRYPTED_KEY_STORAGE = "encrypted_api_key";
const IV_STORAGE = "api_key_iv";
const LEGACY_KEYS = ["silaSub_user_gemini_api_key_v1"];

function isCryptoSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.subtle !== "undefined" &&
    typeof window.indexedDB !== "undefined"
  );
}

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredCryptoKey(): Promise<CryptoKey | null> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_ID);

    req.onsuccess = () => {
      db.close();
      resolve((req.result as CryptoKey) || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function storeCryptoKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, KEY_ID);

    req.onsuccess = () => {
      db.close();
      resolve();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function deleteStoredCryptoKey(): Promise<void> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return;
  }
  try {
    const db = await openKeyDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_ID);

      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    // Ignore IndexedDB cleanup errors
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Mã hóa API Key bằng AES-GCM 256-bit (extractable: false)
 * Lưu CryptoKey vào IndexedDB và chỉ lưu bản mã + IV vào localStorage.
 */
export async function saveSecureApiKey(rawApiKey: string): Promise<boolean> {
  if (!isCryptoSupported()) return false;

  try {
    const cleanKey = rawApiKey.trim();
    if (!cleanKey) return false;

    // Sinh khóa đối xứng AES-GCM 256-bit với extractable: false (không thể xuất khóa thô)
    const cryptoKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );

    // Tạo vector khởi tạo ngẫu nhiên 12-byte (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(cleanKey);

    // Mã hóa dữ liệu kèm Authentication Tag của AES-GCM
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
      },
      cryptoKey,
      encodedData
    );

    // Cất CryptoKey vào IndexedDB riêng biệt
    await storeCryptoKey(cryptoKey);

    // Lưu bản mã và IV vào localStorage
    localStorage.setItem(
      ENCRYPTED_KEY_STORAGE,
      uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
    );
    localStorage.setItem(IV_STORAGE, uint8ArrayToBase64(iv));

    // Xóa sạch các khóa dạng rõ (plaintext) cũ nếu có
    for (const legacyKey of LEGACY_KEYS) {
      localStorage.removeItem(legacyKey);
    }

    return true;
  } catch (err) {
    console.error("Error encrypting API key:", err);
    return false;
  }
}

/**
 * Giải mã và lấy API Key từ kho lưu trữ bảo mật.
 * Tự động nâng cấp (migrate) nếu phát hiện khóa dạng rõ cũ.
 * Tự hủy toàn bộ khóa ở cả localStorage và IndexedDB nếu phát hiện can thiệp/giả mạo.
 */
export async function getSecureApiKey(): Promise<string | null> {
  if (!isCryptoSupported()) return null;

  try {
    // 1. Tự động chuyển đổi (Auto-Migration) nếu còn tồn tại key plaintext cũ
    for (const legacyKey of LEGACY_KEYS) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue && legacyValue.trim()) {
        const trimmed = legacyValue.trim();
        await saveSecureApiKey(trimmed);
        return trimmed;
      }
    }

    // 2. Kiểm tra bản mã và IV trong localStorage
    const encryptedBase64 = localStorage.getItem(ENCRYPTED_KEY_STORAGE);
    const ivBase64 = localStorage.getItem(IV_STORAGE);

    if (!encryptedBase64 || !ivBase64) {
      return null;
    }

    // 3. Lấy CryptoKey từ IndexedDB
    const cryptoKey = await getStoredCryptoKey();
    if (!cryptoKey) {
      // Mất đồng bộ giữa localStorage và IndexedDB -> Tự hủy để làm sạch
      await removeSecureApiKey();
      return null;
    }

    const encryptedBytes = base64ToUint8Array(encryptedBase64);
    const ivBytes = base64ToUint8Array(ivBase64);

    // 4. Giải mã và xác thực toàn vẹn dữ liệu (Authentication Tag)
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes as BufferSource,
      },
      cryptoKey,
      encryptedBytes as BufferSource
    );

    const decryptedKey = new TextDecoder().decode(decryptedBuffer).trim();
    return decryptedKey || null;
  } catch (err) {
    // Phát hiện dữ liệu bị sửa đổi/làm giả -> Tự hủy toàn bộ dữ liệu khóa
    console.warn("Tamper or corruption detected on stored API key. Purging key data.", err);
    await removeSecureApiKey();
    return null;
  }
}

/**
 * Xóa sạch toàn bộ dữ liệu khóa ở cả localStorage và IndexedDB.
 */
export async function removeSecureApiKey(): Promise<void> {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    localStorage.removeItem(ENCRYPTED_KEY_STORAGE);
    localStorage.removeItem(IV_STORAGE);
    for (const legacyKey of LEGACY_KEYS) {
      localStorage.removeItem(legacyKey);
    }
  }
  await deleteStoredCryptoKey();
}
