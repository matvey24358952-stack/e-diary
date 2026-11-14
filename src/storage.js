import { Preferences } from '@capacitor/preferences'
import { normalizeNote } from './utils/notes'

const NOTES_KEY = 'diary.notes.v1'
const LANG_KEY = 'diary.lang.v1'
const VOICE_LANG_KEY = 'diary.voiceLang.v1'

export async function loadNotes() {
  try {
    const { value } = await Preferences.get({ key: NOTES_KEY })
    const data = value ? JSON.parse(value) : []
    return Array.isArray(data) ? data.map(normalizeNote) : []
  } catch {
    return []
  }
}

export async function saveNotes(notes) {
  await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(notes) })
}

export async function loadLang() {
  const { value } = await Preferences.get({ key: LANG_KEY })
  return value === 'en' ? 'en' : 'ru'
}

export async function saveLang(lang) {
  await Preferences.set({ key: LANG_KEY, value: lang })
}

export async function loadVoiceLang() {
  const { value } = await Preferences.get({ key: VOICE_LANG_KEY })
  return value === 'en-US' ? 'en-US' : value === 'ru-RU' ? 'ru-RU' : ''
}

export async function saveVoiceLang(lang) {
  await Preferences.set({ key: VOICE_LANG_KEY, value: lang })
}
