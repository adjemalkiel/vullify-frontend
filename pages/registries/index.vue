<template>
<div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Registries</h1>
        <NuxtLink
          to="/registries/new"
          class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        >
          <span class="i-lucide-plus block size-4" />
          Add Registry
        </NuxtLink>
      </div>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="registries as unknown as Record<string, unknown>[]"
        :loading="status === 'pending'"
        empty-message="No registries configured. Add your first container registry to start scanning."
        :sort="sort"
        @sort="handleSort"
      >
        <template #cell-name="{ row }">
          <NuxtLink :to="`/registries/${row.id}`" class="font-medium text-cyan-400 hover:text-cyan-300">
            {{ row.name }}
          </NuxtLink>
        </template>
        <template #cell-type="{ row }">
          <span class="uppercase text-xs font-medium text-gray-400">{{ row.type }}</span>
        </template>
        <template #cell-url="{ row }">
          <span class="text-gray-400 font-mono text-xs">{{ row.url }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/registries/${row.id}`"
              class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-cyan-400 transition-colors inline-block"
              title="Edit registry"
              @click.stop
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </NuxtLink>
            <button
              class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-cyan-400 transition-colors"
              title="Sync registry"
              :disabled="syncingRegistries.has(row.id as string)"
              @click.stop="handleSync(row.id as string)"
            >
              <UIcon name="i-lucide-refresh-cw" class="size-4" :class="{ 'animate-spin': syncingRegistries.has(row.id as string) }" />
            </button>
            <button
              class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
              title="Delete registry"
              @click.stop="deleteTarget = row as unknown as RegistryRow"
            >
              <UIcon name="i-lucide-trash" class="size-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <Pagination
        v-if="meta"
        :page="page"
        :per-page="meta.per_page"
        :total="meta.total"
        @update:page="page = $event"
      />

      <ConfirmModal
        :open="deleteTarget !== null"
        title="Delete Registry"
        :message="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
        confirm-text="Delete"
        :danger="true"
        @confirm="handleDelete"
        @cancel="deleteTarget = null"
      />
    </div>
</template>

<script setup lang="ts">
import type { RegistryRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'


const { apiGet, apiDelete, apiPost } = useApi()
const toast = useToast()

const page = ref(1)
const sort = ref<{ column: string; direction: 'asc' | 'desc' }>({ column: 'name', direction: 'asc' })
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()
const syncingRegistries = ref(new Set<string>())
const deleteTarget = ref<RegistryRow | null>(null)

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'url', label: 'URL' },
  { key: 'updated_at', label: 'Last Updated', sortable: true },
  { key: 'actions', label: '' },
]

const { data: registries, refresh, status } = await useAsyncData<RegistryRow[]>('registries-list', async () => {
  error.value = null
  const res = await apiGet<RegistryRow[]>('/api/v1/registries/', { page: page.value, per_page: 20 })
  meta.value = res.meta
  return res.data
})

watch(page, () => { refresh() })

function handleSort(col: string) {
  // Simple toggle for demo — full column sort would need backend support
  sort.value = { column: col, direction: 'asc' }
}

async function handleSync(id: string) {
  syncingRegistries.value.add(id)
  try {
    const result = await apiPost<{ synced_images: number; repositories_seen: number }>(`/api/v1/registries/${id}/sync`)
    toast.add({ title: 'Sync complete', description: `${result.synced_images} images synced from ${result.repositories_seen} repos`, color: 'success' })
    refresh()
  } catch {
    // toast already shown by useApi
  } finally {
    syncingRegistries.value.delete(id)
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await apiDelete(`/api/v1/registries/${deleteTarget.value.id}`)
    toast.add({ title: 'Deleted', description: `Registry '${deleteTarget.value.name}' deleted`, color: 'success' })
    deleteTarget.value = null
    refresh()
  } catch {
    deleteTarget.value = null
  }
}
</script>
