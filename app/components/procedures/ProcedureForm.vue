<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { SelectItem } from '@nuxt/ui'
import ProcedureCategoryModal from './ProcedureCategoryModal.vue'

interface SectionItem {
  type: string
  title: string
  contentOne: string
  contentTwo: string
  order: number
  image: File | null
  imagePreview: string | null
}

interface FAQItem {
  question: string
  answer: string
  order: number
}

interface PreparationStep {
  title: string
  description: string
  order: number
}

interface RecoveryPhase {
  period: string
  title: string
  description: string
  order: number
}

interface PostOpInstruction {
  content: string
  order: number
}

interface GalleryPair {
  id: number | string // pair identifier
  before: {
    image: File | null
    preview: string | null
  }
  after: {
    image: File | null
    preview: string | null
  }
  order: number
}

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'change-language'])

// Tabs Configuration
const activeTab = ref('general')
const tabs = computed(() => [
  { id: 'general', label: t('procedures.form.tabs.general'), icon: 'i-heroicons-information-circle' },
  { id: 'sections', label: t('procedures.form.tabs.sections'), icon: 'i-heroicons-paper-clip' },
  { id: 'preparation', label: t('procedures.form.tabs.preparation'), icon: 'i-heroicons-clock' },
  { id: 'recovery', label: t('procedures.form.tabs.recovery'), icon: 'i-heroicons-heart' },
  { id: 'instructions', label: t('procedures.form.faq.instructions.title'), icon: 'i-heroicons-shield-check' },
  { id: 'faq', label: t('procedures.form.faq.questions.title'), icon: 'i-heroicons-question-mark-circle' },
  { id: 'gallery', label: t('procedures.form.tabs.gallery'), icon: 'i-heroicons-photo' }
])

// Helper for fixed sections
const getEmptySection = (type: string): SectionItem => ({
  type,
  title: '',
  contentOne: '',
  contentTwo: '',
  image: null,
  imagePreview: null
})

const initSections = (): SectionItem[] => {
  const types = ['what_is', 'technique', 'recovery']
  const sections = types.map((type) => getEmptySection(type))

  if (props.initialData?.sections) {
    props.initialData.sections.forEach((s: any) => {
      const idx = types.indexOf(s.type)
      if (idx !== -1) {
        const existing = sections[idx]!
        sections[idx] = {
          ...existing,
          title: s.translations?.[0]?.title || '',
          contentOne: s.translations?.[0]?.content_one || '',
          contentTwo: s.translations?.[0]?.content_two || '',
          imagePreview: s.image || null,
          image: null
        }
      }
    })
  }
  return sections
}

// Form State
const form = ref({
  title: props.initialData?.translations?.[0]?.title || '',
  subtitle: props.initialData?.translations?.[0]?.subtitle || '',
  categoryCode: props.initialData?.categoryCode || '',
  status: props.initialData?.status || 'draft',
  baseLang: props.initialData?.base_lang || 'es',
  image: null as File | null,

  sections: initSections(),

  faqs: (props.initialData?.faqs?.map((f: any, i: number) => ({
    question: f.translations?.[0]?.question || '',
    answer: f.translations?.[0]?.answer || '',
    order: f.order ?? i
  })) || []) as FAQItem[],

  preparationSteps: (props.initialData?.preparationSteps?.map((ps: any, i: number) => ({
    title: ps.translations?.[0]?.title || '',
    description: ps.translations?.[0]?.description || '',
    order: ps.order ?? i
  })) || []) as PreparationStep[],

  recoveryPhases: (props.initialData?.recoveryPhases?.map((rp: any, i: number) => ({
    period: rp.translations?.[0]?.period || '',
    title: rp.translations?.[0]?.title || '',
    description: rp.translations?.[0]?.description || '',
    order: rp.order ?? i
  })) || []) as RecoveryPhase[],

  // Categorized instructions
  postOpDos: (props.initialData?.postoperativeInstructions
    ?.filter((pi: any) => pi.type === 'do')
    .map((pi: any, i: number) => ({ content: pi.translations?.[0]?.content || '', order: pi.order ?? i })) || []) as PostOpInstruction[],

  postOpDonts: (props.initialData?.postoperativeInstructions
    ?.filter((pi: any) => pi.type === 'dont')
    .map((pi: any, i: number) => ({ content: pi.translations?.[0]?.content || '', order: pi.order ?? i })) || []) as PostOpInstruction[],

  gallery: (() => {
    if (!props.initialData?.gallery) return [] as GalleryPair[]
    
    const pairs: Record<string, any> = {}
    props.initialData.gallery.forEach((g: any) => {
      const pId = g.pair_id || Date.now() + Math.floor(Math.random() * 1000)
      if (!pairs[pId]) {
        pairs[pId] = {
          id: pId,
          before: { image: null, preview: null },
          after: { image: null, preview: null },
          order: g.order || 0
        }
      }
      if (g.type === 'before') {
        pairs[pId].before.preview = g.path
      } else if (g.type === 'after') {
        pairs[pId].after.preview = g.path
      }
    })
    return Object.values(pairs).sort((a, b) => a.order - b.order) as GalleryPair[]
  })()
})

// Emit language change to parent to trigger re-fetch in Edit mode
watch(() => form.value.baseLang, (newLang) => {
  if (props.isEdit) {
    emit('change-language', newLang)
  }
})

// Update form when initialData changes (for reactive re-fetches)
watch(() => props.initialData, (newData) => {
  if (!newData || !props.isEdit) return

  // Basic Information
  form.value.title = newData.translations?.[0]?.title || ''
  form.value.subtitle = newData.translations?.[0]?.subtitle || ''
  form.value.categoryCode = newData.categoryCode || ''
  form.value.status = newData.status || 'draft'
  // We maintain form.value.baseLang as it was what triggered the refresh

  // Sections
  const types = ['what_is', 'technique', 'recovery']
  form.value.sections = types.map((type, i) => {
    const s = newData.sections?.find((sec: any) => sec.type === type)
    return {
      type,
      title: s?.translations?.[0]?.title || '',
      contentOne: s?.translations?.[0]?.content_one || '',
      contentTwo: s?.translations?.[0]?.content_two || '',
      imagePreview: s?.image || null,
      image: null
    }
  })

  // FAQs
  form.value.faqs = (newData.faqs?.map((f: any, i: number) => ({
    question: f.translations?.[0]?.question || '',
    answer: f.translations?.[0]?.answer || '',
    order: f.order ?? i
  })) || []) as FAQItem[]

  // Preparation Steps
  form.value.preparationSteps = (newData.preparationSteps?.map((ps: any, i: number) => ({
    title: ps.translations?.[0]?.title || '',
    description: ps.translations?.[0]?.description || '',
    order: ps.order ?? i
  })) || []) as PreparationStep[]

  // Recovery Phases
  form.value.recoveryPhases = (newData.recoveryPhases?.map((rp: any, i: number) => ({
    period: rp.translations?.[0]?.period || '',
    title: rp.translations?.[0]?.title || '',
    description: rp.translations?.[0]?.description || '',
    order: rp.order ?? i
  })) || []) as RecoveryPhase[]

  // Instructions
  form.value.postOpDos = (newData.postoperativeInstructions
    ?.filter((pi: any) => pi.type === 'do')
    .map((pi: any, i: number) => ({ content: pi.translations?.[0]?.content || '', order: pi.order ?? i })) || []) as PostOpInstruction[]

  form.value.postOpDonts = (newData.postoperativeInstructions
    ?.filter((pi: any) => pi.type === 'dont')
    .map((pi: any, i: number) => ({ content: pi.translations?.[0]?.content || '', order: pi.order ?? i })) || []) as PostOpInstruction[]

  // Gallery
  if (newData.gallery) {
    const pairs: Record<string, any> = {}
    newData.gallery.forEach((g: any) => {
      const pId = g.pair_id || Date.now() + Math.floor(Math.random() * 1000)
      if (!pairs[pId]) {
        pairs[pId] = {
          id: pId,
          before: { image: null, preview: null },
          after: { image: null, preview: null },
          order: g.order || 0
        }
      }
      if (g.type === 'before') {
        pairs[pId].before.preview = g.path
      } else if (g.type === 'after') {
        pairs[pId].after.preview = g.path
      }
    })
    form.value.gallery = Object.values(pairs).sort((a: any, b: any) => a.order - b.order) as GalleryPair[]
  } else {
    form.value.gallery = []
  }

  // Featured Image Preview
  featuredImagePreview.value = newData.image || null
}, { deep: true })

