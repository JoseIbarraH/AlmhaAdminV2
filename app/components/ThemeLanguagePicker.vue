<script setup lang="ts">
/**
 * ThemeLanguagePicker
 * Reusable component for Auth related pages (Login, Setup)
 * Centralizes Theme toggle and Language selection logic and styling.
 */

const colorMode = useColorMode()
const { locale, setLocale, t } = useI18n({ useScope: 'global' })

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const languageItems = computed(() => [
  [
    {
      label: t('nav.spanish'),
      icon: 'i-heroicons-language',
      trailingIcon: locale.value === 'es' ? 'i-heroicons-check' : undefined,
      onSelect: () => setLocale('es'),
      active: locale.value === 'es'
    },
    {
      label: t('nav.english'),
      icon: 'i-heroicons-language',
      trailingIcon: locale.value === 'en' ? 'i-heroicons-check' : undefined,
      onSelect: () => setLocale('en'),
      active: locale.value === 'en'
    }
  ]
])
</script>

<template>
  <div class="top-actions">
    <ClientOnly>
      <!-- Language Selector -->
      <UDropdownMenu :items="languageItems" :content="{ align: 'end' }">
        <button class="action-btn lang-btn" type="button" :aria-label="t('nav.language')">
          <UIcon name="i-heroicons-language" class="icon-sm" />
          <span class="btn-label">{{ locale.toUpperCase() }}</span>
        </button>
      </UDropdownMenu>

      <!-- Theme Toggle -->
      <button class="action-btn theme-btn" type="button" :aria-label="t('nav.theme')" @click="toggleTheme">
        <span class="toggle-track">
          <span class="toggle-knob" />
        </span>
        <span class="btn-label">{{ colorMode.value === 'dark' ? 'Dark' : 'Light' }}</span>
      </button>

      <!-- Fallback for SSR -->
      <template #fallback>
        <div class="top-actions">
          <div class="action-btn">...</div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* ── Top actions bar (Shared styling) ── */
.top-actions {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.lang-btn {
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.lang-btn:hover {
  background: rgba(160, 130, 60, 0.05);
}

:root.dark .lang-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.icon-sm {
  width: 16px;
  height: 16px;
  color: rgba(30, 25, 15, 0.4);
}

:root.dark .icon-sm {
  color: rgba(240, 236, 228, 0.4);
}

.btn-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(120, 95, 35, 0.6);
  user-select: none;
  transition: color 0.3s;
}

:root.dark .btn-label {
  color: rgba(212, 175, 55, 0.5);
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-track {
  width: 34px;
  height: 18px;
  border-radius: 9px;
  border: 0.5px solid #d0ccc5;
  background: #ede9e2;
  position: relative;
  display: block;
  transition: background 0.3s, border-color 0.3s;
}

:root.dark .toggle-track {
  background: #222;
  border-color: #333;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s, background 0.3s;
}

:root.dark .toggle-knob {
  transform: translateX(16px);
  background: #d4af37;
  box-shadow: none;
}
</style>
