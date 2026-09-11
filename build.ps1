# ============================================================
#  STYLE ME - build.ps1
#  Bundles the site into one self-contained HTML file.
#
#    dist/style-me.html  -> full document, opens on double click
#    dist/artifact.html  -> body content only, for publishing
#
#  Run from the project folder:  powershell -File build.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Utf8($path) {
  return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}
function Write-Utf8($path, $text) {
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $text, $enc)
}

$html = Read-Utf8 (Join-Path $root 'index.html')
$css  = Read-Utf8 (Join-Path $root 'css\app.css')

# --- inline the stylesheet ----------------------------------------
$html = $html.Replace('<link rel="stylesheet" href="css/app.css">', "<style>`n$css`n</style>")

# --- inline the scripts, in declared order ------------------------
$scripts = @('materials','figure','garment','data','fit','profile','stylist','store','core','config','db','ui','views','app')
foreach ($name in $scripts) {
  $js = Read-Utf8 (Join-Path $root "js\$name.js")
  $tag = '<script src="js/' + $name + '.js"></script>'
  $html = $html.Replace($tag, "<script>`n$js`n</script>")
}

$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { New-Item -ItemType Directory $dist | Out-Null }

# --- 1. standalone document ---------------------------------------
Write-Utf8 (Join-Path $dist 'style-me.html') $html
Write-Host "dist/style-me.html written"

# --- 2. artifact build: the host supplies doctype/html/head/body ---
$headInner = [regex]::Match($html, '(?s)<head>(.*?)</head>').Groups[1].Value
$bodyInner = [regex]::Match($html, '(?s)<body[^>]*>(.*?)</body>').Groups[1].Value
$bodyInner = $bodyInner -replace '(?s)<noscript>.*?</noscript>', ''

$keep = New-Object System.Text.StringBuilder
foreach ($pattern in @(
  '(?s)<meta charset="[^"]+">',
  '(?s)<title>.*?</title>',
  '(?s)<meta name="description"[^>]*>',
  '(?s)<link rel="preconnect"[^>]*>',
  '(?s)<link rel="stylesheet" href="https://fonts[^>]*>',
  '(?s)<style>.*?</style>')) {
  foreach ($m in [regex]::Matches($headInner, $pattern)) {
    [void]$keep.AppendLine($m.Value)
  }
}

Write-Utf8 (Join-Path $dist 'artifact.html') ($keep.ToString() + "`n" + $bodyInner)
Write-Host "dist/artifact.html written"

$size = [math]::Round((Get-Item (Join-Path $dist 'style-me.html')).Length / 1KB)
Write-Host "Size: $size KB"
