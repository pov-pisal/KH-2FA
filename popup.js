import { qrcode } from "./qrcode.js";
import { encryptVault, decryptVault } from "./crypto.js";
import {
  generateTOTP,
  parseOtpauth,
  parseGoogleMigrationUri,
  normalizeSecret,
  isValidSecret,
} from "./totp.js";
import {
  getVaultRecord,
  setVaultRecord,
  getMeta,
  updateMeta,
  getSession,
  setSession,
  clearSession as clearStoredSession,
  clearAllData,
  isSyncAvailable,
  getSyncVaultRecord,
  setSyncVaultRecord,
  clearSyncVault,
  getSyncStorageStats,
  getLockoutState,
  setLockoutState,
  clearLockoutState,
} from "./storage.js";
import { getBrandInfo } from "./brandIcons.js";

const defaultInactivityMs = 2 * 60 * 1000;

const elements = {
  lockedView: document.getElementById("lockedView"),
  lockTitle: document.getElementById("lockTitle"),
  lockSubtitle: document.getElementById("lockSubtitle"),
  syncDetectedBanner: document.getElementById("syncDetectedBanner"),
  checkSyncBtn: document.getElementById("checkSyncBtn"),
  createPinFields: document.getElementById("createPinFields"),
  unlockPinField: document.getElementById("unlockPinField"),
  sidePanelBtn: document.getElementById("sidePanelBtn"),
  modalViewQrBtn: document.getElementById("modalViewQrBtn"),
  qrModal: document.getElementById("qrModal"),
  closeQrModalBtn: document.getElementById("closeQrModalBtn"),
  qrModalTitle: document.getElementById("qrModalTitle"),
  qrModalBrandIcon: document.getElementById("qrModalBrandIcon"),
  qrModalIssuer: document.getElementById("qrModalIssuer"),
  qrModalLabel: document.getElementById("qrModalLabel"),
  qrCodeContainer: document.getElementById("qrCodeContainer"),
  qrModalSecret: document.getElementById("qrModalSecret"),
  copyQrSecretBtn: document.getElementById("copyQrSecretBtn"),
  clipboardClearSelect: document.getElementById("clipboardClearSelect"),
  codeVisibilitySelect: document.getElementById("codeVisibilitySelect"),
  newPin: document.getElementById("newPin"),
  confirmPin: document.getElementById("confirmPin"),
  unlockPin: document.getElementById("unlockPin"),
  unlockBtn: document.getElementById("unlockBtn"),
  lockError: document.getElementById("lockError"),
  editAccountsBtn: document.getElementById("editAccountsBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  mainView: document.getElementById("mainView"),
  searchInput: document.getElementById("searchInput"),
  addAccountBtn: document.getElementById("addAccountBtn"),
  lockTimeoutSelect: document.getElementById("lockTimeoutSelect"),
  emptyState: document.getElementById("emptyState"),
  accountsList: document.getElementById("accountsList"),
  toast: document.getElementById("toast"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalBrandPreview: document.getElementById("modalBrandPreview"),
  modalBrandIcon: document.getElementById("modalBrandIcon"),
  modalBrandName: document.getElementById("modalBrandName"),
  secretInput: document.getElementById("secretInput"),
  issuerInput: document.getElementById("issuerInput"),
  labelInput: document.getElementById("labelInput"),
  saveAccountBtn: document.getElementById("saveAccountBtn"),
  cancelAccountBtn: document.getElementById("cancelAccountBtn"),
  modalError: document.getElementById("modalError"),
  deleteModal: document.getElementById("deleteModal"),
  closeDeleteBtn: document.getElementById("closeDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  editAccountsModal: document.getElementById("editAccountsModal"),
  closeEditAccountsBtn: document.getElementById("closeEditAccountsBtn"),
  editAccountsList: document.getElementById("editAccountsList"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  settingsBackBtn: document.getElementById("settingsBackBtn"),
  settingsList: document.getElementById("settingsList"),
  currentPinInput: document.getElementById("currentPinInput"),
  newPinInput: document.getElementById("newPinInput"),
  confirmNewPinInput: document.getElementById("confirmNewPinInput"),
  changePinBtn: document.getElementById("changePinBtn"),
  changePinError: document.getElementById("changePinError"),
  backupBtn: document.getElementById("backupBtn"),
  copyBackupBtn: document.getElementById("copyBackupBtn"),
  exportText: document.getElementById("exportText"),
  importText: document.getElementById("importText"),
  importBtn: document.getElementById("importBtn"),
  importFileBtn: document.getElementById("importFileBtn"),
  importFile: document.getElementById("importFile"),
  importError: document.getElementById("importError"),
  backupStatus: document.getElementById("backupStatus"),
  backupDate: document.getElementById("backupDate"),
  settingsChangePin: document.getElementById("settingsChangePin"),
  settingsBackup: document.getElementById("settingsBackup"),
  settingsGoogleSync: document.getElementById("settingsGoogleSync"),
  syncStatusBadge: document.getElementById("syncStatusBadge"),
  syncToggle: document.getElementById("syncToggle"),
  syncStateText: document.getElementById("syncStateText"),
  syncStatusCard: document.getElementById("syncStatusCard"),
  syncStatusDetail: document.getElementById("syncStatusDetail"),
  syncLastTime: document.getElementById("syncLastTime"),
  syncStorageUsage: document.getElementById("syncStorageUsage"),
  syncNowBtn: document.getElementById("syncNowBtn"),
  syncClearBtn: document.getElementById("syncClearBtn"),
  settingsPreferences: document.getElementById("settingsPreferences"),
  themeSelect: document.getElementById("themeSelect"),
  sortSelect: document.getElementById("sortSelect"),
  prefSaveBtn: document.getElementById("prefSaveBtn"),
  prefCancelBtn: document.getElementById("prefCancelBtn"),
  peekToggleBtn: document.getElementById("peekToggleBtn"),
  scanScreenQrBtn: document.getElementById("scanScreenQrBtn"),
  modalScanScreenBtn: document.getElementById("modalScanScreenBtn"),
  qrFileInput: document.getElementById("qrFileInput"),
  lockoutNotice: document.getElementById("lockoutNotice"),
  categoryFilterBar: document.getElementById("categoryFilterBar"),
  categoryDropdown: document.getElementById("categoryDropdown"),
  categoryDropdownTrigger: document.getElementById("categoryDropdownTrigger"),
  categoryTriggerDot: document.getElementById("categoryTriggerDot"),
  categoryTriggerText: document.getElementById("categoryTriggerText"),
  categoryDropdownMenu: document.getElementById("categoryDropdownMenu"),
  categoryOptionsList: document.getElementById("categoryOptionsList"),
  newCustomCategoryInput: document.getElementById("newCustomCategoryInput"),
  addNewCategoryBtn: document.getElementById("addNewCategoryBtn"),
  categoryInput: document.getElementById("categoryInput"),
  categoryQuickChips: document.getElementById("categoryQuickChips"),
  categoryAutoDetectedBadge: document.getElementById("categoryAutoDetectedBadge"),
  settingsClockSync: document.getElementById("settingsClockSync"),
  clockSyncBadge: document.getElementById("clockSyncBadge"),
  clockDriftDetail: document.getElementById("clockDriftDetail"),
  clockDriftTag: document.getElementById("clockDriftTag"),
  checkClockSyncBtn: document.getElementById("checkClockSyncBtn"),
  resetClockOffsetBtn: document.getElementById("resetClockOffsetBtn"),
  clockSyncFeedback: document.getElementById("clockSyncFeedback"),
  digitsInput: document.getElementById("digitsInput"),
  algorithmInput: document.getElementById("algorithmInput"),
  periodInput: document.getElementById("periodInput"),
  noResultsState: document.getElementById("noResultsState"),
  accountCount: document.getElementById("accountCount"),
  deleteAccountName: document.getElementById("deleteAccountName"),
  confirmResetBtn: document.getElementById("confirmResetBtn"),
  cancelResetBtn: document.getElementById("cancelResetBtn"),
  settingsReset: document.getElementById("settingsReset"),
};

// ── Modal helpers ────────────────────────────────────────────────────────────
function showModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.removeAttribute("inert");
}

function hideModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("inert", "");
}

let vaultRecord = null;
let vault = null;
let meta = null;
let sessionPin = null;
let sessionData = null;
let currentCounter = null;
let activeCategory = "all";
let categoryManuallyTouched = false;

function getEffectiveNow() {
  return Date.now() + (meta?.timeOffsetMs || 0);
}
let lastActivityUpdate = 0;
let editingId = null;
let pendingDeleteId = null;
let preferencesDraft = null;
let dragSrcId = null;          // id of account being dragged
let privacyMaskActive = true;
let failedPinAttempts = 0;
let lockoutSecondsRemaining = 0;
let lockoutInterval = null;
const codes = new Map();

let toastTimeoutId = null;

let clipboardClearTimer = null;
function scheduleClipboardClear(code, delaySec) {
  if (!delaySec || delaySec <= 0) return;
  clearTimeout(clipboardClearTimer);
  clipboardClearTimer = setTimeout(async () => {
    try {
      await navigator.clipboard.writeText("");
      showToast("🔒 Clipboard cleared for security");
    } catch {}
  }, delaySec * 1000);
}

function showAccountQrModal(account) {
  if (!account || !elements.qrModal) return;
  const brand = getBrandInfo(account.issuer, account.label);
  const issuer = account.issuer || brand.name || "Account";
  const label = account.label || "";
  const secret = (account.secret || "").replace(/\s+/g, "").toUpperCase();

  elements.qrModalTitle.textContent = `${issuer} QR Code`;
  elements.qrModalIssuer.textContent = issuer;
  if (label) {
    elements.qrModalLabel.textContent = `· ${label}`;
    elements.qrModalLabel.classList.remove("hidden");
  } else {
    elements.qrModalLabel.textContent = "";
    elements.qrModalLabel.classList.add("hidden");
  }
  elements.qrModalBrandIcon.style.background = brand.bgColor;
  elements.qrModalBrandIcon.style.borderColor = brand.borderColor;
  elements.qrModalBrandIcon.innerHTML = brand.svg;
  elements.qrModalSecret.textContent = secret;

  const encIssuer = encodeURIComponent(issuer);
  const encLabel = label ? `${encIssuer}:${encodeURIComponent(label)}` : encIssuer;
  const digits = account.digits || 6;
  const period = account.period || 30;
  const algo = account.algorithm || "SHA-1";
  const otpauthUri = `otpauth://totp/${encLabel}?secret=${secret}&issuer=${encIssuer}&digits=${digits}&period=${period}&algorithm=${algo}`;

  try {
    const qr = qrcode(0, "M");
    qr.addData(otpauthUri);
    qr.make();
    elements.qrCodeContainer.innerHTML = qr.createSvgTag({ scalable: true });
  } catch (err) {
    console.error("Failed to generate QR code SVG:", err);
    elements.qrCodeContainer.textContent = "Could not render QR code.";
  }

  showModal(elements.qrModal);
}

function closeAccountQrModal() {
  if (elements.qrModal) {
    hideModal(elements.qrModal);
    elements.qrCodeContainer.innerHTML = "";
  }
}

function showToast(message, duration = 1800) {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
  }
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  const visibleDuration = message.length > 30 ? Math.max(duration, 3000) : duration;
  toastTimeoutId = setTimeout(() => {
    elements.toast.classList.remove("show");
    toastTimeoutId = null;
  }, visibleDuration);
}

function showLockedView({ createMode, syncDetected = false }) {
  elements.lockedView.classList.remove("hidden");
  elements.lockedView.setAttribute("aria-hidden", "false");
  elements.lockedView.removeAttribute("inert");
  elements.mainView.classList.add("hidden");
  elements.mainView.setAttribute("aria-hidden", "true");
  elements.mainView.setAttribute("inert", "");
  elements.lockError.textContent = "";

  if (syncDetected) {
    elements.syncDetectedBanner?.classList.remove("hidden");
  } else {
    elements.syncDetectedBanner?.classList.add("hidden");
  }

  if (createMode) {
    elements.lockTitle.textContent = "Create PIN";
    elements.lockSubtitle.textContent = "Set a PIN to encrypt your vault.";
    elements.createPinFields.classList.remove("hidden");
    elements.unlockPinField.classList.add("hidden");
    elements.unlockBtn.textContent = "Create";
  } else {
    elements.lockTitle.textContent = syncDetected ? "Synced Vault Found" : "Unlock vault";
    elements.lockSubtitle.textContent = syncDetected
      ? "Enter your existing PIN to restore all your 2FA accounts."
      : "Enter your PIN to unlock.";
    elements.createPinFields.classList.add("hidden");
    elements.unlockPinField.classList.remove("hidden");
    elements.unlockBtn.textContent = "Unlock";
  }

  const focusTarget = createMode ? elements.newPin : elements.unlockPin;
  focusTarget?.focus();
}

function showMainView() {
  elements.syncDetectedBanner?.classList.add("hidden");
  elements.lockedView.classList.add("hidden");
  elements.lockedView.setAttribute("aria-hidden", "true");
  elements.lockedView.setAttribute("inert", "");
  elements.mainView.classList.remove("hidden");
  elements.mainView.setAttribute("aria-hidden", "false");
  elements.mainView.removeAttribute("inert");

  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }

  renderAccounts();
  elements.searchInput?.focus();
}

