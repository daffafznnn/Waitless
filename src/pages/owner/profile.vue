<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Container -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Profile</h1>
        <p class="mt-2 text-gray-600">Kelola informasi profil dan pengaturan akun Owner Anda</p>
      </div>

      <!-- Profile Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Sidebar - Profile Overview -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6">
            <!-- Profile Picture -->
            <div class="text-center">
              <div class="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <span class="text-white font-bold text-2xl">
                  {{ initials }}
                </span>
              </div>
              <h3 class="text-lg font-medium text-gray-900">{{ authStore.user?.name }}</h3>
              <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                {{ authStore.user?.role }}
              </span>
            </div>

            <!-- Business Stats -->
            <div class="mt-6 pt-6 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Informasi Bisnis</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Total Cabang:</span>
                  <span class="text-gray-900 font-medium">{{ businessStats.totalLocations }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Total Staf:</span>
                  <span class="text-gray-900 font-medium">{{ businessStats.totalStaff }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Status:</span>
                  <span class="text-green-600 font-medium">Aktif</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Bergabung:</span>
                  <span class="text-gray-900">{{ formatDate(authStore.user?.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content Area -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Profile Information -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Informasi Profil</h3>
              <p class="text-sm text-gray-500">Update informasi profil dan kontak Anda</p>
            </div>
            
            <form @submit.prevent="updateProfile" class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiFormField
                  label="Nama Lengkap"
                  type="text"
                  v-model="profileForm.name"
                  placeholder="Masukkan nama lengkap"
                  :error="profileErrors.name"
                  required
                />

                <UiFormField
                  label="Email"
                  type="email"
                  v-model="profileForm.email"
                  placeholder="email@example.com"
                  :error="profileErrors.email"
                  disabled
                />
              </div>

              <UiFormField
                label="Nomor Telepon"
                type="tel"
                v-model="profileForm.phone"
                placeholder="+628123456789"
                :error="profileErrors.phone"
              />

              <div class="flex justify-end">
                <UiActionButton
                  type="submit"
                  variant="primary"
                  :loading="isUpdating"
                  :disabled="!isProfileFormValid"
                >
                  Simpan Perubahan
                </UiActionButton>
              </div>
            </form>
          </div>

          <!-- Change Password -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Ubah Password</h3>
              <p class="text-sm text-gray-500">Pastikan akun Anda menggunakan password yang kuat</p>
            </div>
            
            <form @submit.prevent="changePassword" class="p-6 space-y-6">
              <UiFormField
                label="Password Saat Ini"
                type="password"
                v-model="passwordForm.currentPassword"
                placeholder="Masukkan password saat ini"
                :error="passwordErrors.currentPassword"
                required
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UiFormField
                  label="Password Baru"
                  type="password"
                  v-model="passwordForm.newPassword"
                  placeholder="Masukkan password baru"
                  :error="passwordErrors.newPassword"
                  required
                />

                <UiFormField
                  label="Konfirmasi Password Baru"
                  type="password"
                  v-model="passwordForm.confirmPassword"
                  placeholder="Konfirmasi password baru"
                  :error="passwordErrors.confirmPassword"
                  required
                />
              </div>

              <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 class="text-sm font-medium text-yellow-800">Persyaratan Password:</h4>
                <ul class="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>Minimal 8 karakter</li>
                  <li>Mengandung huruf besar dan kecil</li>
                  <li>Mengandung minimal satu angka</li>
                  <li>Mengandung minimal satu karakter khusus</li>
                </ul>
              </div>

              <div class="flex justify-end">
                <UiActionButton
                  type="submit"
                  variant="primary"
                  :loading="isChangingPassword"
                  :disabled="!isPasswordFormValid"
                >
                  Ubah Password
                </UiActionButton>
              </div>
            </form>
          </div>

          <!-- Security Settings -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Keamanan & Sesi</h3>
              <p class="text-sm text-gray-500">Kelola sesi dan pengaturan keamanan akun</p>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Active Sessions Info -->
              <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div class="flex items-start">
                  <svg class="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <h4 class="text-sm font-medium text-blue-800">Sesi Aktif</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      Anda sedang login dari perangkat ini. Logout dari semua perangkat jika diperlukan.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-3">
                <UiActionButton
                  variant="secondary"
                  @click="logoutAllDevices"
                  :loading="isLoggingOut"
                >
                  Logout Semua Perangkat
                </UiActionButton>
                
                <UiActionButton
                  variant="danger"
                  @click="confirmAccountDeactivation"
                >
                  Nonaktifkan Akun
                </UiActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

// Store and auth
const authStore = useAuthStore()
const { updateProfile: updateUserProfile, changePassword: changeUserPassword, logout } = useAuth()
const { getMyLocations, getStaffList } = useOwnerApi()
const { $modal } = useNuxtApp()

// Loading states
const isUpdating = ref(false)
const isChangingPassword = ref(false)
const isLoggingOut = ref(false)

// Profile form
const profileForm = ref({
  name: '',
  email: '',
  phone: ''
})

const profileErrors = ref<Record<string, string>>({})

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordErrors = ref<Record<string, string>>({})

// Business stats
const businessStats = ref({
  totalLocations: 0,
  totalStaff: 0
})

// Computed
const initials = computed(() => {
  const name = authStore.user?.name || 'Owner'
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
})

const isProfileFormValid = computed(() => {
  return profileForm.value.name.trim().length >= 3
})

const isPasswordFormValid = computed(() => {
  return (
    passwordForm.value.currentPassword.length >= 8 &&
    passwordForm.value.newPassword.length >= 8 &&
    passwordForm.value.confirmPassword === passwordForm.value.newPassword
  )
})

// Methods
const initializeProfileForm = () => {
  if (authStore.user) {
    profileForm.value = {
      name: authStore.user.name || '',
      email: authStore.user.email || '',
      phone: authStore.user.phone || ''
    }
  }
}

const loadBusinessStats = async () => {
  try {
    const [locResponse, staffResponse] = await Promise.all([
      getMyLocations(),
      getStaffList()
    ])
    
    if (locResponse.ok && locResponse.data) {
      businessStats.value.totalLocations = locResponse.data.locations?.length || 0
    }
    
    if (staffResponse.ok && staffResponse.data) {
      businessStats.value.totalStaff = staffResponse.data.count || staffResponse.data.staff?.length || 0
    }
  } catch (error) {
    console.error('Failed to load business stats:', error)
  }
}

const validateProfileForm = (): boolean => {
  profileErrors.value = {}
  
  if (!profileForm.value.name.trim()) {
    profileErrors.value.name = 'Nama harus diisi'
  } else if (profileForm.value.name.trim().length < 3) {
    profileErrors.value.name = 'Nama minimal 3 karakter'
  }
  
  if (profileForm.value.phone && !/^\+?[\d\s\-\(\)]+$/.test(profileForm.value.phone)) {
    profileErrors.value.phone = 'Format nomor telepon tidak valid'
  }
  
  return Object.keys(profileErrors.value).length === 0
}

const validatePasswordForm = (): boolean => {
  passwordErrors.value = {}
  
  if (!passwordForm.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Password saat ini harus diisi'
  }
  
  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = 'Password baru harus diisi'
  } else if (passwordForm.value.newPassword.length < 8) {
    passwordErrors.value.newPassword = 'Password minimal 8 karakter'
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Konfirmasi password tidak sesuai'
  }
  
  return Object.keys(passwordErrors.value).length === 0
}

const updateProfile = async () => {
  if (!validateProfileForm()) return
  
  isUpdating.value = true
  
  try {
    await updateUserProfile({
      name: profileForm.value.name.trim(),
      phone: profileForm.value.phone.trim()
    })
    
    await $modal.alert({
      title: 'Berhasil',
      message: 'Profil berhasil diperbarui',
      type: 'success'
    })
  } catch (error: any) {
    await $modal.alert({
      title: 'Error',
      message: error.message || 'Gagal memperbarui profil',
      type: 'error'
    })
  } finally {
    isUpdating.value = false
  }
}

const changePassword = async () => {
  if (!validatePasswordForm()) return
  
  isChangingPassword.value = true
  
  try {
    await changeUserPassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    // Clear password form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    await $modal.alert({
      title: 'Berhasil',
      message: 'Password berhasil diubah',
      type: 'success'
    })
  } catch (error: any) {
    await $modal.alert({
      title: 'Error',
      message: error.message || 'Gagal mengubah password',
      type: 'error'
    })
  } finally {
    isChangingPassword.value = false
  }
}

const logoutAllDevices = async () => {
  const confirmed = await $modal.confirm({
    title: 'Logout Semua Perangkat',
    message: 'Apakah Anda yakin ingin logout dari semua perangkat? Anda perlu login ulang setelah ini.',
    type: 'warning',
    confirmText: 'Ya, Logout Semua',
    cancelText: 'Batal'
  })
  
  if (confirmed) {
    isLoggingOut.value = true
    try {
      await logout()
      await navigateTo('/owner/login')
    } catch (error: any) {
      await $modal.alert({
        title: 'Error',
        message: 'Gagal logout dari semua perangkat',
        type: 'error'
      })
    } finally {
      isLoggingOut.value = false
    }
  }
}

const confirmAccountDeactivation = async () => {
  await $modal.alert({
    title: 'Fitur Belum Tersedia',
    message: 'Fitur nonaktifkan akun akan segera tersedia. Hubungi administrator untuk bantuan.',
    type: 'info'
  })
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Initialize form when component mounts
onMounted(() => {
  initializeProfileForm()
  loadBusinessStats()
})

// Watch for user changes
watch(() => authStore.user, () => {
  initializeProfileForm()
}, { immediate: true })

// SEO
useHead({
  title: 'Profile - Owner - WaitLess',
  meta: [
    { name: 'description', content: 'Kelola informasi profil dan pengaturan akun owner bisnis.' }
  ]
})
</script>