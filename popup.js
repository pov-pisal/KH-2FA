import { qrcode } from "./qrcode.js";
import { encryptVault, decryptVault } from "./crypto.js";
import {
  generateRandomPassword,
  generatePassphrase,
  generatePin,
  evaluatePasswordStrength,
} from "./passwordGenerator.js";
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
  validateGitHubToken,
  createGistVault,
  fetchGistVault,
  updateGistVault,
} from "./storage.js";
import { getBrandInfo } from "./brandIcons.js";

const defaultInactivityMs = 2 * 60 * 1000;

const elements = {
  lockedView: document.getElementById("lockedView"),
  lockTitle: document.getElementById("lockTitle"),
  lockSubtitle: document.getElementById("lockSubtitle"),
  syncDetectedBanner: document.getElementById("syncDetectedBanner"),
  syncDetectedTitle: document.getElementById("syncDetectedTitle"),
  lockSyncOptionWrap: document.getElementById("lockSyncOptionWrap"),
  lockSyncBtn: document.getElementById("lockSyncBtn"),
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
  settingsBrowserTransfer: document.getElementById("settingsBrowserTransfer"),
  lockTransferFromBrowserBtn: document.getElementById("lockTransferFromBrowserBtn"),
  transferTabSendBtn: document.getElementById("transferTabSendBtn"),
  transferTabReceiveBtn: document.getElementById("transferTabReceiveBtn"),
  transferSendView: document.getElementById("transferSendView"),
  transferReceiveView: document.getElementById("transferReceiveView"),
  transferQrContainer: document.getElementById("transferQrContainer"),
  transferCodeText: document.getElementById("transferCodeText"),
  copyTransferCodeBtn: document.getElementById("copyTransferCodeBtn"),
  downloadTransferFileBtn: document.getElementById("downloadTransferFileBtn"),
  receiveScanScreenBtn: document.getElementById("receiveScanScreenBtn"),
  receiveCodeInput: document.getElementById("receiveCodeInput"),
  pasteFromClipboardBtn: document.getElementById("pasteFromClipboardBtn"),
  applyTransferCodeBtn: document.getElementById("applyTransferCodeBtn"),
  receiveFileInput: document.getElementById("receiveFileInput"),
  vaultHealthSummaryCard: document.getElementById("vaultHealthSummaryCard"),
  vaultHealthGauge: document.getElementById("vaultHealthGauge"),
  vaultHealthScore: document.getElementById("vaultHealthScore"),
  vaultHealthBadge: document.getElementById("vaultHealthBadge"),
  vaultHealthSubtext: document.getElementById("vaultHealthSubtext"),
  openSecurityAuditBtn: document.getElementById("openSecurityAuditBtn"),
  securityAuditModal: document.getElementById("securityAuditModal"),
  closeSecurityAuditBtn: document.getElementById("closeSecurityAuditBtn"),
  settingsAuditItemBtn: document.getElementById("settingsAuditItemBtn"),
  settingsAuditScoreBadge: document.getElementById("settingsAuditScoreBadge"),
  auditHeroScore: document.getElementById("auditHeroScore"),
  auditHeroStatus: document.getElementById("auditHeroStatus"),
  auditHeroSubtext: document.getElementById("auditHeroSubtext"),
  metricNumWeak: document.getElementById("metricNumWeak"),
  metricNumReused: document.getElementById("metricNumReused"),
  metricNumBreached: document.getElementById("metricNumBreached"),
  startBreachScanBtn: document.getElementById("startBreachScanBtn"),
  openEmergencyKitBtn: document.getElementById("openEmergencyKitBtn"),
  settingsTrash: document.getElementById("settingsTrash"),
  trashList: document.getElementById("trashList"),
  trashCountBadge: document.getElementById("trashCountBadge"),
  emptyTrashBtn: document.getElementById("emptyTrashBtn"),
  accentPalettePicker: document.getElementById("accentPalettePicker"),
  auditIssuesList: document.getElementById("auditIssuesList"),
  settingsGistSync: document.getElementById("settingsGistSync"),
  gistSyncStatusBadge: document.getElementById("gistSyncStatusBadge"),
  checkGistSyncBtn: document.getElementById("checkGistSyncBtn"),
  gistSyncSetupCard: document.getElementById("gistSyncSetupCard"),
  gistSyncStatusCard: document.getElementById("gistSyncStatusCard"),
  gistTokenInput: document.getElementById("gistTokenInput"),
  gistTabNewBtn: document.getElementById("gistTabNewBtn"),
  gistTabJoinBtn: document.getElementById("gistTabJoinBtn"),
  gistModeNew: document.getElementById("gistModeNew"),
  gistModeJoin: document.getElementById("gistModeJoin"),
  gistCreateSyncBtn: document.getElementById("gistCreateSyncBtn"),
  gistIdInput: document.getElementById("gistIdInput"),
  gistConnectSyncBtn: document.getElementById("gistConnectSyncBtn"),
  gistSetupError: document.getElementById("gistSetupError"),
  gistStatusDetail: document.getElementById("gistStatusDetail"),
  gistUserLogin: document.getElementById("gistUserLogin"),
  gistIdDisplay: document.getElementById("gistIdDisplay"),
  copyGistIdBtn: document.getElementById("copyGistIdBtn"),
  gistLastSyncedTime: document.getElementById("gistLastSyncedTime"),
  gistSyncNowBtn: document.getElementById("gistSyncNowBtn"),
  gistDisconnectBtn: document.getElementById("gistDisconnectBtn"),
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

  // Vault Segmented Navigation
  nav2faBtn: document.getElementById("nav2faBtn"),
  navPasswordsBtn: document.getElementById("navPasswordsBtn"),
  navGeneratorBtn: document.getElementById("navGeneratorBtn"),
  nav2faCount: document.getElementById("nav2faCount"),
  navPasswordsCount: document.getElementById("navPasswordsCount"),
  tabContent2fa: document.getElementById("tabContent2fa"),
  tabContentPasswords: document.getElementById("tabContentPasswords"),
  tabContentGenerator: document.getElementById("tabContentGenerator"),

  // Passwords Tab
  passwordSearchInput: document.getElementById("passwordSearchInput"),
  quickGeneratorBtn: document.getElementById("quickGeneratorBtn"),
  addPasswordBtn: document.getElementById("addPasswordBtn"),
  passwordCategoryFilterBar: document.getElementById("passwordCategoryFilterBar"),
  passwordMatchedSiteBanner: document.getElementById("passwordMatchedSiteBanner"),
  emptyPasswordsState: document.getElementById("emptyPasswordsState"),
  emptyAddPasswordBtn: document.getElementById("emptyAddPasswordBtn"),
  noPasswordResultsState: document.getElementById("noPasswordResultsState"),
  passwordsList: document.getElementById("passwordsList"),

  // Generator Tab
  generatedPasswordDisplay: document.getElementById("generatedPasswordDisplay"),
  copyGeneratedPasswordBtn: document.getElementById("copyGeneratedPasswordBtn"),
  refreshGeneratedPasswordBtn: document.getElementById("refreshGeneratedPasswordBtn"),
  saveGeneratedToVaultBtn: document.getElementById("saveGeneratedToVaultBtn"),
  generatorStrengthBadge: document.getElementById("generatorStrengthBadge"),
  generatorStrengthFill: document.getElementById("generatorStrengthFill"),
  generatorStrengthLabel: document.getElementById("generatorStrengthLabel"),
  generatorCrackTime: document.getElementById("generatorCrackTime"),
  generatorPasswordControls: document.getElementById("generatorPasswordControls"),
  generatorLengthSlider: document.getElementById("generatorLengthSlider"),
  generatorLengthVal: document.getElementById("generatorLengthVal"),
  genOptUpper: document.getElementById("genOptUpper"),
  genOptLower: document.getElementById("genOptLower"),
  genOptNumbers: document.getElementById("genOptNumbers"),
  genOptSymbols: document.getElementById("genOptSymbols"),
  genOptAvoidAmbiguous: document.getElementById("genOptAvoidAmbiguous"),
  generatorPassphraseControls: document.getElementById("generatorPassphraseControls"),
  generatorWordsSlider: document.getElementById("generatorWordsSlider"),
  generatorWordsVal: document.getElementById("generatorWordsVal"),
  generatorSeparatorDropdown: document.getElementById("generatorSeparatorDropdown"),
  generatorSeparatorTrigger: document.getElementById("generatorSeparatorTrigger"),
  generatorSeparatorBadge: document.getElementById("generatorSeparatorBadge"),
  generatorSeparatorText: document.getElementById("generatorSeparatorText"),
  generatorSeparatorMenu: document.getElementById("generatorSeparatorMenu"),
  generatorSeparatorSelect: document.getElementById("generatorSeparatorSelect"),
  genOptCapitalize: document.getElementById("genOptCapitalize"),
  genOptIncludeNumber: document.getElementById("genOptIncludeNumber"),
  generatorPinControls: document.getElementById("generatorPinControls"),
  generatorPinSlider: document.getElementById("generatorPinSlider"),
  generatorPinDigitsVal: document.getElementById("generatorPinDigitsVal"),

  // Password Add/Edit Modal
  passwordModal: document.getElementById("passwordModal"),
  passwordModalTitle: document.getElementById("passwordModalTitle"),
  closePasswordModalBtn: document.getElementById("closePasswordModalBtn"),
  passwordBrandPreview: document.getElementById("passwordBrandPreview"),
  passwordBrandIcon: document.getElementById("passwordBrandIcon"),
  passwordBrandName: document.getElementById("passwordBrandName"),
  passwordTitleInput: document.getElementById("passwordTitleInput"),
  passwordUsernameInput: document.getElementById("passwordUsernameInput"),
  passwordValueInput: document.getElementById("passwordValueInput"),
  passwordModalEyeBtn: document.getElementById("passwordModalEyeBtn"),
  passwordModalQuickGenBtn: document.getElementById("passwordModalQuickGenBtn"),
  passwordStrengthBadgeModal: document.getElementById("passwordStrengthBadgeModal"),
  passwordFieldStrengthFill: document.getElementById("passwordFieldStrengthFill"),
  passwordUrlInput: document.getElementById("passwordUrlInput"),
  passwordCategoryDropdown: document.getElementById("passwordCategoryDropdown"),
  passwordCategoryTrigger: document.getElementById("passwordCategoryTrigger"),
  passwordCategoryTriggerDot: document.getElementById("passwordCategoryTriggerDot"),
  passwordCategoryTriggerText: document.getElementById("passwordCategoryTriggerText"),
  passwordCategoryDropdownMenu: document.getElementById("passwordCategoryDropdownMenu"),
  passwordCategoryOptionsList: document.getElementById("passwordCategoryOptionsList"),
  passwordCategoryHiddenInput: document.getElementById("passwordCategoryHiddenInput"),
  passwordNotesInput: document.getElementById("passwordNotesInput"),
  savePasswordBtn: document.getElementById("savePasswordBtn"),
  cancelPasswordBtn: document.getElementById("cancelPasswordBtn"),
  passwordModalError: document.getElementById("passwordModalError"),
};

// ── Modal helpers ────────────────────────────────────────────────────────────
function showModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.removeAttribute("inert");
  modal.removeAttribute("aria-hidden");
}

