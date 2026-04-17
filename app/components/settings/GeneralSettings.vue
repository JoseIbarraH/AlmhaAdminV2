<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

const generalData = ref({
  phone: '',
  email: '',
  location: '',
  whatsapp: {
    number: '',
    message: '',
    show_button: true,
    open_new_tab: true
  }
})

const socialData = ref({
  facebook: '',
  instagram: '',
  tiktok: '',
  twitter: '',
  linkedin: '',
  threads: ''
})

const loading = ref(true)
const saving = ref(false)
const procedureTag = '{{ procedure }}'

// Sanitization logic for phone numbers
const sanitizePhoneNumber = (value: string | undefined | null) => {
  if (!value) return ''
  
  // Remove all characters that are not digits, plus, or space
  let cleaned = value.replace(/[^0-9+ ]/g, '')
  
  if (cleaned.length > 0) {
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }
    // Remove any + that is not at the beginning
    cleaned = cleaned.charAt(0) + cleaned.slice(1).replace(/\+/g, '')
  }
  
  return cleaned
}

const blockNonNumeric = (e: KeyboardEvent) => {
  const char = e.key
  // Allow navigation keys (Backspace, Delete, Arrow keys, Tab, etc.)
  if (e.ctrlKey || e.metaKey || char.length > 1) return
  
  const target = e.target as HTMLInputElement
  const isFirstChar = target.selectionStart === 0
  
  // If typing at the beginning, allow + or digit
  if (isFirstChar && !/[0-9+]/.test(char)) {
    e.preventDefault()
    return
  }

  // If typing elsewhere, only allow digits or spaces
  if (!isFirstChar && !/[0-9 ]/.test(char)) {
    e.preventDefault()
  }
}

const fetchSettings = async () => {
  loading.value = true
  try {
    const [generalRes, socialRes] = await Promise.all([
      useApi('/settings?group=general'),
      useApi('/settings?group=social')
    ])
    
    if (generalRes.success) {
      const waData = generalRes.data.whatsapp
      generalData.value = { 
        ...generalData.value, 
        ...generalRes.data,
        whatsapp: {
          ...generalData.value.whatsapp,
          ...(typeof waData === 'object' && waData !== null ? waData : { number: waData || '' })
        }
      }
    }
    if (socialRes.success) {
      socialData.value = { ...socialData.value, ...socialRes.data }
    }
  } catch (e) {
    console.error('Error fetching settings:', e)
  } finally {
    loading.value = false
  }
}

