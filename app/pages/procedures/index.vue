<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, watchEffect } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const page = ref(1)
const searchQuery = ref('')
const selectedStatus = ref('')
const isMenuOpen = ref(false)
const debouncedSearch = ref('')
let debounceTimer: any = null

// Debounce para la búsqueda
watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 500)
})

// Reset pagination on status change
watch(selectedStatus, () => {
  page.value = 1
})

interface Procedure {
  id: number | string
  image: string | null
  status: string
  categoryCode: string
  translations: {
    title: string
    subtitle: string
  }[]
  views: number
}

interface ApiResponse {
  data: Procedure[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}

// Fetch de datos reactivo
const { data: response, pending, refresh, error } = await useAsyncData<ApiResponse>(
  'procedures',
  () => useApi<ApiResponse>('/procedures', {
    query: {
      page: page.value,
      per_page: 8,
      search: debouncedSearch.value,
      status: selectedStatus.value
    }
  }),
  {
    watch: [page, debouncedSearch, selectedStatus]
  }
)

const procedures = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || null)

const statusOptions = computed(() => [
  { label: useI18n().t('procedures.toolbar.filters.all'), value: '' },
  { label: useI18n().t('procedures.toolbar.filters.published'), value: 'published' },
  { label: useI18n().t('procedures.toolbar.filters.drafts'), value: 'draft' }
])

const currentStatusLabel = computed(() => {
  const selected = statusOptions.value.find(opt => opt.value === selectedStatus.value)
  return selected ? selected.label : (statusOptions.value[0]?.label || '')
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const selectStatus = (value: string) => {
  selectedStatus.value = value
  isMenuOpen.value = false
}

const closeMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.custom-select')) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'published': return 'status-published'
    case 'draft': return 'status-draft'
    default: return 'status-neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'published': return useI18n().t('procedures.status.published')
    case 'draft': return useI18n().t('procedures.status.draft')
    default: return status
  }
}

const handleRefresh = () => {
  refresh()
}
</script>

