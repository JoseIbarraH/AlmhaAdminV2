<script setup lang="ts">
import TeamForm from '~/components/teams/TeamForm.vue'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const { t, locale } = useI18n()
const toast = useToast()
const router = useRouter()

const loading = ref(false)
const formRef = ref<any>(null)
const teamId = route.params.id

const editingLocale = ref<string>(locale.value)

// Fetch team data
const { data: teamResponse, pending: loadingTeam, error } = await useAsyncData(
  `team-${teamId}`,
  () => useApi<any>(`/teams/${teamId}`, {
    headers: {
      'Accept-Language': editingLocale.value
    }
  }),
  {
    watch: [editingLocale]
  }
)

const teamData = computed(() => teamResponse.value || null)

const handleUpdate = async (formData: FormData) => {
  loading.value = true
  try {
    await useApi(`/teams/${teamId}`, {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: t('teams.form.successUpdate'),
      color: 'success'
    })

    router.push('/teams')
  } catch (err: any) {
    console.error('Update error:', err)
    toast.add({
      title: t('teams.form.error'),
      description: err.data?.message || err.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="edit-team-page">
    <header class="page-header mb-8">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('teams.form.editTitle') }}</h1>
          <p class="page-desc">{{ t('teams.form.editDesc') }}</p>
        </div>
      </div>
    </header>

    <div v-if="loadingTeam" class="flex justify-center items-center min-h-[400px]">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-amber-500" />
    </div>

    <div v-else-if="error || !teamData" class="error-state">
      <p class="text-error">{{ t('teams.form.error') }}</p>
      <UButton @click="router.back()" class="mt-4">{{ t('teams.form.cancel') }}</UButton>
    </div>

    <TeamForm v-else ref="formRef" :initial-data="teamData" :is-edit="true" :loading="loading" @submit="handleUpdate" @cancel="router.back()" />
  </div>
</template>

<style scoped>
.edit-team-page {
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
