<template>
    <div class="space-y-6">
      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />
      <LoadingSpinner v-else-if="status === 'pending'" message="Loading scan..." />

      <template v-if="scan">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white">
              {{ scan.repository }}<span class="text-gray-500">:</span>{{ scan.tag }}
            </h1>
            <p class="mt-1 text-sm text-gray-400 font-mono">Scan {{ scan.id.substring(0, 8) }}...</p>
          </div>
          <StatusBadge :status="scan.status" />
        </div>

        <!-- Overview Cards -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p class="text-xs text-gray-500 uppercase tracking-wider">Status</p>
            <p class="mt-1 text-lg font-bold"><StatusBadge :status="scan.status" /></p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p class="text-xs text-gray-500 uppercase tracking-wider">Triggered By</p>
            <p class="mt-1 text-sm text-gray-200">{{ scan.triggered_by }}</p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p class="text-xs text-gray-500 uppercase tracking-wider">Started</p>
            <p class="mt-1 text-sm text-gray-200">{{ scan.started_at ? formatDate(scan.started_at) : '—' }}</p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p class="text-xs text-gray-500 uppercase tracking-wider">Trivy Version</p>
            <p class="mt-1 text-sm font-mono text-gray-200">{{ scan.trivy_version || '—' }}</p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="scan.error_message" class="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p class="text-sm text-red-300">{{ scan.error_message }}</p>
        </div>

        <!-- Severity Counts -->
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Severity Breakdown</h2>
          <SeverityChart :items="severityItems" />
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-800 gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 inline-flex items-center gap-2"
            :class="activeTab === tab.key
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span
              v-if="tabCounts[tab.key] !== undefined"
              class="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="activeTab === tab.key
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'bg-gray-800 text-gray-500'"
            >
              {{ tabCounts[tab.key] }}
            </span>
          </button>
        </div>

        <!-- Tab Content -->
        <component :is="activeComponent" :scan-id="scan.id" :key="`${activeTab}-${refreshKey}`" />
      </template>
    </div>
</template>

<script setup lang="ts">
import type { ScanDetail } from '~/types/api'
import ScanFindings from './findings.vue'
import ScanPackages from './packages.vue'
import ScanMisconfigurations from './misconfigurations.vue'
import ScanSecrets from './secrets.vue'
import ScanSbom from './sbom.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { apiGet } = useApi()
const { pause, resume } = useIntervalFn(() => { refresh() }, 5000, { immediate: false })

const error = ref<string | null>(null)
const activeTab = ref('findings')
const tabCounts = ref<Record<string, number>>({})
const refreshKey = ref(0)

const tabs = [
  { key: 'findings', label: 'Findings' },
  { key: 'packages', label: 'Packages' },
  { key: 'misconfigurations', label: 'Misconfigs' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'sbom', label: 'SBOM' },
]

const componentMap: Record<string, unknown> = {
  findings: ScanFindings,
  packages: ScanPackages,
  misconfigurations: ScanMisconfigurations,
  secrets: ScanSecrets,
  sbom: ScanSbom,
}

const activeComponent = computed(() => componentMap[activeTab.value])

const { data: scan, refresh, status } = await useAsyncData<ScanDetail>('scan-detail', async () => {
  error.value = null
  const res = await apiGet<ScanDetail>(`/api/v1/scans/${route.params.id}`)
  // Manage polling
  const s = res.data
  if (s.status === 'pending' || s.status === 'running') {
    resume()
  } else {
    pause()
  }
  return s
})

onBeforeUnmount(() => {
  pause()
})

// Compute findings count from severity_counts — show 0 even when empty,
// because a completed scan with 0 findings is still meaningful info
watchEffect(() => {
  const sc = scan.value?.severity_counts
  if (scan.value && (scan.value.status === 'completed' || scan.value.status === 'failed')) {
    tabCounts.value.findings = sc
      ? (sc.critical || 0) + (sc.high || 0) + (sc.medium || 0) + (sc.low || 0) + (sc.unknown || 0)
      : 0
  }
})

// Fetch package/misconfig/secret counts once from meta
async function loadTabCounts() {
  const id = route.params.id as string
  try {
    const [pkgsRes, misconfigRes, secretsRes] = await Promise.all([
      apiGet<unknown[]>(`/api/v1/scans/${id}/packages`, { per_page: 1 }),
      apiGet<unknown[]>(`/api/v1/scans/${id}/misconfigurations`, { per_page: 1 }),
      apiGet<unknown[]>(`/api/v1/scans/${id}/secrets`, { per_page: 1 }),
    ])
    tabCounts.value.packages = pkgsRes.meta?.total ?? 0
    tabCounts.value.misconfigurations = misconfigRes.meta?.total ?? 0
    tabCounts.value.secrets = secretsRes.meta?.total ?? 0
  } catch {
    // counts will remain undefined and badges won't show
  }
}

// Load counts when scan resolves or changes, and trigger tab re-mount
// when transitioning from running to completed/failed so child tabs refetch.
let prevStatus: string | undefined
watch(scan, (s) => {
  if (s && (s.status === 'completed' || s.status === 'failed')) {
    loadTabCounts()
    if (prevStatus === 'running' || prevStatus === 'pending') {
      refreshKey.value++
    }
  }
  prevStatus = s?.status
}, { immediate: true })

const severityItems = computed(() => {
  if (!scan.value?.severity_counts) return []
  const sc = scan.value.severity_counts
  return [
    { label: 'Critical', value: sc.critical },
    { label: 'High', value: sc.high },
    { label: 'Medium', value: sc.medium },
    { label: 'Low', value: sc.low },
    { label: 'Unknown', value: sc.unknown },
  ]
})

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