<template>
  <div class="procedures-container">
    <!-- Header -->
    <header class="procedures-header">
      <div class="header-info">
        <i18n-t keypath="procedures.header.title" tag="h1" class="header-title">
          <template #content>
            <span class="gold">{{ $t('procedures.header.content') }}</span>
          </template>
        </i18n-t>
        <p class="header-desc">{{ $t('procedures.header.description') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" :disabled="pending" @click="handleRefresh" :title="$t('procedures.header.refresh')">
          <UIcon name="i-heroicons-arrow-path" :class="{ 'animate-spin': pending }" class="icon-md" />
        </button>
        <NuxtLink to="/procedures/create" class="btn-primary">
          <UIcon name="i-heroicons-plus" class="icon-md" />
          <span>{{ $t('procedures.header.newEntry') }}</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="procedures-toolbar">
      <div class="search-wrap">
        <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
        <input v-model="searchQuery" type="text" :placeholder="$t('procedures.toolbar.searchPlaceholder')" class="search-input" />
      </div>
      <div class="filters-wrap">
        <div class="custom-select">
          <button type="button" class="select-trigger" :class="{ 'is-active': isMenuOpen }" @click.stop="toggleMenu">
            <span class="trigger-label">{{ currentStatusLabel }}</span>
            <UIcon name="i-heroicons-chevron-down" class="select-chevron" :class="{ 'is-rotated': isMenuOpen }" />
          </button>

          <Transition name="fade-scale">
            <div v-if="isMenuOpen" class="select-menu">
              <button v-for="option in statusOptions" :key="option.value" type="button" class="menu-item" :class="{ 'is-selected': selectedStatus === option.value }" @click="selectStatus(option.value)">
                <span class="item-label">{{ option.label }}</span>
                <UIcon v-if="selectedStatus === option.value" name="i-heroicons-check" class="item-check" />
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="pending && !procedures.length" class="procedures-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card"></div>
    </div>

    <div v-else-if="procedures.length" class="procedures-grid">
      <article v-for="proc in procedures" :key="proc.id" class="modern-card">
        <div class="card-image">
          <img v-if="proc.image" :src="proc.image" alt="Portada" />
          <div v-else class="img-fallback">
            <UIcon name="i-heroicons-sparkles" class="icon-xl" />
          </div>
          <div class="card-status" :class="getStatusClass(proc.status)">
            {{ getStatusLabel(proc.status) }}
          </div>
        </div>

        <div class="card-body">
          <div class="card-meta">
            <span class="cat">{{ proc.categoryCode }}</span>
            <span class="spacer">•</span>
            <span class="views">
              <UIcon name="i-heroicons-eye" class="icon-xs inline-block mr-1" />
              {{ proc.views }}
            </span>
          </div>

          <h2 class="card-title">{{ proc.translations?.[0]?.title || $t('procedures.card.noTitle') }}</h2>
          <p class="card-subtitle">{{ proc.translations?.[0]?.subtitle || '' }}</p>

          <footer class="card-footer">
            <div class="card-actions">
              <NuxtLink :to="`/procedures/${proc.id}/edit`" class="action-btn edit" :title="$t('procedures.card.actions.edit')">
                <UIcon name="i-heroicons-pencil-square" class="icon-sm" />
              </NuxtLink>
              <button class="action-btn delete" :title="$t('procedures.card.actions.delete')">
                <UIcon name="i-heroicons-trash" class="icon-sm" />
              </button>
            </div>
          </footer>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <div class="empty-box">
        <UIcon name="i-heroicons-sparkles" class="icon-empty" />
        <h3>{{ $t('procedures.empty.title') }}</h3>
        <p>{{ $t('procedures.empty.description') }}</p>
        <div class="mt-8 flex justify-center">
          <NuxtLink to="/procedures/create" class="btn-primary">{{ $t('procedures.empty.action') }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer v-if="meta && meta.last_page > 1" class="procedures-footer">
      <div class="page-info">
        <i18n-t keypath="procedures.pagination.info" tag="span">
          <template #current>
            <strong>{{ meta.current_page }}</strong>
          </template>
          <template #total>
            <strong>{{ meta.last_page }}</strong>
          </template>
        </i18n-t>
      </div>
      <div class="pagination">
        <button class="pag-btn" :disabled="page === 1" @click="page--">
          {{ $t('procedures.pagination.prev') }}
        </button>
        <button class="pag-btn" :disabled="page === meta.last_page" @click="page++">
          {{ $t('procedures.pagination.next') }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.procedures-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

/* Header Styles */
.procedures-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.03em;
  transition: color 0.3s;
}

:root.dark .header-title {
  color: #f8fafc;
}

.header-title .gold {
  color: #a07c28;
}

:root.dark .header-title .gold {
  color: #d4af37;
}

.header-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  transition: color 0.3s;
}

:root.dark .header-desc {
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
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

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #a07c28;
  color: white;
  padding: 0 1.5rem;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(160, 124, 40, 0.2);
  transition: transform 0.2s, background 0.3s, box-shadow 0.2s;
}

:root.dark .btn-primary {
  background: #a07c28;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  background: #8b6b22;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(160, 124, 40, 0.25);
}

:root.dark .btn-primary:hover {
  background: #b89235;
}

/* Toolbar */
.procedures-toolbar {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .procedures-toolbar {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  transition: all 0.3s;
}

:root.dark .search-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.search-input:focus {
  border-color: #a07c28;
  background: white;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

:root.dark .search-input:focus {
  background: #0f172a;
  border-color: #a07c28;
}

.custom-select {
  position: relative;
  display: inline-block;
  min-width: 180px;
}

.select-trigger {
  width: 100%;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

:root.dark .select-trigger {
  background: #0f172a;
  border-color: #334155;
}

.trigger-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  transition: color 0.3s;
}

:root.dark .trigger-label {
  color: #f8fafc;
}

.select-trigger:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

:root.dark .select-trigger:hover {
  background: #1e293b;
  border-color: #475569;
}

.select-trigger.is-active,
.select-trigger:focus {
  outline: none;
  border-color: #a07c28;
  background: white;
  box-shadow: 0 0 0 4px rgba(160, 124, 40, 0.1);
}

:root.dark .select-trigger.is-active,
:root.dark .select-trigger:focus {
  background: #0f172a;
}

.select-chevron {
  color: #94a3b8;
  width: 18px;
  height: 18px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s;
}

.select-chevron.is-rotated {
  transform: rotate(180deg);
  color: #a07c28;
}

/* Floating Menu */
.select-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  z-index: 100;
  overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .select-menu {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}

.menu-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  transition: color 0.2s;
}

:root.dark .item-label {
  color: #94a3b8;
}

.menu-item:hover {
  background: #f1f5f9;
}

:root.dark .menu-item:hover {
  background: #334155;
}

.menu-item:hover .item-label {
  color: #1e293b;
}

:root.dark .menu-item:hover .item-label {
  color: #f8fafc;
}

.menu-item.is-selected {
  background: rgba(160, 124, 40, 0.08);
}

.menu-item.is-selected .item-label {
  color: #a07c28;
  font-weight: 700;
}

.item-check {
  color: #a07c28;
  width: 18px;
  height: 18px;
}

/* Animations */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Grid Layout */
.procedures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
}

/* Card Design */
.modern-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .modern-card {
  background: #1e293b;
  border-color: #334155;
}

.modern-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  border-color: #a07c2833;
}

:root.dark .modern-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  border-color: #a07c2866;
}

