import { Preferences } from '@capacitor/preferences'

const NOTES_KEY = 'diary.notes.v1'
const LANG_KEY = 'diary.lang.v1'

export async function loadNotes() {
  try {
    const { value } = await Preferences.get({ key: NOTES_KEY })
    const data = value ? JSON.parse(value) : []
    return Array.isArray(data) ? data : []
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
