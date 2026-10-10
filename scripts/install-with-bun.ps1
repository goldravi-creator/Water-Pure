# =====================================================================
#  install-with-bun.ps1 — reliable install recipe for this machine
#
#  WHY NOT `npm install`?
#  ---------------------
#  This machine's local network/firewall corrupts long-lived encrypted
#  TCP transfers to registry.npmjs.org (npm dies with
#  ERR_SSL_CIPHER_OPERATION_FAILED / ECONNRESET on multi-MB responses).
#  Empirically:
#    *  GETs through Node's npm/TLS stack on the npmjs CDN  -> fails
#    *  Bun (BoringSSL) + npmmirror CDN (bunfig.toml)        -> works
#    *  Prisma engine downloads from binaries.prisma.sh      -> flaky,
#       so we pre-stage them into the Prisma cache with curl.
#
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts/install-with-bun.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$bunDir = Join-Path $env:LOCALAPPDATA "bun"
$bunExe = Join-Path $bunDir "bun.exe"

# ---- 1. Make sure Bun is available ----------------------------------
if (-not (Test-Path $bunExe)) {
  Write-Host "Downloading Bun ..." -ForegroundColor Cyan
  $tmp = Join-Path $env:TEMP "bun"
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $zip = Join-Path $tmp "bun.zip"
  for ($i = 1; $i -le 3; $i++) {
    curl.exe -L --fail --http1.1 --connect-timeout 30 --max-time 500 -o $zip `
      "https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip"
    if ($LASTEXITCODE -eq 0) { break }
    Write-Host "  retry $i ..."
  }
  if ($LASTEXITCODE -ne 0) { throw "Failed to download Bun" }
  New-Item -ItemType Directory -Force -Path $bunDir | Out-Null
  tar.exe -xzf $zip -C $bunDir --strip-components=1 # bun.exe lands in $bunDir
}

Write-Host "Bun: $(& $bunExe --version)" -ForegroundColor Cyan

# ---- 2. bun install (uses registry in bunfig.toml = npmmirror) ------
Write-Host "bun install ..." -ForegroundColor Cyan
& $bunExe install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "bun install failed (run again — it is resumable)" }

# ---- 3. Stage Prisma engine binaries (skip the flaky binaries.prisma.sh) -
$hash = "605197351a3c8bdd595af2d2a9bc3025bca48ea2"  # 5.22.0-44
$cacheDir = Join-Path $env:APPDATA "Prisma\all_commits\$hash\windows"
$engDir = Join-Path $root "node_modules\@prisma\engines"
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
New-Item -ItemType Directory -Force -Path $engDir | Out-Null

$files = @(
  @{ urlFile = "query_engine.dll.node.gz"; cacheName = "query_engine-windows.dll.node"; targetName = "query_engine-windows.dll.node" },
  @{ urlFile = "schema-engine.exe.gz";     cacheName = "schema-engine-windows.exe";     targetName = "schema-engine-windows.exe" }
)

function Get-Engine([string]$urlFile, [string]$outFile) {
  $tmp = Join-Path $env:TEMP "prisma-engine-$([guid]::NewGuid().ToString('N')).gz"
  for ($i = 1; $i -le 6; $i++) {
    curl.exe -L --fail --http1.1 --connect-timeout 30 --max-time 600 -o $tmp `
      "https://binaries.prisma.sh/all_commits/$hash/windows/$urlFile"
    if ($LASTEXITCODE -eq 0 -and (Test-Path $tmp) -and (Get-Item $tmp).Length -gt 1000000) { break }
    Write-Host "  engine retry $i ($urlFile)"
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
  if (-not (Test-Path $tmp)) { throw "Could not download Prisma engine $urlFile" }
  # gunzip via .NET
  $in = [System.IO.File]::OpenRead($tmp)
  $gs = New-Object System.IO.Compression.GZipStream($in, [System.IO.Compression.CompressionMode]::Decompress)
  $out = [System.IO.File]::Create($outFile)
  $gs.CopyTo($out); $out.Close(); $gs.Close(); $in.Close()
  Remove-Item $tmp -Force
  return (Get-FileHash -Algorithm SHA256 $outFile).Hash.ToLower()
}

foreach ($f in $files) {
  $cacheTarget = Join-Path $cacheDir $f.cacheName
  if (-not (Test-Path $cacheTarget)) {
    Write-Host "Fetching engine: $($f.cacheName)" -ForegroundColor Cyan
    $sha = Get-Engine $f.urlFile $cacheTarget
    Set-Content -Path "$cacheTarget.sha256" -Value $sha -NoNewline
  }
  Copy-Item $cacheTarget (Join-Path $engDir $f.targetName) -Force
}

# ---- 4. Generate client, create DB, seed ------------------------------
Write-Host "prisma generate / db push / seed ..." -ForegroundColor Cyan
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js db push
node node_modules/tsx/dist/cli.mjs prisma/seed.ts

Write-Host ""
Write-Host "Done. Start the app:  node node_modules/next/dist/bin/next dev -p 3000" -ForegroundColor Green