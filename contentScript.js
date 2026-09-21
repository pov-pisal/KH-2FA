// Content script for KH 2FA: In-field 2FA icon, OTP autofill, and keyboard shortcut listener

const DEFAULT_SHORTCUT = {
  key: "a",
  code: "KeyA",
  ctrlKey: false,
  altKey: true,
  shiftKey: true,
  metaKey: false,
  display: "Alt+Shift+A",
};

let activeShortcut = { ...DEFAULT_SHORTCUT };

// Load saved custom shortcut from chrome.storage.local
try {
  chrome.storage?.local?.get(["customShortcut"], (res) => {
    if (res?.customShortcut) {
      activeShortcut = res.customShortcut;
    }
  });
} catch {
  // Ignore
}

// React instantly when user updates shortcut in extension popup
try {
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === "local" && changes.customShortcut) {
      activeShortcut = changes.customShortcut.newValue || { ...DEFAULT_SHORTCUT };
    }
  });
} catch {
  // Ignore
}

function matchesShortcut(e, shortcut) {
  if (!shortcut) return false;
  const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
  if (!hasModifier) return false;

  if (!!shortcut.ctrlKey !== e.ctrlKey) return false;
  if (!!shortcut.altKey !== e.altKey) return false;
  if (!!shortcut.shiftKey !== e.shiftKey) return false;
  if (!!shortcut.metaKey !== e.metaKey) return false;

  if (shortcut.code) {
    return e.code === shortcut.code;
  }
  return e.key && e.key.toLowerCase() === (shortcut.key || "").toLowerCase();
}

// Global keydown capture to open the extension popup
window.addEventListener(
  "keydown",
  (e) => {
    if (matchesShortcut(e, activeShortcut)) {
      e.preventDefault();
      e.stopPropagation();
      try {
        chrome.runtime?.sendMessage?.({ action: "OPEN_POPUP" });
      } catch (err) {
        console.warn("Could not send OPEN_POPUP message:", err);
      }
    }
  },
  true
);

// --- OTP Autofill Helpers ---

function findOtpInputs() {
  const candidates = Array.from(document.querySelectorAll("input"));
  const matcher = /(otp|totp|2fa|code|auth|verification|security|mfa|token)/i;

  return candidates.filter((input) => {
    if (input.disabled || input.readOnly || input.type === "hidden" || input.type === "checkbox" || input.type === "radio") {
      return false;
    }
    const attrs = [input.name, input.id, input.placeholder, input.autocomplete, input.className]
      .filter(Boolean)
      .join(" ");
    return (
      matcher.test(attrs) ||
      /one-time-code/i.test(input.autocomplete || "") ||
      (input.maxLength >= 4 && input.maxLength <= 8 && /numeric/i.test(input.inputMode || ""))
    );
  });
}

function findOtpInput() {
  const inputs = findOtpInputs();
  return inputs[0] || null;
}

function fillInput(input, value) {
  if (!input) return;
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// --- Floating In-Field Atomic Badge ---

const ATOM_SVG = `
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" style="display:block;">
  <circle cx="12" cy="12" r="3" fill="#38bdf8"></circle>
  <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#38bdf8" stroke-width="1.6" transform="rotate(30 12 12)"></ellipse>
  <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#a78bfa" stroke-width="1.6" transform="rotate(-30 12 12)"></ellipse>
</svg>
`;

let activeDropdown = null;

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
}

document.addEventListener("click", (e) => {
  if (activeDropdown && !activeDropdown.contains(e.target) && !e.target.closest(".atomic-field-badge")) {
    closeDropdown();
  }
});

function showToastMessage(input, message, isError = false) {
  const rect = input.getBoundingClientRect();
  const toast = document.createElement("div");
  toast.className = "atomic-inline-toast";
  toast.style.cssText = `
    position: fixed;
    top: ${Math.max(10, rect.top - 36)}px;
    left: ${Math.max(10, rect.left)}px;
    background: ${isError ? "#ef4444" : "#0f172a"};
    color: #fff;
    border: 1px solid ${isError ? "#f87171" : "#38bdf8"};
    border-radius: 6px;
    padding: 6px 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    z-index: 2147483647;
    pointer-events: none;
    transition: opacity 0.25s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function showAccountsDropdown(input, accounts, badge) {
  closeDropdown();
  const rect = input.getBoundingClientRect();

  const dropdown = document.createElement("div");
  dropdown.className = "atomic-otp-dropdown";
  dropdown.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 6}px;
    left: ${rect.left}px;
    min-width: 240px;
    max-width: 320px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    padding: 6px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    padding: 4px 8px 6px;
    font-size: 11px;
    color: #94a3b8;
    border-bottom: 1px solid #1e293b;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `<span>KH 2FA</span><span style="font-weight:400;font-size:10px;">Select to Fill</span>`;
  dropdown.appendChild(header);

  accounts.forEach((acc) => {
    const row = document.createElement("div");
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
    `;
    row.addEventListener("mouseenter", () => {
      row.style.background = "#1e293b";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
    });

    const info = document.createElement("div");
    info.style.cssText = "display: flex; align-items: center; gap: 8px; min-width: 0;";

    const brandIcon = document.createElement("div");
    brandIcon.style.cssText = `
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${acc.brand?.bgColor || "rgba(56, 189, 248, 0.15)"};
      border: 1px solid ${acc.brand?.borderColor || "rgba(56, 189, 248, 0.3)"};
      flex-shrink: 0;
    `;
    brandIcon.innerHTML = acc.brand?.svg || "";

    const text = document.createElement("div");
    text.style.cssText = "display: flex; flex-direction: column; min-width: 0;";
    const name = document.createElement("strong");
    name.style.cssText = "font-size: 12px; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
    name.textContent = acc.issuer;
    const label = document.createElement("span");
    label.style.cssText = "font-size: 10px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
    label.textContent = acc.label || "";
    text.append(name, label);
    info.append(brandIcon, text);

    const codeBadge = document.createElement("div");
    codeBadge.style.cssText = `
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.1);
      flex-shrink: 0;
    `;
    codeBadge.textContent = acc.code;

    row.append(info, codeBadge);

    row.addEventListener("click", () => {
      fillInput(input, acc.code);
      closeDropdown();
      showToastMessage(input, `✓ Filled ${acc.code} for ${acc.issuer}`);
    });

    dropdown.appendChild(row);
  });

  document.body.appendChild(dropdown);
  activeDropdown = dropdown;
}

