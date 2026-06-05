<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="statusClass"
  >
    <span v-if="status === 'pending'" class="i-lucide-circle-dot block size-3 animate-pulse" />
    <span v-else-if="status === 'running'" class="i-lucide-loader-circle block size-3 animate-spin" />
    <span v-else-if="status === 'completed'" class="i-lucide-check-circle block size-3" />
    <span v-else-if="status === 'failed'" class="i-lucide-x-circle block size-3" />
    <span v-else class="i-lucide-circle block size-3" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const label = computed(() => (props.status?.charAt(0).toUpperCase() ?? '') + (props.status?.slice(1) ?? ''))

const statusClass = computed(() => {
  switch (props.status) {
    case 'pending': return 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
    case 'running': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
    case 'completed': return 'bg-green-500/15 text-green-400 border border-green-500/30'
    case 'failed': return 'bg-red-500/15 text-red-400 border border-red-500/30'
    default: return 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
  }
})
</script>
