<template>
  <div class="space-y-6">
    <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />
    <LoadingSpinner v-else-if="status === 'pending'" message="Loading CVE..." />

    <template v-if="cve">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ cve.title || cve.vulnerability_id }}</h1>
          <div class="mt-1 flex items-center gap-3">
            <SeverityBadge :severity="cve.severity" :dot="true" />
            <span class="font-mono text-sm text-cyan-400">{{ cve.vulnerability_id }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Description</h2>
            <p class="text-sm text-gray-300 leading-relaxed">{{ cve.description || 'No description available.' }}</p>
          </div>

          <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Occurrences</h2>
            <p class="text-3xl font-bold tabular-nums text-white">{{ cve.occurrences }}</p>
            <p class="text-xs text-gray-500 mt-1">instances across all images (non-suppressed)</p>
          </div>

          <!-- Affected Images -->
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Affected Images
              <span class="ml-2 text-xs text-gray-500">({{ cve.affected_images.length }})</span>
            </h2>
            <div v-if="cve.affected_images.length === 0" class="text-sm text-gray-500">No affected images.</div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                    <th class="pb-2 pr-4">Repository</th>
                    <th class="pb-2 pr-4">Tag</th>
                    <th class="pb-2">Fixed Version</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="img in cve.affected_images" :key="img.image_id" class="border-b border-gray-800/50">
                    <td class="py-2 pr-4 font-mono text-gray-200">{{ img.repository }}</td>
                    <td class="py-2 pr-4 font-mono text-cyan-400">{{ img.tag }}</td>
                    <td class="py-2 font-mono" :class="img.fixed_version ? 'text-green-400' : 'text-gray-500'">
                      {{ img.fixed_version || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Data Sources -->
          <div v-if="cve.data_sources && cve.data_sources.length > 0" class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Data Sources</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="src in cve.data_sources"
                :key="src"
                class="rounded-lg bg-gray-800 px-3 py-1 text-xs font-mono text-gray-300"
              >
                {{ src }}
              </span>
            </div>
          </div>
        </div>

        <!-- Sidebar Metrics -->
        <div class="space-y-4">
          <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Risk Assessment</h2>
            <div class="space-y-4">
              <div>
                <p class="text-xs text-gray-500">Risk Score</p>
                <p class="text-2xl font-bold tabular-nums" :class="riskScoreColor">{{ cve.risk_score != null ? cve.risk_score.toFixed(1) : '—' }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500">CVSS v3 Score</p>
                <p class="text-sm font-mono tabular-nums text-gray-300">{{ cve.cvss_v3_score != null ? cve.cvss_v3_score.toFixed(1) : '—' }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500 mb-1">EPSS Score</p>
                <div v-if="cve.epss_score != null" class="flex items-center gap-2">
                  <div class="h-2 flex-1 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-yellow-500 transition-all"
                      :style="{ width: (cve.epss_score * 100) + '%' }"
                    />
                  </div>
                  <span class="text-sm font-mono tabular-nums text-gray-300">{{ (cve.epss_score * 100).toFixed(1) }}%</span>
                </div>
                <p v-else class="text-sm text-gray-500">—</p>
              </div>

              <div>
                <p class="text-xs text-gray-500">EPSS Percentile</p>
                <p class="text-sm font-mono tabular-nums text-gray-300">{{ cve.epss_percentile ? (cve.epss_percentile * 100).toFixed(1) + '%' : '—' }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500 mb-1">KEV Listed</p>
                <span :class="cve.kev_listed ? 'text-red-400' : 'text-gray-500'" class="text-sm font-medium">
                  {{ cve.kev_listed ? 'Yes — Known Exploited Vulnerability' : 'No' }}
                </span>
                <p v-if="cve.kev_date_added" class="text-xs text-gray-500 mt-1">Added: {{ formatDate(cve.kev_date_added) }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500">Exploit Exists</p>
                <span :class="cve.exploit_exists ? 'text-red-400' : 'text-green-400'" class="text-sm font-medium">
                  {{ cve.exploit_exists ? 'Yes' : 'No known exploit' }}
                </span>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Metadata</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Last Seen</span>
                <span class="text-gray-300">{{ formatDate(cve.last_seen) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CVEDetail } from '~/types/api'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { apiGet } = useApi()

const error = ref<string | null>(null)

const { data: cve, refresh, status } = await useAsyncData<CVEDetail>('cve-detail', async () => {
  error.value = null
  const id = route.params.id as string
  const res = await apiGet<CVEDetail>(`/api/v1/cves/${encodeURIComponent(id)}`)
  return res.data
})

const riskScoreColor = computed(() => {
  const score = cve.value?.risk_score
  if (!score) return 'text-gray-500'
  if (score >= 7) return 'text-red-400'
  if (score >= 4) return 'text-orange-400'
  return 'text-green-400'
})

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
</script>
