<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-[22px] font-bold text-gray-900">Laporan & Ekspor</h1>
        <p class="text-sm text-gray-500 mt-1">Analisis performa bisnis dan ekspor data laporan</p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ loading ? 'Memperbarui...' : 'Refresh Data' }}
      </button>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900">Filter Laporan</h3>
        <button @click="resetFilters" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Reset Filter
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date Range Start -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
          <input
            type="date"
            v-model="filters.startDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        
        <!-- Date Range End -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Akhir</label>
          <input
            type="date"
            v-model="filters.endDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <!-- Location Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Cabang</label>
          <select
            v-model="filters.locationId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Semua Cabang</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="DONE">Selesai</option>
            <option value="WAITING">Menunggu</option>
            <option value="CALLING">Dipanggil</option>
            <option value="HOLD">Ditahan</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Antrian</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
          </div>
          <div class="p-2 bg-blue-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Selesai</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.completed }}</p>
          </div>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Menunggu</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ stats.waiting }}</p>
          </div>
          <div class="p-2 bg-amber-50 rounded-lg">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Ditahan</p>
            <p class="text-2xl font-bold text-orange-600 mt-1">{{ stats.hold }}</p>
          </div>
          <div class="p-2 bg-orange-50 rounded-lg">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Dibatalkan</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.cancelled }}</p>
          </div>
          <div class="p-2 bg-red-50 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Penyelesaian</p>
            <p class="text-2xl font-bold text-purple-600 mt-1">{{ stats.completionRate }}%</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Actions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900">Export Laporan</h3>
        <span class="text-sm text-gray-500">{{ formatDateRange(filters.startDate, filters.endDate) }}</span>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          @click="exportToCSV"
          :disabled="exporting || tickets.length === 0"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Export CSV</span>
        </button>
        
        <button
          @click="exportToJSON"
          :disabled="exporting || tickets.length === 0"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Export JSON</span>
        </button>
        
        <button
          @click="printReport"
          :disabled="tickets.length === 0"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-purple-700">Print Laporan</span>
        </button>
        
        <button
          @click="copyToClipboard"
          :disabled="tickets.length === 0"
          class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900">Copy Data</span>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Detail Antrian</h3>
            <p class="text-sm text-gray-500">{{ filteredTickets.length }} record ditemukan</p>
          </div>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Antrian</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cabang</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loket</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Dibuat</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Selesai</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr 
              v-for="ticket in paginatedTickets" 
              :key="ticket.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="text-sm font-bold text-gray-900">{{ ticket.queue_number }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ getLocationName(ticket) }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ ticket.counter?.name || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-500">{{ formatDateTime(ticket.created_at) }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-500">{{ ticket.finished_at ? formatDateTime(ticket.finished_at) : '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusClasses(ticket.status)]">
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="tickets.length === 0 && !loading">
              <td colspan="6" class="px-6 py-12 text-center">
                <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm text-gray-500">Tidak ada data antrian untuk periode ini</p>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
                <p class="text-sm text-gray-500">Memuat data...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Menampilkan {{ paginationStart }} - {{ paginationEnd }} dari {{ filteredTickets.length }} record
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="pagination.page--"
            :disabled="pagination.page === 1"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sebelumnya
          </button>
          <span class="px-3 py-1.5 text-sm font-medium">{{ pagination.page }} / {{ totalPages }}</span>
          <button
            @click="pagination.page++"
            :disabled="pagination.page >= totalPages"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { getOwnerTickets } = useOwnerApi()
const toast = useToast()

// State
const loading = ref(false)
const exporting = ref(false)
const tickets = ref<any[]>([])
const counters = ref<any[]>([])
const locations = ref<any[]>([])

// Filters
const filters = reactive({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  locationId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20
})

// Computed
const filteredTickets = computed(() => {
  let result = tickets.value
  
  if (filters.locationId) {
    result = result.filter(t => t.counter?.location_id === Number(filters.locationId) || t.location_id === Number(filters.locationId))
  }
  
  if (filters.status) {
    result = result.filter(t => t.status === filters.status)
  }
  
  return result
})

const paginatedTickets = computed(() => {
  const start = (pagination.page - 1) * pagination.limit
  return filteredTickets.value.slice(start, start + pagination.limit)
})

const totalPages = computed(() => Math.ceil(filteredTickets.value.length / pagination.limit))

const paginationStart = computed(() => {
  if (filteredTickets.value.length === 0) return 0
  return (pagination.page - 1) * pagination.limit + 1
})

const paginationEnd = computed(() => {
  return Math.min(pagination.page * pagination.limit, filteredTickets.value.length)
})

const stats = computed(() => {
  const total = filteredTickets.value.length
  const completed = filteredTickets.value.filter(t => t.status === 'DONE').length
  const waiting = filteredTickets.value.filter(t => t.status === 'WAITING').length
  const hold = filteredTickets.value.filter(t => t.status === 'HOLD').length
  const cancelled = filteredTickets.value.filter(t => t.status === 'CANCELLED').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, waiting, hold, cancelled, completionRate }
})

// Methods
const getLocationName = (ticket: any) => {
  const loc = locations.value.find(l => l.id === ticket.counter?.location_id || l.id === ticket.location_id)
  return loc?.name || '-'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'WAITING': 'Menunggu', 'CALLING': 'Dipanggil', 'SERVING': 'Dilayani',
    'HOLD': 'Ditahan', 'DONE': 'Selesai', 'CANCELLED': 'Dibatalkan'
  }
  return labels[status] || status
}

const getStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-amber-100 text-amber-800', 'CALLING': 'bg-blue-100 text-blue-800',
    'SERVING': 'bg-indigo-100 text-indigo-800', 'HOLD': 'bg-orange-100 text-orange-800',
    'DONE': 'bg-emerald-100 text-emerald-800', 'CANCELLED': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const e = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${s} - ${e}`
}

const resetFilters = () => {
  filters.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  filters.endDate = new Date().toISOString().split('T')[0]
  filters.locationId = ''
  filters.status = ''
  pagination.page = 1
}

const loadData = async () => {
  loading.value = true
  
  try {
    const response = await getOwnerTickets(
      filters.startDate,
      filters.endDate,
      filters.locationId ? parseInt(filters.locationId) : undefined,
      filters.status || undefined
    )
    
    if (response.ok && response.data) {
      tickets.value = response.data.tickets || []
      counters.value = response.data.counters || []
      locations.value = response.data.locations || []
    } else {
      tickets.value = []
      toast.add({ title: 'Error', description: response.error || 'Gagal memuat data', color: 'red' })
    }
  } catch (error: any) {
    console.error('Failed to load tickets:', error)
    tickets.value = []
    toast.add({ title: 'Error', description: 'Gagal memuat data laporan', color: 'red' })
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadData()
  toast.add({ title: 'Data Diperbarui', color: 'green' })
}

// Export functions
const sanitizeForExport = (value: any): string => {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[=+\-@\t\r\n]/g, ' ').trim()
}

const exportToCSV = () => {
  if (filteredTickets.value.length === 0) return
  exporting.value = true
  
  try {
    const headers = ['No. Antrian', 'Cabang', 'Loket', 'Tanggal', 'Waktu Dibuat', 'Waktu Selesai', 'Status']
    const rows = filteredTickets.value.map(t => [
      sanitizeForExport(t.queue_number),
      sanitizeForExport(getLocationName(t)),
      sanitizeForExport(t.counter?.name),
      sanitizeForExport(t.date_for),
      sanitizeForExport(formatDateTime(t.created_at)),
      sanitizeForExport(t.finished_at ? formatDateTime(t.finished_at) : '-'),
      sanitizeForExport(getStatusLabel(t.status))
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-antrian-${filters.startDate}-${filters.endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.add({ title: 'Export CSV Berhasil', color: 'green' })
  } catch (error) {
    toast.add({ title: 'Export Gagal', color: 'red' })
  } finally {
    exporting.value = false
  }
}

const exportToJSON = () => {
  if (filteredTickets.value.length === 0) return
  exporting.value = true
  
  try {
    const exportData = {
      period: { start: filters.startDate, end: filters.endDate },
      generatedAt: new Date().toISOString(),
      summary: stats.value,
      tickets: filteredTickets.value.map(t => ({
        queue_number: t.queue_number,
        location: getLocationName(t),
        counter: t.counter?.name,
        date: t.date_for,
        created_at: t.created_at,
        finished_at: t.finished_at,
        status: t.status
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-antrian-${filters.startDate}-${filters.endDate}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.add({ title: 'Export JSON Berhasil', color: 'green' })
  } catch (error) {
    toast.add({ title: 'Export Gagal', color: 'red' })
  } finally {
    exporting.value = false
  }
}

const printReport = () => {
  if (filteredTickets.value.length === 0) return
  
  const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Antrian</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #1f2937; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #f9fafb; font-weight: 600; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Laporan Antrian</h1>
  <p>Periode: ${formatDateRange(filters.startDate, filters.endDate)}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${stats.value.total}</div><div class="stat-label">Total</div></div>
    <div class="stat"><div class="stat-value">${stats.value.completed}</div><div class="stat-label">Selesai</div></div>
    <div class="stat"><div class="stat-value">${stats.value.completionRate}%</div><div class="stat-label">Penyelesaian</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>No. Antrian</th>
        <th>Cabang</th>
        <th>Loket</th>
        <th>Waktu Dibuat</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${filteredTickets.value.map(t => `
        <tr>
          <td>${t.queue_number}</td>
          <td>${getLocationName(t)}</td>
          <td>${t.counter?.name || '-'}</td>
          <td>${formatDateTime(t.created_at)}</td>
          <td>${getStatusLabel(t.status)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printHtml)
    printWindow.document.close()
    printWindow.print()
  }
}

const copyToClipboard = async () => {
  if (filteredTickets.value.length === 0) return
  
  const text = filteredTickets.value.map(t => 
    `${t.queue_number}\t${getLocationName(t)}\t${t.counter?.name || '-'}\t${getStatusLabel(t.status)}`
  ).join('\n')
  
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Data Disalin', description: 'Data berhasil disalin ke clipboard', color: 'green' })
  } catch {
    toast.add({ title: 'Gagal', description: 'Tidak dapat menyalin data', color: 'red' })
  }
}

// Watch filters and reload data
watch(() => [filters.startDate, filters.endDate], () => {
  pagination.page = 1
  loadData()
}, { deep: true })

// Initialize
onMounted(() => {
  loadData()
})

// SEO
useHead({
  title: 'Laporan & Ekspor - Waitless',
  meta: [{ name: 'description', content: 'Analisis performa bisnis dan ekspor data laporan.' }]
})
</script>