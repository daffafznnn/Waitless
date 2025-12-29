<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { StatusBadge, CounterCard, BottomNavigation } from '@/components/visitor'
import type { Counter } from '~/types'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const { getLocationDetail, takeQueueNumber } = useVisitorApi()
const authStore = useAuthStore()
const toast = useToast()
const { $modal } = useNuxtApp()

const locationId = computed(() => Number(route.params.locationId))

// State
const isLoading = ref(true)
const isTakingNumber = ref(false)
const location = ref<{
  id: number
  name: string
  address: string
  status: 'open' | 'closed'
  statusText: string
} | null>(null)
const counters = ref<(Counter & { waiting_count?: number; current_serving?: string })[]>([])

// Load location data
const loadLocationData = async () => {
  if (!locationId.value) {
    toast.add({
      title: 'Error',
      description: 'ID lokasi tidak valid',
      color: 'red'
    })
    return
  }
  
  isLoading.value = true
  try {
    const data = await getLocationDetail(locationId.value)
    
    if (!data.location) {
      await $modal.alert({
        title: 'Lokasi Tidak Ditemukan',
        message: 'Lokasi yang Anda cari tidak ditemukan atau sudah dihapus.',
        type: 'error'
      })
      router.back()
      return
    }
    
    location.value = {
      id: data.location.id,
      name: data.location.name,
      address: data.location.address,
      status: data.location.status,
      statusText: data.location.statusText
    }
    counters.value = data.counters
  } catch (error) {
    console.error('Failed to load location:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data lokasi',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// Take queue number
const handleTakeNumber = async (counterId: number) => {
  const counter = counters.value.find(c => c.id === counterId)
  if (!counter || !counter.is_active) {
    toast.add({
      title: 'Tidak Tersedia',
      description: 'Loket ini sedang tidak aktif',
      color: 'orange'
    })
    return
  }
  
  // Confirm action
  const confirmed = await $modal.confirm({
    title: 'Ambil Nomor Antrian',
    message: `Anda akan mengambil nomor antrian untuk <strong>${counter.name}</strong>. Lanjutkan?`,
    type: 'info',
    confirmText: 'Ya, Ambil Nomor',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  isTakingNumber.value = true
  
  try {
    const result = await takeQueueNumber(
      locationId.value,
      counterId,
      authStore.user?.name,
      authStore.user?.phone
    )
    
    if (result.success && result.queueNumber) {
      await $modal.alert({
        title: 'Berhasil! 🎉',
        message: `
          <div class="text-center">
            <p class="text-sm mb-2">Nomor antrian Anda:</p>
            <p class="text-4xl font-bold text-primary-600 mb-2">${result.queueNumber}</p>
            <p class="text-sm text-gray-500">Pantau giliran Anda di halaman "Antrian Saya"</p>
          </div>
        `,
        type: 'success'
      })
      
      // Navigate to my queue
      navigateTo('/queue/me')
    } else {
      await $modal.alert({
        title: 'Gagal',
        message: result.error || 'Gagal mengambil nomor antrian',
        type: 'error'
      })
    }
  } catch (error: any) {
    await $modal.alert({
      title: 'Error',
      message: error.message || 'Terjadi kesalahan',
      type: 'error'
    })
  } finally {
    isTakingNumber.value = false
  }
}

const goBack = () => {
  router.back()
}

// Lifecycle
onMounted(() => {
  loadLocationData()
})

// Auto-refresh every 15 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshInterval = setInterval(loadLocationData, 15000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// SEO
useHead({
  title: computed(() => location.value ? `${location.value.name} - Ambil Antrian` : 'Ambil Antrian')
})
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <header class="bg-white shadow-xs px-4 py-4 sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <button
          class="w-8 h-11 flex items-center justify-center -ml-2"
          @click="goBack"
        >
          <svg
            class="w-4 h-[18px] text-surface-600"
            viewBox="0 0 16 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0.330444 8.20547C-0.109009 8.64492 -0.109009 9.35859 0.330444 9.79805L5.95544 15.423C6.3949 15.8625 7.10857 15.8625 7.54802 15.423C7.98748 14.9836 7.98748 14.2699 7.54802 13.8305L3.83904 10.125H14.625C15.2472 10.125 15.75 9.62227 15.75 9C15.75 8.37774 15.2472 7.875 14.625 7.875H3.84255L7.54451 4.16953C7.98396 3.73008 7.98396 3.01641 7.54451 2.57695C7.10505 2.1375 6.39138 2.1375 5.95193 2.57695L0.326929 8.20195L0.330444 8.20547Z"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-surface-900 truncate">
            Ambil Antrian
          </h1>
          <p class="text-sm text-surface-500 truncate">
            {{ location?.name || 'Memuat...' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Notification Icon with Badge -->
          <button class="relative">
            <svg
              class="w-4 h-[18px] text-surface-600"
              viewBox="0 0 16 18"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.8C4.18365 2.32031 2.25006 4.59141 2.25006 7.3125V7.97344C2.25006 9.62578 1.64186 11.2219 0.544981 12.4594L0.284825 12.7512C-0.0104874 13.0816 -0.0807999 13.5563 0.098497 13.9605C0.277794 14.3648 0.682091 14.625 1.12506 14.625H14.6251C15.068 14.625 15.4688 14.3648 15.6516 13.9605C15.8344 13.5563 15.7606 13.0816 15.4653 12.7512L15.2051 12.4594C14.1083 11.2219 13.5001 9.6293 13.5001 7.97344V7.3125C13.5001 4.59141 11.5665 2.32031 9.00006 1.8V1.125C9.00006 0.502734 8.49732 0 7.87506 0Z"/>
            </svg>
          </button>
          <!-- Avatar -->
          <NuxtLink 
            :to="authStore.isAuthenticated ? '/profile' : '/login'"
            class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"
          >
            <span class="text-primary-600 text-sm font-bold">
              {{ authStore.user?.name?.charAt(0).toUpperCase() || '?' }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-surface-600">Memuat data lokasi...</p>
      </div>
    </div>

    <template v-else-if="location">
      <!-- Location Info -->
      <div class="px-4 pt-4">
        <div class="bg-white rounded-2xl shadow-xs p-4">
          <h2 class="text-lg font-semibold text-surface-900 mb-1">
            {{ location.name }}
          </h2>
          <p class="text-sm text-surface-500 mb-4">
            {{ location.address }}
          </p>
          <StatusBadge :status="location.status" :text="location.statusText" />
          <p class="text-sm text-surface-600 mt-3">
            Pilih layanan yang mau kamu antre.
          </p>
        </div>
      </div>

      <!-- Counters List -->
      <div class="px-4 pt-6">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-surface-900 mb-1">
            Pilih Layanan
          </h2>
          <p class="text-sm text-surface-500">
            Tempat ini punya {{ counters.length }} loket / jenis layanan
          </p>
        </div>

        <!-- Empty State -->
        <div v-if="counters.length === 0" class="text-center py-8 bg-white rounded-2xl">
          <svg class="w-12 h-12 text-surface-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clip-rule="evenodd" />
          </svg>
          <p class="text-surface-600">Tidak ada loket tersedia</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="counter in counters"
            :key="counter.id"
            class="bg-white rounded-2xl shadow-xs p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-medium text-surface-900 mb-1">
                  {{ counter.name }}
                </h3>
                <p class="text-sm text-surface-500 mb-2">
                  {{ counter.description || 'Layanan umum' }}
                </p>
                <p class="text-sm text-surface-600">
                  <template v-if="counter.is_active">
                    Antrian sekarang: {{ counter.waiting_count || 0 }} orang
                  </template>
                  <template v-else>
                    <span class="text-danger-600">Tutup</span>
                  </template>
                </p>
              </div>
              <button
                :disabled="!counter.is_active || isTakingNumber"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                :class="counter.is_active 
                  ? 'bg-success-600 text-white hover:bg-success-700' 
                  : 'bg-surface-200 text-surface-500'"
                @click="handleTakeNumber(counter.id)"
              >
                <template v-if="isTakingNumber">
                  <span class="animate-pulse">Memproses...</span>
                </template>
                <template v-else>
                  {{ counter.is_active ? 'Ambil Nomor' : 'Tidak tersedia' }}
                </template>
              </button>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-6 px-2 space-y-0.5">
          <p class="text-xs text-surface-500 leading-4">
            • Nomor antrian hanya berlaku di cabang ini.
          </p>
          <p class="text-xs text-surface-500 leading-4">
            • Kalau kamu tidak hadir saat dipanggil, nomor bisa ditahan oleh admin.
          </p>
        </div>
      </div>
    </template>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
