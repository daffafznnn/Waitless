<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-[22px] font-bold text-gray-900">Laporan & Ekspor</h1>
        <p class="text-sm text-gray-500 mt-1">Analisis performa bisnis dan ekspor data laporan</p>
      </div>
      <button
        @click="exportCSV"
        :disabled="exporting"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <svg v-if="exporting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        {{ exporting ? 'Mengekspor...' : 'Ekspor CSV' }}
      </button>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Periode</label>
          <div class="flex items-center gap-2">
            <input
              v-model="filters.startDate"
              type="date"
              class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-gray-400">-</span>
            <input
              v-model="filters.endDate"
              type="date"
              class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Branch Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Cabang</label>
          <select
            v-model="filters.locationId"
            class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Cabang</option>
            <option v-for="location in locations" :key="location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>
        </div>

        <!-- Quick Date Buttons -->
        <div class="md:col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-2">Cepat Pilih</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setQuickRange('today')"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                quickRange === 'today' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              ]"
            >
              Hari Ini
            </button>
            <button
              @click="setQuickRange('week')"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                quickRange === 'week' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              ]"
            >
              7 Hari
            </button>
            <button
              @click="setQuickRange('month')"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                quickRange === 'month' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              ]"
            >
              30 Hari
            </button>
            <button
              @click="setQuickRange('year')"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                quickRange === 'year' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              ]"
            >
              1 Tahun
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Pengunjung</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ reportData.totalVisitors || 0 }}</p>
          </div>
          <div class="p-2 bg-blue-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Rata-rata Waktu</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ reportData.avgTime || '0m' }}</p>
          </div>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Puncak Kunjungan</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ reportData.peakHour || '10:00' }}</p>
          </div>
          <div class="p-2 bg-amber-50 rounded-lg">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Efisiensi</p>
            <p class="text-2xl font-bold text-purple-600 mt-1">{{ reportData.efficiency || 0 }}%</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Activity Log Table (Left/Main) -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-900">Log Aktivitas</h3>
          <p class="text-sm text-gray-500">Riwayat antrian berdasarkan filter</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cabang</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staf/Loket</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Antrian</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Durasi</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr 
                v-for="log in activityLogs" 
                :key="log.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-gray-600">{{ formatDateTime(log.timestamp) }}</td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-900">{{ log.location }}</span>
                </td>
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm text-gray-900">{{ log.counter }}</p>
                    <p class="text-xs text-gray-500">{{ log.staff }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {{ log.queueNumber }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center text-sm text-gray-600">{{ log.duration }}</td>
                <td class="px-6 py-4 text-center">
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      getStatusClass(log.status)
                    ]"
                  >
                    {{ getStatusLabel(log.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="activityLogs.length === 0 && !loading">
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p class="text-sm text-gray-500">Belum ada data aktivitas</p>
                    <p class="text-xs text-gray-400 mt-1">Ubah filter untuk melihat data</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="activityLogs.length > 0" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-500">Menampilkan {{ activityLogs.length }} dari {{ totalLogs }} data</p>
          <div class="flex gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage * pageSize >= totalLogs"
              class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-900">Ringkasan per Cabang</h3>
          <p class="text-sm text-gray-500">Perbandingan performa</p>
        </div>

        <div class="p-6 space-y-4">
          <div 
            v-for="branch in branchSummaries" 
            :key="branch.id"
            class="space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">{{ branch.name }}</span>
              <span class="text-sm text-gray-600">{{ branch.total }} tiket</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(branch.total / maxBranchTotal) * 100}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ branch.completed }} selesai</span>
              <span class="text-emerald-600">{{ Math.round(branch.completed / branch.total * 100) || 0 }}%</span>
            </div>
          </div>

          <div v-if="branchSummaries.length === 0" class="py-8 text-center">
            <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p class="text-sm text-gray-500">Belum ada data</p>
          </div>
        </div>

        <!-- Detailed Report Button -->
        <div class="px-6 py-4 border-t border-gray-100">
          <button
            @click="viewDetailedReport"
            class="w-full px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
          >
            Lihat Laporan Detail
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServiceLocation } from '~/types'

definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { getMyLocations } = useOwnerApi()
const toast = useToast()

