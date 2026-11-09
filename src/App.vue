<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadNotes, saveNotes, loadLang, saveLang } from './storage'
import { isVoiceSupported, startVoice } from './voice'

const { t, locale } = useI18n()

const notes = ref([])
const query = ref('')
const ready = ref(false)
const toastText = ref('')
let toastTimer = null

const sheetOpen = ref(false)
const isNew = ref(true)
const draft = ref({ id: null, title: '', content: '', createdAt: 0, updatedAt: 0 })
const textarea = ref(null)

const listening = ref(false)
const interim = ref('')
let voiceSession = null
let voiceBase = ''
let voiceTimer = null

function toast(message) {
  toastText.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), 2200)
}

onMounted(async () => {
  const savedLang = await loadLang()
  locale.value = savedLang
  document.documentElement.lang = savedLang
  notes.value = await loadNotes()
  ready.value = true
})

async function persist() {
  await saveNotes(notes.value)
}

function toggleLang() {
  const next = locale.value === 'ru' ? 'en' : 'ru'
  locale.value = next
  document.documentElement.lang = next
  saveLang(next)
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return notes.value
  return notes.value.filter(
    (n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
  )
})

function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const groups = computed(() => {
  const list = [...filtered.value].sort((a, b) => b.updatedAt - a.updatedAt)
  const result = []
  let current = null
  for (const note of list) {
    const key = dayKey(note.updatedAt)
    if (!current || current.key !== key) {
      current = { key, label: dayLabel(note.updatedAt), items: [] }
      result.push(current)
    }
    current.items.push(note)
  }
  return result
})

function dayLabel(ts) {
  const now = new Date()
  const d = new Date(ts)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((today - target) / 86400000)
  if (diff === 0) return t('today')
  if (diff === 1) return t('yesterday')
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

function timeOf(ts) {
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ts))
}

function preview(note) {
  const text = (note.content || '').replace(/\s+/g, ' ').trim()
  if (!text) return note.title ? '' : '—'
  return text.length > 120 ? text.slice(0, 120) + '…' : text
}

function openNew() {
  isNew.value = true
  draft.value = { id: null, title: '', content: '', createdAt: Date.now(), updatedAt: Date.now() }
  sheetOpen.value = true
  nextTick(() => textarea.value?.focus())
}

function openEdit(note) {
  isNew.value = false
  draft.value = { ...note }
  sheetOpen.value = true
}

async function closeSheet() {
  await stopMic()
  sheetOpen.value = false
}

const canSave = computed(
  () => draft.value.title.trim().length > 0 || draft.value.content.trim().length > 0
)

async function save() {
  const title = draft.value.title.trim()
  const content = draft.value.content.trim()
  if (!title && !content) {
    toast(t('noContent'))
    return
  }
  await stopMic()
  const now = Date.now()
  if (isNew.value) {
    notes.value.unshift({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      content,
      createdAt: now,
      updatedAt: now
    })
  } else {
    const item = notes.value.find((n) => n.id === draft.value.id)
    if (item) {
      item.title = title
      item.content = content
      item.updatedAt = now
    }
  }
  await persist()
  sheetOpen.value = false
  toast(t('saved'))
}

async function remove(note) {
  notes.value = notes.value.filter((n) => n.id !== note.id)
  await persist()
  sheetOpen.value = false
  toast(t('deleted'))
}

async function toggleMic() {
  if (listening.value) {
    await stopMic()
    return
  }
  if (!isVoiceSupported()) {
    toast(t('voiceUnsupported'))
    return
  }
  voiceBase = draft.value.content
  interim.value = ''
  listening.value = true
  clearTimeout(voiceTimer)
  voiceTimer = setTimeout(() => {
    if (listening.value) stopMic()
  }, 30000)
  try {
    voiceSession = await startVoice({
      lang: locale.value === 'ru' ? 'ru-RU' : 'en-US',
      onPartial: (text) => {
        interim.value = text
        draft.value.content = joinText(voiceBase, text)
      },
      onFinal: (text) => {
        interim.value = ''
        draft.value.content = joinText(voiceBase, text)
        voiceBase = draft.value.content
      },
      onEnd: () => {
        listening.value = false
        interim.value = ''
        voiceSession = null
        clearTimeout(voiceTimer)
      },
      onError: (code) => {
        listening.value = false
        voiceSession = null
        clearTimeout(voiceTimer)
        toast(code === 'not-allowed' || code === 'denied' ? t('voiceDenied') : t('voiceError'))
      }
    })
  } catch (err) {
    listening.value = false
    voiceSession = null
    clearTimeout(voiceTimer)
    const code = String(err?.message || '')
    toast(code === 'denied' ? t('voiceDenied') : t('voiceUnsupported'))
  }
}

