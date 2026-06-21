<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-white">Monitored Targets</h1>
        <p class="mt-1 text-sm text-gray-400">Images that are monitored for recurring vulnerability scans.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        @click="openCreate()"
      >
        <span class="text-lg">+</span> Add Target
      </button>
    </div>

    <ErrorAlert v-if="error" :message="error" :retry="true" @retry="load()" />

    <LoadingSpinner v-if="pending && targets.length === 0" message="Loading targets..." />

    <div v-if="!pending && targets.length === 0" class="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
      <p class="text-gray-400">No targets configured. Add a target to start monitoring.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="target in targets"
        :key="target.id"
        class="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-mono text-sm text-cyan-400">
              {{ target.repository }}:{{ target.tag }}
            </h3>
            <p class="mt-1 text-xs text-gray-500">{{ target.registry_name || target.registry_url }}</p>
          </div>
          <StatusBadge v-if="target.latest_scan_status" :status="target.latest_scan_status" />
        </div>

        <div class="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-1">
            <span class="i-lucide-clock block size-3" />
            {{ target.scan_frequency }}
          </span>
          <span v-if="target.latest_scan_id" class="font-mono text-gray-600">
            {{ target.latest_scan_id.substring(0, 8) }}...
          </span>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            class="flex-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
            @click="triggerScan(target)"
          >
            Scan Now
          </button>
          <button
            class="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
            @click="openEdit(target)"
          >
            Edit
          </button>
          <button
            class="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:text-red-300 hover:border-red-600 transition-colors"
            @click="confirmDelete(target)"
          >
            Stop
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="closeModal()"
      >
        <div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
          <h2 class="text-lg font-semibold text-white">{{ editingTarget ? 'Edit Target' : 'Add Monitored Target' }}</h2>
          <p class="mt-1 text-sm text-gray-400">
            {{ editingTarget ? 'Update scan frequency.' : 'Set up recurring vulnerability scans for an image.' }}
          </p>

          <div class="mt-4 space-y-4">
            <div v-if="!editingTarget">
              <label class="block text-sm font-medium text-gray-300 mb-1">Image</label>
              <select
                v-model="form.image_id"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="" disabled>Select an image...</option>
                <option
                  v-for="img in availableImages"
                  :key="img.id"
                  :value="img.id"
                >
                  {{ img.repository }}:{{ img.tag }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Scan Frequency</label>
              <select
                v-model="form.scan_frequency"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="1h">Every hour</option>
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="24h">Every 24 hours</option>
                <option value="48h">Every 2 days</option>
                <option value="168h">Every 7 days</option>
              </select>
            </div>
          </div>

          <div v-if="modalError" class="mt-3 rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {{ modalError }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              @click="closeModal()"
            >
              Cancel
            </button>
            <button
              class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
              :disabled="saving || (!editingTarget && !form.image_id)"
              @click="handleSave"
            >
              {{ saving ? 'Saving...' : (editingTarget ? 'Update' : 'Create Target') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showDeleteConfirm = false"
      >
        <div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
          <h2 class="text-lg font-semibold text-white">Remove Target</h2>
          <p class="mt-2 text-sm text-gray-400">
            This will stop monitoring {{ deleteTarget?.repository }}:{{ deleteTarget?.tag }}. Existing scan data will be preserved.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
              @click="doDelete"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { apiGet, apiPost, apiPut, apiDelete } = useApi()
const error = ref<string | null>(null)
const pending = ref(false)

interface TargetRow {
  id: string
  image_id: string
  scan_frequency: string
  latest_scan_id: string | null
  latest_scan_status: string | null
  repository: string
  tag: string
  registry_url: string
  registry_name: string
  created_at: string
  updated_at: string
}

interface ImageRow {
  id: string
  repository: string
  tag: string
}

const targets = ref<TargetRow[]>([])

// Shared modal
const showModal = ref(false)
const editingTarget = ref<TargetRow | null>(null)
const form = reactive({ image_id: '', scan_frequency: '24h' })
const modalError = ref('')
const saving = ref(false)

// Available images for dropdown
const availableImages = ref<ImageRow[]>([])

// Delete confirm
const deleteTarget = ref<TargetRow | null>(null)
const showDeleteConfirm = ref(false)

async function load() {
  pending.value = true
  error.value = null
  try {
    const res = await apiGet<TargetRow[]>('/api/v1/targets')
    targets.value = res.data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load targets'
  } finally {
    pending.value = false
  }
}

async function loadImages() {
  try {
    const res = await apiGet<ImageRow[]>('/api/v1/images', { per_page: 100 })
    availableImages.value = res.data
  } catch {
    // ignore - dropdown will be empty
  }
}

function openCreate() {
  editingTarget.value = null
  form.image_id = ''
  form.scan_frequency = '24h'
  modalError.value = ''
  saving.value = false
  loadImages()
  showModal.value = true
}

function openEdit(target: TargetRow) {
  editingTarget.value = target
  form.image_id = target.image_id
  form.scan_frequency = target.scan_frequency
  modalError.value = ''
  saving.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTarget.value = null
}

async function handleSave() {
  modalError.value = ''
  saving.value = true
  try {
    if (editingTarget.value) {
      await apiPut(`/api/v1/targets/${editingTarget.value.id}`, {
        scan_frequency: form.scan_frequency,
      })
    } else {
      await apiPost('/api/v1/targets', {
        image_id: form.image_id,
        scan_frequency: form.scan_frequency,
      })
    }
    closeModal()
    await load()
  } catch (e: unknown) {
    modalError.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    saving.value = false
  }
}

async function triggerScan(target: TargetRow) {
  try {
    const scan = await apiPost<{ id: string }>(`/api/v1/targets/${target.id}/scan`, {})
    if (scan?.id) {
      navigateTo(`/scans/${scan.id}`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to trigger scan'
    error.value = msg
  }
}

function confirmDelete(target: TargetRow) {
  deleteTarget.value = target
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await apiDelete(`/api/v1/targets/${deleteTarget.value.id}`)
    showDeleteConfirm.value = false
    deleteTarget.value = null
    await load()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed'
    error.value = msg
  }
}

onMounted(load)
</script>
