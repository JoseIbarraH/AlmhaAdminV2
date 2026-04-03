<script setup lang="ts">
const { token } = useAlmhaAuth()

definePageMeta({
  middleware: [
    function (to, from) {
      const { token } = useAlmhaAuth()
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
    <UCard class="w-full max-w-2xl text-center shadow-xl">
      <template #header>
        <div class="flex items-center justify-center gap-3 py-2">
          <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-primary-500" />
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Panel de Control Almha
          </h1>
        </div>
      </template>

      <div class="py-12 space-y-6">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl"></div>
          <UIcon name="i-heroicons-squares-2x2"
            class="relative w-24 h-24 text-primary-600 dark:text-primary-400 mx-auto" />
        </div>

        <div>
          <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-200">
            ¡Ya casi estamos listos!
          </h2>
          <p class="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            El dashboard principal está under construction. Pronto verás aquí tus analíticas y gestión.
          </p>
        </div>

        <div class="flex gap-4 justify-center">
          <UButton icon="i-heroicons-arrow-right-on-rectangle" color="neutral" variant="ghost" label="Cerrar Sesión"
            @click="useAlmhaAuth().logout()" />
        </div>
      </div>

      <template #footer>
        <p class="text-xs text-slate-400">
          Almha Admin V2 &copy; 2026 - Todos los derechos reservados
        </p>
      </template>
    </UCard>
  </div>
</template>
