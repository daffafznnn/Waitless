<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { StatusBadge, CounterCard, BottomNavigation, VisitorHeader } from '@/components/visitor'
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
const counters = ref<(Counter & { waiting_count?: number; current_serving?: string; total_today?: number })[]>([])

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
                <p class="text-sm text-surface-500 mb-3">
                  {{ counter.description || 'Layanan umum' }}
                </p>
                
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
                    
                    <!-- Total today -->
                    <div v-if="counter.total_today" class="flex items-center gap-1.5 text-surface-500">
                      <span class="text-xs">•</span>
                      <span>{{ counter.total_today }} hari ini</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="text-sm text-danger-600 font-medium">Tutup</span>
                </template>
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
