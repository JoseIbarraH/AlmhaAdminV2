<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const stats = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const fetchStats = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await useApi('/analytics/dashboard/stats')
    stats.value = response
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err)
    error.value = 'No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})

// Chart Data Processors
const trafficSeries = computed(() => {
  if (!stats.value?.weekly_traffic) return []
  return [{
    name: 'Sesiones',
    data: stats.value.weekly_traffic.map((item: any) => Number(item.sessions))
  }]
})

const trafficOptions = computed(() => {
  if (!stats.value?.weekly_traffic) return {}
  return {
    xaxis: {
      categories: stats.value.weekly_traffic.map((item: any) => {
        const date = new Date(item.date)
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      })
    },
    tooltip: {
      x: {
        format: 'dd MMM'
      }
    }
  }
})

const deviceSeries = computed(() => {
  if (!stats.value?.segmentation?.devices) return []
  return stats.value.segmentation.devices.map((item: any) => Number(item.sessions))
})

const deviceOptions = computed(() => {
  if (!stats.value?.segmentation?.devices) return {}
  return {
    labels: stats.value.segmentation.devices.map((item: any) => 
      item.deviceCategory === 'mobile' ? 'Móvil' : 
      item.deviceCategory === 'desktop' ? 'Escritorio' : 
      item.deviceCategory === 'tablet' ? 'Tablet' : item.deviceCategory
    ),
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => deviceSeries.value.reduce((a: number, b: number) => a + b, 0)
            }
          }
        }
      }
    }
  }
})

