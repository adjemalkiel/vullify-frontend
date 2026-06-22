<template>
  <div class="space-y-4">
    <!-- Still scanning — friendly info instead of error -->
    <div
      v-if="!showError && (props.scanStatus === 'pending' || props.scanStatus === 'running')"
      class="rounded-xl border border-gray-700 bg-gray-800/50 p-6 text-center"
    >
      <span class="i-lucide-file-code block size-10 mx-auto mb-3 text-gray-500" />
      <p class="text-sm text-gray-400">SBOM is generated once the scan completes.</p>
      <p class="mt-1 text-xs text-gray-600">Check back when the status is no longer <span class="text-cyan-400">running</span>.</p>
    </div>

    <div v-else-if="showError" class="space-y-4">
      <ErrorAlert :message="error" :retry="true" @retry="load()" />
    </div>

    <LoadingSpinner v-else-if="loading" message="Loading SBOM..." />

    <template v-else-if="sbomData">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">
          Format: <span class="text-cyan-400 font-mono">{{ sbomFormat }}</span>
        </p>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          @click="downloadSbom"
        >
          <span class="i-lucide-download block size-4" />
          Download
        </button>
      </div>

      <div class="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div class="overflow-auto max-h-[70vh]">
          <pre class="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{{ formattedJson }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ scanId: string; scanStatus: string }>()

const { apiGetRaw } = useApi()
const toast = useToast()

const loading = ref(true)
const error = ref<string | null>(null)
const sbomData = ref<unknown>(null)
const sbomFormat = ref('unknown')

const showError = computed(() => {
  if (!error.value) return false
  // Don't show 404 as a red error when scan hasn't finished yet
  if (error.value.includes('404') && (props.scanStatus === 'pending' || props.scanStatus === 'running')) {
    return false
  }
  return true
})

async function load() {
  error.value = null
  loading.value = true
  try {
    const url = `/api/v1/scans/${props.scanId}/sbom`
    const config = useRuntimeConfig()
    const base = config.public.apiBaseUrl as string
    const response = await fetch(`${base}${url}`)
    sbomFormat.value = response.headers.get('X-SBOM-Format') || 'unknown'

    if (!response.ok) {
      if (response.status === 404 && (props.scanStatus === 'pending' || props.scanStatus === 'running')) {
        // Not an error — SBOM just isn't ready yet
        loading.value = false
        return
      }
      throw new Error(`Failed to fetch SBOM: ${response.status}`)
    }
    sbomData.value = await response.json()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load SBOM'
  } finally {
    loading.value = false
  }
}

const formattedJson = computed(() => {
  if (!sbomData.value) return ''
  return JSON.stringify(sbomData.value, null, 2)
})

function downloadSbom() {
  const blob = new Blob([formattedJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sbom-${props.scanId.substring(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Downloaded', description: 'SBOM saved to your downloads', color: 'success' })
}

onMounted(load)
</script>
