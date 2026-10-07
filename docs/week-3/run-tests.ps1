# ============================================================
#  Style Me - Week 3 - scripted self-tests against the LIVE site
#
#    powershell -ExecutionPolicy Bypass -File docs\week-3\run-tests.ps1
#
#  Two pricing-logic tests (L1, L2) that call SM.pricing directly
#  with no page involved, then three software tests (S1, S2, S3)
#  against the deployed pages, plus the standing security check.
#
#  No Node, no Playwright on this machine, so this drives headless
#  Edge over the Chrome DevTools Protocol from PowerShell, with a
#  fresh browser profile every run.
#
#  Writes docs/week-3/evidence/*.png and evidence/results.json.
#  S2 saves one row to pricing_scenarios; S3 walks every source URL.
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
    # Replies start with their id; events start with "method".
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
  [void](Js 'new Promise(r => { const t0 = Date.now(); const t = setInterval(() => { if ((window.SM && SM.pricing && document.querySelector("#screen")) || Date.now() - t0 > 15000) { clearInterval(t); r("ok"); } }, 100); })')
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

# Week 2 lesson: two hosts refuse PowerShell's web client, for opposite
# reasons. curl.exe ships with Windows and sends what each one expects.
function Get-LinkStatus([string]$url) {
  $ua = if ($url -like '*sec.gov*') { 'Style Me research link check (eugene.triniac@ibero.mx)' } else { 'Mozilla/5.0' }
  $code = & curl.exe -s -o NUL -w '%{http_code}' -A $ua -L --max-time 40 $url 2>$null
  if ($code -match '^\d+$') { return [int]$code }
  return -1
}

