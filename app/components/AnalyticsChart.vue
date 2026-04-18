<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'radar' | 'polarArea'
  height?: string | number
  options?: any
  series?: any[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: '350',
  options: () => ({}),
  series: () => []
})

const isDark = useColorMode().value === 'dark'

const defaultOptions = computed(() => ({
  chart: {
    fontFamily: 'Inter, sans-serif',
    toolbar: {
      show: false
    },
    background: 'transparent',
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
    }
  },
  theme: {
    mode: useColorMode().value || 'light'
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  grid: {
    borderColor: isDark ? '#334155' : '#e2e8f0',
    strokeDashArray: 4,
    padding: {
      left: 10,
      right: 10
    }
  },
  dataLabels: {
    enabled: false
  },
  colors: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
  ...props.options
}))
</script>

<template>
  <div class="analytics-chart">
    <div v-if="title" class="mb-4">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ title }}</h3>
    </div>
    <ClientOnly>
      <apexchart
        :type="type"
        :height="height"
        :options="defaultOptions"
        :series="series"
      />
      <template #fallback>
        <div :style="{ height: typeof height === 'string' ? height : height + 'px' }" class="flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 rounded-lg animate-pulse">
          <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.analytics-chart :deep(.apexcharts-canvas) {
  margin-left: auto;
  margin-right: auto;
}
.analytics-chart :deep(.apexcharts-tooltip) {
  background-color: white !important;
  border-color: var(--color-slate-200) !important;
  box-shadow: var(--shadow-xl) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--color-slate-900) !important;
}

.dark .analytics-chart :deep(.apexcharts-tooltip) {
  background-color: var(--color-slate-900) !important;
  border-color: var(--color-slate-700) !important;
  color: white !important;
}

.analytics-chart :deep(.apexcharts-tooltip-title) {
  background-color: var(--color-slate-50) !important;
  border-color: var(--color-slate-200) !important;
  font-weight: 700 !important;
}

.dark .analytics-chart :deep(.apexcharts-tooltip-title) {
  background-color: rgba(30, 41, 59, 0.5) !important; /* slate-800/50 */
  border-color: var(--color-slate-700) !important;
}
</style>
