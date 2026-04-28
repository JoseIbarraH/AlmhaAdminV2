<script setup lang="ts">
import logoDarkImg from '../assets/images/logo.png'
import logoLightImg from '../assets/images/logo2.png'

definePageMeta({
  layout: false
})

const { t } = useI18n({ useScope: 'global' })
const colorMode = useColorMode()
const config = useRuntimeConfig()
const route = useRoute()

const currentLogo = computed(() => {
  return colorMode.value === 'dark' ? logoDarkImg : logoLightImg
})

const status = ref<'loading' | 'success' | 'error'>('loading')
const token = route.query.token as string

async function verifyEmail() {
  if (!token) {
    status.value = 'error'
    return
  }

  try {
    // Calling the backend verification endpoint
    await useApi(`/auth/email/verify/${token}`)
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
  }
}

onMounted(() => {
  verifyEmail()
})
</script>

<template>
  <div class="verify-page">
    <ThemeLanguagePicker class="absolute top-8 right-8" />

    <div class="verify-card">
      <div class="card-content">
        <!-- Branding -->
        <div class="branding">
          <div class="logo-box">
            <span class="corner tl" />
            <span class="corner tr" />
            <span class="corner bl" />
            <span class="corner br" />
            <ClientOnly>
              <img :src="currentLogo" alt="Almha" class="logo-img" />
              <template #fallback>
                <img :src="logoDarkImg" alt="Almha" class="logo-img" />
              </template>
            </ClientOnly>
          </div>
          <div class="brand-info">
            <span class="brand-name">{{ config.public.appName }}</span>
            <span class="brand-suffix">{{ config.public.appSuffix }}</span>
          </div>
        </div>

        <!-- States -->
        <div class="status-wrapper" v-auto-animate>
          <!-- 1. LOADING -->
          <div v-if="status === 'loading'" class="state-container">
            <UIcon name="i-heroicons-arrow-path" class="status-icon side-icon animate-spin" />
            <h2 class="status-title">{{ $t('auth.verify.title') }}</h2>
            <p class="status-desc">{{ $t('auth.verify.verifying') }}</p>
          </div>

          <!-- 2. SUCCESS -->
          <div v-else-if="status === 'success'" class="state-container">
            <div class="icon-circle success">
              <UIcon name="i-heroicons-check" class="status-icon" />
            </div>
            <h2 class="status-title">{{ $t('auth.verify.success.title') }}</h2>
            <p class="status-desc">{{ $t('auth.verify.success.description') }}</p>
          </div>

          <!-- 3. ERROR -->
          <div v-else class="state-container">
            <div class="icon-circle error">
              <UIcon name="i-heroicons-x-mark" class="status-icon" />
            </div>
            <h2 class="status-title">{{ $t('auth.verify.error.title') }}</h2>
            <p class="status-desc">{{ $t('auth.verify.error.description') }}</p>
          </div>
        </div>

        <!-- Action Button -->
        <div class="action-footer">
          <UButton 
            to="/login" 
            block 
            size="xl" 
            variant="solid" 
            class="submit-btn"
            :class="{ 'opacity-50 pointer-events-none': status === 'loading' }"
          >
            {{ $t('auth.verify.button') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

.verify-page {
  font-family: 'DM Sans', sans-serif;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f1ec;
  padding: 20px;
  transition: background 0.3s;
}

:root.dark .verify-page {
  background: #0a0a0a;
}

.verify-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  border: 0.5px solid #ddd9d0;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: all 0.3s;
}

:root.dark .verify-card {
  background: #111111;
  border-color: #1e1e1e;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.card-content {
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ── Branding ── */
.branding {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-box {
  width: 56px;
  height: 56px;
  border: 1px solid rgba(160, 130, 60, 0.3);
  border-radius: 12px;
  background: rgba(80, 65, 30, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.corner {
  position: absolute;
  width: 6px;
  height: 6px;
  border-style: solid;
  border-color: rgba(160, 130, 60, 0.45);
}

.corner.tl { top: -1px; left: -1px; border-width: 1.5px 0 0 1.5px; border-radius: 4px 0 0 0; }
.corner.tr { top: -1px; right: -1px; border-width: 1.5px 1.5px 0 0; border-radius: 0 4px 0 0; }
.corner.bl { bottom: -1px; left: -1px; border-width: 0 0 1.5px 1.5px; border-radius: 0 0 0 4px; }
.corner.br { bottom: -1px; right: -1px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 4px 0; }

.brand-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1a1814;
}

:root.dark .brand-name { color: #f0ece4; }

.brand-suffix {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(120, 95, 35, 0.7);
  margin-top: 2px;
}

/* ── States ── */
.status-wrapper {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-circle.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.icon-circle.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-icon {
  font-size: 40px;
}

.status-icon.side-icon {
  color: #a07c28;
  margin-bottom: 24px;
}

.status-title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1814;
  margin-bottom: 12px;
}

:root.dark .status-title { color: #f0ece4; }

.status-desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(30, 25, 15, 0.5);
  max-width: 300px;
}

:root.dark .status-desc { color: rgba(240, 236, 228, 0.4); }

/* ── Action ── */
.action-footer {
  width: 100%;
  margin-top: 32px;
}

.submit-btn {
  background: #a07c28 !important;
  color: #ffffff !important;
  border: none !important;
  height: 54px;
  border-radius: 12px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  box-shadow: 0 4px 12px rgba(160, 124, 40, 0.2);
}

.submit-btn:hover {
  background: #be9b7b !important;
  transform: translateY(-1px);
}
</style>
