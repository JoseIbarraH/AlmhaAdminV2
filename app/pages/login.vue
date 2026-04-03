<script setup lang="ts">
import { useAlmhaAuth } from '../composables/useAlmhaAuth'
import logoImg from '../assets/images/logo.png'

definePageMeta({
  layout: false
})

const { login } = useAlmhaAuth()
const toast = useToast()
const colorMode = useColorMode()

const state = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const showPassword = ref(false)

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const validate = (state: any) => {
  const errors = []
  if (!state.email) {
    errors.push({ name: 'email', message: 'El correo electrónico es obligatorio' })
  } else if (!/^\S+@\S+\.\S+$/.test(state.email)) {
    errors.push({ name: 'email', message: 'Introduce un correo electrónico válido' })
  }
  if (!state.password) {
    errors.push({ name: 'password', message: 'La contraseña es obligatoria' })
  }
  return errors
}

async function onSubmit() {
  loading.value = true
  try {
    const success = await login(
      { email: state.email, password: state.password },
      state.rememberMe
    )
    if (success) {
      navigateTo('/dashboard')
    } else {
      toast.add({
        title: 'Error de acceso',
        description: 'Credenciales inválidas.',
        color: 'error',
        icon: 'i-heroicons-x-circle'
      })
    }
  } catch (error: any) {
    toast.add({
      title: 'Error del servidor',
      description: error.data?.message || 'No se pudo conectar con el servidor.',
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
            <img :src="logoImg" alt="Almha" class="logo-img" />
          </div>
          <span class="brand-name">Almha Admin</span>
        </div>

        <!-- Center: tagline -->
        <div class="left-center">
          <h2 class="tagline">
            Gestión de<br /><em>alto nivel.</em>
          </h2>
          <p class="tagline-desc">
            Una plataforma diseñada para quienes exigen precisión, velocidad y control absoluto sobre sus operaciones.
          </p>
        </div>

        <!-- Bottom: decorative quote -->
        <div class="left-bottom">
          <div class="accent-line" />
          <p class="quote-text">
            "Almha ha transformado la manera en que gestionamos nuestros proyectos."
          </p>
        </div>
      </div>

      <!-- ══ RIGHT PANEL — form ══ -->
      <div class="login-right">
        <!-- Theme toggle -->
        <button class="theme-toggle" type="button" aria-label="Cambiar tema" @click="toggleTheme">
          <span class="toggle-track">
            <span class="toggle-knob" />
          </span>
          <span class="toggle-label">{{ colorMode.value === 'dark' ? 'Dark' : 'Light' }}</span>
        </button>

        <!-- Form wrapper — vertically centered -->
        <div class="form-wrapper">

          <!-- Mobile-only logo -->
          <div class="mobile-logo">
            <div class="logo-box-sm">
              <span class="corner tl" />
              <span class="corner tr" />
              <span class="corner bl" />
              <span class="corner br" />
              <img :src="logoImg" alt="Almha" class="logo-img-sm" />
            </div>
          </div>

          <!-- Header -->
          <div class="form-header">
            <div class="eyebrow">
              <span class="eyebrow-line" />
              Acceso seguro
            </div>
            <h3 class="form-title">Iniciar Sesión</h3>
            <p class="form-sub">Introduce tus credenciales para continuar.</p>
          </div>

          <!-- Form -->
          <UForm :state="state" :validate="validate" v-auto-animate class="form-body" @submit="onSubmit">
            <!-- Email -->
            <UFormField name="email" class="field-wrap">
              <template #label>
                <span class="field-label">Correo Electrónico</span>
              </template>
              <UInput v-model="state.email" placeholder="correo@ejemplo.com" icon="i-heroicons-envelope" size="xl"
                variant="subtle" class="w-full" />
              <template #error="{ error }">
                <span class="error-text">{{ error }}</span>
              </template>
            </UFormField>

            <!-- Password -->
            <UFormField name="password" class="field-wrap">
              <template #label>
                <div class="field-label-row">
                  <span class="field-label">Contraseña</span>
                </div>
              </template>
              <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'" icon="i-heroicons-lock-closed"
                placeholder="••••••••" size="xl" variant="subtle" class="w-full" :ui="{ trailing: 'pr-1' }">
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

            <!-- Remember me -->
            <div class="remember-row">
              <UCheckbox v-model="state.rememberMe" label="Mantener sesión iniciada" color="primary"
                class="custom-check" />
            </div>

            <!-- Submit -->
            <UButton type="submit" block size="xl" :loading="loading" class="submit-btn">
              Acceder
            </UButton>
          </UForm>

          <!-- Footer -->
          <div class="form-footer">
            <p class="footer-text">
              ¿No tienes cuenta?
              <span class="footer-contact">Contacta con el administrador</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* ── Google Fonts (loaded globally, not scoped) ────────────── */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
</style>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   LOGIN PAGE — Professional split-panel, 100vh, no scroll
   ══════════════════════════════════════════════════════════════ */

/* ─── ROOT ──────────────────────────────────────────────────── */
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

/* ─── CARD ──────────────────────────────────────────────────── */
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
    height: auto;
    max-width: 480px;
  }
}

/* ─── LEFT PANEL ────────────────────────────────────────────── */
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

/* ── Left Top ── */
.left-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  transition: border-color 0.3s, background 0.3s;
}

:root.dark .logo-box {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.08);
}

.logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
}

.corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-style: solid;
  border-color: rgba(160, 130, 60, 0.45);
  transition: border-color 0.3s;
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

.brand-name {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(120, 95, 35, 0.6);
  transition: color 0.3s;
}

:root.dark .brand-name {
  color: rgba(212, 175, 55, 0.5);
}

/* ── Left Center ── */
.left-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px 0;
}

.tagline {
  font-family: 'Playfair Display', serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1814;
  transition: color 0.3s;
}

:root.dark .tagline {
  color: #f0ece4;
}

.tagline em {
  font-style: italic;
  color: #a07c28;
  transition: color 0.3s;
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
  transition: color 0.3s;
}

:root.dark .tagline-desc {
  color: rgba(240, 236, 228, 0.32);
}

/* ── Left Bottom ── */
.left-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accent-line {
  width: 32px;
  height: 1px;
  background: rgba(160, 130, 60, 0.25);
  transition: background 0.3s;
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
  transition: color 0.3s;
}

:root.dark .quote-text {
  color: rgba(240, 236, 228, 0.25);
}

/* ─── RIGHT PANEL ───────────────────────────────────────────── */
.login-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 44px;
  background: #ffffff;
  position: relative;
  overflow-y: auto;
  transition: background 0.3s;
}

:root.dark .login-right {
  background: #111111;
}

@media (max-width: 1024px) {
  .login-right {
    padding: 36px 28px;
  }
}

/* ── Theme toggle ── */
.theme-toggle {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 10;
}

.toggle-track {
  width: 34px;
  height: 18px;
  border-radius: 9px;
  border: 0.5px solid #d0ccc5;
  background: #ede9e2;
  position: relative;
  display: block;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .toggle-track {
  background: #222;
  border-color: #333;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s, background 0.3s;
}

:root.dark .toggle-knob {
  transform: translateX(16px);
  background: #d4af37;
  box-shadow: none;
}

.toggle-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(30, 25, 15, 0.35);
  user-select: none;
  transition: color 0.3s;
}

:root.dark .toggle-label {
  color: rgba(240, 236, 228, 0.3);
}

