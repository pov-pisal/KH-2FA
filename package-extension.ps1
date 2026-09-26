# package-extension.ps1 — Creates a clean ZIP for Chrome Web Store submission

$manifest = Get-Content -Raw manifest.json | ConvertFrom-Json
$version = $manifest.version
$outputZip = "KH-2FA-v$version.zip"
$stageDir = "dist_stage"

if (Test-Path $outputZip) { Remove-Item $outputZip -Force }
if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }

New-Item -ItemType Directory -Path $stageDir | Out-Null
New-Item -ItemType Directory -Path "$stageDir/icons" | Out-Null

# Copy required extension runtime files only
$rootFiles = @(
    "manifest.json",
    "background.js",
    "contentScript.js",
    "crypto.js",
    "totp.js",
    "storage.js",
    "brandIcons.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "backup.html",
    "backup.js",
    "import.html",
    "import.js"
)

foreach ($f in $rootFiles) {
    if (Test-Path $f) {
        Copy-Item $f -Destination $stageDir
    }
}

# Copy icons
Copy-Item "icons/*" -Destination "$stageDir/icons" -Recurse

# Compress staging directory contents
Compress-Archive -Path "$stageDir/*" -DestinationPath $outputZip -CompressionLevel Optimal

# Cleanup staging directory
Remove-Item $stageDir -Recurse -Force

$size = (Get-Item $outputZip).Length / 1KB
Write-Host "Done! Clean store package created: $outputZip ($([Math]::Round($size, 2)) KB)" -ForegroundColor Green
