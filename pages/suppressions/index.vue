<template>
<div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Suppressions</h1>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
          @click="showCreateModal = true"
        >
          <span class="i-lucide-plus block size-4" />
          Add Suppression
        </button>
      </div>

      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />

      <DataTable
        v-if="!error"
        :columns="columns"
        :rows="suppressions as unknown as Record<string, unknown>[]"
        :loading="status === 'pending'"
        empty-message="No suppressions defined. Suppress known false positives or accepted risks."
      >
        <template #cell-cve_id="{ row }">
          <span class="font-mono text-xs text-cyan-400">{{ row.cve_id || '—' }}</span>
        </template>
        <template #cell-pkg_name="{ row }">
          <span class="text-gray-300">{{ row.pkg_name || '—' }}</span>
        </template>
        <template #cell-image_id="{ row }">
          <span class="font-mono text-xs text-gray-500">{{ row.image_id ? (row.image_id as string).substring(0, 12) + '...' : 'All images' }}</span>
        </template>
        <template #cell-reason="{ row }">
          <span class="text-gray-300 text-sm max-w-64 line-clamp-1">{{ row.reason }}</span>
        </template>
        <template #cell-expires_at="{ row }">
          <span class="text-sm" :class="isExpired(row.expires_at as string) ? 'text-red-400' : 'text-gray-400'">
            {{ row.expires_at ? formatDate(row.expires_at as string) : 'Never' }}
          </span>
        </template>
        <template #cell-actions="{ row }">
          <button
            class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-cyan-400 transition-colors"
            @click.stop="openEdit(row as unknown as SuppressionRow)"
          >
            <UIcon name="i-lucide-pencil" class="size-4" />
          </button>
          <button
            class="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
            @click.stop="deleteTarget = row as unknown as SuppressionRow"
          >
            <UIcon name="i-lucide-trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <Pagination
        v-if="meta"
        :page="page"
        :per-page="meta.per_page"
        :total="meta.total"
        @update:page="page = $event"
      />

      <!-- Create Modal -->
      <Teleport to="body">
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/60" @click="showCreateModal = false; resetForm()" />
          <div class="relative w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Add Suppression</h3>
            <form class="space-y-4" @submit.prevent="handleCreate">
              <div class="relative">
                <label class="block text-sm font-medium text-gray-300 mb-1">CVE ID (search existing or type custom)</label>
                <input
                  v-model="cveSearch"
                  type="text"
                  placeholder="Type to search CVEs..."
                  autocomplete="off"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  @input="searchCVEs"
                  @focus="searchCVEs"
                  @keydown.escape="cveResults = []"
                />
                <div
                  v-if="cveResults.length"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 shadow-2xl max-h-60 overflow-y-auto"
                >
                  <button
                    v-for="(cve, idx) in cveResults"
                    :key="cve.vulnerability_id"
                    type="button"
                    class="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0"
                    :class="{ 'rounded-t-lg': idx === 0, 'rounded-b-lg': idx === cveResults.length - 1 }"
                    @click="selectCVE(cve)"
                  >
                    <span class="font-mono text-xs text-cyan-400">{{ cve.vulnerability_id }}</span>
                    <span v-if="cve.title" class="text-gray-500 text-xs truncate">{{ cve.title }}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Package Name (optional)</label>
                <input v-model="createForm.pkg_name" type="text" placeholder="e.g. openssl" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Image ID (optional, leave empty for all)</label>
                <input v-model="createForm.image_id" type="text" placeholder="UUID" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Reason <span class="text-red-400">*</span></label>
                <textarea v-model="createForm.reason" required rows="2" placeholder="Why is this being suppressed?" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Expires At (optional)</label>
                <input v-model="createForm.expires_at" type="datetime-local" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800" @click="showCreateModal = false; resetForm()">Cancel</button>
                <button type="submit" :disabled="!createForm.reason" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50">Create</button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <ConfirmModal
        :open="deleteTarget !== null"
        title="Delete Suppression"
        message="Are you sure you want to remove this suppression? Findings for this vulnerability will resume appearing in scans."
        confirm-text="Delete"
        :danger="true"
        @confirm="handleDelete"
        @cancel="deleteTarget = null"
      />

      <!-- Edit Modal -->
      <Teleport to="body">
        <div v-if="editTarget !== null" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/60" @click="editTarget = null" />
          <div class="relative w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Edit Suppression</h3>

            <div class="mb-4 rounded-lg bg-gray-800/50 p-3 border border-gray-700">
              <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Rule</div>
              <div class="space-y-1">
                <div v-if="editTarget.cve_id" class="text-sm">
                  <span class="text-gray-500">CVE:</span>
                  <span class="font-mono text-cyan-400 ml-1">{{ editTarget.cve_id }}</span>
                </div>
                <div v-if="editTarget.pkg_name" class="text-sm">
                  <span class="text-gray-500">Package:</span>
                  <span class="text-gray-300 ml-1">{{ editTarget.pkg_name }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-gray-500">Scope:</span>
                  <span class="text-gray-300 ml-1">{{ editTarget.image_id ? editTarget.image_id.substring(0, 12) + '...' : 'All images' }}</span>
                </div>
              </div>
            </div>

            <form class="space-y-4" @submit.prevent="handleUpdate">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                <textarea v-model="editForm.reason" rows="2" placeholder="Why is this being suppressed?" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Expires At</label>
                <input v-model="editForm.expires_at" type="datetime-local" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none" />
                <p class="mt-1 text-xs text-gray-500">Leave empty for no expiration.</p>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800" @click="editTarget = null">Cancel</button>
                <button type="submit" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">Save</button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { SuppressionRow, CreateSuppressionPayload, UpdateSuppressionPayload, GlobalCVERow } from '~/types/api'
import type { PaginationMeta } from '~/types/api'


const { apiGet, apiPost, apiPatch, apiDelete } = useApi()
const toast = useToast()

const page = ref(1)
const error = ref<string | null>(null)
const meta = ref<PaginationMeta | undefined>()
const showCreateModal = ref(false)
const deleteTarget = ref<SuppressionRow | null>(null)
const editTarget = ref<SuppressionRow | null>(null)

const editForm = reactive<UpdateSuppressionPayload>({
  reason: '',
  expires_at: '',
})

const cveSearch = ref('')
const cveResults = ref<GlobalCVERow[]>([])
let cveSearchTimer: ReturnType<typeof setTimeout> | null = null

const createForm = reactive<CreateSuppressionPayload>({
  cve_id: '',
  pkg_name: '',
  image_id: '',
  reason: '',
  expires_at: '',
})

async function searchCVEs() {
  if (cveSearchTimer) clearTimeout(cveSearchTimer)
  cveSearchTimer = setTimeout(async () => {
    const q = cveSearch.value.trim()
    if (!q) { cveResults.value = []; return }
    try {
      const res = await apiGet<GlobalCVERow[]>('/api/v1/dashboard/cves', { per_page: 8, sort_by: 'occurrences' })
      const lower = q.toLowerCase()
      cveResults.value = (res.data ?? []).filter((c) =>
        c.vulnerability_id.toLowerCase().includes(lower) ||
        (c.title && c.title.toLowerCase().includes(lower))
      )
    } catch {
      cveResults.value = []
    }
  }, 200)
}

function selectCVE(cve: GlobalCVERow) {
  createForm.cve_id = cve.vulnerability_id
  if (!createForm.pkg_name) {
    // Pre-fill package name from the most common package for this CVE
    createForm.pkg_name = ''
  }
  cveSearch.value = cve.vulnerability_id
  cveResults.value = []
}

const columns = [
  { key: 'cve_id', label: 'CVE' },
  { key: 'pkg_name', label: 'Package' },
  { key: 'image_id', label: 'Scope' },
  { key: 'reason', label: 'Reason' },
  { key: 'expires_at', label: 'Expires' },
  { key: 'actions', label: '' },
]

const { data: suppressions, refresh, status } = await useAsyncData<SuppressionRow[]>('suppressions-list', async () => {
  error.value = null
  const res = await apiGet<SuppressionRow[]>('/api/v1/suppressions/', { page: page.value, per_page: 20 })
  meta.value = res.meta
  return res.data
})

watch(page, () => { refresh() })

// Sync free-text CVE input back to the form
watch(cveSearch, (v) => { createForm.cve_id = v })

async function handleCreate() {
  const payload: Record<string, unknown> = { reason: createForm.reason }
  if (createForm.cve_id) payload.cve_id = createForm.cve_id
  if (createForm.pkg_name) payload.pkg_name = createForm.pkg_name
  if (createForm.image_id) payload.image_id = createForm.image_id
  if (createForm.expires_at) payload.expires_at = new Date(createForm.expires_at).toISOString()

  try {
    await apiPost<SuppressionRow>('/api/v1/suppressions/', payload)
    toast.add({ title: 'Created', description: 'Suppression added', color: 'success' })
    showCreateModal.value = false
    resetForm()
    refresh()
  } catch {
    // handled
  }
}

function resetForm() {
  cveSearch.value = ''
  cveResults.value = []
  createForm.cve_id = ''
  createForm.pkg_name = ''
  createForm.image_id = ''
  createForm.reason = ''
  createForm.expires_at = ''
}

function openEdit(row: SuppressionRow) {
  editTarget.value = row
  editForm.reason = row.reason
  editForm.expires_at = row.expires_at ? toLocalDatetime(row.expires_at) : ''
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function handleUpdate() {
  if (!editTarget.value) return
  const payload: Record<string, unknown> = {}
  if (editForm.reason) payload.reason = editForm.reason
  if (editForm.expires_at) payload.expires_at = new Date(editForm.expires_at).toISOString()

  try {
    await apiPatch<SuppressionRow>(`/api/v1/suppressions/${editTarget.value.id}`, payload)
    toast.add({ title: 'Updated', description: 'Suppression updated', color: 'success' })
    editTarget.value = null
    refresh()
  } catch {
    // handled
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await apiDelete(`/api/v1/suppressions/${deleteTarget.value.id}`)
    toast.add({ title: 'Deleted', description: 'Suppression removed', color: 'success' })
    deleteTarget.value = null
    refresh()
  } catch {
    deleteTarget.value = null
  }
}

function isExpired(iso: string): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
