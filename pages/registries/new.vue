<template>
<div class="mx-auto max-w-2xl space-y-6">
      <h1 class="text-2xl font-bold text-white">Add Registry</h1>

      <ErrorAlert v-if="error" :message="error" />

      <form class="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. Production DockerHub"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
          <select
            v-model="form.type"
            required
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="dockerhub">Docker Hub</option>
            <option value="ecr">AWS ECR</option>
            <option value="gcr">Google GCR</option>
            <option value="ghcr">GitHub GHCR</option>
            <option value="gitlab">GitLab Registry</option>
            <option value="acr">Azure ACR</option>
            <option value="generic">Generic (Docker-compatible)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Registry URL</label>
          <input
            v-model="form.url"
            type="text"
            required
            :placeholder="urlPlaceholder"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div class="border-t border-gray-800 pt-5">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">Credentials</h3>

          <template v-if="form.type === 'ecr'">
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">AWS Region</label>
                <input
                  v-model="credentials.region"
                  type="text"
                  placeholder="us-east-1"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">AWS Access Key ID</label>
                <input
                  v-model="credentials.access_key_id"
                  type="text"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">AWS Secret Access Key</label>
                <input
                  v-model="credentials.secret_access_key"
                  type="password"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </template>

          <template v-else-if="form.type === 'gcr'">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Service Account JSON Key</label>
              <textarea
                v-model="credentials.json_key"
                rows="4"
                placeholder="Paste service account JSON key..."
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </template>

          <template v-else-if="form.type === 'dockerhub'">
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Username / Namespace</label>
                <input
                  v-model="credentials.username"
                  type="text"
                  placeholder="your-dockerhub-username"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Password / Token</label>
                <input
                  v-model="credentials.password"
                  type="password"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </template>

          <template v-else-if="form.type === 'ghcr'">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">GitHub Personal Access Token</label>
              <input
                v-model="credentials.github_token"
                type="password"
                placeholder="ghp_..."
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <p class="mt-1 text-xs text-gray-500">Requires <code class="text-gray-400">read:packages</code> scope.</p>
            </div>
          </template>

          <template v-else>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Username</label>
                <input
                  v-model="credentials.username"
                  type="text"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Password / Token</label>
                <input
                  v-model="credentials.password"
                  type="password"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </template>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <NuxtLink
            to="/registries"
            class="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            <span v-if="submitting" class="i-lucide-loader-circle inline-block size-4 animate-spin mr-1" />
            {{ submitting ? 'Connecting...' : 'Add Registry' }}
          </button>
        </div>
      </form>
    </div>
</template>

<script setup lang="ts">
import type { CreateRegistryPayload, RegistryRow } from '~/types/api'


const { apiPost } = useApi()
const toast = useToast()
const router = useRouter()

const error = ref<string | null>(null)
const submitting = ref(false)

const form = ref<CreateRegistryPayload>({
  name: '',
  type: 'dockerhub',
  url: '',
})

const credentials = reactive<Record<string, string>>({
  username: '',
  password: '',
  github_token: '',
  region: '',
  access_key_id: '',
  secret_access_key: '',
  json_key: '',
})

const urlPlaceholder = computed(() => {
  switch (form.value.type) {
    case 'dockerhub': return 'https://index.docker.io/v1/'
    case 'ecr': return '<account-id>.dkr.ecr.<region>.amazonaws.com'
    case 'gcr': return 'gcr.io/your-project'
    case 'ghcr': return 'ghcr.io'
    case 'gitlab': return 'registry.gitlab.com'
    case 'acr': return 'your-registry.azurecr.io'
    default: return 'https://your-registry.example.com'
  }
})

async function handleSubmit() {
  error.value = null
  submitting.value = true

  const creds: Record<string, string> = {}
  for (const [k, v] of Object.entries(credentials)) {
    if (v) creds[k] = v
  }

  // Validate credentials are provided for types that need them
  if (form.value.type !== 'generic' && Object.keys(creds).length === 0) {
    error.value = 'Credentials are required for this registry type'
    submitting.value = false
    return
  }

  const payload = {
    ...form.value,
    credentials: Object.keys(creds).length > 0 ? creds : {},
  }

  try {
    await apiPost<RegistryRow>('/api/v1/registries/', payload as unknown as Record<string, unknown>)
    toast.add({ title: 'Success', description: `Registry '${form.value.name}' added`, color: 'success' })
    router.push('/registries')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create registry'
  } finally {
    submitting.value = false
  }
}
</script>
