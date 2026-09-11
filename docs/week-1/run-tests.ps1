# ============================================================
#  Style Me - Week 1 - scripted self-tests against the LIVE site
#
#    powershell -ExecutionPolicy Bypass -File docs\week-1\run-tests.ps1
#
#  No Node, no Playwright on this machine, so this drives headless Edge
#  directly over the Chrome DevTools Protocol from PowerShell. A fresh
#  browser profile every run: the visitor has never taken the style
#  test, which is also what a grader opening /core would be.
#
#  Writes docs/week-1/evidence/*.png and evidence/results.json.
#  Tests 1-3 each save one row to Supabase: that is the point.
# ============================================================

param([string]$Base = 'https://style-me-five.vercel.app')

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $here 'evidence'
if (-not (Test-Path $out)) { New-Item -ItemType Directory $out | Out-Null }

# ---------- browser ---------------------------------------------------
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
$port = 9300 + (Get-Random -Maximum 400)
$profileDir = Join-Path $env:TEMP ('sm-test-' + [Guid]::NewGuid())
$proc = Start-Process $edge -PassThru -ArgumentList @('--headless=new', '--disable-gpu', '--hide-scrollbars',
  "--remote-debugging-port=$port", '--remote-allow-origins=*', "--user-data-dir=$profileDir",
  '--window-size=1280,900', 'about:blank')

$page = $null
for ($i = 0; $i -lt 50 -and -not $page; $i++) {
  Start-Sleep -Milliseconds 200
  try { $page = (Invoke-RestMethod "http://127.0.0.1:$port/json/list") | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
}
if (-not $page) { throw 'Edge did not open a debugging port' }

$ct = [Threading.CancellationToken]::None
$ws = New-Object System.Net.WebSockets.ClientWebSocket
[void]$ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, $ct).GetAwaiter().GetResult()
$script:seq = 0
$buf = New-Object byte[] 4194304

function Cdp([string]$method, $params = @{}) {
  $script:seq++
  $id = $script:seq
  $json = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 20 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  [void]$ws.SendAsync((New-Object ArraySegment[byte] -ArgumentList @(, $bytes)), 'Text', $true, $ct).GetAwaiter().GetResult()
  while ($true) {
    $ms = New-Object IO.MemoryStream
    do {
      $r = $ws.ReceiveAsync((New-Object ArraySegment[byte] -ArgumentList @(, $buf)), $ct).GetAwaiter().GetResult()
      $ms.Write($buf, 0, $r.Count)
    } while (-not $r.EndOfMessage)
    $text = [Text.Encoding]::UTF8.GetString($ms.ToArray())
    # Replies start with their id; events start with "method" and can
    # carry nested "id" keys of their own, so only the prefix counts.
    if (-not $text.StartsWith('{"id":' + $id + ',')) { continue }
    if ($text.StartsWith('{"id":' + $id + ',"error"')) { throw "CDP $method failed: $text" }
    return $text
  }
}

# Runs JavaScript in the page; the expression must produce a string (use JSON.stringify).
function Js([string]$expr) {
  $raw = Cdp 'Runtime.evaluate' @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
  $obj = $raw | ConvertFrom-Json
  if ($obj.result.exceptionDetails) { throw ('JS error: ' + $obj.result.exceptionDetails.exception.description) }
  return $obj.result.result.value
}

function Viewport([int]$w, [int]$h, [bool]$mobile = $false) {
  [void](Cdp 'Emulation.setDeviceMetricsOverride' @{ width = $w; height = $h; deviceScaleFactor = 1; mobile = $mobile })
}

function Go([string]$path) {
  [void](Cdp 'Page.navigate' @{ url = $Base + $path })
  Start-Sleep -Milliseconds 400
  [void](Js 'new Promise(r => { const t0 = Date.now(); const t = setInterval(() => { if ((window.SM && SM.views && document.querySelector("#screen")) || Date.now() - t0 > 15000) { clearInterval(t); r("ok"); } }, 100); })')
  [void](Js $helpers)
}

function SavePng([string]$raw, [string]$name) {
  $m = [regex]::Match($raw, '"data":"([^"]+)"')
  [IO.File]::WriteAllBytes((Join-Path $out "$name.png"), [Convert]::FromBase64String($m.Groups[1].Value))
  "  saved evidence/$name.png"
}