function getLockTimeoutMs() {
  if (!meta) return defaultInactivityMs;
  if (typeof meta.lockTimeoutMs !== "number") return defaultInactivityMs;
  return meta.lockTimeoutMs;
}

function getTheme() {
  return meta?.theme || "dark";
}

function getSortMode() {
  return meta?.sortMode || "newest";
}

function applyTheme(theme) {
  const resolved = ["light", "oled", "nord"].includes(theme) ? theme : "dark";
  document.documentElement.dataset.theme = resolved;
}

function normalizeSortText(value) {
  return (value || "").toString().trim().toLowerCase();
}

function sortAccounts(list) {
  const mode = getSortMode();
  const sorted = [...list];

  // Pinned accounts always float to the top
  const pinned = [];
  const unpinned = [];
  for (const item of sorted) {
    if (item.pinned) pinned.push(item);
    else unpinned.push(item);
  }

  const sortSlice = (items) => {
    if (mode === "manual") return items;
    const res = [...items];
    if (mode === "oldest") {
      res.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (mode === "newest") {
      res.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (mode === "issuer-asc" || mode === "issuer-desc") {
      res.sort((a, b) =>
        normalizeSortText(a.issuer).localeCompare(
          normalizeSortText(b.issuer),
          undefined,
          { sensitivity: "base" },
        ),
      );
      if (mode === "issuer-desc") res.reverse();
    } else if (mode === "label-asc" || mode === "label-desc") {
      res.sort((a, b) =>
        normalizeSortText(a.label).localeCompare(
          normalizeSortText(b.label),
          undefined,
          { sensitivity: "base" },
        ),
      );
      if (mode === "label-desc") res.reverse();
    }
    return res;
  };

  return [...sortSlice(pinned), ...sortSlice(unpinned)];
}

function clearSession() {
  vault = null;
  sessionPin = null;
  currentCounter = null;
  codes.clear();
}

function isPinValid(pin) {
  return typeof pin === "string" && pin.trim().length >= 6;
}

async function persistVaultRecord(record) {
  vaultRecord = record;
  await setVaultRecord(record);
  if (meta?.syncEnabled) {
    try {
      await setSyncVaultRecord(record);
      meta = await updateMeta({ lastSyncedAt: record.updatedAt || Date.now() });
    } catch (err) {
      console.warn("Failed to sync vault to Google sync storage:", err);
    }
  }
}

async function saveVault() {
  if (!vault || !sessionPin) return;
  vaultRecord = await encryptVault(sessionPin, vault);
  await persistVaultRecord(vaultRecord);
}

async function setLocked(locked) {
  if (locked) {
    clearSession();
    await clearStoredSession();
  }
  meta = await updateMeta({ locked, lastActive: locked ? 0 : Date.now() });
}

async function setLockout(seconds, persist = true) {
  lockoutSecondsRemaining = seconds;
  elements.unlockBtn.disabled = true;
  elements.unlockPin.disabled = true;
  if (persist) {
    try {
      await setLockoutState({
        failedAttempts: failedPinAttempts,
        lockoutUntil: Date.now() + seconds * 1000,
      });
    } catch (e) {
      console.warn("Could not save lockout state:", e);
    }
  }
  if (elements.lockoutNotice) {
    elements.lockoutNotice.classList.remove("hidden");
    elements.lockoutNotice.textContent = `Too many failed attempts. Try again in ${lockoutSecondsRemaining}s.`;
  }
  clearInterval(lockoutInterval);
  lockoutInterval = setInterval(async () => {
    lockoutSecondsRemaining -= 1;
    if (lockoutSecondsRemaining <= 0) {
      clearInterval(lockoutInterval);
      try {
        await clearLockoutState();
      } catch {}
      elements.unlockBtn.disabled = false;
      elements.unlockPin.disabled = false;
      if (elements.lockoutNotice) {
        elements.lockoutNotice.classList.add("hidden");
        elements.lockoutNotice.textContent = "";
      }
      elements.unlockPin.focus();
    } else if (elements.lockoutNotice) {
      elements.lockoutNotice.textContent = `Too many failed attempts. Try again in ${lockoutSecondsRemaining}s.`;
    }
  }, 1000);
}

async function handleUnlock() {
  if (lockoutSecondsRemaining > 0) return;
  const createMode = !vaultRecord;
  elements.lockError.textContent = "";

  if (createMode) {
    const pin = elements.newPin.value.trim();
    const confirm = elements.confirmPin.value.trim();
    if (!isPinValid(pin)) {
      elements.lockError.textContent = "PIN or Password must be at least 6 characters.";
      return;
    }
    if (pin !== confirm) {
      elements.lockError.textContent = "PINs or Passwords do not match.";
      return;
    }

    vault = { accounts: [], createdAt: Date.now() };
    sessionPin = pin;
    vaultRecord = await encryptVault(pin, vault);
    await persistVaultRecord(vaultRecord);
    await setLocked(false);
    showMainView();
    return;
  }

  const pin = elements.unlockPin.value.trim();
  if (!isPinValid(pin)) {
    elements.lockError.textContent = "Invalid PIN or Password.";
    return;
  }

  try {
    vault = await decryptVault(pin, vaultRecord);
    failedPinAttempts = 0;
    try {
      await clearLockoutState();
    } catch {}
    if (elements.lockoutNotice) {
      elements.lockoutNotice.classList.add("hidden");
      elements.lockoutNotice.textContent = "";
    }
    sessionPin = pin;
    sessionData = { pin, lastActive: Date.now() };
    await setSession(sessionData);
    await setLocked(false);
    showMainView();
  } catch (error) {
    failedPinAttempts += 1;
    elements.lockError.textContent = "Incorrect PIN or Password.";
    if (failedPinAttempts >= 3) {
      const waitSeconds = failedPinAttempts === 3 ? 10 : failedPinAttempts === 4 ? 30 : 60;
      await setLockout(waitSeconds);
    } else {
      try {
        await setLockoutState({ failedAttempts: failedPinAttempts, lockoutUntil: 0 });
      } catch {}
    }
  }
}

function getCategoryClass(cat) {
  if (!cat) return "";
  const c = String(cat).toLowerCase().trim();
  if (c === "personal") return "cat-personal";
  if (c === "work") return "cat-work";
  if (c === "crypto") return "cat-crypto";
  if (c === "finance") return "cat-finance";
  if (c === "social") return "cat-social";
  if (c === "gaming") return "cat-gaming";
  return "";
}

function applyCategoryColor(badgeEl, cat) {
  if (!badgeEl || !cat) return;
  const cls = getCategoryClass(cat);
  if (cls) {
    badgeEl.classList.add(cls);
  } else {
    let hash = 0;
    const str = String(cat).trim();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    badgeEl.style.color = `hsl(${hue}, 85%, 72%)`;
    badgeEl.style.backgroundColor = `hsla(${hue}, 85%, 60%, 0.14)`;
    badgeEl.style.borderColor = `hsla(${hue}, 85%, 60%, 0.35)`;
  }
}

function detectCategoryFromBrand(issuer, label) {
  const text = `${issuer || ""} ${label || ""}`.toLowerCase();
  if (/\b(binance|coinbase|kraken|crypto|metamask|ledger|kucoin|bybit|bitfinex|okx|gemini|trezor|phantom|trustwallet|exodus|bitget|gate\.io|huobi|htx)\b/i.test(text)) {
    return "Crypto";
  }
  if (/\b(paypal|stripe|chase|bank|wells\s*fargo|revolut|wise|fidelity|vanguard|schwab|citi|capital\s*one|barclays|hsbc|venmo|cash\s*app|mint|intuit|quickbooks|xero)\b/i.test(text)) {
    return "Finance";
  }
  if (/\b(aws|amazon\s*web\s*services|github|gitlab|bitbucket|slack|jira|atlassian|notion|google\s*cloud|gcp|azure|linear|zoom|trello|figma|vercel|heroku|digitalocean|cloudflare|docker|sentry|datadog|circleci|travis|jenkins|confluence|asana|monday|salesforce|hubspot|zendesk|okta|auth0|fastly|ovh|linode|vultr)\b/i.test(text)) {
    return "Work";
  }
  if (/\b(facebook|instagram|twitter|x\.com|reddit|discord|linkedin|tiktok|snapchat|pinterest|telegram|signal|whatsapp|wechat|threads|tumblr|mastodon|bsky|bluesky)\b/i.test(text)) {
    return "Social";
  }
  if (/\b(steam|epic\s*games|playstation|psn|xbox|blizzard|battlenet|riot\s*games|ubisoft|nintendo|roblox|twitch|ea\s*games|origin|gog)\b/i.test(text)) {
    return "Gaming";
  }
  if (/\b(dropbox|google|apple|icloud|microsoft|proton|protonmail|netflix|spotify|disney|hulu|uber|airbnb|amazon)\b/i.test(text)) {
    return "Personal";
  }
  return "";
}

const STANDARD_CATEGORIES = [
  { id: "", name: "None (Uncategorized)", dotCls: "dot-none" },
  { id: "Personal", name: "Personal", dotCls: "dot-personal" },
  { id: "Work", name: "Work", dotCls: "dot-work" },
  { id: "Finance", name: "Finance", dotCls: "dot-finance" },
  { id: "Crypto", name: "Crypto", dotCls: "dot-crypto" },
  { id: "Social", name: "Social", dotCls: "dot-social" },
  { id: "Gaming", name: "Gaming", dotCls: "dot-gaming" },
];

function getCategoryDotStyle(cat) {
  if (!cat) return { cls: "dot-none", style: "" };
  const lower = cat.toLowerCase().trim();
  if (lower === "personal") return { cls: "dot-personal", style: "" };
  if (lower === "work") return { cls: "dot-work", style: "" };
  if (lower === "finance") return { cls: "dot-finance", style: "" };
  if (lower === "crypto") return { cls: "dot-crypto", style: "" };
  if (lower === "social") return { cls: "dot-social", style: "" };
  if (lower === "gaming") return { cls: "dot-gaming", style: "" };

  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = (hash << 5) - hash + cat.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    cls: "",
    style: `background: hsl(${hue}, 85%, 65%); box-shadow: 0 0 6px hsla(${hue}, 85%, 65%, 0.6);`,
  };
}

function updateQuickChips(selectedCat) {
  if (!elements.categoryQuickChips) return;
  const target = (selectedCat || "").trim().toLowerCase();
  elements.categoryQuickChips.querySelectorAll(".quick-chip").forEach((chip) => {
    const chipCat = (chip.dataset.cat || "").trim().toLowerCase();
    chip.classList.toggle("selected", Boolean(target && chipCat === target));
  });
}

function setCategoryFilter(category) {
  activeCategory = category || "all";
  renderAccounts();
  const activePill = elements.categoryFilterBar?.querySelector(`.category-pill[data-category="${activeCategory}"]`);
  if (activePill) {
    activePill.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }
}

function renderCategoryDropdownOptions(selectedVal = "") {
  if (!elements.categoryOptionsList) return;
  elements.categoryOptionsList.innerHTML = "";

  const optionsMap = new Map();
  for (const item of STANDARD_CATEGORIES) {
    optionsMap.set(item.id.toLowerCase(), { id: item.id, name: item.name });
  }

  if (vault?.accounts) {
    for (const acc of vault.accounts) {
      const c = (acc.category || "").trim();
      if (c && !optionsMap.has(c.toLowerCase())) {
        optionsMap.set(c.toLowerCase(), { id: c, name: c });
      }
    }
  }

  const selClean = (selectedVal || "").trim();
  if (selClean && !optionsMap.has(selClean.toLowerCase())) {
    optionsMap.set(selClean.toLowerCase(), { id: selClean, name: selClean });
  }

  const selectedKey = selClean.toLowerCase();

  for (const [key, item] of optionsMap.entries()) {
    const isSelected = key === selectedKey;
    const dotInfo = getCategoryDotStyle(item.id);

    const row = document.createElement("div");
    row.className = `category-option-item ${isSelected ? "selected" : ""}`;
    row.dataset.value = item.id;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", isSelected ? "true" : "false");

    const left = document.createElement("div");
    left.className = "option-left";

    const dot = document.createElement("span");
    dot.className = `category-indicator-dot ${dotInfo.cls}`;
    if (dotInfo.style) dot.style.cssText = dotInfo.style;

    const label = document.createElement("span");
    label.className = "option-label";
    label.textContent = item.name;

    left.append(dot, label);
    row.append(left);

    if (isSelected) {
      row.insertAdjacentHTML(
        "beforeend",
        '<svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      );
    }

    row.addEventListener("click", () => {
      setCategoryValue(item.id);
      closeCategoryDropdown();
      categoryManuallyTouched = true;
    });

    elements.categoryOptionsList.appendChild(row);
  }
}

function setCategoryValue(val = "", isAuto = false) {
  const clean = (val || "").trim();
  if (elements.categoryInput) {
    elements.categoryInput.value = clean;
  }

  if (elements.categoryTriggerText) {
    elements.categoryTriggerText.textContent = clean || "None (Uncategorized)";
  }

  if (elements.categoryTriggerDot) {
    const dotInfo = getCategoryDotStyle(clean);
    elements.categoryTriggerDot.className = `category-indicator-dot ${dotInfo.cls}`;
    elements.categoryTriggerDot.style.cssText = dotInfo.style;
  }

  updateQuickChips(clean);

  if (isAuto && clean) {
    elements.categoryAutoDetectedBadge?.classList.remove("hidden");
  } else {
    elements.categoryAutoDetectedBadge?.classList.add("hidden");
  }

  renderCategoryDropdownOptions(clean);
}

function openCategoryDropdown() {
  if (!elements.categoryDropdown || !elements.categoryDropdownMenu) return;
  elements.categoryDropdown.classList.add("open");
  elements.categoryDropdownMenu.classList.remove("hidden");
  elements.categoryDropdownTrigger?.setAttribute("aria-expanded", "true");
  renderCategoryDropdownOptions(elements.categoryInput?.value || "");

  const selectedItem = elements.categoryOptionsList?.querySelector(".category-option-item.selected");
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: "nearest" });
  }
}

