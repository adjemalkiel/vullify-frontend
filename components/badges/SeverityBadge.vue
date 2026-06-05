<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="severityClass"
  >
    <span v-if="dot" class="block size-1.5 rounded-full" :class="dotClass" />
    <slot>{{ severity.toUpperCase() }}</slot>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ severity: string; dot?: boolean }>(), { dot: false })

const s = computed(() => props.severity?.toLowerCase() ?? 'unknown')

const severityClass = computed(() => {
  switch (s.value) {
    case 'critical': return 'bg-red-500/15 text-red-400 border border-red-500/30'
    case 'high': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
    case 'medium': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
    case 'low': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
    default: return 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
  }
})

const dotClass = computed(() => {
  switch (s.value) {
    case 'critical': return 'bg-red-400'
    case 'high': return 'bg-orange-400'
    case 'medium': return 'bg-yellow-400'
    case 'low': return 'bg-blue-400'
    default: return 'bg-gray-400'
  }
})
</script>
