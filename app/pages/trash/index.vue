<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'acl'],
  roles: ['super_admin']
})
const { locale, t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { user } = useAlmhaAuth()
const toast = useToast()



// State for Trash API
const page = ref(1)

const { data: response, pending, refresh } = await useAsyncData<any>(
  'trashItems',
  () => useApi<any>('/trash', {
    query: {
      page: page.value,
      per_page: 12
    },
    headers: {
      'Accept-Language': locale.value.split('-')[0] || 'es'
    }
  }),
  { watch: [page, locale] }
)

const items = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || null)

// Actions
const restoringItemId = ref<string|null>(null)
const deletingItemId = ref<string|null>(null)

// Modal Confirmation
const showDeleteConfirm = ref(false)
const itemToDelete = ref<{ id: string|number, type: string } | null>(null)

const confirmDelete = (type: string, id: string|number) => {
  itemToDelete.value = { type, id }
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  itemToDelete.value = null
  showDeleteConfirm.value = false
}

const executeDeletePermanent = async () => {
  if (!itemToDelete.value) return
  deletingItemId.value = String(itemToDelete.value.id)
  try {
    await useApi<any>(`/trash/${itemToDelete.value.type}/${itemToDelete.value.id}/permanent`, {
      method: 'DELETE'
    })
    toast.add({ title: t('trash.success_permanent'), color: 'primary' })
    cancelDelete()
    refresh()
  } catch (e: any) {
    console.error(e)
    toast.add({ title: 'Error', description: e.message || 'Error occurred', color: 'error' })
  } finally {
    deletingItemId.value = null
  }
}

