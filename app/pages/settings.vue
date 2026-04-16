<script setup lang="ts">
const { user, logout, fetchUser } = useAlmhaAuth()
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

definePageMeta({
  middleware: ['auth']
})

const state = reactive({
  name: user.value?.name || '',
  password: '',
  password_confirmation: ''
})

// Watch for user data being loaded to update name
watch(() => user.value, (newUser) => {
  if (newUser?.name && !state.name) {
    state.name = newUser.name
  }
}, { immediate: true })

const isUpdating = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

onMounted(() => {
  if (!user.value) {
    fetchUser()
  }
})

async function handleUpdate() {
  isUpdating.value = true
  try {
    await $fetch('/api/v1/profile/update', {
      method: 'POST',
      body: {
        name: state.name,
        password: state.password || undefined,
        password_confirmation: state.password ? state.password_confirmation : undefined
      }
    })
    toast.add({
      title: t('profile.success_update'),
      color: 'success'
    })
    state.password = ''
    state.password_confirmation = ''
  } catch (error: any) {
    toast.add({
      title: t('profile.error_update'),
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    isUpdating.value = false
  }
}

async function handleDelete() {
  isDeleting.value = true
  try {
    await $fetch('/api/v1/profile', {
      method: 'DELETE'
    })
    logout()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

const userInitials = computed(() => {
  if (!user.value?.name) return 'A'
  return user.value.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
})
</script>

<template>
  <div class="profile-page-wrapper py-12 px-4 md:px-8">
    <div class="max-w-6xl mx-auto">
      
      <!-- Page Header -->
      <header class="mb-10 md:mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
          <div class="avatar-container shrink-0">
            <div class="avatar-surface">
              {{ userInitials }}
            </div>
            <div class="avatar-ring"></div>
            <div class="avatar-status" :class="{ 'bg-green-500': !!user }"></div>
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
              {{ t('profile.title') }}
            </h1>
            <p class="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto sm:mx-0 text-sm md:text-base">
              {{ t('profile.description') }}
            </p>
          </div>
        </div>
        
        <div class="flex justify-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm w-full md:w-auto">
          <UBadge variant="soft" color="neutral" class="font-bold px-3 py-1 text-center truncate">
            {{ user?.email }}
          </UBadge>
        </div>
      </header>

      <form @submit.prevent="handleUpdate" class="space-y-16 md:space-y-24 pb-20">
        <!-- Section: Personal Info -->
        <div class="grid grid-cols-12 gap-6 md:gap-10">
          <div class="col-span-12 lg:col-span-4">
            <div class="sticky top-10 space-y-3 md:space-y-4">
              <div class="flex items-center gap-3 text-gold">
                <UIcon name="i-heroicons-user-circle" class="w-6 h-6 shrink-0" />
                <h2 class="text-lg md:text-xl font-black tracking-tight uppercase italic text-slate-800 dark:text-slate-200">
                  {{ t('profile.personal_info') }}
                </h2>
              </div>
              <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {{ t('profile.personal_info_desc') }}
              </p>
            </div>
          </div>
          <div class="col-span-12 lg:col-span-8">
            <UCard class="form-section-card" :ui="{ body: 'p-5 sm:p-7 md:p-10' }">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                <UFormField :label="t('profile.name')" class="w-full">
                  <UInput v-model="state.name" size="lg" class="input-premium w-full" placeholder="Ingresa tu nombre..." />
                </UFormField>

                <UFormField :label="t('profile.email')" class="w-full">
                  <UInput :value="user?.email" disabled size="lg" class="input-premium w-full opacity-60 cursor-not-allowed" />
                </UFormField>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Section: Security -->
        <div class="grid grid-cols-12 gap-6 md:gap-10">
          <div class="col-span-12 lg:col-span-4">
            <div class="sticky top-10 space-y-3 md:space-y-4">
              <div class="flex items-center gap-3 text-gold">
                <UIcon name="i-heroicons-shield-check" class="w-6 h-6 shrink-0" />
                <h2 class="text-lg md:text-xl font-black tracking-tight uppercase italic text-slate-800 dark:text-slate-200">
                  {{ t('profile.security') }}
                </h2>
              </div>
              <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {{ t('profile.security_desc') }}
              </p>
            </div>
          </div>
          <div class="col-span-12 lg:col-span-8">
            <UCard class="form-section-card" :ui="{ body: 'p-5 sm:p-7 md:p-10' }">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                <UFormField :label="t('profile.new_password')" class="w-full">
                  <UInput v-model="state.password" type="password" size="lg" class="input-premium w-full" />
                </UFormField>

                <UFormField :label="t('profile.confirm_password')" class="w-full">
                  <UInput v-model="state.password_confirmation" type="password" size="lg" class="input-premium w-full" />
                </UFormField>
              </div>
              
              <div class="flex justify-end mt-8 md:mt-10">
                <UButton 
                  type="submit" 
                  color="primary" 
                  size="lg" 
                  :loading="isUpdating" 
                  class="btn-save-premium w-full sm:w-auto justify-center"
                >
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 shrink-0" />
                  {{ t('profile.save_changes') }}
                </UButton>
              </div>
            </UCard>
          </div>
        </div>
      </form>

      <!-- Section: Danger Zone -->
      <div class="grid grid-cols-12 gap-6 md:gap-10 pt-10 border-t border-slate-100 dark:border-slate-800 mb-20">
        <div class="col-span-12 lg:col-span-4">
          <div class="sticky top-10 space-y-3 md:space-y-4">
            <div class="flex items-center gap-3 text-red-500">
              <UIcon name="i-heroicons-fire" class="w-6 h-6 shrink-0" />
              <h2 class="text-lg md:text-xl font-black tracking-tight uppercase italic text-red-600 dark:text-red-400">
                {{ t('profile.danger_zone') }}
              </h2>
            </div>
            <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {{ t('profile.danger_zone_desc') }}
            </p>
          </div>
        </div>
        <div class="col-span-12 lg:col-span-8">
          <UCard class="danger-zone-card-premium" :ui="{ body: 'p-5 sm:p-7 md:p-10' }">
            <div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left justify-between gap-6 md:gap-8">
              <div class="space-y-3">
                <h3 class="text-lg font-bold text-slate-800 dark:text-white">{{ t('profile.delete_account') }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto sm:mx-0">
                  {{ t('profile.delete_warning') }}
                </p>
              </div>
              
              <div class="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                <UButton
                  color="error"
                  variant="soft"
                  size="lg"
                  :disabled="user?.is_main_admin"
                  class="btn-delete-premium w-full sm:w-auto justify-center"
                  @click="showDeleteConfirm = true"
                >
                  {{ t('profile.delete_account') }}
                </UButton>
                
                <div v-if="user?.is_main_admin" class="restriction-notice w-full sm:w-auto text-center sm:text-left">
                  <UIcon name="i-heroicons-shield-check" class="w-4 h-4 shrink-0" />
                  <span>{{ t('profile.main_admin_delete_restricted') }}</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <UCard class="modal-premium-card" :ui="{ body: 'p-6 sm:p-8', header: 'px-6 sm:px-8 py-5 sm:py-6', footer: 'px-6 sm:px-8 py-4' }">
          <template #header>
            <div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
               <div class="modal-icon-danger shrink-0 mx-auto sm:mx-0">
                 <UIcon name="i-heroicons-exclamation-triangle" class="w-7 h-7" />
               </div>
               <div>
                 <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                   {{ t('profile.confirm_delete_title') }}
                 </h3>
                 <p class="text-slate-500 text-[10px] sm:text-xs mt-1 sm:mt-2 font-bold italic uppercase tracking-widest">{{ t('profile.critical_procedure') }}</p>
               </div>
            </div>
          </template>

          <div class="space-y-5 sm:space-y-6 text-center sm:text-left">
            <p class="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed">
              ¿Deseas proceder con la eliminación de tu cuenta? 
            </p>
            <div class="warning-box flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
               <UIcon name="i-heroicons-information-circle" class="w-5 h-5 shrink-0" />
               <p class="text-xs sm:text-sm font-medium">
                 {{ t('profile.delete_permanent_warning') }}
               </p>
            </div>
          </div>

          <template #footer>
            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <UButton variant="ghost" color="neutral" size="lg" @click="showDeleteConfirm = false" class="font-bold justify-center w-full sm:w-auto px-8">
                {{ t('blogs.form.cancel') }}
              </UButton>
              <UButton color="error" size="lg" :loading="isDeleting" @click="handleDelete" class="btn-confirm-delete justify-center w-full sm:w-auto px-10">
                {{ t('profile.confirm_delete_btn') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.profile-page-wrapper {
  background-color: #fcfcfd;
  min-height: 100vh;
}

:root.dark .profile-page-wrapper {
  background-color: #0f172a;
}

/* Avatar Styling */
.avatar-container {
  position: relative;
  width: 90px;
  height: 90px;
}

.avatar-surface {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 900;
  color: #a07c28;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 20px rgba(0,0,0,0.06);
  position: relative;
  z-index: 2;
}

:root.dark .avatar-surface {
  background: #1e293b;
  border-color: #334155;
  color: #d4af37;
}

.avatar-ring {
  position: absolute;
  inset: -6px;
  border: 2px dashed #a07c28;
  border-radius: 36px;
  opacity: 0.2;
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 4px solid #fcfcfd;
  z-index: 3;
}

:root.dark .avatar-status {
  border-color: #0f172a;
}

/* Card Styling */
.form-section-card {
  background: white;
  border-radius: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .form-section-card {
  background: #1e293b;
  border-color: #334155;
}

.form-section-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
  border-color: rgba(160, 124, 40, 0.2);
}

/* Input Styling */
.input-premium :deep(input) {
  border-radius: 1rem !important;
  height: 3rem;
  font-weight: 600;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

:root.dark .input-premium :deep(input) {
  background-color: #0f172a;
  border-color: #334155;
}

.input-premium :deep(input:focus) {
  border-color: #a07c28 !important;
  background-color: white !important;
}

/* Button Styling */
.btn-save-premium {
  border-radius: 1rem;
  height: 3.5rem;
  padding-left: 2rem;
  padding-right: 2rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  gap: 10px;
  box-shadow: 0 8px 15px rgba(160, 124, 40, 0.2);
}

/* Danger Zone Card */
.danger-zone-card-premium {
  background: #fffafa;
  border-radius: 2rem;
  border: 1px solid #fee2e2;
  transition: all 0.3s;
}

:root.dark .danger-zone-card-premium {
  background: rgba(220, 38, 38, 0.02);
  border-color: rgba(220, 38, 38, 0.15);
}

.btn-delete-premium {
  border-radius: 1rem;
  font-weight: 800;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s;
}

.restriction-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #bf8d1e;
  font-size: 0.75rem;
  font-weight: 700;
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid #fef3c7;
}

:root.dark .restriction-notice {
  background: rgba(217, 119, 6, 0.08);
  border-color: rgba(217, 119, 6, 0.15);
  color: #d4af37;
}

/* Modal Styling */
.modal-premium-card {
  border-radius: 2.5rem;
  border: none;
  background: white;
}

:root.dark .modal-premium-card {
  background: #0f172a;
}

.modal-icon-danger {
  width: 50px;
  height: 50px;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .modal-icon-danger {
  background: #450a0a;
}

.warning-box {
  display: flex;
  gap: 12px;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  padding: 1rem;
  border-radius: 1rem;
  color: #991b1b;
}

:root.dark .warning-box {
  background: rgba(153, 27, 27, 0.1);
  border-color: rgba(153, 27, 27, 0.2);
  color: #f87171;
}

.btn-confirm-delete {
  border-radius: 1rem;
  font-weight: 900;
  text-transform: uppercase;
}

.gold { color: #a07c28; }
</style>