const saveSettings = async (group: 'general' | 'social') => {
  saving.value = true
  const data = group === 'general' ? generalData.value : socialData.value
  
  try {
    await useApi('/settings', {
      method: 'POST',
      body: {
        group,
        settings: data
      }
    })
    toast.add({
      title: t('settings.actions.success'),
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (e) {
    console.error(`Error saving ${group} settings:`, e)
    toast.add({
      title: t('settings.actions.error'),
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="general-settings-view">
    <div v-if="loading" class="loading-state">
      <div v-for="i in 2" :key="i" class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-grid">
          <div v-for="j in 4" :key="j" class="skeleton-input"></div>
        </div>
      </div>
    </div>

    <div v-else class="settings-content-wrapper">
      <!-- Info Header -->
      <div class="info-eyebrow">
        <div class="eyebrow-line"></div>
        <span class="eyebrow-text">{{ $t('settings.tabs.general') }}</span>
      </div>

      <!-- Contact Settings Section -->
      <section class="premium-card">
        <div class="premium-card-header">
          <div class="icon-orb">
            <UIcon name="i-heroicons-identification-solid" class="orb-icon" />
          </div>
          <div class="header-text">
            <h2 class="card-title">{{ $t('settings.general.contact_title') }}</h2>
            <p class="card-subtitle">Administra los puntos de contacto oficiales de tu marca.</p>
          </div>
        </div>
        
        <div class="premium-card-body">
          <div class="responsive-grid single-column">
            <!-- Order Reorganized: Email, Phone, Location at the top, WhatsApp at the bottom -->
            <UFormField :label="$t('settings.general.email')" class="form-item">
              <UInput v-model="generalData.email" icon="i-heroicons-envelope" size="xl" class="premium-input" />
            </UFormField>

            <UFormField :label="$t('settings.general.phone')" class="form-item">
              <UInput 
                v-model="generalData.phone" 
                icon="i-heroicons-phone" 
                size="xl" 
                class="premium-input" 
                type="tel" 
                @keypress="blockNonNumeric"
                @update:model-value="(val) => generalData.phone = sanitizePhoneNumber(val)"
              />
            </UFormField>

            <UFormField :label="$t('settings.general.location')" class="form-item">
              <UInput v-model="generalData.location" icon="i-heroicons-map-pin" size="xl" class="premium-input" />
            </UFormField>
            
            <!-- WhatsApp Advanced Settings (Moved to bottom) -->
            <div class="form-item whatsapp-advanced-box pt-4">
              <div class="wa-header">
                <UIcon name="i-simple-icons-whatsapp" class="wa-icon" />
                <span class="wa-title">WhatsApp Business Config</span>
              </div>
              
              <div class="flex flex-col gap-6 mt-4">
                <UFormField :label="$t('settings.general.whatsapp') + ' (Número)'">
                  <UInput 
                    v-model="generalData.whatsapp.number" 
                    icon="i-heroicons-hashtag" 
                    size="lg" 
                    class="premium-input" 
                    placeholder="+57 ..." 
                    type="tel" 
                    @keypress="blockNonNumeric"
                    @update:model-value="(val) => generalData.whatsapp.number = sanitizePhoneNumber(val)"
                  />
                </UFormField>
                
                <UFormField label="Mensaje Predefinido">
                  <UInput v-model="generalData.whatsapp.message" icon="i-heroicons-chat-bubble-left-ellipsis" size="lg" class="premium-input" placeholder="Ej: Hola, quisiera más información..." />
                  <p class="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <UIcon name="i-heroicons-information-circle" class="mr-1 inline-block" />
                    {{ $t('settings.general.whatsapp_hint', { tag: procedureTag }) }}
                  </p>
                </UFormField>
              </div>

              <div class="flex flex-wrap gap-8 mt-6 wa-toggles">
                <div class="flex items-center gap-3">
                  <USwitch v-model="generalData.whatsapp.show_button" color="primary" />
                  <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Mostrar botón de WhatsApp</span>
                </div>
                
                <div class="flex items-center gap-3">
                  <USwitch v-model="generalData.whatsapp.open_new_tab" color="primary" />
                  <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Abrir en nueva pestaña</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="action-footer">
            <UButton 
              :loading="saving" 
              icon="i-heroicons-check-circle-20-solid" 
              color="primary" 
              variant="solid"
              size="xl"
              class="save-button"
              @click="saveSettings('general')"
            >
              {{ $t('settings.actions.save') }}
            </UButton>
          </div>
        </div>
      </section>

      <!-- Social Media Section -->
      <section class="premium-card">
        <div class="premium-card-header">
          <div class="icon-orb orb-purple">
            <UIcon name="i-heroicons-share-solid" class="orb-icon" />
          </div>
          <div class="header-text">
            <h2 class="card-title">{{ $t('settings.general.social_title') }}</h2>
            <p class="card-subtitle">Enlaza tus perfiles sociales para aumentar tu presencia digital.</p>
          </div>
        </div>
        
        <div class="premium-card-body">
          <div class="responsive-grid-3">
            <UFormField :label="$t('settings.social.facebook')" class="form-item social-item">
              <UInput v-model="socialData.facebook" icon="i-simple-icons-facebook" size="lg" class="premium-input" color="neutral" />
            </UFormField>
            
            <UFormField :label="$t('settings.social.instagram')" class="form-item social-item">
              <UInput v-model="socialData.instagram" icon="i-simple-icons-instagram" size="lg" class="premium-input" color="neutral" />
            </UFormField>
            
            <UFormField :label="$t('settings.social.tiktok')" class="form-item social-item">
              <UInput v-model="socialData.tiktok" icon="i-simple-icons-tiktok" size="lg" class="premium-input" color="neutral" />
            </UFormField>
            
            <UFormField :label="$t('settings.social.twitter')" class="form-item social-item">
              <UInput v-model="socialData.twitter" icon="i-simple-icons-x" size="lg" class="premium-input" color="neutral" />
            </UFormField>
            
            <UFormField :label="$t('settings.social.linkedin')" class="form-item social-item">
              <UInput v-model="socialData.linkedin" icon="i-simple-icons-linkedin" size="lg" class="premium-input" color="neutral" />
            </UFormField>
            
            <UFormField :label="$t('settings.social.threads')" class="form-item social-item">
              <UInput v-model="socialData.threads" icon="i-simple-icons-threads" size="lg" class="premium-input" color="neutral" />
            </UFormField>
          </div>
          
          <div class="action-footer">
            <UButton 
              :loading="saving" 
              icon="i-heroicons-fire-20-solid" 
              color="primary" 
              variant="soft"
              size="xl"
              class="save-button"
              @click="saveSettings('social')"
            >
              {{ $t('settings.actions.save') }}
            </UButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.general-settings-view {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.info-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
  opacity: 0.7;
}

.eyebrow-line {
  width: 40px;
  height: 2px;
  background: #a07c28;
  border-radius: 2px;
}

.eyebrow-text {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #a07c28;
}

/* Skeleton Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-card {
  height: 400px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 24px;
}

:root.dark .skeleton-card {
  background: #1e293b;
  border-color: #334155;
}

/* Premium Card */
.premium-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 2.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark .premium-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08);
}

:root.dark .premium-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.premium-card-header {
  padding: 1.75rem 2rem;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(to right, rgba(160, 124, 40, 0.02), transparent);
}

:root.dark .premium-card-header {
  border-bottom-color: #334155;
  background: linear-gradient(to right, rgba(212, 175, 55, 0.03), transparent);
}

.icon-orb {
  width: 52px;
  height: 52px;
  background: rgba(160, 124, 40, 0.1);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.orb-purple {
  background: rgba(139, 92, 246, 0.1);
}

.orb-icon {
  width: 26px;
  height: 26px;
  color: #a07c28;
}

.orb-purple .orb-icon {
  color: #8b5cf6;
}

/* WhatsApp Advanced Box Styles */
.whatsapp-advanced-box {
  background: #fdfdfd;
  border: 1px dashed #25d366;
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1rem 0;
}

:root.dark .whatsapp-advanced-box {
  background: rgba(37, 211, 102, 0.05);
  border-color: rgba(37, 211, 102, 0.3);
}

.wa-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.wa-icon {
  color: #25d366;
  width: 20px;
  height: 20px;
}

.wa-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: #25d366;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wa-toggles {
  border-top: 1px solid #f1f5f9;
  padding-top: 1.25rem;
}

:root.dark .wa-toggles {
  border-top-color: #334155;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

:root.dark .card-title {
  color: #f8fafc;
}

.card-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 2px;
}

/* Body and Grid */
.premium-card-body {
  padding: 2.25rem 2rem;
}

.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem 2rem;
}

.responsive-grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem 2rem;
}

.responsive-grid.single-column {
  grid-template-columns: 1fr !important;
}

@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .responsive-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

.full-width {
  grid-column: 1 / -1;
}

.form-item :deep(label) {
  font-weight: 700;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

:root.dark .form-item :deep(label) {
  color: #94a3b8;
}

.premium-input {
  width: 100%;
}

.premium-input :deep(input) {
  width: 100%;
  border-radius: 14px;
  border-width: 1.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-input :deep(input:focus) {
  background: white;
  transform: scale(1.01);
}

:root.dark .premium-input :deep(input:focus) {
  background: #0f172a;
}

/* Footer */
.action-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.75rem;
}

:root.dark .action-footer {
  border-top-color: #334155;
}

.save-button {
  padding: 0 2rem;
  height: 52px;
  font-weight: 700;
  border-radius: 14px;
  box-shadow: 0 10px 15px -3px rgba(160, 124, 40, 0.2);
  transition: all 0.3s;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(160, 124, 40, 0.3);
}
</style>