const restoreItem = async (type: string, id: string|number) => {
  restoringItemId.value = String(id)
  try {
    await useApi<any>(`/trash/${type}/${id}/restore`, {
      method: 'POST'
    })
    toast.add({ title: t('trash.success_restore'), color: 'primary' })
    refresh()
  } catch (e: any) {
    console.error(e)
    toast.add({ title: 'Error', description: e.message || 'Error occurred', color: 'error' })
  } finally {
    restoringItemId.value = null
  }
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'blog': return 'i-heroicons-document-text'
    case 'procedure': return 'i-heroicons-sparkles'
    case 'team': return 'i-heroicons-user-group'
    case 'user': return 'i-heroicons-user'
    case 'design': return 'i-heroicons-paint-brush'
    default: return 'i-heroicons-archive-box'
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return t('blogs.date.empty')
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="trash-container">
    <!-- Header -->
    <header class="trash-header">
      <div class="header-info">
        <h1 class="header-title">{{ t('nav.trash') }}</h1>
        <p class="header-desc">{{ t('trash.description') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" @click="() => refresh()" :disabled="pending">
          <UIcon name="i-heroicons-arrow-path" class="icon-lg" :class="{ 'animate-spin': pending }" />
        </button>
      </div>
    </header>

    <!-- Loading Skeleton -->
    <div v-if="pending && !items.length" class="trash-grid">
      <div class="skeleton-card" v-for="i in 4" :key="i"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <UIcon name="i-heroicons-trash" class="empty-icon" />
      </div>
      <h2 class="empty-title">{{ t('trash.empty') }}</h2>
    </div>

    <!-- Data Grid -->
    <div v-else class="trash-grid">
      <div v-for="item in items" :key="`${item.type}-${item.id}`" class="trash-card">
        <div class="card-body">
          <div class="card-icon-wrap">
            <UIcon :name="getIconForType(item.type)" class="card-icon" />
          </div>
          <div class="card-info">
            <h3 class="item-name truncate" :title="item.name">{{ item.name }}</h3>
            <div class="item-meta">
              <span class="meta-tag">{{ t(`trash.types.${item.type}`) || item.type }}</span>
              <span class="spacer">•</span>
              <span class="meta-date">{{ formatDate(item.deletedAt) }}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button 
            class="btn-restore" 
            @click="restoreItem(item.type, item.id)"
            :disabled="restoringItemId === String(item.id) || deletingItemId === String(item.id)"
          >
            <UIcon v-if="restoringItemId === String(item.id)" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
            <UIcon v-else name="i-heroicons-arrow-uturn-left" class="icon-sm" />
            {{ t('trash.restore') }}
          </button>
          
          <button 
            class="btn-delete" 
            @click="confirmDelete(item.type, item.id)"
            :disabled="restoringItemId === String(item.id) || deletingItemId === String(item.id)"
            :title="t('trash.permanent_delete')"
          >
            <UIcon v-if="deletingItemId === String(item.id)" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
            <UIcon v-else name="i-heroicons-trash" class="icon-sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <footer v-if="meta && meta.last_page > 1" class="pagination-footer">
      <div class="pagination">
        <button class="pag-btn" :disabled="page === 1" @click="page--">
          {{ t('blogs.pagination.prev') }}
        </button>
        <span class="pag-info text-sm font-medium text-slate-500 dark:text-slate-400">
          {{ page }} / {{ meta.last_page }}
        </span>
        <button class="pag-btn" :disabled="page === meta.last_page" @click="page++">
          {{ t('blogs.pagination.next') }}
        </button>
      </div>
    </footer>

    <!-- Confirm Permanent Delete Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-box">
            <div class="modal-icon-wrap text-red-500 bg-red-100 dark:bg-red-900/30">
              <UIcon name="i-heroicons-exclamation-triangle" class="modal-icon" />
            </div>
            <h3 class="modal-title font-bold text-xl mt-4 text-slate-800 dark:text-white">
              {{ t('trash.permanent_delete') }}
            </h3>
            <p class="modal-desc text-slate-600 dark:text-slate-400 mt-2">
              {{ t('trash.confirm_permanent') }}
            </p>
            <div class="modal-actions mt-6 flex justify-end gap-3">
              <button class="btn-ghost px-4 py-2 rounded-lg font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" @click="cancelDelete">
                Cancelar
              </button>
              <button class="btn-danger px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 transition-colors" @click="executeDeletePermanent" :disabled="!!deletingItemId">
                <UIcon v-if="deletingItemId" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
                <span v-else>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.trash-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

/* Header */
.trash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

@media (max-width: 640px) {
  .trash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
  .header-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

.header-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.03em;
}

:root.dark .header-title {
  color: #f8fafc;
}

.header-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
}

:root.dark .header-desc {
  color: #94a3b8;
}

.btn-refresh {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

:root.dark .btn-refresh {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.btn-refresh:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

:root.dark .btn-refresh:hover:not(:disabled) {
  background: #334155;
  color: #f8fafc;
  border-color: #475569;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

/* Grid */
.trash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Skeleton */
.skeleton-card {
  height: 140px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

:root.dark .skeleton-card {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 20px;
  border: 1px dashed #cbd5e1;
  text-align: center;
}

:root.dark .empty-state {
  background: #1e293b;
  border-color: #475569;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

:root.dark .empty-icon-wrap {
  background: #334155;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: #94a3b8;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

:root.dark .empty-title {
  color: #f8fafc;
}

/* Trash Card */
.trash-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
}

:root.dark .trash-card {
  background: #1e293b;
  border-color: #334155;
}

.trash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

:root.dark .trash-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  border-color: #475569;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  flex: 1;
}

.card-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

:root.dark .card-icon-wrap {
  background: #0f172a;
  color: #94a3b8;
}

.card-icon {
  width: 24px;
  height: 24px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

:root.dark .item-name {
  color: #f8fafc;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
}

:root.dark .item-meta {
  color: #94a3b8;
}

.meta-tag {
  background: #e2e8f0;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
  color: #475569;
}

:root.dark .meta-tag {
  background: #334155;
  color: #cbd5e1;
}

.spacer {
  color: #cbd5e1;
}

:root.dark .spacer {
  color: #475569;
}

.card-footer {
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

:root.dark .card-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.btn-restore {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #a07c28;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.2s;
}

:root.dark .btn-restore {
  color: #d4af37;
}

.btn-restore:hover:not(:disabled) {
  color: #8b6b22;
}

:root.dark .btn-restore:hover:not(:disabled) {
  color: #fcd555;
}

.btn-restore:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  color: #ef4444;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #fee2e2;
}

:root.dark .btn-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.pagination-footer {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:root.dark .pagination {
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

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:root.dark .modal-box {
  background: #1e293b;
  border: 1px solid #334155;
}

.modal-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-icon {
  width: 24px;
  height: 24px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
