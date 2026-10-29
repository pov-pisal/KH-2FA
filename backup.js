import { encryptVault, decryptVault } from "./crypto.js";
import {
  parseGoogleMigrationUri,
  parseOtpauth,
  isValidSecret,
} from "./totp.js";
import {
  getVaultRecord,
  setVaultRecord,
  setSyncVaultRecord,
  getSession,
  getMeta,
  updateMeta,
} from "./storage.js";

// ─── State ───────────────────────────────────────────────────────────────────
let vaultRecord = null;
let vault = null;
let sessionPin = null;
let pendingEncryptedPayload = null;

const el = {
  exportCard:         document.getElementById("exportCard"),
  importCard:         document.getElementById("importCard"),
  lockedSection:      document.getElementById("lockedSection"),
  exportFormatRadios: document.querySelectorAll('input[name="exportFormat"]'),
  exportPasswordWrap: document.getElementById("exportPasswordWrap"),
  exportPassword:     document.getElementById("exportPassword"),
  useSessionPinBtn:   document.getElementById("useSessionPinBtn"),
  exportText:         document.getElementById("exportText"),
  copyBtn:            document.getElementById("copyBtn"),
  downloadBtn:        document.getElementById("downloadBtn"),
  exportStatus:       document.getElementById("exportStatus"),
  dropZone:           document.getElementById("dropZone"),
  importFile:         document.getElementById("importFile"),
  importEncryptedBox: document.getElementById("importEncryptedBox"),
  importPassword:     document.getElementById("importPassword"),
  decryptImportBtn:   document.getElementById("decryptImportBtn"),
  importText:         document.getElementById("importText"),
  importBtn:          document.getElementById("importBtn"),
  importStatus:       document.getElementById("importStatus"),
};

// ─── Status helpers ───────────────────────────────────────────────────────────
function setStatus(el, message, type /* success | error | info */) {
  if (!el) return;
  el.textContent = message;
  el.className = `status-msg show ${type}`;
}
function clearStatus(el) {
  if (!el) return;
  el.className = "status-msg";
  el.textContent = "";
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // Apply saved theme
  const meta = await getMeta();
  if (meta?.theme === "light") document.documentElement.dataset.theme = "light";

  vaultRecord = await getVaultRecord();
  const session = await getSession();

  if (!vaultRecord || !session?.pin) {
    el.exportCard.style.display = "none";
    el.importCard.style.display = "none";
    el.lockedSection.style.display = "block";
    return;
  }

  // Try to decrypt using session PIN
  try {
    vault = await decryptVault(session.pin, vaultRecord);
    sessionPin = session.pin;
  } catch {
    el.exportCard.style.display = "none";
    el.importCard.style.display = "none";
    el.lockedSection.style.display = "block";
    return;
  }

  // Default export password to session PIN
  if (el.exportPassword) {
    el.exportPassword.value = sessionPin;
  }

  await populateExport();
  wireEvents();
}

function getSelectedExportFormat() {
  const checked = document.querySelector('input[name="exportFormat"]:checked');
  return checked ? checked.value : "encrypted";
}

// ─── Export ───────────────────────────────────────────────────────────────────
async function buildPayload() {
  if (!vault?.accounts) return "";
  const format = getSelectedExportFormat();

  if (format === "plaintext") {
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), accounts: vault.accounts, createdAt: vault.createdAt },
      null,
      2
    );
  }

  // Encrypted format
  const password = el.exportPassword?.value?.trim() || sessionPin;
  if (!password || password.length < 6) {
    setStatus(el.exportStatus, "Password must be at least 6 characters.", "error");
    return "";
  }

  try {
    const rawData = {
      exportedAt: new Date().toISOString(),
      accounts: vault.accounts,
      createdAt: vault.createdAt,
    };
    const encryptedRecord = await encryptVault(password, rawData);
    return JSON.stringify(
      {
        format: "kh-2fa-encrypted",
        exportedAt: new Date().toISOString(),
        ...encryptedRecord,
      },
      null,
      2
    );
  } catch (err) {
    setStatus(el.exportStatus, `Encryption failed: ${err.message}`, "error");
    return "";
  }
}

async function populateExport() {
  if (!el.exportText) return;
  el.exportText.value = "Generating backup payload…";
  const payload = await buildPayload();
  el.exportText.value = payload;
}

async function handleCopy() {
  const payload = await buildPayload();
  if (!payload) { setStatus(el.exportStatus, "No data to copy.", "error"); return; }
  await navigator.clipboard.writeText(payload);
  setStatus(el.exportStatus, "✓ Copied to clipboard!", "success");
  setTimeout(() => clearStatus(el.exportStatus), 3000);
}

