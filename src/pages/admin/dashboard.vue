<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p class="mt-2 text-gray-600">Kelola sistem antrian dan pantau statistik real-time</p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="toggleAutoRefresh"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF' }}
            </button>
            <button
              @click="refreshDashboard"
              :disabled="refreshing"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ refreshing ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatsCard
          title="Total Antrian Hari Ini"
          :value="stats?.totalQueues || 0"
          :trend="stats?.queuesTrend"
          :show-trend="true"
          icon="queue"
          color="blue"
        />
        
        <AdminStatsCard
          title="Pengguna Aktif"
          :value="stats?.activeUsers || 0"
          :trend="stats?.usersTrend"
          :show-trend="true"
          icon="users"
          color="green"
        />
        
        <AdminStatsCard
          title="Rata-rata Waktu Tunggu"
          :value="`${stats?.avgWaitTime || 0} min`"
          :trend="stats?.waitTimeTrend"
          :show-trend="true"
          icon="clock"
          color="yellow"
        />
        
        <AdminStatsCard
          title="Total Lokasi"
          :value="stats?.totalLocations || 0"
          :trend="stats?.locationsTrend"
          :show-trend="true"
          icon="chart"
          color="purple"
        />
      </div>

      <!-- Quick Actions -->
      <AdminQuickActions title="Aksi Cepat">
        <AdminQuickActionCard
          label="Kelola Antrian"
          color="blue"
          to="/admin/queue"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </template>
        </AdminQuickActionCard>
        
        <AdminQuickActionCard
          label="Panggil Berikutnya"
          color="green"
          @click="openCallNext"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </template>
        </AdminQuickActionCard>
        
        <AdminQuickActionCard
          label="Pengaturan Loket"
          color="yellow"
          @click="openCounterSettings"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </template>
        </AdminQuickActionCard>
        
        <AdminQuickActionCard
          label="Lihat Laporan"
          color="purple"
          to="/admin/reports"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </template>
        </AdminQuickActionCard>
      </AdminQuickActions>

      <!-- Active Queues Table -->
      <UiDataTable
        title="Antrian Aktif"
        subtitle="Daftar semua antrian yang sedang berjalan"
        :columns="queueColumns"
        :data="activeQueues || []"
        :loading="queuesLoading"
        :total="activeQueues?.length || 0"
        item-label="antrian"
        :show-pagination="false"
        empty-text="Tidak ada antrian aktif"
      >
        <template #header-actions>
          <div class="text-sm text-gray-500">
            Last updated: {{ lastUpdated }}
          </div>
        </template>
        
        <template #column-counter="{ item }">
          <div>
            <div class="text-sm font-medium text-gray-900">{{ item.counter_name }}</div>
            <div class="text-sm text-gray-500">{{ item.counter_prefix }}</div>
          </div>
        </template>
        
        <template #column-location_name="{ item }">
          <div class="text-sm font-medium text-gray-900">
            {{ getLocationName(item.location_id || item.location_name) }}
          </div>
        </template>
        
        <template #column-current_number="{ item }">
          <div class="text-lg font-bold text-blue-600">
            {{ item.current_number ? `#${item.current_number}` : 'Belum ada' }}
          </div>
        </template>
        
        <template #column-waiting_count="{ item }">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {{ item.waiting_count || 0 }} menunggu
          </span>
        </template>
        
        <template #column-status="{ item }">
          <span 
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              item.status === 'OPEN' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            ]"
          >
            {{ item.status === 'OPEN' ? 'Aktif' : 'Tutup' }}
          </span>
        </template>
        
        <template #column-actions="{ item }">
          <div class="flex items-center space-x-3">
            <UiActionButton
              @click="callNext(item.counter_id)"
              :disabled="!item.waiting_count || item.status !== 'OPEN'"
              variant="ghost"
              size="sm"
              class="text-blue-600 hover:text-blue-900"
            >
              Panggil
            </UiActionButton>
            <UiActionButton
              @click="manageQueue(item)"
              variant="ghost"
              size="sm"
              class="text-gray-600 hover:text-gray-900"
            >
              Kelola
            </UiActionButton>
          </div>
        </template>
      </UiDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminStatsCard from '~/components/admin/StatsCard.vue'

// API calls
const { get } = useApi()

// Types
interface QueueStats {
  totalQueues: number
  activeUsers: number
  avgWaitTime: number
  totalLocations: number
  queuesTrend?: number
  usersTrend?: number
  waitTimeTrend?: number
  locationsTrend?: number
}

