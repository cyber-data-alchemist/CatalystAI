import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
const appBaseURL = process.env.NUXT_APP_BASE_URL || '/';

export default defineNuxtConfig({
  //...
  build: {
    transpile: ['vuetify'],
  },

  app: {
    baseURL: appBaseURL,
    buildAssetsDir: '/_nuxt/'
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    //...
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  compatibilityDate: '2025-04-07',
})