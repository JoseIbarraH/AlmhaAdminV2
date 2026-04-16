<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const { locale, t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { user } = useAlmhaAuth()
const toast = useToast()

// Restrict access to Super Admin
onMounted(() => {
  if (!user.value?.roles?.includes('super_admin')) {
    router.push('/dashboard')
  }
})

const page = ref(1)
const searchQuery = ref('')
const debouncedSearch = ref('')
let debounceTimer: any = null

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 500)
})

interface Role {
  id: number
  name: string
}

interface UserRecord {
  id: string
  name: string
  email: string
  is_active: boolean
  roles: string[]
}

// Fetch users
const { data: response, pending, refresh } = await useAsyncData<any>(
  'users_list',
  () => useApi<any>('/users', {
    query: {
      page: page.value,
      per_page: 15,
      search: debouncedSearch.value
    },
    headers: {
      'Accept-Language': locale.value.split('-')[0] || 'es'
    }
  }),
  { watch: [page, debouncedSearch, locale] }
)

const users = computed<UserRecord[]>(() => response.value?.data || response.value?.original?.data || [])
const meta = computed(() => response.value?.meta || response.value?.original?.meta || null)

watchEffect(() => {
  console.log('USERS DEBUG - Response:', response.value)
  console.log('USERS DEBUG - Users Array:', users.value)
  console.log('USERS DEBUG - Auth User:', user.value)
})

// Columns configuration for UTable
const columns = computed(() => [
  { accessorKey: 'name', header: t('users.table.name') },
  { accessorKey: 'email', header: t('users.table.email') },
  { accessorKey: 'roles', header: t('users.table.roles') },
  { accessorKey: 'status', header: t('users.table.status') },
  { accessorKey: 'actions', header: t('users.table.actions') }
])

// --------- CRUD Modal ---------
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const availableRoles = ref<{ label: string; value: string }[]>([])

// State for User Form
const formState = ref({
  id: '',
  name: '',
  email: '',
  password: '',
  roles: [] as string[],
  is_active: true
})

// Fetch possible roles to select
const fetchRoles = async () => {
  try {
    const res = await useApi<any>('/roles')
    // Handle possible Laravel JsonResponse wrapping (original.data) or standard {data: []}
    const rawData = res?.data || res?.original?.data || (Array.isArray(res) ? res : [])

    if (Array.isArray(rawData)) {
      availableRoles.value = rawData.map((r: any) => ({
        label: t(`users.roles.${r.name}`) || r.name,
        value: r.name
      }))
    }
  } catch (e) {
    console.error('Failed to fetch roles', e)
  }
}

onMounted(() => {
  fetchRoles()
})

const openCreateModal = () => {
  isEditing.value = false
  formState.value = {
    id: '',
    name: '',
    email: '',
    password: '',
    roles: [],
    is_active: true
  }
  isModalOpen.value = true
}

const openEditModal = (u: UserRecord) => {
  isEditing.value = true
  formState.value = {
    id: u.id,
    name: u.name,
    email: u.email,
    password: '',
    roles: [...(u.roles || [])],
    is_active: !!u.is_active
  }
  isModalOpen.value = true
}

const saveUser = async () => {
  isSaving.value = true
  try {
    const payload: any = {
      name: formState.value.name,
      email: formState.value.email,
      roles: formState.value.roles,
      is_active: formState.value.is_active
    }

    if (formState.value.password) {
      payload.password = formState.value.password
    }

    if (isEditing.value) {
      await useApi(`/users/${formState.value.id}`, { method: 'POST', body: payload })
      toast.add({ title: t('users.form.success_update'), color: 'success' })
    } else {
      await useApi('/users', { method: 'POST', body: payload })
      toast.add({ title: t('users.form.success_create'), color: 'success' })
    }

    isModalOpen.value = false
    refresh()
  } catch (e: any) {
    console.error(e)
    toast.add({ title: t('users.form.error'), description: e.data?.message || e.message, color: 'error' })
  } finally {
    isSaving.value = false
  }
}

// --------- Delete Confirmation ---------
const deletingId = ref<string | null>(null)
const isDeleteModalOpen = ref(false)

const confirmDelete = (id: string) => {
  deletingId.value = id
  isDeleteModalOpen.value = true
}

