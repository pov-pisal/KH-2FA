// Content script for KH 2FA: OTP autofill and keyboard shortcut listener

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
  const matcher = /(otp|totp|2fa|verification|security|mfa)/i;

  return candidates.filter((input) => {
    if (
      input.disabled ||
      input.readOnly ||
      input.type === "hidden" ||
      input.type === "checkbox" ||
      input.type === "radio" ||
      input.type === "submit" ||
      input.type === "button"
    ) {
      return false;
    }
    const attrs = [input.name, input.id, input.placeholder, input.autocomplete, input.className]
      .filter(Boolean)
      .join(" ");
    return (
      matcher.test(attrs) ||
      /\bcode\b/i.test(input.name || "") ||
      /\bcode\b/i.test(input.id || "") ||
      /\bcode\b/i.test(input.placeholder || "") ||
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

let activeDropdown = null;

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
}

document.addEventListener("click", (e) => {
  if (activeDropdown && !activeDropdown.contains(e.target)) {
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

function showAccountsDropdown(input, accounts) {
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

function handleAutofillAction(input) {
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
        showAccountsDropdown(input, matched);
      } else if (all.length > 0) {
        // No direct domain match: show all accounts so user can pick
        showAccountsDropdown(input, all);
      }
    }
  );
}

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
      handleAutofillAction(targetInput);
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "EXTRACT_QR_DOM") {
    const link = document.querySelector('a[href^="otpauth://"]');
    if (link?.href) {
      sendResponse({ ok: true, url: link.href });
      return true;
    }
    const images = Array.from(document.querySelectorAll("img, svg, canvas"));
    for (const img of images) {
      const src = img.getAttribute("src") || "";
      const dataUrl = img.getAttribute("data-url") || img.getAttribute("data-secret") || "";
      if (src.includes("otpauth%3A%2F%2F") || src.includes("otpauth://")) {
        try {
          const clean = decodeURIComponent(src.split("chl=")[1] || src);
          if (clean.startsWith("otpauth://")) {
            sendResponse({ ok: true, url: clean });
            return true;
          }
        } catch {}
      }
      if (dataUrl.startsWith("otpauth://")) {
        sendResponse({ ok: true, url: dataUrl });
        return true;
      }
    }
    sendResponse({ ok: false });
    return true;
  }

  return false;
});
