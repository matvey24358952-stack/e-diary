<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { computeStats } from '../utils/notes'
import { TAG_COLOR, PRIORITY_COLOR } from '../constants'

const props = defineProps({
  notes: { type: Array, required: true },
  now: { type: Number, default: () => Date.now() }
})

const { t } = useI18n()
const stats = computed(() => computeStats(props.notes, props.now))

const cards = computed(() => [
  { key: 'active', value: stats.value.active, color: '#6366f1' },
  { key: 'done', value: stats.value.done, color: '#059669' },
  { key: 'overdue', value: stats.value.overdue, color: '#e11d48' },
  { key: 'archived', value: stats.value.archived, color: '#64748b' }
])

const completion = computed(() => {
  const finished = stats.value.done + stats.value.archived
  return stats.value.total ? Math.round((finished / stats.value.total) * 100) : 0
})

const tagRows = computed(() =>
  ['study', 'work', 'personal', 'ideas']
    .map((tag) => ({ tag, count: stats.value.byTag[tag] || 0 }))
    .filter((row) => row.count > 0)
)

const maxTag = computed(() => Math.max(1, ...tagRows.value.map((r) => r.count)))
</script>

<template>
  <section class="stats-view">
    <div class="stats-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card">
        <span class="stat-value" :style="{ color: card.color }">{{ card.value }}</span>
        <span class="stat-label">{{ t(`stats.${card.key}`) }}</span>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>{{ t('stats.completion') }}</h2>
        <span class="panel-value">{{ completion }}%</span>
      </div>
      <div class="progress"><i :style="{ width: completion + '%' }"></i></div>
      <p class="panel-note">{{ t('stats.total') }}: {{ stats.total }}</p>
    </div>

    <div class="panel">
      <h2>{{ t('stats.byTag') }}</h2>
      <div v-for="row in tagRows" :key="row.tag" class="bar-row">
        <span class="bar-label">{{ t(`tag.${row.tag}`) }}</span>
        <div class="bar"><i :style="{ width: (row.count / maxTag) * 100 + '%', background: TAG_COLOR[row.tag] }"></i></div>
        <span class="bar-value">{{ row.count }}</span>
      </div>
    </div>

    <div class="panel">
      <h2>{{ t('stats.byPriority') }}</h2>
      <div v-for="(count, key) in stats.byPriority" :key="key" class="bar-row">
        <span class="bar-label">{{ t(`priority.${key}`) }}</span>
        <div class="bar"><i :style="{ width: (count / Math.max(1, stats.total)) * 100 + '%', background: PRIORITY_COLOR[key] }"></i></div>
        <span class="bar-value">{{ count }}</span>
      </div>
    </div>
  </section>
</template>
