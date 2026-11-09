<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import BottomNav from './components/BottomNav.vue'
import NotesView from './components/NotesView.vue'
import StatsView from './components/StatsView.vue'
import NoteEditor from './components/NoteEditor.vue'
import { loadNotes, saveNotes, loadLang, saveLang } from './storage'
import { computeStats, normalizeNote } from './utils/notes'
import { syncReminders } from './notifications'
import { useToast } from './composables/useToast'

const { t, locale } = useI18n()
const { toastText, show: toast } = useToast()

const notes = ref([])
const tab = ref('today')
const ready = ref(false)
const now = ref(Date.now())
const editorOpen = ref(false)
const editorNote = ref(null)
const isNew = ref(true)
const digestOpen = ref(false)
const digest = ref({ overdue: 0, today: 0 })

let saveTimer = null
let reminderTimer = null

onMounted(async () => {
  locale.value = await loadLang()
  document.documentElement.lang = locale.value
  notes.value = await loadNotes()
  ready.value = true
  refreshDigest()
  syncReminders(notes.value)
  setInterval(() => (now.value = Date.now()), 60000)

  if (Capacitor.isNativePlatform()) {
    CapApp.addListener('backButton', () => {
      if (editorOpen.value) return closeEditor()
      if (digestOpen.value) return (digestOpen.value = false)
      if (tab.value !== 'today') return (tab.value = 'today')
      CapApp.exitApp()
    })
  }
})

watch(
  notes,
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveNotes(notes.value), 150)
    clearTimeout(reminderTimer)
    reminderTimer = setTimeout(() => syncReminders(notes.value), 1200)
  },
  { deep: true }
)

const stats = computed(() => computeStats(notes.value, now.value))

function refreshDigest() {
  const s = computeStats(notes.value, Date.now())
  digest.value = { overdue: s.overdue, today: s.today }
  digestOpen.value = s.overdue > 0 || s.today > 0
}

function showToday() {
  digestOpen.value = false
  tab.value = 'today'
}

function toggleLang() {
  locale.value = locale.value === 'ru' ? 'en' : 'ru'
  document.documentElement.lang = locale.value
  saveLang(locale.value)
}

function blankNote() {
  const ts = Date.now()
  return normalizeNote({ createdAt: ts, updatedAt: ts })
}

function openNew() {
  isNew.value = true
  editorNote.value = blankNote()
  editorOpen.value = true
}

function openEdit(note) {
  isNew.value = false
  editorNote.value = { ...note }
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  editorNote.value = null
}

function saveNote(data) {
  const ts = Date.now()
  if (isNew.value) {
    notes.value.unshift({ ...data, id: data.id || `${ts}-${Math.random().toString(36).slice(2, 8)}`, createdAt: ts, updatedAt: ts })
  } else {
    const index = notes.value.findIndex((n) => n.id === data.id)
    if (index !== -1) notes.value[index] = { ...data, updatedAt: ts }
  }
  closeEditor()
  toast(t('messages.saved'))
}

function deleteNote(id) {
  notes.value = notes.value.filter((n) => n.id !== id)
  closeEditor()
  toast(t('messages.deleted'))
}

function togglePin(note) {
  note.pinned = !note.pinned
  toast(note.pinned ? t('messages.pinnedOn') : t('messages.pinnedOff'))
}

function toggleStatus(note) {
  note.status = note.status === 'done' ? 'active' : 'done'
  toast(note.status === 'done' ? t('messages.completed') : t('messages.reopened'))
}

const headerSubtitle = computed(() => {
  if (!ready.value) return t('subtitle')
  if (stats.value.overdue > 0) return `${t('group.overdue')}: ${stats.value.overdue} · ${t('stats.active')}: ${stats.value.active}`
  return `${t('stats.active')}: ${stats.value.active} · ${t('stats.todayTasks')}: ${stats.value.today}`
})
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
            <p>{{ headerSubtitle }}</p>
          </div>
        </div>
        <button class="lang" type="button" :title="t('lang')" @click="toggleLang">
          {{ locale === 'ru' ? 'EN' : 'RU' }}
        </button>
      </div>
    </header>

    <main class="content">
      <div v-if="!ready" class="loading"><span class="spinner"></span></div>

      <template v-else>
        <NotesView
          v-if="tab === 'today' || tab === 'all' || tab === 'search'"
          :notes="notes"
          :mode="tab"
          :now="now"
          @edit="openEdit"
          @toggle-pin="togglePin"
          @toggle-status="toggleStatus"
        />
        <StatsView v-else-if="tab === 'stats'" :notes="notes" :now="now" />
      </template>
    </main>

    <button class="fab" type="button" :aria-label="t('actions.add')" @click="openNew">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <BottomNav v-model="tab" />

    <NoteEditor
      v-if="editorOpen && editorNote"
      :note="editorNote"
      :is-new="isNew"
      @save="saveNote"
      @delete="deleteNote"
      @close="closeEditor"
      @toast="toast"
    />

    <transition name="fade">
      <div v-if="digestOpen && ready" class="overlay digest-overlay" @click.self="digestOpen = false">
        <div class="digest-card">
          <div class="digest-icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 1 0 6 8c0 7-3 8-3 8h18s-3-1-3-8" />
              <path d="M10.3 21a2 2 0 0 0 3.4 0" />
            </svg>
          </div>
          <h2>{{ t('digest.title') }}</h2>
          <p class="digest-text">{{ t('digest.text') }}</p>
          <div class="digest-rows">
            <div v-if="digest.overdue" class="digest-row danger">
              {{ t('digest.overdue', { count: digest.overdue }) }}
            </div>
            <div v-if="digest.today" class="digest-row">
              {{ t('digest.today', { count: digest.today }) }}
            </div>
          </div>
          <div class="digest-actions">
            <button type="button" class="ghost-btn" @click="digestOpen = false">{{ t('digest.later') }}</button>
            <button type="button" class="save-btn" @click="showToday">{{ t('actions.show') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="toastText" class="toast">{{ toastText }}</div>
    </transition>
  </div>
</template>
