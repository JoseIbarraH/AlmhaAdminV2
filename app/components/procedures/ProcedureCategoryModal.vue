<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const { t, locale } = useI18n({ useScope: 'global' })
const toast = useToast()

const currentLang = computed(() => locale.value.split('-')[0] || 'es')

const currentLangLabel = computed(() => {
  switch (currentLang.value) {
    case 'en': return 'English (EN)'
    default: return 'Español (ES)'
  }
})

watch(locale, () => {
  if (isOpen.value) {
    fetchCategories()
    form.value.baseLang = currentLang.value
  }
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// UI State
const isSubmitting = ref(false)
const isLoadingCategories = ref(false)
const searchQuery = ref('')
const selectedId = ref<number | null>(null)

// Data State
const categories = ref<any[]>([])

// Form State
const form = ref({
  id: null as number | null,
  code: '',
  title: '',
  baseLang: currentLang.value
})

const fetchCategories = async () => {
  isLoadingCategories.value = true
  try {
    const response = await useApi<any>('/procedure-categories', {
      headers: {
        'Accept-Language': locale.value.split('-')[0] || 'es'
      }
    })
    categories.value = response.data.map((cat: any) => ({
      id: cat.id,
      code: cat.code,
      title: cat.name || cat.code
    }))
    
    // Auto-select if first time or requested
    if (categories.value.length > 0 && selectedId.value === null) {
      selectCategory(categories.value[0])
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: t('procedures.categories.errorLoading'),
      color: 'error'
    })
  } finally {
    isLoadingCategories.value = false
  }
}

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(cat => 
    cat.title.toLowerCase().includes(q) || cat.code.toLowerCase().includes(q)
  )
})

const selectCategory = (category: any) => {
  selectedId.value = category.id
  form.value = {
    id: category.id,
    code: category.code,
    title: category.title,
    baseLang: currentLang.value
  }
}

const resetForm = () => {
  selectedId.value = null
  form.value = {
    id: null,
    code: '',
    title: '',
    baseLang: currentLang.value
  }
}

