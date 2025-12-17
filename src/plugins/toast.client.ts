import Toast, { useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'top-right',
    timeout: 4000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
    transition: 'Vue-Toastification__fade',
    maxToasts: 10,
    newestOnTop: true,
    toastClassName: [],
    bodyClassName: [],
    containerClassName: [],
    toastDefaults: {
      success: {
        timeout: 3000,
        hideProgressBar: false,
      },
      error: {
        timeout: 5000,
        hideProgressBar: false,
      },
      info: {
        timeout: 4000,
        hideProgressBar: false,
      },
      warning: {
        timeout: 4000,
        hideProgressBar: false,
      },
    },
  })

  // Make toast available globally
  const toast = useToast()
  nuxtApp.provide('toast', toast)
})