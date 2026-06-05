<template>
<div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Scans</h1>
        <NuxtLink
          to="/scans/new"
          class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        >
          <span class="i-lucide-plus block size-4" />
          New Scan
        </NuxtLink>
      </div>

      <!-- Status filter tabs -->
      <div class="flex gap-2">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="statusFilter === f.value
            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200'"
          @click="statusFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="scans as unknown as Record<string, unknown>[]"
        :loading="status === 'pending'"
        empty-message="No scans found. Start a new scan to see results here."
        clickable
        @row-click="handleRowClick"
      >
        <template #cell-repository="{ row }">
          <NuxtLink
            :to="`/scans/${row.id}`"
            class="font-medium text-cyan-400 hover:text-cyan-300"
            @click.stop
          >
            {{ row.repository }}<span class="text-gray-500">:</span>{{ row.tag }}
          </NuxtLink>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status as string" />
        </template>
        <template #cell-started_at="{ row }">
          <span class="text-gray-400 text-xs">{{ formatDate(row.started_at as string) }}</span>
        </template>
        <template #cell-severity_counts="{ row }">
          <div class="flex items-center gap-2 text-xs">
            <span v-if="(row.severity_counts as SeverityCounts).critical" class="text-red-400 font-mono">
              {{ (row.severity_counts as SeverityCounts).critical }}<span class="text-gray-600">C</span>
            </span>
            <span v-if="(row.severity_counts as SeverityCounts).high" class="text-orange-400 font-mono">
              {{ (row.severity_counts as SeverityCounts).high }}<span class="text-gray-600">H</span>
            </span>
            <span v-if="(row.severity_counts as SeverityCounts).medium" class="text-yellow-400 font-mono">
              {{ (row.severity_counts as SeverityCounts).medium }}<span class="text-gray-600">M</span>
            </span>
            <span v-if="(row.severity_counts as SeverityCounts).low" class="text-gray-400 font-mono">
              {{ (row.severity_counts as SeverityCounts).low }}<span class="text-gray-600">L</span>
            </span>
            <span v-if="emptyCounts(row)" class="text-gray-600">—</span>
          </div>
        </template>
      </DataTable>

      <Pagination
        v-if="meta && meta.total > meta.per_page"
        :page="page"
        :per-page="meta.per_page"
        :total="meta.total"
        @update:page="page = $event"
      />
    </div>
</template>

<script setup lang="ts">
import type { ScanRow, SeverityCounts } from '~/types/api'
import type { PaginationMeta } from '~/types/api'

definePageMeta({ layout: 'default' })

const { apiGet } = useApi()
const router = useRouter()

const page = ref(1)
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()
const statusFilter = ref('')

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
]

const columns = [
  { key: 'repository', label: 'Image' },
  { key: 'status', label: 'Status' },
  { key: 'started_at', label: 'Started' },
  { key: 'severity_counts', label: 'Findings' },
]

const { data: scans, refresh, status } = await useAsyncData<ScanRow[]>('scans-list', async () => {
  error.value = null
  const params: Record<string, string | number> = { page: page.value, per_page: 20 }
  if (statusFilter.value) params.status = statusFilter.value
  const res = await apiGet<ScanRow[]>('/api/v1/scans/', params)
  meta.value = res.meta
  return res.data
})

watch(page, () => { refresh() })
watch(statusFilter, () => { page.value = 1; refresh() })

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function emptyCounts(row: Record<string, unknown>): boolean {
  const sc = row.severity_counts as SeverityCounts
  return !sc?.critical && !sc?.high && !sc?.medium && !sc?.low && !sc?.unknown
}

function handleRowClick(row: Record<string, unknown>) {
  router.push(`/scans/${row.id}`)
}
</script>