// Categories
const isCategoryModalOpen = ref(false)
const categories = ref<{ value: string, label: string }[]>([])
const loadingCategories = ref(false)
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const response = await useApi<any>('/procedure-categories', {
      headers: {
        'Accept-Language': form.value.baseLang
      }
    })
    categories.value = response.data.map((cat: any) => ({
      value: cat.code,
      label: cat.translations?.[0]?.title || cat.code
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
  } finally {
    loadingCategories.value = false
  }
}

const { t, locale } = useI18n()

watch(() => form.value.baseLang, () => {
  fetchCategories()
})
watch(locale, (newLocale) => {
  form.value.baseLang = newLocale.split('-')[0] || 'es'
  fetchCategories()
})

onMounted(fetchCategories)

// Image Previews
const featuredImagePreview = ref(props.initialData?.image || null)
const handleFeaturedImage = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    form.value.image = file
    featuredImagePreview.value = URL.createObjectURL(file)
  }
}

// Dynamic Lists Management
const addItem = (listKey: string, payload: any) => {
  const list = (form.value as any)[listKey]
  list.push({ ...payload, order: list.length })
}
const removeItem = (listKey: string, index: number) => {
  const list = (form.value as any)[listKey]
  list.splice(index, 1)
  list.forEach((item: any, i: number) => {
    item.order = i
  })
}

const addFaq = () => addItem('faqs', { question: '', answer: '' })
const addStep = () => addItem('preparationSteps', { title: '', description: '' })
const addPhase = () => addItem('recoveryPhases', { period: '', title: '', description: '' })
const addDo = () => addItem('postOpDos', { content: '' })
const addDont = () => addItem('postOpDonts', { content: '' })
const addGalleryPair = () => {
  form.value.gallery.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    before: { image: null, preview: null },
    after: { image: null, preview: null },
    order: form.value.gallery.length
  })
}

const removeGalleryPair = (idx: number) => {
  form.value.gallery.splice(idx, 1)
  form.value.gallery.forEach((p, i) => p.order = i)
}

const handlePairImage = (idx: number, type: 'before' | 'after', e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file && form.value.gallery[idx]) {
    form.value.gallery[idx][type].image = file
    form.value.gallery[idx][type].preview = URL.createObjectURL(file)
  }
}


const handleSectionImage = (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  const section = form.value.sections[index]
  if (file && section) {
    section.image = file
    section.imagePreview = URL.createObjectURL(file)
  }
}

const handleSubmit = () => {
  const formData = new FormData()
  formData.append('title', form.value.title)
  formData.append('subtitle', form.value.subtitle)
  formData.append('categoryCode', form.value.categoryCode)
  formData.append('status', form.value.status)
  formData.append('baseLang', form.value.baseLang)

  if (form.value.image) formData.append('image', form.value.image)

  form.value.sections.forEach((s: SectionItem, i: number) => {
    formData.append(`sections[${i}][type]`, s.type)
    formData.append(`sections[${i}][title]`, s.title)
    formData.append(`sections[${i}][contentOne]`, s.contentOne)
    formData.append(`sections[${i}][contentTwo]`, s.contentTwo)
    if (s.image) formData.append(`sections[${i}][image]`, s.image)
  })

  form.value.faqs.forEach((f: FAQItem, i: number) => {
    formData.append(`faqs[${i}][question]`, f.question)
    formData.append(`faqs[${i}][answer]`, f.answer)
    formData.append(`faqs[${i}][order]`, String(f.order))
  })

  form.value.preparationSteps.forEach((ps: PreparationStep, i: number) => {
    formData.append(`preparationSteps[${i}][title]`, ps.title)
    formData.append(`preparationSteps[${i}][description]`, ps.description)
    formData.append(`preparationSteps[${i}][order]`, String(ps.order))
  })

  form.value.recoveryPhases.forEach((rp: RecoveryPhase, i: number) => {
    formData.append(`recoveryPhases[${i}][period]`, rp.period)
    formData.append(`recoveryPhases[${i}][title]`, rp.title)
    formData.append(`recoveryPhases[${i}][description]`, rp.description)
    formData.append(`recoveryPhases[${i}][order]`, String(rp.order))
  })

  // Combine Dos and Donts
  const groupedInstructions = [
    ...form.value.postOpDos.map((pi: PostOpInstruction) => ({ ...pi, type: 'do' })),
    ...form.value.postOpDonts.map((pi: PostOpInstruction) => ({ ...pi, type: 'dont' }))
  ]
  groupedInstructions.forEach((pi: { type: string, content: string, order: number }, i: number) => {
    formData.append(`postoperativeInstructions[${i}][type]`, pi.type)
    formData.append(`postoperativeInstructions[${i}][content]`, pi.content)
    formData.append(`postoperativeInstructions[${i}][order]`, String(pi.order))
  })

  form.value.gallery.forEach((pair: GalleryPair, i: number) => {
    // Send before
    formData.append(`gallery[${i * 2}][type]`, 'before')
    formData.append(`gallery[${i * 2}][order]`, String(i))
    formData.append(`gallery[${i * 2}][pairId]`, String(pair.id))
    if (pair.before.image) formData.append(`gallery[${i * 2}][path]`, pair.before.image)

    // Send after
    formData.append(`gallery[${i * 2 + 1}][type]`, 'after')
    formData.append(`gallery[${i * 2 + 1}][order]`, String(i))
    formData.append(`gallery[${i * 2 + 1}][pairId]`, String(pair.id))
    if (pair.after.image) formData.append(`gallery[${i * 2 + 1}][path]`, pair.after.image)
  })

  emit('submit', formData)
}

