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

        <!-- Progress bar (only visible when running) -->
        <div
          v-if="scanProgress && (scan.status === 'pending' || scan.status === 'running')"
          class="rounded-xl border border-gray-800 bg-gray-900 p-6"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-300">Scan progress</h3>
            <span class="text-xs text-gray-500 font-mono">{{ elapsed }}</span>
          </div>
          <!-- Phase steps -->
          <div class="flex items-center gap-1">
            <template v-for="(p, idx) in phases" :key="p.key">
              <div class="flex-1 flex flex-col items-center gap-1">
                <div
                  class="size-3 rounded-full transition-colors duration-500"
                  :class="phaseClass(p.key)"
                />
                <span
                  class="text-[10px] text-center leading-tight transition-colors duration-500"
                  :class="phaseTextClass(p.key)"
                >{{ p.label }}</span>
              </div>
              <div
                v-if="idx < phases.length - 1"
                class="h-px flex-1 transition-colors duration-500"
                :class="connectorClass(idx)"
              />
            </template>
          </div>
          <!-- Current phase description -->
          <p class="mt-3 text-xs text-gray-500 text-center">
            {{ phaseDescription(scanProgress.phase) }}
          </p>
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
const scanProgress = ref<{ phase: string; status: string; started_at: string } | null>(null)

const phases = [
  { key: 'pending', label: 'Queued' },
  { key: 'initializing', label: 'Init' },
  { key: 'scanning', label: 'Scanning' },
  { key: 'persisting', label: 'Saving' },
  { key: 'completed', label: 'Done' },
]

// Poll progress separately (more frequent) for running scans
const progressPhaseKey = computed(() => route.params.id as string)
const { pause: pauseProgress, resume: resumeProgress } = useIntervalFn(async () => {
  try {
    const res = await apiGet<{ phase: string; status: string; started_at: string }>(
      `/api/v1/scans/${progressPhaseKey.value}/progress`,
    )
    scanProgress.value = res.data
  } catch { /* ignore */ }
}, 3000, { immediate: true })

// Phase order for progress calculation
const phaseOrder: Record<string, number> = {
  pending: 0, initializing: 1, scanning: 2, persisting: 3, completed: 4, failed: 4,
}

function phaseClass(key: string): string {
  const cur = phaseOrder[scanProgress.value?.phase ?? 'pending'] ?? 0
  const idx = phaseOrder[key] ?? 0
  if (scanProgress.value?.phase === 'failed' && idx <= cur) return 'bg-red-500'
  if (idx < cur) return 'bg-cyan-500'
  if (idx === cur) return 'bg-cyan-400 ring-2 ring-cyan-400/50 animate-pulse'
  return 'bg-gray-700'
}

function phaseTextClass(key: string): string {
  const cur = phaseOrder[scanProgress.value?.phase ?? 'pending'] ?? 0
  const idx = phaseOrder[key] ?? 0
  if (scanProgress.value?.phase === 'failed' && idx <= cur) return 'text-red-400'
  if (idx <= cur) return 'text-cyan-300'
  return 'text-gray-600'
}

function connectorClass(idx: number): string {
  const cur = phaseOrder[scanProgress.value?.phase ?? 'pending'] ?? 0
  if (scanProgress.value?.phase === 'failed') return 'bg-red-500/50'
  if (idx < cur) return 'bg-cyan-500'
  return 'bg-gray-700'
}

function phaseDescription(phase: string): string {
  switch (phase) {
    case 'pending': return 'Scan is queued, waiting for a worker...'
    case 'initializing': return 'Worker picked up the scan, preparing...'
    case 'scanning': return 'Trivy is pulling and scanning the image. This may take several minutes.'
    case 'persisting': return 'Saving scan results to the database...'
    case 'completed': return 'Scan completed successfully.'
    case 'failed': return 'Scan failed. Check the error message below.'
    default: return ''
  }
}

const elapsed = computed(() => {
  if (!scanProgress.value?.started_at) return ''
  const started = new Date(scanProgress.value.started_at).getTime()
  const diff = Math.floor((Date.now() - started) / 1000)
  if (diff < 60) return `${diff}s`
  const mins = Math.floor(diff / 60)
  const secs = diff % 60
  return `${mins}m ${secs}s`
})

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
