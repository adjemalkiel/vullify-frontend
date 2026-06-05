<template>
    <div class="space-y-6">
      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />
      <LoadingSpinner v-else-if="status === 'pending'" message="Loading image..." />

      <template v-if="image">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white">
              {{ image.repository }}<span class="text-gray-500">:</span>{{ image.tag }}
            </h1>
            <p class="mt-1 text-sm text-gray-400 font-mono">{{ image.registry_url }}</p>
          </div>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
            :disabled="scanning"
            @click="handleScan"
          >
            <span v-if="scanning" class="i-lucide-loader-circle block size-4 animate-spin" />
            <span v-else class="i-lucide-search block size-4" />
            {{ scanning ? 'Creating Scan...' : 'Scan Now' }}
          </button>
        </div>

        <!-- Metadata Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Digest" :value="(image.digest || '').substring(0, 18) + '...'" icon="i-lucide-fingerprint" color="cyan" />
          <StatsCard label="First Seen" :value="formatDate(image.first_seen_at)" icon="i-lucide-clock" color="blue" />
          <StatsCard label="Last Seen" :value="formatDate(image.last_seen_at)" icon="i-lucide-eye" color="green" />
          <StatsCard label="Latest Scan" :value="image.latest_scan_status || 'none'" icon="i-lucide-shield-check" :color="image.latest_scan_status === 'completed' ? 'green' : 'yellow'" />
        </div>

        <!-- Latest Scan Info -->
        <div v-if="image.latest_scan_id" class="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <NuxtLink :to="`/scans/${image.latest_scan_id}`" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <span class="i-lucide-arrow-right block size-4" />
            View Latest Scan Details
          </NuxtLink>
          <div class="mt-3 flex items-center gap-4 text-sm text-gray-400">
            <span>Status: <StatusBadge :status="image.latest_scan_status || 'unknown'" /></span>
            <span v-if="image.latest_scan_started_at">Started: {{ formatDate(image.latest_scan_started_at) }}</span>
            <span v-if="image.latest_scan_completed_at">Completed: {{ formatDate(image.latest_scan_completed_at) }}</span>
          </div>
        </div>
      </template>
    </div>
</template>

<script setup lang="ts">
import type { ImageDetail, ScanDetail } from '~/types/api'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { apiGet, apiPost } = useApi()
const toast = useToast()

const error = ref<string | null>(null)
const scanning = ref(false)

const { data: image, refresh, status } = await useAsyncData<ImageDetail>('image-detail', async () => {
  error.value = null
  const res = await apiGet<ImageDetail>(`/api/v1/images/${route.params.id}`)
  return res.data
})

async function handleScan() {
  scanning.value = true
  try {
    const scan = await apiPost<ScanDetail>('/api/v1/scans/', { image_id: route.params.id } as unknown as Record<string, unknown>)
    toast.add({ title: 'Scan created', description: 'Scan has been queued', color: 'success' })
    navigateTo(`/scans/${scan.id}`)
  } catch {
    // handled
  } finally {
    scanning.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
