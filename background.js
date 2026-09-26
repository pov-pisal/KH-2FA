import { getVaultRecord, getSession, getMeta, clearSession, updateMeta } from "./storage.js";
import { decryptVault } from "./crypto.js";
import { generateTOTP } from "./totp.js";
import { getBrandInfo } from "./brandIcons.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("KH 2FA installed.");

  // Create context menu for quick 2FA filling
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "atomic_fill_otp",
        title: "Fill 2FA code with KH 2FA",
        contexts: ["editable", "page"],
      });
    });
  }
});

// Auto-lock vault on system lock or idle
if (chrome.idle?.onStateChanged) {
  chrome.idle.onStateChanged.addListener(async (state) => {
    if (state === "locked" || state === "idle") {
      try {
        await clearSession();
        await updateMeta({ locked: true });
        console.log(`KH 2FA: Vault auto-locked due to system state '${state}'.`);
      } catch (err) {
        console.error("Auto-lock failed:", err);
      }
    }
  });
}

// Handle Context Menu clicks
chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "atomic_fill_otp" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_AUTOFILL" }, () => {
      if (chrome.runtime.lastError) {
        // Silently ignore if tab is not injectable
      }
    });
  }
});

// Domain matching helper
function matchesDomain(account, hostname, url) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  const issuer = (account.issuer || "").toLowerCase();
  const label = (account.label || "").toLowerCase();

  // Strip leading www. and split domain
  const hostParts = host.replace(/^www\./, "").split(".");
  const mainDomain = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : hostParts[0];

  if (issuer && (host.includes(issuer) || issuer.includes(mainDomain))) {
    return true;
  }
  if (label && (host.includes(label) || label.includes(mainDomain))) {
    return true;
  }
  return false;
}

// Handle messages from content script & popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "OPEN_POPUP") {
    if (chrome.action?.openPopup) {
      const opts = sender?.tab?.windowId ? { windowId: sender.tab.windowId } : {};
      chrome.action.openPopup(opts)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => {
          console.warn("Could not open popup via chrome.action.openPopup:", err);
          sendResponse({ ok: false, error: err?.message || String(err) });
        });
      return true;
    }
  }

  if (message?.action === "GET_OTP_FOR_PAGE") {
    (async () => {
      try {
        const [vaultRecord, meta, session] = await Promise.all([
          getVaultRecord(),
          getMeta(),
          getSession(),
        ]);

        const timeoutMs = meta?.lockTimeoutMs ?? (2 * 60 * 1000);
        const lastActive = session?.lastActive || meta?.lastActive || 0;
        const isExpired = timeoutMs > 0 && lastActive && (Date.now() - lastActive > timeoutMs);

        if (!vaultRecord) {
          sendResponse({ ok: false, reason: "NO_VAULT" });
          return;
        }

        if (meta?.locked || !session?.pin || isExpired) {
          // Open popup so user can enter PIN
          if (chrome.action?.openPopup) {
            const opts = sender?.tab?.windowId ? { windowId: sender.tab.windowId } : {};
            chrome.action.openPopup(opts).catch(() => {});
          }
          sendResponse({ ok: false, locked: true, reason: "VAULT_LOCKED" });
          return;
        }

        // Decrypt vault using stored session PIN
        const vault = await decryptVault(session.pin, vaultRecord);
        const accounts = vault?.accounts || [];
        if (accounts.length === 0) {
          sendResponse({ ok: false, reason: "EMPTY_VAULT" });
          return;
        }

        const matched = [];
        const others = [];
        const hostname = message.hostname || "";
        const url = message.url || "";

        for (const acc of accounts) {
          const isMatch = matchesDomain(acc, hostname, url);
          const brand = getBrandInfo(acc.issuer, acc.label);
          const code = await generateTOTP(acc.secret, Date.now(), acc);
          const item = {
            id: acc.id,
            issuer: acc.issuer || brand.name || "Account",
            label: acc.label || "",
            code,
            brand: {
              name: brand.name,
              color: brand.color,
              bgColor: brand.bgColor,
              borderColor: brand.borderColor,
              svg: brand.svg,
            },
            isMatch,
          };
          if (isMatch) {
            matched.push(item);
          } else {
            others.push(item);
          }
        }

        sendResponse({
          ok: true,
          locked: false,
          matched,
          others,
          all: [...matched, ...others],
        });
      } catch (err) {
        console.error("GET_OTP_FOR_PAGE error:", err);
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true; // Asynchronous reply
  }

  if (message?.action === "CAPTURE_VISIBLE_TAB") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ ok: false, error: chrome.runtime.lastError?.message || "Failed to capture tab" });
      } else {
        sendResponse({ ok: true, dataUrl });
      }
    });
    return true;
  }

  return false;
});
