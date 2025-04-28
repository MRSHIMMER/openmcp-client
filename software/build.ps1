Remove-Item -Recurse -Force dist

tsc

electron-builder

$dmgFile = Get-ChildItem -Path dist -Filter "OpenMCP-0.0.1.exe"
$dmgFile | ForEach-Object { Write-Host "$($_.FullName) size: $([math]::Round($_.Length / 1MB, 2)) MB" }