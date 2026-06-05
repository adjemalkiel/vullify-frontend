<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="$emit('cancel')" />
      <div class="relative w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-gray-100">{{ title }}</h3>
        <p class="mt-2 text-sm text-gray-400">{{ message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            :class="danger ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'"
            @click="$emit('confirm')"
          >
            {{ confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}>()
defineEmits<{ confirm: []; cancel: [] }>()
</script>
