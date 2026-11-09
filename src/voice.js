import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

export function voicePlatform() {
  if (Capacitor.isNativePlatform()) return 'native'
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  return SR ? 'web' : 'none'
}

export function isVoiceSupported() {
  return voicePlatform() !== 'none'
}

// Listeners of the previous recognition session; removed when a new one starts.
let releasePrevious = null

/**
 * Starts speech recognition.
 * Returns { stop() } or throws.
 * Callbacks: onPartial(text), onFinal(text), onEnd(), onError(code)
 */
export async function startVoice({ lang = 'ru-RU', onPartial, onFinal, onEnd, onError }) {
  const platform = voicePlatform()

  if (platform === 'native') {
    if (releasePrevious) {
      try {
        releasePrevious()
      } catch {
        /* ignore */
      }
      releasePrevious = null
    }

    const perm = await SpeechRecognition.checkPermissions()
    if (perm.speechRecognition !== 'granted') {
      const req = await SpeechRecognition.requestPermissions()
      if (req.speechRecognition !== 'granted') throw new Error('denied')
    }
    const { available } = await SpeechRecognition.available()
    if (!available) throw new Error('unsupported')

    let released = false
    const cleanup = () => {
      if (released) return
      released = true
      releasePrevious = null
      try {
        partial?.remove?.()
        state?.remove?.()
      } catch {
        /* ignore */
      }
    }
    releasePrevious = cleanup

    const partial = await SpeechRecognition.addListener('partialResults', (data) => {
      const text = data?.matches?.[0]
      if (text) onPartial?.(text)
    })
    const state = await SpeechRecognition.addListener('listeningState', (data) => {
      // "stopped" means the engine finished capturing, but the final transcript
      // may arrive a couple of seconds later, so listeners stay alive.
      if (data?.status === 'stopped') onEnd?.()
    })

    // Do not await start(): on Android it resolves when recognition finishes,
    // so the caller would not get a session handle while listening.
    // popup: true — Android shows its own "Speak now" dialog with a live level
    // meter, so the user sees that the microphone is actually working.
    SpeechRecognition.start({
      language: lang,
      maxResults: 3,
      prompt: '',
      partialResults: false,
      popup: true
    })
      .then((res) => {
        const match = res?.matches?.[0]
        if (match) onFinal?.(match)
      })
      .catch((error) => {
        const message = String(error?.message || error || 'error')
        cleanup()
        onError?.(message)
      })

    return {
      stop: async () => {
        try {
          await Promise.race([
            SpeechRecognition.stop(),
            new Promise((resolve) => setTimeout(resolve, 1500))
          ])
        } catch {
          /* already stopped */
        }
        // Late transcript after a manual stop should still reach the field.
        setTimeout(cleanup, 2000)
      }
    }
  }

  if (platform === 'web') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1

    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      if (finalText) onFinal?.(finalText.trim())
      else if (interim) onPartial?.(interim.trim())
    }
    rec.onerror = (e) => onError?.(e.error)
    rec.onend = () => onEnd?.()

    rec.start()
    return { stop: () => rec.stop() }
  }

  throw new Error('unsupported')
}
