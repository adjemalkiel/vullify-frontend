<template>
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <span class="block text-5xl text-gray-600 mb-4">{{ icon }}</span>
      <h3 class="text-lg font-medium text-gray-300 mb-1">{{ title }}</h3>
      <p v-if="description" class="text-sm text-gray-500 max-w-sm">{{ description }}</p>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string; icon?: string }>()
</script>