const getSectionLabel = (type: string) => {
  switch (type) {
    case 'what_is': return t('procedures.form.sections.whatIs')
    case 'technique': return t('procedures.form.sections.technique')
    case 'recovery': return t('procedures.form.sections.recovery')
    default: return ''
  }
}

const getSectionIcon = (type: string) => {
  switch (type) {
    case 'what_is': return 'i-heroicons-information-circle'
    case 'technique': return 'i-heroicons-sparkles'
    case 'recovery': return 'i-heroicons-heart'
    default: return 'i-heroicons-paper-clip'
  }
}

const getSectionColor = (type: string) => {
  switch (type) {
    case 'what_is': return 'text-blue-500'
    case 'technique': return 'text-gold'
    case 'recovery': return 'text-rose-500'
    default: return 'text-slate-400'
  }
}

const getSectionOrderLabel = (idx: number) => {
  return `Módulo 0${idx + 1}`
}

const statusItems = ref<SelectItem[]>([
  { label: t('procedures.form.general.published'), value: 'published' },
  { label: t('procedures.form.general.draft'), value: 'draft' }
])
</script>

<template>
  <form @submit.prevent="handleSubmit" class="procedure-form">
    <!-- Premium Tab Switcher -->
    <div class="tabs-premium-nav">
      <div class="tabs-glass-wrapper">
        <button v-for="tab in tabs" :key="tab.id" type="button" class="nav-tab-btn"
          :class="{ 'is-active': activeTab === tab.id }" @click="activeTab = tab.id">
          <UIcon :name="tab.icon" class="nav-tab-icon" />
          <span class="nav-tab-label">{{ tab.label }}</span>
          <div v-if="activeTab === tab.id" class="active-pill" />
        </button>
      </div>
    </div>

    <!-- Active Tab Content -->
    <div class="main-content-area">
      <!-- General Tab -->
      <Transition name="fade-slide" mode="out-in">
        <section v-if="activeTab === 'general'" key="general" class="tab-pane">
          <div class="pane-grid-v2">
            <!-- Form Body (Hero Style) -->
            <div class="pane-form-body-v2">
              <div class="premium-card-v2">
                <header class="card-header-iconic">
                  <div class="header-vibe-badge">Step 01</div>
                  <UIcon name="i-heroicons-information-circle" class="header-icon-main text-blue-500" />
                  <h3 class="card-title-premium">{{ t('procedures.form.tabs.general') }}</h3>
                </header>

                <div class="space-y-10 mt-10">
                  <div class="hero-field-group">
                    <label class="premium-hero-label">{{ t('procedures.form.general.title') }}</label>
                    <UInput v-model="form.title" :placeholder="t('procedures.form.general.titlePlaceholder')" size="xl"
                      class="premium-hero-input" variant="none" />
                    <p class="hero-field-help">Este será el título principal visible para tus pacientes.</p>
                  </div>

                  <div class="hero-field-group">
                    <label class="premium-hero-label">{{ t('procedures.form.general.subtitle') }}</label>
                    <UTextarea v-model="form.subtitle" :placeholder="t('procedures.form.general.subtitlePlaceholder')"
                      :rows="4" class="premium-hero-textarea" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    <div class="hero-field-group">
                      <label class="premium-hero-label">{{ t('procedures.form.general.category') }}</label>
                      <div class="flex items-center gap-2">
                        <USelectMenu v-model="form.categoryCode" :items="categories" value-key="value"
                          :search-input="{ placeholder: t('procedures.categories.searchPlaceholder') }"
                          :placeholder="t('procedures.form.general.selectCategory')"
                          :loading="loadingCategories" size="xl" class="premium-hero-select flex-1" rounded="xl" />
                        <UButton icon="i-heroicons-cog-6-tooth" color="neutral" variant="soft" @click="isCategoryModalOpen = true" :title="t('procedures.categories.modalTitle')" />
                      </div>
                    </div>

                    <div class="hero-field-group">
                      <label class="premium-hero-label">{{ t('procedures.form.general.status') }}</label>
                      <USelect 
                        v-model="form.status" 
                        :items="statusItems" 
                        size="xl" 
                        class="premium-hero-select" 
                        rounded="xl" 
                      />
                    </div>

                    <div class="hero-field-group">
                      <label class="premium-hero-label">{{ t('procedures.categories.labelLang', 'Idioma del contenido') }}</label>
                      <UInput 
                        :model-value="locale === 'es' ? 'Español (ES)' : 'English (EN)'" 
                        readonly 
                        icon="i-heroicons-language" 
                        size="xl" 
                        class="premium-hero-input-readonly" 
                        rounded="xl" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tab Nav Buttons -->
              <div class="tab-internal-nav mt-12">
                <div /> <!-- spacer -->
                <UButton color="primary" variant="subtle" size="xl" rounded="xl" @click="activeTab = 'sections'"
                  class="px-10 font-bold">
                  {{ t('procedures.form.pagination.next') }}
                  <UIcon name="i-heroicons-arrow-right" class="ml-2" />
                </UButton>
              </div>
            </div>

            <!-- Sidebar (Hero Plate) -->
            <div class="pane-sidebar-v2">
              <div class="premium-card-v2 sticky top-8">
                <header class="card-header-iconic mb-6">
                  <UIcon name="i-heroicons-photo" class="header-icon-main text-gold" />
                  <h3 class="card-title-premium">{{ t('procedures.form.general.image') }}</h3>
                </header>

                <div class="hero-image-wrapper">
                  <div class="hero-image-plate" :class="{ 'has-image': !!featuredImagePreview }">
                    <img v-if="featuredImagePreview" :src="featuredImagePreview" alt="Main" class="hero-preview-img" />
                    <div v-else class="hero-upload-vibe">
                      <div class="vibe-circle">
                        <UIcon name="i-heroicons-camera" class="vibe-icon-xl" />
                      </div>
                      <p class="vibe-text">HAZ CLIC PARA SUBIR LA IMAGEN PRINCIPAL</p>
                      <span class="vibe-subtext">Calidad recomendada: 1200x800px</span>
                    </div>
                    <label class="hero-label-overlay">
                      <input type="file" class="hidden" accept="image/*" @change="handleFeaturedImage" />
                    </label>
                    <button v-if="featuredImagePreview" type="button" class="hero-remove-btn"
                      @click.stop="featuredImagePreview = null; form.image = null">
                      <UIcon name="i-heroicons-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Sections Tab (Premium Redesign) -->
        <section v-else-if="activeTab === 'sections'" key="sections" class="tab-pane">
          <div class="list-head text-center max-w-2xl mx-auto mb-10">
            <h2 class="pane-heading text-3xl font-black mb-2">{{ t('procedures.form.tabs.sections') }}</h2>
            <p class="pane-subheading text-slate-500 text-lg">{{ t('procedures.form.sections.empty') }}</p>
          </div>

          <div class="sections-premium-stack space-y-12 mt-10">
            <div v-for="(section, idx) in form.sections" :key="section.type" class="section-premium-card-v2">
              <!-- Module Header -->
              <header class="section-card-header">
                <div class="header-left">
                  <div class="order-badge">{{ getSectionOrderLabel(idx) }}</div>
                  <h3 class="section-type-text">{{ getSectionLabel(section.type) }}</h3>
                </div>
                <UIcon :name="getSectionIcon(section.type)"
                  :class="['header-icon-main', getSectionColor(section.type)]" />
              </header>

              <div class="section-card-content">
                <!-- Large Image Preview -->
                <div class="section-visual-side">
                  <div class="premium-image-plate">
                    <img v-if="section.imagePreview" :src="section.imagePreview" class="main-img" />
                    <div v-else class="empty-plate-vibe">
                      <UIcon name="i-heroicons-camera" class="text-4xl opacity-20" />
                      <span class="text-xs uppercase tracking-widest font-bold opacity-30 mt-2">{{ t('procedures.form.sections.uploadVisual') }}</span>
                    </div>
                    <label class="full-screen-overlay">
                      <input type="file" class="hidden" @change="handleSectionImage(idx as number, $event)" />
                    </label>
                  </div>
                </div>

                <!-- Detailed Form Side -->
                <div class="section-details-side">
                  <div class="field-group">
                    <label class="premium-field-label">{{ t('procedures.form.sections.title') }}</label>
                    <UInput v-model="section.title" size="xl" placeholder="..." class="field-input-premium" />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div class="field-group">
                      <label class="premium-field-label">{{ t('procedures.form.sections.contentOne') }}</label>
                      <UTextarea v-model="section.contentOne" :rows="4" class="field-textarea-premium" />
                    </div>
                    <div class="field-group">
                      <label class="premium-field-label">{{ t('procedures.form.sections.contentTwo') }}</label>
                      <UTextarea v-model="section.contentTwo" :rows="4" class="field-textarea-premium" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="tab-internal-nav mt-12">
            <UButton variant="ghost" color="neutral" @click="activeTab = 'general'">
              {{ t('procedures.form.pagination.prev') }}
            </UButton>
            <UButton color="primary" variant="subtle" @click="activeTab = 'preparation'">
              {{ t('procedures.form.pagination.next') }}
            </UButton>
          </div>
        </section>

        <!-- Preparation Tab -->
        <section v-else-if="activeTab === 'preparation'" key="preparation" class="tab-pane">
          <div class="max-w-4xl mx-auto">
            <header class="tab-header-v3 mb-10 flex justify-between items-end">
              <div>
                <h2 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ t('procedures.form.preparation.steps.title') }}</h2>
                <p class="text-slate-500 mt-2">{{ t('procedures.form.preparation.steps.description') }}</p>
              </div>
              <UButton @click="addStep" color="primary" variant="soft" icon="i-heroicons-plus-circle" size="lg" rounded="xl" class="font-bold">
                {{ t('procedures.form.preparation.steps.add') }}
              </UButton>
            </header>

            <div class="stepper-vertical-wrapper" v-auto-animate>
              <div v-for="(step, idx) in form.preparationSteps" :key="idx" class="stepper-item-v3">
                <div class="stepper-aside">
                  <div class="stepper-node-bubble preparation-node">
                    <span class="node-number">{{ idx + 1 }}</span>
                  </div>
                  <div v-if="idx < form.preparationSteps.length - 1" class="stepper-connector-line" />
                </div>
                
                <div class="stepper-content-card glass-card-v3">
                  <div class="flex items-center gap-4 mb-4">
                    <UInput v-model="step.title" :placeholder="t('procedures.form.preparation.steps.stepTitle')"
                      variant="none" class="stepper-title-input flex-1" />
                    <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm" @click="removeItem('preparationSteps', idx as number)" class="opacity-30 hover:opacity-100" />
                  </div>
                  <UTextarea v-model="step.description"
                    :placeholder="t('procedures.form.preparation.steps.stepDescription')" :rows="3"
                    variant="none" class="stepper-desc-textarea w-full" />
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="form.preparationSteps.length === 0" class="empty-stepper-vibe">
                <div class="vibe-icon-wrapper">
                  <UIcon name="i-heroicons-clock" class="text-4xl text-slate-300" />
                </div>
                <p>{{ t('procedures.form.preparation.steps.empty') }}</p>
              </div>
            </div>

            <div class="tab-internal-nav mt-12">
              <UButton variant="ghost" color="neutral" size="xl" @click="activeTab = 'sections'">
                {{ t('procedures.form.pagination.prev') }}
              </UButton>
              <UButton color="primary" variant="subtle" size="xl" rounded="xl" @click="activeTab = 'recovery'" class="px-8 font-bold">
                {{ t('procedures.form.pagination.next') }}
                <UIcon name="i-heroicons-arrow-right" class="ml-2" />
              </UButton>
            </div>
          </div>
        </section>

        <!-- Recovery Tab -->
        <section v-else-if="activeTab === 'recovery'" key="recovery" class="tab-pane">
          <div class="max-w-4xl mx-auto">
            <header class="tab-header-v3 mb-10 flex justify-between items-end">
              <div>
                <h2 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ t('procedures.form.recovery.phases.title') }}</h2>
                <p class="text-slate-500 mt-2">{{ t('procedures.form.recovery.phases.description') }}</p>
              </div>
              <UButton @click="addPhase" color="primary" variant="soft" icon="i-heroicons-plus-circle" size="lg" rounded="xl" class="font-bold">
                {{ t('procedures.form.recovery.phases.add') }}
              </UButton>
            </header>

            <div class="stepper-vertical-wrapper" v-auto-animate>
              <div v-for="(phase, idx) in form.recoveryPhases" :key="idx" class="stepper-item-v3">
                <div class="stepper-aside">
                  <div class="stepper-node-bubble recovery-node">
                    <span class="node-number">{{ idx + 1 }}</span>
                  </div>
                  <div v-if="idx < form.recoveryPhases.length - 1" class="stepper-connector-line" />
                </div>
                
                <div class="stepper-content-card glass-card-v3">
                  <div class="grid grid-cols-[140px_1fr_40px] items-center gap-6 mb-4">
                    <UInput v-model="phase.period" :placeholder="t('procedures.form.recovery.phases.period')"
                      variant="none" class="stepper-period-input" />
                    <UInput v-model="phase.title" :placeholder="t('procedures.form.recovery.phases.phaseTitle')"
                      variant="none" class="stepper-title-input" />
                    <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm" @click="removeItem('recoveryPhases', idx as number)" class="opacity-30 hover:opacity-100" />
                  </div>
                  <UTextarea v-model="phase.description"
                    :placeholder="t('procedures.form.recovery.phases.phaseDescription')" :rows="3"
                    variant="none" class="stepper-desc-textarea w-full" />
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="form.recoveryPhases.length === 0" class="empty-stepper-vibe">
                <div class="vibe-icon-wrapper">
                  <UIcon name="i-heroicons-heart" class="text-4xl text-slate-300" />
                </div>
                <p>{{ t('procedures.form.recovery.phases.empty') }}</p>
              </div>
            </div>

            <div class="tab-internal-nav mt-12">
              <UButton variant="ghost" color="neutral" size="xl" @click="activeTab = 'preparation'">
                {{ t('procedures.form.pagination.prev') }}
              </UButton>
              <UButton color="primary" variant="subtle" size="xl" rounded="xl" @click="activeTab = 'instructions'" class="px-8 font-bold">
                {{ t('procedures.form.pagination.next') }}
                <UIcon name="i-heroicons-arrow-right" class="ml-2" />
              </UButton>
            </div>
          </div>
        </section>


        <!-- Instructions Tab -->
        <section v-else-if="activeTab === 'instructions'" key="instructions" class="tab-pane">
          <div class="max-w-5xl mx-auto space-y-10">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <!-- DOS -->
              <div class="premium-list-card border-emerald-100 dark:border-emerald-900/30">
                <header class="list-card-header border-emerald-50! dark:border-emerald-950!">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-check-circle" class="text-emerald-500" />
                    <h3 class="title text-emerald-700 dark:text-emerald-400">{{
                      t('procedures.form.faq.instructions.dos') }}</h3>
                  </div>
                  <UButton icon="i-heroicons-plus" size="xs" color="success" variant="ghost" @click="addDo" />
                </header>
                <div class="mt-4 space-y-3" v-auto-animate>
                  <div v-for="(pi, idx) in form.postOpDos" :key="idx" class="flex items-start gap-2">
                    <UTextarea v-model="pi.content" :placeholder="t('procedures.form.faq.instructions.content')"
                      :rows="2" class="flex-1 premium-textarea-sm" />
                    <button type="button" class="trash-icon-btn mt-2" @click="removeItem('postOpDos', idx as number)">
                      <UIcon name="i-heroicons-trash" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- DONTS -->
              <div class="premium-list-card border-rose-100 dark:border-rose-900/30">
                <header class="list-card-header border-rose-50! dark:border-rose-950!">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-x-circle" class="text-rose-500" />
                    <h3 class="title text-rose-700 dark:text-rose-400">{{ t('procedures.form.faq.instructions.donts') }}
                    </h3>
                  </div>
                  <UButton icon="i-heroicons-plus" size="xs" color="error" variant="ghost" @click="addDont" />
                </header>
                <div class="mt-4 space-y-3" v-auto-animate>
                  <div v-for="(pi, idx) in form.postOpDonts" :key="idx" class="flex items-start gap-2">
                    <UTextarea v-model="pi.content" :placeholder="t('procedures.form.faq.instructions.content')"
                      :rows="2" class="flex-1 premium-textarea-sm" />
                    <button type="button" class="trash-icon-btn mt-2" @click="removeItem('postOpDonts', idx as number)">
                      <UIcon name="i-heroicons-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-internal-nav">
              <UButton variant="ghost" color="neutral" @click="activeTab = 'recovery'">
                {{ t('procedures.form.pagination.prev') }}
              </UButton>
              <UButton color="primary" variant="subtle" @click="activeTab = 'faq'">
                {{ t('procedures.form.pagination.next') }}
              </UButton>
            </div>
          </div>
        </section>

        <!-- FAQ Tab -->
        <section v-else-if="activeTab === 'faq'" key="faq" class="tab-pane">
          <div class="max-w-4xl mx-auto">
            <header class="tab-header-v3 mb-10 flex justify-between items-end">
              <div>
                <h2 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ t('procedures.form.faq.questions.title') }}</h2>
                <p class="text-slate-500 mt-2">{{ t('procedures.form.faq.questions.description') }}</p>
              </div>
              <UButton @click="addFaq" color="primary" variant="soft" icon="i-heroicons-plus-circle" size="lg" rounded="xl" class="font-bold">
                {{ t('procedures.form.faq.questions.add') }}
              </UButton>
            </header>

            <div class="faq-premium-stack" v-auto-animate>
              <div v-for="(faq, idx) in form.faqs" :key="idx" class="faq-card-v3 glass-card-v3">
                <div class="faq-card-body">
                  <!-- Question Row -->
                  <div class="faq-row question-row">
                    <div class="faq-indicator q-indicator">Q</div>
                    <UInput v-model="faq.question" :placeholder="t('procedures.form.faq.questions.question')"
                      variant="none" class="faq-input flex-1" />
                    <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="sm" @click="removeItem('faqs', idx as number)" class="opacity-30 hover:opacity-100" />
                  </div>
                  
                  <!-- Answer Row -->
                  <div class="faq-row answer-row">
                    <div class="faq-indicator a-indicator">
                      <UIcon name="i-heroicons-chat-bubble-bottom-center-text" />
                    </div>
                    <UTextarea v-model="faq.answer" :placeholder="t('procedures.form.faq.questions.answer')" :rows="3"
                      variant="none" class="faq-textarea w-full" />
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="form.faqs.length === 0" class="empty-faq-vibe">
                <div class="vibe-icon-wrapper">
                  <UIcon name="i-heroicons-question-mark-circle" class="text-4xl text-slate-300" />
                </div>
                <p>{{ t('procedures.form.faq.questions.empty') }}</p>
              </div>
            </div>

            <div class="tab-internal-nav mt-12">
              <UButton variant="ghost" color="neutral" size="xl" @click="activeTab = 'instructions'">
                {{ t('procedures.form.pagination.prev') }}
              </UButton>
              <UButton color="primary" variant="subtle" size="xl" rounded="xl" @click="activeTab = 'gallery'" class="px-8 font-bold">
                {{ t('procedures.form.pagination.next') }}
                <UIcon name="i-heroicons-arrow-right" class="ml-2" />
              </UButton>
            </div>
          </div>
        </section>

        <!-- Gallery Tab -->
        <section v-else-if="activeTab === 'gallery'" key="gallery" class="tab-pane">
          <div class="list-head mb-10 text-center flex flex-col items-center">
            <h2 class="pane-heading text-3xl font-black">{{ t('procedures.form.tabs.gallery') }}</h2>
            <p class="text-slate-500 mt-2 mb-6">{{ t('procedures.form.gallery.description') }}</p>
            <UButton icon="i-heroicons-plus" color="primary" variant="soft" size="lg" rounded="xl"
              @click="addGalleryPair" class="font-bold px-10">
              {{ t('procedures.form.gallery.add') }}
            </UButton>
          </div>

          <div class="gallery-grid-v4" v-auto-animate>
            <div v-for="(pair, idx) in form.gallery" :key="pair.id" class="gallery-item-v4 glass-card-v3">
              <header class="item-header-v4">
                <div class="item-badge-v4">{{ t('procedures.form.gallery.case') }}{{ String(idx + 1).padStart(2, '0') }}</div>
                <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" @click="removeGalleryPair(idx)" 
                  class="opacity-30 hover:opacity-100 transition-opacity" />
              </header>

              <div class="item-upload-grid">
                <!-- Before -->
                <div class="mini-upload-v4">
                  <span class="label-v4 before">{{ t('procedures.form.gallery.before') }}</span>
                  <div class="mini-plate-v4" :class="{ 'has-image': !!pair.before.preview }">
                    <img v-if="pair.before.preview" :src="pair.before.preview" class="mini-img-v4" />
                    <div v-else class="upload-vibe-v4">
                      <UIcon name="i-heroicons-camera" />
                    </div>
                    <label class="plate-click-layer">
                      <input type="file" class="hidden" @change="handlePairImage(idx, 'before', $event)" />
                    </label>
                  </div>
                </div>

                <!-- After -->
                <div class="mini-upload-v4">
                  <span class="label-v4 after">{{ t('procedures.form.gallery.after') }}</span>
                  <div class="mini-plate-v4" :class="{ 'has-image': !!pair.after.preview }">
                    <img v-if="pair.after.preview" :src="pair.after.preview" class="mini-img-v4" />
                    <div v-else class="upload-vibe-v4">
                      <UIcon name="i-heroicons-camera" />
                    </div>
                    <label class="plate-click-layer">
                      <input type="file" class="hidden" @change="handlePairImage(idx, 'after', $event)" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="form.gallery.length === 0" class="empty-gallery-vibe-v3 col-span-full">
              <div class="vibe-icon-wrapper">
                <UIcon name="i-heroicons-photo" class="text-4xl text-slate-300" />
              </div>
              <p>{{ t('procedures.form.gallery.empty') }}</p>
            </div>
          </div>

          <!-- Tab Nav Buttons -->
          <div class="tab-internal-nav mt-16">
            <UButton variant="ghost" color="neutral" size="xl" @click="activeTab = 'faq'">
              {{ t('procedures.form.pagination.prev') || 'Anterior' }}
            </UButton>
            <div /> <!-- spacer -->
          </div>
        </section>
      </Transition>
    </div>

    <!-- Final Sticky Bar -->
    <div class="sticky-form-actions">
      <div class="actions-wrapper">
        <UButton type="button" variant="ghost" color="neutral" size="xl" @click="emit('cancel')" class="px-8 font-bold">
          {{ t('procedures.form.actions.cancel') }}
        </UButton>
        <UButton type="submit" color="primary" size="xl" :loading="loading" rounded="xl"
          class="px-16 font-extrabold shadow-gold">
          {{ isEdit ? t('procedures.form.actions.update') : t('procedures.form.actions.save') }}
        </UButton>
      </div>
    </div>
    
    <ProcedureCategoryModal v-model="isCategoryModalOpen" @updated="fetchCategories" />
  </form>
