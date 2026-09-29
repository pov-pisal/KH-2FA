# render-marquee-tiles.ps1 — Renders 5 high-resolution 1400x560 Marquee Promo Tiles via Chrome Headless

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$destDir = Join-Path (Get-Location) "store-assets"
$templateDir = Join-Path $destDir "templates"
$tempStageDir = Join-Path $env:TEMP "chrome-render-marquee-$(Get-Random)"
New-Item -ItemType Directory -Path $tempStageDir -Force | Out-Null

$tempProfile = Join-Path $env:TEMP "chrome-profile-$(Get-Random)"
New-Item -ItemType Directory -Path $tempProfile -Force | Out-Null

Write-Host "Rendering 5 Chrome Web Store Marquee Promo Tiles (1400x560)..." -ForegroundColor Cyan

function Capture-Marquee-Tile {
    param(
        [string]$TemplateName,
        [string]$OutputFilename
    )

    $srcHtml = Join-Path $templateDir $TemplateName
    if (!(Test-Path $srcHtml)) {
        Write-Host "Skipping $OutputFilename (Template $TemplateName not found yet)" -ForegroundColor Yellow
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
        "--window-size=1400,560",
        "$stagedHtml"
    )

    Start-Process -FilePath $chromePath -ArgumentList $args -Wait

    if (Test-Path $stagedPng) {
        Copy-Item $stagedPng $finalPng -Force
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile($finalPng)
        $len = [Math]::Round((Get-Item $finalPng).Length / 1KB, 1)
        Write-Host "SUCCESS: $OutputFilename -> $($img.Width)x$($img.Height) ($len KB)" -ForegroundColor Green
        $img.Dispose()
    } else {
        Write-Host "ERROR: Failed to render $OutputFilename" -ForegroundColor Red
    }
}

# 1. Tile 1 - Encrypted TOTP Vault
Capture-Marquee-Tile -TemplateName "template-marquee-1-vault.html" -OutputFilename "marquee-tile-1.png"

# 2. Tile 2 - 1-Click Screen QR Scanner
Capture-Marquee-Tile -TemplateName "template-marquee-2-scanner.html" -OutputFilename "marquee-tile-2.png"

# 3. Tile 3 - Privacy Mask & PIN Shield
Capture-Marquee-Tile -TemplateName "template-marquee-3-privacy.html" -OutputFilename "marquee-tile-3.png"

# 4. Tile 4 - Smart 2FA In-Field Autofill
Capture-Marquee-Tile -TemplateName "template-marquee-4-autofill.html" -OutputFilename "marquee-tile-4.png"

# 5. Tile 5 - Custom Themes & Encrypted Backup
Capture-Marquee-Tile -TemplateName "template-marquee-5-themes.html" -OutputFilename "marquee-tile-5.png"

# Cleanup
Remove-Item $tempStageDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $tempProfile -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nMarquee Promo Tile rendering complete!" -ForegroundColor Cyan
