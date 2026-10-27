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

const el = {
  exportText:     document.getElementById("exportText"),
  copyBtn:        document.getElementById("copyBtn"),
  downloadBtn:    document.getElementById("downloadBtn"),
  exportStatus:   document.getElementById("exportStatus"),
  dropZone:       document.getElementById("dropZone"),
  importFile:     document.getElementById("importFile"),
  importText:     document.getElementById("importText"),
  importBtn:      document.getElementById("importBtn"),
  importStatus:   document.getElementById("importStatus"),
  exportCard:     document.getElementById("exportCard"),
  importCard:     document.getElementById("importCard"),
  lockedSection:  document.getElementById("lockedSection"),
};

// ─── Status helpers ───────────────────────────────────────────────────────────
function setStatus(el, message, type /* success | error | info */) {
  el.textContent = message;
  el.className = `status-msg show ${type}`;
}
function clearStatus(el) {
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

  populateExport();
  wireEvents();
}

// ─── Export ───────────────────────────────────────────────────────────────────
function buildPayload() {
  if (!vault?.accounts) return "";
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), accounts: vault.accounts, createdAt: vault.createdAt },
    null,
    2
  );
}

function populateExport() {
  el.exportText.value = buildPayload();
}

async function handleCopy() {
  const payload = buildPayload();
  if (!payload) { setStatus(el.exportStatus, "No data to copy.", "error"); return; }
  await navigator.clipboard.writeText(payload);
  setStatus(el.exportStatus, "✓ Copied to clipboard!", "success");
  setTimeout(() => clearStatus(el.exportStatus), 3000);
}

function handleDownload() {
  const payload = buildPayload();
  if (!payload) { setStatus(el.exportStatus, "No data to download.", "error"); return; }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `kh-2fa-backup-${timestamp}.json`;

  // In a full Chrome tab, Blob + link.click() works perfectly.
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  setStatus(el.exportStatus, "✓ Backup downloaded!", "success");
  setTimeout(() => clearStatus(el.exportStatus), 3000);
}

// ─── Import ───────────────────────────────────────────────────────────────────
async function handleImport(jsonText) {
  clearStatus(el.importStatus);
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

    setStatus(el.importStatus, `Found ${accounts.length} accounts — encrypting…`, "info");

    if (!vault) vault = { accounts: [], createdAt: Date.now() };
    vault.accounts = accounts.map(a => ({
      id: a.id || crypto.randomUUID(),
      issuer: a.issuer || "",
      label: a.label || "",
      secret: a.secret.replace(/\s+/g, "").toUpperCase(),
      createdAt: a.createdAt || Date.now(),
    }));

    try {
      vaultRecord = await encryptVault(sessionPin, vault);
      await setVaultRecord(vaultRecord);
      if (meta?.syncEnabled) { try { await setSyncVaultRecord(vaultRecord); await updateMeta({ lastSyncedAt: vaultRecord.updatedAt || Date.now() }); } catch(err){} }
      el.importText.value = "";
      populateExport();
      setStatus(el.importStatus, `✓ Imported ${vault.accounts.length} accounts successfully!`, "success");
    } catch (e) {
      setStatus(el.importStatus, `Encryption failed: ${e.message}`, "error");
    }
    return;
  }

  // ── Path 2: encrypted vault record ──────────────────────────────────────
  const encVault =
    (payload?.ciphertext && payload?.iv && payload?.salt) ? payload :
    (payload?.vault?.ciphertext && payload?.vault?.iv)    ? payload.vault :
    null;

  if (encVault) {
    try {
      await setVaultRecord(encVault);
      if (meta?.syncEnabled) { try { await setSyncVaultRecord(encVault); await updateMeta({ lastSyncedAt: encVault.updatedAt || Date.now() }); } catch(err){} }
      await updateMeta({ locked: true, lastActive: 0 });
      el.importText.value = "";
      setStatus(el.importStatus, "✓ Encrypted vault imported! Return to the extension and unlock with your PIN.", "success");
    } catch (e) {
      setStatus(el.importStatus, `Failed to save vault: ${e.message}`, "error");
    }
    return;
  }

  setStatus(el.importStatus, "Unrecognized format. File must contain accounts or encrypted vault data.", "error");
}

// ─── Drag & Drop + File Picker ────────────────────────────────────────────────
function readFile(file) {
  return file.text().then(text => {
    el.importText.value = text;
    setStatus(el.importStatus, `✓ "${file.name}" loaded — click Import to continue.`, "info");
  }).catch(e => {
    setStatus(el.importStatus, `Failed to read file: ${e.message}`, "error");
  });
}

// ─── Wire events ──────────────────────────────────────────────────────────────
function wireEvents() {
  el.copyBtn.addEventListener("click", handleCopy);
  el.downloadBtn.addEventListener("click", handleDownload);
  el.importBtn.addEventListener("click", () => handleImport());

  // Drag & Drop
  el.dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    el.dropZone.classList.add("drag-over");
  });
  el.dropZone.addEventListener("dragleave", () => el.dropZone.classList.remove("drag-over"));
  el.dropZone.addEventListener("drop", e => {
    e.preventDefault();
    el.dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });

  // Click on drop zone opens file picker (works in a tab, not a popup!)
  el.dropZone.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    el.importFile.value = "";
  });

  // Allow drag onto textarea too
  el.importText.addEventListener("dragover", e => e.preventDefault());
  el.importText.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  });
}

init();
