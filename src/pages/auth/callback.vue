<script setup lang="ts">
/**
 * OAuth Callback Page
 * Receives token from OAuth provider, stores it, and redirects to home
 */

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { me } = useAuth()
const toast = useToast()

const isProcessing = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token as string
  const message = route.query.message as string
  const isNewUser = route.query.newUser === 'true'
  const error = route.query.error as string

  // Handle error
  if (error) {
    errorMessage.value = error
    isProcessing.value = false
    return
  }

  // No token
  if (!token) {
    errorMessage.value = 'Token tidak ditemukan'
    isProcessing.value = false
    return
  }

  try {
    // Store token by calling backend to set cookie
    const response = await $fetch('/api/auth/set-token', {
      method: 'POST',
      body: { token }
    })

    if (response.ok) {
      // Fetch user profile to update auth state
      await me()

      toast.add({
        title: isNewUser ? '🎉 Selamat Datang!' : '👋 Selamat Datang Kembali!',
        description: message || 'Login berhasil',
        color: 'green'
      })

      // Redirect to home
      await navigateTo('/')
    } else {
      throw new Error('Failed to set token')
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    errorMessage.value = error.message || 'Gagal menyelesaikan login'
    isProcessing.value = false
  }
})

const goToLogin = () => {
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <!-- Processing -->
      <template v-if="isProcessing && !errorMessage">
        <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-surface-900 mb-2">
          Memproses Login
        </h1>
        <p class="text-surface-600">
          Mohon tunggu sebentar...
        </p>
      </template>

      <!-- Error -->
      <template v-else-if="errorMessage">
        <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-danger-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-surface-900 mb-2">
          Login Gagal
        </h1>
        <p class="text-surface-600 mb-6">
          {{ errorMessage }}
        </p>
        <button
          class="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          @click="goToLogin"
        >
          Kembali ke Login
        </button>
      </template>
    </div>
  </div>
</template>
