<template>
  <div class="space-y-6">
    <!-- Dashboard Header with Figma Style -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-[22px] font-bold text-gray-900">Dashboard Pemilik</h1>
        <p class="text-sm text-gray-500 mt-1">Monitor performa bisnis dan metrik antrian Anda</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="toggleAutoRefresh"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            autoRefresh 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full', autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400']"></span>
            {{ autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF' }}
          </span>
        </button>
        <button
          @click="refreshDashboard"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <span class="flex items-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Memperbarui...' : 'Refresh' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Stats Cards Grid - Following Figma 6 Cards Layout -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <!-- Total Tiket -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Tiket</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ dashboardData?.totals?.totalIssued ?? 0 }}</p>
          </div>
          <div class="p-2 bg-blue-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Selesai -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Selesai</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ dashboardData?.totals?.totalDone ?? 0 }}</p>
          </div>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Hold Rate -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Hold Rate</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ calculateHoldRate }}%</p>
          </div>
          <div class="p-2 bg-amber-50 rounded-lg">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Wait Time Avg -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Wait Time Avg</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatMinutes(dashboardData?.totals?.avgWaitSeconds) }}</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Service Time Avg -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Service Time Avg</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatMinutes(dashboardData?.totals?.avgServiceSeconds) }}</p>
          </div>
          <div class="p-2 bg-indigo-50 rounded-lg">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Peak Hour -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Peak Hour</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ dashboardData?.peakHour ?? '-' }}</p>
          </div>
          <div class="p-2 bg-red-50 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Volume Tiket per Hari (Line Chart Placeholder) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Volume Tiket per Hari</h3>
            <p class="text-sm text-gray-500">{{ chartPeriod }} hari terakhir</p>
          </div>
          <select 
            v-model="chartPeriod"
            class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">7 Hari</option>
            <option value="30">30 Hari</option>
            <option value="90">90 Hari</option>
          </select>
        </div>
        <div class="h-64 bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center border border-dashed border-gray-200">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
            <p class="text-sm text-gray-500">Chart akan ditampilkan di sini</p>
            <p class="text-xs text-gray-400 mt-1">Integrasi ChartJS/ApexCharts</p>
          </div>
        </div>
      </div>

      <!-- Wait Time per Cabang (Bar Chart Placeholder) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Wait Time rata-rata per Cabang</h3>
            <p class="text-sm text-gray-500">Perbandingan antar lokasi</p>
          </div>
        </div>
        <div class="h-64 bg-gradient-to-b from-emerald-50 to-white rounded-lg flex items-center justify-center border border-dashed border-gray-200">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p class="text-sm text-gray-500">Bar Chart akan ditampilkan</p>
            <p class="text-xs text-gray-400 mt-1">Data dari semua cabang</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Cabang Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Top Cabang</h3>
            <p class="text-sm text-gray-500">Rangkuman performa per lokasi hari ini</p>
          </div>
          <span class="text-xs text-gray-400">Last update: {{ lastUpdated }}</span>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cabang</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Selesai</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hold</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Wait Avg</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Service Avg</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr 
              v-for="(item, index) in dashboardData?.locations ?? []" 
              :key="item.location?.id ?? index"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.location?.name ?? 'Unknown' }}</p>
                    <p class="text-xs text-gray-500">{{ item.location?.city ?? 'No city' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-gray-900">{{ item.summary?.total_issued ?? 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {{ item.summary?.total_done ?? 0 }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {{ item.summary?.total_hold ?? 0 }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm text-gray-600">{{ formatMinutes(item.summary?.avg_wait_seconds) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm text-gray-600">{{ formatMinutes(item.summary?.avg_service_seconds) }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <NuxtLink
                  :to="`/owner/branches/${item.location?.id}`"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Kelola
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="!dashboardData?.locations?.length && !loading">
              <td colspan="7" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                  <p class="text-sm text-gray-500">Belum ada data cabang</p>
                  <NuxtLink 
                    to="/owner/branches"
                    class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Tambah Cabang Baru
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-base font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink
          to="/owner/branches"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Kelola Cabang</span>
        </NuxtLink>
        
        <NuxtLink
          to="/owner/staff"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manajemen Staf</span>
        </NuxtLink>
        
        <NuxtLink
          to="/owner/reports"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Laporan</span>
        </NuxtLink>
        
        <NuxtLink
          to="/owner/profile"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Profil</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OwnerDashboard } from '~/stores/business'

definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { getOwnerDashboard } = useOwnerApi()
const toast = useToast()

// Reactive data
const loading = ref(false)
const autoRefresh = ref(false) // Default OFF to prevent spamming on error
const autoRefreshInterval = ref<ReturnType<typeof setInterval>>()
const lastUpdated = ref(new Date().toLocaleTimeString('id-ID'))
const dashboardData = ref<OwnerDashboard | null>(null)
const chartPeriod = ref('30')

// Computed
const calculateHoldRate = computed(() => {
  const total = dashboardData.value?.totals?.totalIssued ?? 0
  const hold = dashboardData.value?.totals?.totalHold ?? 0
  if (total === 0) return 0
  return Math.round((hold / total) * 100)
})

// Methods
const formatMinutes = (seconds: number | undefined | null) => {
  if (!seconds) return '0m'
  const minutes = Math.round(seconds / 60)
  return `${minutes}m`
}

const refreshDashboard = async (showToast: boolean = true) => {
  loading.value = true
  
  try {
    const response = await getOwnerDashboard()
    
    // FIX: Use response.ok instead of response.success
    if (response.ok && response.data) {
      dashboardData.value = response.data
      lastUpdated.value = new Date().toLocaleTimeString('id-ID')
      
      if (showToast) {
        toast.add({
          title: 'Dashboard Diperbarui',
          description: 'Data dashboard berhasil diperbarui',
          color: 'green'
        })
      }
    } else {
      // Handle case when ok is false
      console.warn('Dashboard fetch returned ok=false:', response.error)
      if (showToast) {
        toast.add({
          title: 'Peringatan',
          description: response.error || 'Tidak dapat memuat data dashboard',
          color: 'amber'
        })
      }
    }
  } catch (error: any) {
    console.error('Failed to refresh dashboard:', error)
    if (showToast) {
      toast.add({
        title: 'Error',
        description: 'Gagal memperbarui data dashboard',
        color: 'red'
      })
    }
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    toast.add({
      title: 'Auto Refresh Aktif',
      description: 'Dashboard akan diperbarui setiap 30 detik',
      color: 'green'
    })
  } else {
    stopAutoRefresh()
    toast.add({
      title: 'Auto Refresh Nonaktif',
      description: 'Auto refresh telah dinonaktifkan',
      color: 'gray'
    })
  }
}

const startAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    if (!loading.value) {
      refreshDashboard(false)
    }
  }, 30000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

// Initialize dashboard
onMounted(async () => {
  await refreshDashboard(false)
  // Auto refresh is OFF by default
})

onUnmounted(() => {
  stopAutoRefresh()
})

// SEO
useHead({
  title: 'Dashboard Pemilik - Waitless',
  meta: [
    { name: 'description', content: 'Monitor performa bisnis dan metrik antrian Anda di semua lokasi.' }
  ]
})
</script>