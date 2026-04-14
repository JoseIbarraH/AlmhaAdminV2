<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

definePageMeta({
  middleware: ['auth']
})

interface TrashItem {
  id: string | number
  name: string
  type: string
  deleted_at: string
}

const items = ref<TrashItem[]>([])
const isLoading = ref(true)
const page = ref(1)
const totalItems = ref(0)

const columns = [
  { accessorKey: 'name', label: t('trash.name') },
  { accessorKey: 'type', label: t('trash.type') },
  { accessorKey: 'deleted_at', label: t('trash.deleted_at') },
  { accessorKey: 'actions', label: t('trash.actions') }
]

async function fetchTrash() {
  isLoading.value = true
  try {
    const response = await $fetch<any>(`/api/v1/trash?page=${page.value}`)
    items.value = response.data
    totalItems.value = response.meta.total
  } catch (error) {
    console.error('Error fetching trash', error)
  } finally {
    isLoading.value = false
  }
}

async function restoreItem(type: string, id: string | number) {
  try {
    await $fetch(`/api/v1/trash/${type}/${id}/restore`, { method: 'POST' })
    toast.add({ title: t('trash.success_restore'), color: 'success' })
    fetchTrash()
  } catch (error) {
    toast.add({ title: 'Error', color: 'error' })
  }
}

async function deletePermanently(type: string, id: string | number) {
  if (!confirm(t('trash.confirm_permanent'))) return
  
  try {
    await $fetch(`/api/v1/trash/${type}/${id}/permanent`, { method: 'DELETE' })
    toast.add({ title: t('trash.success_permanent'), color: 'success' })
    fetchTrash()
  } catch (error) {
    toast.add({ title: 'Error', color: 'error' })
  }
}

onMounted(fetchTrash)
</script>

<template>
  <div class="trash-page py-6 px-4 space-y-8">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
          <UIcon name="i-heroicons-trash" class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-3x font-black text-slate-900 dark:text-white tracking-tight">{{ t('trash.title') }}</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium">{{ t('trash.description') }}</p>
        </div>
      </div>
    </header>

    <!-- Table Card -->
    <UCard class="premium-table-card overflow-hidden" :ui="{ body: 'p-0' }">
      <UTable :data="items" :columns="columns" :loading="isLoading" class="w-full">
        <!-- Type Column -->
        <template #type-data="{ row }">
          <UBadge variant="soft" color="neutral" size="sm" class="font-bold px-3 py-1 rounded-lg">
            {{ t(`trash.types.${row.original.type}`) }}
          </UBadge>
        </template>

        <!-- Deleted At Column -->
        <template #deleted_at-data="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-slate-700 dark:text-slate-300">
              {{ row.original.deleted_at ? new Date(row.original.deleted_at).toLocaleDateString() : '-' }}
            </span>
            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
              {{ row.original.deleted_at ? new Date(row.original.deleted_at).toLocaleTimeString() : '' }}
            </span>
          </div>
        </template>

        <!-- Actions Column -->
        <template #actions-data="{ row }">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-heroicons-arrow-path"
              size="md"
              color="primary"
              variant="soft"
              class="rounded-xl shadow-sm hover:-translate-y-px transition-transform"
              @click="restoreItem(row.original.type, row.original.id)"
            >
              {{ t('trash.restore') }}
            </UButton>
            <UButton
              icon="i-heroicons-x-mark"
              size="md"
              color="error"
              variant="ghost"
              class="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10"
              @click="deletePermanently(row.original.type, row.original.id)"
            >
              {{ t('trash.permanent_delete') }}
            </UButton>
          </div>
        </template>

        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-24 text-center">
            <div class="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
              <UIcon name="i-heroicons-archive-box-x-mark" class="w-10 h-10 text-slate-200 dark:text-slate-700" />
            </div>
            <h3 class="text-lg font-bold text-slate-400 mb-1">{{ t('trash.empty') }}</h3>
            <p class="text-sm text-slate-300 max-w-xs">No hay registros eliminados en este momento.</p>
          </div>
        </template>
      </UTable>

      <!-- Pagination Support -->
      <template v-if="totalItems > 15" #footer>
        <div class="flex justify-center p-4 border-t border-slate-50 dark:border-slate-800">
          <UPagination v-model="page" :total="totalItems" :page-count="15" @update:model-value="fetchTrash" />
        </div>
      </template>
    </UCard>
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
</style>
