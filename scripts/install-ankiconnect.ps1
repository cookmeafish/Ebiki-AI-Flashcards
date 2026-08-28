# AnkiConnect: install it, and PROVE it landed.
#
# Ebiki reads and writes every card through AnkiConnect on 127.0.0.1:8765, so a
# machine with Anki but no add-on looks to the user like Ebiki itself is broken.
# This file is the ONE implementation of getting it there, used from both ends:
#   - scripts/setup.ps1 dot-sources it (no -Install) to reuse the function;
#   - the dev server runs it with -Install for the in-app repair button, so a
#     machine whose install missed the add-on can fix itself without the
#     installer, a terminal, or the user knowing what an add-on is.
# Keeping it in one place is deliberate: the installer and the repair button
# drifting apart is exactly how one of them ends up subtly broken.
#
# -Install also prints a single JSON line, which is what the server parses.
param([switch]$Install)

# Where Anki keeps its data (ANKI_BASE overrides, same as Anki itself).
function Get-AnkiBase {
  if ($env:ANKI_BASE) { return $env:ANKI_BASE }
  return (Join-Path $env:APPDATA 'Anki2')
}

# Find an installed AnkiConnect by its SIGNATURE, not by add-on code: several
# forks expose the same API (e.g. "Anki Connect Plus", code 2036732292) and Anki
# flags them as CONFLICTING with the original, so installing 2055492159 on top of
# one would break a working setup. Every variant ships a config.json with
# webBindPort, which is the thing Ebiki actually talks to.
function Find-AnkiConnect($base) {
  $dir = Join-Path $base 'addons21'
  if (-not (Test-Path $dir)) { return $null }
  foreach ($d in (Get-ChildItem $dir -Directory -ErrorAction SilentlyContinue)) {
    $cfg = Join-Path $d.FullName 'config.json'
    if ((Test-Path (Join-Path $d.FullName '__init__.py')) -and (Test-Path $cfg)) {
      $txt = Get-Content $cfg -Raw -ErrorAction SilentlyContinue
      if ($txt -and $txt -match 'webBindPort') { return $d }
    }
  }
  return $null
}

# Fetch and unpack the add-on. The old version trusted ONE download and a single
# `Test-Path __init__.py`, so any hiccup (AnkiWeb unreachable, a proxy or
# antivirus serving an HTML error page as if it were the zip, a partial write)
# ended as a yellow warning in a console window nobody reads - and the machine
# then had Anki with no add-on. Two sources, staged in TEMP and only copied into
# place once verified:
#   1. AnkiWeb, the same endpoint Anki's own "Browse & Install" uses;
#   2. GitHub (the add-on's source repo), whose zip nests everything under
#      <repo>-master/plugin/, so the payload folder is LOCATED, never assumed.
# Returns the source name on success; throws with BOTH reasons if both fail.
function Install-AnkiConnect($addonDir) {
  $errors = @()
  foreach ($src in @(
    @{ name = 'AnkiWeb'; url = 'https://ankiweb.net/shared/download/2055492159?v=2.1&p=250600' },
    @{ name = 'GitHub';  url = 'https://codeload.github.com/FooSoft/anki-connect/zip/refs/heads/master' }
  )) {
    $stage = Join-Path $env:TEMP ('ebiki-ac-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    $zip = "$stage.zip"   # must end in .zip or Expand-Archive refuses it
    try {
      Write-Host "  Downloading AnkiConnect from $($src.name)..."
      try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
      Invoke-WebRequest -Uri $src.url -OutFile $zip -UseBasicParsing -ErrorAction Stop
      New-Item -ItemType Directory -Force -Path $stage | Out-Null
      Expand-Archive -Path $zip -DestinationPath $stage -Force -ErrorAction Stop
      # Where the add-on's own files ended up: the AnkiWeb .ankiaddon is flat, the
      # GitHub zip nests them. Find the folder that actually holds __init__.py.
      $init = Get-ChildItem $stage -Recurse -Filter '__init__.py' -File -ErrorAction SilentlyContinue | Select-Object -First 1
      if (-not $init) { throw 'the download contained no add-on files' }
      $payload = $init.Directory
      # The signature Ebiki actually depends on. A login page or an error blob
      # renamed .zip cannot get this far, and neither can the wrong repository.
      $cfg = Join-Path $payload.FullName 'config.json'
      if (-not (Test-Path $cfg) -or -not ((Get-Content $cfg -Raw) -match 'webBindPort')) {
        throw 'the downloaded files are not AnkiConnect'
      }
      New-Item -ItemType Directory -Force -Path $addonDir | Out-Null
      Copy-Item (Join-Path $payload.FullName '*') $addonDir -Recurse -Force
      if (-not (Test-Path (Join-Path $addonDir '__init__.py'))) { throw 'the add-on could not be written into the Anki folder' }
      # Anki writes this itself on first load; seeding it just makes the add-on
      # list show a real name. No "config" key, so AnkiConnect's own defaults win
      # (127.0.0.1:8765 - which is exactly what Ebiki's server talks to).
      '{ "name": "AnkiConnect", "mod": 0, "disabled": false }' | Set-Content (Join-Path $addonDir 'meta.json') -Encoding UTF8
      return $src.name
    } catch {
      $errors += "$($src.name): $($_.Exception.Message)"
    } finally {
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  throw ($errors -join '; ')
}

if ($Install) {
  $base = Get-AnkiBase
  $result = @{ ok = $false }
  try {
    $existing = Find-AnkiConnect $base
    if ($existing) {
      # Already there (possibly a fork). Never install on top of one - Anki marks
      # the original and its forks as conflicting, so that would break a setup
      # that works. Report it and let the app tell the user to restart Anki.
      $result = @{ ok = $true; alreadyInstalled = $true; dir = $existing.FullName; base = $base }
    } else {
      $from = Install-AnkiConnect (Join-Path $base 'addons21\2055492159')
      $result = @{ ok = $true; installedFrom = $from; dir = (Join-Path $base 'addons21\2055492159'); base = $base }
    }
    # Anki loads add-ons at startup only, so a running Anki has to be restarted.
    $result.ankiRunning = [bool](Get-Process -Name 'anki', 'ankiw' -ErrorAction SilentlyContinue)
  } catch {
    $result = @{ ok = $false; error = $_.Exception.Message; base = $base }
  }
  # One JSON line on stdout is the contract with the server. Write-Host above goes
  # to the console and is ignored by it.
  [Console]::Out.WriteLine((ConvertTo-Json $result -Compress))
}
