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

/**
 * Starts speech recognition.
 * Returns { stop() } or throws.
 * Callbacks: onPartial(text), onFinal(text), onEnd(), onError(code)
 */
export async function startVoice({ lang = 'ru-RU', onPartial, onFinal, onEnd, onError }) {
  const platform = voicePlatform()

  if (platform === 'native') {
    const perm = await SpeechRecognition.checkPermissions()
    if (perm.speechRecognition !== 'granted') {
      const req = await SpeechRecognition.requestPermissions()
      if (req.speechRecognition !== 'granted') throw new Error('denied')
    }
    const { available } = await SpeechRecognition.available()
    if (!available) throw new Error('unsupported')

    const partial = await SpeechRecognition.addListener('partialResults', (data) => {
      const text = data?.matches?.[0]
      if (text) onPartial?.(text)
    })
    const state = await SpeechRecognition.addListener('listeningState', (data) => {
      if (data?.status === 'stopped') {
        cleanup()
        onEnd?.()
      }
    })

    const cleanup = () => {
      partial?.remove?.()
      state?.remove?.()
    }

    try {
      const res = await SpeechRecognition.start({
        language: lang,
        maxResults: 3,
        prompt: '',
        partialResults: true,
        popup: false
      })
      const match = res?.matches?.[0]
      if (match) onFinal?.(match)
    } catch (e) {
      cleanup()
      throw e
    }

    return {
      stop: async () => {
        try {
          await SpeechRecognition.stop()
        } catch {
          /* already stopped */
        }
        cleanup()
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
