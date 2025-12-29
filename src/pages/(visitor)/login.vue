<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

// APIs
const router = useRouter()
const { login } = useAuth()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Validation
const isFormValid = computed(() => {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
  const passwordValid = form.value.password.length >= 1
  return emailValid && passwordValid
})

const handleLogin = async () => {
  // Clear previous error
  errorMessage.value = ''
  
  if (!isFormValid.value) {
    errorMessage.value = 'Mohon isi email dan password dengan benar'
    return
  }
  
  isLoading.value = true
  try {
    await login({
      email: form.value.email,
      password: form.value.password
    })
    
    toast.add({
      title: 'Berhasil! 🎉',
      description: 'Selamat datang kembali di WaitLess',
      color: 'green'
    })
    
    // Only navigate on SUCCESS
    await navigateTo('/')
  } catch (error: any) {
    // On error: STAY on login page, show error message
    errorMessage.value = error.message || 'Email atau password salah. Silakan coba lagi.'
    
    toast.add({
      title: 'Login Gagal',
      description: errorMessage.value,
      color: 'red'
    })
    
    // DO NOT navigate - stay on login page
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = () => {
  // Redirect to Google OAuth endpoint
  window.location.href = '/api/auth/google'
}

const handleGuestMode = () => {
  toast.add({
    title: 'Mode Tamu Aktif',
    description: 'Anda dapat menjelajahi WaitLess. Untuk menyimpan antrian, silakan login.',
    color: 'blue'
  })
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-surface-100 flex flex-col">
    <div class="flex-1 flex flex-col px-10 py-12">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-surface-900 mb-3">
          WaitLess
        </h1>
        <p class="text-sm text-surface-500 leading-relaxed">
          Masuk dulu supaya nomor antreanmu tersimpan.
        </p>
      </div>

      <!-- Error Message -->
      <div 
        v-if="errorMessage" 
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form class="space-y-5" @submit.prevent="handleLogin">
        <!-- Email Field -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-surface-900">
            Email
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                class="w-3.5 h-3.5 text-surface-500"
                viewBox="0 0 14 14"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1.75 3.0625C1.50937 3.0625 1.3125 3.25937 1.3125 3.5V4.1043L6.0293 7.97617C6.59531 8.44102 7.40742 8.44102 7.97344 7.97617L12.6875 4.1043V3.5C12.6875 3.25937 12.4906 3.0625 12.25 3.0625H1.75ZM1.3125 5.80234V10.5C1.3125 10.7406 1.50937 10.9375 1.75 10.9375H12.25C12.4906 10.9375 12.6875 10.7406 12.6875 10.5V5.80234L8.80469 8.99062C7.75469 9.85195 6.24258 9.85195 5.19531 8.99062L1.3125 5.80234ZM0 3.5C0 2.53477 0.784766 1.75 1.75 1.75H12.25C13.2152 1.75 14 2.53477 14 3.5V10.5C14 11.4652 13.2152 12.25 12.25 12.25H1.75C0.784766 12.25 0 11.4652 0 10.5V3.5Z"/>
              </svg>
            </div>
            <input
              v-model="form.email"
              type="email"
              placeholder="nama@email.com"
              class="w-full h-[50px] pl-12 pr-4 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{ 'border-red-300': errorMessage }"
              required
              @input="errorMessage = ''"
            >
          </div>
        </div>

        <!-- Password Field -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-surface-900">
              Kata sandi
            </label>
            <button
              type="button"
              class="text-xs text-primary-600 hover:text-primary-700"
            >
              Lupa kata sandi?
            </button>
          </div>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                class="w-3 h-3.5 text-surface-500"
                viewBox="0 0 13 14"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3.9375 3.9375V5.25H8.3125V3.9375C8.3125 2.72891 7.33359 1.75 6.125 1.75C4.91641 1.75 3.9375 2.72891 3.9375 3.9375ZM2.1875 5.25V3.9375C2.1875 1.76367 3.95117 0 6.125 0C8.29883 0 10.0625 1.76367 10.0625 3.9375V5.25H10.5C11.4652 5.25 12.25 6.03477 12.25 7V12.25C12.25 13.2152 11.4652 14 10.5 14H1.75C0.784766 14 0 13.2152 0 12.25V7C0 6.03477 0.784766 5.25 1.75 5.25H2.1875Z"/>
              </svg>
            </div>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="w-full h-[50px] pl-12 pr-12 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{ 'border-red-300': errorMessage }"
              required
              @input="errorMessage = ''"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2"
              @click="showPassword = !showPassword"
            >
              <svg
                class="w-4 h-3.5 text-surface-500"
                viewBox="0 0 16 14"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7.87505 2.1875C6.09224 2.1875 4.62661 2.99688 3.50278 4.03867C2.45005 5.01758 1.72271 6.17969 1.35083 7C1.72271 7.82031 2.45005 8.98242 3.50005 9.96133C4.62661 11.0031 6.09224 11.8125 7.87505 11.8125C9.65786 11.8125 11.1235 11.0031 12.2473 9.96133C13.3 8.98242 14.0274 7.82031 14.3993 7C14.0274 6.17969 13.3 5.01758 12.25 4.03867C11.1235 2.99688 9.65786 2.1875 7.87505 2.1875ZM2.60864 3.07891C3.89653 1.88125 5.66567 0.875 7.87505 0.875C10.0844 0.875 11.8536 1.88125 13.1415 3.07891C14.4211 4.26836 15.277 5.6875 15.6844 6.66367C15.7747 6.87969 15.7747 7.12031 15.6844 7.33633C15.277 8.3125 14.4211 9.73438 13.1415 10.9211C11.8536 12.1187 10.0844 13.125 7.87505 13.125C5.66567 13.125 3.89653 12.1187 2.60864 10.9211C1.32896 9.73438 0.473096 8.3125 0.0684082 7.33633C-0.0218262 7.12031 -0.0218262 6.87969 0.0684082 6.66367C0.473096 5.6875 1.32896 4.26562 2.60864 3.07891ZM7.87505 9.1875C9.08364 9.1875 10.0625 8.20859 10.0625 7C10.0625 5.79141 9.08364 4.8125 7.87505 4.8125C7.85591 4.8125 7.8395 4.8125 7.82036 4.8125C7.85591 4.95195 7.87505 5.09961 7.87505 5.25C7.87505 6.21523 7.09028 7 6.12505 7C5.97466 7 5.827 6.98086 5.68755 6.94531C5.68755 6.96445 5.68755 6.98086 5.68755 7C5.68755 8.20859 6.66646 9.1875 7.87505 9.1875ZM7.87505 3.5C8.80331 3.5 9.69355 3.86875 10.3499 4.52513C11.0063 5.1815 11.375 6.07174 11.375 7C11.375 7.92826 11.0063 8.8185 10.3499 9.47487C9.69355 10.1313 8.80331 10.5 7.87505 10.5C6.94679 10.5 6.05655 10.1313 5.40018 9.47487C4.7438 8.8185 4.37505 7.92826 4.37505 7C4.37505 6.07174 4.7438 5.1815 5.40018 4.52513C6.05655 3.86875 6.94679 3.5 7.87505 3.5Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="isLoading"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ isLoading ? 'Memuat...' : 'Masuk' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="flex items-center gap-4 my-6">
        <div class="flex-1 h-px bg-surface-300" />
        <span class="text-xs text-surface-500">atau masuk lebih cepat</span>
        <div class="flex-1 h-px bg-surface-300" />
      </div>

      <!-- Google Login -->
      <div class="space-y-2">
        <button
          type="button"
          class="w-full h-[58px] px-12 bg-white border border-surface-300 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-50 transition-colors"
          @click="handleGoogleLogin"
        >
          <svg
            class="w-[17px] h-[18px]"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.1562 9.20391C17.1562 14.1785 13.7496 17.7188 8.71875 17.7188C3.89531 17.7188 0 13.8234 0 9C0 4.17656 3.89531 0.28125 8.71875 0.28125C11.0672 0.28125 13.043 1.14258 14.5652 2.56289L12.1922 4.84453C9.08789 1.84922 3.31523 4.09922 3.31523 9C3.31523 12.041 5.74453 14.5055 8.71875 14.5055C12.1711 14.5055 13.4648 12.0305 13.6687 10.7473H8.71875V7.74844H17.0191C17.1 8.19492 17.1562 8.62383 17.1562 9.20391Z" fill="#111827"/>
          </svg>
          <span class="text-sm font-medium text-surface-900">
            Lanjutkan dengan Google
          </span>
        </button>
        <p class="text-xs text-center text-surface-400">
          Akun baru akan dibuat otomatis.
        </p>
      </div>

      <!-- Guest Mode -->
      <div class="mt-5 space-y-2">
        <button
          type="button"
          class="w-full h-[52px] border-2 border-surface-300 rounded-full text-sm font-medium text-surface-500 hover:bg-surface-50 transition-colors"
          @click="handleGuestMode"
        >
          Lanjutkan sebagai tamu
        </button>
        <p class="text-xs text-center text-surface-400">
          Mode tamu: beberapa fitur mungkin terbatas.
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-6 space-y-2 text-center">
        <p class="text-xs text-surface-500">
          Belum punya akun?
          <NuxtLink to="/register" class="text-primary-600 font-medium">
            Daftar cepat saat ambil nomor.
          </NuxtLink>
        </p>
        <div class="space-y-1">
          <p class="text-xs text-surface-400">
            Dengan masuk, kamu menyetujui kebijakan layanan WaitLess.
          </p>
          <p class="text-xs text-surface-400">
            Data hanya dipakai untuk kebutuhan antrean.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
