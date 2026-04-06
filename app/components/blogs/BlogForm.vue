<script setup lang="ts">
import { ref, onMounted } from 'vue'
import RichTextEditor from './RichTextEditor.vue'

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

const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  title: props.initialData.translations?.[0]?.title || '',
  content: props.initialData.translations?.[0]?.content || '',
  categoryCode: props.initialData.categoryCode || '',
  writer: props.initialData.writer || '',
  baseLang: props.initialData.base_lang || 'es',
  image: null as File | null
})

const imagePreview = ref(props.initialData.image || null)

const handleImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    form.value.image = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const categories = ref<{ code: string, name: string }[]>([])
const loadingCategories = ref(false)

const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const response = await useApi<{ data: any[] }>('/blog-categories')
    categories.value = response.data.map(cat => ({
      code: cat.code,
      name: cat.translations?.[0]?.name || cat.code
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
  } finally {
    loadingCategories.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

const handleSubmit = () => {
  const formData = new FormData()
  formData.append('title', form.value.title)
  formData.append('content', form.value.content)
  formData.append('categoryCode', form.value.categoryCode)
  formData.append('writer', form.value.writer)
  formData.append('baseLang', form.value.baseLang)
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

defineExpose({ commitDeletions })

const { t } = useI18n()
</script>

<template>
  <form @submit.prevent="handleSubmit" class="blog-form">
    <div class="form-grid">
      <!-- Main Content -->
      <div class="main-column">
        <section class="card-section">
          <UFormField :label="t('blogs.form.title')" required>
            <UInput v-model="form.title" :placeholder="t('blogs.form.titlePlaceholder')" size="lg" class="title-input" />
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
            <USelect v-model="form.categoryCode" :options="categories" option-attribute="name" value-attribute="code" :placeholder="t('blogs.form.selectCategory')" :loading="loadingCategories" />
          </UFormField>

          <UFormField :label="t('blogs.form.writer')" class="mt-4">
            <UInput v-model="form.writer" :placeholder="t('blogs.form.writerPlaceholder')" />
          </UFormField>

          <UFormField :label="t('blogs.form.baseLang')" class="mt-4">
            <USelect v-model="form.baseLang" :options="[{ label: 'Español', value: 'es' }, { label: 'English', value: 'en' }]" />
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

        <!-- Actions -->
        <div class="form-actions mt-8">
          <UButton type="submit" block color="primary" size="lg" :loading="loading">
            {{ isEdit ? t('blogs.form.update') : t('blogs.form.publish') }}
          </UButton>
          <UButton type="button" block variant="ghost" color="neutral" class="mt-2" @click="emit('cancel')">
            {{ t('blogs.form.cancel') }}
          </UButton>
        </div>
      </div>
    </div>
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

.section-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  transition: color 0.3s;
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
