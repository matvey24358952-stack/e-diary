# Запускает эмулятор с окном и рабочим микрофоном (нужен для голосового ввода).
# Использование: powershell -ExecutionPolicy Bypass -File .\scripts\start-emulator.ps1

$ErrorActionPreference = 'Stop'
$sdk = 'E:\Android'
$emulator = Join-Path $sdk 'emulator\emulator.exe'
$adb = Join-Path $sdk 'platform-tools\adb.exe'
$avd = 'Medium_Phone_API_37.0'

if (-not (Test-Path $emulator)) { Write-Host "Не найден эмулятор: $emulator" -ForegroundColor Red; exit 1 }

# Без явного dsound-бэкенда микрофон хоста часто не доходит до Android:
# распознавание запускается, но получает тишину.
$env:QEMU_AUDIO_DRV = 'dsound'
$env:QEMU_AUDIO_IN_DRV = 'dsound'
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:ANDROID_AVD_HOME = 'E:\DIarryApp\.android\avd'
$env:ANDROID_EMULATOR_HOME = 'E:\DIarryApp\.android'
$env:ANDROID_USER_HOME = 'E:\DIarryApp\.android'
$env:PATH = "$sdk\platform-tools;$sdk\emulator;$env:PATH"

& $adb start-server | Out-Null

Write-Host 'Запуск эмулятора (окно + звук)...' -ForegroundColor Cyan
Start-Process -FilePath $emulator -ArgumentList '-avd', $avd, '-no-snapshot', '-no-boot-anim' -RedirectStandardOutput 'E:\DIarryApp\emu-out.log' -RedirectStandardError 'E:\DIarryApp\emu-err.log'

for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 3
    $devices = & $adb devices
    if ($devices | Select-String 'emulator-\d+\s+device') {
        $boot = (& $adb shell getprop sys.boot_completed 2>&1) -join ''
        if ($boot -match '1') {
            Write-Host 'Эмулятор загружен. Микрофон проброшен с хоста.' -ForegroundColor Green
            exit 0
        }
    }
}
Write-Host 'Эмулятор не загрузился за отведённое время.' -ForegroundColor Yellow
exit 1