interface ActiveQueue {
  counter_id: number
  counter_name: string
  counter_prefix: string
  location_id?: number
  location_name?: string
  current_number: string | null
  waiting_count: number
  status: 'OPEN' | 'CLOSED'
}

// Page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Store management
const adminStore = useAdminStore()
const locationStore = useLocationStore()
const { getGeneralDashboardStats, getActiveQueues, isLoading } = storeToRefs(adminStore)

// Reactive data
const refreshing = ref(false)
const autoRefresh = ref(true)
const autoRefreshInterval = ref<NodeJS.Timeout>()
const lastUpdated = ref(new Date().toLocaleTimeString())

// Computed data from store
const stats = computed(() => getGeneralDashboardStats.value)
const activeQueues = computed(() => getActiveQueues.value)
const statsLoading = computed(() => isLoading.value)
const queuesLoading = computed(() => isLoading.value)

// Initial data fetch
onMounted(async () => {
  await Promise.all([
    locationStore.fetchAllLocations(), // Load locations first
    refreshDashboard(false) // Silent initial load
  ])
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

const queueColumns = [
  {
    key: 'counter',
    title: 'Counter',
    width: 'min-w-[150px]'
  },
  {
    key: 'location_name',
    title: 'Lokasi',
    width: 'min-w-[120px]'
  },
  {
    key: 'current_number',
    title: 'Nomor Saat Ini',
    width: 'min-w-[130px]'
  },
  {
    key: 'waiting_count',
    title: 'Menunggu',
    width: 'min-w-[100px]'
  },
  {
    key: 'status',
    title: 'Status',
    width: 'min-w-[100px]'
  },
  {
    key: 'actions',
    title: 'Aksi',
    width: 'min-w-[150px]'
  }
]

// Methods
const refreshDashboard = async (showToast: boolean = true) => {
  const toast = useToast()
  refreshing.value = true
  
  try {
    await Promise.all([
      adminStore.fetchGeneralDashboardStats(),
      adminStore.fetchActiveQueues()
    ])
    lastUpdated.value = new Date().toLocaleTimeString()
    
    // Only show success toast if explicitly requested (manual refresh)
    if (showToast) {
      toast.add({
        title: 'Dashboard Diperbarui',
        description: 'Data dashboard berhasil diperbarui',
        icon: 'i-heroicons-arrow-path',
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
    // Always show error toast
    toast.add({
      title: 'Error',
      description: 'Gagal memperbarui dashboard',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  } finally {
    refreshing.value = false
  }
}

const callNext = async (counterId: number) => {
  const { $modal } = useNuxtApp()
  const toast = useToast()
  
  const confirmed = await $modal.confirm({
    title: 'Konfirmasi Panggil Antrian',
    message: 'Apakah Anda yakin ingin memanggil nomor antrian selanjutnya?',
    type: 'info',
    confirmText: 'Ya, Panggil',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  try {
    const response = await get(`/admin/counters/${counterId}/call-next`, { method: 'POST' })
    if (response.ok) {
      await adminStore.fetchActiveQueues()
      await $modal.alert({
        title: 'Berhasil',
        message: 'Nomor antrian selanjutnya berhasil dipanggil',
        type: 'success'
      })
    } else {
      console.error('Failed to call next:', response.error)
      await $modal.alert({
        title: 'Error',
        message: 'Gagal memanggil nomor antrian',
        type: 'error'
      })
    }
  } catch (error) {
    console.error('Failed to call next:', error)
    await $modal.alert({
      title: 'Error',
      message: 'Terjadi kesalahan saat memanggil antrian',
      type: 'error'
    })
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    if (!refreshing.value) {
      refreshDashboard(false) // Silent refresh for auto-refresh
    }
  }, 30000) // Every 30 seconds
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

const openCallNext = () => {
  // Navigate to call next page or open modal
  navigateTo('/admin/call-next')
}

const openCounterSettings = () => {
  // Navigate to counter settings
  navigateTo('/admin/settings')
}

const getLocationName = (locationIdOrName: number | string) => {
  if (typeof locationIdOrName === 'string') {
    return locationIdOrName
  }
  const location = locationStore.getLocationById(locationIdOrName)
  return location?.name || 'Unknown'
}

const manageQueue = (queue: ActiveQueue) => {
  navigateTo(`/admin/queue?counter=${queue.counter_id}`)
}

// Remove the duplicate onMounted - it's already defined above

onUnmounted(() => {
  stopAutoRefresh()
})

// SEO
useHead({
  title: 'Admin Dashboard - WaitLess',
  meta: [
    { name: 'description', content: 'Admin dashboard untuk mengelola sistem antrian dan memantau statistik real-time.' }
  ]
})
</script>