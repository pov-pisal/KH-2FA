# render-screenshots.ps1 — Renders 5 high-resolution 1280x800 Store Screenshots via Chrome Headless

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$destDir = Join-Path (Get-Location) "store-assets"
$templateDir = Join-Path $destDir "templates"
$tempStageDir = Join-Path $env:TEMP "chrome-render-screenshots-$(Get-Random)"
New-Item -ItemType Directory -Path $tempStageDir -Force | Out-Null

$tempProfile = Join-Path $env:TEMP "chrome-profile-screenshots-$(Get-Random)"
New-Item -ItemType Directory -Path $tempProfile -Force | Out-Null

Write-Host "Rendering 5 Chrome Web Store Screenshots (1280x800)..." -ForegroundColor Cyan

function Capture-Screenshot {
    param(
        [string]$TemplateName,
        [string]$OutputFilename,
        [string]$AliasFilename = ""
    )

    $srcHtml = Join-Path $templateDir $TemplateName
    if (!(Test-Path $srcHtml)) {
        Write-Host "Skipping $OutputFilename (Template $TemplateName not found)" -ForegroundColor Yellow
        return
    }

    $stagedHtml = Join-Path $tempStageDir $TemplateName
    $stagedPng = Join-Path $tempStageDir $OutputFilename
    $finalPng = Join-Path $destDir $OutputFilename

    Copy-Item $srcHtml $stagedHtml -Force

    if (Test-Path $finalPng) { Remove-Item $finalPng -Force }
    if (Test-Path $stagedPng) { Remove-Item $stagedPng -Force }

    $args = @(
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--user-data-dir=$tempProfile",
        "--screenshot=$stagedPng",
        "--window-size=1280,800",
        "$stagedHtml"
    )

    Start-Process -FilePath $chromePath -ArgumentList $args -Wait

    if (Test-Path $stagedPng) {
        Copy-Item $stagedPng $finalPng -Force
        if ($AliasFilename -ne "") {
            $aliasPath = Join-Path $destDir $AliasFilename
            Copy-Item $stagedPng $aliasPath -Force
        }
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile($finalPng)
        $len = [Math]::Round((Get-Item $finalPng).Length / 1KB, 1)
        Write-Host "SUCCESS: $OutputFilename -> $($img.Width)x$($img.Height) ($len KB)" -ForegroundColor Green
        $img.Dispose()
    } else {
        Write-Host "ERROR: Failed to render $OutputFilename" -ForegroundColor Red
    }
}

# 1. Screenshot 1 - Encrypted TOTP Vault
Capture-Screenshot -TemplateName "template-screenshot-1-vault.html" -OutputFilename "screenshot-1-vault.png" -AliasFilename "screenshot-1-macbook.png"

# 2. Screenshot 2 - 1-Click Screen QR Scanner
Capture-Screenshot -TemplateName "template-screenshot-2-scanner.html" -OutputFilename "screenshot-2-scanner.png" -AliasFilename "screenshot-2-macbook-scanner.png"

# 3. Screenshot 3 - Privacy Mask & PIN Shield
Capture-Screenshot -TemplateName "template-screenshot-3-privacy.html" -OutputFilename "screenshot-3-privacy.png"

# 4. Screenshot 4 - Smart 2FA In-Field Autofill
Capture-Screenshot -TemplateName "template-screenshot-4-autofill.html" -OutputFilename "screenshot-4-autofill.png"

# 5. Screenshot 5 - Custom Themes & Encrypted Backup
Capture-Screenshot -TemplateName "template-screenshot-5-themes.html" -OutputFilename "screenshot-5-themes.png"

# Cleanup
Remove-Item $tempStageDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $tempProfile -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nAll 5 Store Screenshots rendered successfully at 1280x800!" -ForegroundColor Cyan
