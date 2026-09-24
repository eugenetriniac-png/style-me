# ============================================================
#  Style Me - Week 2 - scripted self-tests against the LIVE site
#
#    powershell -ExecutionPolicy Bypass -File docs\week-2\run-tests.ps1
#
#  No Node, no Playwright on this machine, so this drives headless Edge
#  directly over the Chrome DevTools Protocol from PowerShell. A fresh
#  browser profile every run: the visitor has never taken the style
#  test, which is also what a grader opening /research would be.
#
#  Writes docs/week-2/evidence/*.png and evidence/results.json.
#  Test 2 saves one row to research_records; test 3 walks every source URL.
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
  rows() { return document.querySelectorAll('.rs-table tbody tr').length; },
  setType(t) { document.querySelector('[data-rs-type="' + t + '"]').click(); },
  setMarket(m) { document.querySelector('[data-rs-market="' + m + '"]').click(); },
  search(q) { const s = document.querySelector('#rsSearch'); s.value = q; s.dispatchEvent(new Event('input', { bubbles: true })); },

  /* The whole filter sequence in one pass, carrying what the dataset
     says the answers should be — so the check compares the page
     against the data, not against numbers typed into the test. */
  async filters() {
    const out = { expected: SM.research.counts() };
    for (const t of ['all', 'wardrobe-app', 'styling-service', 'retailer', 'marketplace', 'substitute']) {
      this.setType(t); await this.sleep(40); out['type:' + t] = this.rows();
    }
    this.setType('all');
    for (const m of ['all', 'global', 'mexico']) { this.setMarket(m); await this.sleep(40); out['market:' + m] = this.rows(); }
    this.setMarket('all');
    this.search('mexico'); await this.sleep(40);
    out['search:mexico'] = this.rows();
    out.mexicoNames = [...document.querySelectorAll('.rs-name')].map(n => n.textContent);
    this.search('zzzznothing'); await this.sleep(40);
    out['search:none'] = this.rows();
    out.emptyMessage = !!document.querySelector('.rs-empty');
    this.search(''); await this.sleep(40);
    out.cleared = this.rows();
    out.rowsWithoutSource = [...document.querySelectorAll('.rs-table tbody tr')]
      .filter(tr => !tr.querySelector('.rs-src, .rs-src-off')).length;
    out.countText = document.querySelector('#rsCount').textContent;
    return JSON.stringify(out);
  },

  fill(f) {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#rsQuestion', f.question); set('#rsAssumption', f.assumption); set('#rsFalsifier', f.falsifier); set('#rsNotes', f.notes || '');
    document.querySelector('[data-rs-market="' + f.market + '"]').click();
    document.querySelector('[data-rs-verdict="' + f.verdict + '"]').click();
  },
  savedReady() { const d = document.querySelector('#rsSaved'); return d && !/Loading/.test(d.innerText) && d.innerText.trim().length > 20; },
  savedTotal() { const s = document.querySelector('#rsSaved .core-total strong'); return s ? +s.textContent : 0; },
  savedFirst() { const m = document.querySelector('#rsSaved .core-mini'); return m ? m.innerText.replace(/\n+/g, ' | ') : null; },
  async save() {
    const b = document.querySelector('#rsSave');
    b.click(); b.click();                      // a double click must still make one row
    const msg = await this.waitFor(() => { const m = document.querySelector('#rsSaveMsg'); return m && m.textContent ? m.textContent : null; });
    await this.waitFor(() => this.savedReady());
    await this.sleep(2700);                    // let the toast leave before any screenshot
    return msg;
  },
  widget() { const w = document.querySelector('#rsWidget'); return w ? w.innerText.replace(/\n+/g, ' | ') : null; },

  /* The You screen belongs to someone who has taken the style test:
     a visitor who has not is sent back to the welcome screen, so the
     widget does not exist for them. The test takes the test — twelve
     clicks, the way a real user reaches that screen. */
  async onboard() {
    location.hash = '#/quiz';
    await this.sleep(500);
    for (let i = 0; i < 14 && location.hash === '#/quiz'; i++) {
      const opt = document.querySelector('.q-option');
      if (!opt) break;
      opt.click();
      await this.sleep(300);
    }
    await this.waitFor(() => location.hash === '#/dna');
    return location.hash;
  }
};
'ok'
'@

# Test 3 asks every cited source whether it still answers. Two hosts refuse
# anything that does not look like a browser, and one of them - the SEC -
# publishes the opposite rule: it wants a user agent carrying a contact.
# PowerShell's own web client is refused by both, so this uses curl.exe,
# which ships with Windows.
function Get-LinkStatus([string]$url) {
  $ua = if ($url -like '*sec.gov*') { 'Style Me research link check (eugene.triniac@ibero.mx)' } else { 'Mozilla/5.0' }
  $code = & curl.exe -s -o NUL -w '%{http_code}' -A $ua -L --max-time 40 $url 2>$null
  if ($code -match '^\d+$') { return [int]$code }
  return -1
}

