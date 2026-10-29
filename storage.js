const VAULT_KEY = "vault";
const META_KEY = "meta";
const SESSION_KEY = "session";
const LOCKOUT_KEY = "lockout_state";

// Google Account Sync (chrome.storage.sync) chunking configuration
const SYNC_META_KEY = "sync_vault_meta";
const SYNC_CHUNK_PREFIX = "sync_vault_chunk_";
const CHUNK_SIZE = 6000; // Safe chunk size below chrome.storage.sync 8192-byte limit

function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve(result);
    });
  });
}

function setStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve();
    });
  });
}

function getSessionStorage(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage.session) {
      return resolve({});
    }
    chrome.storage.session.get(keys, (result) => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve(result);
    });
  });
}

function setSessionStorage(data) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage.session) {
      return resolve();
    }
    chrome.storage.session.set(data, () => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve();
    });
  });
}

function clearSessionStorage(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage.session) {
      return resolve();
    }
    chrome.storage.session.remove(keys, () => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve();
    });
  });
}

export function isSyncAvailable() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.sync);
}

export async function getVaultRecord() {
  const result = await getStorage([VAULT_KEY]);
  return result[VAULT_KEY] || null;
}

export async function setVaultRecord(record) {
  await setStorage({ [VAULT_KEY]: record });
}

export async function getMeta() {
  const result = await getStorage([META_KEY]);
  return {
    locked: true,
    lastActive: 0,
    lockTimeoutMs: 2 * 60 * 1000,
    sortMode: "newest",
    theme: "dark",
    syncEnabled: false,
    lastSyncedAt: 0,
    clipboardClearSec: 30,
    defaultMaskCodes: true,
    timeOffsetMs: 0,
    ...(result[META_KEY] || {}),
  };
}

export async function setMeta(meta) {
  await setStorage({ [META_KEY]: meta });
}

export async function updateMeta(patch) {
  const meta = await getMeta();
  const updated = { ...meta, ...patch };
  await setMeta(updated);
  return updated;
}

export async function getSession() {
  const result = await getSessionStorage([SESSION_KEY]);
  return result[SESSION_KEY] || null;
}

export async function setSession(session) {
  await setSessionStorage({ [SESSION_KEY]: session });
}

export async function clearSession() {
  await clearSessionStorage([SESSION_KEY]);
}

export async function getLockoutState() {
  const result = await getStorage([LOCKOUT_KEY]);
  return result[LOCKOUT_KEY] || { failedAttempts: 0, lockoutUntil: 0 };
}

export async function setLockoutState(state) {
  await setStorage({ [LOCKOUT_KEY]: state });
}

export async function clearLockoutState() {
  await setStorage({ [LOCKOUT_KEY]: { failedAttempts: 0, lockoutUntil: 0 } });
}

// ── Google Account Sync (chrome.storage.sync) API ─────────────────────────────

/**
 * Retrieve the encrypted vault record from Google Chrome Sync storage.
 * Assembles chunked pieces if stored across multiple keys.
 */
export async function getSyncVaultRecord() {
  if (!isSyncAvailable()) return null;

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }

      if (!items) return resolve(null);

      // Check chunked meta
      const meta = items[SYNC_META_KEY];
      if (meta && typeof meta.chunkCount === "number" && meta.chunkCount > 0) {
        let fullString = "";
        for (let i = 0; i < meta.chunkCount; i++) {
          const chunk = items[`${SYNC_CHUNK_PREFIX}${i}`];
          if (typeof chunk !== "string") {
            console.warn(`Missing sync vault chunk ${i}`);
            return resolve(null);
          }
          fullString += chunk;
        }

        try {
          const record = JSON.parse(fullString);
          return resolve(record);
        } catch (err) {
          console.error("Failed to parse synced vault JSON:", err);
          return resolve(null);
        }
      }

      // Fallback for single key legacy sync if any
      if (items[VAULT_KEY]) {
        return resolve(items[VAULT_KEY]);
      }

      resolve(null);
    });
  });
}

