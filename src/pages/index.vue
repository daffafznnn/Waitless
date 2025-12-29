<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  LocationSelector,
  SearchBar,
  CategoryTabs,
  LocationCard,
  BottomNavigation
} from '@/components/visitor'
import type { VisitorLocation } from '@/composables/useVisitorApi'

definePageMeta({
  layout: false
})

// APIs and stores
const { getPublicLocations } = useVisitorApi()
const authStore = useAuthStore()
const { initializeAuth } = useAuth()
const toast = useToast()
const { $modal } = useNuxtApp()

// State
const isLoading = ref(true)
const userLocation = ref('Bandung')
const searchQuery = ref('')
const selectedCategory = ref('all')
const locations = ref<VisitorLocation[]>([])
const recentVisits = ref<{ id: string; name: string; lastVisit: string; status: 'completed' }[]>([])

// Computed
const userName = computed(() => {
  if (authStore.isAuthenticated && authStore.user?.name) {
    return authStore.user.name.split(' ')[0]
  }
  return 'Tamu'
})

const filteredLocations = computed(() => {
  let filtered = locations.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(loc => 
      loc.name.toLowerCase().includes(query) ||
      loc.address.toLowerCase().includes(query) ||
      loc.city.toLowerCase().includes(query)
    )
  }
  
  // Filter by category (if implemented)
  if (selectedCategory.value !== 'all') {
    // Could filter by category if locations have category field
  }
  
  return filtered
})

// Load locations from API
const loadLocations = async () => {
  isLoading.value = true
  try {
    const data = await getPublicLocations()
    locations.value = data
    
    if (data.length === 0) {
      toast.add({
        title: 'Info',
        description: 'Belum ada lokasi yang tersedia',
        icon: 'i-heroicons-information-circle',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to load locations:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat daftar lokasi',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// Load recent visits from localStorage
const loadRecentVisits = () => {
  try {
    const stored = localStorage.getItem('waitless_recent_visits')
    if (stored) {
      recentVisits.value = JSON.parse(stored)
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Save recent visit
const saveRecentVisit = (location: VisitorLocation) => {
  const visit = {
    id: String(location.id),
    name: location.name,
    lastVisit: 'Baru saja',
    status: 'completed' as const
  }
  
  // Remove if already exists
  recentVisits.value = recentVisits.value.filter(v => v.id !== visit.id)
  // Add to beginning
  recentVisits.value.unshift(visit)
  // Keep only last 5
  recentVisits.value = recentVisits.value.slice(0, 5)
  
  try {
    localStorage.setItem('waitless_recent_visits', JSON.stringify(recentVisits.value))
  } catch {
    // Ignore localStorage errors
  }
}

// Handlers
const handleLocationChange = async () => {
  await $modal.alert({
    title: 'Pilih Lokasi',
    message: 'Fitur pilih kota akan segera tersedia',
    type: 'info'
  })
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const handleFilter = async () => {
  await $modal.alert({
    title: 'Filter',
    message: 'Fitur filter akan segera tersedia',
    type: 'info'
  })
}

const handleCategoryChange = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const handleLocationAction = (id: string) => {
  const location = locations.value.find(l => String(l.id) === id)
  if (location) {
    saveRecentVisit(location)
  }
  navigateTo(`/queue/${id}`)
}

const handleVisitAgain = (id: string) => {
  navigateTo(`/queue/${id}`)
}

// Lifecycle
onMounted(async () => {
  // Initialize auth
  await initializeAuth()
  
  // Load data
  await loadLocations()
  loadRecentVisits()
})

// Refresh locations every 30 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshInterval = setInterval(loadLocations, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// SEO
useHead({
  title: 'Waitless - Antrian Online Tanpa Ribet',
  meta: [
    { name: 'description', content: 'Ambil nomor antrian online dan pantau giliran kamu secara real-time.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-surface-100 pb-20">
    <!-- Header -->
    <header class="bg-white shadow-xs px-4 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-semibold text-surface-900 mb-0.5">
            Hai, {{ userName }} 👋
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
          <!-- Avatar / Login -->
          <NuxtLink 
            :to="authStore.isAuthenticated ? '/profile' : '/login'"
            class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden"
          >
            <span v-if="!authStore.isAuthenticated" class="text-primary-600 text-sm font-medium">?</span>
            <span v-else class="text-primary-600 text-sm font-bold">{{ userName.charAt(0).toUpperCase() }}</span>
          </NuxtLink>
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

    <!-- Loading State -->
    <div v-if="isLoading" class="px-4 pt-8">
      <div class="text-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-surface-600">Memuat lokasi...</p>
      </div>
    </div>

    <!-- Nearby Locations -->
    <div v-else class="px-4 pt-8">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-surface-900 mb-1">
          Dekat kamu
        </h2>
        <p class="text-sm text-surface-600">
          Layanan yang pakai WaitLess di sekitar {{ userLocation }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLocations.length === 0" class="text-center py-8">
        <svg class="w-16 h-16 text-surface-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <p class="text-surface-600 mb-2">Tidak ada lokasi ditemukan</p>
        <p v-if="searchQuery" class="text-sm text-surface-500">Coba ubah kata kunci pencarian</p>
      </div>

      <div v-else class="space-y-4">
        <LocationCard
          v-for="location in filteredLocations"
          :key="location.id"
          :id="String(location.id)"
          :name="location.name"
          :address="location.address"
          :status="location.status"
          :status-text="location.statusText"
          :queue-info="location.queueInfo"
          :action-text="location.actionText"
          :action-type="location.actionType"
          @action="handleLocationAction"
        />
      </div>
    </div>

    <!-- Recent Visits -->
    <div v-if="recentVisits.length > 0" class="px-4 pt-8">
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
              Kunjungan terakhir: {{ visit.lastVisit }}
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
