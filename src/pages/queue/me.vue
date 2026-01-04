<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { TicketCard, BottomNavigation, VisitorHeader } from '@/components/visitor'
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

// Handle ticket action (view detail)
const handleTicketAction = async (index: number) => {
  const ticket = currentTabTickets.value[index]
  if (!ticket) return
  
  // Show detailed modal for ALL statuses
  await showTicketDetailModal(ticket)
}

// Show ticket detail modal with ETA info
const showTicketDetailModal = async (ticket: VisitorTicket) => {
  // Fetch ETA info for waiting tickets
  let etaInfo = ''
  let positionInfo = ''
  let holdReasonInfo = ''
  
  if (ticket.status === 'waiting') {
    try {
      const { getTicketDetail } = useVisitorApi()
      const detail = await getTicketDetail(ticket.id)
      if (detail.queueInfo) {
        const { position, totalWaiting, estimatedMinutes } = detail.queueInfo
        positionInfo = `<p><strong>Posisi Antrian:</strong> #${position} dari ${totalWaiting + position} orang</p>`
        if (estimatedMinutes > 0) {
          etaInfo = `<p><strong>Estimasi Waktu:</strong> ~${estimatedMinutes} menit</p>`
        }
      }
    } catch {
      // Fallback if API fails
    }
  }
  
  // For on_hold tickets, try to get hold reason from raw ticket data
  if (ticket.status === 'on_hold' && (ticket as any).hold_reason) {
    holdReasonInfo = `<p class="mt-2 p-2 bg-orange-50 rounded text-orange-800"><strong>Alasan ditahan:</strong> ${(ticket as any).hold_reason}</p>`
  }
  
  // Build status-specific message
  let statusMessage = ''
  if (ticket.status === 'serving') {
    statusMessage = '<p class="text-success-600 font-medium">Nomor Anda sedang dipanggil! Segera ke loket.</p>'
  } else if (ticket.status === 'called') {
    statusMessage = '<p class="text-warning-600 font-medium">⚡ Bersiap! Nomor Anda akan segera dipanggil.</p>'
  } else if (ticket.status === 'on_hold') {
    statusMessage = `<p class="text-orange-600 font-medium">Antrian Anda ditahan. Hubungi petugas.</p>${holdReasonInfo}`
  } else if (ticket.status === 'completed') {
    statusMessage = '<p class="text-surface-500">✓ Layanan telah selesai.</p>'
  } else if (ticket.status === 'cancelled') {
    statusMessage = '<p class="text-danger-500">✗ Antrian dibatalkan.</p>'
  }
  
  await $modal.alert({
    title: `Tiket ${ticket.queueNumber}`,
    message: `
      <div class="space-y-3 text-left">
        <div class="text-center py-4 bg-primary-50 rounded-xl mb-4">
          <p class="text-5xl font-bold text-primary-600">${ticket.queueNumber}</p>
          <p class="text-sm text-primary-700 mt-2">${ticket.statusText}</p>
        </div>
        ${statusMessage}
        <div class="space-y-2 text-sm">
          <p><strong>Lokasi:</strong> ${ticket.locationName}</p>
          <p><strong>Loket:</strong> ${ticket.counterName}</p>
          ${positionInfo}
          ${etaInfo}
          <p><strong>Diambil:</strong> ${ticket.takenAt}</p>
        </div>
      </div>
    `,
    type: 'info'
  })
}

// Handle ticket detail (alias for backward compat)
const handleTicketDetail = (index: number) => {
  handleTicketAction(index)
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
    <VisitorHeader
      title="Antrian Saya"
      subtitle="Lihat antrean yang sedang berjalan dan riwayatnya."
      :show-notification="false"
      :show-profile="false"
    >
      <template #actions>
        <button class="flex-shrink-0" @click="loadTickets">
          <svg
            class="w-4 h-[18px] text-surface-400 hover:text-primary-600 transition-colors"
            :class="{ 'animate-spin': isLoading }"
            viewBox="0 0 16 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" stroke="currentColor"/>
          </svg>
        </button>
      </template>
    </VisitorHeader>

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