function closeCategoryDropdown() {
  if (!elements.categoryDropdown || !elements.categoryDropdownMenu) return;
  elements.categoryDropdown.classList.remove("open");
  elements.categoryDropdownMenu.classList.add("hidden");
  elements.categoryDropdownTrigger?.setAttribute("aria-expanded", "false");
}

function toggleCategoryDropdown() {
  const isOpen = elements.categoryDropdown?.classList.contains("open");
  if (isOpen) {
    closeCategoryDropdown();
  } else {
    openCategoryDropdown();
  }
}

function renderCategoryFilterBar() {
  if (!elements.categoryFilterBar || !vault) return;
  const accounts = vault.accounts || [];
  if (accounts.length === 0) {
    elements.categoryFilterBar.classList.add("hidden");
    return;
  }
  elements.categoryFilterBar.classList.remove("hidden");

  const total = accounts.length;
  const pinnedCount = accounts.filter((a) => Boolean(a.pinned)).length;

  const catMap = new Map();
  let uncategorizedCount = 0;

  for (const acc of accounts) {
    const raw = (acc.category || "").trim();
    if (!raw) {
      uncategorizedCount++;
    } else {
      const key = raw.toLowerCase();
      if (!catMap.has(key)) {
        catMap.set(key, { name: raw, count: 0 });
      }
      catMap.get(key).count++;
    }
  }

  if (activeCategory !== "all" && activeCategory !== "pinned" && activeCategory !== "uncategorized") {
    if (!catMap.has(activeCategory.toLowerCase())) {
      activeCategory = "all";
    }
  }

  elements.categoryFilterBar.innerHTML = "";

  // All pill
  const allBtn = document.createElement("button");
  const isAllActive = activeCategory === "all";
  allBtn.className = `category-pill ${isAllActive ? "active" : ""}`;
  allBtn.dataset.category = "all";
  allBtn.setAttribute("role", "tab");
  allBtn.setAttribute("aria-selected", isAllActive ? "true" : "false");
  allBtn.innerHTML = `<span>All</span><span class="pill-count">${total}</span>`;
  elements.categoryFilterBar.appendChild(allBtn);

  // Pinned pill (only if pinnedCount > 0)
  if (pinnedCount > 0) {
    const pinBtn = document.createElement("button");
    const isPinActive = activeCategory === "pinned";
    pinBtn.className = `category-pill ${isPinActive ? "active" : ""}`;
    pinBtn.dataset.category = "pinned";
    pinBtn.setAttribute("role", "tab");
    pinBtn.setAttribute("aria-selected", isPinActive ? "true" : "false");
    pinBtn.innerHTML = `<span>★ Pinned</span><span class="pill-count">${pinnedCount}</span>`;
    elements.categoryFilterBar.appendChild(pinBtn);
  }

  // Category pills
  for (const [key, { name, count }] of catMap.entries()) {
    const btn = document.createElement("button");
    const isActive = activeCategory.toLowerCase() === key;
    btn.className = `category-pill ${isActive ? "active" : ""}`;
    btn.dataset.category = name;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.innerHTML = `<span>${name}</span><span class="pill-count">${count}</span>`;
    elements.categoryFilterBar.appendChild(btn);
  }

  // Uncategorized pill (only if some accounts are uncategorized and at least one is categorized)
  if (uncategorizedCount > 0 && catMap.size > 0) {
    const uncatBtn = document.createElement("button");
    const isActive = activeCategory === "uncategorized";
    uncatBtn.className = `category-pill ${isActive ? "active" : ""}`;
    uncatBtn.dataset.category = "uncategorized";
    uncatBtn.setAttribute("role", "tab");
    uncatBtn.setAttribute("aria-selected", isActive ? "true" : "false");
    uncatBtn.innerHTML = `<span>Uncategorized</span><span class="pill-count">${uncategorizedCount}</span>`;
    elements.categoryFilterBar.appendChild(uncatBtn);
  }
}

function updateModalBrandPreview() {
  if (!elements.modalBrandPreview || !elements.modalBrandIcon || !elements.modalBrandName) return;

  const secretVal = elements.secretInput?.value?.trim() || "";
  let detectedIssuer = elements.issuerInput?.value?.trim() || "";
  let detectedLabel = elements.labelInput?.value?.trim() || "";

  if (secretVal.startsWith("otpauth://")) {
    const parsed = parseOtpauth(secretVal);
    if (parsed) {
      if (!detectedIssuer) detectedIssuer = parsed.issuer;
      if (!detectedLabel) detectedLabel = parsed.label;
    }
  }

  if (!detectedIssuer && !detectedLabel) {
    elements.modalBrandPreview.classList.add("hidden");
    return;
  }

  const brand = getBrandInfo(detectedIssuer, detectedLabel);
  if (brand.isFallback && !detectedIssuer) {
    elements.modalBrandPreview.classList.add("hidden");
    return;
  }

  elements.modalBrandPreview.classList.remove("hidden");
  elements.modalBrandIcon.style.background = brand.bgColor;
  elements.modalBrandIcon.style.borderColor = brand.borderColor;
  elements.modalBrandIcon.innerHTML = brand.svg;
  elements.modalBrandName.textContent = brand.name;

  if (!editingId && !categoryManuallyTouched && elements.categoryInput && !elements.categoryInput.value.trim()) {
    const suggested = detectCategoryFromBrand(detectedIssuer, detectedLabel);
    if (suggested) {
      setCategoryValue(suggested, true);
    }
  }
}

function openModal(editAccount = null) {
  editingId = editAccount?.id || null;
  elements.modalTitle.textContent = editingId ? "Edit account" : "Add account";
  if (editingId && elements.modalViewQrBtn) {
    elements.modalViewQrBtn.classList.remove("hidden");
  } else if (elements.modalViewQrBtn) {
    elements.modalViewQrBtn.classList.add("hidden");
  }
  elements.secretInput.value = editAccount?.secret || "";
  elements.issuerInput.value = editAccount?.issuer || "";
  elements.labelInput.value = editAccount?.label || "";
  if (elements.digitsInput) elements.digitsInput.value = String(editAccount?.digits || "6");
  if (elements.algorithmInput) elements.algorithmInput.value = editAccount?.algorithm || "SHA-1";
  if (elements.periodInput) elements.periodInput.value = String(editAccount?.period || "30");
  categoryManuallyTouched = Boolean(editAccount);
  closeCategoryDropdown();
  const currentCat = editAccount?.category || (activeCategory !== "all" && activeCategory !== "pinned" && activeCategory !== "uncategorized" ? activeCategory : "");
  setCategoryValue(currentCat, false);
  elements.modalError.textContent = "";
  updateModalBrandPreview();
  showModal(elements.modal);


  elements.secretInput?.focus();
}

function closeModal() {
  hideModal(elements.modal);
  elements.secretInput.value = "";
  elements.issuerInput.value = "";
  elements.labelInput.value = "";
  if (elements.digitsInput) elements.digitsInput.value = "6";
  if (elements.algorithmInput) elements.algorithmInput.value = "SHA-1";
  if (elements.periodInput) elements.periodInput.value = "30";
  closeCategoryDropdown();
  setCategoryValue("", false);
  categoryManuallyTouched = false;
  elements.modalError.textContent = "";
  updateModalBrandPreview();
  editingId = null;
  if (elements.modalViewQrBtn) elements.modalViewQrBtn.classList.add("hidden");
  elements.addAccountBtn?.focus();
}

function openDeleteModal(accountId) {
  pendingDeleteId = accountId;
  const account = vault?.accounts?.find((a) => a.id === accountId);
  if (elements.deleteAccountName) {
    const brand = account ? getBrandInfo(account.issuer, account.label) : null;
    const name = account?.issuer || brand?.name || "Account";
    elements.deleteAccountName.textContent = account?.label ? `${name} (${account.label})` : name;
  }
  showModal(elements.deleteModal);
  elements.confirmDeleteBtn?.focus();
}

function closeDeleteModal() {
  hideModal(elements.deleteModal);
  pendingDeleteId = null;
}

function openEditAccountsModal() {
  if (!vault) return;
  showModal(elements.editAccountsModal);
  renderEditAccountsList();
}

function closeEditAccountsModal() {
  hideModal(elements.editAccountsModal);
}

function renderEditAccountsList() {
  if (!vault || !elements.editAccountsList) return;
  elements.editAccountsList.innerHTML = "";
  if (vault.accounts.length === 0) {
    elements.editAccountsList.innerHTML =
      '<div class="muted">No accounts to edit.</div>';
    return;
  }
  sortAccounts(vault.accounts).forEach((account) => {
    const brand = getBrandInfo(account.issuer, account.label);
    const row = document.createElement("div");
    row.className = "edit-item";
    row.setAttribute("role", "listitem");

    const meta = document.createElement("div");
    meta.className = "edit-meta";

    const brandIcon = document.createElement("div");
    brandIcon.className = "account-brand-icon small";
    brandIcon.title = brand.name;
    brandIcon.style.background = brand.bgColor;
    brandIcon.style.borderColor = brand.borderColor;
    brandIcon.innerHTML = brand.svg;

    const textWrap = document.createElement("div");
    textWrap.className = "edit-text";
    const issuer = document.createElement("strong");
    issuer.textContent = account.issuer || brand.name || "Account";
    issuer.title = issuer.textContent;
    const label = document.createElement("span");
    label.textContent = account.label || "(no label)";
    label.title = account.label || "";
    textWrap.append(issuer, label);
    if (account.category) {
      const catBadge = document.createElement("span");
      catBadge.className = "category-badge";
      catBadge.textContent = account.category;
      applyCategoryColor(catBadge, account.category);
      textWrap.append(catBadge);
    }

    meta.append(brandIcon, textWrap);

    const actions = document.createElement("div");
    actions.className = "edit-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "ghost";
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      closeEditAccountsModal();
      openModal(account);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ghost";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      openDeleteModal(account.id);
    });

    actions.append(editBtn, deleteBtn);
    row.append(meta, actions);
    elements.editAccountsList.appendChild(row);
  });
}

