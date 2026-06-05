<template>
  <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-400">{{ label }}</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-white">{{ displayValue }}</p>
      </div>
      <div class="flex size-10 items-center justify-center rounded-lg" :class="iconBgClass">
        <span class="block size-5" :class="icon" />
      </div>
    </div>
    <div v-if="$slots.footer" class="mt-3 border-t border-gray-800 pt-3">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string; value: number | string; icon?: string; color?: string }>()

const displayValue = computed(() => {
  if (typeof props.value === 'number' && props.value >= 1000) {
    return props.value.toLocaleString()
  }
  return props.value
})

const iconBgClass = computed(() => {
  switch (props.color) {
    case 'red': return 'bg-red-500/15 text-red-400'
    case 'orange': return 'bg-orange-500/15 text-orange-400'
    case 'yellow': return 'bg-yellow-500/15 text-yellow-400'
    case 'blue': return 'bg-blue-500/15 text-blue-400'
    case 'green': return 'bg-green-500/15 text-green-400'
    case 'cyan': return 'bg-cyan-500/15 text-cyan-400'
    default: return 'bg-cyan-500/15 text-cyan-400'
  }
})
</script>
