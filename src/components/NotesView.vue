<script setup>
import { computed, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import NoteCard from './NoteCard.vue'
import { STATUSES, TAGS, PRIORITY_COLOR, TAG_COLOR } from '../constants'
import { groupForToday, matchesQuery, sortNotes, withPinnedFirst } from '../utils/notes'

const props = defineProps({
  notes: { type: Array, required: true },
  mode: { type: String, default: 'today' },
  now: { type: Number, default: () => Date.now() }
})

const emit = defineEmits(['edit', 'toggle-pin', 'toggle-status'])
const { t } = useI18n()

const query = ref('')
const sortKey = ref('due')
const statusFilter = ref('all')
const tagFilter = ref('all')

const sortOptions = ['due', 'priority', 'created']

function tagLabel(tag) {
  return t(`tag.${tag}`)
}

const filtered = computed(() => {
  let list = props.notes
  if (props.mode === 'today') {
    list = list.filter((n) => n.status === 'active')
  } else {
    if (statusFilter.value !== 'all') list = list.filter((n) => n.status === statusFilter.value)
    if (tagFilter.value !== 'all') list = list.filter((n) => n.tag === tagFilter.value)
  }
  if (props.mode === 'search') {
    list = list.filter((n) => matchesQuery(n, query.value, tagLabel(n.tag)))
  }
  return list
})

const groups = computed(() => {
  if (props.mode === 'today') return groupForToday(filtered.value, props.now)
  const sorted = withPinnedFirst(sortNotes(filtered.value, sortKey.value))
  return sorted.length ? [{ key: 'all', titleKey: null, notes: sorted }] : []
})

const emptyText = computed(() => {
  if (props.mode === 'search') return query.value ? t('search.empty') : t('search.hint')
  if (props.mode === 'all') return t('empty.title')
  return t('empty.today')
})

const emptyHint = computed(() => {
  if (props.mode === 'search') return ''
  if (props.mode === 'all') return t('empty.hint')
  return t('empty.todayHint')
})
</script>

<template>
  <section class="notes-view">
    <label v-if="mode === 'search'" class="search-field">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
      <input v-model="query" type="search" :placeholder="t('search.placeholder')" />
      <button v-if="query" type="button" class="clear-btn" @click="query = ''">✕</button>
    </label>

    <div v-if="mode === 'all'" class="controls">
      <div class="control-block">
        <span class="control-label">{{ t('sort.label') }}</span>
        <div class="segmented">
          <button
            v-for="option in sortOptions"
            :key="option"
            type="button"
            :class="{ active: sortKey === option }"
            @click="sortKey = option"
          >
            {{ t(`sort.${option}`) }}
          </button>
        </div>
      </div>

      <div class="control-block">
        <span class="control-label">{{ t('status.label') }}</span>
        <div class="chip-row">
          <button type="button" class="filter-chip" :class="{ active: statusFilter === 'all' }" @click="statusFilter = 'all'">
            {{ t('status.all') }}
          </button>
          <button
            v-for="status in STATUSES"
            :key="status"
            type="button"
            class="filter-chip"
            :class="{ active: statusFilter === status }"
            @click="statusFilter = status"
          >
            {{ t(`status.${status}`) }}
          </button>
        </div>
      </div>

      <div class="control-block">
        <span class="control-label">{{ t('tag.label') }}</span>
        <div class="chip-row">
          <button type="button" class="filter-chip" :class="{ active: tagFilter === 'all' }" @click="tagFilter = 'all'">
            {{ t('tag.all') }}
          </button>
          <button
            v-for="tag in TAGS"
            :key="tag"
            type="button"
            class="filter-chip tag-filter"
            :class="{ active: tagFilter === tag }"
            :style="tagFilter === tag ? { background: TAG_COLOR[tag], borderColor: TAG_COLOR[tag], color: '#fff' } : {}"
            @click="tagFilter = tag"
          >
            {{ t(`tag.${tag}`) }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!groups.length" class="empty small">
      <p class="empty-title">{{ emptyText }}</p>
      <p v-if="emptyHint" class="empty-hint">{{ emptyHint }}</p>
    </div>

    <div v-for="group in groups" :key="group.key" class="group">
      <h2 v-if="group.titleKey" class="group-title" :class="{ overdue: group.key === 'overdue' }">
        {{ t(group.titleKey) }}
        <span class="group-count">{{ group.notes.length }}</span>
      </h2>
      <NoteCard
        v-for="note in group.notes"
        :key="note.id"
        :note="note"
        :now="now"
        @edit="emit('edit', $event)"
        @toggle-pin="emit('toggle-pin', $event)"
        @toggle-status="emit('toggle-status', $event)"
      />
    </div>

    <p v-if="mode === 'all' && groups.length" class="list-foot">
      {{ t('notes') }}: {{ filtered.length }}
    </p>
  </section>
</template>
