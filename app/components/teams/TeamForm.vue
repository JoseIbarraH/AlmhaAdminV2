<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'

interface TeamMember {
  id?: number | string
  userId?: string | null
  slug?: string | null
  name: string
  status: string
  image?: string | null
  translations?: {
    id?: number
    lang: string
    specialization: string | null
    description: string | null
    biography: string | null
  }[]
  images?: {
    id?: number
    path: string
    order: number
  }[]
}

const props = defineProps<{
  initialData?: TeamMember | null
  isEdit?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', formData: FormData): void
  (e: 'cancel'): void
}>()

const { t, locale } = useI18n({ useScope: 'global' })

// Form fields
const name = ref('')
const status = ref('active')
const userId = ref<string | null>(null)
const specialization = ref('')
const description = ref('')
const biography = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const galleryFiles = ref<{ file: File | null; preview: string; existingPath?: string; order: number }[]>([])

// Cropper state
const isCropperModalOpen = ref(false)
const cropperTargetImage = ref<string | null>(null)

// Status select
const isStatusMenuOpen = ref(false)
const statusOptions = computed(() => [
  { label: t('teams.form.statusActive'), value: 'active' },
  { label: t('teams.form.statusInactive'), value: 'inactive' }
])
const currentStatusOption = computed(() =>
  statusOptions.value.find(o => o.value === status.value) || statusOptions.value[0]
)

const toggleStatusMenu = () => {
  isStatusMenuOpen.value = !isStatusMenuOpen.value
}

const selectStatusOption = (value: string) => {
  status.value = value
  isStatusMenuOpen.value = false
}

// Close status menu on outside click
const closeStatusMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.status-select')) {
    isStatusMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeStatusMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeStatusMenu)
})

// Load initial data
const loadInitialData = () => {
  if (!props.initialData) return

  name.value = props.initialData.name || ''
  status.value = props.initialData.status || 'active'
  userId.value = props.initialData.userId || null
  imagePreview.value = props.initialData.image || null

  // Load translation data
  if (props.initialData.translations?.length) {
    const trans = props.initialData.translations[0]
    specialization.value = trans?.specialization || ''
    description.value = trans?.description || ''
    biography.value = trans?.biography || ''
  }

  // Load gallery
  if (props.initialData.images?.length) {
    galleryFiles.value = props.initialData.images.map(img => ({
      file: null,
      preview: img.path,
      existingPath: img.path,
      order: img.order
    }))
  }
}

watch(() => props.initialData, () => {
  loadInitialData()
}, { immediate: true })

// Image handler
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    cropperTargetImage.value = URL.createObjectURL(target.files[0])
    isCropperModalOpen.value = true
  }
  // Reset input
  target.value = ''
}

const onCropCompleted = (payload: { file: File, previewUrl: string }) => {
  imageFile.value = payload.file
  imagePreview.value = payload.previewUrl
  cropperTargetImage.value = null
}

const cancelCropping = () => {
  cropperTargetImage.value = null
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = props.initialData?.image || null
  if (!props.isEdit) imagePreview.value = null
}

// Gallery handlers
const addGalleryImage = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    for (const file of target.files) {
      galleryFiles.value.push({
        file,
        preview: URL.createObjectURL(file),
        order: galleryFiles.value.length
      })
    }
  }
  target.value = ''
}

const removeGalleryImage = (index: number) => {
  galleryFiles.value.splice(index, 1)
  // Reorder
  galleryFiles.value.forEach((g, i) => g.order = i)
}

// Submit
const handleSubmit = () => {
  if (!name.value.trim()) return

  const formData = new FormData()
  formData.append('baseLang', locale.value.split('-')[0] || 'es')
  formData.append('name', name.value)
  formData.append('status', status.value)

  if (userId.value) {
    formData.append('userId', userId.value)
  }

  if (specialization.value) {
    formData.append('specialization', specialization.value)
  }

  if (description.value) {
    formData.append('description', description.value)
  }

  if (biography.value) {
    formData.append('biography', biography.value)
  }

  if (imageFile.value) {
    formData.append('image', imageFile.value)
  }

  // Gallery
  galleryFiles.value.forEach((item, index) => {
    if (item.file) {
      formData.append(`gallery[${index}][path]`, item.file)
    } else if (item.existingPath) {
      formData.append(`gallery[${index}][path]`, item.existingPath)
    }
    formData.append(`gallery[${index}][order]`, String(item.order))
  })

  emit('submit', formData)
}

defineExpose({ handleSubmit })
</script>

