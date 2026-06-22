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
const router = useRouter()

const sidebarCollapsed = ref(false)

const validRoutePaths = computed(() => {
  const paths = new Set<string>()
  for (const r of router.getRoutes()) {
    // Collect only non-dynamic root paths (e.g. /findings, not /findings/:id)
    const p = r.path
    if (p && !p.includes(':') && !p.includes('*')) {
      paths.add(p)
    }
  }
  return paths
})

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
    // Only make clickable if a real non-dynamic route exists and it's not the last segment
    const canLink = i < parts.length - 1 && validRoutePaths.value.has(path)
    crumbs.push({
      label,
      to: canLink ? path : undefined,
    })
  }
  return crumbs
})
</script>
