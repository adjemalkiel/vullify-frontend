<template>
    <div class="space-y-6">
      <ErrorAlert v-if="error" :message="error" :retry="true" @retry="refresh()" />
      <LoadingSpinner v-else-if="status === 'pending'" message="Loading finding..." />

      <template v-if="finding">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white">{{ finding.title }}</h1>
            <div class="mt-1 flex items-center gap-3">
              <SeverityBadge :severity="finding.severity" :dot="true" />
              <span class="font-mono text-sm text-cyan-400">{{ finding.vulnerability_id }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Description</h2>
              <p class="text-sm text-gray-300 leading-relaxed">{{ finding.description || 'No description available.' }}</p>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Package</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Name</p>
                  <p class="text-sm text-gray-200 font-mono">{{ finding.package_name }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Installed Version</p>
                  <p class="text-sm text-gray-200 font-mono">{{ finding.installed_version }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Fixed Version</p>
                  <p class="text-sm font-mono" :class="finding.fixed_version ? 'text-green-400' : 'text-gray-500'">
                    {{ finding.fixed_version || 'Not yet available' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Image</h2>
              <NuxtLink
                v-if="finding.image"
                :to="`/images/${finding.scan_id}`"
                class="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {{ finding.image.repository }}:{{ finding.image.tag }}
              </NuxtLink>
            </div>

            <div v-if="finding.known_exploits && finding.known_exploits.length > 0" class="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Known Exploits</h2>
              <div class="space-y-3">
                <div v-for="exploit in finding.known_exploits" :key="exploit.url" class="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                  <p class="text-sm text-gray-200">{{ exploit.description }}</p>
                  <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{{ exploit.source }}</span>
                    <a :href="exploit.url" target="_blank" class="text-cyan-400 hover:text-cyan-300">View source</a>
                  </div>
                </div>
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
                  <p class="text-2xl font-bold tabular-nums" :class="riskScoreColor">{{ finding.risk_score?.toFixed(1) || '—' }}</p>
                </div>

                <div>
                  <p class="text-xs text-gray-500 mb-1">EPSS Score</p>
                  <div v-if="finding.epss_score !== null" class="flex items-center gap-2">
                    <div class="h-2 flex-1 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        class="h-full rounded-full bg-yellow-500 transition-all"
                        :style="{ width: (finding.epss_score * 100) + '%' }"
                      />
                    </div>
                    <span class="text-sm font-mono tabular-nums text-gray-300">{{ (finding.epss_score * 100).toFixed(1) }}%</span>
                  </div>
                  <p v-else class="text-sm text-gray-500">—</p>
                </div>

                <div>
                  <p class="text-xs text-gray-500">EPSS Percentile</p>
                  <p class="text-sm font-mono tabular-nums text-gray-300">{{ finding.epss_percentile ? (finding.epss_percentile * 100).toFixed(1) + '%' : '—' }}</p>
                </div>

                <div>
                  <p class="text-xs text-gray-500 mb-1">KEV Listed</p>
                  <span :class="finding.kev_listed ? 'text-red-400' : 'text-gray-500'" class="text-sm font-medium">
                    {{ finding.kev_listed ? 'Yes — Known Exploited Vulnerability' : 'No' }}
                  </span>
                  <p v-if="finding.kev_date_added" class="text-xs text-gray-500 mt-1">Added: {{ formatDate(finding.kev_date_added) }}</p>
                </div>

                <div>
                  <p class="text-xs text-gray-500">Exploit Exists</p>
                  <span :class="finding.exploit_exists ? 'text-red-400' : 'text-green-400'" class="text-sm font-medium">
                    {{ finding.exploit_exists ? 'Yes' : 'No known exploit' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Metadata</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Data Source</span>
                  <span class="text-gray-300">{{ finding.data_source }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Created</span>
                  <span class="text-gray-300">{{ formatDate(finding.created_at) }}</span>
                </div>
                <div v-if="finding.enriched_at" class="flex justify-between">
                  <span class="text-gray-500">Enriched</span>
                  <span class="text-gray-300">{{ formatDate(finding.enriched_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
</template>

<script setup lang="ts">
import type { FindingDetail } from '~/types/api'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { apiGet } = useApi()

const error = ref<string | null>(null)

const { data: finding, refresh, status } = await useAsyncData<FindingDetail>('finding-detail', async () => {
  error.value = null
  const res = await apiGet<FindingDetail>(`/api/v1/findings/${route.params.id}`)
  return res.data
})

const riskScoreColor = computed(() => {
  const score = finding.value?.risk_score
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