$helpers = @'
window.__t = {
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  async waitFor(fn, ms = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await new Promise(r => setTimeout(r, 100)); }
    return null;
  },
  /* What the tier cards say, read off whichever page we are on, so
     S1 can compare the two pages instead of trusting one file. */
  tiers() {
    return [...document.querySelectorAll('.ps-tier')].map(t => ({
      name: t.querySelector('.ps-tier-name').textContent.trim(),
      price: t.querySelector('.ps-price').childNodes[0].textContent.trim(),
      unit: t.querySelector('.ps-price small').textContent.trim(),
      segment: t.querySelector('.ps-seg').textContent.trim()
    }));
  },
  figures() {
    return [...document.querySelectorAll('.ps-fig-n')].map(e => e.textContent.trim());
  },
  setInput(id, value) {
    const n = document.querySelector('#ps-' + id);
    n.value = value;
    n.dispatchEvent(new Event('input', { bubbles: true }));
  },
  setScenario(id) { document.querySelector('[data-ps-scenario="' + id + '"]').click(); },
  fill(form) {
    Object.keys(form.inputs || {}).forEach(k => this.setInput(k, form.inputs[k]));
    if (form.scenario) this.setScenario(form.scenario);
    const l = document.querySelector('#psLabel'); l.value = form.label || ''; l.dispatchEvent(new Event('input', { bubbles: true }));
    const n = document.querySelector('#psNote'); n.value = form.note || ''; n.dispatchEvent(new Event('input', { bubbles: true }));
  },
  savedReady() { const d = document.querySelector('#psSaved'); return d && !/Loading/.test(d.innerText) && d.innerText.trim().length > 18; },
  savedTotal() { const s = document.querySelector('#psSaved .core-total strong'); return s ? +s.textContent : 0; },
  savedFirst() { const m = document.querySelector('#psSaved .core-mini'); return m ? m.innerText.replace(/\n+/g, ' | ') : null; },
  async save() {
    const b = document.querySelector('#psSave');
    b.click(); b.click();                      // a double click must still make one row
    const msg = await this.waitFor(() => { const m = document.querySelector('#psSaveMsg'); return m && m.textContent ? m.textContent : null; });
    await this.waitFor(() => this.savedReady());
    await this.sleep(2700);                    // let the toast leave before any screenshot
    return msg;
  },
  /* What the database actually stored, read back through the same
     public key the page uses - the Week 2 lesson. */
  async lastRow() {
    const c = SM.config.supabase;
    const r = await fetch(c.url + '/rest/v1/pricing_scenarios?select=id,label,scenario,mrr_mxn,arr_mxn,inputs,outputs,assumptions_version&order=created_at.desc&limit=1',
      { headers: { apikey: c.key } });
    return JSON.stringify((await r.json())[0] || {});
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

  # The packet promises a clean console on both pages.
  [void](Cdp 'Page.enable')
  [void](Cdp 'Page.addScriptToEvaluateOnNewDocument' @{ source = @'
window.__errs = [];
addEventListener('error', e => window.__errs.push(String(e.message || e.error)));
addEventListener('unhandledrejection', e => window.__errs.push('unhandled rejection: ' + e.reason));
'@ })

  Go '/pricing'

  # ---------- L1 - the arithmetic, against a hand-computed case -------
  # Worked out by hand first, then written here. Inputs:
  #   20000 users, 2% ask for a lookbook  -> 400 lookbooks
  #   400 x MX$300                        -> MX$120,000 styled revenue
  #   400 x MX$120                        -> MX$48,000 paid to stylists
  #   10 brands x MX$5,000                -> MX$50,000 subscriptions
  #   10 x 1000 orders, 4 points avoided  -> 400 returns avoided
  #   400 x MX$500 saved, 10% billed      -> MX$20,000
  #   monthly = 120,000 + 50,000 + 20,000 -> MX$190,000
  #   annual  = 1,440,000 + (50,000 x 12 x 0.9) + 240,000 -> MX$2,220,000
  #   margin  = (190,000 - 48,000) / 190,000 -> 74.7%
  $l1 = (Js @'
JSON.stringify((() => {
  const inputs = { mau: 20000, lookbookRate: 2, lookbookPrice: 300, stylistPay: 120,
                   brands: 10, brandFee: 5000, ordersPerBrand: 1000, pointsAvoided: 4,
                   returnCost: 500, takeRate: 10 };
  const r = SM.pricing.compute(inputs, 'base');
  const discount = SM.pricing.assumption('a-annual-discount').value / 100;
  const subsMonthly = r.lines.find(l => l.id === 'subs').monthly;
  const keptMonthly = r.lines.find(l => l.id === 'kept').monthly;
  const styledMonthly = r.lines.find(l => l.id === 'styled').monthly;
  return {
    mrr: r.mrr, arr: r.arr, margin: r.margin,
    styled: styledMonthly, subs: subsMonthly, kept: keptMonthly,
    stylist: r.lines.find(l => l.id === 'stylist').monthly,
    person: r.bySegment.person, brand: r.bySegment.brand,
    segmentsSumToTotal: (r.bySegment.person + r.bySegment.brand) === r.mrr,
    annualIdentity: r.arr === Math.round(styledMonthly * 12 + subsMonthly * 12 * (1 - discount) + keptMonthly * 12),
    lookbooks: r.lookbooks, returnsAvoided: r.returnsAvoided
  };
})())
'@) | ConvertFrom-Json

  $handMrr = 190000; $handArr = 2220000; $handStyled = 120000; $handSubs = 50000; $handKept = 20000; $handStylist = -48000
  $passL1 = ($l1.mrr -eq $handMrr) -and ($l1.arr -eq $handArr) -and ($l1.styled -eq $handStyled) -and
            ($l1.subs -eq $handSubs) -and ($l1.kept -eq $handKept) -and ($l1.stylist -eq $handStylist) -and
            ($l1.margin -eq 74.7) -and $l1.segmentsSumToTotal -and $l1.annualIdentity -and
            ($l1.lookbooks -eq 400) -and ($l1.returnsAvoided -eq 400)
  Record 'L1' 'Pricing logic: the engine matches a case computed by hand, the segments sum to the total, and annual equals monthly x 12 less the stated annual discount' $passL1 ([ordered]@{
    engine = $l1; handComputed = @{ mrr = $handMrr; arr = $handArr; styled = $handStyled; subs = $handSubs; kept = $handKept; stylist = $handStylist; margin = 74.7 } })

  # ---------- L2 - invariants -----------------------------------------
  $l2 = (Js @'
JSON.stringify((() => {
  const d = SM.pricing.defaults();
  const c = SM.pricing.compute(d, 'conservative');
  const b = SM.pricing.compute(d, 'base');
  const o = SM.pricing.compute(d, 'optimistic');

  // a sourced assumption has the same value in every scenario
  const sourcedIn = s => SM.pricing.assumptionsFor(s).filter(a => a.kind === 'sourced')
    .map(a => a.id + '=' + a.scenarioValue).join('|');
  const sourcedStable = sourcedIn('conservative') === sourcedIn('base') && sourcedIn('base') === sourcedIn('optimistic');

  // and structurally: no scenario multiplier reaches an input backed by a sourced assumption
  const noSourcedMultiplier = SM.PRICING.scenarios.every(s => Object.keys(s.multipliers).every(id => {
    const spec = SM.pricing.inputById(id);
    if (!spec || !spec.basedOn) return true;
    const a = SM.pricing.assumption(spec.basedOn);
    return !a || a.kind !== 'sourced';
  }));

  const zero = SM.pricing.compute(Object.assign({}, d, { mau: 0, brands: 0 }), 'optimistic');
  const absurd = SM.pricing.compute({ mau: -50000, lookbookRate: 999, lookbookPrice: -10, stylistPay: -5,
    brands: -8, brandFee: -100, ordersPerBrand: -10, pointsAvoided: 99, returnCost: -1, takeRate: 500 }, 'base');

  return {
    mrr: [c.mrr, b.mrr, o.mrr], arr: [c.arr, b.arr, o.arr],
    monotonicMrr: c.mrr <= b.mrr && b.mrr <= o.mrr,
    monotonicArr: c.arr <= b.arr && b.arr <= o.arr,
    sourcedStable, noSourcedMultiplier,
    zeroRevenue: zero.mrr === 0 && zero.arr === 0,
    absurdClamped: absurd.mrr >= 0 && absurd.arr >= 0 &&
      absurd.entered.mau === 0 && absurd.entered.brands === 0 && absurd.entered.takeRate === 50 &&
      absurd.entered.pointsAvoided === 19.3,
    absurdInputs: absurd.entered, absurdMrr: absurd.mrr,
    scenarioTouches: SM.pricing.scenarioTouches('optimistic')
  };
})())
'@) | ConvertFrom-Json

  $passL2 = $l2.monotonicMrr -and $l2.monotonicArr -and $l2.sourcedStable -and $l2.noSourcedMultiplier -and
            $l2.zeroRevenue -and $l2.absurdClamped
  Record 'L2' 'Pricing logic: conservative <= base <= optimistic, no sourced assumption moves with the scenario, zero users gives zero revenue, absurd inputs are clamped' $passL2 $l2

  # ---------- S1 - both pages load and agree --------------------------
  $pricingTiers = Js 'JSON.stringify(window.__t.tiers())'
  $pricingErrs = Js 'JSON.stringify(window.__errs || ["collector missing"])'
  $pricingLanding = (Js 'JSON.stringify({ url: location.href, title: document.title, calc: !!document.querySelector("#psForm"), fields: document.querySelectorAll(".ps-field").length, assumptions: document.querySelectorAll("#psAssumptions tbody tr").length, figures: window.__t.figures() })') | ConvertFrom-Json
  ShotEl '.ps-calc' 'pricing-calculator'
  ShotEl '#psAssumptions' 'pricing-assumptions'

  Go '/product'
  $productTiers = Js 'JSON.stringify(window.__t.tiers())'
  $productErrs = Js 'JSON.stringify(window.__errs || ["collector missing"])'
  $productLanding = (Js 'JSON.stringify({ url: location.href, title: document.title, segments: document.querySelectorAll(".ps-segment").length, features: document.querySelectorAll(".ps-table tbody tr").length, built: [...document.querySelectorAll(".ps-built")].length, planned: [...document.querySelectorAll(".ps-planned")].length })') | ConvertFrom-Json
  ShotEl '.ps-tiers' 'product-tiers'
  ShotPage 'product-desktop-full' 1280

  $agree = ($pricingTiers -eq $productTiers)
  $passS1 = $agree -and ($pricingErrs -eq '[]') -and ($productErrs -eq '[]') -and $pricingLanding.calc -and
            ($pricingLanding.fields -eq 10) -and ($productLanding.segments -eq 2) -and ($productLanding.features -gt 0) -and
            ($productLanding.built + $productLanding.planned -eq $productLanding.features)
  Record 'S1' 'Both pages load with a clean console, and the three tiers read identically on /product and on /pricing' $passS1 ([ordered]@{
    pricing = $pricingLanding; product = $productLanding; tiersAgree = $agree
    tiersAsRendered = ($pricingTiers | ConvertFrom-Json); pricingConsole = $pricingErrs; productConsole = $productErrs })

  # ---------- S2 - save a scenario ------------------------------------
  Go '/pricing'
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $before = [int](Js 'String(window.__t.savedTotal())')
  # deliberately not the defaults, and not the default scenario
  [void](Js "window.__t.fill({ inputs: { mau: 20000, lookbookRate: 2, lookbookPrice: 300, stylistPay: 120, brands: 10, brandFee: 5000, ordersPerBrand: 1000, pointsAvoided: 4, returnCost: 500, takeRate: 10 }, scenario: 'conservative', label: 'Week 3 test run', note: 'Saved by the Week 3 test script.' }); 'ok'")
  Start-Sleep -Milliseconds 400
  $shown = Js 'JSON.stringify(window.__t.figures())'
  $saved = Js 'window.__t.save()'
  ShotEl '#psForm' 'scenario-saved'
  $row = (Js 'window.__t.lastRow()') | ConvertFrom-Json
  Go '/pricing'
  [void](Js 'window.__t.waitFor(() => window.__t.savedReady()).then(() => "ok")')
  $after = [int](Js 'String(window.__t.savedTotal())')
  $first = Js 'window.__t.savedFirst()'
  ShotEl '#psSaved' 'scenarios-after-reload'

  $storedRight = ($row.scenario -eq 'conservative') -and ($row.label -eq 'Week 3 test run') -and
                 ($row.inputs.mau -eq 20000) -and ($row.inputs.takeRate -eq 10) -and
                 ($row.mrr_mxn -gt 0) -and ($row.arr_mxn -gt $row.mrr_mxn) -and
                 ($row.assumptions_version -eq 'pricing-v1')
  $passS2 = ($saved -like 'Saved to Supabase*') -and ($after -eq $before + 1) -and $storedRight
  Record 'S2' 'Save a scenario: one row per double click, every field stored as entered, read back after a reload' $passS2 ([ordered]@{
    saveMessage = $saved; totalBefore = $before; totalAfter = $after; firstOnPage = $first
    figuresOnScreen = ($shown | ConvertFrom-Json); storedRow = $row; storedAsEntered = $storedRight })

  # ---------- Security -------------------------------------------------
  $sec = (Js @'
(async () => {
  const c = SM.config.supabase, h = { apikey: c.key };
  const u = c.url + '/rest/v1/pricing_scenarios';
  const allowed = await fetch(u + '?select=id,scenario,mrr_mxn&order=created_at.desc&limit=3', { headers: h });
  const note = await fetch(u + '?select=note&limit=1', { headers: h });
  const star = await fetch(u + '?select=*&limit=1', { headers: h });
  const del = await fetch(u + '?id=eq.00000000-0000-0000-0000-000000000000', { method: 'DELETE', headers: h });
  return JSON.stringify({ allowed: allowed.status, latest: await allowed.json(), note: note.status, noteBody: await note.json(), selectStar: star.status, delete: del.status });
})()
'@) | ConvertFrom-Json
  $passSec = ($sec.allowed -eq 200) -and ($sec.note -eq 401) -and ($sec.selectStar -eq 401) -and ($sec.delete -eq 401)
  Record 'S4' 'Security: the public key cannot read note, select *, or delete from pricing_scenarios' $passSec $sec

  # ---------- S3 - responsive, and the sources hold ---------------------
  $widths = @()
  $worst = 0
  foreach ($w in 375, 414, 600, 768, 900, 1280) {
    foreach ($path in '/pricing', '/product') {
      Viewport $w 900 ($w -lt 768)
      Go $path
      [void](Js 'window.__t.waitFor(() => document.querySelector(".ps-tier")).then(() => "ok")')
      $o = [int](Js 'String(document.documentElement.scrollWidth - document.documentElement.clientWidth)')
      $widths += [ordered]@{ width = $w; page = $path; overflowPx = $o }
      if ($o -gt $worst) { $worst = $o }
      if ($w -eq 375 -and $path -eq '/pricing') { ShotPage 'pricing-mobile-375-full' 375 }
    }
  }

  Viewport 1280 900
  Go '/pricing'
  $sources = (Js 'JSON.stringify(SM.pricing.sources())') | ConvertFrom-Json
  $checked = @()
  $bad = 0
  foreach ($s in $sources) {
    if ($s.kind -ne 'web') { $checked += [ordered]@{ id = $s.id; url = $s.url; status = 'not a web source'; ok = $true }; continue }
    $status = Get-LinkStatus $s.url
    $ok = ($status -ge 200 -and $status -lt 400)
    if (-not $ok) { $bad++ }
    $checked += [ordered]@{ id = $s.id; url = $s.url; status = $status; ok = $ok }
  }
  ShotPage 'pricing-desktop-full' 1280

  $passS3 = ($worst -le 0) -and ($bad -eq 0)
  Record 'S3' 'Responsive and sources: no horizontal overflow on either page at 375, 414, 600, 768, 900 or 1280 px, and every source cited in the assumptions table answers' $passS3 ([ordered]@{
    perWidth = $widths; worstOverflowPx = $worst; sourceFailures = $bad; sourcesChecked = $checked })
}
finally {
  $results | ConvertTo-Json -Depth 12 | Out-File -Encoding utf8 (Join-Path $out 'results.json')
  try { $ws.CloseAsync('NormalClosure', 'done', $ct).GetAwaiter().GetResult() } catch {}
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
"results: evidence/results.json"
