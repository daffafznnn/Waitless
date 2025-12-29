<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StatusBadge, CounterCard, BottomNavigation } from '@/components/visitor'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()

const locationId = route.params.locationId

// Mock data
const location = ref({
  name: 'inParfume Bandung',
  address: 'Ruko Antapani, Bandung',
  status: 'open' as const,
  statusText: 'Buka'
})

const counters = ref([
  {
    id: '1',
    name: 'Loket 1 – Layanan Umum',
    hours: '08:00 – 15:00',
    queueInfo: 'Antrian sekarang: 5 orang',
    status: 'active' as const,
    disabled: false
  },
  {
    id: '2',
    name: 'Loket 2 – Member / Fastline',
    hours: '09:00 – 14:00',
    queueInfo: 'Antrian sekarang: 2 orang',
    status: 'active' as const,
    disabled: false
  },
  {
    id: '3',
    name: 'Loket 3 – Pengambilan',
    hours: '08:00 – 16:00',
    queueInfo: 'Sedang dilayani: A-011',
    status: 'active' as const,
    disabled: false
  },
  {
    id: '4',
    name: 'Customer Service',
    hours: '08:00 – 16:00',
    queueInfo: 'Status: Tutup',
    status: 'closed' as const,
    disabled: true
  }
])

const goBack = () => {
  router.back()
}

const handleTakeNumber = (counterId: string) => {
  console.log('Take number for counter:', counterId)
  // TODO: Implement take number logic
}
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
            {{ location.name }}
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
              <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.8C4.18365 2.32031 2.25006 4.59141 2.25006 7.3125V7.97344C2.25006 9.62578 1.64186 11.2219 0.544981 12.4594L0.284825 12.7512C-0.0104874 13.0816 -0.0807999 13.5563 0.098497 13.9605C0.277794 14.3648 0.682091 14.625 1.12506 14.625H14.6251C15.068 14.625 15.4688 14.3648 15.6516 13.9605C15.8344 13.5563 15.7606 13.0816 15.4653 12.7512L15.2051 12.4594C14.1083 11.2219 13.5001 9.6293 13.5001 7.97344V7.3125C13.5001 4.59141 11.5665 2.32031 9.00006 1.8V1.125C9.00006 0.502734 8.49732 0 7.87506 0ZM9.46764 17.3426C9.88951 16.9207 10.1251 16.3477 10.1251 15.75H7.87506H5.62506C5.62506 16.3477 5.86061 16.9207 6.28248 17.3426C6.70436 17.7645 7.2774 18 7.87506 18C8.47272 18 9.04576 17.7645 9.46764 17.3426Z"/>
            </svg>
            <span class="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full" />
          </button>
          <!-- Avatar -->
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/89b88ecf4bdb8741c7b8e5d3c2b3e4f5276ab997?width=64"
            alt="Profile"
            class="w-8 h-8 rounded-full"
          >
        </div>
      </div>
    </header>

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
          Tempat ini punya beberapa loket / jenis layanan
        </p>
      </div>

      <div class="space-y-3">
        <CounterCard
          v-for="counter in counters"
          :key="counter.id"
          v-bind="counter"
          @take-number="handleTakeNumber(counter.id)"
        />
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

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