function hideModal(modal) {
  if (!modal) return;
  if (document.activeElement && document.activeElement !== document.body) {
    try { document.activeElement.blur(); } catch (_) {}
  }
  modal.classList.add("hidden");
  modal.setAttribute("inert", "");
  modal.removeAttribute("aria-hidden");
}

let vaultRecord = null;
let vault = null;
let meta = null;
let sessionPin = null;
let sessionData = null;
let currentCounter = null;
let activeCategory = "all";
let categoryManuallyTouched = false;
let activeVaultTab = "2fa";
let activePasswordCategory = "all";
let editingPasswordId = null;
let currentGeneratedPassword = "";
let generatorMode = "password";
let currentTabDomain = "";
const revealedPasswords = new Set();

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
  const issuer = account.issuer || brand.name || account.label || "Account";
  const secret = (account.secret || "").replace(/\s+/g, "").toUpperCase();

  elements.qrModalTitle.textContent = `${issuer} QR Code`;
  elements.qrModalIssuer.textContent = issuer;
  elements.qrModalLabel.textContent = "";
  elements.qrModalLabel.classList.add("hidden");
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
  if (elements.mainView.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  elements.lockedView.classList.remove("hidden");
  elements.lockedView.removeAttribute("inert");
  elements.mainView.classList.add("hidden");
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
    elements.lockSyncOptionWrap?.classList.add("hidden");
    elements.unlockBtn.textContent = "Create";
  } else {
    elements.lockTitle.textContent = syncDetected ? "Synced Vault Found" : "Unlock vault";
    elements.lockSubtitle.textContent = syncDetected
      ? "Enter your existing PIN to restore all your 2FA accounts."
      : "Enter your PIN to unlock.";
    elements.createPinFields.classList.add("hidden");
    elements.unlockPinField.classList.remove("hidden");
    elements.lockSyncOptionWrap?.classList.remove("hidden");
    elements.unlockBtn.textContent = "Unlock";
  }

  const focusTarget = createMode ? elements.newPin : elements.unlockPin;
  focusTarget?.focus();
}

function showMainView() {
  if (elements.lockedView.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  elements.syncDetectedBanner?.classList.add("hidden");
  elements.lockedView.classList.add("hidden");
  elements.lockedView.setAttribute("inert", "");
  elements.mainView.classList.remove("hidden");
  elements.mainView.removeAttribute("inert");

  if (elements.peekToggleBtn) {
    elements.peekToggleBtn.classList.toggle("active", privacyMaskActive);
    elements.peekToggleBtn.title = privacyMaskActive
      ? "Disable Privacy Mask (Show codes)"
      : "Enable Privacy Mask (Blur codes until hover)";
  }

  if (vault) {
    if (!vault.accounts) vault.accounts = [];
    if (!vault.passwords) vault.passwords = [];
  }

  detectCurrentTabDomain().then(() => {
    updateAccountCount();
    switchVaultTab(activeVaultTab);
  });
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

function applyAccentColor(accent = "cyan") {
  const accents = {
    cyan: "#38bdf8",
    emerald: "#10b981",
    purple: "#a855f7",
    rose: "#f43f5e",
    amber: "#f59e0b",
  };
  const color = accents[accent] || accents.cyan;
  document.documentElement.style.setProperty("--primary", color);
  document.documentElement.dataset.accent = accent;
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
  if (meta?.gistSyncEnabled && meta?.gistToken && meta?.gistId) {
    try {
      await updateGistVault(meta.gistToken, meta.gistId, record);
      meta = await updateMeta({ gistLastSyncedAt: record.updatedAt || Date.now() });
      refreshGistSyncUI();
    } catch (err) {
      console.warn("Failed to sync vault to GitHub Gist:", err);
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

    vault = { accounts: [], passwords: [], createdAt: Date.now() };
    sessionPin = pin;
    vaultRecord = await encryptVault(pin, vault);
    meta = await updateMeta({ syncEnabled: true, locked: false });
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
window.setCategoryFilter = setCategoryFilter;

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


// ── Password Manager & Password Generator Core Logic ─────────────────────────

async function detectCurrentTabDomain() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];
    if (tab?.url && !isRestrictedUrl(tab.url)) {
      const u = new URL(tab.url);
      currentTabDomain = u.hostname.replace(/^www\./, "").toLowerCase();
    }
  } catch (err) {
    console.debug("Could not get active tab domain:", err);
  }
}

function switchVaultTab(tabName) {
  activeVaultTab = tabName;

  // Update nav buttons
  elements.nav2faBtn?.classList.toggle("active", tabName === "2fa");
  elements.navPasswordsBtn?.classList.toggle("active", tabName === "passwords");
  elements.navGeneratorBtn?.classList.toggle("active", tabName === "generator");

  // Update tab content visibility
  elements.tabContent2fa?.classList.toggle("hidden", tabName !== "2fa");
  elements.tabContentPasswords?.classList.toggle("hidden", tabName !== "passwords");
  elements.tabContentGenerator?.classList.toggle("hidden", tabName !== "generator");

  updateAccountCount();

  if (tabName === "2fa") {
    renderAccounts();
    elements.searchInput?.focus();
  } else if (tabName === "passwords") {
    renderPasswords();
    elements.passwordSearchInput?.focus();
  } else if (tabName === "generator") {
    updateGeneratedPassword();
  }
}

// ── Generator Tab Logic ──────────────────────────────────────────────────────

function updateGeneratedPassword() {
  let pwd = "";
  if (generatorMode === "password") {
    const len = Number(elements.generatorLengthSlider?.value || 16);
    pwd = generateRandomPassword({
      length: len,
      uppercase: elements.genOptUpper?.checked ?? true,
      lowercase: elements.genOptLower?.checked ?? true,
      numbers: elements.genOptNumbers?.checked ?? true,
      symbols: elements.genOptSymbols?.checked ?? true,
      avoidAmbiguous: elements.genOptAvoidAmbiguous?.checked ?? false,
    });
    if (elements.generatorLengthVal) elements.generatorLengthVal.textContent = String(len);
  } else if (generatorMode === "passphrase") {
    const words = Number(elements.generatorWordsSlider?.value || 4);
    const sep = elements.generatorSeparatorSelect?.value || "-";
    pwd = generatePassphrase({
      words,
      separator: sep,
      capitalize: elements.genOptCapitalize?.checked ?? true,
      includeNumber: elements.genOptIncludeNumber?.checked ?? true,
    });
    if (elements.generatorWordsVal) elements.generatorWordsVal.textContent = String(words);
  } else if (generatorMode === "pin") {
    const digits = Number(elements.generatorPinSlider?.value || 6);
    pwd = generatePin(digits);
    if (elements.generatorPinDigitsVal) elements.generatorPinDigitsVal.textContent = String(digits);
  }

  currentGeneratedPassword = pwd;
  if (elements.generatedPasswordDisplay) {
    elements.generatedPasswordDisplay.textContent = pwd;
    if ("value" in elements.generatedPasswordDisplay) {
      elements.generatedPasswordDisplay.value = pwd;
    }
  }

  // Live strength analysis
  const strength = evaluatePasswordStrength(pwd);
  if (elements.generatorStrengthBadge) {
    elements.generatorStrengthBadge.textContent = strength.label;
    elements.generatorStrengthBadge.style.color = strength.color;
  }
  if (elements.generatorStrengthFill) {
    elements.generatorStrengthFill.style.width = `${strength.percent}%`;
    elements.generatorStrengthFill.style.backgroundColor = strength.color;
  }
  if (elements.generatorStrengthLabel) {
    elements.generatorStrengthLabel.textContent = strength.label;
    elements.generatorStrengthLabel.style.color = strength.color;
  }
  if (elements.generatorCrackTime) {
    elements.generatorCrackTime.textContent = strength.crackTime;
  }
}

function setGeneratorMode(mode) {
  generatorMode = mode;
  document.querySelectorAll(".gen-mode-tab").forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  elements.generatorPasswordControls?.classList.toggle("hidden", mode !== "password");
  elements.generatorPassphraseControls?.classList.toggle("hidden", mode !== "passphrase");
  elements.generatorPinControls?.classList.toggle("hidden", mode !== "pin");

  updateGeneratedPassword();
}

function setPassphraseSeparator(val) {
  const cleanVal = val === "-" ? "hyphen" : val === "." ? "dot" : val === "_" ? "underscore" : val === " " ? "space" : val;
  if (elements.generatorSeparatorSelect) {
    elements.generatorSeparatorSelect.value = cleanVal;
  }

  // Update quick chips
  document.querySelectorAll(".sep-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.sep === cleanVal);
  });

  updateGeneratedPassword();
}

function closeSeparatorDropdown() {
  elements.generatorSeparatorMenu?.classList.add("hidden");
  elements.generatorSeparatorTrigger?.setAttribute("aria-expanded", "false");
}

// ── Passwords Tab Logic ──────────────────────────────────────────────────────

function setPasswordCategoryFilter(cat) {
  activePasswordCategory = cat || "all";
  renderPasswords();
  const activePill = elements.passwordCategoryFilterBar?.querySelector(
    `.category-pill[data-category="${activePasswordCategory}"]`
  );
  if (activePill) {
    activePill.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }
}

function renderPasswordCategoryFilterBar() {
  if (!elements.passwordCategoryFilterBar || !vault) return;
  elements.passwordCategoryFilterBar.innerHTML = "";

  const allPasswords = vault.passwords || [];
  const counts = { all: allPasswords.length, pinned: 0 };
  const customCats = new Set();

  for (const pw of allPasswords) {
    if (pw.pinned) counts.pinned += 1;
    const c = (pw.category || "").trim();
    if (c) {
      customCats.add(c);
      counts[c.toLowerCase()] = (counts[c.toLowerCase()] || 0) + 1;
    }
  }

  const pills = [
    { id: "all", name: "All", count: counts.all, dotCls: "dot-all" },
    { id: "pinned", name: "Starred", count: counts.pinned, dotCls: "dot-pinned" },
  ];

  for (const std of STANDARD_CATEGORIES) {
    if (!std.id) continue;
    const cnt = counts[std.id.toLowerCase()] || 0;
    if (cnt > 0) {
      pills.push({ id: std.id, name: std.name, count: cnt, dotCls: std.dotCls });
      customCats.delete(std.id);
    }
  }

  for (const cust of customCats) {
    const cnt = counts[cust.toLowerCase()] || 0;
    pills.push({ id: cust, name: cust, count: cnt, dotInfo: getCategoryDotStyle(cust) });
  }

  for (const p of pills) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `category-pill ${p.id.toLowerCase() === activePasswordCategory.toLowerCase() ? "active" : ""}`;
    pill.dataset.category = p.id;

    const dot = document.createElement("span");
    dot.className = `pill-dot ${p.dotCls || ""}`;
    if (p.dotInfo?.style) dot.style.cssText = p.dotInfo.style;

    const label = document.createElement("span");
    label.className = "pill-label";
    label.textContent = p.name;

    const countBadge = document.createElement("span");
    countBadge.className = "pill-count";
    countBadge.textContent = String(p.count);

    pill.append(dot, label, countBadge);
    pill.addEventListener("click", () => setPasswordCategoryFilter(p.id));
    elements.passwordCategoryFilterBar.appendChild(pill);
  }
}


// ── Vault Health & Security Audit Logic ──────────────────────────────────────
const breachedPasswordsCache = new Map(); // hash -> breachCount

