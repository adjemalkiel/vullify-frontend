<template>
  <div class="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
    <span class="i-lucide-alert-triangle block size-5 shrink-0 text-red-400 mt-0.5" />
    <div>
      <p class="text-sm font-medium text-red-300">{{ title || 'An error occurred' }}</p>
      <p v-if="message" class="mt-1 text-sm text-red-400/80">{{ message }}</p>
      <button
        v-if="retry"
        class="mt-2 text-sm text-red-300 hover:text-red-200 underline underline-offset-2"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; message?: string; retry?: boolean }>()
defineEmits<{ retry: [] }>()
</script>