const saveCategory = async () => {
  if (!form.value.title.trim()) return

  isSubmitting.value = true
  try {
    const isEdit = !!form.value.id
    const endpoint = isEdit ? `/procedure-categories/${form.value.id}` : '/procedure-categories'
      
    const payload: Record<string, string> = {
      title: form.value.title,
      baseLang: form.value.baseLang
    }

    // Only send code when editing (backend auto-generates on create)
    if (isEdit && form.value.code) {
      payload.code = form.value.code
    }

    await useApi(endpoint, {
      method: 'POST', 
      body: payload
    })

    toast.add({
      title: 'Éxito',
      description: isEdit ? t('procedures.categories.successUpdate') : t('procedures.categories.successSave'),
      color: 'success'
    })

    emit('updated')
    await fetchCategories()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Error al guardar.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

const deleteCategory = async (id: number) => {
  if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return

  try {
    await useApi(`/procedure-categories/${id}`, { method: 'DELETE' })
    toast.add({ title: t('procedures.categories.successDelete'), description: t('procedures.categories.successDelete'), color: 'success' })
    emit('updated')
    
    // If deleted the selected one, reset form
    if (selectedId.value === id) {
      resetForm()
    }
    await fetchCategories()
  } catch (error: any) {
    toast.add({ title: 'Error', description: 'No se pudo eliminar.', color: 'error' })
  }
}

watch(isOpen, (newVal) => {
  if (newVal) {
    fetchCategories()
  }
})
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'w-full sm:max-w-4xl' }">
    <template #content>
      <UCard class="rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden" :ui="{ body: 'p-0' }">
        <!-- High-End Split View Layout -->
      <div class="split-view flex flex-col md:flex-row min-h-[500px] max-h-[85vh]">
        
        <!-- Sidebar: List & Search -->
        <aside class="w-full md:w-[350px] max-h-[220px] md:max-h-none border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <header class="p-6 pb-2">
            <h3 class="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-tag" class="text-gold" />
              {{ t('procedures.categories.modalTitle') }}
            </h3>
            
            <div class="space-y-3">
              <div class="relative group">
                <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-3 text-slate-400 group-focus-within:text-gold transition-colors" />
                <UInput v-model="searchQuery" :placeholder="t('procedures.categories.searchPlaceholder')" variant="none" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 rounded-xl w-full text-sm shadow-sm focus:border-gold" />
              </div>
              
              <UButton icon="i-heroicons-plus" color="primary" block size="md" rounded="xl" class="font-bold" @click="resetForm">
                {{ t('procedures.categories.newCategory') }}
              </UButton>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar" v-auto-animate>
            <div v-if="isLoadingCategories && categories.length === 0" class="flex justify-center items-center h-40">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-gold/30" />
            </div>

            <div v-else-if="filteredCategories.length === 0" class="text-center py-20 opacity-30">
              <UIcon name="i-heroicons-inbox" class="text-5xl mx-auto mb-2" />
              <p class="text-xs uppercase tracking-widest font-bold">{{ t('procedures.categories.emptyState') }}</p>
            </div>

            <button 
              v-for="cat in filteredCategories" 
              :key="cat.id" 
              class="category-nav-item w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center justify-between group"
              :class="[selectedId === cat.id ? 'is-selected' : 'hover:bg-slate-100 dark:hover:bg-slate-800']"
              @click="selectCategory(cat)"
            >
              <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-sm truncate" :class="[selectedId === cat.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300']">
                  {{ cat.title }}
                </h4>
                <p class="text-[10px] uppercase font-mono tracking-tighter text-slate-400 truncate mt-0.5">UID: {{ cat.code }}</p>
              </div>
              
              <UIcon name="i-heroicons-chevron-right" class="text-slate-300 group-hover:text-gold transition-all" :class="{ 'translate-x-1 opacity-100': selectedId === cat.id, 'opacity-0': selectedId !== cat.id }" />
            </button>
          </div>
        </aside>

        <!-- Main Area: Form -->
        <main class="flex-1 flex flex-col bg-white dark:bg-slate-900">
          <header class="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {{ form.id ? t('procedures.categories.editTitle') : t('procedures.categories.createTitle') }}
              </h2>
              <p class="text-slate-400 text-sm mt-1">{{ t('procedures.categories.formDescription') }}</p>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" rounded="full" @click="isOpen = false" />
          </header>

          <div class="flex-1 overflow-y-auto p-4 pb-24 md:p-10">
            <div class="max-w-xl mx-auto space-y-12">
              
              <!-- Form Sections -->
              <section class="form-vibe-section">
                <div class="flex items-center gap-2 mb-6">
                  <div class="h-6 w-1 bg-gold rounded-full" />
                  <h3 class="text-xs uppercase tracking-widest font-black text-slate-400">{{ t('procedures.categories.mainData') }}</h3>
                </div>

                <div class="space-y-8">
                  <div class="field-premium">
                    <label class="label-premium">{{ t('procedures.categories.labelName') }}</label>
                    <UInput v-model="form.title" placeholder="Ej: Cirugía Facial" size="xl" variant="none" class="input-premium" />
                    <p class="help-premium">{{ t('procedures.categories.helpName') }}</p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    <div v-if="form.id" class="field-premium opacity-60">
                      <label class="label-premium">{{ t('procedures.categories.labelSlug') }}</label>
                      <UInput v-model="form.code" disabled variant="none" class="input-premium font-mono text-sm" />
                    </div>
                    <div class="field-premium opacity-60">
                      <label class="label-premium">{{ t('procedures.categories.labelLang') }}</label>
                      <UInput :model-value="currentLangLabel" disabled size="xl" variant="none" class="input-premium text-sm" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <!-- Footer Actions -->
          <footer class="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center sticky bottom-0 z-10 gap-4 sm:gap-0">
            <div v-if="form.id">
              <UButton color="error" variant="ghost" size="md" rounded="xl" @click="deleteCategory(form.id)" icon="i-heroicons-trash">
                {{ t('procedures.categories.btnDelete') }}
              </UButton>
            </div>
            <div v-else />

            <div class="flex gap-3">
              <UButton color="neutral" variant="subtle" size="lg" rounded="xl" @click="resetForm" class="px-8">
                {{ t('procedures.categories.btnClear') }}
              </UButton>
              <UButton color="primary" size="lg" rounded="xl" class="px-10 font-bold" @click="saveCategory" :loading="isSubmitting">
                {{ form.id ? t('procedures.categories.btnSave') : t('procedures.categories.btnCreate') }}
              </UButton>
            </div>
          </footer>
        </main>
      </div>
    </UCard>
    </template>
  </UModal>
</template>

<style scoped>
.text-gold {
  color: #a07c28;
}
:root.dark .text-gold {
  color: #d4af37;
}

.category-nav-item.is-selected {
  background: white;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(160, 124, 40, 0.1);
  transform: translateX(4px);
}

:root.dark .category-nav-item.is-selected {
  background: #1e293b;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(160, 124, 40, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
:root.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}

/* Premium Form Elements */
.field-premium {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-premium {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 900;
  color: #94a3b8;
}

.input-premium {
  padding: 0;
  font-size: 1.125rem;
  font-weight: 700;
  border-bottom: 2px solid #f1f5f9;
  border-radius: 0;
  transition: all 0.3s;
}

:root.dark .input-premium {
  border-bottom-color: #1e293b;
}

.input-premium:focus-within {
  border-bottom-color: #a07c28;
  padding-left: 8px;
}

.help-premium {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 768px) {
  .split-view {
    min-height: auto;
    max-height: 92vh;
    height: auto;
  }
  
  .category-nav-item.is-selected {
    transform: none;
  }

  .field-premium .input-premium {
    font-size: 1rem;
  }
}
</style>
