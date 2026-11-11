// emergency-kit.js — Populates the Emergency Recovery Sheet
import { qrcode } from "./qrcode.js";

document.addEventListener("DOMContentLoaded", async () => {
  const dateEl = document.getElementById("kitCreatedDate");
  const qrContainer = document.getElementById("kitQrContainer");
  const inventoryList = document.getElementById("inventoryList");
  const inventoryTitle = document.getElementById("inventoryTitle");

  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  try {
    const data = await chrome.storage.local.get(["vault", "sync_vault_meta", "session_data"]);
    const vaultRecord = data.vault;
    const session = data.session_data;

    if (!vaultRecord) {
      if (qrContainer) qrContainer.innerHTML = "<span style='color:#ef4444;font-size:11px;'>No vault record found</span>";
      return;
    }

    // 1. Render Encrypted Backup QR code
    const rawStr = "khsync:" + btoa(unescape(encodeURIComponent(JSON.stringify(vaultRecord))));
    try {
      let qr;
      try {
        qr = qrcode(0, "M");
        qr.addData(rawStr);
        qr.make();
      } catch {
        qr = qrcode(0, "L");
        qr.addData(rawStr);
        qr.make();
      }
      if (qrContainer) qrContainer.innerHTML = qr.createSvgTag(3, 2);
    } catch (e) {
      if (qrContainer) qrContainer.innerHTML = "<span style='font-size:10px;color:#64748b;'>Vault too large for single QR. Use export file.</span>";
    }

    // 2. Render Inventory if decrypted in session, or show counts
    let accountsCount = 0;
    let passwordsCount = 0;
    const items = [];

    if (session && session.accounts) {
      accountsCount = session.accounts.length;
      session.accounts.forEach((acc) => items.push(`🔑 ${acc.issuer || "2FA"}: ${acc.label || ""}`));
    }
    if (session && session.passwords) {
      passwordsCount = session.passwords.length;
      session.passwords.forEach((pw) => items.push(`🔒 ${pw.title || pw.username || "Password"}`));
    }

    if (items.length > 0) {
      if (inventoryTitle) {
        inventoryTitle.textContent = `Protected Accounts (${accountsCount} 2FA Tokens, ${passwordsCount} Passwords)`;
      }
      if (inventoryList) {
        inventoryList.innerHTML = items.map((it) => `<span class="inventory-tag">${it}</span>`).join("");
      }
    } else {
      if (inventoryTitle) inventoryTitle.textContent = "Vault Status";
      if (inventoryList) {
        inventoryList.innerHTML = `<span class="inventory-tag">Encrypted Vault Protected with Master PIN</span>`;
      }
    }
  } catch (err) {
    console.error("Emergency kit load error:", err);
  }
});