// Reactive data
const loading = ref(false)
const exporting = ref(false)
const currentPage = ref(1)
const pageSize = 10
const totalLogs = ref(25)
const quickRange = ref('week')
const locations = ref<ServiceLocation[]>([])

// Filters
const filters = ref({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  locationId: ''
})

// Report data
const reportData = ref({
  totalVisitors: 1247,
  avgTime: '12m',
  peakHour: '10:00',
  efficiency: 87
})

// Mock activity logs
const activityLogs = ref([
  { id: 1, timestamp: new Date().toISOString(), location: 'Cabang Utama', counter: 'Loket A', staff: 'Ahmad R.', queueNumber: 'A-023', duration: '8m 32s', status: 'completed' },
  { id: 2, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), location: 'Cabang Utama', counter: 'Loket B', staff: 'Siti A.', queueNumber: 'B-015', duration: '5m 12s', status: 'completed' },
  { id: 3, timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), location: 'Cabang Bandung', counter: 'Loket A', staff: 'Budi S.', queueNumber: 'A-018', duration: '-', status: 'skipped' },
  { id: 4, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), location: 'Cabang Utama', counter: 'Loket C', staff: 'Nina K.', queueNumber: 'C-009', duration: '15m 45s', status: 'completed' },
  { id: 5, timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), location: 'Cabang Surabaya', counter: 'Loket A', staff: 'Rina T.', queueNumber: 'A-011', duration: '-', status: 'cancelled' },
])

// Mock branch summaries
const branchSummaries = ref([
  { id: 1, name: 'Cabang Utama', total: 523, completed: 489 },
  { id: 2, name: 'Cabang Bandung', total: 387, completed: 356 },
  { id: 3, name: 'Cabang Surabaya', total: 337, completed: 298 },
])

const maxBranchTotal = computed(() => {
  return Math.max(...branchSummaries.value.map(b => b.total), 1)
})

// Methods
const setQuickRange = (range: string) => {
  quickRange.value = range
  const today = new Date()
  let startDate = new Date()

  switch (range) {
    case 'today':
      startDate = today
      break
    case 'week':
      startDate.setDate(today.getDate() - 7)
      break
    case 'month':
      startDate.setDate(today.getDate() - 30)
      break
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1)
      break
  }

  filters.value.startDate = startDate.toISOString().split('T')[0]
  filters.value.endDate = today.toISOString().split('T')[0]
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-800',
    skipped: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-red-100 text-red-800',
    waiting: 'bg-blue-100 text-blue-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    completed: 'Selesai',
    skipped: 'Dilewati',
    cancelled: 'Batal',
    waiting: 'Menunggu'
  }
  return labels[status] || status
}

const exportCSV = async () => {
  exporting.value = true
  
  try {
    // Build CSV content
    const headers = ['Waktu', 'Cabang', 'Loket', 'Staf', 'No. Antrian', 'Durasi', 'Status']
    const csvData = activityLogs.value.map(log => [
      formatDateTime(log.timestamp),
      log.location,
      log.counter,
      log.staff,
      log.queueNumber,
      log.duration,
      getStatusLabel(log.status)
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan_${filters.value.startDate}_${filters.value.endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.add({
      title: 'Export Berhasil',
      description: 'Laporan berhasil diekspor ke CSV',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to export:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengekspor laporan',
      color: 'red'
    })
  } finally {
    exporting.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value * pageSize < totalLogs.value) {
    currentPage.value++
  }
}

const viewDetailedReport = () => {
  toast.add({
    title: 'Info',
    description: 'Fitur laporan detail akan segera hadir',
    color: 'blue'
  })
}

// Load locations
const loadLocations = async () => {
  try {
    const response = await getMyLocations()
    if (response.data) {
      locations.value = response.data.locations
    }
  } catch (error) {
    console.error('Failed to load locations:', error)
  }
}

// Initialize
onMounted(() => {
  loadLocations()
})

// Watch filters
watch(filters, () => {
  // Refresh data when filters change
  currentPage.value = 1
}, { deep: true })

// SEO
useHead({
  title: 'Laporan & Ekspor - Waitless',
  meta: [
    { name: 'description', content: 'Analisis performa bisnis dan ekspor data laporan.' }
  ]
})
</script>