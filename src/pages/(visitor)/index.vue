<script setup lang="ts">
import { ref } from 'vue'
import {
  LocationSelector,
  SearchBar,
  CategoryTabs,
  LocationCard,
  BottomNavigation
} from '@/components/visitor'

definePageMeta({
  layout: false
})

const userLocation = ref('Bandung')
const searchQuery = ref('')
const selectedCategory = ref('all')

// Mock data
const nearbyLocations = ref([
  {
    id: '1',
    name: 'inParfume Bandung',
    address: 'Ruko Antapani',
    status: 'open' as const,
    statusText: 'Buka',
    queueInfo: 'Antrian sekarang: 5 orang',
    actionText: 'Ambil Nomor',
    actionType: 'primary' as const
  },
  {
    id: '2',
    name: 'Barbershop G1',
    address: 'Buah Batu',
    status: 'open' as const,
    statusText: 'Buka sampai 20.00',
    queueInfo: 'Menunggu: 2 orang',
    actionText: 'Lihat Antrian',
    actionType: 'secondary' as const
  },
  {
    id: '3',
    name: 'Klinik Sehat Buana',
    address: 'Jl. Cihampelas',
    status: 'closed' as const,
    statusText: 'Tutup',
    queueInfo: 'Buka lagi 08.00',
    actionText: 'Tidak bisa ambil',
    actionType: 'disabled' as const
  },
  {
    id: '4',
    name: 'Toko Parfum Wangi',
    address: 'Mall Bandung Indah',
    status: 'open' as const,
    statusText: 'Buka',
    queueInfo: 'Antrian sekarang: 3 orang',
    actionText: 'Ambil Nomor',
    actionType: 'primary' as const
  }
])

const recentVisits = ref([
  {
    id: '1',
    name: 'Loket 1 – Klinik Sehat',
    lastVisit: 'Kunjungan terakhir: 2 hari lalu',
    status: 'completed' as const
  },
  {
    id: '2',
    name: 'inParfume Bandung',
    lastVisit: 'Kunjungan terakhir: 1 minggu lalu',
    status: 'completed' as const
  }
])

const handleLocationChange = () => {
  console.log('Change location')
}

const handleSearch = (query: string) => {
  searchQuery.value = query
  console.log('Search:', query)
}

const handleFilter = () => {
  console.log('Open filter')
}

const handleCategoryChange = (categoryId: string) => {
  selectedCategory.value = categoryId
  console.log('Category changed:', categoryId)
}

const handleLocationAction = (id: string) => {
  console.log('Location action:', id)
  navigateTo(`/queue/${id}`)
}

const handleVisitAgain = (id: string) => {
  console.log('Visit again:', id)
  navigateTo(`/queue/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <header class="bg-white shadow-xs px-4 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-semibold text-surface-900 mb-0.5">
            Hai, Daffa 👋
          </h1>
          <p class="text-sm text-surface-600">
            Mau antre di mana hari ini?
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Notification Icon -->
          <button class="relative">
            <svg
              class="w-4 h-[18px] text-surface-600"
              viewBox="0 0 16 18"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0ZM7.87495 3.375H8.1562C10.1742 3.375 11.8124 5.01328 11.8124 7.03125V8.20547C11.8124 9.88945 12.3011 11.5312 13.2081 12.9375H2.54174C3.44877 11.5312 3.93745 9.88945 3.93745 8.20547V7.03125C3.93745 5.01328 5.57573 3.375 7.5937 3.375H7.87495ZM10.1249 15.75H7.87495H5.62495C5.62495 16.3477 5.86049 16.9207 6.28237 17.3426C6.70424 17.7645 7.27729 18 7.87495 18C8.4726 18 9.04565 17.7645 9.46752 17.3426C9.8894 16.9207 10.1249 16.3477 10.1249 15.75Z"/>
            </svg>
          </button>
          <!-- Avatar -->
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/0d9302e294aa556daebbf3f3e1e2a06207654692?width=64"
            alt="Profile"
            class="w-8 h-8 rounded-full"
          >
        </div>
      </div>
    </header>

    <!-- Location Selector -->
    <div class="px-4 pt-5">
      <LocationSelector
        :location="userLocation"
        subtitle="Tampilkan antrian terdekat"
        @change="handleLocationChange"
      />
    </div>

    <!-- Search Bar -->
    <div class="px-4 pt-4">
      <SearchBar
        placeholder="Cari tempat / layanan"
        subtitle="Kamu bisa cari UMKM, klinik, barbershop, toko parfum."
        @search="handleSearch"
        @filter="handleFilter"
      />
    </div>

    <!-- Category Tabs -->
    <div class="px-4 pt-6">
      <CategoryTabs @change="handleCategoryChange" />
    </div>

    <!-- Nearby Locations -->
    <div class="px-4 pt-8">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-surface-900 mb-1">
          Dekat kamu
        </h2>
        <p class="text-sm text-surface-600">
          Layanan yang pakai WaitLess di sekitar {{ userLocation }}
        </p>
      </div>

      <div class="space-y-4">
        <LocationCard
          v-for="location in nearbyLocations"
          :key="location.id"
          v-bind="location"
          @action="handleLocationAction"
        />
      </div>
    </div>

    <!-- Recent Visits -->
    <div class="px-4 pt-8">
      <h2 class="text-lg font-semibold text-surface-900 mb-4">
        Terakhir dikunjungi
      </h2>

      <div class="space-y-3">
        <div
          v-for="visit in recentVisits"
          :key="visit.id"
          class="bg-white rounded-2xl shadow-xs p-4 flex items-center justify-between gap-4"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-medium text-surface-900 mb-1">
              {{ visit.name }}
            </h3>
            <p class="text-sm text-surface-600 mb-2">
              {{ visit.lastVisit }}
            </p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-600">
              Selesai
            </span>
          </div>
          <button
            class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
            @click="handleVisitAgain(visit.id)"
          >
            Kunjungi Lagi
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>
