# Builds the Week 1 submission PDF, with no Word and no PDF library:
#   1. the markdown documents of this folder -> one HTML file, images embedded
#   2. headless Edge prints that file to PDF
#
#   powershell -ExecutionPolicy Bypass -File docs\week-1\make-submission.ps1
#
# Commits and deployments are read live (git log, GitHub API), so the PDF
# states what actually happened rather than what someone typed.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $here '..\..')
$live = 'https://style-me-five.vercel.app/core'
$repo = 'https://github.com/eugenetriniac-png/style-me'
$video = if ($env:DEMO_VIDEO_URL) { $env:DEMO_VIDEO_URL } else { 'to be added before submission' }
$since = '2026-09-10'

function Esc([string]$s) { $s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' }

function Inline([string]$s) {
  $s = Esc $s
  $s = $s -replace '\[([^\]]+)\]\((https?://[^)]+)\)', '<a href="$2">$1</a>'
  $s = $s -replace '\[([^\]]+)\]\(([^)]+)\)', '$1'
  $s = $s -replace '\*\*(.+?)\*\*', '<strong>$1</strong>'
  $s = $s -replace '`(.+?)`', '<code>$1</code>'
  $s = $s -replace '(?<![\*\w])\*([^*]+?)\*(?![\*\w])', '<em>$1</em>'
  return $s
}

function Img([string]$file, [string]$caption) {
  $path = Join-Path $here $file
  if (-not (Test-Path $path)) { return '<p class="missing">Missing image: ' + (Esc $file) + '</p>' }
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
  return '<figure class="shot"><img src="data:image/png;base64,' + $b64 + '" alt="' + (Esc $caption) +
    '"><figcaption>' + (Inline $caption) + '</figcaption></figure>'
}

# A small markdown reader: enough for these documents. Lines are grouped
# into blocks first — paragraphs, list items with their continuation
# lines, quotes, tables, code — then each block is rendered once.
function ConvertFrom-Md([string]$file) {
  $lines = Get-Content (Join-Path $here $file) -Encoding UTF8
  $blocks = New-Object System.Collections.ArrayList
  $cur = $null
  $inCode = $false

  foreach ($raw in $lines) {
    $line = $raw.TrimEnd()
    if ($inCode) {
      if ($line -match '^```') { $inCode = $false; $cur = $null } else { [void]$cur.lines.Add($line) }
      continue
    }
    if ($line -match '^```') { $cur = @{ t = 'code'; lines = (New-Object System.Collections.ArrayList) }; [void]$blocks.Add($cur); $inCode = $true; continue }
    if ($line -eq '') { $cur = $null; continue }
    if ($line -match '^(#{1,4}) (.*)') { [void]$blocks.Add(@{ t = 'h' + $Matches[1].Length; text = $Matches[2] }); $cur = $null; continue }
    if ($line -match '^---+$') { [void]$blocks.Add(@{ t = 'hr' }); $cur = $null; continue }
    if ($line -match '^!\[([^\]]*)\]\(([^)]+)\)') { [void]$blocks.Add(@{ t = 'img'; alt = $Matches[1]; src = $Matches[2] }); $cur = $null; continue }
    if ($line -match '^\|') {
      if (-not $cur -or $cur.t -ne 'table') { $cur = @{ t = 'table'; lines = (New-Object System.Collections.ArrayList) }; [void]$blocks.Add($cur) }
      [void]$cur.lines.Add($line); continue
    }
    if ($line -match '^\s*([-*]|\d+\.)\s+(.*)') {
      $kind = if ($Matches[1] -match '\d') { 'ol' } else { 'ul' }
      $cur = @{ t = 'li'; kind = $kind; text = $Matches[2] }; [void]$blocks.Add($cur); continue
    }
    if ($line -match '^>\s?(.*)') {
      if (-not $cur -or $cur.t -ne 'quote') { $cur = @{ t = 'quote'; text = '' }; [void]$blocks.Add($cur) }
      $cur.text += ' ' + $Matches[1]; continue
    }
    if ($cur -and ($cur.t -eq 'p' -or $cur.t -eq 'li')) { $cur.text += ' ' + $line.Trim(); continue }
    $cur = @{ t = 'p'; text = $line }; [void]$blocks.Add($cur)
  }

  $out = New-Object System.Text.StringBuilder
  $openList = $null
  foreach ($b in $blocks) {
    if ($openList -and ($b.t -ne 'li' -or $b.kind -ne $openList)) { [void]$out.AppendLine("</$openList>"); $openList = $null }
    switch ($b.t) {
      'li'    { if (-not $openList) { $openList = $b.kind; [void]$out.AppendLine("<$openList>") }
                [void]$out.AppendLine('<li>' + (Inline $b.text) + '</li>') }
      'p'     { [void]$out.AppendLine('<p>' + (Inline $b.text) + '</p>') }
      'quote' { [void]$out.AppendLine('<blockquote>' + (Inline $b.text.Trim()) + '</blockquote>') }
      'hr'    { [void]$out.AppendLine('<hr>') }
      'img'   { [void]$out.AppendLine((Img $b.src $b.alt)) }
      'code'  { [void]$out.AppendLine('<pre>' + (($b.lines | ForEach-Object { Esc $_ }) -join "`n") + '</pre>') }
      'table' {
        [void]$out.AppendLine('<table>')
        $head = $true
        foreach ($row in $b.lines) {
          if ($row -match '^\|[\s\-:|]+\|$') { $head = $false; continue }
          $cells = ($row -replace '^\|', '' -replace '\|$', '') -split '\|'
          $tag = if ($head) { 'th' } else { 'td' }
          [void]$out.AppendLine('<tr>' + (($cells | ForEach-Object { "<$tag>" + (Inline $_.Trim()) + "</$tag>" }) -join '') + '</tr>')
        }
        [void]$out.AppendLine('</table>')
      }
      default { [void]$out.AppendLine("<$($b.t)>" + (Inline $b.text) + "</$($b.t)>") }
    }
  }
  if ($openList) { [void]$out.AppendLine("</$openList>") }
  return $out.ToString()
}

# ---------- evidence read live -------------------------------------
Push-Location $root
# A bare date means "that day, at the current time of day" to git: say midnight.
$commits = git log --since="$since 00:00" --reverse --format='%h|%ad|%s' --date=format:'%d %b %H:%M'
Pop-Location
$commitRows = ($commits | ForEach-Object {
  $c = $_ -split '\|', 3
  '<tr><td><code>' + $c[0] + '</code></td><td>' + $c[1] + '</td><td>' + (Esc $c[2]) + '</td></tr>'
}) -join "`n"

$deployRows = ''
$deployCount = 0
try {
  $h = @{ 'User-Agent' = 'style-me-submission' }
  $deps = Invoke-RestMethod -Uri 'https://api.github.com/repos/eugenetriniac-png/style-me/deployments?per_page=30' -Headers $h -TimeoutSec 20
  $deps = @($deps | Where-Object { $_.created_at -ge $since } | Sort-Object created_at)
  foreach ($d in $deps) {
    $st = Invoke-RestMethod -Uri $d.statuses_url -Headers $h -TimeoutSec 20
    $state = if ($st.Count) { $st[0].state } else { 'pending' }
    $local = [DateTimeOffset]::Parse($d.created_at).ToLocalTime().ToString('dd MMM HH:mm')
    $deployRows += '<tr><td><code>' + $d.sha.Substring(0, 7) + '</code></td><td>' + $local +
      '</td><td>' + $d.environment + '</td><td>' + $state + '</td><td>' + $d.creator.login + '</td></tr>' + "`n"
    $deployCount++
  }
} catch { $deployRows = '<tr><td colspan="5">GitHub API unreachable when this PDF was built: ' + (Esc $_.Exception.Message) + '</td></tr>' }

$commitCount = @($commits).Count

# ---------- assemble ------------------------------------------------
$packet = ConvertFrom-Md 'build-discipline-packet.md'
$mock = Img 'ux-mockup.png' 'Wireframe of `/core`, drawn as HTML and rendered to PNG by headless Edge.'
$packet = $packet -replace '(<h2>[^<]*UX Concept[^<]*</h2>)', ('$1' + $mock.Replace('$', '$$'))

$sections = @(
  $packet,
  '<div class="brk"></div><h1>Build evidence — commits and deployments</h1>' +
    "<p>Read from <code>git log</code> and the GitHub deployments API when this PDF was built. $commitCount commits and $deployCount Vercel deployments since $since.</p>" +
    '<h2>Commits</h2><table><tr><th>Commit</th><th>Local time</th><th>Message</th></tr>' + $commitRows + '</table>' +
    '<h2>Vercel deployments</h2><p>Recorded on GitHub by the Vercel integration; times are local, like the commits.</p>' +
    '<table><tr><th>Commit</th><th>Created</th><th>Environment</th><th>Status</th><th>By</th></tr>' + $deployRows + '</table>',
  '<div class="brk"></div>' + (ConvertFrom-Md 'supabase-evidence.md'),
  '<div class="brk"></div>' + (ConvertFrom-Md 'test-evidence.md'),
  '<div class="brk"></div>' + (ConvertFrom-Md 'prompt-log.md'),
  '<div class="brk"></div>' + (ConvertFrom-Md '..\prompt-library.md'),
  '<div class="brk"></div>' + (ConvertFrom-Md 'human-decision-note.md')
)

$cover = @"
<section class="cover">
<p class="kick">AI-101 · Free-Stack Agentic Builder Studio · Week 1</p>
<h1 class="title">Generative Core Agent</h1>
<p class="sub">Style Me — the Style Core module</p>
<p class="who">Eugène Triniac · 10 September 2026</p>
<table class="links">
<tr><th>Live page</th><td><a href="$live">$live</a></td></tr>
<tr><th>Repository</th><td><a href="$repo">$repo</a></td></tr>
<tr><th>Demo video</th><td>$(Esc $video)</td></tr>
</table>
<h2>What is in this packet</h2>
<table>
<tr><th>Required evidence</th><th>Where</th></tr>
<tr><td>Build Discipline Packet, before coding</td><td>Section 1 — committed as <code>9f4df8a</code>, before the first line of Week 1 code</td></tr>
<tr><td>UX mockup / wireframe</td><td>Section 1, UX Concept</td></tr>
<tr><td>Product spec, acceptance criteria, architecture</td><td>Section 1</td></tr>
<tr><td>GitHub commits (min. 5)</td><td>Section 2 — $commitCount</td></tr>
<tr><td>Vercel deployments (min. 2)</td><td>Section 2 — $deployCount</td></tr>
<tr><td>Supabase evidence — table <code>core_outputs</code></td><td>Section 3</td></tr>
<tr><td>Tests (min. 3) and iteration log</td><td>Section 4</td></tr>
<tr><td>Coding-agent prompt log (min. 5)</td><td>Section 5</td></tr>
<tr><td>Prompt library entry</td><td>Section 6, and live on <code>/docs</code></td></tr>
<tr><td>Human decision note</td><td>Section 7</td></tr>
</table>
</section>
"@

$html = @"
<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Style Me — Week 1 Submission — Eugène Triniac</title>
<style>
@page { size: A4; margin: 16mm 15mm; }
body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#111;margin:0;}
h1{font-size:19pt;margin:0 0 8pt;} h2{font-size:13.5pt;margin:16pt 0 6pt;border-bottom:1px solid #bbb;padding-bottom:3pt;page-break-after:avoid;}
h3{font-size:11.5pt;margin:12pt 0 4pt;page-break-after:avoid;} h4{font-size:10.5pt;margin:10pt 0 4pt;}
p{margin:0 0 7pt;} ul,ol{margin:0 0 8pt 16pt;padding:0;} li{margin-bottom:3pt;}
table{border-collapse:collapse;width:100%;margin:6pt 0 10pt;font-size:9.5pt;page-break-inside:auto;}
tr{page-break-inside:avoid;}
th,td{border:1px solid #999;padding:4pt 5pt;vertical-align:top;text-align:left;}
th{background:#eee;}
pre{background:#f4f4f4;border:1px solid #ddd;padding:7pt;font-family:Consolas,monospace;font-size:8.3pt;white-space:pre-wrap;margin:6pt 0 10pt;page-break-inside:avoid;}
code{font-family:Consolas,monospace;font-size:9pt;background:#f2f2f2;padding:0 2pt;}
blockquote{margin:6pt 0 8pt 10pt;padding-left:9pt;border-left:3px solid #999;color:#333;}
hr{border:0;border-top:1px solid #ccc;margin:10pt 0;}
a{color:#1d3fbb;}
.brk{page-break-before:always;height:0;}
.shot{margin:8pt 0 12pt;page-break-inside:avoid;} .shot img{max-width:100%;max-height:170mm;border:1px solid #999;}
figcaption{font-size:8.5pt;color:#555;margin-top:3pt;}
.missing{color:#b00;font-weight:bold;}
.cover{padding-top:30mm;} .kick{font-size:9pt;letter-spacing:.14em;text-transform:uppercase;color:#555;}
.title{font-size:30pt;margin:4pt 0 2pt;} .sub{font-size:14pt;color:#333;} .who{margin-bottom:16pt;}
.links th{width:28mm;}
</style></head><body>
$cover
<div class="brk"></div>
$($sections -join "`n")
</body></html>
"@

$htmlPath = Join-Path $here 'SUBMISSION.html'
[IO.File]::WriteAllText($htmlPath, $html, (New-Object Text.UTF8Encoding $false))

$pdf = Join-Path $root 'Style-Me-Week1-Eugene-Triniac.pdf'
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
$profileDir = Join-Path $env:TEMP ('edge-pdf-' + [Guid]::NewGuid())
# Edge logs harmless noise on stderr; under 'Stop' PowerShell 5.1 would treat it as fatal.
$ErrorActionPreference = 'Continue'
& $edge --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$profileDir" --print-to-pdf="$pdf" ('file:///' + ($htmlPath -replace '\\', '/')) 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
Start-Sleep -Seconds 2

"HTML: $htmlPath"
"PDF:  $pdf ({0:N0} KB)" -f ((Get-Item $pdf).Length / 1KB)
"Commits: $commitCount   Deployments: $deployCount"
