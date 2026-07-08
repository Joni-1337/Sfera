$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$user = "Joni-1337"
$repo = "sfera"
if ($args.Count -ge 1) { $user = $args[0] }
if ($args.Count -ge 2) { $repo = $args[1] }

$url = "https://github.com/$user/$repo.git"

Write-Host "GitHub: $url"
Write-Host ""
Write-Host "1. Create empty repo at: https://github.com/new?name=$repo"
Write-Host "2. Then run:"
Write-Host ""

if (git remote get-url origin 2>$null) {
  git remote set-url origin $url
} else {
  git remote add origin $url
}

git branch -M main
git push -u origin main

Write-Host ""
Write-Host "Done. Connect this repo in Timeweb App Platform."