const kpiCards = computed(() => {
  if (!stats.value?.kpis) return []
  const kpis = stats.value.kpis
  return [
    { title: 'Usuarios Activos', value: Number(kpis.activeUsers), icon: 'i-heroicons-users', color: 'text-blue-500' },
    { title: 'Sesiones', value: Number(kpis.sessions), icon: 'i-heroicons-arrow-path', color: 'text-indigo-500' },
    { title: 'Vistas de Página', value: Number(kpis.screenPageViews), icon: 'i-heroicons-eye', color: 'text-emerald-500' },
    { title: 'Tasa de Rebote', value: `${(Number(kpis.bounceRate) * 100).toFixed(1)}%`, icon: 'i-heroicons-arrow-trending-down', color: 'text-amber-500' },
    { title: 'Duración Media', value: `${Math.floor(Number(kpis.averageSessionDuration) / 60)}m ${Math.round(Number(kpis.averageSessionDuration) % 60)}s`, icon: 'i-heroicons-clock', color: 'text-rose-500' }
  ]
})
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Resumen analítico de los últimos 30 días.</p>
      </div>
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="ghost"
        :loading="loading"
        @click="fetchStats"
      >
        Actualizar Datos
      </UButton>
    </header>

    <!-- Error State -->
    <UAlert
      v-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="soft"
      :title="error"
      class="mb-6"
    />

    <!-- KPI Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <template v-if="loading">
        <UCard v-for="i in 5" :key="i" class="shadow-sm">
          <div class="space-y-2">
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-8 w-3/4" />
          </div>
        </UCard>
      </template>
      <template v-else>
        <UCard v-for="kpi in kpiCards" :key="kpi.title" class="overflow-hidden group hover:ring-2 hover:ring-primary-500 transition-all duration-300">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ kpi.title }}</p>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ kpi.value }}</h3>
            </div>
            <div :class="`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${kpi.color}`">
              <UIcon :name="kpi.icon" class="w-5 h-5" />
            </div>
          </div>
        </UCard>
      </template>
    </div>

    <!-- Main Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-2 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 dark:text-slate-200">Tráfico Semanal</h3>
            <span class="text-xs text-slate-400">Sesiones por día</span>
          </div>
        </template>
        <div v-if="loading" class="h-[350px] flex items-center justify-center">
          <USkeleton class="h-full w-full rounded-lg" />
        </div>
        <AnalyticsChart
          v-else
          type="area"
          height="350"
          :series="trafficSeries"
          :options="trafficOptions"
        />
      </UCard>

      <UCard shadow-sm>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 dark:text-slate-200">Dispositivos</h3>
            <span class="text-xs text-slate-400">Distribución de uso</span>
          </div>
        </template>
        <div v-if="loading" class="h-[350px] flex items-center justify-center">
          <USkeleton class="h-64 w-64 rounded-full" />
        </div>
        <AnalyticsChart
          v-else
          type="donut"
          height="350"
          :series="deviceSeries"
          :options="deviceOptions"
        />
      </UCard>
    </div>

    <!-- Tables Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Top Browsers -->
      <UCard shadow-sm>
        <template #header>
          <h3 class="font-bold text-slate-800 dark:text-slate-200">Navegadores Top</h3>
        </template>
        <div v-if="loading" class="space-y-4">
          <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-400 border-b dark:border-slate-800">
                <th class="pb-2 font-medium">Navegador</th>
                <th class="pb-2 font-medium text-right">Sesiones</th>
                <th class="pb-2 font-medium text-right">Rebote</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-slate-800">
              <tr v-for="browser in stats?.rankings?.browsers" :key="browser.browser" class="group">
                <td class="py-3 font-medium text-slate-700 dark:text-slate-300">{{ browser.browser }}</td>
                <td class="py-3 text-right">{{ browser.sessions }}</td>
                <td class="py-3 text-right text-slate-400">{{ (browser.bounceRate * 100).toFixed(0) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Acquisition Channels -->
      <UCard shadow-sm>
        <template #header>
          <h3 class="font-bold text-slate-800 dark:text-slate-200">Fuentes de Tráfico</h3>
        </template>
        <div v-if="loading" class="space-y-4">
          <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-400 border-b dark:border-slate-800">
                <th class="pb-2 font-medium">Fuente / Medio</th>
                <th class="pb-2 font-medium text-right">Sesiones</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-slate-800">
              <tr v-for="source in stats?.rankings?.acquisition" :key="source.sessionSourceMedium" class="group">
                <td class="py-3 font-medium text-slate-700 dark:text-slate-300">{{ source.sessionSourceMedium }}</td>
                <td class="py-3 text-right">{{ source.sessions }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Top Referrers -->
      <UCard shadow-sm>
        <template #header>
          <h3 class="font-bold text-slate-800 dark:text-slate-200">Sitios Referidores</h3>
        </template>
        <div v-if="loading" class="space-y-4">
          <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-400 border-b dark:border-slate-800">
                <th class="pb-2 font-medium">Referer</th>
                <th class="pb-2 font-medium text-right">Sesiones</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-slate-800">
              <tr v-for="ref in stats?.rankings?.referrers" :key="ref.pageReferrer" class="group">
                <td class="py-3 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" :title="ref.pageReferrer">
                  {{ ref.pageReferrer === '(direct)' ? 'Directo' : ref.pageReferrer }}
                </td>
                <td class="py-3 text-right">{{ ref.sessions }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Geography & Social Share -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <!-- Geography -->
       <UCard shadow-sm>
        <template #header>
          <h3 class="font-bold text-slate-800 dark:text-slate-200">Países</h3>
        </template>
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="flex gap-2">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-12" />
          </div>
        </div>
        <div v-else class="space-y-4">
          <div v-for="country in stats?.geography" :key="country.country" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span>{{ country.country }}</span>
              <span class="font-bold">{{ country.sessions }}</span>
            </div>
            <UProgress 
              :value="Number(country.sessions)" 
              :max="Number(stats.geography[0].sessions)" 
              size="sm" 
              color="primary"
            />
          </div>
        </div>
      </UCard>

      <!-- Social Share -->
      <UCard shadow-sm>
        <template #header>
          <h3 class="font-bold text-slate-800 dark:text-slate-200">Redes Sociales</h3>
        </template>
        <div v-if="loading" class="h-[250px] flex items-center justify-center">
          <USkeleton class="h-full w-full rounded-lg" />
        </div>
        <div v-else-if="!stats?.social_share?.length" class="flex flex-col items-center justify-center h-[200px] text-slate-400">
          <UIcon name="i-heroicons-share" class="w-10 h-10 mb-2 opacity-20" />
          <p>Sin datos de redes sociales</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="social in stats.social_share" :key="social.sessionSource" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span>{{ social.sessionSource }}</span>
              <span class="font-bold">{{ social.sessions }}</span>
            </div>
            <UProgress 
              :value="Number(social.sessions)" 
              :max="Math.max(...stats.social_share.map((s: any) => Number(s.sessions)))" 
              size="sm" 
              color="primary"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
:deep(.u-card) {
  border-color: var(--color-slate-200);
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.dark :deep(.u-card) {
  border-color: var(--color-slate-800);
}

:deep(.u-progress) {
  height: 0.375rem;
}
</style>