function openSettingsModal() {
  if (meta?.locked) {
    showToast("Unlock vault first");
    return;
  }
  showModal(elements.settingsModal);
  elements.changePinError.textContent = "";
  elements.currentPinInput.value = "";
  elements.newPinInput.value = "";
  elements.confirmNewPinInput.value = "";
  elements.lockTimeoutSelect.value = String(getLockTimeoutMs());
  if (elements.themeSelect) {
    elements.themeSelect.value = getTheme();
  }
  if (elements.sortSelect) {
    elements.sortSelect.value = getSortMode();
  }
  if (elements.clipboardClearSelect) {
    elements.clipboardClearSelect.value = String(meta?.clipboardClearSec ?? 30);
  }
  // Code visibility: default to blur unless explicitly set to false
  privacyMaskActive = meta?.defaultMaskCodes !== false;
  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }
  if (elements.codeVisibilitySelect) {
    elements.codeVisibilitySelect.value = privacyMaskActive ? "blur" : "visible";
  }
  preferencesDraft = {
    lockTimeoutMs: getLockTimeoutMs(),
    sortMode: getSortMode(),
    theme: getTheme(),
  };
  showSettingsList();
  elements.currentPinInput?.focus();
}

function closeSettingsModal() {
  hideModal(elements.settingsModal);
  showSettingsList();
}

function hideAllSettingsSections() {
  [
    elements.settingsChangePin,
    elements.settingsBackup,
    elements.settingsGoogleSync,
    elements.settingsPreferences,
    elements.settingsClockSync,
    elements.settingsReset,
  ].forEach((section) => {
    if (!section) return;
    section.classList.add("hidden");
    section.setAttribute("aria-hidden", "true");
  });
}

function showSettingsList() {
  hideAllSettingsSections();
  updateSyncBadge();
  updateClockSyncUI();
  elements.settingsList?.classList.remove("hidden");
  elements.settingsList?.setAttribute("aria-hidden", "false");
  elements.settingsBackBtn?.classList.add("hidden");
  elements.settingsBackBtn?.setAttribute("aria-hidden", "true");
}

function hideSettingsList() {
  elements.settingsList?.classList.add("hidden");
  elements.settingsList?.setAttribute("aria-hidden", "true");
  elements.settingsBackBtn?.classList.remove("hidden");
  elements.settingsBackBtn?.setAttribute("aria-hidden", "false");
}

function openSettingsSection(key) {
  hideAllSettingsSections();
  const map = {
    "change-pin": elements.settingsChangePin,
    backup: elements.settingsBackup,
    "google-sync": elements.settingsGoogleSync,
    preferences: elements.settingsPreferences,
    "clock-sync": elements.settingsClockSync,
    reset: elements.settingsReset,
  };
  const section = map[key];
  if (!section) return;
  hideSettingsList();
  section.classList.remove("hidden");
  section.setAttribute("aria-hidden", "false");
  if (key === "clock-sync") {
    updateClockSyncUI();
  }
  if (key === "google-sync") {
    refreshSyncUI();
  }
  if (key === "change-pin") {
    elements.currentPinInput?.focus();
  }
  if (key === "preferences") {
    preferencesDraft = {
      lockTimeoutMs: getLockTimeoutMs(),
      sortMode: getSortMode(),
      theme: getTheme(),
      clipboardClearSec: Number(meta?.clipboardClearSec ?? 30),
      defaultMaskCodes: meta?.defaultMaskCodes !== false,
    };
    elements.lockTimeoutSelect.value = String(preferencesDraft.lockTimeoutMs);
    if (elements.themeSelect) {
      elements.themeSelect.value = preferencesDraft.theme;
    }
    if (elements.sortSelect) {
      elements.sortSelect.value = preferencesDraft.sortMode;
    }
    if (elements.clipboardClearSelect) {
      elements.clipboardClearSelect.value = String(preferencesDraft.clipboardClearSec);
    }
    if (elements.codeVisibilitySelect) {
      elements.codeVisibilitySelect.value = preferencesDraft.defaultMaskCodes ? "blur" : "visible";
    }
  }
  if (key === "backup") {
    populateExportBackup();
  }
  
}

async function savePreferences() {
  if (!preferencesDraft) return;
  const newClipSec = Number(elements.clipboardClearSelect?.value ?? 30);
  const newMaskCodes = elements.codeVisibilitySelect ? elements.codeVisibilitySelect.value !== "visible" : (preferencesDraft.defaultMaskCodes ?? true);

  meta = await updateMeta({
    lockTimeoutMs: preferencesDraft.lockTimeoutMs,
    sortMode: preferencesDraft.sortMode,
    theme: preferencesDraft.theme,
    clipboardClearSec: newClipSec,
    defaultMaskCodes: newMaskCodes,
  });
  if (sessionData) {
    sessionData.lastActive = Date.now();
    await setSession(sessionData);
  }
  applyTheme(preferencesDraft.theme);

  // Sync privacy mask state with new preference immediately
  privacyMaskActive = newMaskCodes;
  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }
  document.querySelectorAll(".account-code").forEach((el) => {
    el.classList.toggle("masked", privacyMaskActive);
  });

  renderAccounts();
  showToast("Preferences saved");
  closeSettingsModal();
}

function cancelPreferences() {
  applyTheme(getTheme());
  preferencesDraft = {
    lockTimeoutMs: getLockTimeoutMs(),
    sortMode: getSortMode(),
    theme: getTheme(),
    clipboardClearSec: Number(meta?.clipboardClearSec ?? 30),
    defaultMaskCodes: meta?.defaultMaskCodes !== false,
  };
  elements.lockTimeoutSelect.value = String(preferencesDraft.lockTimeoutMs);
  if (elements.themeSelect) {
    elements.themeSelect.value = preferencesDraft.theme;
  }
  if (elements.sortSelect) {
    elements.sortSelect.value = preferencesDraft.sortMode;
  }
  if (elements.clipboardClearSelect) {
    elements.clipboardClearSelect.value = String(preferencesDraft.clipboardClearSec);
  }
  if (elements.codeVisibilitySelect) {
    elements.codeVisibilitySelect.value = preferencesDraft.defaultMaskCodes ? "blur" : "visible";
  }
}

async function confirmDelete() {
  if (!vault || !pendingDeleteId) {
    closeDeleteModal();
    return;
  }
  vault.accounts = vault.accounts.filter((acc) => acc.id !== pendingDeleteId);
  await saveVault();
  closeDeleteModal();
  renderAccounts();
  if (!elements.editAccountsModal.classList.contains("hidden")) {
    renderEditAccountsList();
  }
}

async function handleChangePin() {
  elements.changePinError.textContent = "";
  const currentPin = elements.currentPinInput.value.trim();
  const newPin = elements.newPinInput.value.trim();
  const confirmPin = elements.confirmNewPinInput.value.trim();

  if (!isPinValid(currentPin) || !isPinValid(newPin)) {
    elements.changePinError.textContent = "PIN or Password must be at least 6 characters.";
    return;
  }
  if (newPin !== confirmPin) {
    elements.changePinError.textContent = "New PINs or Passwords do not match.";
    return;
  }

  try {
    const decrypted = await decryptVault(currentPin, vaultRecord);
    vault = decrypted;
    vaultRecord = await encryptVault(newPin, vault);
    sessionPin = newPin;
    sessionData = { pin: newPin, lastActive: Date.now() };
    await persistVaultRecord(vaultRecord);
    await setSession(sessionData);
    elements.currentPinInput.value = "";
    elements.newPinInput.value = "";
    elements.confirmNewPinInput.value = "";
    showToast("PIN / Password updated");
  } catch (error) {
    elements.changePinError.textContent = "Current PIN or Password is incorrect.";
  }
}

async function handleResetAll() {
  try {
    await clearAllData({ clearCloudSync: true });
    clearSession();
    vaultRecord = null;
    sessionData = null;
    meta = null;
    hideModal(elements.settingsModal);
    showLockedView({ createMode: true });
    showToast("All data has been reset successfully");
  } catch (err) {
    showToast(`Reset failed: ${err.message}`);
  }
}

async function handleBackup() {
  if (!vaultRecord) {
    showToast("No vault to backup");
    return;
  }
  const payload = buildBackupPayload();
  if (!payload) {
    showToast("No vault data to backup — make sure you are unlocked");
    return;
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `kh-2fa-backup-${timestamp}.json`;

  // ── Method 1: File System Access API (save dialog) ──────────────────────
  // Works in Chrome extension popup pages (secure context, user gesture present).
  if (typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "JSON backup", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(payload);
      await writable.close();
      showToast("✓ Backup saved successfully");
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // user cancelled — do nothing
      console.warn("showSaveFilePicker failed:", err.message);
      // fall through to Method 2
    }
  }

  // ── Method 2: Standard HTML5 Blob download (Universal, clean, no special permission needed) ───
  try {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    showToast("✓ Backup downloaded to Downloads folder");
    return;
  } catch (err) {
    console.warn("Blob download failed:", err.message);
    // fall through to Method 3
  }

  // ── Method 3: Copy to clipboard as last resort ───────────────────────────
  try {
    await navigator.clipboard.writeText(payload);
    showToast("⚠ Download unavailable — backup copied to clipboard instead");
  } catch (err) {
    showToast("Download failed. Use Copy to Clipboard button above.");
  }
}

function buildBackupPayload() {
  if (!vault || !vault.accounts) return "";
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      accounts: vault.accounts,
      createdAt: vault.createdAt,
    },
    null,
    2,
  );
}

function populateExportBackup() {
  if (!elements.exportText) return;
  elements.exportText.value = buildBackupPayload();
  updateBackupStatus();
}

function updateBackupStatus() {
  if (!elements.backupStatus || !elements.backupDate) return;
  if (elements.exportText.value) {
    elements.backupStatus.classList.remove("hidden");
    const now = new Date();
    elements.backupDate.textContent = `Last generated: ${now.toLocaleString()}`;
  } else {
    elements.backupStatus.classList.add("hidden");
  }
}

async function handleCopyBackup() {
  const payload = buildBackupPayload();
  if (!payload) {
    showToast("No vault to backup");
    return;
  }
  await navigator.clipboard.writeText(payload);
  showToast("✓ Backup copied to clipboard");
}