</template>

<style scoped>
.procedure-form {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 151px;
}

@media (max-width: 768px) {
  .procedure-form {
    padding: 0 1rem 120px 1rem;
  }
}

/* Premium Tab Switcher */
.tabs-premium-nav {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
  width: 100%;
}

@media (max-width: 768px) {
  .tabs-premium-nav {
    margin-bottom: 2rem;
    padding: 0 1rem;
  }
}

.tabs-glass-wrapper {
  background: white;
  padding: 8px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 4px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 100%;
}

:root.dark .tabs-glass-wrapper {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  border-color: rgba(51, 65, 85, 0.5);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

.nav-tab-btn {
  padding: 12px 24px;
  border-radius: 18px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  z-index: 1;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .nav-tab-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
    gap: 6px;
    border-radius: 14px;
  }
}

.nav-tab-btn:hover {
  color: #1e293b;
}

:root.dark .nav-tab-btn:hover {
  color: #f8fafc;
}

.nav-tab-btn.is-active {
  color: white;
}

.active-pill {
  position: absolute;
  inset: 0;
  background: #a07c28;
  border-radius: 16px;
  z-index: -1;
  box-shadow: 0 4px 15px rgba(160, 124, 40, 0.3);
  animation: pillIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pillIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pane Layout */
.tab-pane {
  min-height: 500px;
}

.pane-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2.5rem;
}