function handleAutofillAction(input, badge) {
  badge.style.transform = "scale(0.9)";
  setTimeout(() => (badge.style.transform = ""), 150);

  chrome.runtime.sendMessage(
    {
      action: "GET_OTP_FOR_PAGE",
      hostname: window.location.hostname,
      url: window.location.href,
    },
    (res) => {
      if (chrome.runtime.lastError) {
        showToastMessage(input, "Could not reach KH 2FA", true);
        return;
      }

      if (res?.locked) {
        showToastMessage(input, "🔒 Vault is locked — enter PIN in popup");
        return;
      }

      if (!res?.ok) {
        if (res?.reason === "NO_VAULT") {
          showToastMessage(input, "No vault found — set up in extension", true);
        } else if (res?.reason === "EMPTY_VAULT") {
          showToastMessage(input, "No accounts in vault yet", true);
        } else {
          showToastMessage(input, "Could not generate 2FA code", true);
        }
        return;
      }

      const matched = res.matched || [];
      const all = res.all || [];

      if (matched.length === 1) {
        // Exact single match: fill immediately!
        fillInput(input, matched[0].code);
        showToastMessage(input, `✓ Filled ${matched[0].code} for ${matched[0].issuer}`);
      } else if (matched.length > 1) {
        // Multiple matches: show dropdown
        showAccountsDropdown(input, matched, badge);
      } else if (all.length > 0) {
        // No direct domain match: show all accounts so user can pick
        showAccountsDropdown(input, all, badge);
      }
    }
  );
}

function injectBadgeForInput(input) {
  if (input.dataset.atomicInjected) return;
  input.dataset.atomicInjected = "true";

  const badge = document.createElement("div");
  badge.className = "atomic-field-badge";
  badge.title = "Fill 2FA code with KH 2FA";
  badge.style.cssText = `
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: #0f172a;
    border: 1px solid #38bdf8;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: pointer;
    z-index: 2147483640;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  `;
  badge.innerHTML = ATOM_SVG;

  badge.addEventListener("mouseenter", () => {
    badge.style.transform = "scale(1.1)";
    badge.style.boxShadow = "0 0 10px rgba(56, 189, 248, 0.5)";
  });
  badge.addEventListener("mouseleave", () => {
    badge.style.transform = "scale(1)";
    badge.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  });

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAutofillAction(input, badge);
  });

  function updatePos() {
    if (!input.isConnected) {
      badge.remove();
      return;
    }
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      badge.style.display = "none";
      return;
    }
    badge.style.display = "flex";
    const top = window.scrollY + rect.top + Math.max(0, (rect.height - 22) / 2);
    const left = window.scrollX + rect.right - 28;
    badge.style.top = `${top}px`;
    badge.style.left = `${left}px`;
  }

  updatePos();
  document.body.appendChild(badge);

  window.addEventListener("resize", updatePos, { passive: true });
  window.addEventListener("scroll", updatePos, { passive: true });
}

function scanAndInject() {
  const inputs = findOtpInputs();
  inputs.forEach(injectBadgeForInput);
}

// Initial scan
scanAndInject();

// Observe DOM mutations to inject badge when 2FA modal or page loads dynamically
const observer = new MutationObserver(() => {
  scanAndInject();
});
observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true,
});

// --- Message Listeners ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "AUTOFILL_OTP") {
    const input = findOtpInput();
    if (!input) {
      sendResponse({ ok: false, error: "No OTP input found" });
      return true;
    }
    fillInput(input, message.code);
    showToastMessage(input, `✓ Auto-filled ${message.code}`);
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "TRIGGER_AUTOFILL") {
    const activeEl = document.activeElement;
    const targetInput =
      activeEl && activeEl.tagName === "INPUT" ? activeEl : findOtpInput();
    if (targetInput) {
      handleAutofillAction(targetInput, targetInput);
    }
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
