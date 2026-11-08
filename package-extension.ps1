# package-extension.ps1 — Creates a clean ZIP for Chrome Web Store submission

$manifest = Get-Content -Raw manifest.json | ConvertFrom-Json
$version = $manifest.version
$outputZip = "KH-2FA-v$version.zip"

if (Test-Path $outputZip) { Remove-Item $outputZip -Force }

$rootFiles = @(
    "manifest.json",
    "background.js",
    "contentScript.js",
    "crypto.js",
    "totp.js",
    "storage.js",
    "brandIcons.js",
    "passwordGenerator.js",
    "jsQR.js",
    "qrcode.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "backup.html",
    "backup.js",
    "import.html",
    "import.js",
    "icons"
)

# Use Windows built-in tar for fast, lock-free zip creation
tar -a -c -f $outputZip $rootFiles

if (Test-Path $outputZip) {
    $size = [math]::Round((Get-Item $outputZip).Length / 1KB, 2)
    Write-Host "Done! Clean store package created: $outputZip ($size KB)" -ForegroundColor Green
} else {
    Write-Error "Failed to create $outputZip"
}
