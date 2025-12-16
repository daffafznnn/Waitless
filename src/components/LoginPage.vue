<template>
  <!-- Main Container -->
  <div class="min-h-screen bg-white border-2 border-gray-300 flex">
    <div class="bg-gray-50 min-h-screen w-full flex">
      <div class="flex w-full">
        <!-- Left Side - Blue Background with Features -->
        <div class="relative w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 hidden lg:flex">
          <!-- Background Pattern Overlay -->
          <div class="absolute inset-0 opacity-10">
            <div class="flex items-center justify-center h-full">
              <!-- SVG pattern can be added here -->
            </div>
          </div>

          <!-- Content -->
          <div class="relative z-10 flex flex-col justify-center max-w-md mx-auto px-8 text-white">
            <!-- Logo Section -->
            <div class="flex flex-col items-center mb-8">
              <div class="bg-white bg-opacity-20 rounded-2xl p-4 mb-6">
                <div class="w-9 h-9 bg-white rounded flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
              </div>
              <h1 class="text-4xl font-bold text-center">WaitLess</h1>
              <p class="text-blue-200 text-lg text-center">{{ pageTitle }}</p>
            </div>

            <!-- Description -->
            <div class="text-center mb-12">
              <h2 class="text-xl font-medium mb-4">{{ subtitle }}</h2>
              <p class="text-blue-200 leading-relaxed">{{ description }}</p>
            </div>

            <!-- Features -->
            <div class="flex flex-col sm:flex-row gap-8 justify-center">
              <div class="flex flex-col items-center text-center">
                <div class="mb-3">
                  <svg class="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <p class="text-sm text-blue-200">{{ features[0] }}</p>
              </div>
              <div class="flex flex-col items-center text-center">
                <div class="mb-3">
                  <svg class="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25l1.5-1.5V6.75l-1.5-1.5H3.5L2 6.75v10l1.5 1.5H19.5z"/>
                  </svg>
                </div>
                <p class="text-sm text-blue-200">{{ features[1] }}</p>
              </div>
              <div class="flex flex-col items-center text-center">
                <div class="mb-3">
                  <svg class="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p class="text-sm text-blue-200">{{ features[2] }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div class="w-full max-w-md space-y-6">
            <!-- Warning Notice -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
              <div class="flex-shrink-0">
                <svg class="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-yellow-800">{{ warningText }}</p>
                <p class="text-sm text-yellow-800">{{ warningSubtext }}</p>
              </div>
            </div>

            <!-- Main Form Card -->
            <div class="bg-white rounded-2xl shadow-xl p-8">
              <!-- Header -->
              <div class="text-center mb-8">
                <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900">{{ formTitle }}</h2>
                <p class="text-blue-600 font-medium mt-2">{{ panelText }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ formSubtitle }}</p>
              </div>

              <!-- Location/Branch Selection (if applicable) -->
              <div v-if="showLocationSelect" class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi / Cabang
                </label>
                <div class="relative">
                  <select v-model="form.location" class="block w-full px-10 py-3 border border-gray-300 rounded-xl bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none">
                    <option v-if="locationStore.loading" value="">Memuat lokasi...</option>
                    <option v-else-if="availableLocations.length === 0" value="">Tidak ada lokasi tersedia</option>
                    <option 
                      v-else 
                      v-for="location in availableLocations" 
                      :key="location.id" 
                      :value="location.name"
                    >
                      {{ location.name }}{{ location.city ? ` - ${location.city}` : '' }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Login Form -->
              <form @submit.prevent="handleLogin" class="space-y-6">
                <!-- Email Field -->
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    {{ emailLabel }}
                  </label>
                  <div class="relative">
                    <input
                      id="email"
                      v-model="form.email"
                      :placeholder="emailPlaceholder"
                      type="email"
                      required
                      class="block w-full px-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Password Field -->
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                    Kata Sandi
                  </label>
                  <div class="relative">
                    <input
                      id="password"
                      v-model="form.password"
                      placeholder="••••••••"
                      :type="showPassword ? 'text' : 'password'"
                      required
                      class="block w-full px-10 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <button 
                      type="button" 
                      @click="showPassword = !showPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg class="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path v-if="showPassword" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        <path v-else d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    </button>
                  </div>
                  <div class="text-right mt-2">
                    <a href="#" class="text-sm text-blue-600 hover:text-blue-500 transition-colors">
                      Lupa password?
                    </a>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-700">{{ error }}</p>
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  :disabled="isLoading"
                  class="w-full bg-blue-600 text-white py-3 px-4 rounded-full font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isLoading ? 'Memuat...' : 'Masuk ke Dashboard' }}
                </button>
              </form>

              <!-- Footer -->
              <div class="border-t border-gray-200 mt-6 pt-6">
                <div class="text-center space-y-1">
                  <p class="text-xs text-gray-600">
                    Hanya untuk petugas / pemilik layanan.
                  </p>
                  <p class="text-xs text-gray-600">
                    Aktivitas akan tercatat di log.
                  </p>
                </div>
              </div>

              <!-- Demo Credentials (if applicable) -->
              <div v-if="showDemoCredentials" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <span class="text-lg">⚠️</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-amber-800">Demo Account</p>
                    <p class="text-sm text-amber-700">
                      Use <strong>{{ demoEmail }}</strong> / <strong>{{ demoPassword }}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Footer -->
            <div class="text-center">
              <p class="text-sm text-gray-500">WaitLess Admin v1.0 — © 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: 'admin' | 'owner'
  showLocationSelect?: boolean
  showDemoCredentials?: boolean
  demoEmail?: string
  demoPassword?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLocationSelect: false,
  showDemoCredentials: false,
  demoEmail: 'demo@waitless.app',
  demoPassword: 'demo123'
})

