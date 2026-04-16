<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
  middleware: ['auth', 'acl'],
  roles: ['team_manager']
})

const page = ref(1)
const searchQuery = ref('')
const selectedStatus = ref('')
const isMenuOpen = ref(false)
const debouncedSearch = ref('')
const deletingId = ref<number | string | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | string | null>(null)
const deleteTargetName = ref('')
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

interface TeamMember {
  id: number | string
  userId: string | null
  slug: string | null
  name: string
  status: string
  image: string | null
  translations: {
    id: number
    lang: string
    specialization: string | null
    description: string | null
    biography: string | null
  }[]
  images: {
    id: number
    path: string
    order: number
  }[]
}

interface ApiResponse {
  data: TeamMember[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}

const { locale, t } = useI18n({ useScope: 'global' })

const statusOptions = computed(() => [
  { label: t('teams.toolbar.filters.all'), value: '' },
  { label: t('teams.toolbar.filters.active'), value: 'active' },
  { label: t('teams.toolbar.filters.inactive'), value: 'inactive' }
])

const currentStatusLabel = computed(() => {
  const selected = statusOptions.value.find(opt => opt.value === selectedStatus.value)
  return selected ? selected.label : (statusOptions.value[0]?.label || '')
})

// Fetch de datos reactivo
const { data: response, pending, refresh, error } = await useAsyncData<ApiResponse>(
  'teams',
  () => useApi<ApiResponse>('/teams', {
    query: {
      page: page.value,
      per_page: 8,
      search: debouncedSearch.value,
      status: selectedStatus.value
    },
    headers: {
      'Accept-Language': locale.value.split('-')[0] || 'es'
    }
  }),
  {
    watch: [page, debouncedSearch, selectedStatus, locale]
  }
)

const teams = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || null)

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
    case 'active': return 'status-active'
    case 'inactive': return 'status-inactive'
    default: return 'status-neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return t('teams.status.active')
    case 'inactive': return t('teams.status.inactive')
    default: return status
  }
}

const getSpecialization = (member: TeamMember) => {
  if (member.translations?.length) {
    return member.translations[0]?.specialization || ''
  }
  return ''
}

const getDescription = (member: TeamMember) => {
  if (member.translations?.length) {
    return member.translations[0]?.description || ''
  }
  return ''
}

const handleRefresh = () => {
  refresh()
}

// Delete
const confirmDelete = (member: TeamMember) => {
  deleteTargetId.value = member.id
  deleteTargetName.value = member.name
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
  deleteTargetName.value = ''
}

