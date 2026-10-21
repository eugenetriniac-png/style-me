# ============================================================
#  Style Me - Week 4 - scripted self-tests against the LIVE site
#
#    powershell -ExecutionPolicy Bypass -File docs\week-4\run-tests.ps1
#
#  Two A/B tests (A1, A2) and three software tests (S1, S2, S3),
#  plus the standing security check on both new tables.
#
#  A fresh browser profile every run, so every run is a visitor who
#  has never been here: that is what makes A2 able to record a real
#  impression and a real conversion.
#
#  Writes docs/week-4/evidence/*.png and evidence/results.json.
# ============================================================

param([string]$Base = 'https://style-me-five.vercel.app')

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $here 'evidence'
if (-not (Test-Path $out)) { New-Item -ItemType Directory $out | Out-Null }

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
$buf = New-Object byte[] 1048576
$script:seq = 0

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
    if (-not $text.StartsWith('{"id":' + $id + ',')) { continue }
    if ($text.StartsWith('{"id":' + $id + ',"error"')) { throw "CDP $method failed: $text" }
    return $text
  }
}

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
  Start-Sleep -Milliseconds 500
  [void](Js 'new Promise(r => { const t0 = Date.now(); const t = setInterval(() => { if ((window.SM && SM.ab && document.querySelector("#screen")) || Date.now() - t0 > 15000) { clearInterval(t); r("ok"); } }, 100); })')
  [void](Js $helpers)
}

function SavePng([string]$raw, [string]$name) {
  $m = [regex]::Match($raw, '"data":"([^"]+)"')
  [IO.File]::WriteAllBytes((Join-Path $out "$name.png"), [Convert]::FromBase64String($m.Groups[1].Value))
  "  saved evidence/$name.png"
}

function ShotEl([string]$selector, [string]$name, [int]$pad = 16) {
  $rect = (Js "JSON.stringify((() => { const r = document.querySelector('$selector').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })())") | ConvertFrom-Json
  $clip = @{ x = [math]::Max(0, $rect.x - $pad); y = [math]::Max(0, $rect.y - $pad); width = $rect.w + 2 * $pad; height = $rect.h + 2 * $pad; scale = 1 }
  SavePng (Cdp 'Page.captureScreenshot' @{ format = 'png'; captureBeyondViewport = $true; clip = $clip }) $name
}

function ShotPage([string]$name, [int]$w) {
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
  swatches() {
    return [...document.querySelectorAll('.mk-sw')].map(sw => {
      const v = sw.querySelector('.mk-sw-var').textContent.trim();
      return { variable: v, shown: sw.querySelector('.mk-sw-val').textContent.trim(),
               live: getComputedStyle(document.documentElement).getPropertyValue(v).trim() };
    });
  },
  content() {
    const m = SM.MARKETING;
    return {
      posts: document.querySelectorAll('.mk-card').length,
      scripts: document.querySelectorAll('.mk-script').length,
      days: document.querySelectorAll('.mk-day').length,
      copyButtons: document.querySelectorAll('[data-mk-copy]').length,
      everyPostHasChannelAndLength: m.posts.every(p => p.channel && p.body && p.body.length > 0),
      everyDayHasNote: m.calendar.every(d => d.note && d.note.length > 0),
      personaQuoted: m.persona.lines.filter(l => l.kind === 'quote').length,
      personaInferred: m.persona.lines.filter(l => l.kind === 'inference').length
    };
  },
  async copyFirstPost() {
    const btn = document.querySelector('[data-mk-copy]');
    const id = btn.getAttribute('data-mk-copy');
    btn.click();
    await this.sleep(400);
    let clip = null;
    try { clip = await navigator.clipboard.readText(); } catch (e) { clip = 'unreadable: ' + e.message; }
    const expected = SM.MARKETING.posts.concat(SM.MARKETING.scripts).filter(a => a.id === id)[0].body;
    /* Windows hands every newline back as CRLF, so a post with one blank
       line comes back two characters longer than it went in. Compare the
       text, not the platform's line endings. */
    const norm = s => String(s === null || s === undefined ? '' : s).split('\r\n').join('\n');
    return JSON.stringify({ id, buttonSays: btn.textContent,
      matches: norm(clip) === norm(expected),
      clipLength: (clip || '').length, expectedLength: expected.length });
  },
  savedReady() { const d = document.querySelector('#mkSaved'); return d && !/Loading/.test(d.innerText) && d.innerText.trim().length > 18; },
  savedTotal() { const s = document.querySelector('#mkSaved .core-total strong'); return s ? +s.textContent : 0; },
  async saveAsset(assetId, note) {
    const sel = document.querySelector('#mkAsset'); sel.value = assetId;
    const n = document.querySelector('#mkNote'); n.value = note; n.dispatchEvent(new Event('input', { bubbles: true }));
    const b = document.querySelector('#mkSave');
    b.click(); b.click();
    const msg = await this.waitFor(() => { const m = document.querySelector('#mkSaveMsg'); return m && m.textContent ? m.textContent : null; });
    await this.waitFor(() => this.savedReady());
    await this.sleep(2500);
    return msg;
  },
  async lastAsset() {
    const c = SM.config.supabase;
    const r = await fetch(c.url + '/rest/v1/marketing_assets?select=id,kind,channel,title,body,variant&order=created_at.desc&limit=1', { headers: { apikey: c.key } });
    return JSON.stringify((await r.json())[0] || {});
  },
  async eventsFor(visitorId) {
    const c = SM.config.supabase;
    const r = await fetch(c.url + '/rest/v1/ab_events?select=experiment,variant,event,surface&visitor=eq.' + encodeURIComponent(visitorId), { headers: { apikey: c.key } });
    return JSON.stringify(await r.json());
  },
  async allEvents() {
    const c = SM.config.supabase;
    const r = await fetch(c.url + '/rest/v1/ab_events?select=experiment,variant,event&limit=2000', { headers: { apikey: c.key } });
    const body = await r.json();
    return JSON.stringify(Array.isArray(body) ? body : []);   // an error object is not rows
  }
};
'ok'
'@

