# ============================================================
#  STYLE ME - serve.ps1
#  Tiny static dev server. No Node, no Python required.
#      powershell -ExecutionPolicy Bypass -File serve.ps1
#  Then open http://localhost:8123/    (Ctrl+C to stop)
#
#  It also stamps css/js links with a version so the browser does
#  not serve you a stale build while you are working, and accepts
#  POST /snap?name=x to save a PNG into .lab/ (used by lab.html
#  to check rendering).
# ============================================================

param([int]$Port = 8123)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Style Me on http://localhost:$Port/  (root: $root)"

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')

  # --- snapshot sink -------------------------------------------
  if ($ctx.Request.HttpMethod -eq 'POST' -and $rel -eq 'snap') {
    $name = $ctx.Request.QueryString['name']
    if (-not $name) { $name = 'snap' }
    $name = ($name -replace '[^A-Za-z0-9_\-]', '')
    $dir = Join-Path $root '.lab'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory $dir | Out-Null }
    $ms = New-Object System.IO.MemoryStream
    $ctx.Request.InputStream.CopyTo($ms)
    [System.IO.File]::WriteAllBytes((Join-Path $dir "$name.png"), $ms.ToArray())
    $ctx.Response.StatusCode = 200
    $ok = [System.Text.Encoding]::UTF8.GetBytes('saved')
    $ctx.Response.OutputStream.Write($ok, 0, $ok.Length)
    $ctx.Response.Close()
    continue
  }

  # same rewrites as vercel.json
  if ($rel -eq '' -or $rel -eq 'docs' -or $rel -eq 'core') { $rel = 'index.html' }
  $path = Join-Path $root $rel

  # never serve anything outside the project folder
  $full = [System.IO.Path]::GetFullPath($path)
  if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root))) {
    $ctx.Response.StatusCode = 403
    $ctx.Response.Close()
    continue
  }

  $ctx.Response.Headers.Add('Cache-Control', 'no-store, must-revalidate')

  if (Test-Path $full -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })

    if ($ext -eq '.html') {
      $v = [DateTime]::UtcNow.Ticks
      $text = [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
      $text = $text -replace 'href="(css/[^"]+)"', ('href="$1?v=' + $v + '"')
      $text = $text -replace 'src="(js/[^"]+)"',   ('src="$1?v='  + $v + '"')
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    } else {
      $bytes = [System.IO.File]::ReadAllBytes($full)
    }

    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes('404')
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.Close()
}
