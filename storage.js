const VAULT_KEY = "vault";
const META_KEY = "meta";
const SESSION_KEY = "session";

function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(result);
    });
  });
}

function setStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
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
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
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
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
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
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
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
  return (
    result[META_KEY] || {
      locked: true,
      lastActive: 0,
      lockTimeoutMs: 2 * 60 * 1000,
      sortMode: "newest",
      theme: "dark",
    }
  );
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

export async function clearAllData() {
  await clearSession();
  await new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}
