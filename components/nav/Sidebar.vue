<template>
  <aside
    class="flex flex-col border-r border-gray-800 bg-gray-950 transition-all duration-200"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <div class="flex h-14 items-center justify-center border-b border-gray-800 px-3">
      <div v-if="!collapsed" class="flex items-center gap-2">
        <div class="flex size-8 items-center justify-center rounded-lg bg-cyan-600 text-sm font-bold text-white">V</div>
        <span class="text-lg font-semibold tracking-tight text-white">Vullify</span>
      </div>
      <div v-else class="flex size-8 items-center justify-center rounded-lg bg-cyan-600 text-sm font-bold text-white">V</div>
    </div>

    <nav class="flex-1 overflow-y-auto py-3">
      <ul class="flex flex-col gap-0.5 px-2">
        <li v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-cyan-600/15 text-cyan-400'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
          >
            <span class="block size-5 shrink-0" :class="item.icon" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>

      <div v-if="!collapsed" class="mx-3 my-3 border-t border-gray-800" />
      <div v-else class="mx-2 my-2 border-t border-gray-800" />

      <ul class="flex flex-col gap-0.5 px-2">
        <li>
          <NuxtLink
            to="/scans/new"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="isActive('/scans') || isActive('/scans/new')
              ? 'bg-cyan-600/15 text-cyan-400'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
          >
            <span class="block size-5 shrink-0 i-lucide-plus-circle" />
            <span v-if="!collapsed">New Scan</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'i-lucide-home' },
  { to: '/scans', label: 'Scans', icon: 'i-lucide-search' },
  { to: '/registries', label: 'Registries', icon: 'i-lucide-server' },
  { to: '/images', label: 'Images', icon: 'i-lucide-box' },
  { to: '/targets', label: 'Targets', icon: 'i-lucide-crosshair' },
  { to: '/cves', label: 'Global CVEs', icon: 'i-lucide-shield' },
  { to: '/suppressions', label: 'Suppressions', icon: 'i-lucide-ban' },
  { to: '/reports', label: 'Reports', icon: 'i-lucide-chart-bar' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
