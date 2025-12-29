<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

// APIs
const { login, register } = useAuth()
const authStore = useAuthStore()
const toast = useToast()
const { $modal } = useNuxtApp()

// Mode: 'login' or 'register'
const activeMode = ref<'login' | 'register'>('login')

// Login form
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
})

// Register form
const registerForm = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// UI State
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

// Field touched states for validation
const touched = ref({
  loginEmail: false,
  loginPassword: false,
  registerName: false,
  registerEmail: false,
  registerPhone: false,
  registerPassword: false,
  registerConfirmPassword: false
})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = registerForm.value.password
  if (!password) return { score: 0, label: '', color: '', requirements: [] }
  
  let score = 0
  const requirements = [
    { text: 'Minimal 8 karakter', met: password.length >= 8 },
    { text: 'Huruf kecil (a-z)', met: /[a-z]/.test(password) },
    { text: 'Huruf besar (A-Z)', met: /[A-Z]/.test(password) },
    { text: 'Angka (0-9)', met: /\d/.test(password) }
  ]
  
  requirements.forEach(r => { if (r.met) score++ })
  
  const labels = ['', 'Lemah', 'Cukup', 'Baik', 'Kuat']
  const colors = ['', 'bg-danger-500', 'bg-warning-500', 'bg-primary-500', 'bg-success-500']
  
  return {
    score,
    label: labels[score],
    color: colors[score],
    requirements
  }
})

// Validation computed properties
const loginValidation = computed(() => ({
  email: {
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.value.email),
    message: 'Format email tidak valid'
  },
  password: {
    isValid: loginForm.value.password.length >= 1,
    message: 'Password harus diisi'
  }
}))

const registerValidation = computed(() => {
  const password = registerForm.value.password
  const confirmPassword = registerForm.value.confirmPassword
  
  return {
    name: {
      isValid: registerForm.value.name.length >= 3,
      message: 'Nama minimal 3 karakter'
    },
    email: {
      isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email),
      message: 'Format email tidak valid'
    },
    phone: {
      isValid: !registerForm.value.phone || /^(\+62|62|0)[0-9]{8,12}$/.test(registerForm.value.phone.replace(/\s/g, '')),
      message: 'Format nomor tidak valid (contoh: 08123456789)'
    },
    password: {
      isValid: passwordStrength.value.score >= 4,
      message: 'Password belum memenuhi semua syarat'
    },
    confirmPassword: {
      isValid: confirmPassword === password && confirmPassword.length > 0,
      message: password !== confirmPassword ? 'Password tidak cocok' : 'Konfirmasi password harus diisi'
    },
    terms: {
      isValid: registerForm.value.agreeTerms,
      message: 'Anda harus menyetujui syarat & ketentuan'
    }
  }
})

const isLoginFormValid = computed(() => 
  loginValidation.value.email.isValid && 
  loginValidation.value.password.isValid
)

const isRegisterFormValid = computed(() => 
  registerValidation.value.name.isValid &&
  registerValidation.value.email.isValid &&
  registerValidation.value.phone.isValid &&
  registerValidation.value.password.isValid &&
  registerValidation.value.confirmPassword.isValid &&
  registerValidation.value.terms.isValid
)

// Load remembered email on mount
onMounted(() => {
  const rememberedEmail = localStorage.getItem('waitless_remembered_email')
  if (rememberedEmail) {
    loginForm.value.email = rememberedEmail
    loginForm.value.rememberMe = true
  }
})

