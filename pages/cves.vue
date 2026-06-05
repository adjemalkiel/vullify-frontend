<template>
<div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Global CVEs</h1>

      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="severityFilter"
          class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          v-model="sortBy"
          class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="occurrences">Sort by Occurrences</option>
          <option value="risk_score">Sort by Risk Score</option>
          <option value="severity">Sort by Severity</option>
        </select>
      </div>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="fetchCVEs()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="cves as unknown as Record<string, unknown>[]"
        :loading="pending"
        empty-message="No CVEs found"
        :sort="sort"
        @sort="handleSort"
      >
        <template #cell-vulnerability_id="{ row }">
          <div>
            <span class="font-mono text-xs text-cyan-400">{{ row.vulnerability_id }}</span>
            <div v-if="row.title" class="text-xs text-gray-500 mt-0.5 max-w-64 truncate">{{ row.title }}</div>
          </div>
        </template>
        <template #cell-severity="{ row }">
          <SeverityBadge :severity="row.severity as string" :dot="true" />
        </template>
        <template #cell-occurrences="{ row }">
          <span class="font-semibold tabular-nums text-gray-200">{{ row.occurrences }}</span>
        </template>
        <template #cell-risk_score="{ row }">
          <span class="tabular-nums text-sm" :class="getRiskColor(row.risk_score as number)">{{ row.risk_score ? (row.risk_score as number).toFixed(1) : '—' }}</span>
        </template>
        <template #cell-last_seen="{ row }">
          <span class="text-gray-400 text-sm">{{ formatDate(row.last_seen as string) }}</span>
        </template>
      </DataTable>

      <Pagination
        v-if="meta"
        :page="page"
        :per-page="meta.per_page"
        :total="meta.total"
        @update:page="page = $event"
      />
    </div>
</template>

<script setup lang="ts">
import type { GlobalCVERow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'


const { apiGet } = useApi()

const page = ref(1)
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()
const severityFilter = ref('')
const sortBy = ref<string>('occurrences')
const sort = ref<{ column: string; direction: 'asc' | 'desc' }>({ column: 'occurrences', direction: 'desc' })
const pending = ref(false)

const columns = [
  { key: 'vulnerability_id', label: 'CVE ID', sortable: true },
  { key: 'severity', label: 'Severity', sortable: true },
  { key: 'occurrences', label: 'Occurrences', sortable: true },
  { key: 'risk_score', label: 'Risk Score', sortable: true },
  { key: 'last_seen', label: 'Last Seen' },
]

const cves = ref<GlobalCVERow[]>([])

async function fetchCVEs() {
  pending.value = true
  error.value = null
  try {
    const res = await apiGet<GlobalCVERow[]>('/api/v1/dashboard/cves', {
      page: page.value,
      per_page: 20,
      severity: severityFilter.value || undefined,
      sort_by: sortBy.value,
    })
    meta.value = res.meta
    cves.value = res.data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load CVEs'
  } finally {
    pending.value = false
  }
}

function handleSort(col: string) {
  sort.value = { column: col, direction: 'asc' }
}

function getRiskColor(score: number | null): string {
  if (!score) return 'text-gray-500'
  if (score >= 7) return 'text-red-400'
  if (score >= 4) return 'text-orange-400'
  return 'text-green-400'
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

watch([severityFilter, sortBy], () => { page.value = 1; fetchCVEs() })
watch(page, () => { fetchCVEs() })
fetchCVEs()
</script>
