<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' })
const { user, isSuperAdmin, hasRole } = useAlmhaAuth()

const navigationItems = computed(() => {
  const items = [
    { label: t('nav.dashboard'), icon: 'i-heroicons-home', to: '/dashboard' }
  ]

  if (hasRole('design_manager')) {
    items.push({ label: t('nav.designs'), icon: 'i-heroicons-paint-brush', to: '/designs' })
  }
  
  if (hasRole('blog_manager')) {
    items.push({ label: t('nav.blog'), icon: 'i-heroicons-document-text', to: '/blogs' })
  }
  
  if (hasRole('procedure_manager')) {
    items.push({ label: t('nav.procedures'), icon: 'i-heroicons-sparkles', to: '/procedures' })
  }
  
  if (hasRole('team_manager')) {
    items.push({ label: t('nav.teams'), icon: 'i-heroicons-user-group', to: '/teams' })
  }

  if (isSuperAdmin.value) {
    items.push({ label: t('nav.users'), icon: 'i-heroicons-users', to: '/users' })
    items.push({ label: t('nav.trash'), icon: 'i-heroicons-trash', to: '/trash' })
  }

  return items
})

const isMobileMenuOpen = useState('mobileMenuOpen', () => false)
</script>

<template>
  <div>
    <!-- Desktop Sidebar -->
    <aside class="sidebar desktop-sidebar">
      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          active-class="nav-link-active"
        >
          <UIcon :name="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Mobile Slideover -->
    <USlideover v-model:open="isMobileMenuOpen" side="left">
      <template #content>
        <div class="mobile-sidebar-container">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="font-bold text-lg text-slate-800 dark:text-white">Menú</h2>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="isMobileMenuOpen = false" />
          </div>
          <aside class="sidebar mobile-sidebar">
            <nav class="sidebar-nav">
              <NuxtLink
                v-for="item in navigationItems"
                :key="item.to"
                :to="item.to"
                class="nav-link"
                active-class="nav-link-active"
                @click="isMobileMenuOpen = false"
              >
                <UIcon :name="item.icon" class="nav-icon" />
                <span class="nav-label">{{ item.label }}</span>
              </NuxtLink>
            </nav>
          </aside>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
.sidebar {
  width: 256px;
  height: calc(100vh - 64px);
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0.75rem;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .sidebar {
  background: #0f172a;
  border-color: #1e293b;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #1e293b;
}

:root.dark .nav-link:hover {
  background: #1e293b;
  color: #f8fafc;
}

.nav-link-active {
  background: #f1f5f9;
  color: #a07c28 !important;
}

:root.dark .nav-link-active {
  background: #1e293b;
  color: #d4af37 !important;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.nav-label {
  letter-spacing: -0.01em;
}

.mobile-sidebar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

:root.dark .mobile-sidebar-container {
  background: #0f172a;
}

.mobile-sidebar {
  width: 100%;
  height: auto;
  flex: 1;
  border-right: none;
}

@media (max-width: 768px) {
  .desktop-sidebar {
    display: none;
  }
}
</style>
