# Push to GitHub using a Personal Access Token (PAT) without storing it in git config.
# Usage (PowerShell):
#   $env:GITHUB_TOKEN = "ghp_xxxxxxxx"   # classic PAT with repo scope, or fine-grained with Contents: Read and write
#   .\scripts\push-github.ps1

$ErrorActionPreference = "Stop"
if (-not $env:GITHUB_TOKEN) {
    Write-Host "Set GITHUB_TOKEN to a GitHub PAT, then run this script again." -ForegroundColor Yellow
    exit 1
}

Set-Location $PSScriptRoot\..
$token = $env:GITHUB_TOKEN.Trim()
git -c "http.extraheader=AUTHORIZATION: bearer $token" push -u origin main