@media (max-width: 1024px) {
  .pane-grid {
    grid-template-columns: 1fr;
  }

  .pane-sidebar {
    order: -1;
  }
}

/* Premium Card */
.premium-card {
  background: white;
  border-radius: 28px;
  padding: 2.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  transition: all 0.3s;
}

@media (max-width: 768px) {
  .premium-card {
    padding: 1.5rem;
    border-radius: 24px;
  }
}

:root.dark .premium-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
}

.card-header-iconic {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

:root.dark .card-header-iconic {
  border-bottom-color: #334155;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: #a07c28;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

:root.dark .card-title {
  color: #f8fafc;
}

/* Image Plate */
.featured-image-wrapper {
  perspective: 1000px;
}

.image-plate {
  width: 100%;
  aspect-ratio: 1/1;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .image-plate {
  background: #0f172a;
  border-color: #334155;
}

.image-plate.has-image {
  border-style: solid;
  border-color: #a07c28;
  box-shadow: 0 20px 40px -15px rgba(160, 124, 40, 0.2);
}

.main-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-vibe {
  text-align: center;
  color: #94a3b8;
}

.vibe-icon {
  font-size: 3rem;
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.full-label-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 5;
}

.remove-action-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
  transition: all 0.2s;
}

.remove-action-btn:hover {
  transform: scale(1.1);
  background: #ef4444;
}

/* List Headers */
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pane-heading {
  font-size: 2rem;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: -0.04em;
}

:root.dark .pane-heading {
  color: #f8fafc;
}

.pane-subheading {
  color: #94a3b8;
  font-size: 1rem;
  margin-top: 4px;
}

.premium-btn-action {
  box-shadow: 0 10px 20px -5px rgba(160, 124, 40, 0.4);
}

/* Section Cards */
.section-premium-card {
  background: white;
  border-radius: 28px;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  display: flex;
  overflow: hidden;
  box-shadow: 0 4px 15px -5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

:root.dark .section-premium-card {
  background: #1e293b;
  border-color: rgba(51, 65, 85, 0.5);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
}

.section-premium-card:hover {
  transform: translateX(10px);
  border-color: #a07c28;
}

@media (max-width: 768px) {
  .section-premium-card:hover {
    transform: none;
  }
}

.section-drag-handle {
  width: 60px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
}

:root.dark .section-drag-handle {
  background: #0f172a;
  border-right-color: #334155;
}

.order-badge {
  font-weight: 900;
  color: #a07c28;
  font-size: 1.2rem;
}

.section-body {
  flex: 1;
  padding: 2rem;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .section-body {
    grid-template-columns: 1fr;
    padding: 1.5rem;
    gap: 1.5rem;
  }
}

.mini-plate {
  width: 100%;
  aspect-ratio: 4/3;
  background: #f1f5f9;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

:root.dark .mini-plate {
  background: #0f172a;
  border-color: #334155;
}

.mini-plate img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plate-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background: rgba(160, 124, 40, 0);
  transition: background 0.3s;
}

.plate-overlay:hover {
  background: rgba(160, 124, 40, 0.1);
}

.trash-btn {
  background: #fff5f5;
  color: #ef4444;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

:root.dark .trash-btn {
  background: rgba(239, 68, 68, 0.1);
}

.trash-btn:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

/* Premium List Cards */
.premium-list-card {
  background: white;
  border-radius: 28px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .premium-list-card {
    padding: 1.25rem;
  }
}

:root.dark .premium-list-card {
  background: #1e293b;
  border-color: #334155;
}

.list-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #f8fafc;
}

:root.dark .list-card-header {
  border-bottom-color: #0f172a;
}

.title {
  font-weight: 800;
  font-size: 1.1rem;
  color: #1e293b;
}

:root.dark .title {
  color: #f8fafc;
}

.sub-item-box {
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

:root.dark .sub-item-box {
  background: #0f172a;
  border-color: #334155;
}

.sub-item-box:hover {
  border-color: #a07c28;
  box-shadow: 0 4px 12px rgba(160, 124, 40, 0.05);
}

.trash-icon-btn {
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.trash-icon-btn:hover {
  color: #ef4444;
}

/* Gallery Premium */
.gallery-premium-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 2rem;
}

.gallery-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .gallery-card {
  background: #1e293b;
  border-color: #334155;
}

.gallery-card:hover {
  transform: translateY(-8px);
  border-color: #a07c28;
}

.gallery-visual {
  height: 200px;
  position: relative;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .gallery-visual {
  background: #0f172a;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-mini-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
}

/* Sticky Final Bar */
.sticky-form-actions {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: auto;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .sticky-form-actions {
    bottom: 1rem;
    width: 100%;
  }
}

.actions-wrapper {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  padding: 12px 24px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1.5rem;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.5);
  animation: barUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@media (max-width: 768px) {
  .actions-wrapper {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;
    padding: 10px 16px;
  }
}

@keyframes barUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.shadow-gold {
  box-shadow: 0 8px 30px rgba(160, 124, 40, 0.5);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Utility */
.text-gold {
  color: #a07c28;
}

.pane-grid-v2 {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 3rem;
  align-items: start;
}

@media (max-width: 1100px) {
  .pane-grid-v2 {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.premium-card-v2 {
  background: white;
  border-radius: 32px;
  padding: 2.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
}

:root.dark .premium-card-v2 {
  background: #0f172a;
  border-color: #1e293b;
}

/* Hero Fields */
.hero-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.premium-hero-label {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  padding-left: 0.5rem;
}

.premium-hero-input :deep(input) {
  font-size: 1.75rem;
  font-weight: 900;
  color: #1e293b;
  background: transparent !important;
  border: none !important;
  padding: 0 0.5rem !important;
  box-shadow: none !important;
  border-bottom: 2px solid #e2e8f0 !important;
  border-radius: 0 !important;
  transition: border-color 0.3s;
}

:root.dark .premium-hero-input :deep(input) {
  color: white;
  border-color: #334155 !important;
}

.premium-hero-input :deep(input):focus {
  border-color: #fbbf24 !important;
  /* gold */
}

.hero-field-help {
  font-size: 0.8rem;
  color: #94a3b8;
  padding-left: 0.5rem;
  font-style: italic;
}

.premium-hero-textarea :deep(textarea) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1rem;
  font-size: 1.1rem;
  line-height: 1.6;
  resize: none;
}

:root.dark .premium-hero-textarea :deep(textarea) {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

.premium-hero-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.premium-hero-select {
  width: 100%;
  appearance: none;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1rem 3.5rem 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

:root.dark .premium-hero-select {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

.premium-hero-select:focus {
  border-color: #fbbf24;
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1);
  background: white;
}

:root.dark .premium-hero-select:focus {
  background: #0f172a;
}

.premium-select-icon {
  position: absolute;
  right: 1.25rem;
  pointer-events: none;
  font-size: 1.25rem;
  color: #94a3b8;
  transition: all 0.3s;
}

.premium-hero-select-wrapper:hover .premium-select-icon {
  color: #fbbf24;
  transform: translateY(2px);
}

/* Sidebar & Hero Plate */
.hero-image-plate {
  position: relative;
  width: 100%;
  aspect-ratio: 4/5;
  background: #f1f5f9;
  border-radius: 40px;
  overflow: hidden;
  border: 8px solid white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .hero-image-plate {
  background: #1e293b;
  border: 8px solid #0f172a;
}

.hero-image-plate.has-image {
  border: 8px solid white;
}

.hero-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-image-plate:hover .hero-preview-img {
  transform: scale(1.05);
}

.hero-upload-vibe {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.vibe-circle {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.vibe-icon-xl {
  font-size: 2rem;
  color: #fbbf24;
}

.vibe-text {
  font-weight: 900;
  font-size: 0.8rem;
  color: #475569;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.vibe-subtext {
  font-size: 0.7rem;
  color: #94a3b8;
}

.hero-label-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 10;
}

.hero-remove-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 20;
  backdrop-filter: blur(10px);
  border: none;
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
  transition: all 0.3s;
}

.hero-remove-btn:hover {
  transform: scale(1.1);
  background: rgb(239, 68, 68);
}

/* Badges & Headers */
.header-vibe-badge {
  background: #1e293b;
  color: #fbbf24;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-right: 1.5rem;
}

.card-title-premium {
  font-size: 1.25rem;
  font-weight: 900;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:root.dark .card-title-premium {
  color: #e2e8f0;
}

.section-premium-card-v2 {
  background: white;
  border-radius: 32px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:root.dark .section-premium-card-v2 {
  background: #0f172a;
  border-color: #1e293b;
}

.section-premium-card-v2:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
}

/* Header */
.section-card-header {
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:root.dark .section-card-header {
  background: #1e293b;
  border-color: #334155;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.order-badge {
  background: #1e293b;
  color: #fbbf24;
  /* gold */
  font-size: 0.65rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-type-text {
  font-size: 1rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

:root.dark .section-type-text {
  color: #94a3b8;
}

.header-icon-main {
  font-size: 1.5rem;
}

/* Content */
.section-card-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  padding: 2rem;
  gap: 2.5rem;
}

@media (max-width: 1024px) {
  .section-card-content {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }
}

.premium-image-plate {
  position: relative;
  aspect-ratio: 1;
  background: #f1f5f9;
  border-radius: 24px;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
}

:root.dark .premium-image-plate {
  background: #334155;
  border-color: #1e293b;
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-plate-vibe {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.full-screen-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0);
  transition: background 0.3s;
}

.premium-image-plate:hover .full-screen-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.full-screen-overlay::after {
  content: "UPDATE";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50% scale(0.9));
  color: white;
  font-weight: 900;
  opacity: 0;
  transition: all 0.3s;
}

.premium-image-plate:hover .full-screen-overlay::after {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* Details */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.premium-field-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  padding-left: 2px;
}

.premium-input :deep(input),
.premium-input-lg :deep(input),
.premium-input-sm :deep(input),
.premium-textarea :deep(textarea),
.premium-textarea-sm :deep(textarea) {
  border-radius: 12px;
  transition: all 0.3s;
}

.premium-input :deep(input):focus,
.premium-input-lg :deep(input):focus {
  border-color: #a07c28;
  box-shadow: 0 0 0 3px rgba(160, 124, 40, 0.1);
}

.tab-internal-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px dashed #e2e8f0;
}

:root.dark .tab-internal-nav {
  border-top-color: #334155;
}

@media (max-width: 768px) {
  .tab-internal-nav {
    padding-top: 2rem;
  }
}
/* Premium Stepper V3 */
.stepper-vertical-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-left: 1rem;
}

.stepper-item-v3 {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: start;
  gap: 1.5rem;
}

.stepper-aside {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding-top: 0.75rem;
}

.stepper-node-bubble {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 2;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

:root.dark .stepper-node-bubble {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.5);
}

.preparation-node {
  border-bottom: 3px solid #fbbf24; /* yellow-400 */
}

.recovery-node {
  border-bottom: 3px solid #f43f5e; /* rose-500 */
}

.node-number {
  font-weight: 900;
  font-size: 1.25rem;
  color: #1e293b;
}

:root.dark .node-number {
  color: white;
}

.stepper-connector-line {
  flex: 1;
  width: 2px;
  background: #e2e8f0;
  margin: 1.5rem 0 -2.5rem 0;
  position: relative;
  opacity: 0.5;
}

:root.dark .stepper-connector-line {
  background: #334155;
}

.stepper-content-card {
  padding: 1.5rem 2rem;
  border-radius: 24px;
  transition: all 0.3s;
}

.glass-card-v3 {
  background: white;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
}

:root.dark .glass-card-v3 {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.05);
}

.stepper-item-v3:hover .stepper-content-card {
  transform: translateX(10px);
  border-color: #fbbf24;
  box-shadow: 0 20px 40px -20px rgba(251, 191, 36, 0.15);
}

.stepper-item-v3:hover .stepper-node-bubble {
  transform: scale(1.1) rotate(5deg);
  border-color: #fbbf24;
}

/* Field Inputs inside Stepper */
.stepper-title-input :deep(input) {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  padding: 0 !important;
  background: transparent !important;
  border-bottom: 1px dashed #e2e8f0 !important;
  border-radius: 0 !important;
}

:root.dark .stepper-title-input :deep(input) {
  color: white;
  border-bottom-color: #334155 !important;
}

.stepper-period-input :deep(input) {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fbbf24; /* yellow-400 */
  padding: 0.5rem 1rem !important;
  background: #fffbeb !important; /* yellow-50 */
  border: none !important;
  border-radius: 12px !important;
  text-align: center;
}

:root.dark .stepper-period-input :deep(input) {
  background: rgba(251, 191, 36, 0.1) !important;
}

.stepper-desc-textarea :deep(textarea) {
  width: 100%;
  font-size: 1rem;
  line-height: 1.6;
  color: #64748b;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
}

:root.dark .stepper-desc-textarea :deep(textarea) {
  color: #94a3b8;
}

.empty-stepper-vibe {
  text-align: center;
  padding: 4rem 2rem;
  background: #f8fafc;
  border-radius: 32px;
  border: 2px dashed #e2e8f0;
  color: #94a3b8;
}

:root.dark .empty-stepper-vibe {
  background: #0f172a;
  border-color: #1e293b;
}

.vibe-icon-wrapper {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

:root.dark .vibe-icon-wrapper {
  background: #1e293b;
}
/* FAQ Premium V3 */
.faq-premium-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-card-v3 {
  border-radius: 32px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-card-v3:hover {
  transform: translateY(-5px);
  border-color: #fbbf24;
  box-shadow: 0 20px 40px -15px rgba(251, 191, 36, 0.1);
}

.faq-card-body {
  padding: 1.5rem 2rem;
}

.faq-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.question-row {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

:root.dark .question-row {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.faq-indicator {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex-shrink: 0;
}

.q-indicator {
  background: white;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-size: 1rem;
}

:root.dark .q-indicator {
  background: #1e293b;
  border-color: #334155;
  color: white;
}

.a-indicator {
  background: #fffbeb;
  color: #fbbf24;
  font-size: 1.25rem;
}

:root.dark .a-indicator {
  background: rgba(251, 191, 36, 0.1);
}

.faq-input :deep(input) {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  padding: 0.5rem 0 !important;
  background: transparent !important;
  border: none !important;
}

:root.dark .faq-input :deep(input) {
  color: white;
}

.faq-textarea :deep(textarea) {
  font-size: 1rem;
  line-height: 1.6;
  color: #64748b;
  padding: 0.5rem 0 !important;
  background: transparent !important;
  border: none !important;
}

:root.dark .faq-textarea :deep(textarea) {
  color: #94a3b8;
}

.empty-faq-vibe {
  text-align: center;
  padding: 5rem 2rem;
  background: #f8fafc;
  border-radius: 40px;
  border: 2px dashed #e2e8f0;
  color: #94a3b8;
}

:root.dark .empty-faq-vibe {
  background: #0f172a;
  border-color: #1e293b;
}

.faq-card-v3:hover .q-indicator {
  background: #fbbf24;
  border-color: #fbbf24;
  color: white;
  transform: rotate(-5deg) scale(1.1);
}
/* Gallery Premium V4 Grid Extension */
.gallery-grid-v4 {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2.5rem;
}

@media (min-width: 640px) {
  .gallery-grid-v4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .gallery-grid-v4 {
    grid-template-columns: repeat(3, 1fr);
  }
}

.gallery-item-v4 {
  padding: 1.5rem;
  border-radius: 32px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.gallery-item-v4:hover {
  transform: translateY(-8px);
  border-color: #fbbf24;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.1);
}

.item-header-v4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.item-badge-v4 {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.05em;
}

:root.dark .item-badge-v4 {
  background: #1e293b;
  color: #94a3b8;
}

.item-upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.mini-upload-v4 {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.label-v4 {
  font-size: 0.6rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
}

.label-v4.before {
  background: #f1f5f9;
  color: #64748b;
}

.label-v4.after {
  background: #fffbeb;
  color: #d97706;
}

:root.dark .label-v4.before {
  background: #334155;
}

:root.dark .label-v4.after {
  background: rgba(251, 191, 36, 0.1);
}

.mini-plate-v4 {
  aspect-ratio: 1;
  background: #f8fafc;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

:root.dark .mini-plate-v4 {
  background: #0f172a;
  border-color: #334155;
}

.mini-plate-v4.has-image {
  border-style: solid;
  border-color: transparent;
}

.mini-img-v4 {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-vibe-v4 {
  font-size: 1.5rem;
  color: #cbd5e1;
}

.plate-click-layer {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 5;
}

.plate-click-layer:hover {
  background: rgba(251, 191, 36, 0.05);
}

.empty-gallery-vibe-v3 {
  text-align: center;
  padding: 6rem 2rem;
  background: #f8fafc;
  border-radius: 40px;
  border: 2px dashed #e2e8f0;
  color: #94a3b8;
}

:root.dark .empty-gallery-vibe-v3 {
  background: #0f172a;
  border-color: #1e293b;
}
</style>
