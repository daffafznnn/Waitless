<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BottomNavigation } from '@/components/visitor'

definePageMeta({
  layout: false
})

// Auth store
const authStore = useAuthStore()
const { logout, me } = useAuth()
const { $modal } = useNuxtApp()
const toast = useToast()

// Computed user data from auth store
const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Default avatar if user doesn't have one
const defaultAvatar = 'https://api.dicebear.com/7.x/initials/svg?seed='

// Avatar URL - use Google avatar if available, otherwise generate from initials
const avatarUrl = computed(() => {
  if (user.value?.avatar_url) {
    return user.value.avatar_url
  }
  // Generate from name initials
  return `${defaultAvatar}${encodeURIComponent(user.value?.name || 'Guest')}`
})

// Display name
const displayName = computed(() => {
  if (!isAuthenticated.value || !user.value) {
    return 'Tamu'
  }
  return user.value.name || 'Pengguna'
})

// Display phone
const displayPhone = computed(() => {
  return user.value?.phone || 'Belum diatur'
})

// Display email
const displayEmail = computed(() => {
  return user.value?.email || ''
})

// Is Google account
const isGoogleAccount = computed(() => {
  return !!user.value?.google_id
})

// Settings
const settings = ref({
  favoriteLocation: 'inParfume Bandung',
  defaultLocation: 'Bandung',
  notifyOnCall: true,
  notifyOnHold: false
})

// Load settings from localStorage
onMounted(() => {
  const savedSettings = localStorage.getItem('waitless_settings')
  if (savedSettings) {
    try {
      Object.assign(settings.value, JSON.parse(savedSettings))
    } catch (e) {
      console.warn('Failed to parse saved settings')
    }
  }
})

// Save settings to localStorage when changed
watch(settings, (newSettings) => {
  localStorage.setItem('waitless_settings', JSON.stringify(newSettings))
}, { deep: true })

const handleEditData = async () => {
  if (!isAuthenticated.value) {
    await $modal.alert({
      title: 'Login Diperlukan',
      message: 'Silakan login untuk mengedit data profil.',
      type: 'info'
    })
    return
  }
  
  await $modal.alert({
    title: 'Edit Profil',
    message: 'Fitur edit profil akan segera tersedia.',
    type: 'info'
  })
}

const handleChangeFavorite = () => {
  toast.add({
    title: 'Info',
    description: 'Fitur tempat favorit akan segera tersedia.',
    color: 'blue'
  })
}

const handleChangeLocation = () => {
  toast.add({
    title: 'Info',
    description: 'Fitur lokasi default akan segera tersedia.',
    color: 'blue'
  })
}

const handleLogout = async () => {
  if (!isAuthenticated.value) {
    navigateTo('/login')
    return
  }

  const confirmed = await $modal.confirm({
    title: 'Keluar dari Akun',
    message: 'Anda yakin ingin keluar? Nomor antrean aktif tetap tersimpan.',
    confirmText: 'Ya, Keluar',
    cancelText: 'Batal',
    type: 'warning'
  })

  if (confirmed) {
    await logout()
    toast.add({
      title: 'Logout Berhasil',
      description: 'Sampai jumpa lagi!',
      color: 'green'
    })
  }
}

