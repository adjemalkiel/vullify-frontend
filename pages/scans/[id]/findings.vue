<template>
  <div class="space-y-4">
    <!-- Filters -->
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
        <option value="UNKNOWN">Unknown</option>
      </select>

      <input
        v-model="packageFilter"
        type="text"
        placeholder="Filter by package..."
        class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
      />

      <select
        v-model="sortBy"
        class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
      >
        <option value="severity">Sort by Severity</option>
        <option value="package_name">Sort by Package</option>
        <option value="created_at">Sort by Date</option>
      </select>
    </div>

    <ErrorAlert v-if="error" :message="error" :retry="true" @retry="load()" />

    <DataTable
      :columns="columns"
      :rows="findings as unknown as Record<string, unknown>[]"
      :loading="loading"
      empty-message="No vulnerability findings — great job!"
      :sort="sort"
      clickable
      @sort="handleSort"
      @row-click="(row) => navigateTo(`/findings/${row.id}`)"
    >
      <template #cell-severity="{ row }">
        <SeverityBadge :severity="row.severity as string" :dot="true" />
      </template>
      <template #cell-vulnerability_id="{ row }">
        <span class="text-cyan-400 font-mono text-xs">{{ row.vulnerability_id }}</span>
      </template>
      <template #cell-package_name="{ row }">
        <span class="text-gray-200">{{ row.package_name }}</span>
      </template>
      <template #cell-installed_version="{ row }">
        <span class="text-gray-400">{{ row.installed_version }}</span>
        <span v-if="row.fixed_version" class="text-gray-600"> → </span>
        <span v-if="row.fixed_version" class="text-green-400">{{ row.fixed_version }}</span>
      </template>
      <template #cell-title="{ row }">
        <span class="text-gray-300 text-xs line-clamp-1">{{ row.title }}</span>
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
import type { FindingListRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'

const props = defineProps<{ scanId: string }>()

const { apiGet } = useApi()
const error = ref<string | null>(null)
const loading = ref(false)
const meta = ref<PaginationMeta | undefined>()
const page = ref(1)
const severityFilter = ref('')
const packageFilter = ref('')
const sortBy = ref<string>('severity')
const sort = ref<{ column: string; direction: 'asc' | 'desc' }>({ column: 'severity', direction: 'desc' })

const findings = ref<FindingListRow[]>([])

const columns = [
  { key: 'severity', label: 'Severity', sortable: true },
  { key: 'vulnerability_id', label: 'CVE ID', sortable: true },
  { key: 'package_name', label: 'Package', sortable: true },
  { key: 'installed_version', label: 'Installed → Fix' },
  { key: 'title', label: 'Title' },
]

async function load() {
  error.value = null
  loading.value = true
  try {
    const res = await apiGet<FindingListRow[]>(`/api/v1/scans/${props.scanId}/findings`, {
      page: page.value,
      per_page: 20,
      severity: severityFilter.value || undefined,
      package_name: packageFilter.value || undefined,
      sort: sortBy.value,
    })
    findings.value = res.data
    meta.value = res.meta
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load findings'
  } finally {
    loading.value = false
  }
}

function handleSort(col: string) {
  sort.value = { column: col, direction: 'asc' }
}

watch(page, load)
watch(severityFilter, () => { page.value = 1; load() })
watch(packageFilter, () => { page.value = 1; load() })
watch(sortBy, () => { load() })

onMounted(load)
</script>
