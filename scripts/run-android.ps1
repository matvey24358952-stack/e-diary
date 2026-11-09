# Собирает debug APK, ставит его на запущенный эмулятор/устройство и открывает приложение.
# Использование: powershell -ExecutionPolicy Bypass -File .\scripts\run-android.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$jdk = 'E:\DIarryApp\tools\jdk\jdk-21.0.13+9'
$sdk = 'E:\Android'
$adb = Join-Path $sdk 'platform-tools\adb.exe'

if (-not (Test-Path $jdk)) { Write-Host "Не найден JDK: $jdk" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $sdk)) { Write-Host "Не найден Android SDK: $sdk" -ForegroundColor Red; exit 1 }

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:GRADLE_USER_HOME = Join-Path $root '.gradle'

# Java on this machine cannot write to the user profile, so keep temp files inside the project.
$env:TMP = Join-Path $root '.tmp'
$env:TEMP = $env:TMP
New-Item -ItemType Directory -Force -Path $env:TMP | Out-Null

$env:PATH = "$jdk\bin;$sdk\platform-tools;$env:PATH"

& $adb start-server | Out-Null
$devices = & $adb devices
if (-not ($devices | Select-String 'emulator-\d+\s+device|device$')) {
    Write-Host 'Нет подключённого устройства. Запустите эмулятор:' -ForegroundColor Yellow
    Write-Host '  emulator -avd Medium_Phone_API_37.0'
    exit 1
}

Write-Host 'Сборка и установка APK...' -ForegroundColor Cyan
Set-Location (Join-Path $root 'android')
& .\gradlew.bat installDebug --console=plain
if ($LASTEXITCODE -ne 0) { Write-Host 'Сборка не удалась.' -ForegroundColor Red; exit $LASTEXITCODE }

& $adb shell am force-stop com.diary.app | Out-Null
& $adb shell am start -n com.diary.app/.MainActivity | Out-Null
Write-Host 'Готово: приложение запущено на устройстве.' -ForegroundColor Green
