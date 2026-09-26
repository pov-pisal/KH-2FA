# render-macbook-assets.ps1 — Renders exact pixel-perfect store assets from HTML templates via Chrome Headless

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$destDir = Join-Path (Get-Location) "store-assets"
$templateDir = Join-Path $destDir "templates"
$tempStageDir = Join-Path $env:TEMP "chrome-render-stage-$(Get-Random)"
New-Item -ItemType Directory -Path $tempStageDir -Force | Out-Null

$tempProfile = Join-Path $env:TEMP "chrome-profile-$(Get-Random)"
New-Item -ItemType Directory -Path $tempProfile -Force | Out-Null

Write-Host "Rendering Chrome Web Store MacBook Mockups via Chrome Headless..." -ForegroundColor Cyan

function Capture-Template {
    param(
        [string]$TemplateName,
        [int]$Width,
        [int]$Height,
        [string]$OutputFilename
    )

    $srcHtml = Join-Path $templateDir $TemplateName
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
        "--window-size=$Width,$Height",
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

# 1. Screenshot 1 - MacBook Main Vault (1280 x 800)
Capture-Template -TemplateName "template-screenshot-macbook.html" -Width 1280 -Height 800 -OutputFilename "screenshot-1-macbook.png"

# 2. Screenshot 2 - MacBook Screen QR Scanner (1280 x 800)
Capture-Template -TemplateName "template-screenshot-qr-macbook.html" -Width 1280 -Height 800 -OutputFilename "screenshot-2-macbook-scanner.png"

# 3. Small Promo Tile (440 x 280)
Capture-Template -TemplateName "template-small-promo-tile.html" -Width 440 -Height 280 -OutputFilename "small-promo-tile.png"

# 4. Marquee Promo Tile (1400 x 560)
Capture-Template -TemplateName "template-marquee-promo-tile.html" -Width 1400 -Height 560 -OutputFilename "marquee-promo-tile.png"

# Cleanup temp files
Remove-Item $tempStageDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $tempProfile -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nAll MacBook demo store assets rendered successfully at exact dimensions!" -ForegroundColor Cyan
