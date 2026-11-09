<script setup>
import { useI18n } from 'vue-i18n'

defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const tabs = [
  {
    id: 'today',
    labelKey: 'tabs.today',
    path: 'M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5v-11ZM8 4v16M8 9h8M8 13h5'
  },
  {
    id: 'all',
    labelKey: 'tabs.all',
    path: 'M4 6h16M4 12h16M4 18h10'
  },
  {
    id: 'search',
    labelKey: 'tabs.search',
    path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5'
  },
  {
    id: 'stats',
    labelKey: 'tabs.stats',
    path: 'M5 20V10M12 20V4M19 20v-7'
  }
]
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="nav-item"
      :class="{ active: modelValue === tab.id }"
      @click="emit('update:modelValue', tab.id)"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path :d="tab.path" />
      </svg>
      <span>{{ t(tab.labelKey) }}</span>
    </button>
  </nav>
</template>