const goToLogin = () => {
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <header class="bg-white px-6 py-4 sticky top-0 z-10">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-lg font-semibold text-surface-900 mb-0.5">
            Profil saya
          </h1>
          <p class="text-xs text-surface-500 leading-4">
            Atur akun dan preferensi antrean.
          </p>
        </div>
        <button class="flex-shrink-0 p-2 -mr-2">
          <svg
            class="w-[18px] h-[18px] text-surface-400"
            viewBox="0 0 18 18"
            fill="currentColor"
          >
            <path d="M17.4339 5.85703C17.5464 6.16289 17.4515 6.50391 17.2089 6.72187L15.6866 8.10703C15.7253 8.39883 15.7464 8.69766 15.7464 9C15.7464 9.30234 15.7253 9.60117 15.6866 9.89297L17.2089 11.2781C17.4515 11.4961 17.5464 11.8371 17.4339 12.143C17.2792 12.5613 17.0929 12.9621 16.8784 13.3488L16.7132 13.6336C16.4812 14.0203 16.221 14.3859 15.9362 14.7305C15.7288 14.9836 15.3843 15.068 15.0749 14.9695L13.1167 14.3473C12.6456 14.7094 12.1253 15.0117 11.5698 15.2402L11.1304 17.2477C11.0601 17.5676 10.814 17.8207 10.4905 17.8734C10.0054 17.9543 9.50616 17.9965 8.9964 17.9965C8.48663 17.9965 7.98741 17.9543 7.50225 17.8734C7.17882 17.8207 6.93272 17.5676 6.86241 17.2477L6.42296 15.2402C5.86749 15.0117 5.34718 14.7094 4.87608 14.3473L2.9214 14.973C2.61202 15.0715 2.26749 14.9836 2.06007 14.734C1.7753 14.3895 1.51515 14.0238 1.28311 13.6371L1.11788 13.3523C0.903427 12.9656 0.717099 12.5648 0.562411 12.1465C0.449911 11.8406 0.544833 11.4996 0.787411 11.2816L2.30968 9.89648C2.27101 9.60117 2.24991 9.30234 2.24991 9C2.24991 8.69766 2.27101 8.39883 2.30968 8.10703L0.787411 6.72187C0.544833 6.50391 0.449911 6.16289 0.562411 5.85703C0.717099 5.43867 0.903427 5.03789 1.11788 4.65117L1.28311 4.36641C1.51515 3.97969 1.7753 3.61406 2.06007 3.26953C2.26749 3.01641 2.61202 2.93203 2.9214 3.03047L4.8796 3.65273C5.35069 3.29063 5.87101 2.98828 6.42647 2.75977L6.86593 0.752344C6.93624 0.432422 7.18233 0.179297 7.50577 0.126562C7.99093 0.0421875 8.49015 0 8.99991 0C9.50968 0 10.0089 0.0421875 10.4941 0.123047C10.8175 0.175781 11.0636 0.428906 11.1339 0.748828L11.5733 2.75625C12.1288 2.98477 12.6491 3.28711 13.1202 3.64922L15.0784 3.02695C15.3878 2.92852 15.7323 3.01641 15.9398 3.26602C16.2245 3.61055 16.4847 3.97617 16.7167 4.36289L16.8819 4.64766C17.0964 5.03437 17.2827 5.43516 17.4374 5.85352L17.4339 5.85703ZM8.99991 11.8125C9.74583 11.8125 10.4612 11.5162 10.9886 10.9887C11.5161 10.4613 11.8124 9.74592 11.8124 9C11.8124 8.25408 11.5161 7.53871 10.9886 7.01126C10.4612 6.48382 9.74583 6.1875 8.99991 6.1875C8.25399 6.1875 7.53862 6.48382 7.01117 7.01126C6.48373 7.53871 6.18741 8.25408 6.18741 9C6.18741 9.74592 6.48373 10.4613 7.01117 10.9887C7.53862 11.5162 8.25399 11.8125 8.99991 11.8125Z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Guest Mode Banner -->
    <template v-if="!isAuthenticated">
      <div class="px-4 pt-5">
        <div class="bg-primary-50 border border-primary-200 rounded-2xl px-4 py-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-primary-900">Mode Tamu</h3>
              <p class="text-xs text-primary-700">Login untuk menyimpan nomor antrian</p>
            </div>
          </div>
          <button 
            class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
            @click="goToLogin"
          >
            Masuk atau Daftar
          </button>
        </div>
      </div>
    </template>

    <!-- User Profile Card -->
    <template v-else>
      <div class="px-4 pt-5">
        <div class="bg-white rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- Avatar with Google photo or initials - ClientOnly to avoid SSR hydration mismatch -->
              <ClientOnly>
                <div class="relative flex-shrink-0">
                  <img
                    :src="avatarUrl"
                    :alt="displayName"
                    class="w-14 h-14 rounded-full object-cover bg-surface-100"
                    referrerpolicy="no-referrer"
                    @error="($event.target as HTMLImageElement).src = `${defaultAvatar}${encodeURIComponent(displayName)}`"
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
                  <div class="w-14 h-14 rounded-full bg-surface-200 animate-pulse flex-shrink-0" />
                </template>
              </ClientOnly>
              
              <div class="flex-1 min-w-0">
                <h2 class="text-base font-semibold text-surface-900 mb-0.5 truncate">
                  {{ displayName }}
                </h2>
                <p class="text-sm text-surface-600 mb-1 truncate">
                  {{ displayEmail || displayPhone }}
                </p>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 text-success-700 text-xs font-normal">
                  <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 12C7.5913 12 9.11742 11.3679 10.2426 10.2426C11.3679 9.11742 12 7.5913 12 6C12 4.4087 11.3679 2.88258 10.2426 1.75736C9.11742 0.632141 7.5913 0 6 0C4.4087 0 2.88258 0.632141 1.75736 1.75736C0.632141 2.88258 0 4.4087 0 6C0 7.5913 0.632141 9.11742 1.75736 10.2426C2.88258 11.3679 4.4087 12 6 12ZM8.64844 4.89844L5.64844 7.89844C5.42812 8.11875 5.07188 8.11875 4.85391 7.89844L3.35391 6.39844C3.13359 6.17812 3.13359 5.82188 3.35391 5.60391C3.57422 5.38594 3.93047 5.38359 4.14844 5.60391L5.25 6.70547L7.85156 4.10156C8.07187 3.88125 8.42812 3.88125 8.64609 4.10156C8.86406 4.32188 8.86641 4.67812 8.64609 4.89609L8.64844 4.89844Z"/>
                  </svg>
                  Akun terverifikasi
                </span>
              </div>
            </div>
            <button
              class="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
              @click="handleEditData"
            >
              Edit data
            </button>
          </div>
        </div>
      </div>
    </template>

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
            <div class="w-11 h-6 bg-surface-200 peer-checked:bg-primary-600 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
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
            <div class="w-11 h-6 bg-surface-200 peer-checked:bg-primary-600 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>
      </div>
    </div>

    <!-- Additional Options -->
    <div class="px-4 pt-4">
      <div class="bg-white rounded-2xl overflow-hidden divide-y divide-surface-100">
        <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors">
          <span class="text-sm text-surface-700">Riwayat antrean saya</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>
        
        <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors">
          <span class="text-sm text-surface-700">Pusat bantuan / FAQ singkat</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>

        <button class="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors">
          <span class="text-sm text-surface-700">Kebijakan & privasi</span>
          <svg class="w-2 h-3 text-surface-400" viewBox="0 0 8 12" fill="currentColor">
            <path d="M7.27974 5.4703C7.57271 5.76327 7.57271 6.23905 7.27974 6.53202L2.77974 11.032C2.48677 11.325 2.01099 11.325 1.71802 11.032C1.42505 10.7391 1.42505 10.2633 1.71802 9.9703L5.68833 5.99999L1.72036 2.02968C1.42739 1.73671 1.42739 1.26093 1.72036 0.967957C2.01333 0.674988 2.48911 0.674988 2.78208 0.967957L7.28208 5.46796L7.27974 5.4703Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Logout Section -->
    <div class="px-4 pt-4">
      <div class="bg-white rounded-2xl p-4 space-y-3">
        <button
          class="w-full py-3 border-2 rounded-full text-sm font-medium transition-colors"
          :class="isAuthenticated 
            ? 'border-danger-300 text-danger-600 hover:bg-danger-50' 
            : 'border-primary-300 text-primary-600 hover:bg-primary-50'"
          @click="handleLogout"
        >
          {{ isAuthenticated ? 'Keluar / Logout' : 'Masuk ke Akun' }}
        </button>
        <div v-if="isAuthenticated" class="text-center space-y-1">
          <p class="text-xs text-surface-500 leading-4">
            Logout hanya menghapus sesi di perangkat ini.
          </p>
          <p class="text-xs text-surface-500 leading-4">
            Nomor antrean yang aktif tetap tersimpan.
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
