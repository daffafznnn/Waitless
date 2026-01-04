<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
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

    <!-- Stats Cards Grid -->
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

      <!-- Completion Rate -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Efisiensi</p>
            <p class="text-2xl font-bold text-purple-600 mt-1">{{ dashboardData?.totals?.completionRate ?? 0 }}%</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Service Time Avg -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Service Time</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatMinutes(dashboardData?.totals?.avgServiceSeconds) }}</p>
          </div>
          <div class="p-2 bg-indigo-50 rounded-lg">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Locations -->
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Cabang Aktif</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ dashboardData?.activeLocationsCount ?? 0 }}</p>
          </div>
          <div class="p-2 bg-red-50 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section with ChartJS -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Volume Tiket per Cabang (Bar Chart) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Volume Tiket per Cabang</h3>
            <p class="text-sm text-gray-500">Perbandingan total tiket hari ini</p>
          </div>
        </div>
        <div class="h-64">
          <Bar v-if="hasLocationData" :data="ticketVolumeChartData" :options="barChartOptions" />
          <div v-else class="h-full flex items-center justify-center">
            <div class="text-center">
              <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <p class="text-sm text-gray-500">Belum ada data cabang</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Distribution (Doughnut Chart) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Distribusi Status</h3>
            <p class="text-sm text-gray-500">Breakdown status tiket hari ini</p>
          </div>
        </div>
        <div class="h-64 flex items-center justify-center">
          <template v-if="hasTotalData">
            <div class="w-full max-w-[250px]">
              <Doughnut :data="statusDistributionChartData" :options="doughnutChartOptions" />
            </div>
          </template>
          <div v-else class="text-center">
            <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
            </svg>
            <p class="text-sm text-gray-500">Belum ada data</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Efficiency per Branch (Horizontal Bar) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Efisiensi per Cabang</h3>
          <p class="text-sm text-gray-500">Persentase penyelesaian layanan per lokasi</p>
        </div>
      </div>
      <div class="h-64">
        <Bar v-if="hasLocationData" :data="efficiencyChartData" :options="horizontalBarChartOptions" />
        <div v-else class="h-full flex items-center justify-center">
          <div class="text-center">
            <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-gray-500">Belum ada data performa</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Cabang Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Detail Cabang</h3>
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
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Batal</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Efisiensi</th>
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
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {{ (item.location?.name || 'U').charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.location?.name || 'Unknown' }}</p>
                    <p class="text-xs text-gray-500">{{ item.location?.city || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-gray-900">{{ item.summary?.total_issued ?? 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-emerald-600">{{ item.summary?.total_done ?? 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-amber-600">{{ item.summary?.total_hold ?? 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-red-600">{{ item.summary?.total_cancel ?? 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getEfficiencyBadgeClass(getLocationEfficiency(item))"
                >
                  {{ getLocationEfficiency(item) }}%
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <NuxtLink 
                  :to="`/owner/branches/${item.location?.id}`"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Detail →
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="!dashboardData?.locations?.length && !loading">
              <td colspan="7" class="px-6 py-12 text-center">
                <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <p class="text-sm text-gray-500">Belum ada cabang terdaftar</p>
                <NuxtLink 
                  to="/owner/branches/new" 
                  class="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tambah cabang pertama →
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import type { OwnerDashboard } from '~/stores/business'

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { getOwnerDashboard } = useOwnerApi()
const toast = useToast()

// Reactive data
const loading = ref(false)
const autoRefresh = ref(false)
const autoRefreshInterval = ref<ReturnType<typeof setInterval>>()
const lastUpdated = ref(new Date().toLocaleTimeString('id-ID'))
const dashboardData = ref<OwnerDashboard | null>(null)

// Computed
const calculateHoldRate = computed(() => {
  const total = dashboardData.value?.totals?.totalIssued ?? 0
  const hold = dashboardData.value?.totals?.totalHold ?? 0
  if (total === 0) return 0
  return Math.round((hold / total) * 100)
})

const hasLocationData = computed(() => {
  return dashboardData.value?.locations && dashboardData.value.locations.length > 0
})

const hasTotalData = computed(() => {
  return (dashboardData.value?.totals?.totalIssued ?? 0) > 0
})

// Chart Data
const ticketVolumeChartData = computed(() => ({
  labels: dashboardData.value?.locations?.map(l => l.location?.name || 'Unknown') || [],
  datasets: [{
    label: 'Total Tiket',
    data: dashboardData.value?.locations?.map(l => l.summary?.total_issued || 0) || [],
    backgroundColor: [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(239, 68, 68, 0.8)',
    ],
    borderColor: [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(139, 92, 246)',
      'rgb(239, 68, 68)',
    ],
    borderWidth: 1,
    borderRadius: 6,
  }]
}))

const statusDistributionChartData = computed(() => ({
  labels: ['Selesai', 'Menunggu', 'Ditahan', 'Dibatalkan'],
  datasets: [{
    data: [
      dashboardData.value?.totals?.totalDone || 0,
      (dashboardData.value?.totals?.totalIssued || 0) - 
        (dashboardData.value?.totals?.totalDone || 0) - 
        (dashboardData.value?.totals?.totalHold || 0) - 
        (dashboardData.value?.totals?.totalCancel || 0),
      dashboardData.value?.totals?.totalHold || 0,
      dashboardData.value?.totals?.totalCancel || 0,
    ],
    backgroundColor: [
      'rgba(16, 185, 129, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
    ],
    borderColor: [
      'rgb(16, 185, 129)',
      'rgb(59, 130, 246)',
      'rgb(245, 158, 11)',
      'rgb(239, 68, 68)',
    ],
    borderWidth: 2,
    hoverOffset: 4,
  }]
}))

const efficiencyChartData = computed(() => ({
  labels: dashboardData.value?.locations?.map(l => l.location?.name || 'Unknown') || [],
  datasets: [{
    label: 'Efisiensi (%)',
    data: dashboardData.value?.locations?.map(l => {
      const issued = l.summary?.total_issued || 0
      const done = l.summary?.total_done || 0
      return issued > 0 ? Math.round((done / issued) * 100) : 0
    }) || [],
    backgroundColor: dashboardData.value?.locations?.map(l => {
      const issued = l.summary?.total_issued || 0
      const done = l.summary?.total_done || 0
      const eff = issued > 0 ? Math.round((done / issued) * 100) : 0
      if (eff >= 80) return 'rgba(16, 185, 129, 0.8)'
      if (eff >= 50) return 'rgba(245, 158, 11, 0.8)'
      return 'rgba(239, 68, 68, 0.8)'
    }) || [],
    borderRadius: 6,
  }]
}))

// Chart Options
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}

const horizontalBarChartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => `Efisiensi: ${context.raw}%`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { 
        font: { size: 11 },
        callback: (value: any) => `${value}%`
      }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 16,
        usePointStyle: true,
        font: { size: 11 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: 12,
      cornerRadius: 8,
    }
  },
  cutout: '60%',
}

// Methods
const formatMinutes = (seconds: number | undefined | null) => {
  if (!seconds) return '0m'
  const minutes = Math.round(seconds / 60)
  return `${minutes}m`
}

const getLocationEfficiency = (item: any) => {
  const issued = item.summary?.total_issued || 0
  const done = item.summary?.total_done || 0
  if (issued === 0) return 0
  return Math.round((done / issued) * 100)
}

const getEfficiencyBadgeClass = (efficiency: number) => {
  if (efficiency >= 80) return 'bg-emerald-100 text-emerald-800'
  if (efficiency >= 50) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

const refreshDashboard = async (showToast: boolean = true) => {
  loading.value = true
  
  try {
    const response = await getOwnerDashboard()
    
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
      console.warn('Dashboard fetch failed:', response.error)
      if (showToast) {
        toast.add({
          title: 'Peringatan',
          description: response.error || 'Tidak dapat memuat data dashboard',
          color: 'orange'
        })
      }
    }
  } catch (error: any) {
    console.error('Dashboard error:', error)
    if (showToast) {
      toast.add({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat dashboard',
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
    autoRefreshInterval.value = setInterval(() => {
      refreshDashboard(false)
    }, 30000) // 30 seconds
    
    toast.add({
      title: 'Auto Refresh Aktif',
      description: 'Dashboard akan diperbarui setiap 30 detik',
      color: 'blue'
    })
  } else {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
    }
    toast.add({
      title: 'Auto Refresh Nonaktif',
      color: 'blue'
    })
  }
}

// Lifecycle
onMounted(() => {
  refreshDashboard(false)
})

onBeforeUnmount(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})

// SEO
useHead({
  title: 'Dashboard Pemilik - Waitless',
  meta: [{ name: 'description', content: 'Monitor performa bisnis dan metrik antrian Anda' }]
})
</script>