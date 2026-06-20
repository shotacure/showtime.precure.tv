Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root  = Split-Path -Parent $PSScriptRoot
$logo  = Join-Path $root 'assets/images/showtime_logo.png'

$blue  = [System.Drawing.Color]::FromArgb(102,153,255)   # #6699FF
$green = [System.Drawing.Color]::FromArgb(102,204,102)   # #66CC66
$ink   = [System.Drawing.Color]::FromArgb(51,51,51)      # #333

function New-RoundedPath([float]$x,[float]$y,[float]$w,[float]$h,[float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x,             $y,             $d, $d, 180, 90)
  $p.AddArc($x + $w - $d,   $y,             $d, $d, 270, 90)
  $p.AddArc($x + $w - $d,   $y + $h - $d,   $d, $d,   0, 90)
  $p.AddArc($x,             $y + $h - $d,   $d, $d,  90, 90)
  $p.CloseFigure()
  return $p
}

# ---- Square brand icon (gradient + white "S") ----
function Save-Icon([int]$size,[string]$out) {
  $bmp = New-Object System.Drawing.Bitmap($size,$size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $rect = New-Object System.Drawing.RectangleF(0,0,$size,$size)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect,$blue,$green,45)
  $radius = [float]($size * 0.22)
  $path = New-RoundedPath 0 0 $size $size $radius
  $g.FillPath($grad,$path)
  $fontSize = [float]($size * 0.62)
  $font = New-Object System.Drawing.Font('Arial Black',$fontSize,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $textRect = New-Object System.Drawing.RectangleF(0, [float]($size * -0.04), $size, $size)
  $g.DrawString('S',$font,$white,$textRect,$sf)
  $bmp.Save((Join-Path $root $out),[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $grad.Dispose(); $path.Dispose(); $font.Dispose(); $white.Dispose()
  Write-Host "wrote $out ($size x $size)"
}

Save-Icon 16  'favicon-16.png'
Save-Icon 32  'favicon-32.png'
Save-Icon 180 'apple-touch-icon.png'
Save-Icon 192 'icon-192.png'
Save-Icon 512 'icon-512.png'

# ---- OGP image (1200 x 630) ----
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W,$H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# gradient background
$bgRect = New-Object System.Drawing.RectangleF(0,0,$W,$H)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect,$blue,$green,45)
$g.FillRectangle($bg,0,0,$W,$H)

# white rounded panel
$panel = New-RoundedPath 56 56 ($W-112) ($H-112) 28
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,255,255,255))),$panel)

# logo
$logoImg = [System.Drawing.Image]::FromFile($logo)
$lw = 780.0; $lh = $lw * $logoImg.Height / $logoImg.Width
$lx = ($W - $lw) / 2; $ly = 120.0
$g.DrawImage($logoImg,$lx,$ly,$lw,$lh)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center

$tagFont = New-Object System.Drawing.Font('Meiryo',44,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('プリキュアの音楽・フォント・作画を研究',$tagFont,(New-Object System.Drawing.SolidBrush($blue)),(New-Object System.Drawing.RectangleF(0,360,$W,80)),$sf)

$subFont = New-Object System.Drawing.Font('Meiryo',28,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('BGM研究本・プリキュアのフォント・漢字練習帳ほか',$subFont,(New-Object System.Drawing.SolidBrush($ink)),(New-Object System.Drawing.RectangleF(0,432,$W,60)),$sf)

$urlFont = New-Object System.Drawing.Font('Arial',34,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('showtime.precure.tv',$urlFont,(New-Object System.Drawing.SolidBrush($green)),(New-Object System.Drawing.RectangleF(0,510,$W,60)),$sf)

$bmp.Save((Join-Path $root 'og-image.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$logoImg.Dispose(); $g.Dispose(); $bmp.Dispose()
Write-Host "wrote og-image.png ($W x $H)"
