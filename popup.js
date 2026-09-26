import { encryptVault, decryptVault } from "./crypto.js";
import {
  generateTOTP,
  parseOtpauth,
  normalizeSecret,
  base32ToBytes,
} from "./totp.js";
import {
  getVaultRecord,
  setVaultRecord,
  getMeta,
  updateMeta,
  getSession,
  setSession,
  clearSession as clearStoredSession,
} from "./storage.js";
import { getBrandInfo } from "./brandIcons.js";

const defaultInactivityMs = 2 * 60 * 1000;

const elements = {
  lockedView: document.getElementById("lockedView"),
  lockTitle: document.getElementById("lockTitle"),
  lockSubtitle: document.getElementById("lockSubtitle"),
  createPinFields: document.getElementById("createPinFields"),
  unlockPinField: document.getElementById("unlockPinField"),
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
  settingsPreferences: document.getElementById("settingsPreferences"),
  settingsShortcuts: document.getElementById("settingsShortcuts"),
  shortcutCard: document.getElementById("shortcutCard"),
  shortcutStatusText: document.getElementById("shortcutStatusText"),
  shortcutDisplay: document.getElementById("shortcutDisplay"),
  shortcutRecordingPrompt: document.getElementById("shortcutRecordingPrompt"),
  customizeShortcutBtn: document.getElementById("customizeShortcutBtn"),
  resetShortcutBtn: document.getElementById("resetShortcutBtn"),
  chromeShortcutsLink: document.getElementById("chromeShortcutsLink"),
  chromeShortcutHelp: document.getElementById("chromeShortcutHelp"),
  themeSelect: document.getElementById("themeSelect"),
  sortSelect: document.getElementById("sortSelect"),
  prefSaveBtn: document.getElementById("prefSaveBtn"),
  prefCancelBtn: document.getElementById("prefCancelBtn"),
  peekToggleBtn: document.getElementById("peekToggleBtn"),
  scanScreenQrBtn: document.getElementById("scanScreenQrBtn"),
  modalScanScreenBtn: document.getElementById("modalScanScreenBtn"),
  qrFileInput: document.getElementById("qrFileInput"),
  lockoutNotice: document.getElementById("lockoutNotice"),
  digitsInput: document.getElementById("digitsInput"),
  algorithmInput: document.getElementById("algorithmInput"),
  periodInput: document.getElementById("periodInput"),
};

let vaultRecord = null;
let vault = null;
let meta = null;
let sessionPin = null;
let sessionData = null;
let currentCounter = null;
let lastActivityUpdate = 0;
let editingId = null;
let pendingDeleteId = null;
let preferencesDraft = null;
let dragSrcId = null;          // id of account being dragged
let privacyMaskActive = false;
let failedPinAttempts = 0;
let lockoutSecondsRemaining = 0;
let lockoutInterval = null;
const codes = new Map();

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 1600);
}

function showLockedView({ createMode }) {
  elements.lockedView.classList.remove("hidden");
  elements.lockedView.setAttribute("aria-hidden", "false");
  elements.lockedView.removeAttribute("inert");
  elements.mainView.classList.add("hidden");
  elements.mainView.setAttribute("aria-hidden", "true");
  elements.mainView.setAttribute("inert", "");
  elements.lockError.textContent = "";

  if (createMode) {
    elements.lockTitle.textContent = "Create PIN";
    elements.lockSubtitle.textContent = "Set a PIN to encrypt your vault.";
    elements.createPinFields.classList.remove("hidden");
    elements.unlockPinField.classList.add("hidden");
    elements.unlockBtn.textContent = "Create";
  } else {
    elements.lockTitle.textContent = "Unlock vault";
    elements.lockSubtitle.textContent = "Enter your PIN to unlock.";
    elements.createPinFields.classList.add("hidden");
    elements.unlockPinField.classList.remove("hidden");
    elements.unlockBtn.textContent = "Unlock";
  }

  const focusTarget = createMode ? elements.newPin : elements.unlockPin;
  focusTarget?.focus();
}

