<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PRIORITY_COLOR, TAG_COLOR } from '../constants'
import { formatDue, isOverdue } from '../utils/notes'

const props = defineProps({
  note: { type: Object, required: true },
  now: { type: Number, default: () => Date.now() }
})

const emit = defineEmits(['edit', 'toggle-pin', 'toggle-status'])
const { t, locale } = useI18n()

const overdue = computed(() => isOverdue(props.note, props.now))
const done = computed(() => props.note.status === 'done')

const heading = computed(() => {
  if (props.note.title.trim()) return props.note.title.trim()
  const text = props.note.content.replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, 48) + (text.length > 48 ? '…' : '') : '—'
})

const preview = computed(() => {
  const text = props.note.content.replace(/\s+/g, ' ').trim()
  if (!text || !props.note.title.trim()) return ''
  return text.length > 110 ? text.slice(0, 110) + '…' : text
})

const dueText = computed(() =>
  formatDue(props.note.due, locale.value === 'ru' ? 'ru-RU' : 'en-US', props.now)
)
</script>

<template>
  <article
    class="card"
    :class="{ overdue, done, pinned: note.pinned }"
    @click="emit('edit', note)"
  >
    <span class="priority-bar" :style="{ background: PRIORITY_COLOR[note.priority] }"></span>

    <div class="card-main">
      <div class="card-heading">
        <span v-if="note.pinned" class="pin" :title="t('fields.pinned')">★</span>
        <h3>{{ heading }}</h3>
      </div>
      <p v-if="preview" class="preview">{{ preview }}</p>

      <div class="chips">
        <span
          class="chip tag"
          :style="{ color: TAG_COLOR[note.tag], background: TAG_COLOR[note.tag] + '14' }"
        >
          {{ t(`tag.${note.tag}`) }}
        </span>
        <span class="chip priority">
          <i :style="{ background: PRIORITY_COLOR[note.priority] }"></i>
          {{ t(`priority.${note.priority}`) }}
        </span>
        <span v-if="note.due" class="chip due" :class="{ danger: overdue }">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {{ dueText }}
        </span>
        <span v-if="done" class="chip done-chip">✓ {{ t('status.done') }}</span>
        <span v-if="note.status === 'archived'" class="chip archive-chip">{{ t('status.archived') }}</span>
        <span v-if="note.url" class="chip link">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
            <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
          </svg>
        </span>
      </div>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="mini"
        :class="{ active: note.status === 'done' }"
        :aria-label="done ? t('actions.cancel') : t('status.done')"
        @click.stop="emit('toggle-status', note)"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      </button>
      <button
        type="button"
        class="mini"
        :class="{ active: note.pinned }"
        :aria-label="t('fields.pinned')"
        @click.stop="emit('toggle-pin', note)"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" />
        </svg>
      </button>
    </div>
  </article>
</template>
