<script setup>
import { computed, reactive, ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { PRIORITIES, STATUSES, TAGS, PRIORITY_COLOR, TAG_COLOR } from '../constants'
import { fromLocalInput, toLocalInput, formatDue } from '../utils/notes'
import { isVoiceSupported, startVoice } from '../voice'

const props = defineProps({
  note: { type: Object, required: true },
  isNew: { type: Boolean, default: true }
})

const emit = defineEmits(['save', 'delete', 'close', 'toast'])
const { t, locale } = useI18n()

const draft = reactive({ ...props.note })
const textarea = ref(null)
const listening = ref(false)
const interim = ref('')

let voiceSession = null
let voiceBase = ''
let voiceTimer = null

onMounted(() => nextTick(() => textarea.value?.focus()))

const canSave = computed(() => draft.title.trim().length > 0 || draft.content.trim().length > 0)

const dueValue = computed({
  get: () => toLocalInput(draft.due),
  set: (value) => {
    draft.due = fromLocalInput(value)
  }
})

function save() {
  if (!canSave.value) {
    emit('toast', t('messages.noContent'))
    return
  }
  stopMic()
  emit('save', { ...draft })
}

const joinText = (base, addition) => {
  const b = (base || '').trimEnd()
  return b ? `${b} ${addition}` : addition
}

async function toggleMic() {
  if (listening.value) {
    await stopMic()
    return
  }
  if (!isVoiceSupported()) {
    emit('toast', t('voice.unsupported'))
    return
  }
  voiceBase = draft.content
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
        draft.content = joinText(voiceBase, text)
      },
      onFinal: (text) => {
        interim.value = ''
        draft.content = joinText(voiceBase, text)
        voiceBase = draft.content
      },
      onEnd: () => {
        listening.value = false
        interim.value = ''
        voiceSession = null
        clearTimeout(voiceTimer)
        const base = voiceBase
        setTimeout(() => {
          if (draft.content.trim() === base.trim()) emit('toast', t('voice.empty'))
        }, 5000)
      },
      onError: (code) => {
        listening.value = false
        voiceSession = null
        clearTimeout(voiceTimer)
        emit('toast', code === 'not-allowed' || code === 'denied' ? t('voice.denied') : t('voice.error'))
      }
    })
  } catch (err) {
    listening.value = false
    voiceSession = null
    clearTimeout(voiceTimer)
    const code = String(err?.message || '')
    emit('toast', code === 'denied' ? t('voice.denied') : t('voice.unsupported'))
  }
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
  <div class="overlay" @click.self="emit('close')">
    <div class="sheet editor-sheet">
      <div class="sheet-head">
        <button type="button" class="icon-btn ghost" :aria-label="t('actions.close')" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <span class="sheet-title">{{ isNew ? t('editor.new') : t('editor.edit') }}</span>
        <button type="button" class="save-btn" :disabled="!canSave" @click="save">{{ t('actions.save') }}</button>
      </div>

      <div class="editor-body">
        <input v-model="draft.title" class="title-input" type="text" :placeholder="t('fields.titlePlaceholder')" />

        <div class="editor">
          <textarea
            ref="textarea"
            v-model="draft.content"
            class="content-input"
            :placeholder="t('fields.contentPlaceholder')"
            rows="6"
          ></textarea>
          <button
            type="button"
            class="mic"
            :class="{ listening }"
            :aria-label="listening ? t('voice.stop') : t('voice.start')"
            @click="toggleMic"
          >
            <svg v-if="!listening" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="2.5" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          </button>
        </div>

        <p v-if="listening" class="listening-hint">
          <span class="dot"></span>{{ t('voice.listening') }}<em v-if="interim"> {{ interim }}</em>
        </p>

        <div class="field-group">
          <span class="field-label">{{ t('priority.label') }}</span>
          <div class="chip-row">
            <button
              v-for="priority in PRIORITIES"
              :key="priority"
              type="button"
              class="choice-chip"
              :class="{ active: draft.priority === priority }"
              :style="draft.priority === priority ? { borderColor: PRIORITY_COLOR[priority], color: PRIORITY_COLOR[priority] } : {}"
              @click="draft.priority = priority"
            >
              <i :style="{ background: PRIORITY_COLOR[priority] }"></i>{{ t(`priority.${priority}`) }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <span class="field-label">{{ t('tag.label') }}</span>
          <div class="chip-row">
            <button
              v-for="tag in TAGS"
              :key="tag"
              type="button"
              class="choice-chip"
              :class="{ active: draft.tag === tag }"
              :style="draft.tag === tag ? { background: TAG_COLOR[tag], borderColor: TAG_COLOR[tag], color: '#fff' } : {}"
              @click="draft.tag = tag"
            >
              {{ t(`tag.${tag}`) }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <span class="field-label">{{ t('status.label') }}</span>
          <div class="segmented">
            <button
              v-for="status in STATUSES"
              :key="status"
              type="button"
              :class="{ active: draft.status === status }"
              @click="draft.status = status"
            >
              {{ t(`status.${status}`) }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="due-input">{{ t('fields.due') }}</label>
          <div class="row-input">
            <input id="due-input" v-model="dueValue" type="datetime-local" class="text-input" />
            <button v-if="draft.due" type="button" class="ghost-btn" @click="draft.due = null">
              {{ t('actions.clear') }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="url-input">{{ t('fields.url') }}</label>
          <input id="url-input" v-model="draft.url" type="url" class="text-input" :placeholder="t('fields.urlPlaceholder')" />
        </div>

        <div class="pin-row">
          <span class="pin-label">{{ t('fields.pinned') }}</span>
          <button type="button" class="switch" :class="{ on: draft.pinned }" @click="draft.pinned = !draft.pinned">
            <span></span>
          </button>
        </div>
      </div>

      <div class="sheet-foot">
        <button v-if="!isNew" type="button" class="danger-btn" @click="emit('delete', draft.id)">
          {{ t('actions.delete') }}
        </button>
        <span class="meta">{{
          draft.due ? formatDue(draft.due, locale === 'ru' ? 'ru-RU' : 'en-US') : t('fields.noDeadline')
        }}</span>
      </div>
    </div>
  </div>
</template>