async function handleImportBackup() {
  clearImportError();
  const rawContent = elements.importText?.value?.trim();
  if (!rawContent) {
    showImportError("Paste a backup JSON, Google migration link, or upload a file");
    return;
  }

  showImportError("Parsing backup data... Please wait.");
  const cleanContent = rawContent.replace(/^\uFEFF/, "");

  let importedAccounts = null;

  // 0. Check for Google Authenticator migration payload
  if (cleanContent.startsWith("otpauth-migration://")) {
    const googleAccounts = parseGoogleMigrationUri(cleanContent);
    if (googleAccounts && googleAccounts.length > 0) {
      importedAccounts = googleAccounts;
    } else {
      showImportError("Invalid or corrupted Google Authenticator migration payload");
      return;
    }
  } else if (cleanContent.includes("otpauth://")) {
    // 0b. Plain text containing one or more otpauth:// lines
    const lines = cleanContent.split(/[\r\n]+/);
    const parsedList = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("otpauth://")) {
        const parsed = parseOtpauth(trimmed);
        if (parsed) parsedList.push(parsed);
      }
    }
    if (parsedList.length > 0) {
      importedAccounts = parsedList;
    }
  }

  let payload = null;
  if (!importedAccounts) {
    try {
      payload = JSON.parse(cleanContent);
    } catch (parseError) {
      showImportError(`Unrecognized format: Not valid JSON or otpauth URI (${parseError.message})`);
      return;
    }

    // Check if it's an encrypted KH 2FA backup
    if (payload?.format === "kh-2fa-encrypted" || (payload?.ciphertext && payload?.salt && payload?.iv)) {
      const pass = window.prompt("🔐 This backup is encrypted. Enter password to decrypt:");
      if (!pass) {
        showImportError("Decryption cancelled.");
        return;
      }
      try {
        const decrypted = await decryptVault(pass, payload);
        importedAccounts = Array.isArray(decrypted) ? decrypted : decrypted?.accounts;
      } catch (err) {
        showImportError(`Decryption failed: Incorrect password or corrupted file (${err.message})`);
        return;
      }
    }

    // 1. Check if it's a decrypted accounts list
    if (Array.isArray(payload)) {
      importedAccounts = payload;
    } else if (payload && Array.isArray(payload.accounts)) {
      importedAccounts = payload.accounts;
    } else if (payload?.db && Array.isArray(payload.db.entries)) {
      // Aegis export format
      importedAccounts = payload.db.entries
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
      // 2FAS export format
      importedAccounts = payload.services
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
      // Bitwarden export format
      importedAccounts = [];
      for (const item of payload.items) {
        const totpUrl = item.login?.totp;
        if (totpUrl && typeof totpUrl === "string") {
          const parsed = parseOtpauth(totpUrl);
          if (parsed) {
            importedAccounts.push({ ...parsed, issuer: parsed.issuer || item.name || "" });
          } else if (isValidSecret(totpUrl)) {
            importedAccounts.push({
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

  if (importedAccounts) {
    showImportError(`Found ${importedAccounts.length} decrypted accounts. Validating...`);
    // Validate accounts
    const validAccounts = importedAccounts.every(
      (account) => account && typeof account.secret === "string"
    );
    if (!validAccounts || importedAccounts.length === 0) {
      showImportError("Invalid account data in backup - secret is required for all accounts");
      return;
    }

    showImportError("Importing and encrypting accounts...");
    // Import accounts into current vault, ensuring all fields are populated correctly
    if (!vault) {
      vault = { accounts: [], createdAt: Date.now() };
    }

    const importMode = document.querySelector('input[name="importMode"]:checked')?.value || "replace";

    // Clean and normalize secrets
    const mappedAccounts = importedAccounts.map((account) => ({
      id: account.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      issuer: account.issuer || "",
      label: account.label || "",
      secret: account.secret.replace(/\s+/g, "").toUpperCase(),
      digits: account.digits || "6",
      algorithm: account.algorithm || "SHA-1",
      period: Number(account.period) || 30,
      pinned: Boolean(account.pinned),
      category: account.category || (account.group || undefined) || detectCategoryFromBrand(account.issuer, account.label) || undefined,
      createdAt: account.createdAt || Date.now(),
    }));

    if (importMode === "merge" && Array.isArray(vault.accounts) && vault.accounts.length > 0) {
      const existingSecrets = new Set(vault.accounts.map((a) => a.secret));
      const newItems = mappedAccounts.filter((a) => !existingSecrets.has(a.secret));
      vault.accounts = [...vault.accounts, ...newItems];
      showToast(`✓ Merged ${newItems.length} accounts (${mappedAccounts.length - newItems.length} existing skipped)`);
    } else {
      vault.accounts = mappedAccounts;
      showToast(`✓ Backup imported (${mappedAccounts.length} accounts)`);
    }

    // Re-encrypt with current PIN
    try {
      vaultRecord = await encryptVault(sessionPin, vault);
      await persistVaultRecord(vaultRecord);
      clearInputs();
      showToast("✓ Backup imported successfully");
      renderAccounts();
      closeSettingsModal();
    } catch (encryptError) {
      showImportError(`Failed to encrypt and save accounts: ${encryptError.message}`);
      console.error("Encryption error:", encryptError);
    }
    return;
  }

  // 2. Check if it's an encrypted vault record
  let encryptedVault = null;
  if (payload && payload.ciphertext && payload.iv && payload.salt) {
    encryptedVault = payload;
  } else if (payload && payload.vault) {
    if (typeof payload.vault === "object" && payload.vault.ciphertext && payload.vault.iv && payload.vault.salt) {
      encryptedVault = payload.vault;
    } else if (typeof payload.vault === "string") {
      try {
        const parsedVault = JSON.parse(payload.vault);
        if (parsedVault && parsedVault.ciphertext && parsedVault.iv && parsedVault.salt) {
          encryptedVault = parsedVault;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (encryptedVault) {
    showImportError("Found encrypted vault record. Saving directly...");
    // Save directly
    try {
      await persistVaultRecord(encryptedVault);
      clearInputs();
      await setLocked(true);
      showLockedView({ createMode: false });
      closeSettingsModal();
      showToast("✓ Encrypted backup imported. Please enter PIN to unlock.");
    } catch (saveError) {
      showImportError(`Failed to save encrypted vault: ${saveError.message}`);
      console.error("Save error:", saveError);
    }
    return;
  }

  showImportError("Unrecognized backup format. Ensure the file contains accounts or vault data.");
}

function clearInputs() {
  if (elements.importText) {
    elements.importText.value = "";
  }
  if (elements.importFile) {
    elements.importFile.value = "";
  }
  clearImportStatus();
}

function showImportStatus(message, type = "error") {
  if (!elements.importError) return;
  elements.importError.textContent = message;
  elements.importError.className = `import-error ${type}`;
}

function clearImportStatus() {
  if (!elements.importError) return;
  elements.importError.textContent = "";
  elements.importError.className = "import-error hidden";
}

function showImportError(message) {
  showImportStatus(message, "error");
}

function clearImportError() {
  clearImportStatus();
}

async function loadBackupFile(file) {
  if (!file) return;
  try {
    clearImportStatus();
    showImportStatus("Reading file...", "info");
    const content = await file.text();
    if (!content || !content.trim()) {
      showImportStatus("Selected file is empty.", "error");
      return;
    }

    if (elements.importText) {
      elements.importText.value = content;
    }

    // Inspect content to give user helpful immediate feedback
    let count = null;
    try {
      const parsed = JSON.parse(content.replace(/^\uFEFF/, ""));
      if (Array.isArray(parsed)) {
        count = parsed.length;
      } else if (Array.isArray(parsed?.accounts)) {
        count = parsed.accounts.length;
      } else if ((parsed?.ciphertext && parsed?.iv && parsed?.salt) || parsed?.vault) {
        count = "encrypted";
      }
    } catch {
      // Syntax errors will be validated on import
    }

    if (typeof count === "number") {
      showImportStatus(
        `✓ "${file.name}" loaded (${count} account${count === 1 ? "" : "s"}) — click Import to restore.`,
        "success",
      );
    } else if (count === "encrypted") {
      showImportStatus(
        `✓ "${file.name}" loaded (encrypted vault) — click Import to restore.`,
        "success",
      );
    } else {
      showImportStatus(
        `✓ "${file.name}" loaded — click Import to restore.`,
        "info",
      );
    }

    elements.importBtn?.focus();
  } catch (err) {
    console.error("Failed to read file:", err);
    showImportStatus(`Failed to read file: ${err.message || err}`, "error");
  }
}

async function triggerFilePicker() {
  // Method 1: Modern File System Access API
  if (typeof window.showOpenFilePicker === "function") {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON backup (*.json)",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      await loadBackupFile(file);
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // user cancelled picker
      console.warn("showOpenFilePicker failed, falling back to input:", err);
    }
  }

  // Method 2: Fallback to hidden file input
  if (elements.importFile) {
    elements.importFile.value = "";
    elements.importFile.click();
  }
}

async function saveAccount() {
  if (!vault) return;
  elements.modalError.textContent = "";

  let secretValue = elements.secretInput.value.trim();
  const issuerValue = elements.issuerInput.value.trim();
  const labelValue = elements.labelInput.value.trim();

  if (secretValue.startsWith("otpauth://")) {
    const parsed = parseOtpauth(secretValue);
    if (parsed) {
      secretValue = parsed.secret;
      if (!elements.issuerInput.value.trim()) {
        elements.issuerInput.value = parsed.issuer;
      }
      if (!elements.labelInput.value.trim()) {
        elements.labelInput.value = parsed.label;
      }
      if (elements.digitsInput) elements.digitsInput.value = String(parsed.digits || 6);
      if (elements.algorithmInput) elements.algorithmInput.value = parsed.algorithm || "SHA-1";
      if (elements.periodInput) elements.periodInput.value = String(parsed.period || 30);
    }
  }

  if (!secretValue) {
    elements.modalError.textContent = "Secret is required.";
    return;
  }

  const normalizedSecret = normalizeSecret(secretValue);
  if (!isValidSecret(normalizedSecret)) {
    elements.modalError.textContent = "Secret must be valid Base32.";
    return;
  }

  const account = {
    id: editingId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    issuer: issuerValue,
    label: labelValue,
    secret: normalizedSecret,
    category: elements.categoryInput?.value?.trim() || undefined,
    digits: elements.digitsInput?.value || "6",
    algorithm: elements.algorithmInput?.value || "SHA-1",
    period: Number(elements.periodInput?.value) || 30,
    pinned: editingId && vault?.accounts
      ? Boolean(vault.accounts.find((item) => item.id === editingId)?.pinned)
      : false,
    createdAt:
      editingId && vault?.accounts
        ? vault.accounts.find((item) => item.id === editingId)?.createdAt ||
          Date.now()
        : Date.now(),
  };

  if (editingId) {
    vault.accounts = vault.accounts.map((item) =>
      item.id === editingId ? account : item,
    );
  } else {
    vault.accounts.unshift(account);
  }

  const wasEditing = !!editingId;
  await saveVault();
  closeModal();
  renderAccounts();
  showToast(wasEditing ? "Account updated" : "Account added");
}

// ── Drag-to-reorder handlers ─────────────────────────────────────────────────
let isDraggingNow = false;

function handleDragStart(e, accountId) {
  dragSrcId = accountId;
  isDraggingNow = true;
  // Delay adding the class so the drag image captures the normal look
  requestAnimationFrame(() => e.target.closest(".account")?.classList.add("dragging"));
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", accountId);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

async function handleDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  if (!dragSrcId || dragSrcId === targetId) return;

  // Build the currently displayed order, apply the swap
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = vault.accounts.filter(
    (a) => `${a.issuer} ${a.label}`.toLowerCase().includes(query)
  );
  const displayed = sortAccounts(filtered);

  const srcIdx = displayed.findIndex((a) => a.id === dragSrcId);
  const tgtIdx = displayed.findIndex((a) => a.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;

  // Reorder within the displayed slice
  const [moved] = displayed.splice(srcIdx, 1);
  displayed.splice(tgtIdx, 0, moved);

  // Rebuild vault.accounts: displayed items in new order, hidden items appended
  const hiddenIds = new Set(displayed.map((a) => a.id));
  const hidden = vault.accounts.filter((a) => !hiddenIds.has(a.id));
  vault.accounts = [...displayed, ...hidden];

  // Persist new order and switch to manual sort so it sticks
  meta = await updateMeta({ sortMode: "manual" });
  if (elements.sortSelect) elements.sortSelect.value = "manual";
  if (preferencesDraft) preferencesDraft.sortMode = "manual";

  await saveVault();
  renderAccounts();
}

function handleDragEnd(e) {
  dragSrcId = null;
  setTimeout(() => {
    isDraggingNow = false;
  }, 120);
  // Clean up any lingering visual states
  document.querySelectorAll(".account.dragging").forEach((el) => el.classList.remove("dragging"));
  document.querySelectorAll(".account.drag-over").forEach((el) => el.classList.remove("drag-over"));
}

function formatOTPDisplay(raw) {
  if (!raw || typeof raw !== "string" || raw.includes("-")) return raw || "--- ---";
  const clean = raw.replace(/\s+/g, "");
  if (clean.length === 6) {
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  if (clean.length === 8) {
    return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  }
  return clean;
}

function updateAccountCount() {
  if (!elements.accountCount) return;
  const count = vault?.accounts?.length || 0;
  elements.accountCount.textContent = count > 0 ? String(count) : "";
}

async function moveAccount(accountId, direction) {
  if (!vault?.accounts || vault.accounts.length < 2) return;
  const idx = vault.accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= vault.accounts.length) return;

  const [moved] = vault.accounts.splice(idx, 1);
  vault.accounts.splice(targetIdx, 0, moved);

  meta = await updateMeta({ sortMode: "manual" });
  if (elements.sortSelect) elements.sortSelect.value = "manual";
  if (preferencesDraft) preferencesDraft.sortMode = "manual";

  await saveVault();
  renderAccounts();

  const movedEl = elements.accountsList.querySelector(`[data-id="${accountId}"]`);
  movedEl?.focus();
  showToast("Account reordered");
}

function renderAccounts() {
  if (!vault) return;
  renderCategoryFilterBar();
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = vault.accounts.filter((account) => {
    const haystack = `${account.issuer} ${account.label} ${account.category || ""}`.toLowerCase();
    if (!haystack.includes(query)) return false;
    if (activeCategory === "all") return true;
    if (activeCategory === "pinned") return Boolean(account.pinned);
    if (activeCategory === "uncategorized") return !(account.category && account.category.trim());
    return (account.category || "").toLowerCase() === activeCategory.toLowerCase();
  });
  const ordered = sortAccounts(filtered);

  elements.accountsList.innerHTML = "";
  const totalAccounts = vault.accounts.length;
  elements.emptyState.classList.toggle("hidden", totalAccounts !== 0);
  if (elements.noResultsState) {
    elements.noResultsState.classList.toggle("hidden", !(totalAccounts > 0 && ordered.length === 0));
  }
  updateAccountCount();

  if (ordered.length === 0) {
    return;
  }

  for (const account of ordered) {
    const brand = getBrandInfo(account.issuer, account.label);

    const item = document.createElement("div");
    item.className = "account";
    item.dataset.id = account.id;
    item.setAttribute("role", "listitem");
    item.setAttribute("draggable", "true");
    item.setAttribute("tabindex", "0");
    item.setAttribute("title", "Click to copy 2FA code");

    // Drag events
    item.addEventListener("dragstart", (e) => handleDragStart(e, account.id));
    item.addEventListener("dragover",  handleDragOver);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop",      (e) => handleDrop(e, account.id));
    item.addEventListener("dragend",   handleDragEnd);

    // Keyboard support: Enter / Space to copy, Alt+Up/Down to reorder
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || (e.key === " " && e.target === item)) {
        e.preventDefault();
        item.click();
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        moveAccount(account.id, e.key === "ArrowUp" ? -1 : 1);
      }
    });

    // Left: Brand Icon
    const brandIcon = document.createElement("div");
    brandIcon.className = "account-brand-icon";
    brandIcon.title = brand.name;
    brandIcon.style.background = brand.bgColor;
    brandIcon.style.borderColor = brand.borderColor;
    brandIcon.innerHTML = brand.svg;

    // Center: Details
    const details = document.createElement("div");
    details.className = "account-details";

    const title = document.createElement("div");
    title.className = "account-title";

    const issuer = document.createElement("strong");
    issuer.textContent = account.issuer || brand.name || "Account";
    issuer.title = issuer.textContent;
    title.append(issuer);

    if (account.label) {
      const label = document.createElement("span");
      label.textContent = `· ${account.label}`;
      label.title = account.label;
      title.append(label);
    }

    

    const codeWrap = document.createElement("div");
    codeWrap.className = "account-code-wrap";

    const code = document.createElement("div");
    code.className = "account-code";
    if (privacyMaskActive) {
      code.classList.add("masked");
    }
    code.dataset.code = "";
    code.textContent = "--- ---";

    const copyTip = document.createElement("span");
    copyTip.className = "copy-tip";
    copyTip.textContent = "Copy";

    codeWrap.append(code, copyTip);
    details.append(title, codeWrap);

    // Right: Star / Pin + Progress Ring + Drag handle
    const endCol = document.createElement("div");
    endCol.className = "account-end";

    const starBtn = document.createElement("button");
    starBtn.className = `star-btn ${account.pinned ? "active" : ""}`;
    starBtn.type = "button";
    starBtn.title = account.pinned ? "Unpin account" : "Pin to top";
    starBtn.innerHTML = account.pinned
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    starBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      account.pinned = !account.pinned;
      await saveVault();
      renderAccounts();
    });

    const ring = document.createElement("div");
    ring.className = "progress-ring";
    ring.innerHTML = `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle class="ring-track" cx="16" cy="16" r="13.5"></circle>
        <circle class="ring-progress" cx="16" cy="16" r="13.5"></circle>
      </svg>
      <span class="ring-text">${account.period || 30}</span>
    `;

    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.setAttribute("aria-hidden", "true");
    dragHandle.title = "Drag to reorder";
    dragHandle.innerHTML = `<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/></svg>`;

    endCol.append(starBtn, ring, dragHandle);

    item.append(brandIcon, details, endCol);
    elements.accountsList.append(item);
  }

  currentCounter = null;
  updateCodes();
}

async function updateCodes() {
  if (!vault) return;
  const now = getEffectiveNow();
  currentCounter = Math.floor(now / 1000);

  const promises = vault.accounts.map(async (account) => {
    try {
      const otp = await generateTOTP(account.secret, now, account);
      codes.set(account.id, otp);
      const item = elements.accountsList.querySelector(
        `[data-id="${account.id}"]`,
      );
      if (item) {
        const codeEl = item.querySelector("[data-code]");
        if (codeEl) {
          codeEl.textContent = formatOTPDisplay(otp);
        }
      }
    } catch (error) {
      codes.set(account.id, "------");
      const item = elements.accountsList.querySelector(
        `[data-id="${account.id}"]`,
      );
      if (item) {
        const codeEl = item.querySelector("[data-code]");
        if (codeEl) {
          codeEl.textContent = "--- ---";
        }
      }
    }
  });

  await Promise.all(promises);
  updateProgress(now);
}

function updateProgress(now = Date.now()) {
  elements.accountsList.querySelectorAll(".account").forEach((item) => {
    const id = item.dataset.id;
    const account = vault?.accounts?.find((acc) => acc.id === id);
    const period = Number(account?.period) || 30;
    const remaining = period - (Math.floor(now / 1000) % period);
    const percent = (remaining / period) * 100;
    const radius = 13.5;
    const circumference = 2 * Math.PI * radius;

    const ring = item.querySelector(".progress-ring");
    if (!ring) return;
    const progress = ring.querySelector(".ring-progress");
    const text = ring.querySelector(".ring-text");
    if (progress) {
      progress.style.strokeDasharray = `${circumference}`;
      progress.style.strokeDashoffset = `${circumference * (1 - percent / 100)}`;
    }
    if (text) {
      text.textContent = String(remaining);
    }
    if (remaining <= 5) {
      ring.classList.add("expiring");
      item.classList.add("expiring-soon");
    } else {
      ring.classList.remove("expiring");
      item.classList.remove("expiring-soon");
    }
  });
}

async function handleAccountAction(event) {
  if (isDraggingNow || dragSrcId) return;
  if (event.target.closest(".drag-handle") || event.target.closest(".star-btn")) return;

  const item = event.target.closest(".account");
  if (!item) return;
  const id = item.dataset.id;
  const account = vault.accounts.find((acc) => acc.id === id);
  if (!account) return;

  const button = event.target.closest("button[data-action]");
  if (button) {
    const action = button.dataset.action;

    

    if (action === "copy") {
      const code = (codes.get(id) || (await generateTOTP(account.secret, Date.now(), account))).replace(/\s+/g, "");
      await navigator.clipboard.writeText(code);
      scheduleClipboardClear(code, Number(meta?.clipboardClearSec ?? 30));
      showToast("Copied");
    }

    if (action === "autofill") {
      const code = (codes.get(id) || (await generateTOTP(account.secret, Date.now(), account))).replace(/\s+/g, "");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;
      chrome.tabs.sendMessage(
        tab.id,
        { type: "AUTOFILL_OTP", code },
        (response) => {
          if (chrome.runtime.lastError) {
            showToast("Autofill unavailable on this page");
            return;
          }
          if (!response?.ok) {
            showToast(response?.error || "Autofill failed");
          } else {
            showToast("Autofilled");
          }
        },
      );
    }

    if (action === "edit") {
      openModal(account);
    }

    if (action === "delete") {
      openDeleteModal(id);
    }
    return;
  }

  // Click on the card or code copies the OTP code
  try {
    const rawOtp = codes.get(id) || (await generateTOTP(account.secret, Date.now(), account));
    const cleanOtp = String(rawOtp).replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.includes("-")) return;

    await navigator.clipboard.writeText(cleanOtp);
    scheduleClipboardClear(cleanOtp, Number(meta?.clipboardClearSec ?? 30));

    // Tactile visual feedback on the card
    item.classList.add("copied");
    const copyTip = item.querySelector(".copy-tip");
    if (copyTip) {
      copyTip.textContent = "Copied!";
      copyTip.classList.add("active");
    }

    setTimeout(() => {
      item.classList.remove("copied");
      if (copyTip) {
        copyTip.textContent = "Copy";
        copyTip.classList.remove("active");
      }
    }, 850);

    showToast(`Copied ${formatOTPDisplay(cleanOtp)}`);
  } catch (err) {
    console.error("Failed to copy TOTP code", err);
  }
}

async function touchActivity() {
  if (!meta || meta.locked) return;
  const now = Date.now();
  if (now - lastActivityUpdate < 5000) return;
  lastActivityUpdate = now;
  meta = await updateMeta({ lastActive: now });
  if (sessionData) {
    sessionData.lastActive = now;
    await setSession(sessionData);
  }
}

function checkInactivity() {
  if (!meta || meta.locked) return;
  const timeoutMs = getLockTimeoutMs();
  if (timeoutMs <= 0) return;
  const now = Date.now();
  if (now - meta.lastActive > timeoutMs) {
    setLocked(true);
    showLockedView({ createMode: false });
  }
}

function togglePrivacyMask() {
  privacyMaskActive = !privacyMaskActive;
  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }
  document.querySelectorAll(".account-code").forEach((el) => {
    el.classList.toggle("masked", privacyMaskActive);
  });
}

function isRestrictedUrl(url) {
  if (!url) return false;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com")
  );
}

async function decodeImageForQR(imgSource) {
  // 1. Try pure JavaScript jsQR engine (100% desktop Chrome & Cross-Platform support)
  try {
    const qrFn = typeof jsQR !== "undefined" ? jsQR : (window.jsQR || null);
    if (qrFn) {
      const width = imgSource.naturalWidth || imgSource.width;
      const height = imgSource.naturalHeight || imgSource.height;
      if (width > 0 && height > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(imgSource, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);

        // Standard contrast scan
        const code = qrFn(imgData.data, width, height, { inversionAttempts: "dontInvert" });
        if (code?.data) return code.data;

        // Inverted contrast scan (dark mode QR codes)
        const codeInv = qrFn(imgData.data, width, height, { inversionAttempts: "onlyInvert" });
        if (codeInv?.data) return codeInv.data;
      }
    }
  } catch (err) {
    console.debug("jsQR decode error:", err);
  }

  // 2. Fallback to native BarcodeDetector if available
  if ("BarcodeDetector" in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const barcodes = await detector.detect(imgSource);
      if (barcodes && barcodes.length > 0) {
        for (const code of barcodes) {
          if (code.rawValue) return code.rawValue;
        }
      }
    } catch (e) {
      console.debug("BarcodeDetector error:", e);
    }
  }
  return null;
}

async function populateAndOpenAddModal(urlOrSecret) {
  if (!urlOrSecret) return;

  // Handle Google Authenticator export QR code
  if (typeof urlOrSecret === "string" && urlOrSecret.trim().startsWith("otpauth-migration://")) {
    const imported = parseGoogleMigrationUri(urlOrSecret.trim());
    if (imported && imported.length > 0) {
      if (!vault) vault = { accounts: [], createdAt: Date.now() };
      const newItems = imported.map((acc) => ({
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        issuer: acc.issuer || "",
        label: acc.label || "",
        secret: acc.secret,
        digits: String(acc.digits || 6),
        algorithm: acc.algorithm || "SHA-1",
        period: Number(acc.period) || 30,
        pinned: false,
        createdAt: Date.now(),
      }));

      vault.accounts = [...vault.accounts, ...newItems];
      await saveVault();
      renderAccounts();
      showToast(`✓ Imported ${newItems.length} accounts from Google Authenticator!`);
      return;
    }
  }

  const parsed = parseOtpauth(urlOrSecret);
  openModal();
  if (parsed) {
    elements.secretInput.value = parsed.secret;
    elements.issuerInput.value = parsed.issuer;
    elements.labelInput.value = parsed.label;
    if (elements.digitsInput) elements.digitsInput.value = String(parsed.digits || 6);
    if (elements.algorithmInput) elements.algorithmInput.value = parsed.algorithm || "SHA-1";
    if (elements.periodInput) elements.periodInput.value = String(parsed.period || 30);
  } else {
    elements.secretInput.value = urlOrSecret;
  }
  updateModalBrandPreview();
  showToast("QR code detected & loaded!");
}

async function handleScanScreenQR() {
  showToast("Scanning screen for QR code...");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn("Tabs query error:", chrome.runtime.lastError.message);
      showToast("Cannot access active tab");
      return;
    }
    const activeTab = tabs?.[0];
    if (!activeTab) {
      showToast("No active tab found");
      return;
    }
    if (isRestrictedUrl(activeTab.url)) {
      showToast("Cannot scan chrome:// pages. Open a website with a QR code.");
      return;
    }

    chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn("CAPTURE_VISIBLE_TAB error:", chrome.runtime.lastError.message);
        fallbackDomScan(activeTab);
        return;
      }
      if (response?.ok && response?.dataUrl) {
        const img = new Image();
        img.onload = async () => {
          const qrContent = await decodeImageForQR(img);
          if (qrContent) {
            populateAndOpenAddModal(qrContent);
          } else {
            fallbackDomScan(activeTab);
          }
        };
        img.onerror = () => fallbackDomScan(activeTab);
        img.src = response.dataUrl;
      } else {
        fallbackDomScan(activeTab);
      }
    });
  });

  function fallbackDomScan(activeTab) {
    if (!activeTab?.id || isRestrictedUrl(activeTab.url)) {
      showToast("No 2FA QR code found on screen");
      return;
    }
    chrome.tabs.sendMessage(activeTab.id, { type: "EXTRACT_QR_DOM" }, (res) => {
      if (chrome.runtime.lastError) {
        // Explicitly reading chrome.runtime.lastError prevents Chrome from logging Unchecked runtime.lastError!
        const ignored = chrome.runtime.lastError.message;
        console.debug("Content script unreachable:", ignored);
        showToast("No 2FA QR code found on screen");
        return;
      }
      if (res?.ok && res?.url) {
        populateAndOpenAddModal(res.url);
      } else {
        showToast("No 2FA QR code found on screen");
      }
    });
  }
}

