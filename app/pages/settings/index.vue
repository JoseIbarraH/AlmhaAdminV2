<script setup lang="ts">
import GeneralSettings from '~/components/settings/GeneralSettings.vue'
import AppearanceSettings from '~/components/settings/AppearanceSettings.vue'
import SystemSettings from '~/components/settings/SystemSettings.vue'

definePageMeta({
  middleware: ['auth', 'acl'],
  roles: ['setting_manager']
})

const { t } = useI18n({ useScope: 'global' })

const items = computed(() => [
  {
    slot: 'general',
    label: t('settings.tabs.general'),
    icon: 'i-heroicons-information-circle'
  },
  {
    slot: 'appearance',
    label: t('settings.tabs.appearance'),
    icon: 'i-heroicons-paint-brush'
  },
  {
    slot: 'system',
    label: t('settings.tabs.system'),
    icon: 'i-heroicons-cpu-chip'
  }
])
</script>

<template>
  <div class="settings-page">
    <header class="settings-header">
      <div class="header-info">
        <h1 class="header-title">
          <span class="gold">{{ $t('settings.header.title') }}</span>
        </h1>
        <p class="header-desc">{{ $t('settings.header.description') }}</p>
      </div>
    </header>

    <div class="settings-content">
      <UTabs :items="items" class="w-full">
        <template #general>
          <div class="tab-body">
            <GeneralSettings />
          </div>
        </template>

        <template #appearance>
          <div class="tab-body">
            <AppearanceSettings />
          </div>
        </template>

        <template #system>
          <div class="tab-body">
            <SystemSettings />
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.settings-header {
  margin-bottom: 2.5rem;
}

.header-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.03em;
}

:root.dark .header-title {
  color: #f8fafc;
}

.header-title .gold {
  color: #a07c28;
}

:root.dark .header-title .gold {
  color: #d4af37;
}

.header-desc {
  color: #64748b;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
}

:root.dark .header-desc {
  color: #94a3b8;
}

.settings-content :deep(.relative) {
  background: transparent;
}

.tab-body {
  padding-top: 1.5rem;
}

/* Customizing UTabs if needed */
:deep(.u-tabs-list) {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 4px;
  border-radius: 14px;
}

:root.dark :deep(.u-tabs-list) {
  background: #1e293b;
  border-color: #334155;
}
</style>
