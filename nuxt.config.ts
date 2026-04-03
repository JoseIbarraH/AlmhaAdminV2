// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/css/global.css'],

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@formkit/auto-animate',
    '@nuxtjs/i18n'
  ]
})