.card-image {
  height: 230px;
  position: relative;
  background: #f1f5f9;
  overflow: hidden;
  transition: background 0.3s;
}

:root.dark .card-image {
  background: #0f172a;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.modern-card:hover .card-image img {
  transform: scale(1.05);
}

.img-fallback {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
}

:root.dark .img-fallback {
  color: #334155;
}

.card-status {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  padding: 0.45rem 0.9rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.status-published {
  background: #10b981;
  color: white;
}

.status-draft {
  background: #64748b;
  color: white;
}

.status-neutral {
  background: #f1f5f9;
  color: #64748b;
}

.card-body {
  padding: 1.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-meta {
  font-size: 0.8rem;
  font-weight: 700;
  color: #a07c28;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

:root.dark .card-meta {
  color: #d4af37;
}

.card-meta .views {
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.35;
  color: #1e293b;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 3.78rem; 
  transition: color 0.2s;
}

:root.dark .card-title {
  color: #f8fafc;
}

.modern-card:hover .card-title {
  color: #a07c28;
}

:root.dark .modern-card:hover .card-title {
  color: #d4af37;
}

.card-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.85rem;
}

:root.dark .card-subtitle {
  color: #94a3b8;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  transition: border-color 0.3s;
  margin-top: auto;
}

:root.dark .card-footer {
  border-top-color: #334155;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  padding: 0;
}

:root.dark .action-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.action-btn:hover {
  background: white;
  color: #1e293b;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

:root.dark .action-btn:hover {
  background: #334155;
  color: #f8fafc;
}

.action-btn.delete:hover {
  color: #ef4444;
  border-color: #fee2e2;
  background: #fffafa;
}

:root.dark .action-btn.delete:hover {
  background: #450a0a;
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 24px;
  padding: 6rem 2rem;
  border: 2px dashed #e2e8f0;
  display: flex;
  justify-content: center;
  transition: all 0.3s;
}

:root.dark .empty-state {
  background: #1e293b;
  border-color: #334155;
}

.empty-box {
  text-align: center;
  max-width: 350px;
}

.icon-empty {
  width: 4.5rem;
  height: 4.5rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
}

.empty-box h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: #1e293b;
  transition: color 0.3s;
}

:root.dark .empty-box h3 {
  color: #f8fafc;
}

.empty-box p {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

/* Footer / Pagination */
.procedures-footer {
  margin-top: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.25rem 2rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

:root.dark .procedures-footer {
  background: #1e293b;
  border-color: #334155;
}

.page-info {
  font-size: 0.95rem;
  color: #64748b;
}

.pagination {
  display: flex;
  gap: 0.75rem;
}

.pag-btn {
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

:root.dark .pag-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.pag-btn:hover:not(:disabled) {
  background: white;
  border-color: #a07c28;
  color: #a07c28;
}

:root.dark .pag-btn:hover:not(:disabled) {
  background: #334155;
  color: #f8fafc;
}

.pag-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Icons sizing */
.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 22px;
  height: 22px;
}

.icon-lg {
  width: 26px;
  height: 26px;
}

.icon-xl {
  width: 44px;
  height: 44px;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

/* Skeleton */
.skeleton-card {
  height: 480px;
  background: #f1f5f9;
  border-radius: 24px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transition: background 0.3s;
}

:root.dark .skeleton-card {
  background: #334155;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}

@media (max-width: 768px) {
  .procedures-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .procedures-toolbar {
    flex-direction: column;
  }
  .custom-select {
    width: 100%;
  }
  .procedures-footer {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
}
</style>
