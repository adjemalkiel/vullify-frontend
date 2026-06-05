<template>
<div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="loadDashboard()" />

      <LoadingSpinner v-if="loading" message="Loading dashboard..." />

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NuxtLink
          to="/scans/new"
          class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-cyan-600/50 hover:bg-gray-800/50"
        >
          <span class="i-lucide-plus-circle block size-6 text-cyan-400" />
          <span class="text-sm font-medium text-gray-200">Start a New Scan</span>
        </NuxtLink>
        <NuxtLink
          to="/registries/new"
          class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-cyan-600/50 hover:bg-gray-800/50"
        >
          <span class="i-lucide-server block size-6 text-cyan-400" />
          <span class="text-sm font-medium text-gray-200">Add a Registry</span>
        </NuxtLink>
        <NuxtLink
          to="/reports"
          class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-cyan-600/50 hover:bg-gray-800/50"
        >
          <span class="i-lucide-chart-bar block size-6 text-cyan-400" />
          <span class="text-sm font-medium text-gray-200">View Reports</span>
        </NuxtLink>
      </div>

      <!-- Stats Grid -->
      <div v-if="summary" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Images" :value="summary.total_images" icon="i-lucide-box" color="cyan" />
        <StatsCard label="Total Scans" :value="summary.total_scans" icon="i-lucide-search" color="blue" />
        <StatsCard label="Total Findings" :value="summary.total_findings" icon="i-lucide-shield-alert" color="orange" />
        <StatsCard label="Registries" :value="registryCount" icon="i-lucide-server" color="green" />
      </div>

      <!-- Severity Breakdown -->
      <div v-if="summary" class="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Vulnerability Severity Breakdown</h2>
        <SeverityChart :items="severityItems" />
      </div>

      <!-- Recent Scans -->
      <div v-if="recentScans.length" class="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Recent Scans</h2>
          <NuxtLink to="/scans" class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            View all
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th class="pb-3 pr-4">Image</th>
                <th class="pb-3 pr-4">Status</th>
                <th class="pb-3 pr-4">Started</th>
                <th class="pb-3">Findings</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="scan in recentScans"
                :key="scan.id"
                class="border-b border-gray-800/50 text-sm cursor-pointer hover:bg-gray-800/30 transition-colors"
                @click="navigateTo(`/scans/${scan.id}`)"
              >
                <td class="py-3 pr-4">
                  <span class="text-cyan-400 font-medium">{{ scan.repository }}</span><span class="text-gray-500">:</span><span class="text-gray-300">{{ scan.tag }}</span>
                </td>
                <td class="py-3 pr-4">
                  <StatusBadge :status="scan.status" />
                </td>
                <td class="py-3 pr-4 text-gray-500 text-xs">
                  {{ formatDate(scan.started_at) }}
                </td>
                <td class="py-3">
                  <div class="flex items-center gap-2 text-xs">
                    <span v-if="scan.severity_counts?.critical" class="text-red-400 font-mono">{{ scan.severity_counts.critical }}<span class="text-gray-600">C</span></span>
                    <span v-if="scan.severity_counts?.high" class="text-orange-400 font-mono">{{ scan.severity_counts.high }}<span class="text-gray-600">H</span></span>
                    <span v-if="scan.severity_counts?.medium" class="text-yellow-400 font-mono">{{ scan.severity_counts.medium }}<span class="text-gray-600">M</span></span>
                    <span v-if="scan.severity_counts?.low" class="text-gray-400 font-mono">{{ scan.severity_counts.low }}<span class="text-gray-600">L</span></span>
                    <span v-if="noFindings(scan)" class="text-gray-600">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
</template>

<script setup lang="ts">
import type { DashboardSummary, RegistryRow, ScanRow } from '~/types/api'


const { apiGet } = useApi()

const RECENT_SCANS_LIMIT = 5

const loading = ref(true)
const error = ref<string | null>(null)
const summary = ref<DashboardSummary | null>(null)
const registryCount = ref(0)
const recentScans = ref<ScanRow[]>([])

async function loadDashboard() {
  error.value = null
  loading.value = true
  try {
    const res = await apiGet<DashboardSummary>('/api/v1/dashboard/summary')
    summary.value = res.data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

const severityItems = computed(() => {
  if (!summary.value) return []
  return [
    { label: 'Critical', value: summary.value.by_severity.critical },
    { label: 'High', value: summary.value.by_severity.high },
    { label: 'Medium', value: summary.value.by_severity.medium },
    { label: 'Low', value: summary.value.by_severity.low },
    { label: 'Unknown', value: summary.value.by_severity.unknown },
  ]
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function noFindings(scan: ScanRow): boolean {
  const sc = scan.severity_counts
  return !sc?.critical && !sc?.high && !sc?.medium && !sc?.low && !sc?.unknown
}

onMounted(async () => {
  await loadDashboard()
  try {
    const res = await apiGet<RegistryRow[]>('/api/v1/registries/', { per_page: 1 })
    registryCount.value = res.meta?.total ?? 0
  } catch {
    // ignore
  }
  try {
    const res = await apiGet<ScanRow[]>('/api/v1/scans/', { per_page: RECENT_SCANS_LIMIT })
    recentScans.value = res.data
  } catch {
    // ignore
  }
})
</script>
