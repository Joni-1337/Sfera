$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "deploy"
$zipPath = Join-Path $outDir "sfera-deploy.zip"

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

$excludeDirs = @("node_modules", ".next", "deploy", ".git")
$excludeFiles = @(".env", "sfera-deploy.zip")

$tempDir = Join-Path $env:TEMP "sfera-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir | Out-Null

function Copy-ProjectItem {
  param([string]$Source, [string]$Dest)
  Get-ChildItem -Path $Source -Force | ForEach-Object {
    $name = $_.Name
    if ($excludeDirs -contains $name) { return }
    if ($excludeFiles -contains $name) { return }
    $target = Join-Path $Dest $name
    if ($_.PSIsContainer) {
      Copy-Item $_.FullName $target -Recurse -Force
    } else {
      Copy-Item $_.FullName $target -Force
    }
  }
}

Copy-ProjectItem -Source $root -Dest $tempDir

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "Done: $zipPath"
Write-Host "Size MB: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2))"
