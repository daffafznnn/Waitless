<script setup lang="ts">
import { ref } from 'vue'
import { TicketCard, BottomNavigation } from '@/components/visitor'

definePageMeta({
  layout: false
})

const activeTab = ref<'active' | 'on-hold' | 'history'>('active')

// Mock data
const activeTickets = ref([
  {
    locationName: 'inParfume Bandung',
    counterName: 'Loket 1 – Layanan Umum',
    ticketNumber: 'A-012',
    status: 'waiting' as const,
    statusText: 'Waiting',
    queueInfo: '3 lagi giliran kamu',
    takenAt: '09:21 WIB',
    actionText: 'Lihat detail antrean',
    actionType: 'default' as const
  },
  {
    locationName: 'Klinik Sehat Buana',
    counterName: 'Loket 2 – Konsultasi',
    ticketNumber: 'B-008',
    status: 'serving' as const,
    statusText: 'Serving',
    queueInfo: 'Sedang dipanggil, segera ke loket',
    takenAt: '10:15 WIB',
    actionText: 'Saya sudah di loket',
    actionType: 'success' as const,
    highlight: true
  }
])

const onHoldTickets = ref([])
const historyTickets = ref([])

const setActiveTab = (tab: 'active' | 'on-hold' | 'history') => {
  activeTab.value = tab
}

const handleTicketAction = (index: number) => {
  console.log('Ticket action:', index)
}

const handleTicketDetail = (index: number) => {
  console.log('Ticket detail:', index)
}
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
        <button class="flex-shrink-0">
          <svg
            class="w-4 h-[18px] text-surface-400"
            viewBox="0 0 16 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0ZM7.87495 3.375H8.1562C10.1742 3.375 11.8124 5.01328 11.8124 7.03125V8.20547C11.8124 9.88945 12.3011 11.5312 13.2081 12.9375H2.54174C3.44877 11.5312 3.93745 9.88945 3.93745 8.20547V7.03125C3.93745 5.01328 5.57573 3.375 7.5937 3.375H7.87495ZM10.1249 15.75H7.87495H5.62495C5.62495 16.3477 5.86049 16.9207 6.28237 17.3426C6.70424 17.7645 7.27729 18 7.87495 18C8.4726 18 9.04565 17.7645 9.46752 17.3426C9.8894 16.9207 10.1249 16.3477 10.1249 15.75Z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Tab Selector -->
    <section class="bg-white px-4 pb-4">
      <div class="bg-surface-100 rounded-xl p-1 flex items-center gap-1">
        <button
          class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
          :class="
            activeTab === 'active'
              ? 'bg-white text-primary-600 shadow-xs'
              : 'text-surface-500'
          "
          @click="setActiveTab('active')"
        >
          Aktif
        </button>
        <button
          class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
          :class="
            activeTab === 'on-hold'
              ? 'bg-white text-primary-600 shadow-xs'
              : 'text-surface-500'
          "
          @click="setActiveTab('on-hold')"
        >
          Ditahan
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

    <!-- Content -->
    <main class="px-4 py-0">
      <!-- Active Tickets -->
      <div v-if="activeTab === 'active'" class="space-y-4">
        <TicketCard
          v-for="(ticket, index) in activeTickets"
          :key="index"
          v-bind="ticket"
          @action="handleTicketAction(index)"
          @detail="handleTicketDetail(index)"
        />
        
        <p class="text-xs text-center text-surface-400 pt-2">
          Antrean akan hilang otomatis setelah loket tutup.
        </p>
      </div>

      <!-- On Hold Tickets -->
      <div v-else-if="activeTab === 'on-hold'">
        <div v-if="onHoldTickets.length === 0" class="text-center py-12">
          <p class="text-sm text-surface-500">
            Tidak ada antrian yang ditahan
          </p>
        </div>
      </div>

      <!-- History -->
      <div v-else>
        <div v-if="historyTickets.length === 0" class="text-center py-12">
          <p class="text-sm text-surface-500">
            Belum ada riwayat antrian
          </p>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
