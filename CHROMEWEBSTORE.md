# Chrome Web Store Listing — KH 2FA

> Last Updated: 2026-09-27

## Store Listing

**Extension Name**
KH 2FA

**Short Description**
Secure 2FA authenticator with encrypted vault, screen QR code scanner, and OTP autofill.

**Detailed Description**
KH 2FA is a fast, lightweight, and completely private two-factor authentication (2FA / TOTP) manager for your browser. It safeguards your accounts with client-side AES-256-GCM encryption, eliminating the need to reach for your mobile phone every time you log in.

KEY FEATURES
- Client-Side Encrypted Vault: All your 2FA secrets are encrypted locally using AES-256-GCM and PBKDF2 (150,000 rounds) derived from your personal PIN. Your decrypted keys never touch disk unencrypted.
- 1-Click Screen QR Scanner: Capture QR codes directly from your browser tab to set up new accounts in seconds without external scanning apps.
- Smart In-Field Autofill: Automatically detects 2FA verification input fields across login pages and fills in your one-time code with a single click.
- Full RFC 6238 & Steam Guard Support: Compatible with standard 6, 7, and 8-digit codes, custom hash algorithms (SHA-1, SHA-256, SHA-512), custom countdown periods (15s, 30s, 60s), and Steam Guard alphanumeric codes.
- Privacy Mask (Peek Mode): Blur your 2FA codes with a single click to protect against shoulder surfing in public places or during screen presentations. Hovering over any card reveals the code instantly.
- Favorite Pinning: Star your most important accounts to keep them pinned at the top of your list.
- Anti-Brute-Force Protection: Automatic rate-limiting lockout temporarily pauses entry attempts after repeated incorrect PIN entries.
- Auto-Lock on Idle & Sleep: Automatically clears sensitive keys from memory and locks the vault whenever your system sleeps or is locked.
- Backup & Restore: Export encrypted backups anytime to keep your authentication keys safe.
- Multiple Themes: Choose between Midnight Cyan, Pure OLED Black, Nord Arctic, and Clean Light.

ZERO CLOUD TRACKING & 100% PRIVATE
KH 2FA works entirely offline on your local device. It does not send your data to external servers, does not use tracking cookies, and includes zero third-party telemetry.

HOW TO USE
1. Click the KH 2FA icon in your browser toolbar and set up a master PIN.
2. Add your 2FA accounts by scanning a screen QR code, uploading an image, or typing/pasting your secret key.
3. Click any account card to copy its one-time code, or use the autofill button directly on login pages.

**Category**
Productivity

**Single Purpose**
Generates and autofills time-based two-factor authentication codes from a locally encrypted vault.

**Primary Language**
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Notes |
|-------|-----------|--------|-------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To Capture | Main vault view showing active TOTP cards & progress rings |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To Capture | 1-Click Screen QR code scanner in action |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To Capture | In-field autofill feature on login verification page |
| Screenshot 4 [RECOMMENDED] | 1280×800 | ⬜ To Capture | Privacy Mask (Peek Mode) blurring codes |
| Screenshot 5 [RECOMMENDED] | 1280×800 | ⬜ To Capture | Theme switcher (OLED Black & Nord Arctic) |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To Create | Promotional graphic tile for Chrome Web Store search |
| Marquee Promo Tile | 1400×560 | ⬜ To Create | Header banner for featured placement |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Stores the client-side encrypted vault and user preferences (such as auto-lock timer and theme) locally in `chrome.storage.local`. |
| `activeTab` | permissions | Allows the user to autofill 2FA codes and trigger screen QR scanning on the currently focused web page upon direct user action. |
| `downloads` | permissions | Enables users to save their exported encrypted backup file (`KH-2FA-backup-*.json`) directly to their local Downloads directory. |
| `tabs` | permissions | Used to capture the active tab for QR code scanning (`chrome.tabs.captureVisibleTab`) and to match domain names for autofilling 2FA codes. |
| `contextMenus` | permissions | Adds a convenient right-click context menu item ("Fill 2FA code with KH 2FA") on editable fields for fast code entry. |
| `idle` | permissions | Detects when the user locks their workstation or the screen goes idle (`chrome.idle.onStateChanged`) to immediately auto-lock the vault and protect user privacy. |
| `<all_urls>` | content_scripts | Enables the lightweight content script to detect 2FA/OTP input fields across any authentication webpage where the user needs to log in. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | None | No |
| Health info | No | No | None | No |
| Financial info | No | No | None | No |
| Authentication info (TOTP secrets) | Stored locally only | No (Never transmitted) | Kept in local AES-256 encrypted vault for generating 2FA codes | No |
| Personal communications | No | No | None | No |
| Location | No | No | None | No |
| Web history | No | No | None | No |
| User activity | No | No | None | No |
| Website content | No | No | None | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL**: `https://github.com/pov-pisal/KH-2FA/blob/main/PRIVACY.md`

*(Host this file publicly in your GitHub repository or on GitHub Pages)*

---

## Distribution

- **Visibility**: Public
- **Regions**: All regions

---

## Developer Info

- **Publisher Name**: Pov Pisal
- **Contact Email**: povpisal.dev@gmail.com
- **Support URL / Email**: `https://github.com/pov-pisal/KH-2FA/issues`
- **Homepage URL**: `https://github.com/pov-pisal/KH-2FA`

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1.0 | 2026-09-27 | Screen QR scanner, privacy peek mask, brute-force PIN lockout, system idle auto-lock, star favorites, RFC 6238 TOTP engine (SHA-256/512, Steam Guard, custom periods), OLED and Nord themes. | Ready to publish |
| 1.0.0 | 2026-09-14 | Initial release with AES-256-GCM encrypted vault, TOTP generator, PIN lock, backup/export, and in-field autofill. | Published |
