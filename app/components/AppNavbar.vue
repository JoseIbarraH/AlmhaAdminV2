<script setup lang="ts">
import logoDarkImg from '../assets/images/logo.png'
import logoLightImg from '../assets/images/logo2.png'

const config = useRuntimeConfig()
const colorMode = useColorMode()
const { logout, user } = useAlmhaAuth()

const currentLogo = computed(() => {
  return colorMode.value === 'dark' ? logoDarkImg : logoLightImg
})

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>


<template>
  <header class="navbar">
    <div class="navbar-left">
      <div class="logo-wrapper">
        <ClientOnly>
          <img :src="currentLogo" alt="Almha Logo" class="logo-img" />
          <template #fallback>
            <img :src="logoDarkImg" alt="Almha Logo" class="logo-img" />
          </template>
        </ClientOnly>
      </div>

      <h1 class="brand-name">
        {{ config.public.appName }}
        <span class="brand-suffix">{{ config.public.appSuffix }}</span>
      </h1>
    </div>


    <div class="navbar-right">
      <!-- Theme Toggle -->
      <button class="icon-btn theme-btn" @click="toggleTheme" aria-label="Cambiar tema">
        <ClientOnly>
          <UIcon :name="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="icon-lg" />
        </ClientOnly>
      </button>

      <!-- Profile / User Menu -->
      <div class="user-control">
        <div class="user-info text-right hidden sm:block">
          <p class="user-name">{{ user?.name || 'Administrador' }}</p>
          <p class="user-role">Super Admin</p>
        </div>
        <UButton icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" color="neutral" class="logout-btn"
          @click="logout" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .navbar {
  background: #0f172a;
  border-color: #1e293b;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-wrapper {
  width: 32px;
  height: 32px;
}

.logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}


.brand-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
  transition: color 0.3s;
}

:root.dark .brand-name {
  color: #f8fafc;
}

.brand-suffix {
  font-weight: 400;
  color: #a07c28;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

:root.dark .icon-btn:hover {
  background: #1e293b;
  color: #f8fafc;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.user-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 1.5rem;
  border-left: 1px solid #e2e8f0;
}

:root.dark .user-control {
  border-color: #1e293b;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

:root.dark .user-name {
  color: #f8fafc;
}

.user-role {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
