<script setup lang="ts">
import ProcedureForm from '~/components/procedures/ProcedureForm.vue'

definePageMeta({
  middleware: ['auth']
})

const { t } = useI18n()
const toast = useToast()
const router = useRouter()

const loading = ref(false)

const handleCreate = async (formData: FormData) => {
  loading.value = true
  try {
    const response = await useApi<any>('/procedures', {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: t('procedures.form.messages.successCreate'),
      color: 'success'
    })

    router.push('/procedures')
  } catch (error: any) {
    console.error('Create error:', error)
    toast.add({
      title: t('procedures.form.messages.error'),
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-procedure-page">
    <header class="page-header mb-8">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('procedures.form.actions.save') }}</h1>
          <p class="page-desc">{{ t('procedures.header.description') }}</p>
        </div>
      </div>
    </header>

    <ProcedureForm @submit="handleCreate" @cancel="router.back()" :loading="loading" />
  </div>
</template>

<style scoped>
.create-procedure-page {
  padding-bottom: 5rem;
}

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