/* ── Form wrapper ── */
.form-wrapper {
  width: 100%;
  max-width: 360px;
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

.logo-img-sm {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
}

/* ── Form header ── */
.form-header {
  margin-bottom: 28px;
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
  margin-bottom: 8px;
  transition: color 0.3s;
}

:root.dark .eyebrow {
  color: rgba(212, 175, 55, 0.5);
}

.eyebrow-line {
  display: inline-block;
  width: 18px;
  height: 1px;
  background: rgba(120, 95, 35, 0.3);
  flex-shrink: 0;
  transition: background 0.3s;
}

:root.dark .eyebrow-line {
  background: rgba(212, 175, 55, 0.3);
}

.form-title {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: #1a1814;
  letter-spacing: -0.01em;
  transition: color 0.3s;
}

:root.dark .form-title {
  color: #f0ece4;
}

.form-sub {
  font-size: 12px;
  font-weight: 300;
  color: rgba(30, 25, 15, 0.36);
  margin-top: 5px;
  letter-spacing: 0.01em;
  transition: color 0.3s;
}

:root.dark .form-sub {
  color: rgba(240, 236, 228, 0.25);
}

/* ── Form body ── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-wrap {
  position: relative;
  padding-bottom: 18px;
}

.field-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(30, 25, 15, 0.48);
  transition: color 0.3s;
}

:root.dark .field-label {
  color: rgba(240, 236, 228, 0.38);
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  font-size: 10px !important;
  color: rgba(120, 95, 35, 0.6) !important;
  font-weight: 400 !important;
  text-decoration: none;
  letter-spacing: 0.03em;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #a07c28 !important;
}

:root.dark .forgot-link {
  color: rgba(212, 175, 55, 0.55) !important;
}

:root.dark .forgot-link:hover {
  color: #d4af37 !important;
}

/* ── UInput override ── */
.form-body :deep([data-slot="root"]) {
  width: 100%;
  position: relative !important;
}

/* Forzar posición de los slots de iconos */
.form-body :deep([data-slot="leading"]) {
  left: 0.75rem !important;
  right: auto !important;
  top: 0 !important;
  bottom: 0 !important;
  position: absolute !important;
  display: flex !important;
  align-items: center;
}

.form-body :deep([data-slot="trailing"]) {
  right: 0.75rem !important;
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

/* ── Remember row ── */
.remember-row {
  margin-top: 2px;
}

.custom-check :deep(label) {
  font-size: 11px !important;
  font-weight: 300 !important;
  letter-spacing: 0.03em;
  color: rgba(30, 25, 15, 0.55) !important;
}

:root.dark .custom-check :deep(label) {
  color: rgba(240, 236, 228, 0.5) !important;
}

.custom-check :deep([data-slot="control"]) {
  border: 1.5px solid rgba(120, 95, 35, 0.4) !important;
  border-radius: 4px !important;
  width: 16px !important;
  height: 16px !important;
  background: rgba(160, 130, 60, 0.04) !important;
}

:root.dark .custom-check :deep([data-slot="control"]) {
  border-color: rgba(212, 175, 55, 0.45) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.custom-check :deep([data-state="checked"] [data-slot="control"]),
.custom-check :deep([data-slot="control"][data-state="checked"]) {
  background: #a07c28 !important;
  border-color: #a07c28 !important;
}

:root.dark .custom-check :deep([data-state="checked"] [data-slot="control"]),
:root.dark .custom-check :deep([data-slot="control"][data-state="checked"]) {
  background: #d4af37 !important;
  border-color: #d4af37 !important;
}

/* ── Error styling ── */
.error-text {
  position: absolute;
  bottom: 0;
  left: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #ef4444;
  letter-spacing: 0.01em;
  white-space: nowrap;
  animation: error-in 0.2s ease-out;
}

@keyframes error-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
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

/* ── Footer ── */
.form-footer {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: border-color 0.3s;
}

:root.dark .form-footer {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.footer-text {
  font-size: 11px;
  font-weight: 300;
  color: rgba(30, 25, 15, 0.28);
  letter-spacing: 0.02em;
  transition: color 0.3s;
}

:root.dark .footer-text {
  color: rgba(240, 236, 228, 0.2);
}

.footer-contact {
  color: rgba(120, 95, 35, 0.6);
  font-weight: 500;
  cursor: default;
  transition: color 0.3s;
}

:root.dark .footer-contact {
  color: rgba(212, 175, 55, 0.5);
}
</style>