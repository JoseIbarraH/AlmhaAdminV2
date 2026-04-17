<script setup lang="ts">
const { t, locale } = useI18n({ useScope: 'global' })

interface DesignTranslation {
  id: number
  lang: string
  title: string | null
  subtitle: string | null
}

interface DesignItem {
  id: number
  design_id: number
  media_type: string
  media_path: string | null
  url: string | null
  order: number
  status: string
  title: string | null
  subtitle: string | null
  translations: DesignTranslation[]
}

interface Design {
  id: number
  key: string
  display_mode: string
  status: string
  items: DesignItem[]
}

interface ApiResponse {
  success: boolean
  data: Design[]
}

const { data: response, pending, refresh } = await useAsyncData<ApiResponse>(
  'designs',
  () => useApi<ApiResponse>('/designs', {
    headers: {
      'Accept-Language': locale.value.split('-')[0] || 'es'
    }
  }),
  { watch: [locale] }
)

const designs = computed(() => response.value?.data || [])

// Status toggle
const togglingId = ref<number | null>(null)

const toggleDesignStatus = async (design: Design) => {
  togglingId.value = design.id
  const newStatus = design.status === 'active' ? 'inactive' : 'active'
  try {
    await useApi(`/designs/${design.id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    await refresh()
  } catch (e) {
    console.error('Toggle status error:', e)
  } finally {
    togglingId.value = null
  }
}

// Item status toggle
const togglingItemId = ref<number | null>(null)

const toggleItemStatus = async (item: DesignItem) => {
  togglingItemId.value = item.id
  const newStatus = item.status === 'active' ? 'inactive' : 'active'
  try {
    const formData = new FormData()
    formData.append('status', newStatus)
    await useApi(`/designs/items/${item.id}`, {
      method: 'POST',
      body: formData
    })
    await refresh()
  } catch (e) {
    console.error('Toggle item status error:', e)
  } finally {
    togglingItemId.value = null
  }
}

// Upload media for item
const uploadingItemId = ref<number | null>(null)

const handleMediaUpload = async (event: Event, item: DesignItem) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingItemId.value = item.id
  const formData = new FormData()
  formData.append('media_file', file)

  try {
    await useApi(`/designs/items/${item.id}`, {
      method: 'POST',
      body: formData
    })
    await refresh()
  } catch (e) {
    console.error('Upload error:', e)
  } finally {
    uploadingItemId.value = null
    target.value = ''
  }
}

// Save translation for item
const savingItemId = ref<number | null>(null)
const savedItemId = ref<number | null>(null)

// Update specific translation field
const updateItemField = (item: DesignItem, field: 'title' | 'subtitle', value: string) => {
  const currentLang = locale.value.split('-')[0] || 'es'
  const translations = [...item.translations]
  const transIndex = translations.findIndex(t => t.lang === currentLang)
  
  if (transIndex > -1) {
    const existing = translations[transIndex]
    if (!existing) return
    translations[transIndex] = {
      id: existing.id,
      lang: existing.lang,
      title: field === 'title' ? value : existing.title,
      subtitle: field === 'subtitle' ? value : existing.subtitle
    }
  } else {
    translations.push({
      id: 0,
      lang: currentLang,
      title: field === 'title' ? value : '',
      subtitle: field === 'subtitle' ? value : ''
    })
  }
  
  saveTranslations(item, translations)
}

const saveTranslations = async (item: DesignItem, translations: DesignTranslation[]) => {
  savingItemId.value = item.id
  try {
    const formData = new FormData()
    formData.append('translations', JSON.stringify(translations))
    await useApi(`/designs/items/${item.id}`, {
      method: 'POST',
      body: formData
    })
    savedItemId.value = item.id
    setTimeout(() => { savedItemId.value = null }, 2000)
    await refresh()
  } catch (e) {
    console.error('Save translations error:', e)
  } finally {
    savingItemId.value = null
  }
}

// Add slide to carousel
const addingSlideDesignId = ref<number | null>(null)

const addSlide = async (design: Design) => {
  addingSlideDesignId.value = design.id
  try {
    const formData = new FormData()
    formData.append('design_id', String(design.id))
    formData.append('order', String(design.items.length + 1))
    formData.append('translations', JSON.stringify([
      { lang: 'en', title: '', subtitle: '' },
      { lang: 'es', title: '', subtitle: '' }
    ]))
    await useApi('/designs/items', {
      method: 'POST',
      body: formData
    })
    await refresh()
  } catch (e) {
    console.error('Add slide error:', e)
  } finally {
    addingSlideDesignId.value = null
  }
}

// Delete slide
const deletingItemId = ref<number | null>(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

const confirmDeleteSlide = (itemId: number) => {
  deleteTargetId.value = itemId
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

const executeDeleteSlide = async () => {
  if (!deleteTargetId.value) return
  deletingItemId.value = deleteTargetId.value
  try {
    await useApi(`/designs/items/${deleteTargetId.value}`, { method: 'DELETE' })
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    await refresh()
  } catch (e) {
    console.error('Delete error:', e)
  } finally {
    deletingItemId.value = null
  }
}

const getSectionLabel = (key: string): string => {
  const k = `designs.sections.${key}` as any
  const translated = t(k)
  return translated !== k ? translated : key.replace(/_/g, ' ')
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'carousel': return 'i-heroicons-rectangle-group'
    case 'single_image': return 'i-heroicons-photo'
    case 'video': return 'i-heroicons-film'
    default: return 'i-heroicons-photo'
  }
}
</script>

<template>
  <div class="designs-wrapper">
    <!-- Loading Skeleton -->
    <div v-if="pending && !designs.length" class="designs-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-card"></div>
    </div>

    <!-- Designs List -->
    <div v-else class="designs-list">
      <div v-for="design in designs" :key="design.id" class="design-section" :class="{ 'is-inactive': design.status === 'inactive' }">
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-info">
            <UIcon :name="getModeIcon(design.display_mode)" class="section-mode-icon" />
            <h2 class="section-title">{{ getSectionLabel(design.key) }}</h2>
            <span class="section-mode-badge">{{ design.display_mode.replace('_', ' ') }}</span>
          </div>
          <div class="section-controls">
            <!-- Status Toggle -->
            <label class="toggle-switch" :class="{ 'is-loading': togglingId === design.id }">
              <input
                type="checkbox"
                :checked="design.status === 'active'"
                :disabled="togglingId === design.id"
                @change="toggleDesignStatus(design)"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">{{ design.status === 'active' ? $t('designs.status.active') : $t('designs.status.inactive') }}</span>
            </label>
          </div>
        </div>

        <!-- Section Body -->
        <div class="section-body">
          <!-- Items Grid -->
          <div class="items-grid" :class="{ 'is-carousel': design.display_mode === 'carousel' }">
            <div v-for="item in design.items" :key="item.id" class="item-card" :class="{ 'is-inactive-item': item.status === 'inactive' }">
              <!-- Media Preview -->
              <div class="item-media">
                <div v-if="item.url" class="media-preview">
                  <video v-if="item.media_type === 'video'" :src="item.url" class="media-content" controls></video>
                  <img v-else :src="item.url" class="media-content" />
                  <div class="media-overlay">
                    <label class="overlay-btn" :title="$t('designs.labels.replaceMedia')">
                      <UIcon name="i-heroicons-arrow-path" class="icon-sm" />
                      <input type="file" accept="image/*,video/*" class="hidden" @change="handleMediaUpload($event, item)" :disabled="uploadingItemId === item.id" />
                    </label>
                  </div>
                  <div v-if="uploadingItemId === item.id" class="media-loading">
                    <UIcon name="i-heroicons-arrow-path" class="icon-lg animate-spin" />
                  </div>
                </div>
                <label v-else class="media-empty">
                  <UIcon name="i-heroicons-cloud-arrow-up" class="icon-upload" />
                  <span>{{ $t('designs.labels.uploadMedia') }}</span>
                  <input type="file" accept="image/*,video/*" class="hidden" @change="handleMediaUpload($event, item)" :disabled="uploadingItemId === item.id" />
                  <div v-if="uploadingItemId === item.id" class="media-loading">
                    <UIcon name="i-heroicons-arrow-path" class="icon-lg animate-spin" />
                  </div>
                </label>
              </div>

              <!-- Translations Form -->
              <div class="item-translations">
                <div class="trans-header">
                  <span class="lang-tag">{{ locale === 'es' ? 'Español' : 'English' }}</span>
                </div>
                <div class="trans-row">
                  <input
                    type="text"
                    class="trans-input"
                    :placeholder="$t('designs.labels.title')"
                    :value="item.title || ''"
                    @change="(e: Event) => updateItemField(item, 'title', (e.target as HTMLInputElement).value)"
                  />
                  <input
                    type="text"
                    class="trans-input"
                    :placeholder="$t('designs.labels.subtitle')"
                    :value="item.subtitle || ''"
                    @change="(e: Event) => updateItemField(item, 'subtitle', (e.target as HTMLInputElement).value)"
                  />
                </div>

                <!-- Item Controls -->
                <div class="item-controls">
                  <!-- Saved indicator -->
                  <Transition name="fade">
                    <span v-if="savedItemId === item.id" class="saved-badge">
                      <UIcon name="i-heroicons-check-circle" class="icon-xs" />
                      {{ $t('designs.labels.saved') }}
                    </span>
                  </Transition>
                  <span v-if="savingItemId === item.id" class="saving-badge">
                    <UIcon name="i-heroicons-arrow-path" class="icon-xs animate-spin" />
                    {{ $t('designs.labels.saving') }}
                  </span>

                  <div class="item-controls-right">
                    <!-- Item status toggle (for carousels) -->
                    <label v-if="design.display_mode === 'carousel'" class="toggle-switch toggle-switch--sm" :class="{ 'is-loading': togglingItemId === item.id }">
                      <input
                        type="checkbox"
                        :checked="item.status === 'active'"
                        :disabled="togglingItemId === item.id"
                        @change="toggleItemStatus(item)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                    <!-- Delete button (only for carousel items when more than 1) -->
                    <button
                      v-if="design.display_mode === 'carousel' && design.items.length > 1"
                      class="btn-delete-item"
                      :disabled="deletingItemId === item.id"
                      @click="confirmDeleteSlide(item.id)"
                      :title="$t('designs.labels.deleteSlide')"
                    >
                      <UIcon v-if="deletingItemId === item.id" name="i-heroicons-arrow-path" class="icon-xs animate-spin" />
                      <UIcon v-else name="i-heroicons-trash" class="icon-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Slide Button (carousel only) -->
            <button
              v-if="design.display_mode === 'carousel'"
              class="add-slide-btn"
              :disabled="addingSlideDesignId === design.id"
              @click="addSlide(design)"
            >
              <UIcon v-if="addingSlideDesignId === design.id" name="i-heroicons-arrow-path" class="icon-md animate-spin" />
              <UIcon v-else name="i-heroicons-plus-circle" class="icon-md" />
              <span>{{ $t('designs.labels.addSlide') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-box">
            <div class="modal-icon-wrap">
              <UIcon name="i-heroicons-exclamation-triangle" class="modal-icon" />
            </div>
            <h3 class="modal-title">{{ $t('designs.labels.deleteSlide') }}</h3>
            <p class="modal-desc">{{ $t('designs.labels.confirmDelete') }}</p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="cancelDelete">{{ $t('designs.labels.cancel') }}</button>
              <button class="btn-danger" @click="executeDeleteSlide" :disabled="!!deletingItemId">
                <UIcon v-if="deletingItemId" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
                <span v-else>{{ $t('designs.labels.confirm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Estilos extraídos de designs/index.vue */
.designs-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.design-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .design-section {
  background: #1e293b;
  border-color: #334155;
}

.design-section.is-inactive {
  opacity: 0.6;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, rgba(160,124,40,0.03) 0%, transparent 100%);
}

:root.dark .section-header {
  border-bottom-color: #334155;
  background: linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 100%);
}

.section-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-mode-icon {
  width: 22px;
  height: 22px;
  color: #a07c28;
}

:root.dark .section-mode-icon {
  color: #d4af37;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

:root.dark .section-title {
  color: #f8fafc;
}

.section-mode-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(160, 124, 40, 0.08);
  color: #a07c28;
}

.section-body {
  padding: 1.5rem 1.75rem;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.items-grid.is-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

:root.dark .item-card {
  background: #0f172a;
  border-color: #334155;
}

.item-media {
  position: relative;
  aspect-ratio: 16/9;
  background: #e2e8f0;
  overflow: hidden;
}

.media-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.item-media:hover .media-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1e293b;
}

.item-translations {
  padding: 1rem;
}

.trans-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

:root.dark .trans-input {
  background: #1e293b;
  border-color: #334155;
  color: white;
}

.item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  position: relative;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

input:checked + .toggle-slider {
  background: #a07c28;
}

input:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.btn-delete-item {
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
}

.add-slide-btn {
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #64748b;
  cursor: pointer;
  min-height: 200px;
  transition: all 0.3s;
}

.add-slide-btn:hover {
  background: #f8fafc;
  color: #a07c28;
  border-color: #a07c28;
}

:root.dark .add-slide-btn {
  border-color: #334155;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 400px;
  text-align: center;
}

:root.dark .modal-box {
  background: #1e293b;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;
}

.saved-badge {
  font-size: 0.75rem;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