async function sha1Hex(str) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function checkPwnedPassword(password) {
  if (!password) return 0;
  try {
    const hash = await sha1Hex(password);
    if (breachedPasswordsCache.has(hash)) {
      return breachedPasswordsCache.get(hash);
    }
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return 0;
    const text = await res.text();
    for (const line of text.split("\n")) {
      const [h, count] = line.trim().split(":");
      if (h === suffix) {
        const found = parseInt(count, 10) || 1;
        breachedPasswordsCache.set(hash, found);
        return found;
      }
    }
    breachedPasswordsCache.set(hash, 0);
    return 0;
  } catch (_) {
    return 0;
  }
}

function evaluatePasswordWeakness(password) {
  if (!password || password.length < 8) return "Too short (< 8 chars)";
  if (password.length < 10) return "Short (< 10 chars)";
  let varieties = 0;
  if (/[a-z]/.test(password)) varieties++;
  if (/[A-Z]/.test(password)) varieties++;
  if (/\d/.test(password)) varieties++;
  if (/[^a-zA-Z0-9]/.test(password)) varieties++;
  if (varieties < 3) return "Lacks variety (needs uppercase, numbers or symbols)";
  return null;
}

function getVaultHealthStats() {
  const passwords = vault?.passwords || [];
  if (passwords.length === 0) {
    return { score: 100, weakCount: 0, reusedCount: 0, breachedCount: 0, issues: [] };
  }

  const passMap = new Map();
  for (const pw of passwords) {
    if (!pw.password) continue;
    passMap.set(pw.password, (passMap.get(pw.password) || 0) + 1);
  }

  let weakCount = 0;
  let reusedCount = 0;
  let breachedCount = 0;
  const issues = [];

  for (const pw of passwords) {
    const reasonList = [];
    const weakness = evaluatePasswordWeakness(pw.password);
    if (weakness) {
      weakCount++;
      reasonList.push(weakness);
    }

    if (pw.password && (passMap.get(pw.password) || 0) > 1) {
      reusedCount++;
      reasonList.push(`Reused across ${passMap.get(pw.password)} accounts`);
    }

    const cachedHash = pw.password ? breachedPasswordsCache.get(pw._sha1 || "") : 0;
    if (cachedHash > 0) {
      breachedCount++;
      reasonList.push(`Found in ${cachedHash.toLocaleString()} data breaches!`);
    }

    if (reasonList.length > 0) {
      issues.push({ pw, reasons: reasonList, isBreached: cachedHash > 0 });
    }
  }

  // Deduplicate reused count for score calculation (e.g. 2 instances = 1 reuse fault)
  let uniqueReused = 0;
  passMap.forEach((count) => {
    if (count > 1) uniqueReused += count - 1;
  });

  let penalty = (weakCount * 12) + (uniqueReused * 12) + (breachedCount * 25);
  let score = Math.max(10, Math.min(100, 100 - penalty));

  return { score, weakCount, reusedCount: uniqueReused, breachedCount, issues };
}

function updateVaultHealthSummary() {
  const passwords = vault?.passwords || [];
  const card = elements.vaultHealthSummaryCard;
  if (!card) return;

  if (passwords.length === 0) {
    card.classList.add("hidden");
    if (elements.settingsAuditScoreBadge) elements.settingsAuditScoreBadge.textContent = "N/A";
    return;
  }

  card.classList.remove("hidden");
  const stats = getVaultHealthStats();

  if (elements.vaultHealthScore) {
    elements.vaultHealthScore.textContent = `${stats.score}%`;
  }
  if (elements.settingsAuditScoreBadge) {
    elements.settingsAuditScoreBadge.textContent = `${stats.score}%`;
  }

  const deg = (stats.score / 100) * 360;
  elements.vaultHealthGauge?.style.setProperty("--health-deg", `${deg}deg`);

  const badge = elements.vaultHealthBadge;
  if (badge) {
    badge.className = "health-badge";
    if (stats.score >= 85) {
      badge.classList.add("good");
      badge.textContent = "Strong";
    } else if (stats.score >= 60) {
      badge.classList.add("warning");
      badge.textContent = "Fair";
    } else {
      badge.classList.add("danger");
      badge.textContent = "At Risk";
    }
  }

  if (elements.vaultHealthSubtext) {
    if (stats.issues.length === 0) {
      elements.vaultHealthSubtext.textContent = "All passwords look strong & unique";
    } else {
      const parts = [];
      if (stats.weakCount > 0) parts.push(`${stats.weakCount} weak`);
      if (stats.reusedCount > 0) parts.push(`${stats.reusedCount} reused`);
      if (stats.breachedCount > 0) parts.push(`${stats.breachedCount} breached`);
      elements.vaultHealthSubtext.textContent = `${parts.join(", ")} — click Audit`;
    }
  }
}

function updateAuditModalUI() {
  const stats = getVaultHealthStats();

  if (elements.auditHeroScore) {
    elements.auditHeroScore.textContent = `${stats.score}%`;
    elements.auditHeroScore.className = "audit-hero-score";
    if (stats.score >= 85) {
      elements.auditHeroScore.classList.add("good");
    } else if (stats.score >= 60) {
      elements.auditHeroScore.classList.add("warning");
    } else {
      elements.auditHeroScore.classList.add("danger");
    }
  }

  if (elements.auditHeroStatus) {
    elements.auditHeroStatus.textContent = stats.score >= 85 ? "Excellent Protection" : stats.score >= 60 ? "Moderate Protection" : "Action Required";
  }
  if (elements.auditHeroSubtext) {
    elements.auditHeroSubtext.textContent = stats.issues.length === 0
      ? "Zero known vulnerabilities or reused credentials in your vault."
      : `Found ${stats.issues.length} potential security concerns that should be reviewed.`;
  }

  if (elements.metricNumWeak) {
    elements.metricNumWeak.textContent = String(stats.weakCount);
    elements.metricNumWeak.classList.toggle("flagged", stats.weakCount > 0);
  }
  if (elements.metricNumReused) {
    elements.metricNumReused.textContent = String(stats.reusedCount);
    elements.metricNumReused.classList.toggle("flagged", stats.reusedCount > 0);
  }
  if (elements.metricNumBreached) {
    elements.metricNumBreached.textContent = String(stats.breachedCount);
    elements.metricNumBreached.classList.toggle("flagged", stats.breachedCount > 0);
  }

  if (elements.auditIssuesList) {
    elements.auditIssuesList.innerHTML = "";
    if (stats.issues.length === 0) {
      elements.auditIssuesList.innerHTML = `<div class="audit-all-good">✓ All passwords passed security checks!</div>`;
    } else {
      for (const item of stats.issues) {
        const row = document.createElement("div");
        row.className = `audit-issue-item ${item.isBreached ? "breached" : ""}`;
        row.innerHTML = `
          <div class="audit-issue-info">
            <span class="audit-issue-title">${item.pw.title || item.pw.username || "Untitled"}</span>
            <span class="audit-issue-desc ${item.isBreached ? "" : "warning"}">${item.reasons.join(" • ")}</span>
          </div>
          <button type="button" class="audit-fix-btn" data-id="${item.pw.id}">Fix</button>
        `;
        row.querySelector(".audit-fix-btn")?.addEventListener("click", () => {
          hideModal(elements.securityAuditModal);
          openPasswordModal(item.pw.id);
        });
        elements.auditIssuesList.appendChild(row);
      }
    }
  }
}

async function handleStartBreachScan() {
  const btn = elements.startBreachScanBtn;
  if (!btn || !vault?.passwords || vault.passwords.length === 0) return;

  btn.disabled = true;
  const label = btn.querySelector("span");
  if (label) label.textContent = "Scanning breach databases...";

  try {
    for (let i = 0; i < vault.passwords.length; i++) {
      const pw = vault.passwords[i];
      if (!pw.password) continue;
      const hash = await sha1Hex(pw.password);
      pw._sha1 = hash;
      const count = await checkPwnedPassword(pw.password);
      breachedPasswordsCache.set(hash, count);
      if (label) label.textContent = `Scanning (${i + 1}/${vault.passwords.length})...`;
    }
    showToast("✓ Breach scan complete!");
    updateVaultHealthSummary();
    updateAuditModalUI();
  } catch (err) {
    showToast("Scan failed. Check internet connection.");
  } finally {
    btn.disabled = false;
    if (label) label.textContent = "Scan 800M+ Data Breaches";
  }
}

function renderPasswords() {
  if (!vault) return;
  if (!vault.passwords) vault.passwords = [];

  renderPasswordCategoryFilterBar();
  const query = (elements.passwordSearchInput?.value || "").trim().toLowerCase();

  // Filter passwords
  const filtered = vault.passwords.filter((pw) => {
    const text = `${pw.title || ""} ${pw.username || ""} ${pw.url || ""} ${pw.category || ""} ${pw.notes || ""}`.toLowerCase();
    if (query && !text.includes(query)) return false;

    if (activePasswordCategory === "all") return true;
    if (activePasswordCategory === "pinned") return Boolean(pw.pinned);
    return (pw.category || "").toLowerCase() === activePasswordCategory.toLowerCase();
  });

  // Sort passwords: pinned first, then domain-matched, then title alphabetical
  const sorted = [...filtered].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    const aMatch = currentTabDomain && (a.url?.toLowerCase().includes(currentTabDomain) || a.title?.toLowerCase().includes(currentTabDomain));
    const bMatch = currentTabDomain && (b.url?.toLowerCase().includes(currentTabDomain) || b.title?.toLowerCase().includes(currentTabDomain));
    if (aMatch !== bMatch) {
      return aMatch ? -1 : 1;
    }
    return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
  });

  // Check matched site banner
  if (elements.passwordMatchedSiteBanner) {
    if (currentTabDomain) {
      const matchCount = (vault.passwords || []).filter(
        (p) => p.url?.toLowerCase().includes(currentTabDomain) || p.title?.toLowerCase().includes(currentTabDomain)
      ).length;

      if (matchCount > 0 && !query) {
        elements.passwordMatchedSiteBanner.innerHTML = `
          <div class="matched-site-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="matched-icon">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Suggested for <strong>${currentTabDomain}</strong> (${matchCount})</span>
          </div>
          <button type="button" class="matched-site-btn" id="filterMatchedSiteBtn">Filter</button>
        `;
        elements.passwordMatchedSiteBanner.classList.remove("hidden");
        document.getElementById("filterMatchedSiteBtn")?.addEventListener("click", () => {
          if (elements.passwordSearchInput) {
            elements.passwordSearchInput.value = currentTabDomain;
            renderPasswords();
          }
        });
      } else {
        elements.passwordMatchedSiteBanner.classList.add("hidden");
      }
    } else {
      elements.passwordMatchedSiteBanner.classList.add("hidden");
    }
  }

  // Update empty / no results states
  const totalPasswords = vault.passwords.length;
  elements.emptyPasswordsState?.classList.toggle("hidden", totalPasswords !== 0);
  elements.noPasswordResultsState?.classList.toggle("hidden", !(totalPasswords > 0 && sorted.length === 0));

  if (!elements.passwordsList) return;
  elements.passwordsList.innerHTML = "";

  if (sorted.length === 0) return;

  for (const pw of sorted) {
    const card = renderPasswordCard(pw);
    elements.passwordsList.appendChild(card);
  }
  updateVaultHealthSummary();
}