# Screenshot of one element, with some margin, wherever it is on the page.
function ShotEl([string]$selector, [string]$name, [int]$pad = 16) {
  $rect = (Js "JSON.stringify((() => { const r = document.querySelector('$selector').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })())") | ConvertFrom-Json
  $clip = @{ x = [math]::Max(0, $rect.x - $pad); y = [math]::Max(0, $rect.y - $pad); width = $rect.w + 2 * $pad; height = $rect.h + 2 * $pad; scale = 1 }
  SavePng (Cdp 'Page.captureScreenshot' @{ format = 'png'; captureBeyondViewport = $true; clip = $clip }) $name
}

function ShotPage([string]$name, [int]$w, [bool]$mobile = $false) {
  $h = [int](Js 'String(document.documentElement.scrollHeight)')
  $clip = @{ x = 0; y = 0; width = $w; height = $h; scale = 1 }
  SavePng (Cdp 'Page.captureScreenshot' @{ format = 'png'; captureBeyondViewport = $true; clip = $clip }) $name
}

$helpers = @'
window.__t = {
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  async waitFor(fn, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await new Promise(r => setTimeout(r, 100)); }
    return null;
  },
  fill(text, occasion, budget, label) {
    const ta = document.querySelector('#coreText'); ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-occasion="' + occasion + '"]').click();
    document.querySelector('[data-budget="' + (budget || 'none') + '"]').click();
    const l = document.querySelector('#coreLabel'); l.value = label || ''; l.dispatchEvent(new Event('input', { bubbles: true }));
  },
  generate() { document.querySelector('#coreForm button[type=submit]').click(); },
  /* What the card dresses the person in, read from the engine's own
     result: the Round 1 checks looked at the axes and never at the
     clothes, which is how a green cardigan got past "never colour". */
  outfit(text, occasion, budget) {
    const r = SM.core.extract({ text, occasion, budget });
    return { items: r.outfit.items.map(i => ({ name: i.name, brand: i.brand, family: i.family, category: i.category, price: i.price })),
      named: r.outfit.named.map(p => p.label), missed: r.outfit.missed.map(p => p.label),
      offColour: r.outfit.offColour.map(i => i.name), allowed: r.outfit.colours };
  },
  card() {
    const c = document.querySelector('.core-card'); if (!c) return null;
    return {
      arch: c.querySelector('.core-arch').textContent,
      kicker: c.querySelector('.kicker').textContent,
      top: [...c.querySelectorAll('.axis-label')].map(x => x.textContent),
      signals: [...c.querySelectorAll('.core-signals .core-sig')].map(s => (s.classList.contains('neg') ? '[neg] ' : '') + s.textContent),
      meta: c.querySelector('.core-meta').textContent,
      thesis: c.querySelector('.core-thesis').textContent,
      pieces: [...c.querySelectorAll('.credit-name')].map(x => x.textContent)
    };
  },
  dashReady() { const d = document.querySelector('#coreDash'); return d && !/Loading/.test(d.innerText) && d.innerText.trim().length > 12; },
  total() { const s = document.querySelector('.core-total strong'); return s ? +s.textContent : 0; },
  firstMini() { const m = document.querySelector('.core-mini'); return m ? m.innerText.replace(/\n+/g, ' | ') : null; },
  async save() {
    const b = document.querySelector('#coreSave'); b.click(); b.click();          // a double click must still make one row
    const msg = await this.waitFor(() => { const m = document.querySelector('#coreSaveMsg'); return m && m.textContent ? m.textContent : null; });
    await this.waitFor(() => this.dashReady());
    await this.sleep(2700);          // let the "Saved" toast leave before any screenshot
    return msg;
  }
};
'ok'
'@

