Add-Type -AssemblyName System.Drawing

$src1 = "C:\Users\povpi\.gemini\antigravity\brain\edd0653b-5c52-4779-addd-f7e3c93b0462\kh2fa_screenshot_ui_1790444616969.jpg"
$src2 = "C:\Users\povpi\.gemini\antigravity\brain\edd0653b-5c52-4779-addd-f7e3c93b0462\kh2fa_qr_scan_ui_1790444633744.jpg"
$src3 = "C:\Users\povpi\.gemini\antigravity\brain\edd0653b-5c52-4779-addd-f7e3c93b0462\kh2fa_promo_hero_1790444519521.jpg"

$destDir = Join-Path (Get-Location) "store-assets"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

function Resize-And-Save-Image {
    param(
        [string]$SourcePath,
        [int]$TargetWidth,
        [int]$TargetHeight,
        [string]$OutputPath,
        [string]$FitMode = "Fill" # "Fill" (crop to fill) or "Fit" (letterbox)
    )

    $srcImg = [System.Drawing.Image]::FromFile($SourcePath)
    $destBmp = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Background color dark navy (#0B0F19)
    $g.Clear([System.Drawing.Color]::FromArgb(11, 15, 25))

    if ($FitMode -eq "Fill") {
        $scale = [Math]::Max($TargetWidth / $srcImg.Width, $TargetHeight / $srcImg.Height)
        $drawWidth = [int]($srcImg.Width * $scale)
        $drawHeight = [int]($srcImg.Height * $scale)
        $destX = [int](($TargetWidth - $drawWidth) / 2)
        $destY = [int](($TargetHeight - $drawHeight) / 2)
        $g.DrawImage($srcImg, $destX, $destY, $drawWidth, $drawHeight)
    } elseif ($FitMode -eq "Fit") {
        $scale = [Math]::Min($TargetWidth / $srcImg.Width, $TargetHeight / $srcImg.Height)
        $drawWidth = [int]($srcImg.Width * $scale)
        $drawHeight = [int]($srcImg.Height * $scale)
        $destX = [int](($TargetWidth - $drawWidth) / 2)
        $destY = [int](($TargetHeight - $drawHeight) / 2)
        $g.DrawImage($srcImg, $destX, $destY, $drawWidth, $drawHeight)
    } else {
        # Exact stretch
        $g.DrawImage($srcImg, 0, 0, $TargetWidth, $TargetHeight)
    }

    $destBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $destBmp.Dispose()
    $srcImg.Dispose()

    Write-Host "Created: $OutputPath ($TargetWidth x $TargetHeight)" -ForegroundColor Green
}

# 1. Screenshot 1: 1280 x 800
$out1 = Join-Path $destDir "screenshot-1-vault.png"
Resize-And-Save-Image -SourcePath $src1 -TargetWidth 1280 -TargetHeight 800 -OutputPath $out1 -FitMode "Fill"

# 2. Screenshot 2: 1280 x 800
$out2 = Join-Path $destDir "screenshot-2-qr-scanner.png"
Resize-And-Save-Image -SourcePath $src2 -TargetWidth 1280 -TargetHeight 800 -OutputPath $out2 -FitMode "Fill"

# 3. Small Promo Tile: 440 x 280
$out3 = Join-Path $destDir "small-promo-tile.png"
Resize-And-Save-Image -SourcePath $src3 -TargetWidth 440 -TargetHeight 280 -OutputPath $out3 -FitMode "Fill"

# 4. Marquee Promo Tile: 1400 x 560
$out4 = Join-Path $destDir "marquee-promo-tile.png"
Resize-And-Save-Image -SourcePath $src3 -TargetWidth 1400 -TargetHeight 560 -OutputPath $out4 -FitMode "Fill"

Write-Host "All assets generated successfully in store-assets/!" -ForegroundColor Cyan
