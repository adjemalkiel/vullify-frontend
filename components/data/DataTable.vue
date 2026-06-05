<template>
  <div class="overflow-x-auto rounded-xl border border-gray-800">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-800 bg-gray-900/50">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
            :class="{ 'cursor-pointer select-none hover:text-gray-200': col.sortable }"
            @click="col.sortable && $emit('sort', col.key)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <span
                v-if="col.sortable && sort?.column === col.key"
                class="i-lucide-chevron-up block size-3 transition-transform"
                :class="sort?.direction === 'desc' && 'rotate-180'"
              />
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="i in skeletonRows" :key="'sk-' + i">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3">
              <div class="h-4 rounded bg-gray-800 animate-pulse" :style="{ width: `${40 + Math.random() * 50}%` }" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length === 0">
          <tr>
            <td :colspan="columns.length" class="px-4 py-12 text-center text-sm text-gray-500">
              {{ emptyMessage || 'No data' }}
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="(row, i) in rows"
            :key="(row as any).id || i"
            class="border-b border-gray-800/50 transition-colors"
            :class="clickable ? 'cursor-pointer hover:bg-gray-800/40' : 'hover:bg-gray-800/20'"
            @click="clickable && $emit('rowClick', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-gray-300"
            >
              <slot :name="'cell-' + col.key" :row="row" :value="(row as any)[col.key]">
                {{ (row as any)[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
}

defineProps<{
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  loading?: boolean
  emptyMessage?: string
  sort?: { column: string; direction: 'asc' | 'desc' }
  clickable?: boolean
}>()

defineEmits<{
  sort: [column: string]
  rowClick: [row: Record<string, unknown>]
}>()

const skeletonRows = 5
</script>