async function handleQrFileUpload(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const dataUrl = evt.target?.result;
    if (dataUrl) {
      const img = new Image();
      img.onload = async () => {
        const qrContent = await decodeImageForQR(img);
        if (qrContent) {
          populateAndOpenAddModal(qrContent);
        } else {
          showToast("Could not find QR code in this image");
        }
      };
      img.src = dataUrl;
    }
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function updateSyncBadge() {
  if (!elements.syncStatusBadge) return;
  const isEnabled = Boolean(meta?.syncEnabled);
  elements.syncStatusBadge.textContent = isEnabled ? "On" : "Off";
  if (isEnabled) {
    elements.syncStatusBadge.classList.add("active");
  } else {
    elements.syncStatusBadge.classList.remove("active");
  }
}

async function refreshSyncUI() {
  if (!elements.settingsGoogleSync) return;
  updateSyncBadge();

  const isEnabled = Boolean(meta?.syncEnabled);
  if (elements.syncToggle) {
    elements.syncToggle.checked = isEnabled;
  }
  if (elements.syncStateText) {
    elements.syncStateText.textContent = isEnabled
      ? "Active — Synced with your Google account"
      : "Disabled — Stored strictly on this local device";
  }

  if (isEnabled) {
    elements.syncStatusCard?.classList.remove("hidden");
    const stats = await getSyncStorageStats();
    if (elements.syncLastTime) {
      const last = meta?.lastSyncedAt || stats.updatedAt;
      elements.syncLastTime.textContent = last
        ? new Date(last).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            month: "short",
            day: "numeric",
          })
        : "Just now";
    }
    if (elements.syncStorageUsage) {
      const kb = (stats.totalBytes / 1024).toFixed(1);
      elements.syncStorageUsage.textContent = `${kb} KB / 100 KB (${stats.chunkCount} chunk${stats.chunkCount === 1 ? "" : "s"})`;
    }
  } else {
    elements.syncStatusCard?.classList.add("hidden");
  }
}


