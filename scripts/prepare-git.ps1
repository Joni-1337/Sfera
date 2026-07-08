$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path ".git")) {
  git init
  Write-Host "Git init OK"
}

git add .
Write-Host ""
Write-Host "Файлы добавлены. Дальше:"
Write-Host "  git commit -m `"Deploy Sfera`""
Write-Host "  git remote add origin https://github.com/USER/sfera.git"
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "Затем в Timeweb Cloud -> App Platform -> Next.js + SSR -> подключить репозиторий."