<template>
  <div class="team-form">
    <!-- Main Grid -->
    <div class="form-grid">
      <!-- Left Column - Main Info -->
      <div class="form-main">
        <!-- Avatar / Profile Image -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-camera" class="section-icon" />
            {{ $t('teams.form.profileImage') }}
          </h3>
          <div class="avatar-upload-area">
            <div class="avatar-preview-wrap" @click="($refs.imageInput as HTMLInputElement)?.click()">
              <img v-if="imagePreview" :src="imagePreview" class="avatar-preview-img" />
              <div v-else class="avatar-preview-empty">
                <UIcon name="i-heroicons-user" class="icon-avatar-upload" />
                <span class="upload-hint">{{ $t('teams.form.clickToUpload') }}</span>
              </div>
            </div>
            <button v-if="imagePreview && imageFile" type="button" class="btn-remove-avatar" @click="removeImage">
              <UIcon name="i-heroicons-x-mark" class="icon-xs" />
            </button>
            <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
          </div>
        </div>

        <!-- Name -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-user-circle" class="section-icon" />
            {{ $t('teams.form.name') }}
          </h3>
          <input
            v-model="name"
            type="text"
            :placeholder="$t('teams.form.namePlaceholder')"
            class="form-input"
          />
        </div>

        <!-- Specialization -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-academic-cap" class="section-icon" />
            {{ $t('teams.form.specialization') }}
          </h3>
          <input
            v-model="specialization"
            type="text"
            :placeholder="$t('teams.form.specializationPlaceholder')"
            class="form-input"
          />
        </div>

        <!-- Description -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-document-text" class="section-icon" />
            {{ $t('teams.form.description') }}
          </h3>
          <textarea
            v-model="description"
            :placeholder="$t('teams.form.descriptionPlaceholder')"
            class="form-textarea"
            rows="4"
          ></textarea>
        </div>

        <!-- Biography -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-book-open" class="section-icon" />
            {{ $t('teams.form.biography') }}
          </h3>
          <textarea
            v-model="biography"
            :placeholder="$t('teams.form.biographyPlaceholder')"
            class="form-textarea"
            rows="6"
          ></textarea>
        </div>

        <!-- Gallery -->
        <div class="form-section">
          <h3 class="section-title">
            <UIcon name="i-heroicons-photo" class="section-icon" />
            {{ $t('teams.form.gallery') }}
          </h3>
          <div class="gallery-grid">
            <div v-for="(item, index) in galleryFiles" :key="index" class="gallery-item">
              <img :src="item.preview" class="gallery-thumb" />
              <button type="button" class="gallery-remove" @click="removeGalleryImage(index)">
                <UIcon name="i-heroicons-x-mark" class="icon-xs" />
              </button>
            </div>
            <label class="gallery-add">
              <UIcon name="i-heroicons-plus" class="icon-md" />
              <span>{{ $t('teams.form.addImage') }}</span>
              <input type="file" accept="image/*" multiple class="hidden" @change="addGalleryImage" />
            </label>
          </div>
        </div>
      </div>

      <!-- Right Column - Settings -->
      <div class="form-sidebar">
        <!-- Status -->
        <div class="sidebar-card">
          <h4 class="sidebar-card-title">{{ $t('teams.form.status') }}</h4>
          <div class="status-select" @click.stop>
            <button type="button" class="select-trigger" :class="{ 'is-active': isStatusMenuOpen }" @click="toggleStatusMenu">
              <div class="status-indicator" :class="status === 'active' ? 'indicator-active' : 'indicator-inactive'"></div>
              <span class="trigger-label">{{ currentStatusOption?.label }}</span>
              <UIcon name="i-heroicons-chevron-down" class="select-chevron" :class="{ 'is-rotated': isStatusMenuOpen }" />
            </button>
            <Transition name="fade-scale">
              <div v-if="isStatusMenuOpen" class="select-menu">
                <button v-for="option in statusOptions" :key="option.value" type="button" class="menu-item" :class="{ 'is-selected': status === option.value }" @click="selectStatusOption(option.value)">
                  <div class="status-indicator" :class="option.value === 'active' ? 'indicator-active' : 'indicator-inactive'"></div>
                  <span class="item-label">{{ option.label }}</span>
                  <UIcon v-if="status === option.value" name="i-heroicons-check" class="item-check" />
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Language Info -->
        <div class="sidebar-card">
          <h4 class="sidebar-card-title">{{ $t('teams.form.language') }}</h4>
          <div class="lang-badge">
            <UIcon name="i-heroicons-language" class="icon-sm" />
            <span>{{ locale === 'es' ? 'Español' : 'English' }}</span>
          </div>
          <p class="sidebar-hint">{{ $t('teams.form.languageHint') }}</p>
        </div>

        <!-- Actions -->
        <div class="sidebar-card actions-card">
          <button type="button" class="btn-submit" :disabled="loading || !name.trim()" @click="handleSubmit">
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="icon-sm animate-spin" />
            <UIcon v-else name="i-heroicons-check" class="icon-sm" />
            <span>{{ isEdit ? $t('teams.form.update') : $t('teams.form.save') }}</span>
          </button>
          <button type="button" class="btn-cancel-form" @click="$emit('cancel')">
            {{ $t('teams.form.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reusable Cropper Modal -->
    <ImageCropperModal
      v-model="isCropperModalOpen"
      :src="cropperTargetImage"
      :aspect-ratio="3/4"
      title="Recortar Imagen"
      cancel-text="Cancelar"
      save-text="Guardar Recorte"
      @crop="onCropCompleted"
      @cancel="cancelCropping"
    />
  </div>
</template>

<style scoped>
.team-form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
  align-items: start;
}

/* Main Column */
.form-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.75rem;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .form-section {
  background: #1e293b;
  border-color: #334155;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
  transition: color 0.3s;
}

:root.dark .section-title {
  color: #f8fafc;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #a07c28;
}

:root.dark .section-icon {
  color: #d4af37;
}

/* Avatar Upload */
.avatar-upload-area {
  position: relative;
  display: flex;
  justify-content: center;
}

.avatar-preview-wrap {
  width: 160px;
  height: 213px;
  border-radius: 14px;
  border: 3px dashed #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .avatar-preview-wrap {
  border-color: #334155;
}

.avatar-preview-wrap:hover {
  border-color: #a07c28;
  background: rgba(160, 124, 40, 0.04);
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.icon-avatar-upload {
  width: 36px;
  height: 36px;
}

.upload-hint {
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
}

.btn-remove-avatar {
  position: absolute;
  top: -10px;
  right: calc(50% - 90px);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

:root.dark .btn-remove-avatar {
  border-color: #1e293b;
}

.btn-remove-avatar:hover {
  transform: scale(1.1);
}

/* Form Inputs */
.form-input {
  width: 100%;
  padding: 0.85rem 1.15rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  transition: all 0.3s;
}

:root.dark .form-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.form-input:focus {
  border-color: #a07c28;
  background: white;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

:root.dark .form-input:focus {
  background: #0f172a;
  border-color: #a07c28;
}

.form-textarea {
  width: 100%;
  padding: 0.85rem 1.15rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.3s;
}

:root.dark .form-textarea {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

.form-textarea:focus {
  border-color: #a07c28;
  background: white;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

:root.dark .form-textarea:focus {
  background: #0f172a;
  border-color: #a07c28;
}

/* Gallery */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: border-color 0.3s;
}

:root.dark .gallery-item {
  border-color: #334155;
}

.gallery-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.gallery-item:hover .gallery-remove {
  opacity: 1;
}

.gallery-remove:hover {
  transform: scale(1.1);
}

.gallery-add {
  aspect-ratio: 1;
  border: 2px dashed #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s;
}

:root.dark .gallery-add {
  border-color: #334155;
}

.gallery-add:hover {
  border-color: #a07c28;
  color: #a07c28;
  background: rgba(160, 124, 40, 0.04);
}

/* Sidebar */
.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
}

.sidebar-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.5rem;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .sidebar-card {
  background: #1e293b;
  border-color: #334155;
}

.sidebar-card-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.75rem;
  transition: color 0.3s;
}

:root.dark .sidebar-card-title {
  color: #94a3b8;
}

/* Status Select */
.status-select {
  position: relative;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.indicator-active {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.indicator-inactive {
  background: #64748b;
}

.select-trigger {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

:root.dark .select-trigger {
  background: #0f172a;
  border-color: #334155;
}

.select-trigger:hover {
  border-color: #cbd5e1;
}

.select-trigger.is-active {
  border-color: #a07c28;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

.trigger-label {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  text-align: left;
}

:root.dark .trigger-label {
  color: #f8fafc;
}

.select-chevron {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.3s;
}

.select-chevron.is-rotated {
  transform: rotate(180deg);
}

.select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.4rem;
  z-index: 50;
}

:root.dark .select-menu {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f1f5f9;
}

:root.dark .menu-item:hover {
  background: #334155;
}

.item-label {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  text-align: left;
}

:root.dark .item-label {
  color: #94a3b8;
}

.menu-item.is-selected .item-label {
  color: #a07c28;
  font-weight: 700;
}

.item-check {
  width: 16px;
  height: 16px;
  color: #a07c28;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Language */
.lang-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1rem;
  background: rgba(160, 124, 40, 0.08);
  border-radius: 10px;
  color: #a07c28;
  font-weight: 600;
  font-size: 0.85rem;
}

:root.dark .lang-badge {
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
}

.sidebar-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.5rem;
  line-height: 1.4;
}

/* Action Buttons */
.actions-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-submit {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #a07c28;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(160, 124, 40, 0.2);
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #8b6b22;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(160, 124, 40, 0.25);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel-form {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

:root.dark .btn-cancel-form {
  border-color: #334155;
  color: #94a3b8;
}

.btn-cancel-form:hover {
  background: #f1f5f9;
  color: #1e293b;
}

:root.dark .btn-cancel-form:hover {
  background: #334155;
  color: #f8fafc;
}

/* Icons */
.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 22px;
  height: 22px;
}

/* Responsive */
@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    position: static;
    order: -1;
  }
}
</style>