const router = useRouter()

// Use stores for dynamic behavior
const authStore = useAuthStore()
const locationStore = useLocationStore()

// Load locations on component mount
onMounted(async () => {
  if (props.showLocationSelect) {
    await locationStore.fetchLocations()
  }
})

// Reactive form data
const form = reactive({
  email: '',
  password: '',
  location: 'inParfume Bandung',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = computed(() => authStore.loading)
const error = computed(() => authStore.error)

// Computed properties for different content based on type
const pageTitle = computed(() => {
  return props.type === 'admin' ? 'Admin Panel' : 'Owner Panel'
})

const subtitle = computed(() => {
  return props.type === 'admin' 
    ? 'Kelola antrean harian dengan real-time' 
    : 'Kelola bisnis dan lokasi dengan mudah'
})

const description = computed(() => {
  return props.type === 'admin'
    ? 'Pantau, atur, dan kelola sistem antrian digital untuk memberikan pelayanan terbaik kepada pelanggan Anda.'
    : 'Monitor performa bisnis, kelola lokasi, dan lihat laporan komprehensif untuk mengoptimalkan operasional Anda.'
})

const features = computed(() => {
  return props.type === 'admin'
    ? ['Kelola Antrian', 'Laporan Real-time', 'Pengaturan Loket']
    : ['Kelola Lokasi', 'Laporan Bisnis', 'Analisis Data']
})

const warningText = computed(() => {
  return props.type === 'admin'
    ? 'Gunakan akun yang sudah didaftarkan oleh pemilik'
    : 'Gunakan akun pemilik yang sudah terdaftar'
})

const warningSubtext = computed(() => {
  return props.type === 'admin' ? 'layanan.' : 'sistem.'
})

const formTitle = computed(() => {
  return props.type === 'admin' ? 'Login Admin' : 'Login Owner'
})

const formSubtitle = computed(() => {
  return props.type === 'admin' 
    ? 'Masuk untuk mengelola antrean & loket' 
    : 'Masuk untuk mengelola bisnis & laporan'
})

const emailLabel = computed(() => {
  return props.type === 'admin' ? 'Email Admin' : 'Email Owner'
})

const emailPlaceholder = computed(() => {
  return props.type === 'admin' ? 'admin@waitless.app' : 'owner@waitless.app'
})

// Computed for available locations
const availableLocations = computed(() => {
  return locationStore.locations.filter(location => location.is_active)
})

// Update panel text to be dynamic based on selected location
const panelText = computed(() => {
  if (props.type === 'admin' && form.location) {
    return `Panel: ${form.location}`
  }
  return props.type === 'admin' ? 'Panel: WaitLess Admin' : 'Panel: Business Dashboard'
})

// Handle login with store integration
const handleLogin = async () => {
  if (!form.email || !form.password) return

  try {
    // Use auth store for login
    const result = await authStore.login({
      email: form.email,
      password: form.password,
      role: props.type.toUpperCase(),
      rememberMe: form.rememberMe
    })

    if (result) {
      // Redirect based on user role
      const redirectPath = props.type === 'admin' ? '/admin/dashboard' : '/owner/dashboard'
      await router.push(redirectPath)
    }
  } catch (err: any) {
    // Error is handled by the store and shown via computed error
    console.error('Login failed:', err)
  }
}
</script>

<style scoped>
/* Minimal custom styles - most styling now handled by Tailwind */
</style>