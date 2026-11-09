# Электронный ежедневник (Vue 3 + Capacitor)

Мобильное приложение-ежедневник: заметки создаются, редактируются и удаляются, хранятся локально на устройстве, есть голосовой ввод в поле содержания и переключение языка RU/EN.

## Что умеет

- список заметок с группировкой по дням и поиском;
- создание, редактирование и удаление заметок;
- локальное хранение (Capacitor Preferences → Android SharedPreferences / localStorage в браузере) — заметки сохраняются между запусками;
- быстрый ввод: FAB «+» открывает шторку с полем содержания и кнопкой микрофона;
- голосовой ввод: нативный плагин `@capacitor-community/speech-recognition` на Android, Web Speech API в браузере; распознанный текст подставляется в поле содержания;
- интерфейс RU/EN, выбранный язык сохраняется.

## Стек

Vue 3 · Vite · Capacitor 8 · vue-i18n · Capacitor Preferences · @capacitor-community/speech-recognition.

## Запуск в браузере

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

Голосовой ввод в браузере работает в Chrome/Edge (Web Speech API) и требует разрешения на микрофон.

## Сборка и запуск на Android

Требования: JDK 17+ (проверено на JDK 21), Android SDK с platform-tools, build-tools 36 и платформой API 37.

```bash
# 1. веб-сборка + копирование в нативный проект
npm run build
npx cap sync android

# 2. сборка APK
cd android
gradlew.bat assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# 3. установка на запущенный эмулятор/устройство
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.diary.app/.MainActivity
```

Открыть проект в Android Studio:

```bash
npx cap open android
```

Эмулятор (AVD уже создан в этом окружении):

```bash
emulator -avd Medium_Phone_API_37.0
```

В Android Studio: **Device Manager → Medium_Phone_API_37.0 → ▶**, затем **Run 'app'**.

### Переменные окружения

```powershell
$env:ANDROID_HOME='E:\Android'
$env:JAVA_HOME='E:\DIarryApp\tools\jdk\jdk-21.0.13+9'
$env:GRADLE_USER_HOME='E:\DIarryApp\.gradle'
```

Особенности этого окружения: Android SDK доступен только на чтение, поэтому в проекте зафиксированы `compileSdk 37`, `buildToolsVersion 36.0.0` (см. `android/variables.gradle`), а для подписи debug-сборки используется локальный ключ `android/keystore/debug.keystore`.

## Голосовой ввод

- Android: `SpeechRecognition.start({ partialResults: true })`, распознанный текст добавляется в конец поля содержания (частичные результаты показываются сразу).
- Разрешение `RECORD_AUDIO` объявлено в `android/app/src/main/AndroidManifest.xml`, сервис распознавания — в блоке `<queries>`.
- Если на устройстве нет сервиса распознавания речи, показывается сообщение «Голосовой ввод недоступен».

## Структура

```
src/
  App.vue        — экран списка, шторка быстрого ввода/редактирования
  storage.js     — обёртка над Capacitor Preferences (JSON)
  voice.js       — нативный плагин + Web Speech API
  i18n.js        — сообщения RU/EN
  style.css      — оформление
android/         — нативный проект Capacitor
```

## Проверка на эмуляторе

1. Запустить эмулятор и дождаться загрузки (`adb wait-for-device`, `adb shell getprop sys.boot_completed` → `1`).
2. Установить APK и открыть приложение.
3. Нажать «+», ввести текст, нажать микрофон (разрешить доступ к микрофону при запросе) — текст появится в поле содержания.
4. Сохранить заметку, перезапустить приложение — заметка на месте.
