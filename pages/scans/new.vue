<template>
<div class="mx-auto max-w-2xl space-y-6">
      <h1 class="text-2xl font-bold text-white">New Scan</h1>

      <ErrorAlert v-if="error" :message="error" />

      <!-- Tab switcher -->
      <div class="flex border-b border-gray-800">
        <button
          class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2"
          :class="activeTab === 'image'
            ? 'border-cyan-500 text-cyan-400'
            : 'border-transparent text-gray-400 hover:text-gray-200'"
          @click="activeTab = 'image'"
        >
          Scan by Image
        </button>
        <button
          class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2"
          :class="activeTab === 'adhoc'
            ? 'border-cyan-500 text-cyan-400'
            : 'border-transparent text-gray-400 hover:text-gray-200'"
          @click="activeTab = 'adhoc'"
        >
          Ad-hoc Scan
        </button>
      </div>

      <!-- Scan by Image -->
      <div v-if="activeTab === 'image'" class="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Select Image</label>
            <select
              v-model="selectedImageId"
              required
              class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="" disabled>— Select an image —</option>
              <option v-for="img in images" :key="img.id" :value="img.id">
                {{ img.repository }}:{{ img.tag }}
              </option>
            </select>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="!selectedImageId || submitting"
              class="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              <span v-if="submitting" class="i-lucide-loader-circle inline-block size-4 animate-spin mr-1" />
              {{ submitting ? 'Submitting...' : 'Start Scan' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Ad-hoc Scan -->
      <div v-if="activeTab === 'adhoc'" class="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Image Reference</label>
            <input
              v-model="imageRef"
              type="text"
              required
              placeholder="e.g. nginx:latest or ghcr.io/owner/repo:tag"
              class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="!imageRef.trim() || submitting"
              class="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              <span v-if="submitting" class="i-lucide-loader-circle inline-block size-4 animate-spin mr-1" />
              {{ submitting ? 'Submitting...' : 'Start Ad-hoc Scan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
</template>

<script setup lang="ts">
import type { ImageRow, ScanDetail } from '~/types/api'


const { apiGet, apiPost } = useApi()
const toast = useToast()
const router = useRouter()

const activeTab = ref<'image' | 'adhoc'>('image')
const selectedImageId = ref('')
const imageRef = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

const { data: images } = await useAsyncData<ImageRow[]>('scan-images', async () => {
  const res = await apiGet<ImageRow[]>('/api/v1/images/', { per_page: 100 })
  return res.data
})

async function handleSubmit() {
  error.value = null
  submitting.value = true

  const body: Record<string, string> = {}
  if (activeTab.value === 'image') {
    body.image_id = selectedImageId.value
  } else {
    body.image_ref = imageRef.value.trim()
  }

  try {
    if (activeTab.value === 'adhoc') {
      const scan = await apiPost<ScanDetail>('/api/v1/scans/adhoc', body as unknown as Record<string, unknown>)
      toast.add({ title: 'Ad-hoc scan submitted', description: 'Scan has been queued', color: 'success' })
      router.push(`/scans/${scan.id}`)
    } else {
      const scan = await apiPost<ScanDetail>('/api/v1/scans/', body as unknown as Record<string, unknown>)
      toast.add({ title: 'Scan created', description: 'Scan has been queued', color: 'success' })
      router.push(`/scans/${scan.id}`)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create scan'
  } finally {
    submitting.value = false
  }
}
</script>
