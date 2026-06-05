<template>
  <div class="space-y-4">
    <div>
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
    </div>

    <ErrorAlert v-if="error" :message="error" :retry="true" @retry="load()" />

    <DataTable
      :columns="columns"
      :rows="secrets as unknown as Record<string, unknown>[]"
      :loading="loading"
      empty-message="No secrets detected"
    >
      <template #cell-severity="{ row }">
        <SeverityBadge :severity="row.severity as string" :dot="true" />
      </template>
      <template #cell-category="{ row }">
        <span class="uppercase text-xs text-gray-500">{{ row.category }}</span>
      </template>
      <template #cell-rule_id="{ row }">
        <span class="font-mono text-xs text-gray-400">{{ row.rule_id }}</span>
      </template>
      <template #cell-title="{ row }">
        <span class="text-gray-200">{{ row.title }}</span>
      </template>
      <template #cell-file_path="{ row }">
        <span class="font-mono text-xs text-gray-500 truncate block max-w-48">{{ row.file_path }}</span>
      </template>
      <template #cell-lines="{ row }">
        <span class="text-gray-400 text-xs">{{ row.start_line }}-{{ row.end_line }}</span>
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
import type { SecretRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'

const props = defineProps<{ scanId: string }>()

const { apiGet } = useApi()
const error = ref<string | null>(null)
const loading = ref(false)
const meta = ref<PaginationMeta | undefined>()
const page = ref(1)
const severityFilter = ref('')

const secrets = ref<SecretRow[]>([])

const columns = [
  { key: 'severity', label: 'Severity' },
  { key: 'category', label: 'Category' },
  { key: 'rule_id', label: 'Rule ID' },
  { key: 'title', label: 'Title' },
  { key: 'file_path', label: 'File' },
  { key: 'lines', label: 'Lines' },
]

async function load() {
  error.value = null
  loading.value = true
  try {
    const res = await apiGet<SecretRow[]>(`/api/v1/scans/${props.scanId}/secrets`, {
      page: page.value,
      per_page: 20,
      severity: severityFilter.value || undefined,
    })
    secrets.value = res.data
    meta.value = res.meta
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load secrets'
  } finally {
    loading.value = false
  }
}

watch(page, load)
watch(severityFilter, () => { page.value = 1; load() })

onMounted(load)
</script>