async function handleDownload() {
  const payload = await buildPayload();
  if (!payload) { setStatus(el.exportStatus, "No data to download.", "error"); return; }

  const format = getSelectedExportFormat();
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = format === "encrypted"
    ? `kh-2fa-encrypted-backup-${timestamp}.enc.json`
    : `kh-2fa-backup-${timestamp}.json`;

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  setStatus(el.exportStatus, `✓ ${filename} downloaded!`, "success");
  setTimeout(() => clearStatus(el.exportStatus), 3000);
}

// ─── Import ───────────────────────────────────────────────────────────────────
async function applyImportedAccounts(accountsList, sourceInfo = "backup") {
  if (!accountsList || accountsList.length === 0) {
    setStatus(el.importStatus, "No valid accounts found in payload.", "error");
    return;
  }

  setStatus(el.importStatus, `Found ${accountsList.length} accounts — saving to vault…`, "info");

  if (!vault) vault = { accounts: [], createdAt: Date.now() };

  // Merge accounts without duplicates by secret
  const existingSecrets = new Set(vault.accounts.map((a) => a.secret.toUpperCase()));
  let addedCount = 0;

  for (const a of accountsList) {
    const cleanSecret = (a.secret || "").replace(/\s+/g, "").toUpperCase();
    if (!cleanSecret) continue;

    if (!existingSecrets.has(cleanSecret)) {
      vault.accounts.push({
        id: a.id || crypto.randomUUID(),
        issuer: a.issuer || "",
        label: a.label || "",
        secret: cleanSecret,
        category: a.category || undefined,
        pinned: Boolean(a.pinned),
        digits: a.digits || "6",
        period: Number(a.period) || 30,
        algorithm: a.algorithm || "SHA-1",
        createdAt: a.createdAt || Date.now(),
      });
      existingSecrets.add(cleanSecret);
      addedCount += 1;
    }
  }

  try {
    vaultRecord = await encryptVault(sessionPin, vault);
    await setVaultRecord(vaultRecord);
    const meta = await getMeta();
    if (meta?.syncEnabled) {
      try {
        await setSyncVaultRecord(vaultRecord);
        await updateMeta({ lastSyncedAt: vaultRecord.updatedAt || Date.now() });
      } catch (err) {}
    }
    el.importText.value = "";
    if (el.importEncryptedBox) el.importEncryptedBox.style.display = "none";
    pendingEncryptedPayload = null;
    await populateExport();
    setStatus(el.importStatus, `✓ Successfully imported ${addedCount} new account(s) (Total: ${vault.accounts.length})!`, "success");
  } catch (e) {
    setStatus(el.importStatus, `Failed to save vault: ${e.message}`, "error");
  }
}

async function handleDecryptImport() {
  if (!pendingEncryptedPayload) return;
  const password = el.importPassword?.value?.trim();
  if (!password) {
    setStatus(el.importStatus, "Please enter the backup decryption password.", "error");
    return;
  }

  setStatus(el.importStatus, "Decrypting backup…", "info");
  try {
    const decrypted = await decryptVault(password, pendingEncryptedPayload);
    const rawAccounts = Array.isArray(decrypted) ? decrypted : decrypted?.accounts;
    if (!rawAccounts || !Array.isArray(rawAccounts)) {
      throw new Error("Decrypted data does not contain an accounts list.");
    }
    await applyImportedAccounts(rawAccounts, "encrypted backup");
  } catch (err) {
    setStatus(el.importStatus, `Decryption failed: Incorrect password or corrupted file (${err.message}).`, "error");
  }
}