function showMainView() {
  elements.lockedView.classList.add("hidden");
  elements.lockedView.setAttribute("aria-hidden", "true");
  elements.lockedView.setAttribute("inert", "");
  elements.mainView.classList.remove("hidden");
  elements.mainView.setAttribute("aria-hidden", "false");
  elements.mainView.removeAttribute("inert");
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
  return /^\d{6,}$/.test(pin);
}

async function saveVault() {
  if (!vault || !sessionPin) return;
  vaultRecord = await encryptVault(sessionPin, vault);
  await setVaultRecord(vaultRecord);
}

async function setLocked(locked) {
  if (locked) {
    clearSession();
    await clearStoredSession();
  }
  meta = await updateMeta({ locked, lastActive: locked ? 0 : Date.now() });
}

function setLockout(seconds) {
  lockoutSecondsRemaining = seconds;
  elements.unlockBtn.disabled = true;
  elements.unlockPin.disabled = true;
  if (elements.lockoutNotice) {
    elements.lockoutNotice.classList.remove("hidden");
    elements.lockoutNotice.textContent = `Too many failed attempts. Try again in ${lockoutSecondsRemaining}s.`;
  }
  clearInterval(lockoutInterval);
  lockoutInterval = setInterval(() => {
    lockoutSecondsRemaining -= 1;
    if (lockoutSecondsRemaining <= 0) {
      clearInterval(lockoutInterval);
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
      elements.lockError.textContent = "PIN must be at least 6 digits.";
      return;
    }
    if (pin !== confirm) {
      elements.lockError.textContent = "PINs do not match.";
      return;
    }

    vault = { accounts: [], createdAt: Date.now() };
    sessionPin = pin;
    vaultRecord = await encryptVault(pin, vault);
    await setVaultRecord(vaultRecord);
    await setLocked(false);
    showMainView();
    return;
  }

  const pin = elements.unlockPin.value.trim();
  if (!isPinValid(pin)) {
    elements.lockError.textContent = "Invalid PIN.";
    return;
  }

  try {
    vault = await decryptVault(pin, vaultRecord);
    failedPinAttempts = 0;
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
    elements.lockError.textContent = "Incorrect PIN.";
    if (failedPinAttempts >= 3) {
      const waitSeconds = failedPinAttempts === 3 ? 5 : failedPinAttempts === 4 ? 15 : 30;
      setLockout(waitSeconds);
    }
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
}

function openModal(editAccount = null) {
  editingId = editAccount?.id || null;
  elements.modalTitle.textContent = editingId ? "Edit account" : "Add account";
  elements.secretInput.value = editAccount?.secret || "";
  elements.issuerInput.value = editAccount?.issuer || "";
  elements.labelInput.value = editAccount?.label || "";
  if (elements.digitsInput) elements.digitsInput.value = String(editAccount?.digits || "6");
  if (elements.algorithmInput) elements.algorithmInput.value = editAccount?.algorithm || "SHA-1";
  if (elements.periodInput) elements.periodInput.value = String(editAccount?.period || "30");
  elements.modalError.textContent = "";
  updateModalBrandPreview();
  elements.modal.classList.remove("hidden");
  elements.modal.setAttribute("aria-hidden", "false");
  elements.modal.removeAttribute("inert");
  elements.secretInput?.focus();
}

function closeModal() {
  elements.modal.classList.add("hidden");
  elements.modal.setAttribute("aria-hidden", "true");
  elements.modal.setAttribute("inert", "");
  elements.secretInput.value = "";
  elements.issuerInput.value = "";
  elements.labelInput.value = "";
  if (elements.digitsInput) elements.digitsInput.value = "6";
  if (elements.algorithmInput) elements.algorithmInput.value = "SHA-1";
  if (elements.periodInput) elements.periodInput.value = "30";
  elements.modalError.textContent = "";
  updateModalBrandPreview();
  editingId = null;
  elements.addAccountBtn?.focus();
}

function openDeleteModal(accountId) {
  pendingDeleteId = accountId;
  elements.deleteModal.classList.remove("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "false");
  elements.deleteModal.removeAttribute("inert");
  elements.confirmDeleteBtn?.focus();
}

function closeDeleteModal() {
  elements.deleteModal.classList.add("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "true");
  elements.deleteModal.setAttribute("inert", "");
  pendingDeleteId = null;
}

function openEditAccountsModal() {
  if (!vault) return;
  elements.editAccountsModal.classList.remove("hidden");
  elements.editAccountsModal.setAttribute("aria-hidden", "false");
  elements.editAccountsModal.removeAttribute("inert");
  renderEditAccountsList();
}

function closeEditAccountsModal() {
  elements.editAccountsModal.classList.add("hidden");
  elements.editAccountsModal.setAttribute("aria-hidden", "true");
  elements.editAccountsModal.setAttribute("inert", "");
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
    const label = document.createElement("span");
    label.textContent = account.label || "(no label)";
    textWrap.append(issuer, label);

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
  elements.settingsModal.classList.remove("hidden");
  elements.settingsModal.setAttribute("aria-hidden", "false");
  elements.settingsModal.removeAttribute("inert");
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
  preferencesDraft = {
    lockTimeoutMs: getLockTimeoutMs(),
    sortMode: getSortMode(),
    theme: getTheme(),
  };
  showSettingsList();
  elements.currentPinInput?.focus();
}

function closeSettingsModal() {
  elements.settingsModal.classList.add("hidden");
  elements.settingsModal.setAttribute("aria-hidden", "true");
  elements.settingsModal.setAttribute("inert", "");
  showSettingsList();
}

function hideAllSettingsSections() {
  stopRecordingShortcut();
  [
    elements.settingsChangePin,
    elements.settingsBackup,
    elements.settingsPreferences,
    elements.settingsShortcuts,
  ].forEach((section) => {
    if (!section) return;
    section.classList.add("hidden");
    section.setAttribute("aria-hidden", "true");
  });
}

function showSettingsList() {
  hideAllSettingsSections();
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
    preferences: elements.settingsPreferences,
    shortcuts: elements.settingsShortcuts,
  };
  const section = map[key];
  if (!section) return;
  hideSettingsList();
  section.classList.remove("hidden");
  section.setAttribute("aria-hidden", "false");
  if (key === "change-pin") {
    elements.currentPinInput?.focus();
  }
  if (key === "preferences") {
    preferencesDraft = {
      lockTimeoutMs: getLockTimeoutMs(),
      sortMode: getSortMode(),
      theme: getTheme(),
    };
    elements.lockTimeoutSelect.value = String(preferencesDraft.lockTimeoutMs);
    if (elements.themeSelect) {
      elements.themeSelect.value = preferencesDraft.theme;
    }
    if (elements.sortSelect) {
      elements.sortSelect.value = preferencesDraft.sortMode;
    }
  }
  if (key === "backup") {
    populateExportBackup();
  }
  if (key === "shortcuts") {
    updateShortcutDisplay();
  }
}

let isRecordingShortcut = false;
let boundRecordHandler = null;

function stopRecordingShortcut() {
  if (!isRecordingShortcut) return;
  isRecordingShortcut = false;
  if (boundRecordHandler) {
    window.removeEventListener("keydown", boundRecordHandler, true);
    boundRecordHandler = null;
  }
  elements.shortcutDisplay?.classList.remove("recording");
  elements.shortcutRecordingPrompt?.classList.add("hidden");
  if (elements.customizeShortcutBtn) {
    elements.customizeShortcutBtn.textContent = "✏️ Change Shortcut";
  }
  updateShortcutDisplay();
}

function startRecordingShortcut() {
  if (isRecordingShortcut) {
    stopRecordingShortcut();
    return;
  }
  isRecordingShortcut = true;
  if (elements.customizeShortcutBtn) {
    elements.customizeShortcutBtn.textContent = "⏹️ Cancel";
  }
  elements.shortcutDisplay?.classList.add("recording");
  if (elements.shortcutDisplay) {
    elements.shortcutDisplay.textContent = "Press keys...";
  }
  elements.shortcutRecordingPrompt?.classList.remove("hidden");

  boundRecordHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel on Escape
    if (e.key === "Escape") {
      stopRecordingShortcut();
      showToast("Cancelled");
      return;
    }

    // If only modifier key is pressed, show feedback on badge
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      const held = [];
      if (e.ctrlKey) held.push("Ctrl");
      if (e.altKey) held.push("Alt");
      if (e.shiftKey) held.push("Shift");
      if (e.metaKey) held.push(navigator.platform.toUpperCase().includes("MAC") ? "Cmd" : "Win");
      if (elements.shortcutDisplay && held.length > 0) {
        elements.shortcutDisplay.textContent = held.join("+") + " + ...";
      }
      return;
    }

    // Must have at least one modifier (Ctrl, Alt, or Meta) to avoid hijacking normal typing
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      if (elements.shortcutDisplay) {
        elements.shortcutDisplay.textContent = "Hold Ctrl or Alt";
      }
      return;
    }

    // Determine clean key name
    let keyName = "";
    if (e.code.startsWith("Key")) {
      keyName = e.code.slice(3);
    } else if (e.code.startsWith("Digit")) {
      keyName = e.code.slice(5);
    } else if (e.code === "Space") {
      keyName = "Space";
    } else if (e.key.length === 1) {
      keyName = e.key.toUpperCase();
    } else {
      keyName = e.key;
    }

    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push(isMac ? "Cmd" : "Win");
    parts.push(keyName);

    const displayStr = parts.join("+");
    const shortcutObj = {
      key: e.key.toLowerCase(),
      code: e.code,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      display: displayStr,
    };

    chrome.storage?.local?.set({ customShortcut: shortcutObj }, () => {
      stopRecordingShortcut();
      showToast(`Shortcut set to ${displayStr}!`);
    });
  };

  window.addEventListener("keydown", boundRecordHandler, true);
}