function renderPasswordCard(pw) {
  const brand = getBrandInfo(pw.title, pw.url);
  const isRevealed = revealedPasswords.has(pw.id);

  const card = document.createElement("div");
  card.className = "password-item";
  card.dataset.id = pw.id;

  // Header row
  const header = document.createElement("div");
  header.className = "pw-card-header";

  const brandIcon = document.createElement("div");
  brandIcon.className = "pw-brand-icon";
  brandIcon.style.background = brand.bgColor;
  brandIcon.style.borderColor = brand.borderColor;
  brandIcon.innerHTML = brand.svg;

  const headerInfo = document.createElement("div");
  headerInfo.className = "pw-header-info";

  const titleWrap = document.createElement("div");
  titleWrap.className = "pw-title-wrap";

  const title = document.createElement("strong");
  title.className = "pw-title";
  title.textContent = pw.title || brand.name || "Untitled";

  titleWrap.appendChild(title);

  if (pw.category) {
    const catBadge = document.createElement("span");
    catBadge.className = "pw-category-tag";
    catBadge.textContent = pw.category;
    applyCategoryColor(catBadge, pw.category);
    titleWrap.appendChild(catBadge);
  }

  headerInfo.appendChild(titleWrap);

  const starBtn = document.createElement("button");
  starBtn.type = "button";
  starBtn.className = `star-btn ${pw.pinned ? "active" : ""}`;
  starBtn.title = pw.pinned ? "Unstar password" : "Star password (pin to top)";
  starBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${pw.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  starBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    pw.pinned = !pw.pinned;
    await saveVault();
    renderPasswords();
  });

  header.append(brandIcon, headerInfo, starBtn);

  // Body: Username & Password fields
  const body = document.createElement("div");
  body.className = "pw-card-body";

  // Username row (if exists)
  if (pw.username) {
    const userRow = document.createElement("div");
    userRow.className = "pw-field-row";

    const userText = document.createElement("span");
    userText.className = "pw-field-text pw-username";
    userText.textContent = pw.username;
    userText.title = pw.username;

    const copyUserBtn = document.createElement("button");
    copyUserBtn.type = "button";
    copyUserBtn.className = "pw-field-copy-btn";
    copyUserBtn.title = "Copy username";
    copyUserBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyUserBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(pw.username);
      scheduleClipboardClear(pw.username, Number(meta?.clipboardClearSec ?? 30));
      showToast("✓ Copied username");
    });

    userRow.append(userText, copyUserBtn);
    body.appendChild(userRow);
  }

  // Password row
  const passRow = document.createElement("div");
  passRow.className = "pw-field-row";

  const passVal = document.createElement("span");
  passVal.className = `pw-field-text pw-password ${isRevealed ? "revealed" : "masked"}`;
  passVal.textContent = isRevealed ? pw.password : "••••••••••••";

  const passActions = document.createElement("div");
  passActions.className = "pw-field-actions";

  const revealBtn = document.createElement("button");
  revealBtn.type = "button";
  revealBtn.className = "pw-field-reveal-btn";
  revealBtn.title = isRevealed ? "Hide password" : "Show password";
  revealBtn.innerHTML = isRevealed
    ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
    : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  revealBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (revealedPasswords.has(pw.id)) {
      revealedPasswords.delete(pw.id);
    } else {
      revealedPasswords.add(pw.id);
    }
    renderPasswords();
  });

  const copyPassBtn = document.createElement("button");
  copyPassBtn.type = "button";
  copyPassBtn.className = "pw-field-copy-btn";
  copyPassBtn.title = "Copy password";
  copyPassBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  copyPassBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(pw.password);
    scheduleClipboardClear(pw.password, Number(meta?.clipboardClearSec ?? 30));
    card.classList.add("copied");
    setTimeout(() => card.classList.remove("copied"), 850);
    showToast("✓ Copied password");
  });

  passActions.append(revealBtn, copyPassBtn);
  passRow.append(passVal, passActions);
  body.appendChild(passRow);

  // Notes preview (if notes exist)
  if (pw.notes && pw.notes.trim()) {
    const notesBox = document.createElement("div");
    notesBox.className = "pw-notes-preview";

    const notesHeader = document.createElement("div");
    notesHeader.className = "pw-notes-header";

    const notesTag = document.createElement("span");
    notesTag.className = "pw-notes-tag";
    notesTag.innerHTML = `
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      <span>Note</span>
    `;

    const copyNoteBtn = document.createElement("button");
    copyNoteBtn.type = "button";
    copyNoteBtn.className = "pw-notes-copy-btn";
    copyNoteBtn.title = "Copy note to clipboard";
    copyNoteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;
    copyNoteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(pw.notes);
      scheduleClipboardClear(pw.notes, Number(meta?.clipboardClearSec ?? 30));
      showToast("✓ Copied note");
    });

    notesHeader.append(notesTag, copyNoteBtn);

    const notesBody = document.createElement("div");
    notesBody.className = "pw-notes-body";
    notesBody.textContent = pw.notes;

    notesBox.append(notesHeader, notesBody);
    body.appendChild(notesBox);
  }

  // Footer: launch URL, Autofill button, Edit button
  const footer = document.createElement("div");
  footer.className = "pw-card-footer";

  const leftActions = document.createElement("div");
  leftActions.className = "pw-footer-left";

  if (pw.url) {
    const launchBtn = document.createElement("a");
    launchBtn.href = pw.url.startsWith("http") ? pw.url : `https://${pw.url}`;
    launchBtn.target = "_blank";
    launchBtn.rel = "noopener noreferrer";
    launchBtn.className = "pw-action-chip";
    launchBtn.title = `Open ${pw.url}`;
    launchBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
      <span>Open</span>
    `;
    leftActions.appendChild(launchBtn);
  }

  const autofillBtn = document.createElement("button");
  autofillBtn.type = "button";
  autofillBtn.className = "pw-action-chip pw-autofill-btn";
  autofillBtn.title = "Autofill credentials on active page";
  autofillBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
    <span>Autofill</span>
  `;
  autofillBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showToast("No active browser tab found");
        return;
      }
      chrome.tabs.sendMessage(
        tab.id,
        { type: "AUTOFILL_PASSWORD", username: pw.username, password: pw.password },
        (res) => {
          if (chrome.runtime.lastError) {
            showToast("Autofill unavailable on this page");
            return;
          }
          if (res?.ok) {
            showToast("✓ Autofilled credentials");
          } else {
            showToast(res?.error || "Autofill failed");
          }
        }
      );
    } catch (err) {
      showToast("Autofill failed");
    }
  });
  leftActions.appendChild(autofillBtn);

  const rightActions = document.createElement("div");
  rightActions.className = "pw-footer-right";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "pw-action-chip";
  editBtn.title = "Edit password";
  editBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
    <span>Edit</span>
  `;
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openPasswordModal(pw);
  });
  rightActions.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "pw-action-chip danger";
  deleteBtn.title = "Delete password";
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deletePassword(pw.id);
  });
  rightActions.appendChild(deleteBtn);

  footer.append(leftActions, rightActions);

  card.append(header, body, footer);
  return card;
}

// ── Password Add/Edit Modal Logic ────────────────────────────────────────────

function updatePasswordModalBrandPreview() {
  const title = elements.passwordTitleInput?.value?.trim() || "";
  const url = elements.passwordUrlInput?.value?.trim() || "";
  const brand = getBrandInfo(title, url);

  if (elements.passwordBrandIcon) {
    elements.passwordBrandIcon.style.background = brand.bgColor;
    elements.passwordBrandIcon.style.borderColor = brand.borderColor;
    elements.passwordBrandIcon.innerHTML = brand.svg;
  }
  if (elements.passwordBrandName) {
    elements.passwordBrandName.textContent = brand.name || title || "Custom Service";
  }
}

function updateModalStrengthMeter() {
  const val = elements.passwordValueInput?.value || "";
  const strength = evaluatePasswordStrength(val);
  if (elements.passwordStrengthBadgeModal) {
    elements.passwordStrengthBadgeModal.textContent = strength.label;
    elements.passwordStrengthBadgeModal.style.color = strength.color;
  }
  if (elements.passwordFieldStrengthFill) {
    elements.passwordFieldStrengthFill.style.width = `${strength.percent}%`;
    elements.passwordFieldStrengthFill.style.backgroundColor = strength.color;
  }
}

function renderPasswordModalCategoryOptions(selectedVal = "Personal") {
  if (!elements.passwordCategoryOptionsList) return;
  elements.passwordCategoryOptionsList.innerHTML = "";

  const optionsMap = new Map();
  for (const item of STANDARD_CATEGORIES) {
    if (item.id) optionsMap.set(item.id.toLowerCase(), { id: item.id, name: item.name });
  }

  if (vault?.passwords) {
    for (const p of vault.passwords) {
      const c = (p.category || "").trim();
      if (c && !optionsMap.has(c.toLowerCase())) {
        optionsMap.set(c.toLowerCase(), { id: c, name: c });
      }
    }
  }

  const selClean = (selectedVal || "Personal").trim();
  const selectedKey = selClean.toLowerCase();

  for (const [key, item] of optionsMap.entries()) {
    const isSelected = key === selectedKey;
    const dotInfo = getCategoryDotStyle(item.id);

    const row = document.createElement("div");
    row.className = `category-option-item ${isSelected ? "selected" : ""}`;
    row.dataset.value = item.id;

    const left = document.createElement("div");
    left.className = "option-left";

    const dot = document.createElement("span");
    dot.className = `category-indicator-dot ${dotInfo.cls}`;
    if (dotInfo.style) dot.style.cssText = dotInfo.style;

    const label = document.createElement("span");
    label.className = "option-label";
    label.textContent = item.name;

    left.append(dot, label);
    row.appendChild(left);

    if (isSelected) {
      const check = document.createElement("span");
      check.className = "option-check";
      check.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      row.appendChild(check);
    }

    row.addEventListener("click", () => {
      selectPasswordCategoryOption(item.id, item.name, dotInfo);
    });

    elements.passwordCategoryOptionsList.appendChild(row);
  }
}

function selectPasswordCategoryOption(id, name, dotInfo) {
  if (elements.passwordCategoryHiddenInput) {
    elements.passwordCategoryHiddenInput.value = id;
  }
  if (elements.passwordCategoryTriggerText) {
    elements.passwordCategoryTriggerText.textContent = name;
  }
  if (elements.passwordCategoryTriggerDot) {
    elements.passwordCategoryTriggerDot.className = `category-indicator-dot ${dotInfo.cls}`;
    elements.passwordCategoryTriggerDot.style.cssText = dotInfo.style || "";
  }
  closePasswordCategoryDropdown();
}

function closePasswordCategoryDropdown() {
  elements.passwordCategoryDropdownMenu?.classList.add("hidden");
  elements.passwordCategoryTrigger?.setAttribute("aria-expanded", "false");
}

function openPasswordModal(pw = null, prefilledPassword = "") {
  if (elements.passwordModalError) {
    elements.passwordModalError.textContent = "";
    elements.passwordModalError.classList.add("hidden");
  }

  if (pw) {
    editingPasswordId = pw.id;
    if (elements.passwordModalTitle) elements.passwordModalTitle.textContent = "Edit Password";
    if (elements.passwordTitleInput) elements.passwordTitleInput.value = pw.title || "";
    if (elements.passwordUsernameInput) elements.passwordUsernameInput.value = pw.username || "";
    if (elements.passwordValueInput) elements.passwordValueInput.value = pw.password || "";
    if (elements.passwordUrlInput) elements.passwordUrlInput.value = pw.url || "";
    if (elements.passwordNotesInput) elements.passwordNotesInput.value = pw.notes || "";
    const cat = pw.category || "Personal";
    renderPasswordModalCategoryOptions(cat);
    const dotInfo = getCategoryDotStyle(cat);
    selectPasswordCategoryOption(cat, cat, dotInfo);
  } else {
    editingPasswordId = null;
    if (elements.passwordModalTitle) elements.passwordModalTitle.textContent = "New Password";
    if (elements.passwordTitleInput) {
      elements.passwordTitleInput.value = currentTabDomain ? currentTabDomain.split(".")[0].toUpperCase() : "";
    }
    if (elements.passwordUsernameInput) elements.passwordUsernameInput.value = "";
    if (elements.passwordValueInput) {
      elements.passwordValueInput.value = prefilledPassword || generateRandomPassword({ length: 16 });
    }
    if (elements.passwordUrlInput) {
      elements.passwordUrlInput.value = currentTabDomain ? `https://${currentTabDomain}` : "";
    }
    if (elements.passwordNotesInput) elements.passwordNotesInput.value = "";
    renderPasswordModalCategoryOptions("Personal");
    const dotInfo = getCategoryDotStyle("Personal");
    selectPasswordCategoryOption("Personal", "Personal", dotInfo);
  }

  if (elements.passwordValueInput) {
    elements.passwordValueInput.type = "password";
  }

  updatePasswordModalBrandPreview();
  updateModalStrengthMeter();
  showModal(elements.passwordModal);
  elements.passwordTitleInput?.focus();
}

