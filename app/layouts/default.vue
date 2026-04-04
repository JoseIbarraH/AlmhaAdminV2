<script setup lang="ts">
import AppNavbar from '../components/AppNavbar.vue'
import AppSidebar from '../components/AppSidebar.vue'
</script>

<template>
  <div class="app-layout min-h-screen flex flex-col">
    <!-- Navbar (Fixed Top) -->
    <AppNavbar />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar (Fixed Left) -->
      <AppSidebar />

      <!-- Main Content -->
      <main class="main-content flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
}

:root.dark .app-layout {
  background: #0f172a;
}

.main-content {
  background: #f8fafc;
  padding: 1.5rem;
  transition: background 0.3s;
}

:root.dark .main-content {
  background: #0f172a;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
