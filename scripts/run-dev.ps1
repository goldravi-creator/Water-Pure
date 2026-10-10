# Starts the WaterPure RO CRM dev server.
# Use:  powershell -ExecutionPolicy Bypass -File scripts/run-dev.ps1
Set-Location (Split-Path -Parent $PSScriptRoot)
node node_modules/next/dist/bin/next dev -p 3000