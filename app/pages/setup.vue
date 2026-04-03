<script setup lang="ts">
import { useApi } from '../composables/useApi';
const toast = useToast()

const state = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)

async function onSubmit() {
  if (state.password !== state.password_confirmation) {
    toast.add({ title: 'Error', description: 'Passwords do not match.', color: 'error' })
    return
  }

  loading.value = true
  try {
    await useApi('/setup/instance-bootstrap', {
      method: 'POST',
      body: state
    })
    
    toast.add({ 
      title: 'Success!', 
      description: 'System initialized. You can now login.', 
      color: 'success' 
    })
    
    navigateTo('/login')
  } catch (error: any) {
    toast.add({ 
      title: 'Initialization failed', 
      description: error.data?.message || 'Check your data (password must be at least 8 chars).', 
      color: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-linear-to-br from-primary-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
    <UCard class="w-full max-w-lg shadow-2xl overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-1.5 bg-primary-500"></div>
      
      <template #header>
        <div class="flex flex-col items-center gap-4 py-4 text-center">
          <div class="p-4 bg-primary-100 dark:bg-primary-900 rounded-full">
            <UIcon name="i-heroicons-rocket-launch" class="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              System Initialization
            </h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Create the first administrator account to start managing your Almha instance.
            </p>
          </div>
        </div>
      </template>

      <UForm :state="state" @submit="onSubmit" class="space-y-5 px-2">
        <UFormField label="Full Name" name="name" required>
          <UInput 
            v-model="state.name" 
            placeholder="John Doe" 
            icon="i-heroicons-user"
            autofocus
          />
        </UFormField>

        <UFormField label="Admin Email" name="email" required>
          <UInput 
            v-model="state.email" 
            placeholder="admin@almha.com" 
            icon="i-heroicons-envelope" 
            type="email"
          />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Password" name="password" required>
            <UInput 
              v-model="state.password" 
              type="password" 
              icon="i-heroicons-key"
              placeholder="••••••••"
            />
          </UFormField>

          <UFormField label="Confirm Password" name="password_confirmation" required>
            <UInput 
              v-model="state.password_confirmation" 
              type="password" 
              icon="i-heroicons-key"
              placeholder="••••••••"
            />
          </UFormField>
        </div>

        <UAlert
          icon="i-heroicons-shield-check"
          title="Security Information"
          description="Once this form is submitted, this setup wizard will be disabled for security reasons."
          color="primary"
          variant="soft"
          class="mt-4"
        />

        <UButton 
          type="submit" 
          block 
          size="xl" 
          :loading="loading"
          class="font-bold shadow-lg active:scale-[0.98] transition-transform"
        >
          Initialize System
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-xs text-gray-400">
          ALMHA Framework - Multi-Tenant Enterprise Solution
        </p>
      </template>
    </UCard>
  </div>
</template>