function joinText(base, addition) {
  const b = (base || '').trimEnd()
  return b ? `${b} ${addition}` : addition
}

async function stopMic() {
  const session = voiceSession
  voiceSession = null
  listening.value = false
  interim.value = ''
  clearTimeout(voiceTimer)
  if (session) {
    try {
      await session.stop()
    } catch {
      /* ignore */
    }
  }
}
</script>

<template>
  <div class="app">
    <header class="hero">
      <div class="hero-top">
        <div class="brand">
          <div class="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
              <path d="M8 7h8M8 11h8M8 15h5" />
            </svg>
          </div>
          <div class="brand-text">
            <h1>{{ t('app') }}</h1>
            <p>{{ t('subtitle') }}</p>
          </div>
        </div>
        <button class="lang" type="button" :title="t('lang')" @click="toggleLang">
          {{ locale === 'ru' ? 'EN' : 'RU' }}
        </button>
      </div>

      <label v-if="notes.length" class="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input v-model="query" type="search" :placeholder="t('search')" />
      </label>
    </header>

    <main class="content">
      <div v-if="ready && !notes.length" class="empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
            <path d="M8 7h8M8 11h8M8 15h5" />
          </svg>
        </div>
        <h2>{{ t('empty') }}</h2>
        <p>{{ t('emptyHint') }}</p>
      </div>

      <div v-else-if="!filtered.length" class="empty small">
        <p>{{ t('empty') }}</p>
      </div>

      <section v-for="group in groups" :key="group.key" class="group">
        <h2 class="group-title">{{ group.label }}</h2>
        <article v-for="note in group.items" :key="note.id" class="card" @click="openEdit(note)">
          <div class="card-main">
            <h3 v-if="note.title">{{ note.title }}</h3>
            <p class="preview">{{ preview(note) }}</p>
          </div>
          <div class="card-side">
            <time>{{ timeOf(note.updatedAt) }}</time>
            <button class="icon-btn ghost" type="button" @click.stop="remove(note)" :aria-label="t('delete')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </button>
          </div>
        </article>
      </section>
    </main>

    <button class="fab" type="button" :aria-label="t('quick')" @click="openNew">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <transition name="fade">
      <div v-if="sheetOpen" class="overlay" @click.self="closeSheet">
        <div class="sheet">
          <div class="sheet-head">
            <button class="icon-btn ghost" type="button" @click="closeSheet" :aria-label="t('close')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <span class="sheet-title">{{ isNew ? t('newNote') : t('editNote') }}</span>
            <button class="save-btn" type="button" :disabled="!canSave" @click="save">{{ t('save') }}</button>
          </div>

          <input v-model="draft.title" class="title-input" type="text" :placeholder="t('titlePlaceholder')" />

          <div class="editor">
            <textarea
              ref="textarea"
              v-model="draft.content"
              class="content-input"
              :placeholder="t('contentPlaceholder')"
              rows="8"
            ></textarea>
            <button
              class="mic"
              type="button"
              :class="{ listening }"
              :aria-label="listening ? t('stopVoice') : t('voiceStart')"
              @click="toggleMic"
            >
              <svg v-if="!listening" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="2.5" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2.5" />
              </svg>
            </button>
          </div>

          <p v-if="listening" class="listening-hint">
            <span class="dot"></span>{{ t('listening') }}<em v-if="interim"> {{ interim }}</em>
          </p>

          <div class="sheet-foot">
            <span class="meta">{{ draft.updatedAt ? timeOf(draft.updatedAt) : '' }}</span>
            <span class="meta">{{ t('notes') }}: {{ notes.length }}</span>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="toastText" class="toast">{{ toastText }}</div>
    </transition>
  </div>
</template>
