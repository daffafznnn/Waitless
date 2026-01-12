<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { StatusBadge, BottomNavigation, VisitorHeader } from '@/components/visitor'
import type { Counter } from '~/types'

definePageMeta({
  layout: false,
  middleware: 'auth'
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
const counters = ref<(Counter & { 
  waiting_count?: number
  current_serving?: string
  total_today?: number
  capacity_remaining?: number
  is_within_hours?: boolean
})[]>([])

// Helper: Check if current time is within operating hours
const isWithinOperatingHours = (openTime?: string, closeTime?: string): boolean => {
  if (!openTime || !closeTime) return true // No hours set = always open
  
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })
  
  // Handle cross-midnight scenarios
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime
  }
  return currentTime >= openTime && currentTime < closeTime
}

// Helper: Format time for display
const formatTime = (time?: string): string => {
  if (!time) return ''
  // Remove seconds if present (HH:MM:SS -> HH:MM)
  return time.substring(0, 5)
}

// Computed: Get counter status info
const getCounterStatus = (counter: Counter & { 
  waiting_count?: number
  capacity_remaining?: number 
}): { canTake: boolean; reason: string; statusClass: string } => {
  if (!counter.is_active) {
    return { canTake: false, reason: 'Loket tidak aktif', statusClass: 'inactive' }
  }
  
  const withinHours = isWithinOperatingHours(counter.open_time, counter.close_time)
  if (!withinHours) {
    return { canTake: false, reason: 'Loket sudah tutup', statusClass: 'closed' }
  }
  
  if (counter.capacity_remaining !== undefined && counter.capacity_remaining <= 0) {
    return { canTake: false, reason: 'Kapasitas antrian penuh', statusClass: 'full' }
  }
  
  return { canTake: true, reason: '', statusClass: 'available' }
}

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
    
    // Enhance counters with operating hours check
    counters.value = data.counters.map(counter => ({
      ...counter,
      is_within_hours: isWithinOperatingHours(counter.open_time, counter.close_time)
    }))
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

// Handle button click (even when disabled for feedback)
const handleButtonClick = async (counter: Counter & { 
  waiting_count?: number
  capacity_remaining?: number 
}) => {
  const status = getCounterStatus(counter)
  
  if (!status.canTake) {
    // Show feedback message for disabled state
    await $modal.alert({
      title: 'Tidak Dapat Mengambil Antrian',
      message: status.reason,
      type: 'warning'
    })
    return
  }
  
  // Proceed with taking the number
  await handleTakeNumber(counter.id)
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
    <VisitorHeader
      title="Ambil Antrian"
      :subtitle="location?.name || 'Memuat...'"
      show-back
      :user-name="authStore.user?.name"
      :is-authenticated="authStore.isAuthenticated"
      @back="goBack"
    />

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
        <div class="bg-white rounded-2xl shadow-sm p-4 transition-all duration-300">
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
        <div v-if="counters.length === 0" class="text-center py-8 bg-white rounded-2xl shadow-sm">
          <svg class="w-12 h-12 text-surface-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clip-rule="evenodd" />
          </svg>
          <p class="text-surface-600">Tidak ada loket tersedia</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="counter in counters"
            :key="counter.id"
            class="bg-white rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md"
            :class="{ 'opacity-60': !getCounterStatus(counter).canTake }"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-base font-medium text-surface-900">
                    {{ counter.name }}
                  </h3>
                  <!-- Status indicator -->
                  <span 
                    v-if="!getCounterStatus(counter).canTake"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-danger-100 text-danger-700': getCounterStatus(counter).statusClass === 'closed',
                      'bg-warning-100 text-warning-700': getCounterStatus(counter).statusClass === 'full',
                      'bg-surface-100 text-surface-600': getCounterStatus(counter).statusClass === 'inactive'
                    }"
                  >
                    {{ getCounterStatus(counter).reason }}
                  </span>
                </div>
                
                <p class="text-sm text-surface-500 mb-3">
                  {{ counter.description || 'Layanan umum' }}
                </p>
                
                <!-- Operating Hours -->
                <div v-if="counter.open_time && counter.close_time" class="flex items-center gap-1.5 text-sm text-surface-600 mb-3">
                  <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Buka {{ formatTime(counter.open_time) }} - {{ formatTime(counter.close_time) }}
                  </span>
                  <span 
                    v-if="counter.is_within_hours === false" 
                    class="text-xs text-danger-600 font-medium"
                  >
                    (Tutup)
                  </span>
                </div>
                
                <!-- Queue Stats -->
                <template v-if="counter.is_active">
                  <div class="flex flex-wrap gap-3 text-sm">
                    <!-- Waiting count -->
                    <div class="flex items-center gap-1.5">
                      <span class="flex items-center justify-center w-5 h-5 bg-warning-100 text-warning-600 rounded">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                        </svg>
                      </span>
                      <span class="font-medium text-surface-700">{{ counter.waiting_count || 0 }} menunggu</span>
                    </div>
                    
                    <!-- Currently serving -->
                    <div v-if="counter.current_serving" class="flex items-center gap-1.5">
                      <span class="flex items-center justify-center w-5 h-5 bg-success-100 text-success-600 rounded">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                      </span>
                      <span class="text-success-700">Dilayani: <strong>{{ counter.current_serving }}</strong></span>
                    </div>
                    
                    <!-- Capacity indicator -->
                    <div v-if="counter.capacity_per_day" class="flex items-center gap-1.5 text-surface-500">
                      <span class="text-xs">•</span>
                      <span v-if="counter.capacity_remaining !== undefined && counter.capacity_remaining > 0">
                        Sisa kuota: {{ counter.capacity_remaining }}/{{ counter.capacity_per_day }}
                      </span>
                      <span v-else-if="counter.capacity_remaining === 0" class="text-danger-600 font-medium">
                        Kuota habis
                      </span>
                      <span v-else>
                        Kuota: {{ counter.capacity_per_day }}/hari
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="text-sm text-danger-600 font-medium">Loket tidak aktif</span>
                </template>
              </div>
              
              <!-- Action Button -->
              <button
                :disabled="isTakingNumber"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap active:scale-95"
                :class="getCounterStatus(counter).canTake 
                  ? 'bg-success-600 text-white hover:bg-success-700 shadow-sm hover:shadow' 
                  : 'bg-surface-200 text-surface-400 cursor-pointer'"
                @click="handleButtonClick(counter)"
              >
                <template v-if="isTakingNumber">
                  <span class="flex items-center gap-1">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses
                  </span>
                </template>
                <template v-else>
                  {{ getCounterStatus(counter).canTake ? 'Ambil Nomor' : 'Tidak tersedia' }}
                </template>
              </button>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-6 px-2 space-y-1">
          <p class="text-xs text-surface-500 leading-4 flex items-start gap-1.5">
            <span class="text-surface-400">•</span>
            Nomor antrian hanya berlaku di cabang ini.
          </p>
          <p class="text-xs text-surface-500 leading-4 flex items-start gap-1.5">
            <span class="text-surface-400">•</span>
            Kalau kamu tidak hadir saat dipanggil, nomor bisa ditahan oleh admin.
          </p>
          <p class="text-xs text-surface-500 leading-4 flex items-start gap-1.5">
            <span class="text-surface-400">•</span>
            Perhatikan jam operasional dan kuota antrian setiap loket.
          </p>
        </div>
      </div>
    </template>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
