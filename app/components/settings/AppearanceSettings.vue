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
const savingDesignId = ref<number | null>(null)

const updateItemField = (item: DesignItem, field: 'title' | 'subtitle', value: string) => {
  const currentLang = locale.value.split('-')[0] || 'es'
  const translations = [...item.translations]
  const transIndex = translations.findIndex(t => t.lang === currentLang)
  
  // Update local item for immediate UI feedback
  if (field === 'title') item.title = value
  else item.subtitle = value

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

  // Update item translations
  item.translations = translations
}

const handleSaveSection = async (design: Design) => {
  savingDesignId.value = design.id
  try {
    const promises = design.items.map(item => saveTranslations(item, item.translations))
    await Promise.all(promises)
    await refresh()
  } catch (e) {
    console.error('Error saving section:', e)
  } finally {
    savingDesignId.value = null
  }
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
    setTimeout(() => { savedItemId.value = null }, 3000)
    // Removed refresh() from here as it's handled at section level
  } catch (e) {
    console.error('Save translations error:', e)
    throw e // Propagate error for Promise.all
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
      <div
        v-for="design in designs"
        :key="design.id"
        class="design-section"
        :class="[
          { 'is-inactive': design.status === 'inactive' },
          { 'design-section--background': design.key && design.key.startsWith('background_') },
        ]"
      >
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-info">
            <UIcon :name="getModeIcon(design.display_mode)" class="section-mode-icon" />
            <h2 class="section-title">{{ getSectionLabel(design.key) }}</h2>
            <span class="section-mode-badge">{{ design.display_mode.replace('_', ' ') }}</span>
          </div>
          <div class="section-controls">
            <!-- Save Whole Section Button -->
            <UButton
              icon="i-heroicons-cloud-arrow-up"
              color="primary"
              variant="solid"
              size="sm"
              :loading="savingDesignId === design.id"
              @click="handleSaveSection(design)"
            >
              {{ $t('designs.labels.save') }}
            </UButton>

            <!-- Status Toggle -->
            <div class="toggle-group">
              <span class="toggle-label">
                {{ design.status === 'active' ? $t('designs.status.active') : $t('designs.status.inactive') }}
              </span>
              <USwitch
                :model-value="design.status === 'active'"
                :loading="togglingId === design.id"
                color="primary"
                @update:model-value="toggleDesignStatus(design)"
              />
            </div>
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
                    <UButton
                      icon="i-heroicons-arrow-path"
                      color="neutral"
                      variant="solid"
                      class="rounded-full shadow-lg"
                      :title="$t('designs.labels.replaceMedia')"
                      :loading="uploadingItemId === item.id"
                      @click="(($refs[`fileInput_${item.id}`] as any)?.[0] as HTMLInputElement)?.click()"
                    />
                    <input :ref="`fileInput_${item.id}`" type="file" accept="image/*,video/*" class="hidden" @change="handleMediaUpload($event, item)" />
                  </div>
                </div>
                <div v-else class="media-empty" @click="(($refs[`fileInput_${item.id}`] as any)?.[0] as HTMLInputElement)?.click()">
                  <UIcon name="i-heroicons-cloud-arrow-up" class="icon-upload" />
                  <span>{{ $t('designs.labels.uploadMedia') }}</span>
                  <input :ref="`fileInput_${item.id}`" type="file" accept="image/*,video/*" class="hidden" @change="handleMediaUpload($event, item)" />
                  <div v-if="uploadingItemId === item.id" class="media-loading">
                    <UIcon name="i-heroicons-arrow-path" class="icon-lg animate-spin" />
                  </div>
                </div>
              </div>

              <!-- Translations Form -->
              <div class="item-content grow p-5 flex flex-col gap-4">
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="soft" size="xs" class="font-bold uppercase tracking-wider">
                    {{ locale === 'es' ? 'Español' : 'English' }}
                  </UBadge>
                </div>
                
                <div class="space-y-4">
                  <UInput
                    :placeholder="$t('designs.labels.title')"
                    :model-value="item.title || ''"
                    variant="none"
                    class="premium-input-field w-full"
                    @update:model-value="(val: string) => updateItemField(item, 'title', val)"
                  />
                  <UInput
                    :placeholder="$t('designs.labels.subtitle')"
                    :model-value="item.subtitle || ''"
                    variant="none"
                    class="premium-input-field w-full"
                    @update:model-value="(val: string) => updateItemField(item, 'subtitle', val)"
                  />
                </div>
              </div>

                <!-- Item Controls -->
                <div class="item-footer px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                  <div class="flex items-center">
                    <!-- Saved indicator -->
                    <Transition name="fade">
                      <span v-if="savedItemId === item.id" class="text-[10px] font-bold text-success-500 flex items-center gap-1">
                        <UIcon name="i-heroicons-check-circle" />
                        {{ $t('designs.labels.saved') }}
                      </span>
                    </Transition>
                    <span v-if="savingItemId === item.id" class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
                      {{ $t('designs.labels.saving') }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Item status toggle (for carousels) -->
                    <USwitch
                      v-if="design.display_mode === 'carousel'"
                      :model-value="item.status === 'active'"
                      :loading="togglingItemId === item.id"
                      size="xs"
                      color="primary"
                      @update:model-value="toggleItemStatus(item)"
                    />
                    
                    <!-- Delete button (only for carousel items when more than 1) -->
                    <UButton
                      v-if="design.display_mode === 'carousel' && design.items.length > 1"
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      square
                      :loading="deletingItemId === item.id"
                      @click="confirmDeleteSlide(item.id)"
                      class="hover:bg-error-50 dark:hover:bg-error-900/20"
                    />
                  </div>
                </div>
              </div>

            <!-- Add Slide Button -->
            <UButton
              v-if="design.display_mode === 'carousel'"
              icon="i-heroicons-plus-circle"
              color="primary"
              variant="soft"
              block
              class="add-item-card h-full min-h-[300px]"
              :loading="addingSlideDesignId === design.id"
              @click="addSlide(design)"
            >
              <span class="font-bold underline tracking-tight">{{ $t('designs.labels.addSlide') }}</span>
            </UButton>
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
  flex-wrap: wrap;
  gap: 2.5rem;
}

