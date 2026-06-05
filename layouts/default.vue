<template>
  <div class="flex h-screen overflow-hidden bg-gray-950">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-3 border-b border-gray-800 bg-gray-950 px-4">
        <button
          class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <span class="i-lucide-panel-left block size-5" />
        </button>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <span v-if="i > 0" class="text-gray-600">/</span>
            <NuxtLink v-if="crumb.to" :to="crumb.to" class="hover:text-cyan-400 transition-colors">
              {{ crumb.label }}
            </NuxtLink>
            <span v-else class="text-gray-200">{{ crumb.label }}</span>
          </template>
        </div>
      </header>
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const sidebarCollapsed = ref(false)

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  if (parts.length === 0) return [{ label: 'Dashboard' }]

  const crumbs: { label: string; to?: string }[] = []
  let path = ''
  for (let i = 0; i < parts.length; i++) {
    path += '/' + parts[i]
    let label = parts[i]
    // Capitalize & format
    label = label.charAt(0).toUpperCase() + label.slice(1)
    // Replace uuid segments with readable text
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[i])
    if (isUuid) {
      label = 'Detail'
    }
    crumbs.push({
      label,
      to: i < parts.length - 1 ? path : undefined,
    })
  }
  return crumbs
})
</script>