// Handle login
const handleLogin = async () => {
  touched.value.loginEmail = true
  touched.value.loginPassword = true
  
  if (!isLoginFormValid.value) {
    toast.add({ 
      title: 'Perhatian', 
      description: 'Mohon isi semua field dengan benar', 
      color: 'orange' 
    })
    return
  }
  
  isLoading.value = true
  try {
    await login({
      email: loginForm.value.email,
      password: loginForm.value.password
    })
    
    // Handle remember me
    if (loginForm.value.rememberMe) {
      localStorage.setItem('waitless_remembered_email', loginForm.value.email)
    } else {
      localStorage.removeItem('waitless_remembered_email')
    }
    
    toast.add({
      title: 'Berhasil! 🎉',
      description: 'Selamat datang kembali di WaitLess',
      color: 'green'
    })
    
    await navigateTo('/')
  } catch (error: any) {
    await $modal.alert({
      title: 'Login Gagal',
      message: error.message || 'Email atau password salah. Silakan coba lagi.',
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle register
const handleRegister = async () => {
  // Mark all fields as touched
  touched.value.registerName = true
  touched.value.registerEmail = true
  touched.value.registerPhone = true
  touched.value.registerPassword = true
  touched.value.registerConfirmPassword = true
  
  if (!isRegisterFormValid.value) {
    // Find first error and show it
    const validation = registerValidation.value
    let errorMessage = 'Mohon lengkapi semua field dengan benar'
    
    if (!validation.name.isValid) errorMessage = validation.name.message
    else if (!validation.email.isValid) errorMessage = validation.email.message
    else if (!validation.phone.isValid) errorMessage = validation.phone.message
    else if (!validation.password.isValid) errorMessage = validation.password.message
    else if (!validation.confirmPassword.isValid) errorMessage = validation.confirmPassword.message
    else if (!validation.terms.isValid) errorMessage = validation.terms.message
    
    toast.add({ title: 'Perhatian', description: errorMessage, color: 'orange' })
    return
  }
  
  isLoading.value = true
  try {
    await register({
      name: registerForm.value.name,
      email: registerForm.value.email,
      phone: registerForm.value.phone || undefined,
      password: registerForm.value.password,
      role: 'VISITOR'
    })
    
    toast.add({
      title: 'Akun Berhasil Dibuat! 🎉',
      description: 'Selamat datang di WaitLess',
      color: 'green'
    })
    
    await navigateTo('/')
  } catch (error: any) {
    const errorMsg = error.message || 'Gagal membuat akun'
    
    if (errorMsg.includes('email')) {
      await $modal.alert({
        title: 'Email Sudah Terdaftar',
        message: 'Email ini sudah digunakan. Silakan gunakan email lain atau login dengan akun yang ada.',
        type: 'warning'
      })
    } else {
      await $modal.alert({
        title: 'Registrasi Gagal',
        message: errorMsg,
        type: 'error'
      })
    }
  } finally {
    isLoading.value = false
  }
}

// Handle Google Login
const handleGoogleLogin = async () => {
  try {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google'
  } catch {
    await $modal.alert({
      title: 'Error',
      message: 'Gagal menghubungkan ke Google. Silakan coba lagi.',
      type: 'error'
    })
  }
}

// Handle forgot password
const handleForgotPassword = async () => {
  await $modal.alert({
    title: 'Lupa Password',
    message: `
      <div class="text-left space-y-3">
        <p>Untuk mereset password, silakan:</p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Hubungi admin di <strong>support@waitless.id</strong></li>
          <li>Sertakan email akun Anda</li>
          <li>Kami akan mengirimkan link reset dalam 24 jam</li>
        </ol>
        <p class="text-sm text-gray-500 mt-3">Atau gunakan login dengan Google untuk akses lebih mudah.</p>
      </div>
    `,
    type: 'info'
  })
}

// Handle guest mode
const handleGuestMode = () => {
  toast.add({
    title: 'Mode Tamu Aktif',
    description: 'Anda dapat menjelajahi WaitLess. Untuk menyimpan antrian, silakan daftar atau login.',
    icon: 'i-heroicons-information-circle',
    color: 'blue'
  })
  navigateTo('/')
}

// Handle terms link
const handleTermsClick = async () => {
  await $modal.alert({
    title: 'Syarat & Ketentuan',
    message: `
      <div class="text-left text-sm space-y-3 max-h-60 overflow-y-auto">
        <h4 class="font-semibold">1. Penggunaan Layanan</h4>
        <p>WaitLess menyediakan layanan antrian online untuk membantu Anda menghemat waktu.</p>
        
        <h4 class="font-semibold">2. Data Pribadi</h4>
        <p>Kami mengumpulkan nama, email, dan nomor telepon untuk keperluan identifikasi antrian dan notifikasi.</p>
        
        <h4 class="font-semibold">3. Keamanan</h4>
        <p>Password Anda dienkripsi dan data Anda tidak akan dijual ke pihak ketiga.</p>
        
        <h4 class="font-semibold">4. Pemberitahuan</h4>
        <p>Kami dapat mengirimkan notifikasi terkait status antrian Anda.</p>
      </div>
    `,
    type: 'info'
  })
}

// SEO
useHead({
  title: computed(() => activeMode.value === 'register' ? 'Daftar - WaitLess' : 'Masuk - WaitLess'),
  meta: [
    { name: 'description', content: 'Masuk atau daftar ke WaitLess untuk mengambil nomor antrian online' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
    <div class="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      
      <!-- Logo & Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-900 mb-1">WaitLess</h1>
        <p class="text-sm text-surface-600">Antrian online, tanpa ribet</p>
      </div>

      <!-- Tab Switcher -->
      <div class="bg-surface-100 rounded-xl p-1 flex mb-6">
        <button
          class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
          :class="activeMode === 'login' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-surface-500 hover:text-surface-700'"
          @click="activeMode = 'login'"
        >
          Masuk
        </button>
        <button
          class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
          :class="activeMode === 'register' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-surface-500 hover:text-surface-700'"
          @click="activeMode = 'register'"
        >
          Daftar
        </button>
      </div>

      <!-- ============ LOGIN FORM ============ -->
      <form 
        v-if="activeMode === 'login'" 
        class="space-y-4"
        @submit.prevent="handleLogin"
      >
        <!-- Email -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Email
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              v-model="loginForm.email"
              type="email"
              placeholder="nama@email.com"
              class="w-full h-12 pl-11 pr-4 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.loginEmail && !loginValidation.email.isValid 
                ? 'border-danger-500 focus:ring-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.loginEmail = true"
            >
          </div>
          <p 
            v-if="touched.loginEmail && !loginValidation.email.isValid" 
            class="text-xs text-danger-600"
          >
            {{ loginValidation.email.message }}
          </p>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-surface-700">
              Password
            </label>
            <button 
              type="button" 
              class="text-xs text-primary-600 hover:text-primary-700 font-medium"
              @click="handleForgotPassword"
            >
              Lupa password?
            </button>
          </div>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan password"
              class="w-full h-12 pl-11 pr-11 bg-white border border-surface-200 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 transition-colors"
              @blur="touched.loginPassword = true"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="loginForm.rememberMe"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
          >
          <span class="text-sm text-surface-600">Ingat email saya</span>
        </label>

        <!-- Login Button -->
        <button
          type="submit"
          class="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="isLoading"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ isLoading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <!-- ============ REGISTER FORM ============ -->
      <form 
        v-else 
        class="space-y-4"
        @submit.prevent="handleRegister"
      >
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Nama Lengkap <span class="text-danger-500">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              v-model="registerForm.name"
              type="text"
              placeholder="Nama lengkap Anda"
              class="w-full h-12 pl-11 pr-4 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.registerName && !registerValidation.name.isValid 
                ? 'border-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.registerName = true"
            >
          </div>
          <p v-if="touched.registerName && !registerValidation.name.isValid" class="text-xs text-danger-600">
            {{ registerValidation.name.message }}
          </p>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Email <span class="text-danger-500">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              v-model="registerForm.email"
              type="email"
              placeholder="nama@email.com"
              class="w-full h-12 pl-11 pr-4 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.registerEmail && !registerValidation.email.isValid 
                ? 'border-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.registerEmail = true"
            >
          </div>
          <p v-if="touched.registerEmail && !registerValidation.email.isValid" class="text-xs text-danger-600">
            {{ registerValidation.email.message }}
          </p>
        </div>

        <!-- Phone -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Nomor HP <span class="text-surface-400">(opsional)</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              v-model="registerForm.phone"
              type="tel"
              placeholder="08123456789"
              class="w-full h-12 pl-11 pr-4 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.registerPhone && !registerValidation.phone.isValid 
                ? 'border-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.registerPhone = true"
            >
          </div>
          <p v-if="touched.registerPhone && !registerValidation.phone.isValid" class="text-xs text-danger-600">
            {{ registerValidation.phone.message }}
          </p>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Password <span class="text-danger-500">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Buat password kuat"
              class="w-full h-12 pl-11 pr-11 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.registerPassword && !registerValidation.password.isValid 
                ? 'border-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.registerPassword = true"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          
          <!-- Password Strength Indicator -->
          <div v-if="registerForm.password" class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-300"
                  :class="passwordStrength.color"
                  :style="{ width: `${(passwordStrength.score / 4) * 100}%` }"
                ></div>
              </div>
              <span class="text-xs font-medium" :class="{
                'text-danger-600': passwordStrength.score === 1,
                'text-warning-600': passwordStrength.score === 2,
                'text-primary-600': passwordStrength.score === 3,
                'text-success-600': passwordStrength.score === 4
              }">
                {{ passwordStrength.label }}
              </span>
            </div>
            <ul class="grid grid-cols-2 gap-x-2 gap-y-1">
              <li 
                v-for="req in passwordStrength.requirements" 
                :key="req.text"
                class="text-xs flex items-center gap-1"
                :class="req.met ? 'text-success-600' : 'text-surface-400'"
              >
                <svg v-if="req.met" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                {{ req.text }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-surface-700">
            Konfirmasi Password <span class="text-danger-500">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Ulangi password"
              class="w-full h-12 pl-11 pr-11 bg-white border rounded-xl text-sm transition-colors"
              :class="touched.registerConfirmPassword && !registerValidation.confirmPassword.isValid 
                ? 'border-danger-500' 
                : 'border-surface-200 focus:ring-primary-500'"
              @blur="touched.registerConfirmPassword = true"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="!showConfirmPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <p v-if="touched.registerConfirmPassword && !registerValidation.confirmPassword.isValid" class="text-xs text-danger-600">
            {{ registerValidation.confirmPassword.message }}
          </p>
          <p v-else-if="registerForm.confirmPassword && registerValidation.confirmPassword.isValid" class="text-xs text-success-600 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Password cocok
          </p>
        </div>

        <!-- Terms Agreement -->
        <label class="flex items-start gap-2 cursor-pointer">
          <input
            v-model="registerForm.agreeTerms"
            type="checkbox"
            class="w-4 h-4 mt-0.5 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
          >
          <span class="text-sm text-surface-600">
            Saya menyetujui 
            <button type="button" class="text-primary-600 font-medium hover:underline" @click.prevent="handleTermsClick">
              Syarat & Ketentuan
            </button>
            serta Kebijakan Privasi WaitLess
          </span>
        </label>

        <!-- Register Button -->
        <button
          type="submit"
          class="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :disabled="isLoading"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ isLoading ? 'Membuat akun...' : 'Daftar Sekarang' }}
        </button>
      </form>

      <!-- ============ SOCIAL LOGIN ============ -->
      <div class="mt-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px bg-surface-200"></div>
          <span class="text-xs text-surface-400 uppercase">atau</span>
          <div class="flex-1 h-px bg-surface-200"></div>
        </div>

        <!-- Google Login -->
        <button
          type="button"
          class="w-full h-12 px-4 bg-white border border-surface-200 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-50 hover:border-surface-300 transition-colors"
          @click="handleGoogleLogin"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-sm font-medium text-surface-700">Lanjutkan dengan Google</span>
        </button>

        <p class="text-xs text-center text-surface-400 mt-2">
          Akun baru akan dibuat otomatis jika belum terdaftar
        </p>
      </div>

      <!-- ============ GUEST MODE ============ -->
      <div class="mt-4">
        <button
          type="button"
          class="w-full h-11 border border-surface-200 rounded-xl text-sm font-medium text-surface-500 hover:bg-surface-50 transition-colors"
          @click="handleGuestMode"
        >
          Lanjutkan sebagai tamu
        </button>
        <p class="text-xs text-center text-surface-400 mt-1.5">
          Beberapa fitur tidak tersedia dalam mode tamu
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-xs text-surface-400">
          Dengan {{ activeMode === 'login' ? 'masuk' : 'mendaftar' }}, Anda menyetujui kebijakan layanan WaitLess.
        </p>
      </div>
    </div>
  </div>
</template>
