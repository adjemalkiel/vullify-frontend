<template>
<div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Vulnerability Reports</h1>

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

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-400">From</label>
          <input
            v-model="dateFrom"
            type="date"
            class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-400">To</label>
          <input
            v-model="dateTo"
            type="date"
            class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="fetchReport()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="reportData as unknown as Record<string, unknown>[]"
        :loading="pending"
        empty-message="No vulnerability data for the selected period and filters."
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
import type { VulnerabilityReportRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'


const { apiGet } = useApi()

const page = ref(1)
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()
const severityFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const pending = ref(false)

const columns = [
  { key: 'vulnerability_id', label: 'CVE ID' },
  { key: 'severity', label: 'Severity' },
  { key: 'occurrences', label: 'Occurrences' },
  { key: 'last_seen', label: 'Last Seen' },
]

const reportData = ref<VulnerabilityReportRow[]>([])

async function fetchReport() {
  pending.value = true
  error.value = null
  try {
    const res = await apiGet<VulnerabilityReportRow[]>('/api/v1/reports/vulnerability', {
      page: page.value,
      per_page: 20,
      severity: severityFilter.value || undefined,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
    })
    meta.value = res.meta
    reportData.value = res.data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load report'
  } finally {
    pending.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

watch([severityFilter, dateFrom, dateTo], () => { page.value = 1; fetchReport() })
watch(page, () => { fetchReport() })
fetchReport()
</script>
