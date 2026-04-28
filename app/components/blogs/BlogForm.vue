<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import RichTextEditor from './RichTextEditor.vue'
import BlogCategoryModal from './BlogCategoryModal.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'change-language', 'status-changed'])
const { t, locales } = useI18n({ useScope: 'global' })
const toast = useToast()

const form = ref({
  title: props.initialData.translations?.[0]?.title || '',
  content: props.initialData.translations?.[0]?.content || '',
  categoryCode: props.initialData.categoryCode || '',
  writer: props.initialData.writer || '',
  baseLang: props.initialData.translations?.[0]?.lang || props.initialData.base_lang || 'es',
  status: props.initialData.status || 'draft',
  image: null as File | null
})

const statusOptions: { value: 'draft' | 'published' | 'archived', icon: string, color: 'neutral' | 'primary' | 'warning' }[] = [
  { value: 'draft',     icon: 'i-heroicons-pencil-square',  color: 'neutral' },
  { value: 'published', icon: 'i-heroicons-check-circle',   color: 'primary' },
  { value: 'archived',  icon: 'i-heroicons-archive-box',    color: 'warning' },
]

const statusLoading = ref(false)

const publishModalOpen = ref(false)
const publishNotify = ref(true)
const alreadyNotified = computed(() => Boolean(props.initialData.notificationSentAt))

const onStatusClick = (next: 'draft' | 'published' | 'archived') => {
  if (next === form.value.status || statusLoading.value || !props.isEdit || !props.initialData.id) return

  if (next === 'published') {
    publishNotify.value = !alreadyNotified.value
    publishModalOpen.value = true
    return
  }

  applyStatusChange(next, false)
}

const confirmPublish = async () => {
  publishModalOpen.value = false
  await applyStatusChange('published', publishNotify.value && !alreadyNotified.value)
}

const applyStatusChange = async (
  next: 'draft' | 'published' | 'archived',
  notifySubscribers: boolean,
) => {
  const previous = form.value.status
  form.value.status = next
  statusLoading.value = true

  try {
    await useApi(`/blogs/${props.initialData.id}/status`, {
      method: 'PATCH',
      body: { status: next, notify_subscribers: notifySubscribers },
    })
    toast.add({
      title: t('blogs.form.successStatus'),
      description: notifySubscribers ? t('blogs.form.notifyQueued') : undefined,
      color: 'success',
    })
    emit('status-changed', next)
  } catch (err: any) {
    form.value.status = previous
    toast.add({
      title: t('blogs.form.errorStatus'),
      description: err?.data?.message || err?.message,
      color: 'error',
    })
  } finally {
    statusLoading.value = false
  }
}

// Snapshot for patch-style updates (edit mode only)
const originalSnapshot = ref<Record<string, any>>({})

const takeSnapshot = () => {
  if (props.isEdit) {
    originalSnapshot.value = {
      title: form.value.title,
      content: form.value.content,
      categoryCode: form.value.categoryCode,
      writer: form.value.writer,
    }
  }
}

// Update form when initialData changes (for reactive re-fetches)
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value.title = newData.translations?.[0]?.title || ''
    form.value.content = newData.translations?.[0]?.content || ''
    form.value.categoryCode = newData.categoryCode || ''
    form.value.writer = newData.writer || ''
    form.value.status = newData.status || form.value.status
    // We keep the current baseLang as it was the one selected by the user
    // causing this refresh.

    // Re-take snapshot after data reload
    nextTick(() => takeSnapshot())
  }
}, { deep: true })

// Take initial snapshot once mounted
onMounted(() => {
  nextTick(() => takeSnapshot())
})

// Emit language change to parent to trigger re-fetch in Edit mode
watch(() => form.value.baseLang, (newLang) => {
  if (props.isEdit) {
    emit('change-language', newLang)
  }
})

const imagePreview = ref(props.initialData.image || null)

const handleImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    form.value.image = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const categories = ref<{ value: string, label: string }[]>([])
const loadingCategories = ref(false)
const isCategoryModalOpen = ref(false)

const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const response = await useApi<{ data: any[] }>('/blog-categories', {
      headers: {
        'Accept-Language': form.value.baseLang
      }
    })
    console.log('Categories API Response:', response)
    categories.value = response.data.map(cat => ({
      value: cat.code,
      label: cat.name || cat.code
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
  } finally {
    loadingCategories.value = false
  }
}

const { locale } = useI18n({ useScope: 'global' })
watch(() => form.value.baseLang, () => {
  fetchCategories()
})
watch(locale, (newLocale) => {
  form.value.baseLang = newLocale.split('-')[0] || 'es'
  fetchCategories()
})

onMounted(() => {
  fetchCategories()
})

const handleSubmit = () => {
  const formData = new FormData()

  // baseLang is always required
  formData.append('baseLang', form.value.baseLang)

  if (props.isEdit) {
    // Patch-style: only send changed fields
    const snap = originalSnapshot.value

    if (form.value.title !== snap.title) {
      formData.append('title', form.value.title)
    }
    if (form.value.content !== snap.content) {
      formData.append('content', form.value.content)
    }
    if (form.value.categoryCode !== snap.categoryCode) {
      formData.append('categoryCode', form.value.categoryCode)
    }
    if (form.value.writer !== snap.writer) {
      formData.append('writer', form.value.writer)
    }
  } else {
    // Create mode: send everything
    formData.append('title', form.value.title)
    formData.append('content', form.value.content)
    formData.append('categoryCode', form.value.categoryCode)
    formData.append('writer', form.value.writer)
  }

  // Image is always sent if a new file was selected
  if (form.value.image) {
    formData.append('image', form.value.image)
  }

  emit('submit', formData)
}

const editorRef = ref<any>(null)

const commitDeletions = async () => {
  if (editorRef.value) {
    await editorRef.value.commitDeletions()
  }
}

defineExpose({ handleSubmit, commitDeletions })
</script>

<template>
  <form @submit.prevent="handleSubmit" class="blog-form">
    <div class="form-grid">
      <!-- Main Content -->
      <div class="main-column">
        <section class="card-section">
          <UFormField :label="t('blogs.form.title')" required>
            <UInput v-model="form.title" :placeholder="t('blogs.form.titlePlaceholder')" size="lg"
              class="title-input w-full" />
          </UFormField>

          <UFormField :label="t('blogs.form.content')" class="mt-6">
            <RichTextEditor ref="editorRef" v-model="form.content" :blog-id="props.initialData.id" />
          </UFormField>


        </section>
      </div>

      <!-- Sidebar -->
      <div class="side-column">
        <!-- Settings -->
        <section class="card-section">
          <h3 class="section-title">{{ t('blogs.form.settings') }}</h3>

          <UFormField :label="t('blogs.form.category')" required class="mt-4">
            <div class="flex items-center gap-2">
              <USelectMenu v-model="form.categoryCode" :items="categories" value-key="value"
                :search-input="{ placeholder: 'Buscar...' }" :placeholder="t('blogs.form.selectCategory')"
                :loading="loadingCategories" class="flex-1" />
              <UButton icon="i-heroicons-cog-6-tooth" color="neutral" variant="soft" @click="isCategoryModalOpen = true"
                title="Gestionar Categorías" />
            </div>
          </UFormField>

          <UFormField :label="t('blogs.form.writer')" required class="mt-4">
            <UInput v-model="form.writer" :placeholder="t('blogs.form.writerPlaceholder')" size="lg"
              icon="i-heroicons-user" class="w-full" />
          </UFormField>

          <UFormField :label="t('blogs.form.baseLang')" class="mt-4">
            <UInput :model-value="locales.find(l => l.code === form.baseLang)?.name || form.baseLang.toUpperCase()"
              readonly disabled icon="i-heroicons-language" size="lg"
              class="w-full bg-slate-50/50 dark:bg-slate-900/50" />
          </UFormField>

          <UFormField v-if="props.isEdit" :label="t('blogs.form.status')" class="mt-4">
            <div class="status-group">
              <UButton
                v-for="option in statusOptions"
                :key="option.value"
                type="button"
                size="sm"
                :icon="option.icon"
                :color="form.status === option.value ? option.color : 'neutral'"
                :variant="form.status === option.value ? 'solid' : 'soft'"
                :loading="statusLoading && form.status === option.value"
                :disabled="statusLoading"
                class="status-btn"
                @click="onStatusClick(option.value)"
              >
                {{ t(`blogs.form.statusValues.${option.value}`) }}
              </UButton>
            </div>
          </UFormField>
        </section>

        <!-- Image -->
        <section class="card-section mt-6">
          <h3 class="section-title">{{ t('blogs.form.featuredImage') }}</h3>
          <div class="image-upload-box mt-4">
            <div v-if="imagePreview" class="preview-container">
              <img :src="imagePreview" alt="Preview" class="preview-img" />
              <button type="button" class="remove-img" @click="imagePreview = null; form.image = null">
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
            <label v-else class="upload-placeholder">
              <UIcon name="i-heroicons-photo" class="icon-xl" />
              <span>{{ t('blogs.form.clickToUpload') }}</span>
              <input type="file" accept="image/*" class="hidden" @change="handleImageChange" />
            </label>
          </div>
        </section>

      </div>
    </div>

    <!-- Modal de categorías -->
    <BlogCategoryModal v-model="isCategoryModalOpen" @updated="fetchCategories" />

    <!-- Modal de confirmación de publicación -->
    <UModal v-model:open="publishModalOpen" :title="t('blogs.form.publishModal.title')">
      <template #body>
        <p class="text-sm text-slate-700 dark:text-slate-300 mb-4">
          {{ t('blogs.form.publishModal.description') }}
        </p>
        <div
          class="notify-toggle p-4 rounded-xl border"
          :class="alreadyNotified
            ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-70'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-semibold text-slate-900 dark:text-slate-100">
                {{ t('blogs.form.publishModal.notifyLabel') }}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {{ alreadyNotified
                  ? t('blogs.form.publishModal.alreadyNotified')
                  : t('blogs.form.publishModal.notifyHelp') }}
              </p>
            </div>
            <USwitch v-model="publishNotify" :disabled="alreadyNotified" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton variant="ghost" color="neutral" @click="publishModalOpen = false">
            {{ t('blogs.form.cancel') }}
          </UButton>
          <UButton color="primary" :loading="statusLoading" @click="confirmPublish">
            {{ t('blogs.form.publishModal.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </form>
</template>

<style scoped>
.blog-form {
  max-width: 1200px;
  margin: 0 auto;
  transition: color 0.3s;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    order: -1;
  }
}

.card-section {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .card-section {
  background: #1e293b;
  border-color: #334155;
}

@media (max-width: 640px) {
  .card-section {
    padding: 1rem;
  }
}

.section-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  transition: color 0.3s;
}

.status-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-btn {
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
}

:root.dark .section-title {
  color: #f8fafc;
}

.title-input :deep(input) {
  font-size: 1.25rem;
  font-weight: 700;
}

.image-upload-box {
  aspect-ratio: 16/9;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s, background 0.3s;
}

:root.dark .image-upload-box {
  border-color: #334155;
  background: #0f172a;
}

.upload-placeholder {
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

.upload-placeholder:hover {
  background: #f8fafc;
  color: #a07c28;
}

:root.dark .upload-placeholder:hover {
  background: #334155;
  color: #d4af37;
}

.icon-xl {
  width: 40px;
  height: 40px;
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}

.remove-img:hover {
  background: rgba(239, 68, 68, 0.8);
}
</style>