async function resetShortcut() {
  stopRecordingShortcut();
  try {
    await chrome.storage?.local?.remove(["customShortcut"]);
  } catch {
    // ignore
  }
  await updateShortcutDisplay();
  showToast("Shortcut reset to default (Alt+Shift+A)");
}

async function updateShortcutDisplay() {
  if (!elements.shortcutDisplay) return;

  // 1. Check custom shortcut stored in chrome.storage.local
  let saved = null;
  try {
    const res = await chrome.storage?.local?.get(["customShortcut"]);
    saved = res?.customShortcut;
  } catch {
    // ignore
  }

  if (saved?.display) {
    elements.shortcutDisplay.textContent = saved.display;
    elements.shortcutDisplay.classList.remove("not-set");
    if (elements.shortcutStatusText) {
      elements.shortcutStatusText.textContent = "Custom shortcut active";
    }
    return;
  }

  // 2. Check native browser commands
  if (chrome?.commands?.getAll) {
    try {
      const commands = await chrome.commands.getAll();
      const actionCmd = commands.find((c) => c.name === "_execute_action");
      if (actionCmd?.shortcut) {
        elements.shortcutDisplay.textContent = actionCmd.shortcut;
        elements.shortcutDisplay.classList.remove("not-set");
        if (elements.shortcutStatusText) {
          elements.shortcutStatusText.textContent = "Global shortcut";
        }
        return;
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback default
  elements.shortcutDisplay.textContent = "Alt+Shift+A";
  elements.shortcutDisplay.classList.remove("not-set");
  if (elements.shortcutStatusText) {
    elements.shortcutStatusText.textContent = "Global shortcut";
  }
}

async function savePreferences() {
  if (!preferencesDraft) return;
  meta = await updateMeta({
    lockTimeoutMs: preferencesDraft.lockTimeoutMs,
    sortMode: preferencesDraft.sortMode,
    theme: preferencesDraft.theme,
  });
  if (sessionData) {
    sessionData.lastActive = Date.now();
    await setSession(sessionData);
  }
  applyTheme(preferencesDraft.theme);
  renderAccounts();
  showToast("Preferences saved");
  closeSettingsModal();
}

function cancelPreferences() {
  preferencesDraft = {
    lockTimeoutMs: getLockTimeoutMs(),
    sortMode: getSortMode(),
    theme: getTheme(),
  };
  elements.lockTimeoutSelect.value = String(preferencesDraft.lockTimeoutMs);
  if (elements.themeSelect) {
    elements.themeSelect.value = preferencesDraft.theme;
  }
  if (elements.sortSelect) {
    elements.sortSelect.value = preferencesDraft.sortMode;
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
    elements.changePinError.textContent = "PIN must be at least 6 digits.";
    return;
  }
  if (newPin !== confirmPin) {
    elements.changePinError.textContent = "New PINs do not match.";
    return;
  }

  try {
    const decrypted = await decryptVault(currentPin, vaultRecord);
    vault = decrypted;
    vaultRecord = await encryptVault(newPin, vault);
    sessionPin = newPin;
    sessionData = { pin: newPin, lastActive: Date.now() };
    await setVaultRecord(vaultRecord);
    await setSession(sessionData);
    elements.currentPinInput.value = "";
    elements.newPinInput.value = "";
    elements.confirmNewPinInput.value = "";
    showToast("PIN updated");
  } catch (error) {
    elements.changePinError.textContent = "Current PIN is incorrect.";
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

  // ── Method 2: chrome.downloads with base64 data URI ─────────────────────
  // Calling directly from the popup page (not service worker) supports data: URIs.
  if (chrome.downloads) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(payload)));
      const dataUrl = "data:application/json;base64," + base64;
      await new Promise((resolve, reject) => {
        chrome.downloads.download(
          { url: dataUrl, filename, saveAs: false, conflictAction: "uniquify" },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(downloadId);
            }
          }
        );
      });
      showToast("✓ Backup downloaded to Downloads folder");
      return;
    } catch (err) {
      console.warn("chrome.downloads failed:", err.message);
      // fall through to Method 3
    }
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
  const content = elements.importText?.value?.trim();
  if (!content) {
    showImportError("Paste a backup JSON or upload a file");
    return;
  }

  showImportError("Parsing backup data... Please wait.");

  let payload;
  try {
    // Clean potential BOM or extra whitespaces
    const cleanContent = content.replace(/^\uFEFF/, "");
    payload = JSON.parse(cleanContent);
  } catch (parseError) {
    showImportError(`Invalid JSON format: ${parseError.message}`);
    console.error("JSON parse error:", parseError);
    return;
  }

  // 1. Check if it's a decrypted accounts list
  let importedAccounts = null;
  if (Array.isArray(payload)) {
    importedAccounts = payload;
  } else if (payload && Array.isArray(payload.accounts)) {
    importedAccounts = payload.accounts;
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

    // Clean and normalize secrets
    vault.accounts = importedAccounts.map((account) => ({
      id: account.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      issuer: account.issuer || "",
      label: account.label || "",
      secret: account.secret.replace(/\s+/g, "").toUpperCase(),
      createdAt: account.createdAt || Date.now(),
    }));

    // Re-encrypt with current PIN
    try {
      vaultRecord = await encryptVault(sessionPin, vault);
      await setVaultRecord(vaultRecord);
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
      await setVaultRecord(encryptedVault);
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
  try {
    base32ToBytes(normalizedSecret);
  } catch (error) {
    elements.modalError.textContent = "Secret must be valid Base32.";
    return;
  }

  const account = {
    id: editingId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    issuer: issuerValue,
    label: labelValue,
    secret: normalizedSecret,
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

  await saveVault();
  closeModal();
  renderAccounts();
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

function renderAccounts() {
  if (!vault) return;
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = vault.accounts.filter((account) => {
    const haystack = `${account.issuer} ${account.label}`.toLowerCase();
    return haystack.includes(query);
  });
  const ordered = sortAccounts(filtered);

  elements.accountsList.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", vault.accounts.length !== 0);

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

    // Keyboard support: Enter / Space to copy
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
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
    starBtn.textContent = account.pinned ? "★" : "☆";
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
    dragHandle.innerHTML = "&#8942;&#8942;"; // ⠿ six-dot grid

    endCol.append(starBtn, ring, dragHandle);

    item.append(brandIcon, details, endCol);
    elements.accountsList.append(item);
  }

  currentCounter = null;
  updateCodes();
}

async function updateCodes() {
  if (!vault) return;
  const now = Date.now();
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
    } else {
      ring.classList.remove("expiring");
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

async function decodeImageForQR(imgSource) {
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
      console.warn("BarcodeDetector error:", e);
    }
  }
  return null;
}

function populateAndOpenAddModal(urlOrSecret) {
  if (!urlOrSecret) return;
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
  chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, async (response) => {
    if (response?.ok && response?.dataUrl) {
      const img = new Image();
      img.onload = async () => {
        const qrContent = await decodeImageForQR(img);
        if (qrContent) {
          populateAndOpenAddModal(qrContent);
        } else {
          fallbackDomScan();
        }
      };
      img.onerror = () => fallbackDomScan();
      img.src = response.dataUrl;
    } else {
      fallbackDomScan();
    }
  });

  function fallbackDomScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs?.[0];
      if (!activeTab?.id) {
        showToast("No active tab found");
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, { type: "EXTRACT_QR_DOM" }, (res) => {
        if (res?.ok && res?.url) {
          populateAndOpenAddModal(res.url);
        } else {
          showToast("No 2FA QR code found on active tab");
        }
      });
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

async function init() {
  [vaultRecord, meta, sessionData] = await Promise.all([
    getVaultRecord(),
    getMeta(),
    getSession(),
  ]);

  if (elements.lockTimeoutSelect) {
    elements.lockTimeoutSelect.value = String(getLockTimeoutMs());
  }
  if (elements.sortSelect) {
    elements.sortSelect.value = getSortMode();
  }
  applyTheme(getTheme());

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
        showLockedView({ createMode: false });
      }
    } else {
      if (expired && !meta.locked) {
        await clearStoredSession();
        await setLocked(true);
      }
      showLockedView({ createMode: false });
    }
  }

  elements.unlockBtn.addEventListener("click", handleUnlock);

  // Press Enter on any PIN field to unlock / create vault
  const onEnterUnlock = (e) => { if (e.key === "Enter") handleUnlock(); };
  elements.unlockPin.addEventListener("keydown", onEnterUnlock);
  elements.newPin.addEventListener("keydown", onEnterUnlock);
  elements.confirmPin.addEventListener("keydown", onEnterUnlock);

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
  elements.customizeShortcutBtn?.addEventListener("click", startRecordingShortcut);
  elements.shortcutDisplay?.addEventListener("click", startRecordingShortcut);
  elements.resetShortcutBtn?.addEventListener("click", resetShortcut);
  elements.chromeShortcutsLink?.addEventListener("click", () => {
    elements.chromeShortcutHelp?.classList.toggle("hidden");
    chrome.tabs?.create?.({ url: "chrome://extensions/shortcuts" });
  });
  updateShortcutDisplay();

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

  // Quick search shortcut: press '/' to focus search input
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement !== elements.searchInput &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      e.preventDefault();
      elements.searchInput?.focus();
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