async function handleImport(jsonText) {
  clearStatus(el.importStatus);
  if (el.importEncryptedBox) el.importEncryptedBox.style.display = "none";
  pendingEncryptedPayload = null;

  const rawContent = (jsonText || el.importText.value || "").trim();
  if (!rawContent) {
    setStatus(el.importStatus, "Paste JSON, Google migration link, or drop/select a file first.", "error");
    return;
  }

  setStatus(el.importStatus, "Parsing…", "info");
  const content = rawContent.replace(/^\uFEFF/, "");

  let accounts = null;

  // 0. Check for Google Authenticator migration payload
  if (content.startsWith("otpauth-migration://")) {
    const googleAccounts = parseGoogleMigrationUri(content);
    if (googleAccounts && googleAccounts.length > 0) {
      accounts = googleAccounts;
    } else {
      setStatus(el.importStatus, "Invalid Google Authenticator migration payload.", "error");
      return;
    }
  } else if (content.includes("otpauth://")) {
    const lines = content.split(/[\r\n]+/);
    const parsedList = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("otpauth://")) {
        const parsed = parseOtpauth(trimmed);
        if (parsed) parsedList.push(parsed);
      }
    }
    if (parsedList.length > 0) {
      accounts = parsedList;
    }
  }

  let payload = null;
  if (!accounts) {
    try {
      payload = JSON.parse(content);
    } catch (e) {
      setStatus(el.importStatus, `Unrecognized format: Not valid JSON or otpauth URI (${e.message})`, "error");
      return;
    }

    // Check if it's an encrypted KH 2FA backup
    if (payload?.format === "kh-2fa-encrypted" || (payload?.ciphertext && payload?.salt && payload?.iv)) {
      pendingEncryptedPayload = payload;
      if (el.importEncryptedBox) {
        el.importEncryptedBox.style.display = "block";
        if (el.importPassword) {
          el.importPassword.value = "";
          el.importPassword.focus();
        }
      }
      setStatus(el.importStatus, "Encrypted backup detected. Enter password above to unlock.", "info");
      return;
    }

    if (Array.isArray(payload)) {
      accounts = payload;
    } else if (Array.isArray(payload?.accounts)) {
      accounts = payload.accounts;
    } else if (payload?.db && Array.isArray(payload.db.entries)) {
      accounts = payload.db.entries
        .filter((e) => e.type === "totp" && e.info?.secret)
        .map((e) => ({
          issuer: e.issuer || "",
          label: e.name || "",
          secret: e.info.secret,
          digits: String(e.info.digits || 6),
          period: Number(e.info.period) || 30,
          algorithm: e.info.algo || "SHA-1",
        }));
    } else if (Array.isArray(payload?.services)) {
      accounts = payload.services
        .filter((s) => s.secret || s.otp?.secret)
        .map((s) => ({
          issuer: s.name || s.issuer || "",
          label: s.otp?.account || "",
          secret: s.secret || s.otp?.secret,
          digits: String(s.otp?.digits || 6),
          period: Number(s.otp?.period) || 30,
          algorithm: s.otp?.algorithm || "SHA-1",
        }));
    } else if (Array.isArray(payload?.items)) {
      accounts = [];
      for (const item of payload.items) {
        const totpUrl = item.login?.totp;
        if (totpUrl && typeof totpUrl === "string") {
          const parsed = parseOtpauth(totpUrl);
          if (parsed) {
            accounts.push({ ...parsed, issuer: parsed.issuer || item.name || "" });
          } else if (isValidSecret(totpUrl)) {
            accounts.push({
              issuer: item.name || "Account",
              label: item.login?.username || "",
              secret: totpUrl,
              digits: "6",
              period: 30,
              algorithm: "SHA-1",
            });
          }
        }
      }
    }
  }

  if (accounts) {
    const valid = accounts.length > 0 && accounts.every(a => a && typeof a.secret === "string");
    if (!valid) {
      setStatus(el.importStatus, "Invalid backup: each account needs a 'secret' field.", "error");
      return;
    }
    await applyImportedAccounts(accounts, "json");
    return;
  }

  setStatus(el.importStatus, "Unrecognized format. File must contain accounts or encrypted vault data.", "error");
}

// ─── Drag & Drop + File Picker ────────────────────────────────────────────────
function readFile(file) {
  return file.text().then(text => {
    el.importText.value = text;
    handleImport(text);
  }).catch(e => {
    setStatus(el.importStatus, `Failed to read file: ${e.message}`, "error");
  });
}

// ─── Wire events ──────────────────────────────────────────────────────────────
function wireEvents() {
  el.copyBtn?.addEventListener("click", handleCopy);
  el.downloadBtn?.addEventListener("click", handleDownload);
  el.importBtn?.addEventListener("click", () => handleImport());
  el.decryptImportBtn?.addEventListener("click", handleDecryptImport);

  el.exportFormatRadios?.forEach(radio => {
    radio.addEventListener("change", () => {
      const format = getSelectedExportFormat();
      if (el.exportPasswordWrap) {
        el.exportPasswordWrap.style.display = format === "encrypted" ? "block" : "none";
      }
      populateExport();
    });
  });

  el.exportPassword?.addEventListener("input", () => {
    populateExport();
  });

  el.useSessionPinBtn?.addEventListener("click", () => {
    if (el.exportPassword && sessionPin) {
      el.exportPassword.value = sessionPin;
      populateExport();
      setStatus(el.exportStatus, "Vault PIN applied to backup password.", "info");
      setTimeout(() => clearStatus(el.exportStatus), 2000);
    }
  });

  el.importPassword?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleDecryptImport();
  });

  // Drag & Drop
  el.dropZone?.addEventListener("dragover", e => {
    e.preventDefault();
    el.dropZone.classList.add("drag-over");
  });
  el.dropZone?.addEventListener("dragleave", () => el.dropZone.classList.remove("drag-over"));
  el.dropZone?.addEventListener("drop", e => {
    e.preventDefault();
    el.dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });

  el.dropZone?.addEventListener("click", () => el.importFile.click());
  el.importFile?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    el.importFile.value = "";
  });

  el.importText?.addEventListener("dragover", e => e.preventDefault());
  el.importText?.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });
}

init();