// ─── Clock Drift & Time Synchronization ─────────────────────────────────────
async function checkClockSync() {
  if (elements.clockSyncFeedback) {
    elements.clockSyncFeedback.classList.remove("hidden");
    elements.clockSyncFeedback.innerHTML = '<span class="muted">Checking time synchronization with server…</span>';
  }

  const startTime = Date.now();
  try {
    const res = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      cache: "no-store",
    });
    const roundTrip = Date.now() - startTime;
    const serverHeader = res.headers.get("date");
    if (!serverHeader) {
      throw new Error("Server did not return a Date header.");
    }

    const serverTime = new Date(serverHeader).getTime() + Math.round(roundTrip / 2);
    const clientTime = Date.now();
    const driftMs = serverTime - clientTime;

    if (Math.abs(driftMs) >= 2000) {
      meta.timeOffsetMs = Math.round(driftMs);
      await updateMeta({ timeOffsetMs: meta.timeOffsetMs });
      updateClockSyncUI();
      if (elements.clockSyncFeedback) {
        elements.clockSyncFeedback.innerHTML = `
          <strong style="color: #fbbf24;">⚠️ Clock Drift: ${(driftMs / 1000).toFixed(1)}s</strong>
          <p style="margin: 4px 0 0; font-size: 12px;">Your computer clock is ${driftMs > 0 ? "behind" : "ahead"}. An offset of <strong>${meta.timeOffsetMs > 0 ? "+" : ""}${(meta.timeOffsetMs / 1000).toFixed(1)}s</strong> has been auto-applied so all TOTP codes work perfectly!</p>
        `;
      }
      showToast("Clock offset applied!");
      updateCodes();
    } else {
      meta.timeOffsetMs = 0;
      await updateMeta({ timeOffsetMs: 0 });
      updateClockSyncUI();
      if (elements.clockSyncFeedback) {
        elements.clockSyncFeedback.innerHTML = `
          <strong style="color: #4cc9f0;">✓ Clock In Sync</strong>
          <p style="margin: 4px 0 0; font-size: 12px;">Difference is only ${driftMs > 0 ? "+" : ""}${driftMs}ms. Your device time is accurate.</p>
        `;
      }
    }
  } catch (err) {
    if (elements.clockSyncFeedback) {
      elements.clockSyncFeedback.innerHTML = `
        <span class="error">Could not check server time: ${err.message}. Please check internet connection.</span>
      `;
    }
  }
}

async function resetClockOffset() {
  meta.timeOffsetMs = 0;
  await updateMeta({ timeOffsetMs: 0 });
  updateClockSyncUI();
  if (elements.clockSyncFeedback) {
    elements.clockSyncFeedback.classList.remove("hidden");
    elements.clockSyncFeedback.innerHTML = '<span class="muted">Clock offset reset to 0 ms.</span>';
  }
  showToast("Clock offset reset");
  updateCodes();
}

function updateClockSyncUI() {
  const offset = meta?.timeOffsetMs || 0;
  const isOffsetActive = Math.abs(offset) >= 1000;
  if (elements.clockSyncBadge) {
    if (isOffsetActive) {
      elements.clockSyncBadge.textContent = `${offset > 0 ? "+" : ""}${(offset / 1000).toFixed(1)}s`;
      elements.clockSyncBadge.className = "sync-badge status-warning";
    } else {
      elements.clockSyncBadge.textContent = "In Sync";
      elements.clockSyncBadge.className = "sync-badge";
    }
  }
  if (elements.clockDriftDetail) {
    elements.clockDriftDetail.textContent = isOffsetActive
      ? `Compensated offset: ${offset > 0 ? "+" : ""}${(offset / 1000).toFixed(1)} seconds`
      : "Offset: 0 ms (Device clock in sync)";
  }
  if (elements.clockDriftTag) {
    if (isOffsetActive) {
      elements.clockDriftTag.textContent = "Offset Active";
      elements.clockDriftTag.className = "sync-badge status-warning";
    } else {
      elements.clockDriftTag.textContent = "In Sync";
      elements.clockDriftTag.className = "sync-badge";
    }
  }
}

async function handleSyncToggle(e) {
  const enable = e.target.checked;
  if (!isSyncAvailable()) {
    showToast("Google Sync is not supported in this browser");
    e.target.checked = false;
    return;
  }

  if (enable) {
    if (!vaultRecord) {
      showToast("Create your vault first to enable sync");
      e.target.checked = false;
      return;
    }
    try {
      await setSyncVaultRecord(vaultRecord);
      meta = await updateMeta({
        syncEnabled: true,
        lastSyncedAt: vaultRecord.updatedAt || Date.now(),
      });
      showToast("✓ Google Account Sync enabled!");
      await refreshSyncUI();
    } catch (err) {
      console.error("Sync enable error:", err);
      showToast(`Failed to enable sync: ${err.message}`);
      e.target.checked = false;
    }
  } else {
    meta = await updateMeta({ syncEnabled: false });
    showToast("Google Account Sync disabled (local data kept)");
    await refreshSyncUI();
  }
}

async function handleSyncNow() {
  if (!meta?.syncEnabled || !vaultRecord) return;
  try {
    if (elements.syncNowBtn) {
      elements.syncNowBtn.disabled = true;
      const label = elements.syncNowBtn.querySelector("span");
      if (label) label.textContent = "Syncing...";
    }
    await setSyncVaultRecord(vaultRecord);
    meta = await updateMeta({ lastSyncedAt: Date.now() });
    showToast("✓ Vault synced to Google Cloud!");
    await refreshSyncUI();
  } catch (err) {
    showToast(`Sync failed: ${err.message}`);
  } finally {
    if (elements.syncNowBtn) {
      elements.syncNowBtn.disabled = false;
      const label = elements.syncNowBtn.querySelector("span");
      if (label) label.textContent = "Sync Now";
    }
  }
}

async function handleClearCloudSync() {
  if (!confirm("Are you sure you want to remove all synced vault data from Google Cloud? Your local data on this computer will NOT be deleted.")) {
    return;
  }
  try {
    await clearSyncVault();
    meta = await updateMeta({ syncEnabled: false, lastSyncedAt: 0 });
    showToast("✓ Cloud sync data removed");
    await refreshSyncUI();
  } catch (err) {
    showToast(`Failed to clear cloud sync: ${err.message}`);
  }
}

async function handleCheckSyncManual() {
  if (!isSyncAvailable()) {
    showToast("Google Sync is not available in this browser");
    return;
  }
  try {
    if (elements.checkSyncBtn) {
      elements.checkSyncBtn.disabled = true;
    }
    const synced = await getSyncVaultRecord();
    if (synced && synced.ciphertext) {
      vaultRecord = synced;
      await setVaultRecord(vaultRecord);
      meta = await updateMeta({ syncEnabled: true, lastSyncedAt: synced.updatedAt || Date.now() });
      showLockedView({ createMode: false, syncDetected: true });
      showToast("✓ Synced vault found and loaded! Enter PIN to unlock.");
    } else {
      showToast("No synced vault found in your Google Account");
    }
  } catch (err) {
    showToast(`Sync check error: ${err.message}`);
  } finally {
    if (elements.checkSyncBtn) {
      elements.checkSyncBtn.disabled = false;
    }
  }
}