const executeDelete = async () => {
  if (!deletingId.value) return
  isSaving.value = true
  try {
    await useApi(`/users/${deletingId.value}`, { method: 'DELETE' })
    toast.add({ title: t('users.form.success_delete'), color: 'primary' })
    refresh()
  } catch (e: any) {
    console.error('Delete error', e)
    toast.add({ title: 'Error', description: e.data?.message || e.message, color: 'error' })
  } finally {
    isSaving.value = false
    isDeleteModalOpen.value = false
    deletingId.value = null
  }
}
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ t('users.title') }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium">
          {{ t('users.description') }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton color="neutral" variant="solid"
          class="rounded-xl shadow-sm border border-slate-200 dark:border-slate-800" :disabled="pending"
          @click="refresh()">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" :class="{ 'animate-spin': pending }" />
        </UButton>
        <UButton color="primary" class="rounded-xl font-bold px-6 shadow-sm" @click="openCreateModal">
          <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-1" />
          {{ t('users.new') }}
        </UButton>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="flex items-center w-full max-w-sm mb-4">
      <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" size="lg" color="neutral"
        class="w-full shadow-sm rounded-xl" :placeholder="t('users.search')" :trailing="false" />
    </div>

    <!-- User Table -->
    <UCard class="premium-table-card overflow-hidden" :ui="{ body: 'p-0 sm:p-0 border-none' }">
      <UTable :data="users" :columns="columns" :loading="pending" class="w-full" :ui="{ thead: 'bg-slate-50 dark:bg-slate-900/50' }">
        <!-- User Name with "You" badge -->
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ (row.original as any).name }}</span>
            <UBadge v-if="user?.id === (row.original as any).id" color="primary" variant="soft" size="sm"
              class="font-black italic text-[10px] px-1.5 py-0">
              {{ t('users.table.you') }}
            </UBadge>
          </div>
        </template>

        <!-- Roles Badges Stacked -->
        <template #roles-cell="{ row }">
          <div class="flex flex-wrap gap-1.5 min-w-[120px]">
            <UBadge v-for="role in (row.original as any).roles" :key="role" variant="subtle" color="primary" size="xs"
              class="font-bold uppercase tracking-widest text-[10px]">
              {{ t(`users.roles.${role}`) || role }}
            </UBadge>
          </div>
        </template>

        <!-- Status -->
        <template #status-cell="{ row }">
          <UBadge :color="(row.original as any).is_active ? 'success' : 'neutral'" variant="soft" size="sm"
            class="font-bold">
            {{ (row.original as any).is_active ? t('users.status.active') : t('users.status.inactive') }}
          </UBadge>
        </template>

        <!-- Actions -->
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UButton icon="i-heroicons-pencil-square" size="sm" color="neutral" variant="ghost"
              class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" @click="openEditModal(row.original as any)"
              :disabled="user?.id === (row.original as any).id"
              :title="user?.id === (row.original as any).id ? 'Usa la página de Ajustes para tu perfil' : 'Editar usuario'" />
            <UButton icon="i-heroicons-trash" size="sm" color="error" variant="ghost"
              class="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500"
              @click="confirmDelete((row.original as any).id)" :disabled="user?.id === (row.original as any).id"
              title="No puedes eliminarte a ti mismo" />
          </div>
        </template>

        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-users" class="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 class="text-slate-500 font-bold">{{ t('users.empty') }}</h3>
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
      <template v-if="meta && meta.last_page > 1" #footer>
        <div class="flex justify-center p-4 border-t border-slate-100 dark:border-slate-800">
          <UPagination v-model="page" :total="meta.total" :page-count="15" @update:model-value="refresh" />
        </div>
      </template>
    </UCard>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">
                {{ isEditing ? t('users.form.edit_title') : t('users.form.create_title') }}
              </h3>
              <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                @click="isModalOpen = false" />
            </div>
          </template>

          <form @submit.prevent="saveUser" class="space-y-6">
            <UFormField :label="t('users.form.name')" class="w-full">
              <UInput v-model="formState.name" required class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t('users.form.email')" class="w-full">
              <UInput v-model="formState.email" type="email" required class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t('users.form.password')" :hint="isEditing ? t('users.form.password_hint') : ''"
              class="w-full">
              <UInput v-model="formState.password" type="password" :required="!isEditing" class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t('users.form.roles')" class="w-full">
              <USelectMenu v-model="formState.roles" :items="(availableRoles as any)" multiple class="w-full text-left"
                size="lg" value-attribute="value" label-attribute="label" />
            </UFormField>

            <UFormField class="w-full">
              <UCheckbox v-model="formState.is_active" :label="t('users.form.status')" />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <UButton variant="ghost" color="neutral" @click="isModalOpen = false">
                {{ t('users.form.cancel') }}
              </UButton>
              <UButton type="submit" color="primary" :loading="isSaving">
                {{ t('users.form.save') }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Modal Overlay -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <UCard :ui="{ body: 'p-8', header: 'px-8 py-6', footer: 'px-8 py-4' }">
          <template #header>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white">{{ t('users.delete_confirm.title') }}</h3>
              </div>
            </div>
          </template>

          <p class="text-slate-600 dark:text-slate-300 font-medium">
            {{ t('users.delete_confirm.desc') }}
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" color="neutral" @click="isDeleteModalOpen = false">{{ t('users.form.cancel') }}
              </UButton>
              <UButton color="error" :loading="isSaving" @click="executeDelete">{{ t('users.delete_confirm.btn') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.premium-table-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

:root.dark .premium-table-card {
  background: #1e293b;
  border-color: #334155;
}

:deep(thead) {
  background-color: #f8fafc;
}

:root.dark :deep(thead) {
  background-color: #0f172a;
}

:deep(th) {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  padding: 1rem 1.5rem;
}

:deep(td) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

:root.dark :deep(td) {
  border-bottom-color: #334155;
}
</style>
