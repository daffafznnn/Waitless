<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { BottomNavigation, VisitorHeader } from '@/components/visitor'

definePageMeta({
  layout: false
})

// APIs and stores
const authStore = useAuthStore()
const { logout, updateProfile, changePassword, initializeAuth } = useAuth()
const { getMyTickets } = useVisitorApi()
const toast = useToast()
const { $modal } = useNuxtApp()

// State
const isLoading = ref(false)
const ticketCount = ref(0)

// User data with fallback
const user = computed(() => {
  const u = authStore.user as any
  return {
    name: u?.name || 'Tamu',
    email: u?.email || '',
    phone: u?.phone || '',
    verified: authStore.isAuthenticated,
    avatar_url: u?.avatar_url || '',
    google_id: u?.google_id || ''
  }
})

// Default avatar using dicebear initials
const defaultAvatar = computed(() => 
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authStore.user?.name || 'Tamu')}`
)

// Check if user has Google account
const isGoogleAccount = computed(() => !!(authStore.user as any)?.google_id)

// Edit Profile Modal State
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editForm = ref({
  name: '',
  phone: ''
})
const editErrors = ref({
  name: '',
  phone: ''
})

// Validation functions
const validateName = (name: string) => {
  if (!name || name.trim().length < 3) {
    return 'Nama minimal 3 karakter'
  }
  if (name.trim().length > 100) {
    return 'Nama maksimal 100 karakter'
  }
  return ''
}

const validatePhone = (phone: string) => {
  if (!phone || phone.trim() === '') {
    return '' // Phone is optional
  }
  // Indonesian phone format: +62xxx or 08xxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/
  const cleaned = phone.replace(/[-\s]/g, '')
  if (!phoneRegex.test(cleaned)) {
    return 'Format: +62xxx atau 08xxx (9-13 digit)'
  }
  return ''
}

// Live validation watchers
watch(() => editForm.value.name, (newVal) => {
  if (isEditModalOpen.value) {
    editErrors.value.name = validateName(newVal)
  }
})

watch(() => editForm.value.phone, (newVal) => {
  if (isEditModalOpen.value) {
    editErrors.value.phone = validatePhone(newVal)
  }
})

// Open edit modal with current data
const openEditModal = () => {
  editForm.value = {
    name: authStore.user?.name || '',
    phone: authStore.user?.phone || ''
  }
  editErrors.value = { name: '', phone: '' }
  isEditModalOpen.value = true
}

// Close edit modal
const closeEditModal = () => {
  isEditModalOpen.value = false
  editErrors.value = { name: '', phone: '' }
}

// Save profile changes
const saveProfile = async () => {
  // Validate all fields
  const nameError = validateName(editForm.value.name)
  const phoneError = validatePhone(editForm.value.phone)
  
  editErrors.value = {
    name: nameError,
    phone: phoneError
  }
  
  if (nameError || phoneError) {
    return
  }
  
  isSaving.value = true
  try {
    await updateProfile({
      name: editForm.value.name.trim(),
      phone: editForm.value.phone.trim() || undefined
    })
    
    toast.add({
      title: '✓ Profil Diperbarui',
      description: 'Data profil berhasil disimpan',
      color: 'green'
    })
    
    closeEditModal()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: error.message || 'Terjadi kesalahan saat menyimpan profil',
      color: 'red'
    })
  } finally {
    isSaving.value = false
  }
}

// Check for unsaved changes
const hasUnsavedChanges = computed(() => {
  return editForm.value.name !== (authStore.user?.name || '') ||
         editForm.value.phone !== (authStore.user?.phone || '')
})

// ===== PASSWORD CHANGE SECTION =====
const showPasswordSection = ref(false)
const isChangingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password validation functions
const validateCurrentPassword = (password: string) => {
  if (!password || password.length < 1) {
    return 'Password saat ini wajib diisi'
  }
  return ''
}

const validateNewPassword = (password: string) => {
  if (!password || password.length < 8) {
    return 'Password minimal 8 karakter'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password harus mengandung huruf besar'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password harus mengandung huruf kecil'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password harus mengandung angka'
  }
  if (password === passwordForm.value.currentPassword) {
    return 'Password baru tidak boleh sama dengan password lama'
  }
  return ''
}

const validateConfirmPassword = (password: string) => {
  if (!password) {
    return 'Konfirmasi password wajib diisi'
  }
  if (password !== passwordForm.value.newPassword) {
    return 'Password tidak cocok'
  }
  return ''
}

// Password strength indicator
const passwordStrength = computed(() => {
  const pwd = passwordForm.value.newPassword
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  
  if (score <= 2) return { level: 1, text: 'Lemah', color: 'bg-danger-500' }
  if (score <= 4) return { level: 2, text: 'Sedang', color: 'bg-warning-500' }
  return { level: 3, text: 'Kuat', color: 'bg-success-500' }
})

// Live validation for password fields
watch(() => passwordForm.value.newPassword, (newVal) => {
  if (showPasswordSection.value) {
    passwordErrors.value.newPassword = validateNewPassword(newVal)
    // Re-validate confirm if already filled
    if (passwordForm.value.confirmPassword) {
      passwordErrors.value.confirmPassword = validateConfirmPassword(passwordForm.value.confirmPassword)
    }
  }
})

watch(() => passwordForm.value.confirmPassword, (newVal) => {
  if (showPasswordSection.value) {
    passwordErrors.value.confirmPassword = validateConfirmPassword(newVal)
  }
})

// Toggle password section
const togglePasswordSection = () => {
  showPasswordSection.value = !showPasswordSection.value
  if (!showPasswordSection.value) {
    // Reset form when hiding
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    passwordErrors.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  }
}

// Save password
const savePassword = async () => {
  // Validate all fields
  const currentError = validateCurrentPassword(passwordForm.value.currentPassword)
  const newError = validateNewPassword(passwordForm.value.newPassword)
  const confirmError = validateConfirmPassword(passwordForm.value.confirmPassword)
  
  passwordErrors.value = {
    currentPassword: currentError,
    newPassword: newError,
    confirmPassword: confirmError
  }
  
  if (currentError || newError || confirmError) {
    return
  }
  
  isChangingPassword.value = true
  try {
    await changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    toast.add({
      title: '🔐 Password Diubah',
      description: 'Password berhasil diperbarui',
      color: 'green'
    })
    
    // Reset and hide form
    togglePasswordSection()
  } catch (error: any) {
    // Check for specific error messages
    const errorMsg = error.message || 'Gagal mengubah password'
    if (errorMsg.includes('incorrect') || errorMsg.includes('wrong') || errorMsg.includes('salah')) {
      passwordErrors.value.currentPassword = 'Password saat ini salah'
    } else {
      toast.add({
        title: 'Gagal Mengubah Password',
        description: errorMsg,
        color: 'red'
      })
    }
  } finally {
    isChangingPassword.value = false
  }
}

// Check if password form has changes
const hasPasswordChanges = computed(() => {
  return passwordForm.value.currentPassword || passwordForm.value.newPassword || passwordForm.value.confirmPassword
})

// Settings
const settings = ref({
  favoriteLocation: 'Belum dipilih',
  defaultLocation: 'Bandung',
  notifyOnCall: true,
  notifyOnHold: false
})

// Load user data
const loadUserData = async () => {
  if (!authStore.isAuthenticated) return
  
  try {
    // Load ticket count
    const tickets = await getMyTickets()
    ticketCount.value = tickets.filter(t => 
      ['waiting', 'called', 'serving'].includes(t.status)
    ).length
    
    // Load settings from localStorage
    const stored = localStorage.getItem('waitless_settings')
    if (stored) {
      settings.value = { ...settings.value, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to load user data:', error)
  }
}

// Save settings to localStorage
const saveSettings = () => {
  try {
    localStorage.setItem('waitless_settings', JSON.stringify(settings.value))
    toast.add({
      title: 'Berhasil',
      description: 'Pengaturan disimpan',
      color: 'green'
    })
  } catch {
    // Ignore localStorage errors
  }
}

// Handlers
const handleEditData = async () => {
  if (!authStore.isAuthenticated) {
    await $modal.alert({
      title: 'Masuk Diperlukan',
      message: 'Silakan login untuk mengedit data profil.',
      type: 'info'
    })
    navigateTo('/login')
    return
  }
  
  // Open edit modal
  openEditModal()
}

const handleChangeFavorite = async () => {
  await $modal.alert({
    title: 'Pilih Tempat Favorit',
    message: 'Fitur tempat favorit akan segera tersedia.',
    type: 'info'
  })
}

const handleChangeLocation = async () => {
  await $modal.alert({
    title: 'Pilih Lokasi Default',
    message: 'Fitur lokasi default akan segera tersedia.',
    type: 'info'
  })
}

const handleLogout = async () => {
  const confirmed = await $modal.confirm({
    title: 'Keluar',
    message: 'Apakah Anda yakin ingin keluar dari akun ini?',
    type: 'warning',
    confirmText: 'Ya, Keluar',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  isLoading.value = true
  try {
    await logout()
    toast.add({
      title: 'Berhasil',
      description: 'Anda telah keluar dari akun',
      color: 'green'
    })
    navigateTo('/login')
  } catch (error: any) {
    await $modal.alert({
      title: 'Error',
      message: error.message || 'Gagal logout',
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const navigateToHistory = () => {
  navigateTo('/queue/me')
}

const navigateToHelp = async () => {
  await $modal.alert({
    title: 'Pusat Bantuan',
    message: `
      <div class="text-left space-y-2">
        <p><strong>FAQ:</strong></p>
        <ul class="list-disc pl-4 text-sm">
          <li>Nomor antrian berlaku di cabang yang sama</li>
          <li>Antrian akan hilang saat loket tutup</li>
          <li>Admin dapat menahan nomor jika tidak hadir</li>
        </ul>
        <p class="mt-3 text-sm">Butuh bantuan? Email: support@waitless.id</p>
      </div>
    `,
    type: 'info'
  })
}

const navigateToPolicy = async () => {
  await $modal.alert({
    title: 'Kebijakan & Privasi',
    message: `
      <div class="text-left text-sm space-y-2">
        <p>WaitLess menghargai privasi Anda. Data yang kami kumpulkan:</p>
        <ul class="list-disc pl-4">
          <li>Nama dan email untuk identifikasi</li>
          <li>Nomor HP untuk notifikasi (opsional)</li>
          <li>Riwayat antrian untuk pengalaman lebih baik</li>
        </ul>
        <p class="mt-2">Data Anda tidak dijual ke pihak ketiga.</p>
      </div>
    `,
    type: 'info'
  })
}

// Watch settings changes
watch(settings, saveSettings, { deep: true })

// Lifecycle
onMounted(async () => {
  await initializeAuth()
  await loadUserData()
})

// SEO
useHead({
  title: 'Profil Saya - Waitless'
})
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <VisitorHeader
      title="Profil saya"
      subtitle="Atur akun dan preferensi antrean."
      :show-notification="false"
      :show-profile="false"
    >
      <template #actions>
        <button
          class="flex-shrink-0 p-2 -mr-2 text-surface-400 hover:text-surface-700 transition-colors"
          @click="handleEditData"
        >
          <svg class="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="currentColor">
            <path d="M17.4339 5.85703C17.5464 6.16289 17.4515 6.50391 17.2089 6.72187L15.6866 8.10703C15.7253 8.39883 15.7464 8.69766 15.7464 9C15.7464 9.30234 15.7253 9.60117 15.6866 9.89297L17.2089 11.2781C17.4515 11.4961 17.5464 11.8371 17.4339 12.143C17.2792 12.5613 17.0929 12.9621 16.8784 13.3488L16.7132 13.6336C16.4812 14.0203 16.221 14.3859 15.9362 14.7305C15.7288 14.9836 15.3843 15.068 15.0749 14.9695L13.1167 14.3473C12.6456 14.7094 12.1253 15.0117 11.5698 15.2402L11.1304 17.2477C11.0601 17.5676 10.814 17.8207 10.4905 17.8734C10.0054 17.9543 9.50616 17.9965 8.9964 17.9965C8.48663 17.9965 7.98741 17.9543 7.50225 17.8734C7.17882 17.8207 6.93272 17.5676 6.86241 17.2477L6.42296 15.2402C5.86749 15.0117 5.34718 14.7094 4.87608 14.3473L2.9214 14.973C2.61202 15.0715 2.26749 14.9836 2.06007 14.734C1.7753 14.3895 1.51515 14.0238 1.28311 13.6371L1.11788 13.3523C0.903427 12.9656 0.717099 12.5648 0.562411 12.1465C0.449911 11.8406 0.544833 11.4996 0.787411 11.2816L2.30968 9.89648C2.27101 9.60117 2.24991 9.30234 2.24991 9C2.24991 8.69766 2.27101 8.39883 2.30968 8.10703L0.787411 6.72187C0.544833 6.50391 0.449911 6.16289 0.562411 5.85703C0.717099 5.43867 0.903427 5.03789 1.11788 4.65117L1.28311 4.36641C1.51515 3.97969 1.7753 3.61406 2.06007 3.26953C2.26749 3.01641 2.61202 2.93203 2.9214 3.03047L4.8796 3.65273C5.35069 3.29063 5.87101 2.98828 6.42647 2.75977L6.86593 0.752344C6.93624 0.432422 7.18233 0.179297 7.50577 0.126562C7.99093 0.0421875 8.49015 0 8.99991 0C9.50968 0 10.0089 0.0421875 10.4941 0.123047C10.8175 0.175781 11.0636 0.428906 11.1339 0.748828L11.5733 2.75625C12.1288 2.98477 12.6491 3.28711 13.1202 3.64922L15.0784 3.02695C15.3878 2.92852 15.7323 3.01641 15.9398 3.26602C16.2245 3.61055 16.4847 3.97617 16.7167 4.36289L16.8819 4.64766C17.0964 5.03437 17.2827 5.43516 17.4374 5.85352L17.4339 5.85703ZM8.99991 11.8125C9.74583 11.8125 10.4612 11.5162 10.9886 10.9887C11.5161 10.4613 11.8124 9.74592 11.8124 9C11.8124 8.25408 11.5161 7.53871 10.9886 7.01126C10.4612 6.48382 9.74583 6.1875 8.99991 6.1875C8.25399 6.1875 7.53862 6.48382 7.01117 7.01126C6.48373 7.53871 6.18741 8.25408 6.18741 9C6.18741 9.74592 6.48373 10.4613 7.01117 10.9887C7.53862 11.5162 8.25399 11.8125 8.99991 11.8125Z"/>
          </svg>
        </button>
      </template>
    </VisitorHeader>


    <!-- Not Logged In Warning -->
    <div v-if="!authStore.isAuthenticated" class="px-4 pt-5">
      <div class="bg-warning-50 border border-warning-200 rounded-2xl px-3 py-3 flex items-start gap-2">
        <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-warning-600" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 14C8.85652 14 10.637 13.2625 11.9497 11.9497C13.2625 10.637 14 8.85652 14 7C14 5.14348 13.2625 3.36301 11.9497 2.05025C10.637 0.737498 8.85652 0 7 0C5.14348 0 3.36301 0.737498 2.05025 2.05025C0.737498 3.36301 0 5.14348 0 7C0 8.85652 0.737498 10.637 2.05025 11.9497C3.36301 13.2625 5.14348 14 7 14Z"/>
        </svg>
        <div>
          <p class="text-sm text-warning-900 leading-5">
            Anda dalam mode tamu. 
            <NuxtLink to="/login" class="font-medium underline">Masuk</NuxtLink> 
            untuk menyimpan pengaturan.
          </p>
        </div>
      </div>
    </div>

    <!-- User Profile Card -->
    <div class="px-4 pt-4">
      <div class="bg-white rounded-2xl p-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Avatar - ClientOnly to avoid SSR hydration mismatch -->
            <ClientOnly>
              <div class="relative flex-shrink-0">
                <img
                  :src="user.avatar_url || defaultAvatar"
                  :alt="user.name"
                  class="w-14 h-14 rounded-full object-cover bg-surface-100"
                  referrerpolicy="no-referrer"
                  @error="($event.target as HTMLImageElement).src = defaultAvatar"
                >
                <!-- Google badge -->
                <div 
                  v-if="isGoogleAccount" 
                  class="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-surface-200"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              </div>
              <template #fallback>
                <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-primary-600 text-xl font-bold">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </template>
            </ClientOnly>
            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-surface-900 mb-0.5 truncate">
                {{ user.name }}
              </h2>
              <p v-if="user.email" class="text-sm text-surface-600 mb-1">
                {{ user.email }}
              </p>
              <span 
                v-if="user.verified"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 text-success-700 text-xs font-normal"
              >
                <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 12C7.5913 12 9.11742 11.3679 10.2426 10.2426C11.3679 9.11742 12 7.5913 12 6C12 4.4087 11.3679 2.88258 10.2426 1.75736C9.11742 0.632141 7.5913 0 6 0C4.4087 0 2.88258 0.632141 1.75736 1.75736C0.632141 2.88258 0 4.4087 0 6C0 7.5913 0.632141 9.11742 1.75736 10.2426C2.88258 11.3679 4.4087 12 6 12ZM8.64844 4.89844L5.64844 7.89844C5.42812 8.11875 5.07188 8.11875 4.85391 7.89844L3.35391 6.39844C3.13359 6.17812 3.13359 5.82188 3.35391 5.60391C3.57422 5.38594 3.93047 5.38359 4.14844 5.60391L5.25 6.70547L7.85156 4.10156C8.07187 3.88125 8.42812 3.88125 8.64609 4.10156C8.86406 4.32188 8.86641 4.67812 8.64609 4.89609L8.64844 4.89844Z"/>
                </svg>
                Akun terverifikasi
              </span>
              <span 
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 text-xs"
              >
                Mode Tamu
              </span>
            </div>
          </div>
          <button
            v-if="authStore.isAuthenticated"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            @click="handleEditData"
          >
            Edit data
          </button>
        </div>
        
        <!-- Active Tickets Badge -->
        <div v-if="ticketCount > 0" class="mt-4 pt-4 border-t border-surface-100">
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-600">Antrian aktif</span>
            <NuxtLink to="/queue/me" class="flex items-center gap-2 text-primary-600 text-sm font-medium">
              {{ ticketCount }} antrian
              <svg class="w-3 h-3" viewBox="0 0 8 12" fill="currentColor">
                <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Section -->
    <div class="px-4 pt-6">
      <h3 class="text-sm font-medium text-surface-700 text-center mb-3">
        Pengaturan antrean
      </h3>

      <div class="bg-white rounded-2xl p-4 space-y-4">
        <!-- Favorite Location -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">
            Tempat favorit
          </label>
          <button
            class="w-full flex items-center justify-between px-3 py-2.5 bg-surface-50 rounded-xl text-left"
            @click="handleChangeFavorite"
          >
            <span class="text-sm text-surface-900">
              {{ settings.favoriteLocation }}
            </span>
            <svg class="w-3 h-3 text-surface-400" viewBox="0 0 12 12" fill="currentColor">
              <path d="M5.47036 9.52968C5.76333 9.82264 6.23911 9.82264 6.53208 9.52968L11.0321 5.02968C11.325 4.73671 11.325 4.26093 11.0321 3.96796C10.7391 3.67499 10.2633 3.67499 9.97036 3.96796L6.00005 7.93827L2.02974 3.9703C1.73677 3.67733 1.26099 3.67733 0.968018 3.9703C0.675049 4.26327 0.675049 4.73905 0.968018 5.03202L5.46802 9.53202L5.47036 9.52968Z"/>
            </svg>
          </button>
          <p class="text-xs text-surface-500">
            Ditampilkan duluan di beranda.
          </p>
        </div>

        <!-- Default Location -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">
            Lokasi default
          </label>
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-900">
              {{ settings.defaultLocation }}
            </span>
            <button
              class="text-sm font-medium text-primary-600 hover:text-primary-700"
              @click="handleChangeLocation"
            >
              Ubah
            </button>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-surface-700 mb-0.5">
              Notifikasi saat nomor dipanggil
            </h4>
            <p class="text-xs text-surface-500 leading-4">
              Kamu akan mendapat pengingat ketika status jadi Serving.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              v-model="settings.notifyOnCall"
              type="checkbox"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>

        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-surface-700 mb-0.5">
              Notifikasi antrean ditahan
            </h4>
            <p class="text-xs text-surface-500 leading-4">
              Dapatkan info kalau admin menahan nomor kamu.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              v-model="settings.notifyOnHold"
              type="checkbox"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>
      </div>
    </div>

    <!-- Additional Options -->
    <div class="px-4 pt-4">
      <div class="bg-white rounded-2xl overflow-hidden divide-y divide-surface-100">
        <button 
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors"
          @click="navigateToHistory"
        >
          <span class="text-sm text-surface-700">Riwayat antrean saya</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>
        
        <button 
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors"
          @click="navigateToHelp"
        >
          <span class="text-sm text-surface-700">Pusat bantuan / FAQ singkat</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>

        <button 
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors"
          @click="navigateToPolicy"
        >
          <span class="text-sm text-surface-700">Kebijakan & privasi</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Logout Section -->
    <div v-if="authStore.isAuthenticated" class="px-4 pt-4">
      <div class="bg-white rounded-2xl p-4 space-y-3">
        <button
          class="w-full py-3 border-2 border-danger-300 rounded-full text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
          :disabled="isLoading"
          @click="handleLogout"
        >
          {{ isLoading ? 'Memproses...' : 'Keluar / Logout' }}
        </button>
        <div class="text-center space-y-1">
          <p class="text-xs text-surface-500 leading-4">
            Logout hanya menghapus sesi di perangkat ini.
          </p>
          <p class="text-xs text-surface-500 leading-4">
            Nomor antrean yang aktif tetap tersimpan.
          </p>
        </div>
      </div>
    </div>

    <!-- Login CTA for Guest -->
    <div v-else class="px-4 pt-4">
      <div class="bg-primary-50 rounded-2xl p-4 text-center">
        <p class="text-sm text-primary-900 mb-3">Masuk untuk menyimpan pengaturan</p>
        <NuxtLink
          to="/login"
          class="inline-block px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
        >
          Masuk Sekarang
        </NuxtLink>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="isEditModalOpen" 
          class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          @click.self="closeEditModal"
        >
          <Transition name="slide-up">
            <div 
              v-if="isEditModalOpen"
              class="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <!-- Modal Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                <div class="flex items-center gap-3">
                  <button 
                    class="p-1 -ml-1 text-surface-500 hover:text-surface-700"
                    @click="closeEditModal"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 class="text-lg font-semibold text-surface-900">Edit Profil</h2>
                </div>
                <div v-if="hasUnsavedChanges" class="text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded-full">
                  Belum disimpan
                </div>
              </div>

              <!-- Modal Content -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <!-- Avatar Preview -->
                <div class="flex flex-col items-center gap-3">
                  <ClientOnly>
                    <div class="relative">
                      <img
                        :src="user.avatar_url || defaultAvatar"
                        :alt="editForm.name || 'User'"
                        class="w-20 h-20 rounded-full object-cover bg-surface-100 ring-4 ring-primary-100"
                        referrerpolicy="no-referrer"
                      >
                      <div 
                        v-if="isGoogleAccount" 
                        class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-surface-200"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                    </div>
                    <template #fallback>
                      <div class="w-20 h-20 rounded-full bg-primary-100 animate-pulse" />
                    </template>
                  </ClientOnly>
                  <p class="text-xs text-surface-500 text-center">
                    {{ isGoogleAccount ? 'Foto diambil dari akun Google Anda' : 'Foto profil otomatis dari inisial nama' }}
                  </p>
                </div>

                <!-- Name Field -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-surface-700">
                    Nama Lengkap <span class="text-danger-500">*</span>
                  </label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    class="w-full px-4 py-3 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    :class="editErrors.name ? 'border-danger-300 bg-danger-50/50' : 'border-surface-200'"
                    maxlength="100"
                  >
                  <p v-if="editErrors.name" class="text-xs text-danger-600 flex items-center gap-1">
                    <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 9.5h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
                    </svg>
                    {{ editErrors.name }}
                  </p>
                  <p v-else class="text-xs text-surface-500">
                    Minimal 3 karakter, maksimal 100 karakter
                  </p>
                </div>

                <!-- Phone Field -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-surface-700">
                    Nomor Telepon <span class="text-surface-400">(opsional)</span>
                  </label>
                  <input
                    v-model="editForm.phone"
                    type="tel"
                    placeholder="+62 812-3456-7890"
                    class="w-full px-4 py-3 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    :class="editErrors.phone ? 'border-danger-300 bg-danger-50/50' : 'border-surface-200'"
                    maxlength="20"
                  >
                  <p v-if="editErrors.phone" class="text-xs text-danger-600 flex items-center gap-1">
                    <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 9.5h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
                    </svg>
                    {{ editErrors.phone }}
                  </p>
                  <p v-else class="text-xs text-surface-500">
                    Format: +62xxx atau 08xxx (9-13 digit)
                  </p>
                </div>

                <!-- Email Field (Read-only) -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-surface-700">
                    Email <span class="text-surface-400">(tidak dapat diubah)</span>
                  </label>
                  <div class="relative">
                    <input
                      :value="user.email"
                      type="email"
                      disabled
                      class="w-full px-4 py-3 bg-surface-100 border border-surface-200 rounded-xl text-sm text-surface-500 cursor-not-allowed"
                    >
                    <div class="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <p class="text-xs text-surface-500">
                    Email digunakan untuk login dan tidak dapat diubah
                  </p>
                </div>

                <!-- Change Password Section (Collapsible) - Only for non-Google accounts -->
                <div v-if="!isGoogleAccount" class="border-t border-surface-100 pt-5">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between text-left group"
                    @click="togglePasswordSection"
                  >
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span class="text-sm font-medium text-surface-700 group-hover:text-surface-900">
                        Ubah Password
                      </span>
                    </div>
                    <svg 
                      class="w-4 h-4 text-surface-400 transition-transform duration-200"
                      :class="{ 'rotate-180': showPasswordSection }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- Password Form (Collapsible) -->
                  <Transition name="slide-down">
                    <div v-if="showPasswordSection" class="mt-4 space-y-4">
                      <!-- Current Password -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-surface-700">
                          Password Saat Ini <span class="text-danger-500">*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="passwordForm.currentPassword"
                            :type="showCurrentPassword ? 'text' : 'password'"
                            placeholder="Masukkan password saat ini"
                            class="w-full px-4 py-3 pr-12 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            :class="passwordErrors.currentPassword ? 'border-danger-300 bg-danger-50/50' : 'border-surface-200'"
                          >
                          <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
                            @click="showCurrentPassword = !showCurrentPassword"
                          >
                            <svg v-if="showCurrentPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        <p v-if="passwordErrors.currentPassword" class="text-xs text-danger-600 flex items-center gap-1">
                          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 9.5h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
                          </svg>
                          {{ passwordErrors.currentPassword }}
                        </p>
                      </div>

                      <!-- New Password -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-surface-700">
                          Password Baru <span class="text-danger-500">*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="passwordForm.newPassword"
                            :type="showNewPassword ? 'text' : 'password'"
                            placeholder="Minimal 8 karakter"
                            class="w-full px-4 py-3 pr-12 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            :class="passwordErrors.newPassword ? 'border-danger-300 bg-danger-50/50' : 'border-surface-200'"
                          >
                          <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
                            @click="showNewPassword = !showNewPassword"
                          >
                            <svg v-if="showNewPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        <!-- Password Strength Meter -->
                        <div v-if="passwordForm.newPassword" class="space-y-1">
                          <div class="flex gap-1">
                            <div class="h-1 flex-1 rounded-full bg-surface-200">
                              <div 
                                class="h-full rounded-full transition-all duration-300"
                                :class="passwordStrength.color"
                                :style="{ width: `${(passwordStrength.level / 3) * 100}%` }"
                              />
                            </div>
                          </div>
                          <p class="text-xs" :class="passwordStrength.level === 3 ? 'text-success-600' : passwordStrength.level === 2 ? 'text-warning-600' : 'text-danger-600'">
                            Kekuatan: {{ passwordStrength.text }}
                          </p>
                        </div>
                        <p v-if="passwordErrors.newPassword" class="text-xs text-danger-600 flex items-center gap-1">
                          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 9.5h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
                          </svg>
                          {{ passwordErrors.newPassword }}
                        </p>
                        <p v-else-if="!passwordForm.newPassword" class="text-xs text-surface-500">
                          Huruf besar, huruf kecil, dan angka
                        </p>
                      </div>

                      <!-- Confirm Password -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-surface-700">
                          Konfirmasi Password Baru <span class="text-danger-500">*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="passwordForm.confirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            placeholder="Ulangi password baru"
                            class="w-full px-4 py-3 pr-12 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            :class="passwordErrors.confirmPassword ? 'border-danger-300 bg-danger-50/50' : 'border-surface-200'"
                          >
                          <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
                            @click="showConfirmPassword = !showConfirmPassword"
                          >
                            <svg v-if="showConfirmPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        <p v-if="passwordErrors.confirmPassword" class="text-xs text-danger-600 flex items-center gap-1">
                          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6S9.31 0 6 0zm.5 9.5h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
                          </svg>
                          {{ passwordErrors.confirmPassword }}
                        </p>
                      </div>

                      <!-- Save Password Button -->
                      <button
                        type="button"
                        class="w-full py-3 bg-surface-800 text-white text-sm font-semibold rounded-xl hover:bg-surface-900 active:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        :disabled="isChangingPassword || !hasPasswordChanges || !!passwordErrors.currentPassword || !!passwordErrors.newPassword || !!passwordErrors.confirmPassword"
                        @click="savePassword"
                      >
                        <template v-if="isChangingPassword">
                          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Menyimpan...
                        </template>
                        <template v-else>
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Ubah Password
                        </template>
                      </button>
                    </div>
                  </Transition>
                </div>

                <!-- Google Account Note -->
                <div v-else class="border-t border-surface-100 pt-5">
                  <div class="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                    <svg class="w-5 h-5 text-surface-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-surface-700">Akun Google</p>
                      <p class="text-xs text-surface-500 mt-0.5">
                        Password dikelola oleh Google. Kunjungi pengaturan akun Google untuk mengubah password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="px-6 py-4 border-t border-surface-100 bg-white space-y-3">
                <button
                  class="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="isSaving || !hasUnsavedChanges || !!editErrors.name || !!editErrors.phone"
                  @click="saveProfile"
                >
                  <template v-if="isSaving">
                    <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Menyimpan...
                  </template>
                  <template v-else>
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Perubahan
                  </template>
                </button>
                <button
                  class="w-full py-3 text-surface-600 text-sm font-medium hover:text-surface-800 transition-colors"
                  @click="closeEditModal"
                >
                  Batal
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide-up transition for modal */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Slide-down transition for collapsible sections */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}
</style>
