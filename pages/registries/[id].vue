<template>
    <div class="space-y-6">
      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />
      <LoadingSpinner v-else-if="status === 'pending'" message="Loading registry..." />

      <template v-if="registry">
        <!-- Registry Info -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white">{{ registry.name }}</h1>
            <div class="mt-1 flex items-center gap-3 text-sm text-gray-400">
              <span class="uppercase text-xs font-medium">{{ registry.type }}</span>
              <span class="font-mono text-xs">{{ registry.url }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              @click="showEditModal = true"
            >
              Edit
            </button>
            <button
              class="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
              :disabled="syncing"
              @click="handleSync"
            >
              <span class="i-lucide-refresh-cw block size-4" :class="{ 'animate-spin': syncing }" />
              {{ syncing ? 'Syncing...' : 'Sync' }}
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              @click="deleteConfirm = true"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Images Table -->
        <div>
          <h2 class="text-lg font-semibold text-white mb-3">Images in this Registry</h2>
          <DataTable
            :columns="imageColumns"
            :rows="images as unknown as Record<string, unknown>[]"
            :loading="imagesLoading"
            empty-message="No images found in this registry. Click 'Sync' to discover images."
            clickable
            @row-click="(row) => navigateTo(`/images/${row.id}`)"
          >
            <template #cell-repository="{ row }">
              <span class="text-cyan-400">{{ row.repository }}:{{ row.tag }}</span>
            </template>
            <template #cell-digest="{ row }">
              <span class="font-mono text-xs text-gray-500">{{ (row.digest as string)?.substring(0, 16) }}...</span>
            </template>
            <template #cell-last_seen_at="{ row }">
              <span class="text-gray-400">{{ formatDate(row.last_seen_at as string) }}</span>
            </template>
            <template #cell-actions="{ row }">
              <button
                class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                @click.stop="imgToDelete = { id: row.id as string, name: `${row.repository}:${row.tag}` as string }; showImgDelete = true"
              >
                <UIcon name="i-lucide-trash" class="size-3.5" />
              </button>
            </template>
          </DataTable>

          <Pagination
            v-if="imagesMeta"
            :page="imagesPage"
            :per-page="imagesMeta.per_page"
            :total="imagesMeta.total"
            @update:page="imagesPage = $event"
          />
        </div>
      </template>

      <!-- Edit Modal -->
      <Teleport to="body">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/60" @click="showEditModal = false" />
          <div class="relative w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Edit Registry</h3>
            <form class="space-y-4" @submit.prevent="handleEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input v-model="editForm.name" type="text" required class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">URL</label>
                <input v-model="editForm.url" type="text" required class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800" @click="showEditModal = false">Cancel</button>
                <button type="submit" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">Save</button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <ConfirmModal
        :open="deleteConfirm"
        title="Delete Registry"
        :message="`Are you sure you want to delete '${registry?.name}'? This will also remove all associated images and scans.`"
        confirm-text="Delete"
        :danger="true"
        @confirm="handleDelete"
        @cancel="deleteConfirm = false"
      />

      <ConfirmModal
        :open="showImgDelete"
        :title="`Delete Image`"
        :message="`Are you sure you want to delete '${imgToDelete?.name}'? Its scans will remain but the image will disappear from this list.`"
        confirm-text="Delete"
        :danger="true"
        @confirm="handleDeleteImage"
        @cancel="showImgDelete = false"
      />
    </div>
</template>

<script setup lang="ts">
import type { RegistryRow, ImageRow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { apiGet, apiPut, apiDelete, apiPost } = useApi()
const toast = useToast()

const error = ref<string | null>(null)
const syncing = ref(false)
const deleteConfirm = ref(false)
const deletingImg = ref(false)
const showImgDelete = ref(false)
const imgToDelete = ref<{ id: string; name: string } | null>(null)
const showEditModal = ref(false)

const editForm = reactive({ name: '', url: '' })

const imagesPage = ref(1)
const imagesMeta = ref<PaginationMeta | undefined>()
const imagesLoading = ref(false)

const { data: registry, refresh, status } = await useAsyncData<RegistryRow>('registry-detail', async () => {
  error.value = null
  const res = await apiGet<RegistryRow>(`/api/v1/registries/${route.params.id}`)
  editForm.name = res.data.name
  editForm.url = res.data.url
  return res.data
})

const { data: images } = await useAsyncData<ImageRow[]>('registry-images', async () => {
  imagesLoading.value = true
  const res = await apiGet<ImageRow[]>('/api/v1/images/', { registry_id: route.params.id as string, page: imagesPage.value, per_page: 20 })
  imagesMeta.value = res.meta
  imagesLoading.value = false
  return res.data
})

watch(imagesPage, () => { refreshNuxtData('registry-images') })

const imageColumns = [
  { key: 'repository', label: 'Repository:Tag' },
  { key: 'digest', label: 'Digest' },
  { key: 'last_seen_at', label: 'Last Seen' },
  { key: 'actions', label: '' },
]

async function handleSync() {
  syncing.value = true
  try {
    const result = await apiPost<{ synced_images: number; repositories_seen: number }>(`/api/v1/registries/${route.params.id}/sync`)
    toast.add({ title: 'Sync complete', description: `${result.synced_images} images synced from ${result.repositories_seen} repos`, color: 'success' })
    refreshNuxtData('registry-images')
  } catch {
    // handled by useApi
  } finally {
    syncing.value = false
  }
}

async function handleEdit() {
  try {
    await apiPut<RegistryRow>(`/api/v1/registries/${route.params.id}`, { name: editForm.name, url: editForm.url })
    toast.add({ title: 'Updated', description: 'Registry updated', color: 'success' })
    showEditModal.value = false
    refresh()
  } catch {
    // handled
  }
}

async function handleDelete() {
  try {
    await apiDelete(`/api/v1/registries/${route.params.id}`)
    toast.add({ title: 'Deleted', description: 'Registry deleted', color: 'success' })
    navigateTo('/registries')
  } catch {
    deleteConfirm.value = false
  }
}

async function handleDeleteImage() {
  if (!imgToDelete.value) return
  try {
    await apiDelete(`/api/v1/images/${imgToDelete.value.id}`)
    toast.add({ title: 'Image deleted', description: `${imgToDelete.value.name} removed from this registry`, color: 'success' })
    showImgDelete.value = false
    refreshNuxtData('registry-images')
  } catch {
    showImgDelete.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
