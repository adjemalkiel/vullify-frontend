<template>
  <div class="space-y-3">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-center gap-3"
    >
      <span class="w-20 text-right text-xs font-medium uppercase text-gray-400 shrink-0">{{ item.label }}</span>
      <div class="flex-1">
        <div class="h-5 w-full rounded-full bg-gray-800 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="item.colorClass"
            :style="{ width: item.percent + '%' }"
          />
        </div>
      </div>
      <span class="w-14 text-right text-sm tabular-nums font-medium" :class="item.textClass">{{ item.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SeverityItem {
  label: string
  value: number
}

const props = defineProps<{ items: SeverityItem[] }>()

const max = computed(() => {
  const m = Math.max(...props.items.map(i => i.value), 1)
  return m
})

const items = computed(() =>
  props.items.map(i => {
    const key = i.label.toLowerCase()
    let colorClass = 'bg-gray-500'
    let textClass = 'text-gray-400'
    switch (key) {
      case 'critical':
        colorClass = 'bg-red-500'
        textClass = 'text-red-400'
        break
      case 'high':
        colorClass = 'bg-orange-500'
        textClass = 'text-orange-400'
        break
      case 'medium':
        colorClass = 'bg-yellow-500'
        textClass = 'text-yellow-400'
        break
      case 'low':
        colorClass = 'bg-blue-500'
        textClass = 'text-blue-400'
        break
    }
    return {
      ...i,
      colorClass,
      textClass,
      percent: max.value > 0 ? (i.value / max.value) * 100 : 0,
    }
  })
)
</script>
