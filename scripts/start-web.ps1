# Запускает веб-версию и открывает её в браузере по адресу http://127.0.0.1:5173
# Использование: powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npm run dev" -WorkingDirectory $root -WindowStyle Minimized
Start-Sleep -Seconds 6

$ok = (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
if ($ok -gt 0) {
    Start-Process 'http://127.0.0.1:5173'
    Write-Host 'Веб-версия запущена: http://127.0.0.1:5173' -ForegroundColor Green
} else {
    Write-Host 'Сервер не поднялся. Запустите вручную: npm run dev' -ForegroundColor Red
}
