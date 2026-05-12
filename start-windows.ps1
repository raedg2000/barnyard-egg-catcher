Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Installing packages..." -ForegroundColor Cyan
npm install

Write-Host "Starting Barnyard Egg Catcher..." -ForegroundColor Green
npm run dev
