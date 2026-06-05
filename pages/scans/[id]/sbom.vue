<template>
  <div class="space-y-4">
    <div v-if="error" class="space-y-4">
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
const props = defineProps<{ scanId: string }>()

const { apiGetRaw } = useApi()
const toast = useToast()

const loading = ref(true)
const error = ref<string | null>(null)
const sbomData = ref<unknown>(null)
const sbomFormat = ref('unknown')

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
