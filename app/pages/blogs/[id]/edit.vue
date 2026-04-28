<script setup lang="ts">
import BlogForm from '~/components/blogs/BlogForm.vue'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const { t, locale } = useI18n({ useScope: 'global' })
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const formRef = ref<any>(null)
const blogId = route.params.id

const editingLocale = ref<string>(locale.value)

// Fetch blog data
const { data: blogResponse, pending: loadingBlog, error, refresh } = await useAsyncData(
  `blog-${blogId}`,
  () => useApi<{ data: any }>(`/blogs/${blogId}`, {
    headers: {
      'Accept-Language': editingLocale.value
    }
  }),
  {
    watch: [editingLocale]
  }
)

const handleLanguageChange = (newLocale: string) => {
  editingLocale.value = newLocale
}

const handleStatusChanged = async () => {
  await refresh()
}

const blogData = computed(() => blogResponse.value?.data || null)

const handleUpdate = async (formData: FormData) => {
  loading.value = true
  try {
    // We use POST because of PHP/Multipart issues with PUT
    await useApi(`/blogs/${blogId}`, {
      method: 'POST',
      body: formData
    })

    // Commit any media deletions from the editor
    if (formRef.value) {
      await formRef.value.commitDeletions()
    }

    toast.add({
      title: t('blogs.form.successUpdate'),
      color: 'success'
    })

    router.push('/blogs')
  } catch (err: any) {
    console.error('Update error:', err)
    toast.add({
      title: t('blogs.form.error'),
      description: err.data?.message || err.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="edit-blog-page">
    <header class="page-header mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('blogs.form.editTitle') }}</h1>
          <p class="page-desc">{{ t('blogs.form.editDesc') }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UButton type="button" variant="ghost" color="neutral" size="lg" rounded="xl" @click="router.back()">
          {{ t('blogs.form.cancel') }}
        </UButton>
        <UButton type="button" color="primary" size="lg" rounded="xl" class="px-8 font-bold" :loading="loading" @click="formRef?.handleSubmit()">
          {{ t('blogs.form.update') }}
        </UButton>
      </div>
    </header>

    <div v-if="loadingBlog" class="flex justify-center items-center min-h-[400px]">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-amber-500" />
    </div>

    <div v-else-if="error || !blogData" class="error-state">
      <p class="text-error">{{ t('blogs.form.error') }}</p>
      <UButton @click="router.back()" class="mt-4">Volver</UButton>
    </div>

    <BlogForm v-else ref="formRef" :initial-data="blogData" :is-edit="true" :loading="loading" @submit="handleUpdate" @cancel="router.back()" @change-language="handleLanguageChange" @status-changed="handleStatusChanged" />
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #1e293b;
}

:root.dark .page-title {
  color: #f8fafc;
}

.page-desc {
  color: #64748b;
  font-size: 0.95rem;
}

.error-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

:root.dark .error-state {
  background: #0f172a;
  border-color: #1e293b;
}
</style>
