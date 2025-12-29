<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { TicketCard, BottomNavigation } from '@/components/visitor'
import type { VisitorTicket } from '@/composables/useVisitorApi'

definePageMeta({
  layout: false
})

// APIs and stores
const { getMyTickets, cancelMyTicket } = useVisitorApi()
const authStore = useAuthStore()
const { initializeAuth } = useAuth()
const toast = useToast()
const { $modal } = useNuxtApp()

// State
const activeTab = ref<'active' | 'on-hold' | 'history'>('active')
const isLoading = ref(true)
const tickets = ref<VisitorTicket[]>([])

// Computed
const activeTickets = computed(() => 
  tickets.value.filter(t => ['waiting', 'called', 'serving'].includes(t.status))
)

const onHoldTickets = computed(() => 
  tickets.value.filter(t => t.status === 'on_hold')
)

const historyTickets = computed(() => 
  tickets.value.filter(t => ['completed', 'cancelled'].includes(t.status))
)

const currentTabTickets = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return activeTickets.value
    case 'on-hold':
      return onHoldTickets.value
    case 'history':
      return historyTickets.value
    default:
      return []
  }
})

// Load tickets
const loadTickets = async () => {
  if (!authStore.isAuthenticated) {
    isLoading.value = false
    return
  }
  
  try {
    tickets.value = await getMyTickets()
  } catch (error) {
    console.error('Failed to load tickets:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat daftar antrian',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle ticket action (for serving status)
const handleTicketAction = async (index: number) => {
  const ticket = currentTabTickets.value[index]
  if (!ticket) return
  
  if (ticket.status === 'serving') {
    await $modal.alert({
      title: 'Sedang Dipanggil',
      message: `Nomor antrian <strong>${ticket.queueNumber}</strong> sedang dipanggil. Silakan menuju loket <strong>${ticket.counterName}</strong>.`,
      type: 'info'
    })
  } else if (ticket.status === 'called') {
    await $modal.alert({
      title: 'Nomor Anda Dipanggil!',
      message: `Segera menuju loket <strong>${ticket.counterName}</strong> untuk dilayani.`,
      type: 'warning'
    })
  }
}

// Handle cancel ticket
const handleCancelTicket = async (index: number) => {
  const ticket = currentTabTickets.value[index]
  if (!ticket) return
  
  const confirmed = await $modal.confirm({
    title: 'Batalkan Antrian',
    message: `Apakah Anda yakin ingin membatalkan antrian <strong>${ticket.queueNumber}</strong>?`,
    type: 'danger',
    confirmText: 'Ya, Batalkan',
    cancelText: 'Tidak'
  })
  
  if (!confirmed) return
  
  try {
    const result = await cancelMyTicket(ticket.id)
    
    if (result.success) {
      toast.add({
        title: 'Berhasil',
        description: 'Antrian berhasil dibatalkan',
        color: 'green'
      })
      await loadTickets()
    } else {
      await $modal.alert({
        title: 'Gagal',
        message: result.error || 'Gagal membatalkan antrian',
        type: 'error'
      })
    }
  } catch (error: any) {
    await $modal.alert({
      title: 'Error',
      message: error.message || 'Terjadi kesalahan',
      type: 'error'
    })
  }
}

// Handle ticket detail
const handleTicketDetail = (index: number) => {
  const ticket = currentTabTickets.value[index]
  if (!ticket) return
  
  // Show ticket detail modal
  $modal.alert({
    title: `Tiket ${ticket.queueNumber}`,
    message: `
      <div class="space-y-2 text-left">
        <p><strong>Lokasi:</strong> ${ticket.locationName}</p>
        <p><strong>Loket:</strong> ${ticket.counterName}</p>
        <p><strong>Status:</strong> ${ticket.statusText}</p>
        <p><strong>Diambil:</strong> ${ticket.takenAt}</p>
        ${ticket.position ? `<p><strong>Posisi:</strong> ${ticket.position} dalam antrian</p>` : ''}
      </div>
    `,
    type: 'info'
  })
}

const setActiveTab = (tab: 'active' | 'on-hold' | 'history') => {
  activeTab.value = tab
}

const navigateToGetTicket = () => {
  navigateTo('/')
}

// Lifecycle
onMounted(async () => {
  await initializeAuth()
  await loadTickets()
})

// Auto-refresh every 10 seconds for active tickets
let refreshInterval: ReturnType<typeof setInterval> | null = null

watch([() => authStore.isAuthenticated, activeTickets], ([isAuth, active]) => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  
  if (isAuth && active.length > 0) {
    refreshInterval = setInterval(loadTickets, 10000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// SEO
useHead({
  title: 'Antrian Saya - Waitless'
})
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <header class="bg-white shadow-xs px-4 py-4 sticky top-0 z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-surface-900 mb-0.5">
            Antrian Saya
          </h1>
          <p class="text-xs text-surface-500 leading-4">
            Lihat antrean yang sedang berjalan dan riwayatnya.
          </p>
        </div>
        <button class="flex-shrink-0" @click="loadTickets">
          <svg
            class="w-4 h-[18px] text-surface-400 hover:text-primary-600 transition-colors"
            :class="{ 'animate-spin': isLoading }"
            viewBox="0 0 16 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0Z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Not Logged In State -->
    <div v-if="!authStore.isAuthenticated" class="px-4 pt-8">
      <div class="bg-white rounded-2xl p-8 text-center">
        <svg class="w-16 h-16 text-surface-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
        </svg>
        <h3 class="text-lg font-medium text-surface-900 mb-2">Masuk untuk Melihat Antrian</h3>
        <p class="text-sm text-surface-600 mb-6">Login untuk melihat dan mengelola nomor antrian Anda</p>
        <NuxtLink
          to="/login"
          class="inline-block px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
        >
          Masuk Sekarang
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Tab Selector -->
      <section class="bg-white px-4 pb-4">
        <div class="bg-surface-100 rounded-xl p-1 flex items-center gap-1">
          <button
            class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all relative"
            :class="
              activeTab === 'active'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-surface-500'
            "
            @click="setActiveTab('active')"
          >
            Aktif
            <span 
              v-if="activeTickets.length > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center"
            >
              {{ activeTickets.length }}
            </span>
          </button>
          <button
            class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all relative"
            :class="
              activeTab === 'on-hold'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-surface-500'
            "
            @click="setActiveTab('on-hold')"
          >
            Ditahan
            <span 
              v-if="onHoldTickets.length > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-warning-600 text-white text-xs rounded-full flex items-center justify-center"
            >
              {{ onHoldTickets.length }}
            </span>
          </button>
          <button
            class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
            :class="
              activeTab === 'history'
                ? 'bg-white text-primary-600 shadow-xs'
                : 'text-surface-500'
            "
            @click="setActiveTab('history')"
          >
            Riwayat
          </button>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="px-4 pt-4 text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-surface-600">Memuat antrian...</p>
      </div>

      <!-- Content -->
      <main v-else class="px-4 py-0">
        <!-- Empty State -->
        <div v-if="currentTabTickets.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-surface-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clip-rule="evenodd" />
          </svg>
          <p class="text-surface-600 mb-4">
            <template v-if="activeTab === 'active'">Tidak ada antrian aktif</template>
            <template v-else-if="activeTab === 'on-hold'">Tidak ada antrian ditahan</template>
            <template v-else>Belum ada riwayat antrian</template>
          </p>
          <button
            v-if="activeTab === 'active'"
            class="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
            @click="navigateToGetTicket"
          >
            Ambil Nomor Antrian
          </button>
        </div>

        <!-- Tickets List -->
        <div v-else class="space-y-4">
          <div
            v-for="(ticket, index) in currentTabTickets"
            :key="ticket.id"
            class="bg-white rounded-2xl shadow-xs p-4"
            :class="{ 'ring-2 ring-success-500': ticket.status === 'serving' }"
          >
            <!-- Ticket Header -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm text-surface-600 mb-1">{{ ticket.locationName }}</p>
                <p class="text-xs text-surface-500">{{ ticket.counterName }}</p>
              </div>
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-primary-100 text-primary-700': ticket.status === 'waiting',
                  'bg-warning-100 text-warning-700': ticket.status === 'called' || ticket.status === 'on_hold',
                  'bg-success-100 text-success-700': ticket.status === 'serving',
                  'bg-surface-100 text-surface-600': ticket.status === 'completed' || ticket.status === 'cancelled'
                }"
              >
                {{ ticket.statusText }}
              </span>
            </div>
            
            <!-- Queue Number -->
            <div class="text-center py-4">
              <p class="text-4xl font-bold text-primary-600">{{ ticket.queueNumber }}</p>
              <p class="text-sm text-surface-600 mt-2">{{ ticket.queueInfo }}</p>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-surface-100">
              <p class="text-xs text-surface-500">Diambil: {{ ticket.takenAt }}</p>
              <div class="flex gap-2">
                <button
                  v-if="activeTab === 'active'"
                  class="px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  @click="handleCancelTicket(index)"
                >
                  Batalkan
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  @click="handleTicketAction(index)"
                >
                  {{ ticket.status === 'serving' ? 'Saya di loket' : 'Lihat Detail' }}
                </button>
              </div>
            </div>
          </div>
          
          <p v-if="activeTab === 'active'" class="text-xs text-center text-surface-400 pt-2">
            Antrean akan hilang otomatis setelah loket tutup.
          </p>
        </div>
      </main>
    </template>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
