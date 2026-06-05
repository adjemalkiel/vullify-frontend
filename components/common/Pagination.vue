<template>
  <div v-if="total > 0" class="flex items-center justify-between gap-4 py-3">
    <span class="text-sm text-gray-400">
      Showing {{ startItem }}-{{ endItem }} of {{ total }}
    </span>
    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      >
        <span class="i-lucide-chevron-left block size-4" />
        Prev
      </button>
      <span class="px-2 text-sm text-gray-400 tabular-nums">Page {{ page }} of {{ totalPages }}</span>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
      >
        Next
        <span class="i-lucide-chevron-right block size-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ page: number; perPage: number; total: number }>()
defineEmits<{ 'update:page': [value: number] }>()

const totalPages = computed(() => Math.ceil(props.total / props.perPage) || 1)
const startItem = computed(() => (props.page - 1) * props.perPage + 1)
const endItem = computed(() => Math.min(props.page * props.perPage, props.total))
</script>
