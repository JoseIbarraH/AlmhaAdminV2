<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
      <p class="text-slate-500 dark:text-slate-400">Bienvenido de nuevo a la plataforma Almha.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard v-for="i in 3" :key="i" class="shadow-sm">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-primary-500" />
            <span class="font-medium">Métrica {{ i }}</span>
          </div>
        </template>
        <div class="py-4">
          <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ i * 124 }}</p>
          <p class="text-xs text-green-500 mt-1">+{{ i * 5 }}% desde el mes pasado</p>
        </div>
      </UCard>
    </div>
  </div>
</template>