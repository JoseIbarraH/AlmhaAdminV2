<script setup lang="ts">
import { ref, watch, computed } from 'vue'

definePageMeta({
  middleware: ['auth', 'acl'],
  roles: ['super_admin']
})

const { locale, t } = useI18n({ useScope: 'global' })

const page = ref(1)
const searchQuery = ref('')
const debouncedSearch = ref('')
let debounceTimer: any = null

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 500)
})

interface AuditRecord {
  id: number
  user_id: number | null
  action: string
  method: string
  url: string
  payload: any
  response_status: number
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
}

// Fetch audits
const { data: response, pending, refresh } = await useAsyncData<any>(
  'audits_list',
  () => useApi<any>('/audits', {
    query: {
      page: page.value,
      per_page: 20,
    },
    headers: {
      'Accept-Language': locale.value.split('-')[0] || 'es'
    }
  }),
  { watch: [page, debouncedSearch, locale] }
)

const audits = computed<AuditRecord[]>(() => response.value?.data || response.value?.original?.data || [])
const meta = computed(() => response.value?.meta || response.value?.original?.meta || null)

// Filtered audits by local search
const filteredAudits = computed(() => {
  if (!debouncedSearch.value) return audits.value
  const q = debouncedSearch.value.toLowerCase()
  return audits.value.filter((a: AuditRecord) =>
    a.url?.toLowerCase().includes(q) ||
    a.action?.toLowerCase().includes(q) ||
    a.method?.toLowerCase().includes(q) ||
    a.ip_address?.toLowerCase().includes(q)
  )
})

// Columns configuration for UTable
const columns = computed(() => [
  { accessorKey: 'user_id', header: t('audits.table.user') },
  { accessorKey: 'user_name', header: t('audits.table.user_name') },
  { accessorKey: 'method', header: t('audits.table.method') },
  { accessorKey: 'url', header: t('audits.table.url') },
  { accessorKey: 'response_status', header: t('audits.table.status') },
  { accessorKey: 'ip_address', header: t('audits.table.ip') },
  { accessorKey: 'created_at', header: t('audits.table.date') },
  { accessorKey: 'details', header: t('audits.table.details') }
])

// Detail modal
const isDetailOpen = ref(false)
const selectedAudit = ref<AuditRecord | null>(null)

const openDetail = (audit: AuditRecord) => {
  selectedAudit.value = audit
  isDetailOpen.value = true
}

// Method color helper
const methodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'error'
  }
  return colors[method] || 'neutral'
}

// Status color helper
const statusColor = (status: number): string => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'info'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
}

