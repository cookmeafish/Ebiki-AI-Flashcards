# Launcher text for the PowerShell scripts (launch.ps1, anki-start.ps1, anki-update.ps1, setup.ps1,
# install-ankiconnect.ps1). Dot-source it, then:  Tr 'ln_updating'   or   Tr 'ln_ankiUpdated' @{ version = $v }
# The text itself lives in src/i18n/locales/<code>.js (the ONE place for UI text); scripts/launcher-strings.json
# is its generated copy (npm run i18n:launcher). Language: applang.json (the app language, written by the
# server) -> the Windows display language -> English. Never throws: a missing or broken file means English,
# and a missing key shows the key itself.
$script:LauncherText = $null
$script:LauncherFallback = $null
$script:LauncherLang = 'en'

function Initialize-LauncherText {
  $appDir = Split-Path $PSScriptRoot -Parent
  $all = $null
  try { $all = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'launcher-strings.json') -Raw -Encoding UTF8 -ErrorAction Stop | ConvertFrom-Json } catch {}
  if (-not $all -or -not $all.langs) { return }
  $fallback = if ($all.fallback) { [string]$all.fallback } else { 'en' }
  $lang = $null
  try {
    $f = Join-Path $appDir 'applang.json'
    if (Test-Path -LiteralPath $f) { $lang = [string]((Get-Content -LiteralPath $f -Raw -Encoding UTF8 -ErrorAction Stop | ConvertFrom-Json).lang) }
  } catch {}
  if (-not $lang -or -not $all.langs.$lang) {
    try { $lang = (Get-UICulture).TwoLetterISOLanguageName } catch { $lang = $null }
  }
  if (-not $lang -or -not $all.langs.$lang) { $lang = $fallback }
  $script:LauncherLang = $lang
  $script:LauncherText = $all.langs.$lang
  $script:LauncherFallback = $all.langs.$fallback
}

# The text for $key in the chosen language (English when this language lacks it), with {name} placeholders
# filled from $vars.
function Tr([string]$key, [hashtable]$vars = @{}) {
  if ($null -eq $script:LauncherText) { Initialize-LauncherText }
  $s = $null
  if ($script:LauncherText -and $null -ne $script:LauncherText.$key) { $s = [string]$script:LauncherText.$key }
  elseif ($script:LauncherFallback -and $null -ne $script:LauncherFallback.$key) { $s = [string]$script:LauncherFallback.$key }
  else { $s = $key }
  foreach ($name in $vars.Keys) { $s = $s.Replace('{' + $name + '}', [string]$vars[$name]) }
  return $s
}
