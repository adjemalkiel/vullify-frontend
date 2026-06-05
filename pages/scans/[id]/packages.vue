<template>
  <div class="space-y-4">
    <div>
      <select
        v-model="typeFilter"
        class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
      >
        <option value="">All Types</option>
        <option value="os">OS</option>
        <option value="python">Python</option>
        <option value="node">Node.js</option>
        <option value="java">Java</option>
        <option value="go">Go</option>
        <option value="ruby">Ruby</option>
        <option value="rust">Rust</option>
        <option value="php">PHP</option>
      </select>
    </div>

    <ErrorAlert v-if="error" :message="error" :retry="true" @retry="load()" />

    <DataTable
      :columns="columns"
      :rows="packages as unknown as Record<string, unknown>[]"
      :loading="loading"
      empty-message="No packages found"
    >
      <template #cell-name="{ row }">
        <span class="text-gray-200 font-medium">{{ row.name }}</span>
      </template>
      <template #cell-version="{ row }">
        <span class="font-mono text-xs text-gray-400">{{ row.version }}</span>
      </template>
      <template #cell-type="{ row }">
        <span class="uppercase text-xs text-gray-500">{{ row.type }}</span>
      </template>
      <template #cell-licenses="{ row }">
        <span class="text-gray-400 text-xs">{{ (row.licenses as string[])?.join(', ') || '—' }}</span>
      </template>
      <template #cell-layer_digest="{ row }">
        <span class="font-mono text-xs text-gray-600">{{ (row.layer_digest as string)?.substring(0, 12) || '—' }}</span>
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
import type { PackageRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'

const props = defineProps<{ scanId: string }>()

const { apiGet } = useApi()
const error = ref<string | null>(null)
const loading = ref(false)
const meta = ref<PaginationMeta | undefined>()
const page = ref(1)
const typeFilter = ref('')

const packages = ref<PackageRow[]>([])

const columns = [
  { key: 'name', label: 'Package' },
  { key: 'version', label: 'Version' },
  { key: 'type', label: 'Type' },
  { key: 'licenses', label: 'Licenses' },
  { key: 'layer_digest', label: 'Layer' },
]

async function load() {
  error.value = null
  loading.value = true
  try {
    const res = await apiGet<PackageRow[]>(`/api/v1/scans/${props.scanId}/packages`, {
      page: page.value,
      per_page: 20,
      type: typeFilter.value || undefined,
    })
    packages.value = res.data
    meta.value = res.meta
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load packages'
  } finally {
    loading.value = false
  }
}

watch(page, load)
watch(typeFilter, () => { page.value = 1; load() })

onMounted(load)
</script>
