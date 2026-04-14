<script setup lang="ts">
import { useApi } from '../composables/useApi'
import logoDarkImg from '../assets/images/logo.png'
import logoLightImg from '../assets/images/logo2.png'

definePageMeta({
  layout: false
})

const toast = useToast()
const { t } = useI18n({ useScope: 'global' })
const colorMode = useColorMode()
const config = useRuntimeConfig()

const currentLogo = computed(() => {
  return colorMode.value === 'dark' ? logoDarkImg : logoLightImg
})

const state = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formRef = ref()

const validate = (state: any) => {
  const errors = []
  if (!state.name) errors.push({ name: 'name', message: t('auth.setup.errors.name_required') })
  if (!state.email) {
    errors.push({ name: 'email', message: t('auth.setup.errors.email_required') })
  } else if (!/^\S+@\S+\.\S+$/.test(state.email)) {
    errors.push({ name: 'email', message: t('auth.setup.errors.email_invalid') })
  }
  if (!state.password) {
    errors.push({ name: 'password', message: t('auth.setup.errors.password_required') })
  } else if (state.password.length < 8) {
    errors.push({ name: 'password', message: t('auth.setup.errors.password_min') })
  }
  if (!state.password_confirmation) {
    errors.push({ name: 'password_confirmation', message: t('auth.setup.errors.confirm_required') })
  } else if (state.password !== state.password_confirmation) {
    errors.push({ name: 'password_confirmation', message: t('auth.setup.errors.passwords_mismatch') })
  }
  return errors
}

