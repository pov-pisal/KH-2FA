# 🛡️ KH 2FA

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/pov-pisal/KH-2FA)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

A modern, secure, and private browser extension for managing Two-Factor Authentication (2FA / TOTP) codes with client-side AES-256 encryption, 1-click screen QR scanner, and automatic login autofill.

---

## ✨ Features

- **🔐 Client-Side Encrypted Vault** - All TOTP secrets are encrypted locally using AES-256-GCM with PBKDF2 (150,000 rounds) derived from your personal PIN.
- **📷 1-Click Screen QR Scanner** - Capture QR codes directly from your browser tab or upload an image to add accounts effortlessly without mobile scanning apps.
- **⚡ In-Field Autofill** - Automatically detects 2FA verification fields on login pages and fills codes in 1 click or via keyboard shortcut.
- **⏱️ Full RFC 6238 & Steam Guard** - Supports standard 6, 7, and 8 digits, custom algorithms (SHA-1, SHA-256, SHA-512), custom periods (15s, 30s, 60s), and Steam Guard alphanumeric codes.
- **👁️ Privacy Mask (Peek Mode)** - Conceals codes with a Gaussian blur to protect against shoulder surfing; hovering over any account card reveals the code.
- **⭐ Star / Pin Favorites** - Pin your most important accounts to the top of your vault.
- **🛡️ Anti-Brute-Force Lockout** - Automatic cooldown timer temporarily halts unlock attempts after repeated incorrect PIN entries.
- **💤 System Lock & Idle Protection** - Purges decrypted session keys and locks the vault whenever your machine locks or sleeps.
- **🎨 4 Sleek Themes** - Switch between Midnight Cyan, Pure OLED Black, Nord Arctic, and Clean Light.
- **💾 Encrypted Backup & Restore** - Export or import your accounts anytime.
- **🔍 Quick Search & Hotkeys** - Press `/` to focus search instantly; press `Alt+Shift+A` to launch the extension anywhere.

---

## 🚀 Installation

### From Source (Development / Unpacked)

1. Clone the repository:
   ```bash
   git clone https://github.com/pov-pisal/KH-2FA.git
   cd KH-2FA
   ```
2. Open Chrome, Brave, or Edge and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `KH-2FA` project folder.

---

## 📖 Usage

### First-Time Setup
1. Click the **KH 2FA** icon in your browser toolbar.
2. Create a master PIN (minimum 6 digits) and confirm it.
3. Start adding your 2FA accounts!

### Adding Accounts
- **Screen QR Scan**: Click the **📷** button on the toolbar or inside the Add Account modal while viewing a 2FA setup QR code on screen.
- **Manual Input**: Click **+** (Add Account) to enter your secret key, issuer, and label. You can also paste complete `otpauth://` URLs directly.

### Copying & Autofilling Codes
- Click any account card to copy its one-time code to your clipboard.
- On login pages, click the KH 2FA badge next to the 2FA input field to autofill immediately.

---

## 🔒 Security Architecture

| Parameter | Specification |
|---|---|
| **Encryption** | AES-256-GCM (NIST Approved, authenticated encryption) |
| **Key Derivation** | PBKDF2 with SHA-256 (150,000 iterations) |
| **Salt & Nonce** | Cryptographically secure random 16-byte salt & 12-byte IV |
| **Vault Storage** | Private local browser storage (`chrome.storage.local`) |
| **Session Keys** | In-memory only (`chrome.storage.session`), purged on lock or browser exit |
| **Telemetry / Tracking** | **None.** Zero third-party scripts, zero analytics, zero external network requests |

---

## 📁 Project Structure

```
├── manifest.json          # Chrome Extension Manifest V3 configuration
├── popup.html             # Extension popup user interface
├── popup.css              # Themes, layout, and component styling
├── popup.js               # Vault management, TOTP timers, and UI logic
├── background.js          # Background service worker (auto-lock, context menu, tab capture)
├── contentScript.js       # In-field autofill and QR code extraction
├── crypto.js              # AES-256-GCM and PBKDF2 cryptographic routines
├── totp.js                # RFC 6238 TOTP engine, HMAC-SHA, and Steam Guard
├── storage.js             # Browser storage wrapper (local & session)
├── brandIcons.js          # High-resolution brand SVG icons and colors
├── backup.html / .js      # Standalone vault export/import page
├── CHROMEWEBSTORE.md      # Official Chrome Web Store listing metadata & justifications
├── PRIVACY.md             # Privacy Policy document
└── icons/                 # Extension icons (16px, 32px, 48px, 128px, etc.)
```

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
