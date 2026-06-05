<template>
  <div class="flex items-center justify-center py-8">
    <span class="i-lucide-loader-circle block size-6 animate-spin text-cyan-400" />
    <span v-if="message" class="ml-2 text-sm text-gray-400">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>