function closePasswordModal() {
  hideModal(elements.passwordModal);
  editingPasswordId = null;
  closePasswordCategoryDropdown();
}

async function handleSavePassword() {
  const title = (elements.passwordTitleInput?.value || "").trim();
  const username = (elements.passwordUsernameInput?.value || "").trim();
  const password = (elements.passwordValueInput?.value || "").trim();
  const url = (elements.passwordUrlInput?.value || "").trim();
  const category = (elements.passwordCategoryHiddenInput?.value || "Personal").trim();
  const notes = (elements.passwordNotesInput?.value || "").trim();

  if (!title) {
    if (elements.passwordModalError) {
      elements.passwordModalError.textContent = "Please enter a service or website title.";
      elements.passwordModalError.classList.remove("hidden");
    }
    elements.passwordTitleInput?.focus();
    return;
  }

  if (!password) {
    if (elements.passwordModalError) {
      elements.passwordModalError.textContent = "Please enter or generate a password.";
      elements.passwordModalError.classList.remove("hidden");
    }
    elements.passwordValueInput?.focus();
    return;
  }

  if (!vault.passwords) vault.passwords = [];

  if (editingPasswordId) {
    const idx = vault.passwords.findIndex((p) => p.id === editingPasswordId);
    if (idx !== -1) {
      vault.passwords[idx] = {
        ...vault.passwords[idx],
        title,
        username,
        password,
        url,
        category,
        notes,
        updatedAt: Date.now(),
      };
    }
  } else {
    vault.passwords.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      title,
      username,
      password,
      url,
      category,
      notes,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  await saveVault();
  closePasswordModal();
  renderPasswords();
  updateAccountCount();
  showToast(editingPasswordId ? "✓ Password updated" : "✓ Password saved to vault");
}

async function deletePassword(id) {
  const pw = vault?.passwords?.find((p) => p.id === id);
  const name = pw?.title || "this password";
  if (!window.confirm(`Move ${name} to Trash?`)) return;

  if (pw) {
    if (!vault.trash) vault.trash = [];
    pw.deletedAt = Date.now();
    pw.itemType = "password";
    vault.trash.push(pw);
  }
  vault.passwords = vault.passwords.filter((p) => p.id !== id);
  await saveVault();
  renderPasswords();
  updateAccountCount();
  updateTrashCount();
  showToast("Moved to Trash (30-day recovery)");
}

function openSettingsModal(options = {}) {
  const { allowLocked = false } = options;
  if (meta?.locked && !allowLocked) {
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
  if (!meta?.locked) {
    showSettingsList();
    elements.currentPinInput?.focus();
  }
}

function closeSettingsModal() {
  hideModal(elements.settingsModal);
  if (!meta?.locked) {
    showSettingsList();
  }
}

function hideAllSettingsSections() {
  [
    elements.settingsChangePin,
    elements.settingsBackup,
    elements.settingsBrowserTransfer,
    elements.settingsGoogleSync,
        elements.settingsPreferences,
    elements.settingsClockSync,
    elements.settingsReset,
  ].forEach((section) => {
    if (!section) return;
    if (section.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    section.classList.add("hidden");
    section.setAttribute("inert", "");
  });
}

function showSettingsList() {
  if (meta?.locked) {
    hideModal(elements.settingsModal);
    return;
  }
  if (document.activeElement && document.activeElement !== document.body) {
    try { document.activeElement.blur(); } catch (_) {}
  }
  hideAllSettingsSections();
  updateSyncBadge();
  updateClockSyncUI();
  elements.settingsList?.classList.remove("hidden");
  elements.settingsList?.removeAttribute("inert");
  elements.settingsBackBtn?.classList.add("hidden");
}

function hideSettingsList() {
  if (document.activeElement && document.activeElement !== document.body) {
    try { document.activeElement.blur(); } catch (_) {}
  }
  elements.settingsList?.classList.add("hidden");
  elements.settingsList?.setAttribute("inert", "");
  elements.settingsBackBtn?.classList.remove("hidden");
}

function openSettingsSection(key) {
  hideAllSettingsSections();
  const map = {
    "change-pin": elements.settingsChangePin,
    backup: elements.settingsBackup,
    "browser-transfer": elements.settingsBrowserTransfer,
    "google-sync": elements.settingsGoogleSync,
        preferences: elements.settingsPreferences,
    "trash": elements.settingsTrash,
    "clock-sync": elements.settingsClockSync,
    reset: elements.settingsReset,
  };
  const section = map[key];
  if (!section) return;
  hideSettingsList();
  section.classList.remove("hidden");
  section.removeAttribute("inert");
  if (key === "trash") { renderTrash(); }
  if (key === "clock-sync") {
    updateClockSyncUI();
  }
  if (key === "google-sync") {
    refreshSyncUI();
  }
    if (key === "browser-transfer") {
    renderTransferQR();
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
  applyAccentColor(meta?.accentColor || "cyan");
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
  const deletedItem = vault.accounts.find((acc) => acc.id === pendingDeleteId);
  if (deletedItem) {
    if (!vault.trash) vault.trash = [];
    deletedItem.deletedAt = Date.now();
    deletedItem.itemType = "account";
    vault.trash.push(deletedItem);
  }
  vault.accounts = vault.accounts.filter((acc) => acc.id !== pendingDeleteId);
  await saveVault();
  closeDeleteModal();
  renderAccounts();
  updateTrashCount();
  showToast("Moved to Trash (30-day recovery)");
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
  if (!vault) return "";
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      accounts: vault.accounts || [],
      passwords: vault.passwords || [],
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

    showImportError("Importing and encrypting data...");
    if (!vault) {
      vault = { accounts: [], passwords: [], createdAt: Date.now() };
    }
    if (!vault.accounts) vault.accounts = [];
    if (!vault.passwords) vault.passwords = [];

    // Also import passwords if payload contained them
    if (payload && Array.isArray(payload.passwords)) {
      const existingPwIds = new Set(vault.passwords.map((p) => p.id));
      for (const p of payload.passwords) {
        if (!p || (!p.title && !p.password)) continue;
        const id = p.id || crypto.randomUUID();
        if (!existingPwIds.has(id)) {
          vault.passwords.push({
            id,
            title: p.title || "",
            username: p.username || "",
            password: p.password || "",
            url: p.url || "",
            category: p.category || "Personal",
            notes: p.notes || "",
            pinned: Boolean(p.pinned),
            createdAt: p.createdAt || Date.now(),
            updatedAt: p.updatedAt || Date.now(),
          });
          existingPwIds.add(id);
        }
      }
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
  const accCount = vault?.accounts?.length || 0;
  const pwCount = vault?.passwords?.length || 0;
  if (elements.accountCount) {
    elements.accountCount.textContent = accCount > 0 ? String(accCount) : "";
  }
  if (elements.nav2faCount) {
    elements.nav2faCount.textContent = String(accCount);
  }
  if (elements.navPasswordsCount) {
    elements.navPasswordsCount.textContent = String(pwCount);
  }
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


// ── Recently Deleted (Trash Bin) Logic ───────────────────────────────────────
function pruneOldTrash() {
  if (!vault?.trash) return;
  const thirtyDaysAgo = Date.now() - (30 * 24 * 3600 * 1000);
  vault.trash = vault.trash.filter((it) => (it.deletedAt || 0) > thirtyDaysAgo);
}

function updateTrashCount() {
  pruneOldTrash();
  const count = vault?.trash?.length || 0;
  if (elements.trashCountBadge) {
    elements.trashCountBadge.textContent = String(count);
  }
}

function renderTrash() {
  pruneOldTrash();
  updateTrashCount();
  const list = elements.trashList;
  if (!list) return;

  const items = vault?.trash || [];
  if (items.length === 0) {
    list.innerHTML = '<p class="muted" style="font-size:11.5px;text-align:center;padding:16px;">Trash is empty</p>';
    return;
  }

  list.innerHTML = "";
  // Sort newest deleted first
  const sorted = [...items].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  for (const it of sorted) {
    const row = document.createElement("div");
    row.className = "trash-item";
    const isAcc = it.itemType === "account" || it.secret;
    const typeLabel = isAcc ? "2FA Token" : "Password";
    const name = it.issuer || it.title || it.username || "Item";
    const dateStr = it.deletedAt ? new Date(it.deletedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recently";

    row.innerHTML = `
      <div class="trash-item-info">
        <span class="trash-item-title">${isAcc ? "🔑" : "🔒"} ${name}</span>
        <span class="trash-item-meta">${typeLabel} • Deleted ${dateStr}</span>
      </div>
      <button type="button" class="trash-restore-btn" data-id="${it.id}">Restore</button>
    `;

    row.querySelector(".trash-restore-btn")?.addEventListener("click", async () => {
      // Remove from trash
      vault.trash = (vault.trash || []).filter((x) => x.id !== it.id);
      delete it.deletedAt;
      const t = it.itemType;
      delete it.itemType;

      if (t === "password" || (!it.secret && it.password)) {
        if (!vault.passwords) vault.passwords = [];
        vault.passwords.push(it);
        renderPasswords();
      } else {
        if (!vault.accounts) vault.accounts = [];
        vault.accounts.push(it);
        renderAccounts();
      }

      await saveVault();
      renderTrash();
      updateAccountCount();
      showToast(`✓ Restored ${name}`);
    });

    list.appendChild(row);
  }
}

async function handleEmptyTrash() {
  if (!vault?.trash || vault.trash.length === 0) return;
  if (!confirm("Permanently delete all items in Trash? This cannot be undone.")) return;
  vault.trash = [];
  await saveVault();
  renderTrash();
  showToast("Trash emptied");
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
    issuer.textContent = account.issuer || brand.name || account.label || "Account";
    issuer.title = issuer.textContent;
    title.append(issuer);

    

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
      const nextBadge = item.querySelector("[data-next-code]");
      if (nextBadge && account && account.secret) {
        generateTOTP(account.secret, now + (remaining + 1) * 1000, account).then((nxt) => {
          nextBadge.textContent = `Next: ${formatOTPDisplay(nxt)}`;
        }).catch(() => {});
      }
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
  // 1. Try native BarcodeDetector if available (instant hardware-accelerated decode in Chromium)
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

  // 2. Pure JavaScript jsQR engine fallback (100% offline & desktop support)
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

        const code = qrFn(imgData.data, width, height, { inversionAttempts: "attemptBoth" });
        if (code?.data) return code.data;
      }
    }
  } catch (err) {
    console.debug("jsQR decode error:", err);
  }

  return null;
}

async function populateAndOpenAddModal(urlOrSecret) {
  if (!urlOrSecret) return;

  const trimmed = typeof urlOrSecret === "string" ? urlOrSecret.trim() : "";

  // Intercept 1-Click Cross-Browser Sync QR code or encrypted vault data
  if (
    trimmed.startsWith("khsync:") ||
    trimmed.includes('"ciphertext"') ||
    trimmed.includes('"encryptedVault"')
  ) {
    await handleImportSyncData(trimmed);
    return;
  }

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


// ── GitHub Gist Cross-Browser Sync Logic ─────────────────────────────────────
function updateGistSyncBadge() {
  if (!elements.gistSyncStatusBadge) return;
  const isEnabled = Boolean(meta?.gistSyncEnabled && meta?.gistToken && meta?.gistId);
  elements.gistSyncStatusBadge.textContent = isEnabled ? "Active" : "Off";
  elements.gistSyncStatusBadge.classList.toggle("active", isEnabled);
}

function refreshGistSyncUI() {
  updateGistSyncBadge();
  if (!elements.settingsGistSync) return;
  const isEnabled = Boolean(meta?.gistSyncEnabled && meta?.gistToken && meta?.gistId);

  if (isEnabled) {
    elements.gistSyncSetupCard?.classList.add("hidden");
    elements.gistSyncStatusCard?.classList.remove("hidden");
    if (elements.gistUserLogin) {
      elements.gistUserLogin.textContent = meta.gistUserLogin ? `@${meta.gistUserLogin}` : "@github";
    }
    if (elements.gistIdDisplay) {
      elements.gistIdDisplay.textContent = meta.gistId || "N/A";
    }
    if (elements.gistLastSyncedTime) {
      elements.gistLastSyncedTime.textContent = meta.gistLastSyncedAt
        ? new Date(meta.gistLastSyncedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
            day: "numeric",
          })
        : "Just now";
    }
  } else {
    elements.gistSyncSetupCard?.classList.remove("hidden");
    elements.gistSyncStatusCard?.classList.add("hidden");
    if (elements.gistTokenInput) {
      elements.gistTokenInput.value = meta?.gistToken || "";
    }
    if (elements.gistIdInput) {
      elements.gistIdInput.value = meta?.gistId || "";
    }
  }
}

function showGistError(msg) {
  if (!elements.gistSetupError) return;
  elements.gistSetupError.textContent = msg;
  elements.gistSetupError.classList.remove("hidden");
}

function hideGistError() {
  if (!elements.gistSetupError) return;
  elements.gistSetupError.textContent = "";
  elements.gistSetupError.classList.add("hidden");
}

async function handleGistCreateSync() {
  const token = (elements.gistTokenInput?.value || "").trim();
  if (!token) {
    showGistError("Please enter your GitHub Personal Access Token.");
    return;
  }
  if (!vaultRecord) {
    showGistError("Please create or unlock your vault first.");
    return;
  }

  const btn = elements.gistCreateSyncBtn;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Creating Encrypted Gist...</span>`;
  }

  try {
    hideGistError();
    const user = await validateGitHubToken(token);
    const res = await createGistVault(token, vaultRecord);
    meta = await updateMeta({
      gistSyncEnabled: true,
      gistToken: token,
      gistId: res.gistId,
      gistUserLogin: user.login,
      gistLastSyncedAt: res.updatedAt || Date.now(),
    });
    showToast("✓ Cross-Browser Cloud Sync created!");
    refreshGistSyncUI();
  } catch (err) {
    console.error("Gist create sync error:", err);
    showGistError(err.message || "Failed to create Gist.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Initialize Cross-Browser Sync</span>`;
    }
  }
}

async function handleGistConnectSync() {
  const token = (elements.gistTokenInput?.value || "").trim();
  const gistId = (elements.gistIdInput?.value || "").trim();

  if (!token) {
    showGistError("Please enter your GitHub Personal Access Token.");
    return;
  }
  if (!gistId) {
    showGistError("Please enter your Sync ID (Gist ID).");
    return;
  }

  const btn = elements.gistConnectSyncBtn;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Connecting & Verifying...</span>`;
  }

  try {
    hideGistError();
    const user = await validateGitHubToken(token);
    const res = await fetchGistVault(token, gistId);

    if (sessionPin) {
      const decrypted = await decryptVault(sessionPin, res.record);
      vault = decrypted;
      vaultRecord = res.record;
      await persistVaultRecord(vaultRecord);
      renderAccounts();
      renderPasswords();
      showToast("✓ Connected & synced from GitHub Gist!");
    } else {
      vaultRecord = res.record;
      await setVaultRecord(vaultRecord);
      showToast("✓ Vault found on Gist! Enter your PIN to unlock.");
      showLockedView({ createMode: false });
    }

    meta = await updateMeta({
      gistSyncEnabled: true,
      gistToken: token,
      gistId: res.gistId,
      gistUserLogin: user.login,
      gistLastSyncedAt: res.updatedAt || Date.now(),
    });

    refreshGistSyncUI();
  } catch (err) {
    console.error("Gist connect error:", err);
    showGistError(err.message || "Failed to connect to Gist.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Connect &amp; Download Vault</span>`;
    }
  }
}