async function onSubmit() {
  loading.value = true
  try {
    await useApi('/setup/instance-bootstrap', {
      method: 'POST',
      body: state
    })

    toast.add({
      title: t('auth.setup.success.title'),
      description: t('auth.setup.success.description'),
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    // Clear any residual auth state so the guest middleware doesn't redirect to dashboard
    const token = useCookie('auth_token')
    token.value = null
    const user = useState('user')
    user.value = null

    navigateTo('/login')
  } catch (error: any) {
    toast.add({
      title: t('auth.setup.fail.title'),
      description: error.data?.message || t('auth.setup.fail.description'),
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">

      <!-- ══ LEFT PANEL — branding ══ -->
      <div class="login-left">
        <!-- Top: logo -->
        <div class="left-top">
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


        <!-- Center: tagline -->
        <div class="left-center">
          <h2 class="tagline">
            {{ $t('auth.setup.tagline.title') }}<br /><em>{{ $t('auth.setup.tagline.titleAccent') }}</em>
          </h2>
          <p class="tagline-desc">
            {{ $t('auth.setup.tagline.description') }}
          </p>
        </div>

        <!-- Bottom: decorative quote -->
        <div class="left-bottom">
          <div class="accent-line" />
          <p class="quote-text">
            {{ $t('auth.setup.quote') }}
          </p>
        </div>
      </div>

      <!-- ══ RIGHT PANEL — form ══ -->
      <div class="login-right">
        <!-- Theme & Language Picker -->
        <ThemeLanguagePicker />


        <!-- Form wrapper — vertically centered -->
        <div class="form-wrapper">

          <!-- Mobile-only logo -->
          <div class="mobile-logo">
            <div class="logo-box-sm">
              <span class="corner tl" />
              <span class="corner tr" />
              <span class="corner bl" />
              <span class="corner br" />
            </div>
          </div>

          <!-- Header -->
          <div class="form-header">
            <div class="eyebrow">
              <span class="eyebrow-line" />
            </div>
            <h3 class="form-title">{{ $t('auth.setup.title') }}</h3>
            <p class="form-sub">{{ $t('auth.setup.subtitle') }}</p>
          </div>

          <!-- Form -->
          <UForm ref="formRef" :state="state" :validate="validate" v-auto-animate class="form-body" autocomplete="off" @submit="onSubmit">

            <!-- Full Name -->
            <UFormField name="name" class="field-wrap">
              <template #label>
                <div class="field-label-row">
                  <span class="field-label">{{ $t('auth.setup.nameLabel') }}</span>
                </div>
              </template>
              <UInput v-model="state.name" :placeholder="$t('auth.setup.namePlaceholder')" icon="i-heroicons-user" size="xl" variant="subtle"
                class="w-full" autocomplete="off" />
              <template #error="{ error }">
                <span class="error-text">{{ error }}</span>
              </template>
            </UFormField>

            <!-- Admin Email -->
            <UFormField name="email" class="field-wrap">
              <template #label>
                <div class="field-label-row">
                  <span class="field-label">{{ $t('auth.setup.emailLabel') }}</span>
                </div>
              </template>
              <UInput v-model="state.email" :placeholder="$t('auth.setup.emailPlaceholder')" icon="i-heroicons-envelope" size="xl"
                variant="subtle" class="w-full" autocomplete="off" />
              <template #error="{ error }">
                <span class="error-text">{{ error }}</span>
              </template>
            </UFormField>

            <!-- Password Grid -->
            <div class="fields-grid">
              <!-- Password -->
              <UFormField name="password" class="field-wrap">
                <template #label>
                  <div class="field-label-row">
                    <span class="field-label">{{ $t('auth.setup.passwordLabel') }}</span>
                  </div>
                </template>
                <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'"
                  icon="i-heroicons-lock-closed" placeholder="••••••••" size="xl" variant="subtle" class="w-full"
                  :ui="{ trailing: 'pr-1' }" autocomplete="new-password">
                  <template #trailing>
                    <UButton color="neutral" variant="ghost" size="sm"
                      :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      aria-label="Toggle password visibility" class="hover:bg-transparent"
                      @click="showPassword = !showPassword" />
                  </template>
                </UInput>
                <template #error="{ error }">
                  <span class="error-text">{{ error }}</span>
                </template>
              </UFormField>

              <!-- Confirm Password -->
              <UFormField name="password_confirmation" class="field-wrap">
                <template #label>
                  <div class="field-label-row">
                    <span class="field-label">{{ $t('auth.setup.confirmLabel') }}</span>
                  </div>
                </template>
                <UInput v-model="state.password_confirmation" :type="showConfirmPassword ? 'text' : 'password'"
                  icon="i-heroicons-lock-closed" placeholder="••••••••" size="xl" variant="subtle" class="w-full"
                  :ui="{ trailing: 'pr-1' }" autocomplete="new-password">
                  <template #trailing>
                    <UButton color="neutral" variant="ghost" size="sm"
                      :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      aria-label="Toggle password visibility" class="hover:bg-transparent"
                      @click="showConfirmPassword = !showConfirmPassword" />
                  </template>
                </UInput>
                <template #error="{ error }">
                  <span class="error-text">{{ error }}</span>
                </template>
              </UFormField>
            </div>

            <!-- Security Alert -->
            <div class="form-alert">
              <div class="alert-icon-box">
                <UIcon name="i-heroicons-shield-check" class="alert-icon" />
              </div>
              <div class="alert-content">
                <span class="alert-title">{{ $t('auth.setup.security.title') }}</span>
                <p class="alert-text">{{ $t('auth.setup.security.description') }}</p>
              </div>
            </div>

            <!-- Submit -->
            <UButton type="submit" block size="xl" :loading="loading" class="submit-btn mt-2">
              {{ $t('auth.setup.submit') }}
            </UButton>
          </UForm>


        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* ── Google Fonts (loaded globally) ────────────── */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
</style>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   SETUP PAGE — Redesign with Premium Login Aesthetics
   ══════════════════════════════════════════════════════════════ */

/* ─── ROOT & CARD (Copied from login.vue) ───────────────────── */
.login-page {
  font-family: 'DM Sans', sans-serif;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f4f1ec;
  transition: background 0.3s;
}

:root.dark .login-page {
  background: #0a0a0a;
}

.login-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: calc(100% - 3rem);
  max-width: 1060px;
  height: calc(100vh - 3rem);
  max-height: 720px;
  border-radius: 16px;
  overflow: hidden;
  border: 0.5px solid #ddd9d0;
  background: #ffffff;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .login-card {
  border-color: #1e1e1e;
  background: #111111;
}

@media (max-width: 1024px) {
  .login-card {
    grid-template-columns: 1fr;
    max-height: none;
    height: calc(100vh - 1rem);
    max-width: 480px;
    overflow-y: auto;
  }
}

/* ─── LEFT PANEL (Copied from login.vue) ────────────────────── */
.login-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 44px 40px;
  background: #f7f4ee;
  border-right: 0.5px solid #ddd9d0;
  position: relative;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .login-left {
  background: #0d0d0d;
  border-right-color: #1e1e1e;
}

@media (max-width: 1024px) {
  .login-left {
    display: none !important;
  }
}

.logo-box {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(160, 130, 60, 0.3);
  border-radius: 10px;
  background: rgba(80, 65, 30, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

:root.dark .logo-box {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.08);
}

.logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}


.corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-style: solid;
  border-color: rgba(160, 130, 60, 0.45);
}

:root.dark .corner {
  border-color: rgba(212, 175, 55, 0.5);
}

.corner.tl {
  top: -1px;
  left: -1px;
  border-width: 1.5px 0 0 1.5px;
  border-radius: 4px 0 0 0;
}

.corner.tr {
  top: -1px;
  right: -1px;
  border-width: 1.5px 1.5px 0 0;
  border-radius: 0 4px 0 0;
}

.corner.bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 1.5px 1.5px;
  border-radius: 0 0 0 4px;
}

.corner.br {
  bottom: -1px;
  right: -1px;
  border-width: 0 1.5px 1.5px 0;
  border-radius: 0 0 4px 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1a1814;
  line-height: 1.2;
  transition: color 0.3s;
}

:root.dark .brand-name {
  color: #f0ece4;
}

.brand-suffix {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(120, 95, 35, 0.7);
  margin-top: 2px;
  transition: color 0.3s;
}

:root.dark .brand-suffix {
  color: rgba(212, 175, 55, 0.6);
}

.left-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tagline {
  font-family: 'Playfair Display', serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1814;
}

:root.dark .tagline {
  color: #f0ece4;
}

.tagline em {
  font-style: italic;
  color: #a07c28;
}

:root.dark .tagline em {
  color: #d4af37;
}

.tagline-desc {
  font-size: 12px;
  font-weight: 300;
  line-height: 1.75;
  color: rgba(30, 25, 15, 0.4);
  max-width: 260px;
  margin-top: 14px;
}

:root.dark .tagline-desc {
  color: rgba(240, 236, 228, 0.32);
}

.left-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accent-line {
  width: 32px;
  height: 1px;
  background: rgba(160, 130, 60, 0.25);
}

:root.dark .accent-line {
  background: rgba(212, 175, 55, 0.22);
}

.quote-text {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 12px;
  line-height: 1.65;
  color: rgba(30, 25, 15, 0.32);
}

:root.dark .quote-text {
  color: rgba(240, 236, 228, 0.25);
}

/* ─── RIGHT PANEL (Copied from login.vue) ───────────────────── */
.login-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 44px;
  background: #ffffff;
  position: relative;
  overflow-y: auto;
}

:root.dark .login-right {
  background: #111111;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

/* ── Form header ── */
.form-header {
  margin-bottom: 24px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(120, 95, 35, 0.55);
}

:root.dark .eyebrow {
  color: rgba(212, 175, 55, 0.5);
}

.eyebrow-line {
  width: 18px;
  height: 1px;
  background: rgba(120, 95, 35, 0.3);
}

.form-title {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: #1a1814;
  margin-top: 8px;
}

:root.dark .form-title {
  color: #f0ece4;
}

.form-sub {
  font-size: 12px;
  font-weight: 300;
  color: rgba(30, 25, 15, 0.36);
  margin-top: 4px;
}

:root.dark .form-sub {
  color: rgba(240, 236, 228, 0.25);
}

/* ── Form body ── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }
}

.field-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(30, 25, 15, 0.48);
}

:root.dark .field-label {
  color: rgba(240, 236, 228, 0.38);
}

/* ── Form Alert Premium ── */
.form-alert {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(160, 130, 60, 0.05);
  border: 0.5px solid rgba(160, 130, 60, 0.15);
  margin-top: 4px;
  backdrop-filter: blur(4px);
}

:root.dark .form-alert {
  background: rgba(212, 175, 55, 0.03);
  border-color: rgba(212, 175, 55, 0.1);
}

.alert-icon-box {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: rgba(160, 130, 60, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-icon {
  width: 16px;
  height: 16px;
  color: #a07c28;
}

:root.dark .alert-icon {
  color: #d4af37;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  font-size: 10px;
  font-weight: 600;
  color: #a07c28;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

:root.dark .alert-title {
  color: #d4af37;
}

.alert-text {
  font-size: 10px;
  line-height: 1.4;
  color: rgba(30, 25, 15, 0.5);
}

:root.dark .alert-text {
  color: rgba(240, 236, 228, 0.4);
}

/* ── UInput override (Copied from login.vue) ── */
.form-body :deep([data-slot="leading"]) {
  left: 0.85rem !important;
  right: auto !important;
  top: 0 !important;
  bottom: 0 !important;
  position: absolute !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 20px !important;
}

.form-body :deep([data-slot="trailing"]) {
  right: 0.85rem !important;
  left: auto !important;
  top: 0 !important;
  bottom: 0 !important;
  position: absolute !important;
  display: flex !important;
  align-items: center;
}

.form-body :deep(input) {
  padding-left: 2.85rem !important;
  padding-right: 2.85rem !important;
}

:root.dark .form-body :deep(input) {
  color: #f0ece4 !important;
}

:root.dark .form-body :deep(input::placeholder) {
  color: rgba(240, 236, 228, 0.4) !important;
}

:root.dark .form-body :deep([data-slot="leading"]),
:root.dark .form-body :deep([data-slot="trailing"]) {
  color: rgba(240, 236, 228, 0.5) !important;
}

.field-wrap {
  position: relative;
  padding-bottom: 22px;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* ── Error styling ── */
.error-text {
  position: absolute;
  top: calc(100% - 18px);
  left: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #ef4444;
  letter-spacing: 0.01em;
  white-space: nowrap;
  animation: error-in 0.2s ease-out;
}

@keyframes error-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:root.dark .error-text {
  color: #f87171;
}

.form-body :deep([data-slot="error"]) {
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* ── Submit button ── */
.submit-btn {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.16em !important;
  text-transform: uppercase !important;
  margin-top: 4px;
  background: #a07c28 !important;
  color: #ffffff !important;
  border: none !important;
  padding: 14px 24px !important;
  border-radius: 8px !important;
  cursor: pointer;
  transition: background 0.25s, box-shadow 0.25s, transform 0.15s;
  box-shadow: 0 4px 16px rgba(160, 124, 40, 0.25);
}

.submit-btn:hover {
  background: #8a6b22 !important;
  box-shadow: 0 6px 20px rgba(160, 124, 40, 0.35);
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(0) scale(0.98);
}

:root.dark .submit-btn {
  background: #d4af37 !important;
  color: #0a0a0a !important;
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
}

:root.dark .submit-btn:hover {
  background: #c9a42f !important;
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
}

/* ── Mobile logo ── */
.mobile-logo {
  display: none;
  justify-content: center;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .mobile-logo {
    display: flex;
  }
}

.logo-box-sm {
  width: 52px;
  height: 52px;
  border: 1px solid rgba(160, 130, 60, 0.3);
  border-radius: 10px;
  background: rgba(80, 65, 30, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

:root.dark .logo-box-sm {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.08);
}
</style>