async function init() {
  [vaultRecord, meta, sessionData] = await Promise.all([
    getVaultRecord(),
    getMeta(),
    getSession(),
  ]);

  // Restore persistent lockout state
  try {
    const lockout = await getLockoutState();
    const now = Date.now();
    if (lockout && lockout.lockoutUntil > now) {
      const remainingSec = Math.ceil((lockout.lockoutUntil - now) / 1000);
      failedPinAttempts = lockout.failedAttempts || 3;
      setLockout(remainingSec, false);
    } else {
      failedPinAttempts = lockout?.failedAttempts || 0;
    }
  } catch (err) {
    console.warn("Could not restore lockout state:", err);
  }

  let syncDetected = false;
  if (!vaultRecord && isSyncAvailable()) {
    try {
      const syncedRecord = await getSyncVaultRecord();
      if (syncedRecord && syncedRecord.ciphertext) {
        vaultRecord = syncedRecord;
        await setVaultRecord(vaultRecord);
        meta = await updateMeta({
          syncEnabled: true,
          lastSyncedAt: syncedRecord.updatedAt || Date.now(),
        });
        syncDetected = true;
      }
    } catch (e) {
      console.warn("Could not check Google sync storage on startup:", e);
    }
  } else if (vaultRecord && meta?.syncEnabled && isSyncAvailable()) {
    try {
      const syncedRecord = await getSyncVaultRecord();
      if (syncedRecord?.ciphertext) {
        const localTime = vaultRecord.updatedAt || 0;
        const syncTime = syncedRecord.updatedAt || 0;
        if (syncTime > localTime) {
          vaultRecord = syncedRecord;
          await setVaultRecord(vaultRecord);
          meta = await updateMeta({ lastSyncedAt: syncTime });
        } else if (localTime > syncTime) {
          await setSyncVaultRecord(vaultRecord);
          meta = await updateMeta({ lastSyncedAt: localTime });
        }
      } else {
        await setSyncVaultRecord(vaultRecord);
        meta = await updateMeta({
          lastSyncedAt: vaultRecord.updatedAt || Date.now(),
        });
      }
    } catch (e) {
      console.warn("Background sync reconciliation error:", e);
    }
  }

  updateSyncBadge();

  if (elements.lockTimeoutSelect) {
    elements.lockTimeoutSelect.value = String(getLockTimeoutMs());
  }
  if (elements.sortSelect) {
    elements.sortSelect.value = getSortMode();
  }
  applyTheme(getTheme());

  // Privacy mask code visibility: default to blur (active icon)
  privacyMaskActive = meta?.defaultMaskCodes !== false;
  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }
  if (elements.codeVisibilitySelect) {
    elements.codeVisibilitySelect.value = privacyMaskActive ? "blur" : "visible";
  }

  if (!vaultRecord) {
    showLockedView({ createMode: true });
  } else {
    const timeoutMs = getLockTimeoutMs();
    const lastActive = sessionData?.lastActive || meta.lastActive;
    const expired =
      timeoutMs > 0 && lastActive && Date.now() - lastActive > timeoutMs;

    if (!meta.locked && sessionData?.pin && !expired) {
      try {
        vault = await decryptVault(sessionData.pin, vaultRecord);
        sessionPin = sessionData.pin;
        await setLocked(false);
        showMainView();
      } catch (error) {
        await clearStoredSession();
        await setLocked(true);
        showLockedView({ createMode: false, syncDetected });
      }
    } else {
      if (expired && !meta.locked) {
        await clearStoredSession();
        await setLocked(true);
      }
      showLockedView({ createMode: false, syncDetected });
    }
  }

  elements.unlockBtn.addEventListener("click", handleUnlock);

  // Press Enter on any PIN field to unlock / create vault
  const onEnterUnlock = (e) => { if (e.key === "Enter") handleUnlock(); };
  elements.unlockPin.addEventListener("keydown", onEnterUnlock);
  elements.newPin.addEventListener("keydown", onEnterUnlock);
  elements.confirmPin.addEventListener("keydown", onEnterUnlock);

  elements.sidePanelBtn?.addEventListener("click", async () => {
    if (chrome.sidePanel?.open) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.windowId) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          window.close();
        }
      } catch (err) {
        showToast("Side panel not supported in this window");
      }
    } else {
      showToast("Side panel not available in this browser");
    }
  });

  elements.modalViewQrBtn?.addEventListener("click", () => {
    if (editingId && vault?.accounts) {
      const acc = vault.accounts.find((a) => a.id === editingId);
      if (acc) showAccountQrModal(acc);
    }
  });

  elements.closeQrModalBtn?.addEventListener("click", closeAccountQrModal);
  elements.copyQrSecretBtn?.addEventListener("click", async () => {
    const sec = elements.qrModalSecret?.textContent || "";
    if (sec) {
      await navigator.clipboard.writeText(sec);
      showToast("Secret copied!");
    }
  });

  elements.editAccountsBtn.addEventListener("click", openEditAccountsModal);
  elements.settingsBtn.addEventListener("click", openSettingsModal);
  elements.addAccountBtn.addEventListener("click", () => openModal());
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.cancelAccountBtn.addEventListener("click", closeModal);
  elements.saveAccountBtn.addEventListener("click", saveAccount);
  elements.closeDeleteBtn.addEventListener("click", closeDeleteModal);
  elements.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener("click", confirmDelete);
  elements.closeEditAccountsBtn.addEventListener(
    "click",
    closeEditAccountsModal,
  );
  elements.closeSettingsBtn.addEventListener("click", closeSettingsModal);
  elements.settingsBackBtn.addEventListener("click", showSettingsList);
  elements.changePinBtn.addEventListener("click", handleChangePin);
  elements.backupBtn.addEventListener("click", handleBackup);
  elements.copyBackupBtn.addEventListener("click", handleCopyBackup);
  // Click on "Choose File" button triggers the file picker directly in popup
  elements.importFileBtn?.addEventListener("click", () => {
    triggerFilePicker();
  });

  // Hidden file input change listener fallback
  elements.importFile?.addEventListener("change", async (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      await loadBackupFile(file);
    }
  });

  // Drop zone events: click to browse, keyboard access, and drag-and-drop
  const dropZone = document.getElementById("importDropZone");
  if (dropZone) {
    // Click on drop zone opens file picker to choose a local file
    dropZone.addEventListener("click", () => {
      triggerFilePicker();
    });

    // Keyboard support (Enter or Space) to activate drop zone
    dropZone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerFilePicker();
      }
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        await loadBackupFile(file);
      }
    });
  }

  // Also allow drag-and-drop directly onto the textarea
  if (elements.importText) {
    elements.importText.addEventListener("dragover", (e) => e.preventDefault());
    elements.importText.addEventListener("drop", async (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        await loadBackupFile(file);
      }
    });
  }

  elements.importBtn.addEventListener("click", handleImportBackup);
  elements.prefSaveBtn.addEventListener("click", savePreferences);
  elements.prefCancelBtn.addEventListener("click", cancelPreferences);

  // Backup tabs
  document.querySelectorAll(".backup-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      document
        .querySelectorAll(".backup-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".backup-tab-content")
        .forEach((c) => c.classList.add("hidden"));
      tab.classList.add("active");
      const content = document.getElementById(`${tabName}-tab`);
      if (content) content.classList.remove("hidden");
    });
  });

  document.querySelectorAll(".settings-item").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.settings;
      openSettingsSection(key);
    });
  });
  elements.searchInput.addEventListener("input", renderAccounts);
  elements.accountsList.addEventListener("click", handleAccountAction);

  // Category filter pills delegation
  elements.categoryFilterBar?.addEventListener("click", (e) => {
    const pill = e.target.closest(".category-pill");
    if (!pill) return;
    setCategoryFilter(pill.dataset.category || "all");
  });

  // Custom Category Dropdown events
  elements.categoryDropdownTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCategoryDropdown();
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (elements.categoryDropdown && !elements.categoryDropdown.contains(e.target)) {
      closeCategoryDropdown();
    }
  });

  // Adding custom category from inside dropdown
  const handleAddNewCustomCategory = () => {
    const newCat = elements.newCustomCategoryInput?.value?.trim();
    if (newCat) {
      setCategoryValue(newCat);
      closeCategoryDropdown();
      categoryManuallyTouched = true;
      if (elements.newCustomCategoryInput) elements.newCustomCategoryInput.value = "";
    }
  };

  elements.addNewCategoryBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    handleAddNewCustomCategory();
  });

  elements.newCustomCategoryInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleAddNewCustomCategory();
    } else if (e.key === "Escape") {
      closeCategoryDropdown();
    }
  });

  // Category quick suggestion chips in modal
  elements.categoryQuickChips?.addEventListener("click", (e) => {
    const chip = e.target.closest(".quick-chip");
    if (!chip) return;
    const cat = chip.dataset.cat;
    categoryManuallyTouched = true;
    if (elements.categoryInput?.value?.trim().toLowerCase() === cat.toLowerCase()) {
      setCategoryValue("");
    } else {
      setCategoryValue(cat);
    }
  });

  // Clock sync buttons
  elements.checkClockSyncBtn?.addEventListener("click", checkClockSync);
  elements.resetClockOffsetBtn?.addEventListener("click", resetClockOffset);

  elements.lockTimeoutSelect.addEventListener("change", () => {
    const value = Number(elements.lockTimeoutSelect.value);
    if (!preferencesDraft) {
      preferencesDraft = {
        lockTimeoutMs: getLockTimeoutMs(),
        sortMode: getSortMode(),
        theme: getTheme(),
      };
    }
    preferencesDraft.lockTimeoutMs = Number.isFinite(value)
      ? value
      : defaultInactivityMs;
  });

  elements.themeSelect.addEventListener("change", () => {
    if (!preferencesDraft) {
      preferencesDraft = {
        lockTimeoutMs: getLockTimeoutMs(),
        sortMode: getSortMode(),
        theme: getTheme(),
      };
    }
    preferencesDraft.theme = elements.themeSelect.value;
    applyTheme(preferencesDraft.theme);
  });

  if (elements.sortSelect) {
    elements.sortSelect.addEventListener("change", () => {
      if (!preferencesDraft) {
        preferencesDraft = {
          lockTimeoutMs: getLockTimeoutMs(),
          sortMode: getSortMode(),
          theme: getTheme(),
        };
      }
      preferencesDraft.sortMode = elements.sortSelect.value;
    });
  }
  elements.clipboardClearSelect?.addEventListener("change", () => {
    if (!preferencesDraft) {
      preferencesDraft = {
        lockTimeoutMs: getLockTimeoutMs(),
        sortMode: getSortMode(),
        theme: getTheme(),
        clipboardClearSec: Number(meta?.clipboardClearSec ?? 30),
        defaultMaskCodes: meta?.defaultMaskCodes !== false,
      };
    }
    preferencesDraft.clipboardClearSec = Number(elements.clipboardClearSelect.value);
  });

  elements.codeVisibilitySelect?.addEventListener("change", () => {
    if (!preferencesDraft) {
      preferencesDraft = {
        lockTimeoutMs: getLockTimeoutMs(),
        sortMode: getSortMode(),
        theme: getTheme(),
        clipboardClearSec: Number(meta?.clipboardClearSec ?? 30),
        defaultMaskCodes: meta?.defaultMaskCodes !== false,
      };
    }
    preferencesDraft.defaultMaskCodes = elements.codeVisibilitySelect.value !== "visible";
  });


  elements.secretInput.addEventListener("input", updateModalBrandPreview);
  elements.issuerInput.addEventListener("input", updateModalBrandPreview);
  elements.labelInput.addEventListener("input", updateModalBrandPreview);

  elements.secretInput.addEventListener("blur", () => {
    const value = elements.secretInput.value.trim();
    if (value.startsWith("otpauth://")) {
      const parsed = parseOtpauth(value);
      if (parsed) {
        elements.secretInput.value = parsed.secret;
        if (!elements.issuerInput.value.trim()) {
          elements.issuerInput.value = parsed.issuer;
        }
        if (!elements.labelInput.value.trim()) {
          elements.labelInput.value = parsed.label;
        }
        updateModalBrandPreview();
      }
    }
  });

  elements.peekToggleBtn?.addEventListener("click", togglePrivacyMask);
  elements.scanScreenQrBtn?.addEventListener("click", handleScanScreenQR);
  elements.modalScanScreenBtn?.addEventListener("click", handleScanScreenQR);
  elements.qrFileInput?.addEventListener("change", handleQrFileUpload);

  // PIN eye show/hide toggle buttons
  document.querySelectorAll(".pin-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.classList.toggle("active", isPassword);
      btn.title = isPassword ? "Hide PIN" : "Show PIN";
      btn.setAttribute("aria-label", isPassword ? "Hide PIN" : "Show PIN");
      input.focus();
    });
  });

  // Reset all data confirmation
  elements.confirmResetBtn?.addEventListener("click", handleResetAll);
  elements.cancelResetBtn?.addEventListener("click", () => {
    showSettingsList();
  });

  // Google Account Sync listeners
  elements.syncToggle?.addEventListener("change", handleSyncToggle);
  elements.syncNowBtn?.addEventListener("click", handleSyncNow);
  elements.syncClearBtn?.addEventListener("click", handleClearCloudSync);
  elements.checkSyncBtn?.addEventListener("click", handleCheckSyncManual);

  // Listen for sync changes across devices in real-time
  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName === "sync" && (changes["sync_vault_meta"] || changes["vault"])) {
        try {
          const synced = await getSyncVaultRecord();
          if (
            synced &&
            synced.ciphertext &&
            synced.updatedAt !== vaultRecord?.updatedAt
          ) {
            vaultRecord = synced;
            await setVaultRecord(vaultRecord);
            meta = await updateMeta({ lastSyncedAt: synced.updatedAt || Date.now() });
            if (sessionPin) {
              try {
                vault = await decryptVault(sessionPin, vaultRecord);
                renderAccounts();
                showToast("✓ Vault updated from Google Account Sync");
              } catch (err) {
                await setLocked(true);
                showLockedView({ createMode: false, syncDetected: true });
                showToast("Vault was updated from another device. Please enter PIN.");
              }
            } else {
              showLockedView({ createMode: false, syncDetected: true });
            }
            await refreshSyncUI();
          }
        } catch (err) {
          console.warn("Storage sync listener error:", err);
        }
      }
    });
  }

  // Quick search shortcut: press '/' to focus search input, Esc to clear search
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement !== elements.searchInput &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      e.preventDefault();
      elements.searchInput?.focus();
    } else if (e.key === "Escape" && document.activeElement === elements.searchInput) {
      elements.searchInput.value = "";
      renderAccounts();
      elements.searchInput.blur();
    }
  });

  document.addEventListener("click", touchActivity);
  document.addEventListener("keydown", touchActivity);

  setInterval(() => {
    if (!meta?.locked && vault) {
      updateCodes();
      checkInactivity();
    }
  }, 1000);
}

init();
