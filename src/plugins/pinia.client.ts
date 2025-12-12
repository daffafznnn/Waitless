import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (import.meta.server) return

  // Add persisted state plugin to Pinia
  nuxtApp.$pinia.use(createPersistedState({
    storage: localStorage,
    auto: true
  }))
})