async function handleGistSyncNow() {
  if (!meta?.gistSyncEnabled || !meta?.gistToken || !meta?.gistId) return;

  const btn = elements.gistSyncNowBtn;
  if (btn) {
    btn.disabled = true;
    const span = btn.querySelector("span");
    if (span) span.textContent = "Syncing...";
  }

  try {
    const gist = await fetchGistVault(meta.gistToken, meta.gistId);
    const localTime = vaultRecord?.updatedAt || 0;
    const remoteTime = gist.record?.updatedAt || 0;

    if (remoteTime > localTime) {
      if (sessionPin) {
        const decrypted = await decryptVault(sessionPin, gist.record);
        vault = decrypted;
        vaultRecord = gist.record;
        await setVaultRecord(vaultRecord);
        renderAccounts();
        renderPasswords();
        showToast("✓ Vault updated with newer remote changes!");
      } else {
        vaultRecord = gist.record;
        await setVaultRecord(vaultRecord);
      }
    } else {
      if (vaultRecord) {
        await updateGistVault(meta.gistToken, meta.gistId, vaultRecord);
        showToast("✓ Vault pushed to GitHub Gist!");
      }
    }

    meta = await updateMeta({ gistLastSyncedAt: Date.now() });
    refreshGistSyncUI();
  } catch (err) {
    console.error("Gist sync now error:", err);
    showToast(`Sync failed: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      const span = btn.querySelector("span");
      if (span) span.textContent = "Sync Now";
    }
  }
}

async function handleGistDisconnect() {
  if (!confirm("Are you sure you want to disconnect GitHub Gist sync from this browser? (Your data in both this browser and the Gist will remain safe)")) {
    return;
  }
  meta = await updateMeta({
    gistSyncEnabled: false,
    gistToken: "",
    gistId: "",
    gistUserLogin: "",
    gistLastSyncedAt: 0,
  });
  showToast("✓ Cross-Browser Sync disconnected");
  refreshGistSyncUI();
}


// ── 1-Click Cross-Browser Transfer & Sync Logic ──────────────────────────────
function getTransferSyncString() {
  if (!vaultRecord) return "";
  try {
    const payload = {
      vault: vaultRecord,
      ...(meta?.gistSyncEnabled && meta?.gistToken && meta?.gistId ? {
        gist: {
          token: meta.gistToken,
          id: meta.gistId,
          user: meta.gistUserLogin,
        }
      } : {})
    };
    return "khsync:" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (e) {
    return "";
  }
}

function renderTransferQR() {
  if (!elements.transferQrContainer) return;
  if (!vaultRecord) {
    elements.transferQrContainer.innerHTML = `<p style="color:var(--muted);font-size:11.5px;padding:12px;text-align:center;">Unlock your vault first to generate transfer QR</p>`;
    return;
  }

  const rawStr = getTransferSyncString();
  if (elements.transferCodeText) {
    elements.transferCodeText.value = rawStr;
  }
  const snippet = document.getElementById("transferCodeSnippet");
  if (snippet) {
    snippet.textContent = rawStr ? (rawStr.slice(0, 14) + "..." + rawStr.slice(-6)) : "No vault loaded";
  }

  try {
    let qr;
    try {
      qr = qrcode(0, "M");
      qr.addData(rawStr);
      qr.make();
    } catch (_) {
      qr = qrcode(0, "L");
      qr.addData(rawStr);
      qr.make();
    }
    if (typeof qr.createSvgTag === "function") {
      elements.transferQrContainer.innerHTML = qr.createSvgTag(3, 2);
    } else {
      elements.transferQrContainer.innerHTML = qr.createImgTag(2, 2);
    }
  } catch (e) {
    console.warn("QR too large, using fallback:", e);
    elements.transferQrContainer.innerHTML = `
      <div class="qr-too-large-fallback">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        <span>Large Vault: Click 'Copy' below or download .khsync file</span>
      </div>`;
  }
}

async function handleImportSyncData(raw) {
  try {
    let clean = (raw || "").trim();
    if (!clean) {
      showToast("Please enter or paste sync data");
      return false;
    }

    if (clean.startsWith("khsync:")) {
      clean = clean.slice(7).trim();
    }

    // Attempt parsing directly as JSON or decode from base64
    let parsed = null;
    try {
      parsed = JSON.parse(clean);
    } catch (_) {
      try {
        const decoded = decodeURIComponent(escape(atob(clean)));
        parsed = JSON.parse(decoded);
      } catch (e1) {
        try {
          const decoded2 = atob(clean);
          parsed = JSON.parse(decoded2);
        } catch (e2) {
          // not valid json
        }
      }
    }

    if (!parsed) {
      showToast("Invalid sync code format");
      return false;
    }

    // Extract vaultRecord from various supported payload wrappers
    let incomingRecord = null;
    if (parsed && parsed.ciphertext && parsed.iv && parsed.salt) {
      incomingRecord = parsed;
    } else if (parsed?.vault && typeof parsed.vault === "object" && parsed.vault.ciphertext && parsed.vault.iv && parsed.vault.salt) {
      incomingRecord = parsed.vault;
    } else if (parsed?.vault && typeof parsed.vault === "string") {
      try {
        const inner = JSON.parse(parsed.vault);
        if (inner?.ciphertext && inner?.iv && inner?.salt) {
          incomingRecord = inner;
        }
      } catch (_) {}
    } else if (parsed?.encryptedVault && typeof parsed.encryptedVault === "object" && parsed.encryptedVault.ciphertext && parsed.encryptedVault.iv && parsed.encryptedVault.salt) {
      incomingRecord = parsed.encryptedVault;
    }

    // Handle plaintext accounts list backup import
    if (!incomingRecord && Array.isArray(parsed?.accounts)) {
      if (sessionPin) {
        if (!vault) vault = { accounts: [], passwords: [], createdAt: Date.now() };
        vault.accounts = parsed.accounts;
        if (Array.isArray(parsed.passwords)) {
          vault.passwords = parsed.passwords;
        }
        vault.updatedAt = Date.now();
        const encrypted = await encryptVault(sessionPin, vault);
        await persistVaultRecord(encrypted);
        renderAccounts();
        renderPasswords();
        closeSettingsModal();
        showToast("✓ Accounts restored from sync data!");
        if (elements.receiveCodeInput) elements.receiveCodeInput.value = "";
        return true;
      } else {
        showToast("Please unlock your vault before importing plain accounts");
        return false;
      }
    }

    if (!incomingRecord || !incomingRecord.ciphertext || !incomingRecord.iv || !incomingRecord.salt) {
      showToast("Invalid sync data format");
      return false;
    }

    const incomingGist = parsed?.gist && parsed.gist.token && parsed.gist.id ? parsed.gist : null;
    const syncMetaPatch = {
      syncEnabled: true,
      lastSyncedAt: Date.now(),
      ...(incomingGist ? {
        gistSyncEnabled: true,
        gistToken: incomingGist.token,
        gistId: incomingGist.id,
        gistUserLogin: incomingGist.user || "",
        gistLastSyncedAt: Date.now(),
      } : {})
    };

    if (sessionPin) {
      try {
        const decrypted = await decryptVault(sessionPin, incomingRecord);
        vault = decrypted;
        vaultRecord = incomingRecord;
        await persistVaultRecord(vaultRecord);
        meta = await updateMeta({ locked: false, lastActive: Date.now(), ...syncMetaPatch });
        await setSession({ pin: sessionPin, lastActive: Date.now() });
        renderAccounts();
        renderPasswords();
        refreshGistSyncUI();
        closeSettingsModal();
        showToast("✓ Browser Sync complete! Automatic sync active.");
        if (elements.receiveCodeInput) elements.receiveCodeInput.value = "";
        return true;
      } catch (e) {
        // Vault PIN on source browser differs from sessionPin
        vaultRecord = incomingRecord;
        await persistVaultRecord(vaultRecord);
        await setLocked(true);
        vault = null;
        sessionPin = null;
        await clearStoredSession();
        meta = await updateMeta({ locked: true, ...syncMetaPatch });
        refreshGistSyncUI();
        closeSettingsModal();
        showToast("✓ Sync data loaded! Enter PIN to unlock.");
        showLockedView({ createMode: false, syncDetected: true });
        if (elements.receiveCodeInput) elements.receiveCodeInput.value = "";
        return true;
      }
    } else {
      vaultRecord = incomingRecord;
      await persistVaultRecord(vaultRecord);
      await setLocked(true);
      vault = null;
      sessionPin = null;
      await clearStoredSession();
      meta = await updateMeta({ locked: true, ...syncMetaPatch });
      refreshGistSyncUI();
      closeSettingsModal();
      showToast("✓ Sync data loaded! Enter PIN to unlock.");
      showLockedView({ createMode: false, syncDetected: true });
      if (elements.receiveCodeInput) elements.receiveCodeInput.value = "";
      return true;
    }
  } catch (err) {
    console.error("Failed to import sync data:", err);
    showToast("Failed to process sync data. Check code format.");
    return false;
  }
}

function handleDownloadTransferFile() {
  if (!vaultRecord) {
    showToast("No vault data available to export");
    return;
  }
  const blob = new Blob([JSON.stringify(vaultRecord, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kh_browser_sync_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("✓ Downloaded transfer file!");
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

  // GitHub Gist Cross-Browser Sync reconciliation on startup
  if (meta?.gistSyncEnabled && meta?.gistToken && meta?.gistId) {
    try {
      const gist = await fetchGistVault(meta.gistToken, meta.gistId);
      if (gist?.record?.ciphertext) {
        const localTime = vaultRecord?.updatedAt || 0;
        const remoteTime = gist.record.updatedAt || 0;
        if (remoteTime > localTime) {
          vaultRecord = gist.record;
          await setVaultRecord(vaultRecord);
          meta = await updateMeta({ gistLastSyncedAt: remoteTime });
          syncDetected = true;
        } else if (localTime > remoteTime && vaultRecord) {
          await updateGistVault(meta.gistToken, meta.gistId, vaultRecord);
          meta = await updateMeta({ gistLastSyncedAt: localTime });
        }
      }
    } catch (e) {
      console.warn("Startup Gist sync reconciliation error:", e);
    }
  }

  updateSyncBadge();
  updateGistSyncBadge();

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

  // ── Vault Navigation Segmented Controls ──
  elements.nav2faBtn?.addEventListener("click", () => switchVaultTab("2fa"));
  elements.navPasswordsBtn?.addEventListener("click", () => switchVaultTab("passwords"));
  elements.navGeneratorBtn?.addEventListener("click", () => switchVaultTab("generator"));

  // ── Generator Listeners ──
  document.querySelectorAll(".gen-mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.mode;
      if (mode) setGeneratorMode(mode);
    });
  });

  elements.generatorLengthSlider?.addEventListener("input", updateGeneratedPassword);
  elements.generatorWordsSlider?.addEventListener("input", updateGeneratedPassword);
  elements.generatorPinSlider?.addEventListener("input", updateGeneratedPassword);

  elements.genOptUpper?.addEventListener("change", updateGeneratedPassword);
  elements.genOptLower?.addEventListener("change", updateGeneratedPassword);
  elements.genOptNumbers?.addEventListener("change", updateGeneratedPassword);
  elements.genOptSymbols?.addEventListener("change", updateGeneratedPassword);
  elements.genOptAvoidAmbiguous?.addEventListener("change", updateGeneratedPassword);
  elements.genOptCapitalize?.addEventListener("change", updateGeneratedPassword);
  elements.genOptIncludeNumber?.addEventListener("change", updateGeneratedPassword);

  // Custom Separator Dropdown & Quick Chips
  elements.generatorSeparatorTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = elements.generatorSeparatorMenu?.classList.contains("hidden");
    if (isHidden) {
      elements.generatorSeparatorMenu?.classList.remove("hidden");
      elements.generatorSeparatorTrigger?.setAttribute("aria-expanded", "true");
    } else {
      closeSeparatorDropdown();
    }
  });

  document.querySelectorAll(".custom-select-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      if (val) setPassphraseSeparator(val);
    });
  });

  document.querySelectorAll(".sep-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const sep = chip.dataset.sep;
      if (sep) setPassphraseSeparator(sep);
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#generatorSeparatorDropdown")) {
      closeSeparatorDropdown();
    }
  });

  document.querySelectorAll(".preset-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const preset = pill.dataset.preset;
      if (preset === "memorable") {
        setGeneratorMode("passphrase");
        if (elements.generatorWordsSlider) elements.generatorWordsSlider.value = "4";
        setPassphraseSeparator("hyphen");
        if (elements.genOptCapitalize) elements.genOptCapitalize.checked = true;
        if (elements.genOptIncludeNumber) elements.genOptIncludeNumber.checked = true;
      } else if (preset === "strong") {
        setGeneratorMode("password");
        if (elements.generatorLengthSlider) elements.generatorLengthSlider.value = "16";
        if (elements.genOptUpper) elements.genOptUpper.checked = true;
        if (elements.genOptLower) elements.genOptLower.checked = true;
        if (elements.genOptNumbers) elements.genOptNumbers.checked = true;
        if (elements.genOptSymbols) elements.genOptSymbols.checked = true;
      } else if (preset === "ultra") {
        setGeneratorMode("password");
        if (elements.generatorLengthSlider) elements.generatorLengthSlider.value = "32";
        if (elements.genOptUpper) elements.genOptUpper.checked = true;
        if (elements.genOptLower) elements.genOptLower.checked = true;
        if (elements.genOptNumbers) elements.genOptNumbers.checked = true;
        if (elements.genOptSymbols) elements.genOptSymbols.checked = true;
      }
      updateGeneratedPassword();
    });
  });

  elements.refreshGeneratedPasswordBtn?.addEventListener("click", updateGeneratedPassword);

  // Initialize default generated password
  updateGeneratedPassword();

    elements.generatedPasswordDisplay?.addEventListener("click", async () => {
    if (!currentGeneratedPassword) return;
    await navigator.clipboard.writeText(currentGeneratedPassword);
    scheduleClipboardClear(currentGeneratedPassword, Number(meta?.clipboardClearSec ?? 30));
    elements.copyGeneratedPasswordBtn?.classList.add("copied");
    setTimeout(() => elements.copyGeneratedPasswordBtn?.classList.remove("copied"), 850);
    showToast("✓ Copied password to clipboard");
  });

  elements.copyGeneratedPasswordBtn?.addEventListener("click", async () => {
    if (!currentGeneratedPassword) return;
    await navigator.clipboard.writeText(currentGeneratedPassword);
    scheduleClipboardClear(currentGeneratedPassword, Number(meta?.clipboardClearSec ?? 30));
    elements.copyGeneratedPasswordBtn.classList.add("copied");
    setTimeout(() => elements.copyGeneratedPasswordBtn.classList.remove("copied"), 850);
    showToast("✓ Copied password to clipboard");
  });

  elements.saveGeneratedToVaultBtn?.addEventListener("click", () => {
    openPasswordModal(null, currentGeneratedPassword);
  });

  // ── Passwords Tab Listeners ──
  elements.passwordSearchInput?.addEventListener("input", renderPasswords);
  elements.addPasswordBtn?.addEventListener("click", () => openPasswordModal());
  elements.emptyAddPasswordBtn?.addEventListener("click", () => openPasswordModal());
  elements.quickGeneratorBtn?.addEventListener("click", () => switchVaultTab("generator"));

  // Password category filter bar horizontal mouse wheel scroll & drag
  elements.passwordCategoryFilterBar?.addEventListener("wheel", (e) => {
    if (elements.passwordCategoryFilterBar.scrollWidth > elements.passwordCategoryFilterBar.clientWidth) {
      e.preventDefault();
      elements.passwordCategoryFilterBar.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX) * 1.2;
    }
  }, { passive: false });

  // ── Password Modal Listeners ──
  elements.closePasswordModalBtn?.addEventListener("click", closePasswordModal);
  elements.cancelPasswordBtn?.addEventListener("click", closePasswordModal);
  elements.savePasswordBtn?.addEventListener("click", handleSavePassword);

  elements.passwordTitleInput?.addEventListener("input", updatePasswordModalBrandPreview);
  elements.passwordUrlInput?.addEventListener("input", updatePasswordModalBrandPreview);
  elements.passwordValueInput?.addEventListener("input", updateModalStrengthMeter);

  elements.passwordModalEyeBtn?.addEventListener("click", () => {
    if (!elements.passwordValueInput) return;
    const isPass = elements.passwordValueInput.type === "password";
    elements.passwordValueInput.type = isPass ? "text" : "password";
    elements.passwordModalEyeBtn.classList.toggle("active", isPass);
  });

  elements.passwordModalQuickGenBtn?.addEventListener("click", () => {
    const generated = generateRandomPassword({ length: 18 });
    if (elements.passwordValueInput) {
      elements.passwordValueInput.value = generated;
      elements.passwordValueInput.type = "text";
      if (elements.passwordModalEyeBtn) elements.passwordModalEyeBtn.classList.add("active");
    }
    updateModalStrengthMeter();
    showToast("⚡ Generated strong password");
  });

  // Notes quick template chip insertion
  document.querySelectorAll(".notes-chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const template = btn.dataset.template || "";
      if (!elements.passwordNotesInput) return;
      const current = elements.passwordNotesInput.value;
      if (!current.trim()) {
        elements.passwordNotesInput.value = template;
      } else {
        elements.passwordNotesInput.value = current.endsWith("\n") ? current + template : current + "\n" + template;
      }
      elements.passwordNotesInput.focus();
      elements.passwordNotesInput.setSelectionRange(
        elements.passwordNotesInput.value.length,
        elements.passwordNotesInput.value.length
      );
    });
  });

  elements.passwordCategoryTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = elements.passwordCategoryDropdownMenu?.classList.contains("hidden");
    if (isHidden) {
      elements.passwordCategoryDropdownMenu?.classList.remove("hidden");
      elements.passwordCategoryTrigger?.setAttribute("aria-expanded", "true");
    } else {
      closePasswordCategoryDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#passwordCategoryDropdown")) {
      closePasswordCategoryDropdown();
    }
  });

  elements.searchInput.addEventListener("input", renderAccounts);
  elements.accountsList.addEventListener("click", handleAccountAction);

  // Category filter pills: horizontal mouse wheel scroll & drag-to-scroll
  let isCategoryDragging = false;
  let categoryDragStartX = 0;
  let categoryScrollLeft = 0;
  let hasDraggedCategory = false;

  // Wheel event converts vertical scrolling to horizontal scrolling over the pills bar
  elements.categoryFilterBar?.addEventListener("wheel", (e) => {
    if (elements.categoryFilterBar.scrollWidth > elements.categoryFilterBar.clientWidth) {
      e.preventDefault();
      elements.categoryFilterBar.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX) * 1.2;
    }
  }, { passive: false });

  // Mouse drag-to-scroll support
  elements.categoryFilterBar?.addEventListener("mousedown", (e) => {
    isCategoryDragging = true;
    hasDraggedCategory = false;
    categoryDragStartX = e.pageX - elements.categoryFilterBar.offsetLeft;
    categoryScrollLeft = elements.categoryFilterBar.scrollLeft;
  });

  window.addEventListener("mouseup", () => {
    isCategoryDragging = false;
  });

  elements.categoryFilterBar?.addEventListener("mousemove", (e) => {
    if (!isCategoryDragging) return;
    const x = e.pageX - elements.categoryFilterBar.offsetLeft;
    const walk = (x - categoryDragStartX) * 1.5;
    if (Math.abs(x - categoryDragStartX) > 4) {
      hasDraggedCategory = true;
    }
    elements.categoryFilterBar.scrollLeft = categoryScrollLeft - walk;
  });

  elements.categoryFilterBar?.addEventListener("click", (e) => {
    if (hasDraggedCategory) {
      hasDraggedCategory = false;
      return;
    }
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

  // ── 1-Click Browser Transfer Listeners ──
  elements.transferTabSendBtn?.addEventListener("click", () => {
    if (meta?.locked) {
      showToast("Unlock vault first to send / export data");
      return;
    }
    elements.transferTabSendBtn.classList.add("active");
    elements.transferTabReceiveBtn?.classList.remove("active");
    elements.transferSendView?.classList.remove("hidden");
    elements.transferReceiveView?.classList.add("hidden");
    renderTransferQR();
  });

  elements.transferTabReceiveBtn?.addEventListener("click", () => {
    elements.transferTabReceiveBtn.classList.add("active");
    elements.transferTabSendBtn?.classList.remove("active");
    elements.transferReceiveView?.classList.remove("hidden");
    elements.transferSendView?.classList.add("hidden");
  });

  elements.copyTransferCodeBtn?.addEventListener("click", async () => {
    const str = getTransferSyncString();
    if (!str) {
      showToast("Unlock vault to copy sync code");
      return;
    }
    try {
      await navigator.clipboard.writeText(str);
    } catch {
      if (elements.transferCodeText) {
        elements.transferCodeText.select();
        document.execCommand("copy");
      }
    }
    elements.copyTransferCodeBtn.classList.add("copied");
    setTimeout(() => elements.copyTransferCodeBtn?.classList.remove("copied"), 850);
    showToast("✓ Copied Transfer Code! Ready to paste into other browser");
  });

  elements.downloadTransferFileBtn?.addEventListener("click", handleDownloadTransferFile);
  elements.receiveScanScreenBtn?.addEventListener("click", handleScanScreenQR);

  elements.pasteFromClipboardBtn?.addEventListener("click", async () => {
    try {
      const text = (await navigator.clipboard.readText() || "").trim();
      if (elements.receiveCodeInput) {
        elements.receiveCodeInput.value = text;
        showToast("✓ Pasted from clipboard");
        if (text.startsWith("khsync:") || text.includes('"ciphertext"')) {
          await handleImportSyncData(text);
        }
      }
    } catch (e) {
      showToast("Clipboard access denied. Press Ctrl+V inside the box.");
    }
  });

  elements.receiveCodeInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      elements.applyTransferCodeBtn?.click();
    }
  });

  elements.applyTransferCodeBtn?.addEventListener("click", async () => {
    const val = elements.receiveCodeInput?.value || "";
    await handleImportSyncData(val);
  });

  elements.receiveFileInput?.addEventListener("change", (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.type?.startsWith("image/") || file.name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const dataUrl = evt.target?.result;
        if (dataUrl) {
          const img = new Image();
          img.onload = async () => {
            const qrContent = await decodeImageForQR(img);
            if (qrContent) {
              await handleImportSyncData(qrContent);
            } else {
              showToast("Could not find QR code in this image");
            }
          };
          img.onerror = () => showToast("Failed to load QR image");
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const content = evt.target?.result;
        if (content) {
          await handleImportSyncData(content);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  });

  elements.openSecurityAuditBtn?.addEventListener("click", () => {
    updateAuditModalUI();
    showModal(elements.securityAuditModal);
  });
  elements.closeSecurityAuditBtn?.addEventListener("click", () => {
    hideModal(elements.securityAuditModal);
  });
  elements.settingsAuditItemBtn?.addEventListener("click", () => {
    closeSettingsModal();
    updateAuditModalUI();
    showModal(elements.securityAuditModal);
  });
  elements.startBreachScanBtn?.addEventListener("click", handleStartBreachScan);

  elements.openEmergencyKitBtn?.addEventListener("click", () => {
    chrome.tabs.create({ url: "emergency-kit.html" });
  });

  elements.emptyTrashBtn?.addEventListener("click", handleEmptyTrash);

  // Accent color dots click listener
  elements.accentPalettePicker?.querySelectorAll(".accent-color-dot").forEach((dot) => {
    dot.addEventListener("click", async () => {
      const accent = dot.dataset.accent || "cyan";
      elements.accentPalettePicker?.querySelectorAll(".accent-color-dot").forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      applyAccentColor(accent);
      meta = await updateMeta({ accentColor: accent });
    });
  });

  elements.lockTransferFromBrowserBtn?.addEventListener("click", () => {
    openSettingsModal({ allowLocked: true });
    openSettingsSection("browser-transfer");
    elements.transferTabReceiveBtn?.click();
  });

  elements.lockSyncBtn?.addEventListener("click", () => {
    openSettingsModal({ allowLocked: true });
    openSettingsSection("browser-transfer");
    elements.transferTabReceiveBtn?.click();
  });

  // Cross-Browser Gist Sync listeners
  elements.gistTabNewBtn?.addEventListener("click", () => {
    elements.gistTabNewBtn.classList.add("active");
    elements.gistTabJoinBtn?.classList.remove("active");
    elements.gistModeNew?.classList.remove("hidden");
    elements.gistModeJoin?.classList.add("hidden");
  });

  elements.gistTabJoinBtn?.addEventListener("click", () => {
    elements.gistTabJoinBtn.classList.add("active");
    elements.gistTabNewBtn?.classList.remove("active");
    elements.gistModeJoin?.classList.remove("hidden");
    elements.gistModeNew?.classList.add("hidden");
  });

  elements.gistCreateSyncBtn?.addEventListener("click", handleGistCreateSync);
  elements.gistConnectSyncBtn?.addEventListener("click", handleGistConnectSync);
  elements.gistSyncNowBtn?.addEventListener("click", handleGistSyncNow);
  elements.gistDisconnectBtn?.addEventListener("click", handleGistDisconnect);

  elements.copyGistIdBtn?.addEventListener("click", async () => {
    if (!meta?.gistId) return;
    await navigator.clipboard.writeText(meta.gistId);
    showToast("✓ Copied Sync ID (Gist ID) to clipboard");
  });

  elements.checkGistSyncBtn?.addEventListener("click", () => {
    openSettingsModal({ allowLocked: true });
    openSettingsSection("gist-sync");
  });
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
  document.addEventListener("keydown", async (e) => {
    const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

    // 1. Lock vault shortcut: Ctrl+L / Cmd+L
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      if (!meta?.locked && vault) {
        setLocked(true);
        showLockedView({ createMode: false });
        showToast("🔒 Vault locked");
      }
      return;
    }

    // 2. Search shortcut: '/' or 'Ctrl+F'
    if (
      ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f")) &&
      !meta?.locked && vault
    ) {
      e.preventDefault();
      const isPasswordsTab = elements.navPasswordsBtn?.classList.contains("active");
      if (isPasswordsTab) {
        elements.passwordSearchInput?.focus();
        elements.passwordSearchInput?.select();
      } else {
        elements.searchInput?.focus();
        elements.searchInput?.select();
      }
      return;
    }

    // 3. Escape key: Close any active modal or clear search
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal:not(.hidden)");
      if (activeModal) {
        e.preventDefault();
        hideModal(activeModal);
        return;
      }
      if (document.activeElement === elements.searchInput) {
        elements.searchInput.value = "";
        renderAccounts();
        elements.searchInput.blur();
      } else if (document.activeElement === elements.passwordSearchInput) {
        elements.passwordSearchInput.value = "";
        renderPasswords();
        elements.passwordSearchInput.blur();
      }
      return;
    }

    // 4. Digits 1-9 Quick Copy: If not typing, pressing 1-9 immediately copies the TOTP code!
    if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key >= "1" && e.key <= "9" && !meta?.locked && vault) {
      const is2faTab = elements.nav2faBtn?.classList.contains("active");
      if (is2faTab && vault.accounts && vault.accounts.length > 0) {
        const idx = parseInt(e.key, 10) - 1;
        const ordered = sortAccounts(vault.accounts);
        if (ordered[idx]) {
          e.preventDefault();
          const target = ordered[idx];
          try {
            const rawOtp = codes.get(target.id) || (await generateTOTP(target.secret, Date.now(), target));
            const cleanOtp = String(rawOtp).replace(/\s+/g, "");
            if (cleanOtp && !cleanOtp.includes("-")) {
              await navigator.clipboard.writeText(cleanOtp);
              scheduleClipboardClear(cleanOtp, Number(meta?.clipboardClearSec ?? 30));
              showToast(`✓ Copied #${idx + 1} ${target.issuer || "2FA"}: ${formatOTPDisplay(cleanOtp)} (Auto-clears in ${Number(meta?.clipboardClearSec ?? 30)}s)`);
            }
          } catch (_) {}
        }
      }
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