$results = [ordered]@{ base = $Base; ranAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'); tests = @() }
function Record($id, $name, [bool]$pass, $details) {
  $results.tests += [ordered]@{ id = $id; name = $name; pass = $pass; details = $details }
  '{0}  {1}  {2}' -f $(if ($pass) { 'PASS' } else { 'FAIL' }), $id, $name
}

$Q = 'Do people need help naming their taste, or just help shopping?'
$A = 'People recognise a good outfit but cannot name a direction, so they buy single pieces that never combine.'
$F = 'If people say they already know their style and only want cheaper or faster shopping, the premise is wrong.'

try {
  Viewport 1280 900

  # The packet promises a clean console, so every page this script opens
  # collects its own errors from the first line of script it runs.
  # Page.enable first: without it the injection is accepted and never runs.
  [void](Cdp 'Page.enable')
  [void](Cdp 'Page.addScriptToEvaluateOnNewDocument' @{ source = @'
window.__errs = [];
addEventListener('error', e => window.__errs.push(String(e.message || e.error)));
addEventListener('unhandledrejection', e => window.__errs.push('unhandled rejection: ' + e.reason));
'@ })

  # ---------- Test 1 - filter and search ------------------------------
  Go '/research'
  $landing = (Js 'JSON.stringify({ url: location.href, title: document.title, intake: !!document.querySelector("#rsForm"), rows: window.__t.rows(), cards: document.querySelectorAll(".rs-card").length, finds: document.querySelectorAll(".rs-find").length, risks: document.querySelectorAll(".rs-risk").length, sources: SM.research.sources().length })') | ConvertFrom-Json
  $f = (Js 'window.__t.filters()') | ConvertFrom-Json
  $e = $f.expected
  $typesOk = ($f.'type:all' -eq $e.all) -and ($f.'type:wardrobe-app' -eq $e.'wardrobe-app') -and ($f.'type:styling-service' -eq $e.'styling-service') -and
             ($f.'type:retailer' -eq $e.retailer) -and ($f.'type:marketplace' -eq $e.marketplace) -and ($f.'type:substitute' -eq $e.substitute)
  $marketsOk = ($f.'market:all' -eq $e.all) -and ($f.'market:global' -eq $e.global) -and ($f.'market:mexico' -eq $e.mexico)
  $searchOk = ($f.'search:mexico' -gt 0) -and ($f.'search:mexico' -lt $e.all) -and ($f.'search:none' -eq 0) -and $f.emptyMessage -and ($f.cleared -eq $e.all)
  $errs = Js 'JSON.stringify(window.__errs || ["collector missing"])'
  $pass1 = $landing.intake -and ($landing.rows -eq $e.all) -and ($landing.cards -eq 5) -and ($landing.risks -eq 8) -and
           $typesOk -and $marketsOk -and $searchOk -and ($f.rowsWithoutSource -eq 0) -and ($errs -eq '[]')
  Record 'T1' 'Filter and search on the live page: every chip count matches the dataset, search narrows and clears, no row without a source, console clean' $pass1 ([ordered]@{
    landing = $landing; filters = $f; typeCountsMatch = $typesOk; marketCountsMatch = $marketsOk; searchBehaves = $searchOk
    consoleErrors = $errs })
  ShotEl '.rs-sec' 'test1-table-filters'

  # ---------- Test 2 - save a research record --------------------------
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $before = [int](Js 'String(window.__t.savedTotal())')
  [void](Js ("window.__t.fill({ question: " + ($Q | ConvertTo-Json) + ", assumption: " + ($A | ConvertTo-Json) + ", falsifier: " + ($F | ConvertTo-Json) + ", market: 'mexico', verdict: 'real', notes: 'Saved by the Week 2 test script.' }); 'ok'"))
  $saved = Js 'window.__t.save()'
  ShotEl '#rsForm' 'test2-record-saved'
  Go '/research'
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $after = [int](Js 'String(window.__t.savedTotal())')
  $first = Js 'window.__t.savedFirst()'
  ShotEl '#rsSaved' 'test2-records-after-reload'
  $onboarded = Js 'window.__t.onboard()'
  # The You screen is a hash route: only /docs, /core and /research are
  # rewritten to the app, so opening $Base/me would fetch a Vercel 404.
  [void](Js "location.hash = '#/me'; 'ok'")
  Start-Sleep -Milliseconds 900
  [void](Js 'window.__t.waitFor(() => { const w = window.__t.widget(); return w && !/Loading/.test(w); }).then(() => "ok")')
  $widget = Js 'window.__t.widget()'
  ShotEl '#rsWidget' 'test2-widget-on-you'
  $pass2 = ($saved -like 'Saved to Supabase*') -and ($after -eq $before + 1) -and ($first -like '*naming their taste*') -and ($widget -like "*$after*")
  Record 'T2' 'Save a research record: one row per double click, read back after a reload, and counted by the You-screen widget' $pass2 ([ordered]@{
    saveMessage = $saved; totalBefore = $before; totalAfter = $after; firstOnPage = $first
    onboardedTo = $onboarded; widget = $widget })

  # ---------- Test 3 - every source resolves ---------------------------
  Go '/research'
  $sources = (Js 'JSON.stringify(SM.research.sources())') | ConvertFrom-Json
  $checked = @()
  $bad = 0
  foreach ($s in $sources) {
    if ($s.kind -ne 'web') { $checked += [ordered]@{ id = $s.id; url = $s.url; status = 'not a web source'; ok = $true }; continue }
    $status = Get-LinkStatus $s.url
    $ok = ($status -ge 200 -and $status -lt 400)
    if (-not $ok) { $bad++ }
    $checked += [ordered]@{ id = $s.id; url = $s.url; status = $status; ok = $ok }
  }
  $uniqueUrls = @($sources | Where-Object { $_.kind -eq 'web' } | Select-Object -ExpandProperty url -Unique).Count
  Record 'T3' "Sources hold: every source URL on the page answers ($uniqueUrls distinct URLs behind $($sources.Count) claims)" ($bad -eq 0) ([ordered]@{
    claims = $sources.Count; distinctUrls = $uniqueUrls; failures = $bad; checked = $checked })

  # ---------- Security - the public key, from the live page ------------
  $sec = (Js @'
(async () => {
  const c = SM.config.supabase, h = { apikey: c.key };
  const u = c.url + '/rest/v1/research_records';
  const allowed = await fetch(u + '?select=id,question,verdict&order=created_at.desc&limit=3', { headers: h });
  const notes = await fetch(u + '?select=notes&limit=1', { headers: h });
  const star = await fetch(u + '?select=*&limit=1', { headers: h });
  /* aimed at an id that cannot exist: even if the grant were wrong, nothing would go */
  const del = await fetch(u + '?id=eq.00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: h });
  return JSON.stringify({ allowed: allowed.status, latest: await allowed.json(), notes: notes.status, notesBody: await notes.json(), selectStar: star.status, delete: del.status });
})()
'@) | ConvertFrom-Json
  $passS = ($sec.allowed -eq 200) -and ($sec.notes -eq 401) -and ($sec.selectStar -eq 401) -and ($sec.delete -eq 401)
  Record 'S1' 'Security: the public key cannot read notes, select *, or delete from research_records' $passS $sec

  # ---------- full-page captures ---------------------------------------
  ShotEl '.rs-two' 'mexico-and-risks'
  ShotPage 'research-desktop-full' 1280

  # Overflow is measured against documentElement.clientWidth, not innerWidth:
  # under mobile emulation the layout viewport widens to fit overflowing
  # content, so innerWidth reports the overflow as if it were the screen and
  # the check reads a comfortable zero. That is how a 20px overflow in the
  # risk map survived the first three runs of this suite.
  $widths = @()
  $worst = 0
  foreach ($w in 375, 414, 600, 768, 900, 1280) {
    Viewport $w 900 ($w -lt 768)
    Go '/research'
    [void](Js 'window.__t.waitFor(() => document.querySelector(".rs-map")).then(() => "ok")')
    $o = [int](Js 'String(document.documentElement.scrollWidth - document.documentElement.clientWidth)')
    $widths += [ordered]@{ width = $w; overflowPx = $o }
    if ($o -gt $worst) { $worst = $o }
    if ($w -eq 375) {
      [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
      $tableScrolls = Js 'String(document.querySelector(".rs-scroll").scrollWidth > document.querySelector(".rs-scroll").clientWidth)'
      ShotPage 'research-mobile-375-full' 375 $true
    }
  }
  Record 'M1' 'Responsive: no horizontal overflow at 375, 414, 600, 768, 900 or 1280 px; the wide table scrolls inside its own box' (($worst -le 0) -and ($tableScrolls -eq 'True')) @{
    perWidth = $widths; worstOverflowPx = $worst; tableScrollsInsideItsBox = $tableScrolls }
}
finally {
  $results | ConvertTo-Json -Depth 12 | Out-File -Encoding utf8 (Join-Path $out 'results.json')
  try { $ws.CloseAsync('NormalClosure', 'done', $ct).GetAwaiter().GetResult() } catch {}
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
"results: evidence/results.json"
