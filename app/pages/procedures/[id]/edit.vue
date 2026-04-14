<script setup lang="ts">
import ProcedureForm from '~/components/procedures/ProcedureForm.vue'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

const id = route.params.id as string
const { locale } = useI18n({ useScope: 'global' })
const editingLocale = ref<string>(locale.value)

const { data: procedure, pending, error } = await useAsyncData(
  `procedure-${id}-${editingLocale.value}`,
  () => useApi(`/procedures/${id}`, {
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

const updating = ref(false)

const handleUpdate = async (formData: FormData) => {
  updating.value = true
  try {
    // Backend expects POST for updates with FormData
    await useApi(`/procedures/${id}`, {
      method: 'POST',
      body: formData
    })

    toast.add({
      title: t('procedures.form.messages.successUpdate'),
      color: 'success'
    })

    router.push('/procedures')
  } catch (error: any) {
    console.error('Update error:', error)
    toast.add({
      title: t('procedures.form.messages.error'),
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="edit-procedure-page">
    <header class="page-header mb-8">
      <div class="flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
        <div>
          <h1 class="page-title">{{ t('procedures.form.actions.update') }}</h1>
          <p class="page-desc">{{ t('procedures.header.description') }}</p>
        </div>
      </div>
    </header>

    <div v-if="pending" class="flex justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin icon-xl color-gold" />
    </div>

    <div v-else-if="error" class="error-box">
       <UIcon name="i-heroicons-exclamation-triangle" class="icon-xl mb-4" />
       <h3>{{ t('procedures.form.messages.error') }}</h3>
       <UButton class="mt-4" @click="router.back()">{{ t('procedures.form.actions.cancel') }}</UButton>
    </div>

    <ProcedureForm v-else :initial-data="procedure" :is-edit="true" :loading="updating" @submit="handleUpdate" @cancel="router.back()" @change-language="handleLanguageChange" />
  </div>
</template>

<style scoped>
.edit-procedure-page {
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

.color-gold {
  color: #a07c28;
}

.error-box {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
}

:root.dark .error-box {
  background: #1e293b;
  border-color: #334155;
}

.icon-xl {
  width: 48px;
  height: 48px;
}
</style>