/**
 * Save an encrypted vault record to Google Chrome Sync storage.
 * Automatically chunks payload to avoid QUOTA_BYTES_PER_ITEM limit (8KB).
 */
export async function setSyncVaultRecord(record) {
  if (!isSyncAvailable()) {
    throw new Error("Chrome sync storage is not available.");
  }

  const payload = JSON.stringify({
    ...record,
    updatedAt: record.updatedAt || Date.now(),
  });

  const chunkCount = Math.ceil(payload.length / CHUNK_SIZE);
  const dataToSet = {
    [SYNC_META_KEY]: {
      chunkCount,
      updatedAt: record.updatedAt || Date.now(),
      version: record.version || 1,
      totalLength: payload.length,
    },
  };

  for (let i = 0; i < chunkCount; i++) {
    dataToSet[`${SYNC_CHUNK_PREFIX}${i}`] = payload.slice(
      i * CHUNK_SIZE,
      (i + 1) * CHUNK_SIZE
    );
  }

  // Find any obsolete chunk keys from a previous larger save
  const existingItems = await new Promise((resolve) => {
    chrome.storage.sync.get(null, (res) => resolve(res || {}));
  });

  const oldMeta = existingItems[SYNC_META_KEY];
  const keysToRemove = [];
  if (oldMeta && oldMeta.chunkCount > chunkCount) {
    for (let i = chunkCount; i < oldMeta.chunkCount; i++) {
      keysToRemove.push(`${SYNC_CHUNK_PREFIX}${i}`);
    }
  }

  await new Promise((resolve, reject) => {
    chrome.storage.sync.set(dataToSet, () => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve();
    });
  });

  if (keysToRemove.length > 0) {
    await new Promise((resolve) => {
      chrome.storage.sync.remove(keysToRemove, () => resolve());
    });
  }
}

/**
 * Remove all synced vault chunks and sync metadata from Google Cloud Sync storage.
 */
export async function clearSyncVault() {
  if (!isSyncAvailable()) return;

  const allItems = await new Promise((resolve) => {
    chrome.storage.sync.get(null, (res) => resolve(res || {}));
  });

  const keysToRemove = Object.keys(allItems).filter(
    (k) =>
      k.startsWith(SYNC_CHUNK_PREFIX) ||
      k === SYNC_META_KEY ||
      k === VAULT_KEY ||
      k === "sync_meta"
  );

  if (keysToRemove.length > 0) {
    await new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keysToRemove, () => {
        if (chrome.runtime?.lastError) {
          return reject(new Error(chrome.runtime?.lastError.message));
        }
        resolve();
      });
    });
  }
}

/**
 * Get sync storage usage and statistics.
 */
export async function getSyncStorageStats() {
  if (!isSyncAvailable()) {
    return { available: false, chunkCount: 0, totalBytes: 0, updatedAt: 0 };
  }

  const items = await new Promise((resolve) => {
    chrome.storage.sync.get(null, (res) => resolve(res || {}));
  });

  const meta = items[SYNC_META_KEY];
  if (!meta) {
    return { available: true, hasData: false, chunkCount: 0, totalBytes: 0, updatedAt: 0 };
  }

  let totalBytes = 0;
  for (let i = 0; i < (meta.chunkCount || 0); i++) {
    const chunk = items[`${SYNC_CHUNK_PREFIX}${i}`];
    if (chunk) {
      totalBytes += chunk.length;
    }
  }

  return {
    available: true,
    hasData: true,
    chunkCount: meta.chunkCount || 0,
    totalBytes: meta.totalLength || totalBytes,
    updatedAt: meta.updatedAt || 0,
  };
}

export async function clearAllData(options = {}) {
  const { clearCloudSync = true } = options;
  await clearSession();

  if (clearCloudSync) {
    try {
      await clearSyncVault();
    } catch (e) {
      console.warn("Failed to clear cloud sync storage:", e);
    }
  }

  await new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime?.lastError) {
        return reject(new Error(chrome.runtime?.lastError.message));
      }
      resolve();
    });
  });
}
