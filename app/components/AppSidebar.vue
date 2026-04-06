<script setup lang="ts">
const { t } = useI18n()

const navigationItems = computed(() => [
  { label: t('nav.dashboard'), icon: 'i-heroicons-home', to: '/dashboard' },
  { label: t('nav.blog'), icon: 'i-heroicons-document-text', to: '/blogs' },
])
</script>

<template>
  <aside class="sidebar">
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

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  .nav-label {
    display: none;
  }
}
</style>