$results = [ordered]@{ base = $Base; ranAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'); tests = @() }
function Record($id, $name, [bool]$pass, $details) {
  $results.tests += [ordered]@{ id = $id; name = $name; pass = $pass; details = $details }
  '{0}  {1}  {2}' -f $(if ($pass) { 'PASS' } else { 'FAIL' }), $id, $name
}

$T1 = 'Mostly black, oversized, I live in my Doc Martens. I never wear colour. I''d like to look sharper for work without looking like a banker.'
$T2 = 'I never wear colour. Black and grey, a leather jacket, heavy boots.'
$T3 = 'Flea markets every Saturday. Corduroy, my grandad''s old wool coat, seventies colours. I''d rather look second-hand than brand new.'

try {
  Viewport 1280 900

  # ---------- Test 1 - full loop, live -------------------------------
  Go '/core'
  $landing = (Js 'JSON.stringify({ url: location.href, title: document.title, form: !!document.querySelector("#coreForm") })') | ConvertFrom-Json
  [void](Js 'window.__t.waitFor(() => window.__t.dashReady()).then(() => "ok")')
  $before = [int](Js 'String(window.__t.total())')
  [void](Js ("window.__t.fill(" + ($T1 | ConvertTo-Json) + ", 'work', 300, 'Test 1'); window.__t.generate(); 'ok'"))
  Start-Sleep -Milliseconds 400
  $card1 = (Js 'JSON.stringify(window.__t.card())') | ConvertFrom-Json
  $saved1 = Js 'window.__t.save()'
  ShotEl '#coreOut' 'test1-card-saved'
  Go '/core'
  [void](Js 'window.__t.waitFor(() => window.__t.dashReady()).then(() => "ok")')
  $after = [int](Js 'String(window.__t.total())')
  $first = Js 'window.__t.firstMini()'
  ShotEl '#coreDash' 'test1-dashboard-after-reload'
  $dress1 = (Js ("JSON.stringify(window.__t.outfit(" + ($T1 | ConvertTo-Json) + ", 'work', 300))")) | ConvertFrom-Json
  $colourKept1 = @($dress1.items | Where-Object { @('black', 'grey', 'white') -notcontains $_.family }).Count -eq 0
  $docs1 = @($dress1.items | Where-Object { $_.brand -like '*Martens*' }).Count -eq 1
  $pass1 = $landing.form -and ($saved1 -like 'Saved to Supabase*') -and ($after -eq $before + 1) -and ($first -like '*Test 1*') -and $colourKept1 -and $docs1
  Record 'T1' 'Full loop on the live site: /core loads, Generate, Save (double click), reload, row read back; the outfit keeps "never colour" and the Doc Martens' $pass1 ([ordered]@{
    landing = $landing; card = $card1; outfit = $dress1; colourRuleKept = $colourKept1; docMartensPresent = $docs1
    saveMessage = $saved1; totalBefore = $before; totalAfter = $after; firstOnDashboard = $first })

  # ---------- Test 2 - extraction quality and determinism ------------
  [void](Js ("window.__t.fill(" + ($T2 | ConvertTo-Json) + ", 'everyday', null, 'Test 2'); window.__t.generate(); 'ok'"))
  Start-Sleep -Milliseconds 300
  $a = Js 'JSON.stringify(window.__t.card())'
  [void](Js 'window.__t.generate(); "ok"')
  Start-Sleep -Milliseconds 300
  $b = Js 'JSON.stringify(window.__t.card())'
  $engineSame = Js ("(() => { const i = { text: " + ($T2 | ConvertTo-Json) + ", occasion: 'everyday', budget: null }; return String(JSON.stringify(SM.core.toRow(SM.core.extract(i))) === JSON.stringify(SM.core.toRow(SM.core.extract(i)))); })()")
  $card2 = $a | ConvertFrom-Json
  $saved2 = Js 'window.__t.save()'
  ShotEl '#coreOut' 'test2-card-negation'
  $colourNegative = @($card2.signals | Where-Object { $_ -like '`[neg`]*Colour*' }).Count -gt 0
  $dress2 = (Js ("JSON.stringify(window.__t.outfit(" + ($T2 | ConvertTo-Json) + ", 'everyday', null))")) | ConvertFrom-Json
  $colourKept2 = @($dress2.items | Where-Object { @('black', 'grey', 'white') -notcontains $_.family }).Count -eq 0
  $namedKept2 = ($dress2.named -contains 'leather jacket') -and ($dress2.named -contains 'boots')
  $pass2 = ($a -eq $b) -and ($engineSame -eq 'true') -and ($card2.top -notcontains 'Colour') -and $colourNegative -and ($card2.top[0] -eq 'Edgy') -and
    $colourKept2 -and $namedKept2 -and ($saved2 -like 'Saved to Supabase*')
  Record 'T2' 'Negation and determinism: "never wear colour" lowers Colour and keeps colour out of the outfit; the named leather jacket and boots are in it; two runs identical' $pass2 ([ordered]@{
    card = $card2; outfit = $dress2; colourRuleKept = $colourKept2; namedPiecesKept = $namedKept2
    renderedTwiceIdentical = ($a -eq $b); engineTwiceIdentical = $engineSame; colourNegative = $colourNegative; saveMessage = $saved2 })

  # ---------- Test 3 - edges -----------------------------------------
  $archBefore = Js 'document.querySelector(".core-arch") ? document.querySelector(".core-arch").textContent : ""'
  [void](Js "window.__t.fill('too short', 'everyday', null, ''); window.__t.generate(); 'ok'")
  Start-Sleep -Milliseconds 200
  $short = (Js 'JSON.stringify({ msg: document.querySelector("#coreMsg").textContent, arch: document.querySelector(".core-arch") ? document.querySelector(".core-arch").textContent : "" })') | ConvertFrom-Json
  ShotEl '.core-form' 'test3a-too-short'

  [void](Js "window.__t.fill('asdf qwerty lorem ipsum dolor sit amet blah', 'everyday', null, ''); window.__t.generate(); 'ok'")
  Start-Sleep -Milliseconds 200
  $nosig = (Js 'JSON.stringify({ title: (document.querySelector(".core-empty-title") || {}).textContent || "", card: !!document.querySelector(".core-card") })') | ConvertFrom-Json
  ShotEl '#coreOut' 'test3b-no-signal'

  [void](Js ("window.__t.fill(" + ($T3 | ConvertTo-Json) + ", 'weekend', 150, 'Test 3'); window.__t.generate(); 'ok'"))
  Start-Sleep -Milliseconds 300
  $card3 = (Js 'JSON.stringify(window.__t.card())') | ConvertFrom-Json
  $total3 = [int]([regex]::Match($card3.meta, 'total\D*(\d+)').Groups[1].Value)
  $saved3 = Js 'window.__t.save()'
  ShotEl '#coreOut' 'test3c-budget-150'

  $pass3 = ($short.msg -like 'A little more*') -and ($short.arch -eq $archBefore) -and ($nosig.title -eq 'Not enough to go on.') -and (-not $nosig.card) -and ($total3 -le 150) -and ($saved3 -like 'Saved to Supabase*')
  Record 'T3' 'Edges: under 20 characters, no recognisable cue, EUR 150 budget' $pass3 ([ordered]@{
    tooShort = $short; archetypeKeptOnScreen = $archBefore; noSignal = $nosig; budgetCard = $card3; budgetTotal = $total3; saveMessage = $saved3 })

  # ---------- Security - the public key, from the live page ----------
  $sec = (Js @'
(async () => {
  const c = SM.config.supabase, h = { apikey: c.key };
  const u = c.url + '/rest/v1/core_outputs';
  const allowed = await fetch(u + '?select=id,label,archetype&order=created_at.desc&limit=3', { headers: h });
  const text = await fetch(u + '?select=input_text&limit=1', { headers: h });
  const star = await fetch(u + '?select=*&limit=1', { headers: h });
  /* aimed at an id that cannot exist: even if the grant were wrong, nothing would go */
  const del = await fetch(u + '?id=eq.00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: h });
  return JSON.stringify({ allowed: allowed.status, latest: await allowed.json(), inputText: text.status, inputTextBody: await text.json(), selectStar: star.status, delete: del.status });
})()
'@) | ConvertFrom-Json
  $passS = ($sec.allowed -eq 200) -and ($sec.inputText -eq 401) -and ($sec.selectStar -eq 401) -and ($sec.delete -eq 401)
  Record 'S1' 'Security: the public key cannot read input_text, select *, or delete' $passS $sec

  # ---------- full-page captures ---------------------------------------
  ShotPage 'core-desktop-full' 1280

  Viewport 375 812 $true
  Go '/core'
  [void](Js ("window.__t.fill(" + ($T1 | ConvertTo-Json) + ", 'work', 300, ''); window.__t.generate(); 'ok'"))
  Start-Sleep -Milliseconds 600
  [void](Js 'window.__t.waitFor(() => window.__t.dashReady()).then(() => "ok")')
  $overflow = [int](Js 'String(document.documentElement.scrollWidth - innerWidth)')
  ShotPage 'core-mobile-375-full' 375 $true
  Record 'M1' 'Mobile 375 px: no horizontal overflow' ($overflow -le 0) @{ overflowPx = $overflow }

  Viewport 1280 900
  Go '/docs'
  ShotEl '#prompt-library' 'docs-prompt-library'
}
finally {
  $results | ConvertTo-Json -Depth 12 | Out-File -Encoding utf8 (Join-Path $out 'results.json')
  try { $ws.CloseAsync('NormalClosure', 'done', $ct).GetAwaiter().GetResult() } catch {}
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
"results: evidence/results.json"
