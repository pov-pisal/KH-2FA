# Privacy Policy for KH 2FA

Last updated: September 27, 2026

**KH 2FA** is committed to protecting your privacy and security. This Privacy Policy describes how KH 2FA handles your data.

## 1. Zero Data Collection & Off-Device Transmission
KH 2FA does **not** collect, track, transmit, or share any personal data, browsing history, device identifiers, or analytics.

- **No Remote Servers**: KH 2FA operates 100% locally in your browser. It does not communicate with external servers, databases, or cloud infrastructure.
- **No Third-Party Analytics**: There are no tracking scripts, telemetry, advertisement networks, or cookies included.
- **No Data Selling**: We do not sell, rent, or monetize your information in any way.

## 2. How Your Data Is Handled Locally

- **TOTP Authentication Secrets**: When you add a 2FA account, the secret key is encrypted on your device using AES-256-GCM with a cryptographic key derived via PBKDF2 (150,000 iterations) from your personal PIN. The encrypted ciphertext is stored strictly within your browser's private local extension storage (`chrome.storage.local`).
- **Decrypted In-Memory Keys**: When you unlock your vault with your PIN, keys are held temporarily in memory using `chrome.storage.session`. They are cleared immediately upon manual lock, automatic inactivity timeout, system sleep/lock, or browser closure.
- **Backups**: If you choose to export your vault, the backup file is generated locally and downloaded directly to your local device.

## 3. Permissions Usage

KH 2FA requests only the minimal browser permissions necessary to provide its core features:
- `storage`: To save your encrypted vault and UI preferences locally on your machine.
- `activeTab`: To allow in-field autofill and screen QR scanning when explicitly requested.
- `downloads`: To save your exported backup file to your local computer.
- `tabs`: To capture the visible tab for 1-click screen QR scanning and match domains for autofill.
- `contextMenus`: To offer a convenient right-click menu item for filling 2FA codes.
- `idle`: To detect when your computer locks or sleeps so your vault locks automatically.

## 4. User Rights and Data Deletion
Because all data resides exclusively on your local machine, you have complete ownership and control:
- You can add, edit, or delete individual accounts at any time inside the extension.
- Uninstalling the KH 2FA extension from your browser immediately and permanently erases all stored data, encrypted vaults, and preferences from your system.

## 5. Contact
If you have any questions or feedback regarding this Privacy Policy, please open an issue on GitHub:
- **Repository**: [https://github.com/pov-pisal/KH-2FA](https://github.com/pov-pisal/KH-2FA)
- **Contact Email**: povpisal.dev@gmail.com