/* Default: each design takes the full row (banners, brands, etc.) */
.designs-list > .design-section {
  flex: 1 1 100%;
  min-width: 0;
}

/* Backgrounds (background_1, _2, _3) sit side by side on wide screens. */
.designs-list > .design-section--background {
  flex: 1 1 calc(33.333% - 1.667rem);
  min-width: 280px;
}

@media (max-width: 900px) {
  .designs-list > .design-section--background {
    flex: 1 1 100%;
  }
}

.designs-skeleton {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-card {
  height: 300px;
  background: #f1f5f9;
  border-radius: 20px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.design-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
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
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, rgba(160,124,40,0.05) 0%, transparent 100%);
}

:root.dark .section-header {
  border-bottom-color: #334155;
  background: linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 100%);
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid #e2e8f0;
}

:root.dark .toggle-group {
  border-left-color: #334155;
}

.toggle-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  white-space: nowrap;
}

:root.dark .toggle-label {
  color: #94a3b8;
}

/* Background sections: stack header vertically in narrow cards */
.design-section--background .section-header {
  flex-direction: column;
  align-items: stretch;
}

.design-section--background .section-info {
  justify-content: center;
}

.design-section--background .section-controls {
  justify-content: center;
  gap: 0.5rem;
}

.design-section--background .toggle-group {
  padding-left: 0.5rem;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:root.dark .item-card {
  background: #1e293b;
  border-color: #334155;
}

.item-media {
  position: relative;
  aspect-ratio: 16/10;
  background: #f1f5f9;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

:root.dark .item-media {
  background: #0f172a;
}
.media-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s;
}

.item-media:hover .media-overlay {
  opacity: 1;
}

.media-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
}

.media-empty:hover {
  background: #f1f5f9;
  color: #a07c28;
}

:root.dark .media-empty:hover {
  background: #1e293b;
  color: #d4af37;
}

.icon-upload {
  width: 32px;
  height: 32px;
}

.media-loading {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

:root.dark .media-loading {
  background: rgba(15,23,42,0.8);
}

/* Input refinements */
.premium-input-field {
  transition: all 0.2s;
}

:deep(.premium-input-field .u-input) {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  font-weight: 500 !important;
  padding: 12px 16px !important;
  height: auto !important;
}

:root.dark :deep(.premium-input-field .u-input) {
  background: #0f172a !important;
  border-color: #334155 !important;
  color: white !important;
}

:deep(.premium-input-field .u-input:focus) {
  background: white !important;
  border-color: #a07c28 !important;
  box-shadow: 0 0 0 3px rgba(160,124,40,0.1) !important;
}

:root.dark :deep(.premium-input-field .u-input:focus) {
  background: #1e293b !important;
  border-color: #d4af37 !important;
}

/* Add Slide Button Style */
.add-item-card {
  border: 2px dashed #cbd5e1 !important;
  border-radius: 24px !important;
  font-size: 1rem !important;
  transition: all 0.3s !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  background: transparent !important;
  color: #64748b !important;
}

.add-item-card:hover {
  background: rgba(160, 124, 40, 0.05) !important;
  border-color: #a07c28 !important;
  color: #a07c28 !important;
  transform: translateY(-5px);
}

:root.dark .add-item-card {
  border-color: #334155 !important;
}

:root.dark .add-item-card:hover {
  border-color: #d4af37 !important;
  color: #d4af37 !important;
}

:deep(.add-item-card .u-button-icon) {
  width: 42px !important;
  height: 42px !important;
  margin-bottom: 8px !important;
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