// Date formatter
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString(locale.value === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Payload formatter
const formattedPayload = computed(() => {
  if (!selectedAudit.value?.payload) return null
  try {
    if (typeof selectedAudit.value.payload === 'string') {
      return JSON.stringify(JSON.parse(selectedAudit.value.payload), null, 2)
    }
    return JSON.stringify(selectedAudit.value.payload, null, 2)
  } catch {
    return String(selectedAudit.value.payload)
  }
})
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ t('audits.title') }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium">
          {{ t('audits.description') }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton color="neutral" variant="solid"
          class="rounded-xl shadow-sm border border-slate-200 dark:border-slate-800" :disabled="pending"
          @click="refresh()">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" :class="{ 'animate-spin': pending }" />
        </UButton>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="flex items-center w-full max-w-sm mb-4">
      <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" size="lg" color="neutral"
        class="w-full shadow-sm rounded-xl" :placeholder="t('audits.search')" :trailing="false" />
    </div>

    <!-- Audit Table -->
    <UCard class="premium-table-card overflow-hidden" :ui="{ body: 'p-0 sm:p-0 border-none' }">
      <UTable :data="filteredAudits" :columns="columns" :loading="pending" class="w-full" :ui="{ thead: 'bg-slate-50 dark:bg-slate-900/50' }">

        <!-- User ID -->
        <template #user_id-cell="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-slate-400" />
            </div>
            <span class="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              #{{ (row.original as any).user_id || '—' }}
            </span>
          </div>
        </template>

        <!-- User Name -->
        <template #user_name-cell="{ row }">
          <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {{ (row.original as any).user?.name || 'Sistema' }}
          </span>
        </template>

        <!-- Method Badge -->
        <template #method-cell="{ row }">
          <UBadge :color="(methodColor((row.original as any).method) as any)" variant="subtle" size="xs"
            class="font-black uppercase tracking-widest text-[10px] px-2 py-0.5">
            {{ (row.original as any).method }}
          </UBadge>
        </template>

        <!-- URL (truncated) -->
        <template #url-cell="{ row }">
          <span class="text-xs font-mono text-slate-600 dark:text-slate-300 max-w-[280px] truncate block"
            :title="(row.original as any).url">
            {{ (row.original as any).url }}
          </span>
        </template>

        <!-- Response Status -->
        <template #response_status-cell="{ row }">
          <UBadge :color="(statusColor((row.original as any).response_status) as any)" variant="soft" size="sm"
            class="font-bold tabular-nums">
            {{ (row.original as any).response_status }}
          </UBadge>
        </template>

        <!-- IP Address -->
        <template #ip_address-cell="{ row }">
          <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
            {{ (row.original as any).ip_address || '—' }}
          </span>
        </template>

        <!-- Date -->
        <template #created_at-cell="{ row }">
          <span class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {{ formatDate((row.original as any).created_at) }}
          </span>
        </template>

        <!-- Details Button -->
        <template #details-cell="{ row }">
          <UButton icon="i-heroicons-eye" size="xs" color="neutral" variant="ghost"
            class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="openDetail(row.original as any)" />
        </template>

        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 class="text-slate-500 font-bold">{{ t('audits.empty') }}</h3>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Pagination -->
    <footer v-if="meta && meta.last_page > 1" class="flex justify-center mt-6">
      <div class="pagination-bar">
        <button class="pag-btn" :disabled="page === 1" @click="page--">
          ← {{ t('audits.table.details') === 'Details' ? 'Previous' : 'Anterior' }}
        </button>
        <span class="text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {{ page }} / {{ meta.last_page }}
        </span>
        <button class="pag-btn" :disabled="page === meta.last_page" @click="page++">
          {{ t('audits.table.details') === 'Details' ? 'Next' : 'Siguiente' }} →
        </button>
      </div>
    </footer>

    <!-- Detail Modal -->
    <UModal v-model:open="isDetailOpen">
      <template #content>
        <UCard :ui="{ body: 'p-6 sm:p-8' }">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-document-magnifying-glass" class="w-5 h-5" />
                </div>
                <h3 class="text-lg font-black text-slate-900 dark:text-white">
                  {{ t('audits.detail.title') }}
                </h3>
              </div>
              <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                @click="isDetailOpen = false" />
            </div>
          </template>

          <div v-if="selectedAudit" class="space-y-5">
            <!-- Summary Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.user') }}</p>
                <p class="font-semibold text-slate-800 dark:text-white text-sm">#{{ selectedAudit.user_id || '—' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.method') }}</p>
                <UBadge :color="(methodColor(selectedAudit.method) as any)" variant="subtle" size="xs" class="font-black uppercase">
                  {{ selectedAudit.method }}
                </UBadge>
              </div>
              <div class="space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.status') }}</p>
                <UBadge :color="(statusColor(selectedAudit.response_status) as any)" variant="soft" size="sm" class="font-bold tabular-nums">
                  {{ selectedAudit.response_status }}
                </UBadge>
              </div>
              <div class="space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.ip') }}</p>
                <p class="font-mono text-sm text-slate-600 dark:text-slate-300">{{ selectedAudit.ip_address || '—' }}</p>
              </div>
              <div class="col-span-2 space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.url') }}</p>
                <p class="font-mono text-sm text-slate-600 dark:text-slate-300 break-all">{{ selectedAudit.url }}</p>
              </div>
              <div class="col-span-2 space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.table.date') }}</p>
                <p class="text-sm text-slate-600 dark:text-slate-300">{{ formatDate(selectedAudit.created_at) }}</p>
              </div>
              <div class="col-span-2 space-y-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.detail.user_agent') }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 break-all leading-relaxed">{{ selectedAudit.user_agent || '—' }}</p>
              </div>
            </div>

            <!-- Payload -->
            <div class="space-y-2">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">{{ t('audits.detail.payload') }}</p>
              <div v-if="formattedPayload" class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 max-h-[320px] overflow-auto border border-slate-200 dark:border-slate-700">
                <pre class="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">{{ formattedPayload }}</pre>
              </div>
              <p v-else class="text-sm text-slate-400 italic">{{ t('audits.detail.no_payload') }}</p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end">
              <UButton variant="ghost" color="neutral" @click="isDetailOpen = false">
                {{ t('audits.detail.close') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.premium-table-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

:root.dark .premium-table-card {
  background: #1e293b;
  border-color: #334155;
}

:deep(thead) {
  background-color: #f8fafc;
}

:root.dark :deep(thead) {
  background-color: #0f172a;
}

:deep(th) {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  padding: 1rem 1.5rem;
}

:deep(td) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

:root.dark :deep(td) {
  border-bottom-color: #334155;
}

.pagination-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:root.dark .pagination-bar {
  background: #1e293b;
  border-color: #334155;
}

.pag-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

:root.dark .pag-btn {
  background: #0f172a;
  color: #94a3b8;
}

.pag-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

:root.dark .pag-btn:hover:not(:disabled) {
  background: #334155;
  color: #f8fafc;
}

.pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
