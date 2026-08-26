# Builds docs/SUBMISSION.html from SUBMISSION-TEXTS.md, with the UX mockup
# embedded so the file stands alone. Open it in Word, add the screenshots,
# save as PDF.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$md   = Get-Content (Join-Path $here 'SUBMISSION-TEXTS.md') -Encoding UTF8
$img  = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $here 'ux-mockup.png')))

function Inline([string]$s) {
  $s = $s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
  $s = $s -replace '\*\*(.+?)\*\*', '<strong>$1</strong>'
  $s = $s -replace '`(.+?)`', '<code>$1</code>'
  $s = $s -replace '(?<!\*)\*([^*]+?)\*(?!\*)', '<em>$1</em>'
  return $s
}

$out = New-Object System.Text.StringBuilder
$inCode = $false; $inList = $false; $inTable = $false; $tableHeaderDone = $false

foreach ($lineRaw in $md) {
  $line = $lineRaw.TrimEnd()

  if ($line -match '^```') {
    if ($inCode) { [void]$out.AppendLine('</pre>'); $inCode = $false }
    else { [void]$out.AppendLine('<pre>'); $inCode = $true }
    continue
  }
  if ($inCode) {
    [void]$out.AppendLine(($line -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'))
    continue
  }

  # table rows
  if ($line -match '^\|') {
    if ($line -match '^\|[\s\-:|]+\|$') { $tableHeaderDone = $true; continue }
    $cells = ($line -replace '^\|','' -replace '\|$','') -split '\|'
    if (-not $inTable) {
      [void]$out.AppendLine('<table>'); $inTable = $true; $tableHeaderDone = $false
    }
    $tag = if (-not $tableHeaderDone) { 'th' } else { 'td' }
    $row = '<tr>' + (($cells | ForEach-Object { "<$tag>" + (Inline $_.Trim()) + "</$tag>" }) -join '') + '</tr>'
    [void]$out.AppendLine($row)
    continue
  } elseif ($inTable) {
    [void]$out.AppendLine('</table>'); $inTable = $false
  }

  # list items
  if ($line -match '^\s*[-*]\s+(.*)') {
    if (-not $inList) { [void]$out.AppendLine('<ul>'); $inList = $true }
    [void]$out.AppendLine('<li>' + (Inline $Matches[1]) + '</li>')
    continue
  } elseif ($line -match '^\s*\d+\.\s+(.*)') {
    if (-not $inList) { [void]$out.AppendLine('<ul>'); $inList = $true }
    [void]$out.AppendLine('<li>' + (Inline $Matches[1]) + '</li>')
    continue
  } elseif ($inList -and $line -eq '') {
    [void]$out.AppendLine('</ul>'); $inList = $false
    continue
  }

  switch -Regex ($line) {
    '^#### (.*)' { [void]$out.AppendLine('<h4>' + (Inline $Matches[1]) + '</h4>'); break }
    '^### (.*)'  { [void]$out.AppendLine('<h3>' + (Inline $Matches[1]) + '</h3>'); break }
    '^## (.*)'   { [void]$out.AppendLine('<h2>' + (Inline $Matches[1]) + '</h2>'); break }
    '^# (.*)'    { [void]$out.AppendLine('<h1>' + (Inline $Matches[1]) + '</h1>'); break }
    '^={10,}$'   { [void]$out.AppendLine('<div class="brk"></div>'); break }
    '^---+$'     { [void]$out.AppendLine('<hr>'); break }
    '^&gt; (.*)' { [void]$out.AppendLine('<blockquote>' + (Inline $Matches[1]) + '</blockquote>'); break }
    '^> (.*)'    { [void]$out.AppendLine('<blockquote>' + (Inline $Matches[1]) + '</blockquote>'); break }
    '^$'         { break }
    default      { [void]$out.AppendLine('<p>' + (Inline $line) + '</p>') }
  }
}
if ($inList)  { [void]$out.AppendLine('</ul>') }
if ($inTable) { [void]$out.AppendLine('</table>') }
if ($inCode)  { [void]$out.AppendLine('</pre>') }

$body = $out.ToString()

# Drop the mockup in after the UX Concept heading.
$imgTag = '<div class="shot"><img src="data:image/png;base64,' + $img + '" alt="UX mockup"><p class="cap">UX mockup, image-generated. The header name STYLEFIND was rejected; Style Me kept.</p></div>'
$body = $body -replace '(<h2>.*?UX Concept</h2>)', ('$1' + [Regex]::Escape($imgTag).Replace('\','\\'))
if ($body -notmatch 'data:image/png') { $body = $body -replace '(<h2>[^<]*UX Concept[^<]*</h2>)', ('$1' + $imgTag) }
if ($body -notmatch 'data:image/png') { $body = $body + $imgTag }

$html = @"
<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Style Me — Week 0 Submission</title>
<style>
body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;max-width:17cm;margin:0 auto;}
h1{font-size:20pt;margin:0 0 6pt;} h2{font-size:14pt;margin:18pt 0 6pt;border-bottom:1px solid #bbb;padding-bottom:3pt;}
h3{font-size:12pt;margin:14pt 0 4pt;} h4{font-size:11pt;margin:12pt 0 4pt;}
p{margin:0 0 8pt;} ul{margin:0 0 8pt 18pt;padding:0;} li{margin-bottom:4pt;}
table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt;}
th,td{border:1px solid #999;padding:5pt;vertical-align:top;text-align:left;}
th{background:#eee;font-weight:bold;}
pre{background:#f4f4f4;border:1px solid #ddd;padding:8pt;font-family:Consolas,monospace;font-size:9pt;white-space:pre-wrap;margin:8pt 0;}
code{font-family:Consolas,monospace;font-size:9.5pt;background:#f4f4f4;padding:1pt 3pt;}
blockquote{margin:8pt 0 8pt 12pt;padding-left:10pt;border-left:3px solid #999;color:#333;}
hr{border:0;border-top:1px solid #ccc;margin:12pt 0;}
.brk{page-break-before:always;height:0;}
.shot{margin:10pt 0;} .shot img{max-width:11cm;border:1px solid #999;}
.cap{font-size:9pt;color:#555;margin-top:3pt;}
</style></head><body>
$body
<div class="brk"></div>
<h2>Evidence screenshots</h2>
<p><em>Paste the screenshots below this line: live site, GitHub commits, Vercel deployments, Supabase project.</em></p>
</body></html>
"@

$path = Join-Path $here 'SUBMISSION.html'
[IO.File]::WriteAllText($path, $html, (New-Object Text.UTF8Encoding $false))
"Written: $path"
"Size: {0:N0} KB" -f ((Get-Item $path).Length / 1KB)
