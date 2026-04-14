<script setup lang="ts">
import TeamForm from '~/components/teams/TeamForm.vue'

definePageMeta({
  middleware: ['auth']
})

const { t } = useI18n({ useScope: 'global' })
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const formRef = ref<any>(null)

const handleCreate = async (formData: FormData) => {
  loading.value = true
  try {
    await useApi('/teams', {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: t('teams.form.successCreate'),
      color: 'success'
    })

    router.push('/teams')
  } catch (error: any) {
    console.error('Create error:', error)
    toast.add({
      title: t('teams.form.error'),
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-team-page">
    <header class="page-header mb-8">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('teams.form.createTitle') }}</h1>
          <p class="page-desc">{{ t('teams.form.createDesc') }}</p>
        </div>
      </div>
    </header>

    <TeamForm ref="formRef" @submit="handleCreate" @cancel="router.back()" :loading="loading" />
  </div>
</template>

<style scoped>
.create-team-page {
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
