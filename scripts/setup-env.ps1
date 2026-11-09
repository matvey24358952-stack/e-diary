# Настраивает переменные окружения для сборки Android-проекта.
# Запускать в обычном PowerShell (не в песочнице):  powershell -ExecutionPolicy Bypass -File .\scripts\setup-env.ps1

$jdk = 'E:\DIarryApp\tools\jdk\jdk-21.0.13+9'
$sdk = 'E:\Android'

if (-not (Test-Path $jdk)) {
    Write-Host "JDK не найден: $jdk" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $sdk)) {
    Write-Host "Android SDK не найден: $sdk" -ForegroundColor Red
    exit 1
}

[Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdk, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdk, 'User')

$path = [Environment]::GetEnvironmentVariable('Path', 'User')
$add = @("$sdk\platform-tools", "$sdk\emulator", "$jdk\bin")
$parts = @($path -split ';' | Where-Object { $_ })
foreach ($entry in $add) {
    if ($parts -notcontains $entry) { $parts += $entry }
}
[Environment]::SetEnvironmentVariable('Path', ($parts -join ';'), 'User')

Write-Host 'Готово. Перезапустите терминал, чтобы применились PATH/JAVA_HOME/ANDROID_HOME.' -ForegroundColor Green
Write-Host "JAVA_HOME   = $jdk"
Write-Host "ANDROID_HOME= $sdk"