const executeDelete = async () => {
  if (!deleteTargetId.value) return
  deletingId.value = deleteTargetId.value
  try {
    await useApi(`/teams/${deleteTargetId.value}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    deleteTargetName.value = ''
    refresh()
  } catch (e) {
    console.error('Delete error:', e)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="teams-container">
    <!-- Header -->
    <header class="teams-header">
      <div class="header-info">
        <i18n-t keypath="teams.header.title" tag="h1" class="header-title" scope="global">
          <template #content>
            <span class="gold">{{ $t('teams.header.content') }}</span>
          </template>
        </i18n-t>
        <p class="header-desc">{{ $t('teams.header.description') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" :disabled="pending" @click="handleRefresh" :title="$t('teams.header.refresh')">
          <UIcon name="i-heroicons-arrow-path" :class="{ 'animate-spin': pending }" class="icon-md" />
        </button>
        <NuxtLink to="/teams/create" class="btn-primary">
          <UIcon name="i-heroicons-plus" class="icon-md" />
          <span>{{ $t('teams.header.newEntry') }}</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="teams-toolbar">
      <div class="search-wrap">
        <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
        <input v-model="searchQuery" type="text" :placeholder="$t('teams.toolbar.searchPlaceholder')" class="search-input" />
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
    <div v-if="pending && !teams.length" class="teams-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card"></div>
    </div>

    <div v-else-if="teams.length" class="teams-grid">
      <article v-for="member in teams" :key="member.id" class="team-card">
        <!-- Avatar Area -->
        <div class="card-avatar-area">
          <div class="avatar-ring">
            <img v-if="member.image" :src="member.image" :alt="member.name" class="avatar-img" />
            <div v-else class="avatar-fallback">
              <UIcon name="i-heroicons-user" class="icon-avatar" />
            </div>
          </div>
          <div class="card-status-badge" :class="getStatusClass(member.status)">
            {{ getStatusLabel(member.status) }}
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <h2 class="card-name">{{ member.name }}</h2>
          <p v-if="getSpecialization(member)" class="card-specialty">
            <UIcon name="i-heroicons-academic-cap" class="icon-xs" />
            {{ getSpecialization(member) }}
          </p>
          <p v-else class="card-specialty card-specialty--empty">
            <UIcon name="i-heroicons-academic-cap" class="icon-xs" />
            {{ $t('teams.card.noSpecialty') }}
          </p>

          <p class="card-desc">{{ getDescription(member) || $t('teams.card.noDescription') }}</p>

          <footer class="card-footer">
            <div class="card-actions">
              <NuxtLink :to="`/teams/${member.id}/edit`" class="action-btn edit" :title="$t('teams.card.actions.edit')">
                <UIcon name="i-heroicons-pencil-square" class="icon-sm" />
              </NuxtLink>
              <button class="action-btn delete" :title="$t('teams.card.actions.delete')" @click="confirmDelete(member)" :disabled="deletingId === member.id">
                <UIcon v-if="deletingId !== member.id" name="i-heroicons-trash" class="icon-sm" />
                <UIcon v-else name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
              </button>
            </div>
            <div class="card-gallery-info" v-if="member.images?.length">
              <UIcon name="i-heroicons-photo" class="icon-xs" />
              <span>{{ member.images.length }}</span>
            </div>
          </footer>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <div class="empty-box">
        <UIcon name="i-heroicons-user-group" class="icon-empty" />
        <h3>{{ $t('teams.empty.title') }}</h3>
        <p>{{ $t('teams.empty.description') }}</p>
        <div class="mt-8 flex justify-center">
          <NuxtLink to="/teams/create" class="btn-primary">{{ $t('teams.empty.action') }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Footer / Pagination -->
    <footer v-if="meta && meta.last_page > 1" class="teams-footer">
      <div class="page-info">
        <i18n-t keypath="teams.pagination.info" tag="span" scope="global">
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
          {{ $t('teams.pagination.prev') }}
        </button>
        <button class="pag-btn" :disabled="page === meta.last_page" @click="page++">
          {{ $t('teams.pagination.next') }}
        </button>
      </div>
    </footer>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-box">
            <div class="modal-icon-wrap">
              <UIcon name="i-heroicons-exclamation-triangle" class="modal-icon" />
            </div>
            <h3 class="modal-title">{{ $t('teams.delete.title') }}</h3>
            <p class="modal-desc">
              {{ $t('teams.delete.description', { name: deleteTargetName }) }}
            </p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="cancelDelete">{{ $t('teams.delete.cancel') }}</button>
              <button class="btn-danger" @click="executeDelete" :disabled="!!deletingId">
                <UIcon v-if="deletingId" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
                <span v-else>{{ $t('teams.delete.confirm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.teams-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

/* Header Styles */
.teams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

@media (max-width: 640px) {
  .teams-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
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
.teams-toolbar {
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

@media (max-width: 640px) {
  .teams-toolbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .search-wrap {
    width: 100%;
  }
  .filters-wrap {
    width: 100%;
    display: flex;
  }
  .custom-select {
    width: 100%;
  }
}

:root.dark .teams-toolbar {
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
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

/* Team Card - Unique vertical profile style */
.team-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .team-card {
  background: #1e293b;
  border-color: #334155;
}

.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  border-color: #a07c2833;
}

:root.dark .team-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  border-color: #a07c2866;
}

/* Avatar Area */
.card-avatar-area {
  width: 100%;
  padding: 2rem 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  background: linear-gradient(135deg, rgba(160,124,40,0.06) 0%, rgba(160,124,40,0.02) 100%);
  transition: background 0.3s;
}

:root.dark .card-avatar-area {
  background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%);
}

.avatar-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, #a07c28, #d4af37, #a07c28);
  margin-bottom: 1rem;
  box-shadow: 0 8px 24px rgba(160,124,40,0.15);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s;
}

.team-card:hover .avatar-ring {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(160,124,40,0.25);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  transition: border-color 0.3s;
}

:root.dark .avatar-img {
  border-color: #1e293b;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f8fafc;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .avatar-fallback {
  background: #0f172a;
  border-color: #1e293b;
  color: #334155;
}

.icon-avatar {
  width: 40px;
  height: 40px;
}

.card-status-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: -0.75rem;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-active {
  background: #10b981;
  color: white;
}

.status-inactive {
  background: #64748b;
  color: white;
}

.status-neutral {
  background: #f1f5f9;
  color: #64748b;
}

/* Card Body */
.card-body {
  padding: 1.75rem;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.card-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.35rem;
  transition: color 0.2s;
}

:root.dark .card-name {
  color: #f8fafc;
}

.team-card:hover .card-name {
  color: #a07c28;
}

:root.dark .team-card:hover .card-name {
  color: #d4af37;
}

.card-specialty {
  font-size: 0.85rem;
  font-weight: 600;
  color: #a07c28;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 0.75rem;
}

:root.dark .card-specialty {
  color: #d4af37;
}

.card-specialty--empty {
  color: #94a3b8;
  font-style: italic;
  font-weight: 400;
}

:root.dark .card-specialty--empty {
  color: #475569;
}

.card-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: auto;
  padding-bottom: 1.25rem;
}

:root.dark .card-desc {
  color: #94a3b8;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  transition: border-color 0.3s;
}

:root.dark .card-footer {
  border-top-color: #334155;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.action-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
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
  border-color: #7f1d1d;
}

.card-gallery-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
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
.teams-footer {
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

:root.dark .teams-footer {
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

/* Delete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  transition: background 0.3s;
}

:root.dark .modal-box {
  background: #1e293b;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

:root.dark .modal-icon-wrap {
  background: #450a0a;
}

.modal-icon {
  width: 30px;
  height: 30px;
  color: #ef4444;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

:root.dark .modal-title {
  color: #f8fafc;
}

.modal-desc {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.5;
}

:root.dark .modal-desc {
  color: #94a3b8;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-cancel {
  height: 44px;
  padding: 0 1.5rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

:root.dark .btn-cancel {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.btn-cancel:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

:root.dark .btn-cancel:hover {
  background: #334155;
  color: #f8fafc;
}

.btn-danger {
  height: 44px;
  padding: 0 1.5rem;
  border-radius: 12px;
  background: #ef4444;
  border: none;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Icons sizing */
.icon-xs {
  width: 16px;
  height: 16px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 22px;
  height: 22px;
}

.icon-xl {
  width: 44px;
  height: 44px;
}

/* Skeleton */
.skeleton-card {
  height: 420px;
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
  .teams-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .teams-toolbar {
    flex-direction: column;
  }

  .custom-select {
    width: 100%;
  }

  .teams-footer {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
}
</style>
