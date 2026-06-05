<template>
<div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Images</h1>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="images as unknown as Record<string, unknown>[]"
        :loading="status === 'pending'"
        empty-message="No images found. Add a registry and sync to populate images."
        clickable
        @row-click="(row) => navigateTo(`/images/${row.id}`)"
      >
        <template #cell-repository="{ row }">
          <span class="text-cyan-400">{{ row.repository }}<span class="text-gray-500">:</span>{{ row.tag }}</span>
        </template>
        <template #cell-digest="{ row }">
          <span class="font-mono text-xs text-gray-500">{{ (row.digest as string)?.substring(0, 18) }}...</span>
        </template>
        <template #cell-last_seen_at="{ row }">
          <span class="text-gray-400">{{ formatDate(row.last_seen_at as string) }}</span>
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
import type { ImageRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'


const { apiGet } = useApi()

const page = ref(1)
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()

const columns = [
  { key: 'repository', label: 'Repository:Tag' },
  { key: 'digest', label: 'Digest' },
  { key: 'last_seen_at', label: 'Last Seen' },
]

const { data: images, refresh, status } = await useAsyncData<ImageRow[]>('images-list', async () => {
  error.value = null
  const res = await apiGet<ImageRow[]>('/api/v1/images/', { page: page.value, per_page: 20 })
  meta.value = res.meta
  return res.data
})

watch(page, () => { refresh() })

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
