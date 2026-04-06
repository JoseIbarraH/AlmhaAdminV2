<script setup lang="ts">
import BlogForm from '~/components/blogs/BlogForm.vue'

definePageMeta({
  middleware: ['auth']
})

const { t } = useI18n()
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const formRef = ref<any>(null)

const handleCreate = async (formData: FormData) => {
  loading.value = true
  try {
    const response = await useApi('/blogs', {
      method: 'POST',
      body: formData
    })

    // Commit any media deletions from the editor
    if (formRef.value) {
      await formRef.value.commitDeletions()
    }

    toast.add({
      title: t('blogs.form.successCreate'),
      color: 'success'
    })

    router.push('/blogs')
  } catch (error: any) {
    console.error('Create error:', error)
    toast.add({
      title: t('blogs.form.error'),
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-blog-page">
    <header class="page-header mb-8">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('blogs.form.createTitle') }}</h1>
          <p class="page-desc">{{ t('blogs.form.createDesc') }}</p>
        </div>
      </div>
    </header>

    <BlogForm ref="formRef" @submit="handleCreate" @cancel="router.back()" :loading="loading" />
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
</style>