$results = [ordered]@{ base = $Base; ranAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'); tests = @() }
function Record($id, $name, [bool]$pass, $details) {
  $results.tests += [ordered]@{ id = $id; name = $name; pass = $pass; details = $details }
  '{0}  {1}  {2}' -f $(if ($pass) { 'PASS' } else { 'FAIL' }), $id, $name
}

try {
  Viewport 1280 900
  [void](Cdp 'Page.enable')
  [void](Cdp 'Page.addScriptToEvaluateOnNewDocument' @{ source = @'
window.__errs = [];
addEventListener('error', e => window.__errs.push(String(e.message || e.error)));
addEventListener('unhandledrejection', e => window.__errs.push('unhandled rejection: ' + e.reason));
'@ })
  # the clipboard check in S2 needs permission, or it throws instead of failing
  try { [void](Cdp 'Browser.grantPermissions' @{ origin = $Base; permissions = @('clipboardReadWrite', 'clipboardSanitizedWrite') }) } catch {}

  Go '/marketing'

  # ---------- A1 - the assignment itself -------------------------------
  $a1 = (Js @'
JSON.stringify((() => {
  const N = 20000;
  let hA = 0, cA = 0, agree = 0;
  for (let i = 0; i < N; i++) {
    const id = SM.ab.newId();
    const h = SM.ab.assignFor(id, 'headline').id;
    const c = SM.ab.assignFor(id, 'cta').id;
    if (h === 'a') hA++;
    if (c === 'a') cA++;
    if (h === c) agree++;
  }
  const id = SM.ab.newId();
  const repeated = new Set(Array.from({ length: 200 }, () => SM.ab.assignFor(id, 'headline').id));
  const pct = n => Math.round((n / N) * 1000) / 10;
  return {
    n: N,
    headlineASplit: pct(hA), ctaASplit: pct(cA), agreement: pct(agree),
    sticky: repeated.size === 1,
    fair: Math.abs(pct(hA) - 50) <= 2 && Math.abs(pct(cA) - 50) <= 2,
    independent: Math.abs(pct(agree) - 50) <= 2,
    refusesBelowThreshold: SM.ab.summarise(
      [{ experiment: 'headline', variant: 'a', event: 'impression' },
       { experiment: 'headline', variant: 'b', event: 'impression' }], 'headline').winner === null
  };
})())
'@) | ConvertFrom-Json
  $passA1 = $a1.fair -and $a1.independent -and $a1.sticky -and $a1.refusesBelowThreshold
  Record 'A1' 'A/B assignment: a 20,000-visitor draw splits within 2 points of even, the two experiments are independent, a visitor is sticky, and the summary refuses to name a winner below the threshold' $passA1 $a1

  # ---------- A2 - the experiment end to end ---------------------------
  # Each test from here on is wrapped: the first run of this suite died
  # entirely because one call threw, so four checks that would have
  # passed never reported at all. A failing test must fail alone.
  try {
  Go '/'
  Start-Sleep -Milliseconds 900
  $visitor = Js 'SM.ab.visitor()'
  $seen = (Js 'JSON.stringify({ headline: SM.ab.assign("headline").id, cta: SM.ab.assign("cta").id, headlineText: document.querySelector(".land-headline").textContent, ctaText: document.querySelector("#landCta").textContent })') | ConvertFrom-Json
  ShotPage 'landing-desktop-full' 1280
  [void](Js 'document.querySelector("#landCta").click(); "clicked"')
  Start-Sleep -Milliseconds 2500
  $mine = (Js ("window.__t.eventsFor(" + ($visitor | ConvertTo-Json) + ")")) | ConvertFrom-Json

  $hasImpressions = (@($mine | Where-Object { $_.event -eq 'impression' }).Count -eq 2)
  $hasConversions = (@($mine | Where-Object { $_.event -eq 'conversion' }).Count -eq 2)
  $variantsMatch = (@($mine | Where-Object { $_.experiment -eq 'headline' -and $_.variant -ne $seen.headline }).Count -eq 0) -and
                   (@($mine | Where-Object { $_.experiment -eq 'cta' -and $_.variant -ne $seen.cta }).Count -eq 0)

  # The same visitor comes back twice and clicks again. The row count
  # must not move. This check exists because it did move: the first
  # version de-duplicated in a variable, which a reload wipes, so one
  # visitor opening the page six times counted as six impressions and
  # every rate read low.
  Go '/'; Start-Sleep -Milliseconds 700
  Go '/'; Start-Sleep -Milliseconds 700
  [void](Js 'document.querySelector("#landCta").click(); "clicked"')
  Start-Sleep -Milliseconds 2000
  $after = (Js ("window.__t.eventsFor(" + ($visitor | ConvertTo-Json) + ")")) | ConvertFrom-Json
  $stableAfterReload = (@($after).Count -eq @($mine).Count)

  # what the data we have actually supports, rather than what it hints at
  $read = (Js @'
(async () => {
  const rows = JSON.parse(await window.__t.allEvents());
  const out = SM.MARKETING.experiments.map(e => {
    const s = SM.ab.summarise(rows, e.id);
    const base = 0.20, delta = 0.05;   // detect a 5-point move off a 20% baseline
    const needed = Math.ceil(16 * base * (1 - base) / (delta * delta));
    return { experiment: e.id, total: s.total, smallestArm: s.smallestArm, enough: s.enough,
             winner: s.winner, verdict: s.verdict, neededPerArm: needed };
  });
  return JSON.stringify(out);
})()
'@) | ConvertFrom-Json
  $honest = (@($read | Where-Object { $_.enough -eq $false -and $_.winner -ne $null }).Count -eq 0)
  $passA2 = $hasImpressions -and $hasConversions -and $variantsMatch -and $stableAfterReload -and $honest
  Record 'A2' 'A/B end to end on the live site: a fresh visitor records one impression per experiment, the call to action records a conversion, two reloads and a second click add nothing, the stored variants match what was shown, and no winner is named on this sample' $passA2 ([ordered]@{
    visitor = $visitor; shown = $seen; rowsForThisVisitor = $mine
    impressionsOk = $hasImpressions; conversionsOk = $hasConversions; variantsMatch = $variantsMatch
    rowsAfterTwoReloadsAndASecondClick = @($after).Count; stableAfterReload = $stableAfterReload
    honestRead = $read })
  } catch { Record 'A2' 'A/B end to end on the live site' $false @{ error = $_.Exception.Message } }

  # ---------- S1 - both surfaces, console, brand ------------------------
  $landErrs = Js 'JSON.stringify(window.__errs || ["collector missing"])'
  Go '/marketing'
  $mkErrs = Js 'JSON.stringify(window.__errs || ["collector missing"])'
  $sw = (Js 'JSON.stringify(window.__t.swatches())') | ConvertFrom-Json
  $mismatch = @($sw | Where-Object { $_.shown -ne $_.live })
  ShotEl '.mk-swatches' 'brand-swatches'
  $passS1 = ($landErrs -eq '[]') -and ($mkErrs -eq '[]') -and ($sw.Count -ge 8) -and ($mismatch.Count -eq 0)
  Record 'S1' 'Both surfaces load with a clean console, and every brand swatch equals the live CSS variable it names' $passS1 ([ordered]@{
    landingConsole = $landErrs; marketingConsole = $mkErrs; swatches = $sw.Count; mismatches = $mismatch })

  # ---------- S2 - the content, and the copy button ---------------------
  $content = (Js 'JSON.stringify(window.__t.content())') | ConvertFrom-Json
  $clip = (Js 'window.__t.copyFirstPost()') | ConvertFrom-Json
  ShotEl '.mk-cards' 'content-cards'
  ShotEl '.mk-cal' 'calendar'
  $passS2 = ($content.posts -eq 10) -and ($content.scripts -eq 3) -and ($content.days -eq 14) -and
            $content.everyPostHasChannelAndLength -and $content.everyDayHasNote -and $clip.matches
  Record 'S2' 'Content is complete and copyable: 10 posts, 3 scripts, 14 days, and the copy button puts exactly the published text on the clipboard' $passS2 ([ordered]@{
    content = $content; clipboard = $clip })

  # ---------- S3 - saving an asset, and the responsive sweep ------------
  try {
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $before = [int](Js 'String(window.__t.savedTotal())')
  $saved = Js 'window.__t.saveAsset("s1", "Saved by the Week 4 test script.")'
  ShotEl '#mkForm' 'asset-saved'
  $row = (Js 'window.__t.lastAsset()') | ConvertFrom-Json
  Go '/marketing'
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $after = [int](Js 'String(window.__t.savedTotal())')
  ShotEl '#mkSaved' 'assets-after-reload'
  $storedRight = ($row.kind -eq 'script') -and ($row.channel -eq 'tiktok') -and ($row.title -eq 'The ten-minute shirt') -and
                 ($row.body -like '*ten minutes*')

  $widths = @()
  $worst = 0
  foreach ($w in 375, 414, 600, 768, 900, 1280) {
    foreach ($path in '/', '/marketing') {
      Viewport $w 900 ($w -lt 768)
      Go $path
      [void](Js 'window.__t.waitFor(() => document.querySelector(".land-headline") || document.querySelector(".mk-sw")).then(() => "ok")')
      $o = [int](Js 'String(document.documentElement.scrollWidth - document.documentElement.clientWidth)')
      $widths += [ordered]@{ width = $w; page = $path; overflowPx = $o }
      if ($o -gt $worst) { $worst = $o }
      if ($w -eq 375 -and $path -eq '/') { ShotPage 'landing-mobile-375-full' 375 }
    }
  }
  Viewport 1280 900
  Go '/marketing'
  ShotPage 'marketing-desktop-full' 1280

  $passS3 = ($saved -like 'Saved to Supabase*') -and ($after -eq $before + 1) -and $storedRight -and ($worst -le 0)
  Record 'S3' 'Saving an asset writes one row per double click and reads back field for field, and neither surface overflows at 375, 414, 600, 768, 900 or 1280 px' $passS3 ([ordered]@{
    saveMessage = $saved; totalBefore = $before; totalAfter = $after; storedRow = $row; storedAsEntered = $storedRight
    perWidth = $widths; worstOverflowPx = $worst })
  } catch { Record 'S3' 'Saving an asset, and the responsive sweep' $false @{ error = $_.Exception.Message } }

  # ---------- Security on both new tables -------------------------------
  try {
  $sec = (Js @'
(async () => {
  const c = SM.config.supabase, h = { apikey: c.key };
  const assets = c.url + '/rest/v1/marketing_assets';
  const events = c.url + '/rest/v1/ab_events';
  const allowed = await fetch(assets + '?select=id,kind,channel&limit=3', { headers: h });
  const note = await fetch(assets + '?select=note&limit=1', { headers: h });
  const star = await fetch(assets + '?select=*&limit=1', { headers: h });
  const del = await fetch(assets + '?id=eq.00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: h });
  const evRead = await fetch(events + '?select=experiment,variant,event&limit=1', { headers: h });
  const evDel = await fetch(events + '?id=eq.00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: h });
  return JSON.stringify({ assetsAllowed: allowed.status, assetsNote: note.status, assetsStar: star.status,
                          assetsDelete: del.status, eventsRead: evRead.status, eventsDelete: evDel.status });
})()
'@) | ConvertFrom-Json
  $passSec = ($sec.assetsAllowed -eq 200) -and ($sec.assetsNote -eq 401) -and ($sec.assetsStar -eq 401) -and
             ($sec.assetsDelete -eq 401) -and ($sec.eventsRead -eq 200) -and ($sec.eventsDelete -eq 401)
  Record 'S4' 'Security: the public key cannot read note, select * or delete from marketing_assets, and cannot delete an event' $passSec $sec
  } catch { Record 'S4' 'Security on the two new tables' $false @{ error = $_.Exception.Message } }
}
finally {
  $results | ConvertTo-Json -Depth 12 | Out-File -Encoding utf8 (Join-Path $out 'results.json')
  try { $ws.CloseAsync('NormalClosure', 'done', $ct).GetAwaiter().GetResult() } catch {}
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
"results: evidence/results.json"
