<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

const systemData = ref({
  is_maintenance_mode: '0'
})

const loading = ref(true)
const saving = ref(false)

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await useApi('/settings?group=system')
    if (res.success) {
      systemData.value = { ...systemData.value, ...res.data }
    }
  } catch (e) {
    console.error('Error fetching system settings:', e)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await useApi('/settings', {
      method: 'POST',
      body: {
        group: 'system',
        settings: systemData.value
      }
    })
    toast.add({
      title: t('settings.actions.success'),
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (e) {
    console.error('Error saving system settings:', e)
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)

const isMaintenanceActive = computed({
  get: () => systemData.value.is_maintenance_mode === '1',
  set: (val: boolean) => {
    systemData.value.is_maintenance_mode = val ? '1' : '0'
    saveSettings()
  }
})
</script>

<template>
  <div class="system-settings">
    <div v-if="loading" class="skeleton-section h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>

    <section v-else class="settings-card">
      <div class="card-header">
        <UIcon name="i-heroicons-wrench-screwdriver" class="header-icon" />
        <h2 class="card-title">{{ $t('settings.system.maintenance_title') }}</h2>
      </div>
      
      <div class="card-body">
        <div class="maintenance-info">
          <p class="maintenance-desc">
            {{ $t('settings.system.maintenance_desc') }}
          </p>
          
          <div class="maintenance-toggle-box" :class="{ 'is-active': isMaintenanceActive }">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="toggle-title">{{ $t('settings.system.maintenance_toggle') }}</span>
                <span class="toggle-status">
                  {{ isMaintenanceActive ? $t('designs.status.active') : $t('designs.status.inactive') }}
                </span>
              </div>
              <USwitch 
                v-model="isMaintenanceActive" 
                :loading="saving"
                size="lg"
                color="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
}

:root.dark .settings-card {
  background: #1e293b;
  border-color: #334155;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(160,124,40,0.03) 0%, transparent 100%);
}

:root.dark .card-header {
  border-bottom-color: #334155;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: #a07c28;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

:root.dark .card-title {
  color: #f8fafc;
}

.card-body {
  padding: 1.5rem;
}

.maintenance-desc {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 600px;
}

:root.dark .maintenance-desc {
  color: #94a3b8;
}

.maintenance-toggle-box {
  padding: 1.5rem;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

:root.dark .maintenance-toggle-box {
  background: #0f172a;
  border-color: #334155;
}

.maintenance-toggle-box.is-active {
  border-color: #a07c28;
  background: rgba(160,124,40,0.03);
}

.toggle-title {
  font-weight: 700;
  color: #1e293b;
}

:root.dark .toggle-title {
  color: #f8fafc;
}

.toggle-status {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 2px;
}
</style>
