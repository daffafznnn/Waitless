<template>
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Access Error Alert -->
    <div 
      v-if="accessError" 
      class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
    >
      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800">Akses Ditolak</h3>
        <p class="text-sm text-red-600 mt-1">{{ accessError }}</p>
      </div>
    </div>

    <!-- Page Header with Branch Info -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Laporan Harian</h1>
          <span 
            v-if="assignedLocation" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ assignedLocation.name }}
          </span>
        </div>
        <p class="text-gray-600 mt-1">Analisis dan laporan statistik antrian cabang Anda</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="refreshData"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <span class="flex items-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading ? 'Memperbarui...' : 'Refresh Data' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900">Filter Laporan</h3>
        <button 
          @click="resetFilters"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
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
        
        <!-- Counter Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Loket</label>
          <select
            v-model="filters.counterId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Semua Loket</option>
            <option v-for="counter in counters" :key="counter.id" :value="counter.id">
              {{ counter.name }}
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
        <span class="text-sm text-gray-500">
          {{ formatDateRange(filters.startDate, filters.endDate) }}
        </span>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          @click="exportToCSV"
          :disabled="exporting || filteredTickets.length === 0"
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
          :disabled="exporting || filteredTickets.length === 0"
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
          :disabled="filteredTickets.length === 0"
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
          :disabled="filteredTickets.length === 0"
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
        <table class="w-full" id="report-table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Antrian</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loket</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Dibuat</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Selesai</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dipanggil Oleh</th>
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
                <span class="text-sm text-gray-600">{{ getCounterName(ticket.counter_id) }}</span>
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
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ getCalledByName(ticket) }}</span>
              </td>
            </tr>
            <tr v-if="filteredTickets.length === 0 && !loading">
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
          <span class="px-3 py-1.5 text-sm font-medium">
            {{ pagination.page }} / {{ totalPages }}
          </span>
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
import type { Counter, Ticket } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const adminStore = useAdminStore()
const queueStore = useQueueStore()
const toast = useToast()

// State
const loading = ref(false)
const exporting = ref(false)
const accessError = ref<string | null>(null)
const assignedLocation = ref<{ id: number; name: string } | null>(null)
const counters = ref<Counter[]>([])
const tickets = ref<Ticket[]>([])

// Filters
const filters = reactive({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  counterId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20
})

// Computed
const filteredTickets = computed(() => {
  let result = tickets.value

  if (filters.counterId) {
    result = result.filter(t => t.counter_id === Number(filters.counterId))
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
const getCounterName = (counterId: number) => {
  return counters.value.find(c => c.id === counterId)?.name || 'Unknown'
}

const getCalledByName = (ticket: Ticket) => {
  if (!ticket.events || !Array.isArray(ticket.events) || ticket.events.length === 0) {
    return ticket.status === 'WAITING' ? 'Belum dipanggil' : '-'
  }
  const calledEvent = ticket.events.find((e: any) => e.event_type === 'CALLED' && e.actor)
  return calledEvent?.actor?.name || '-'
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
  filters.counterId = ''
  filters.status = ''
  pagination.page = 1
}

const loadData = async () => {
  loading.value = true
  accessError.value = null
  
  try {
    // Get admin's counters (restricted by backend)
    const accessibleCounters = await adminStore.fetchAllAccessibleCounters()
    
    if (!accessibleCounters || accessibleCounters.length === 0) {
      accessError.value = 'Anda tidak memiliki akses ke cabang manapun'
      return
    }
    
    counters.value = accessibleCounters
    
    // Get location from first counter
    const firstCounter = accessibleCounters[0]
    if (firstCounter.location_id) {
      const locationApi = useLocationApi()
      const response = await locationApi.getLocationById(firstCounter.location_id)
      if (response.ok && response.data?.location) {
        assignedLocation.value = {
          id: response.data.location.id,
          name: response.data.location.name
        }
        
        // Load tickets for date range
        await loadTickets()
      }
    }
  } catch (error: any) {
    console.error('Failed to load data:', error)
    accessError.value = error.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

const loadTickets = async () => {
  if (!assignedLocation.value) return
  
  try {
    // Load tickets for each day in the range
    const allTickets: Ticket[] = []
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const response = await queueStore.fetchTodayTickets(assignedLocation.value.id, { date: dateStr })
      if (response.tickets) {
        allTickets.push(...response.tickets)
      }
    }
    
    tickets.value = allTickets
  } catch (error) {
    console.error('Failed to load tickets:', error)
    tickets.value = []
  }
}

const refreshData = async () => {
  await loadData()
  toast.add({ title: 'Data Diperbarui', color: 'green' })
}

// Export functions
const sanitizeForExport = (value: any): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Remove potential injection characters
  return str.replace(/[=+\-@\t\r\n]/g, ' ').trim()
}

const exportToCSV = () => {
  if (filteredTickets.value.length === 0) return
  exporting.value = true
  
  try {
    const headers = ['No. Antrian', 'Loket', 'Tanggal', 'Waktu Dibuat', 'Waktu Selesai', 'Status', 'Dipanggil Oleh']
    const rows = filteredTickets.value.map(t => [
      sanitizeForExport(t.queue_number),
      sanitizeForExport(getCounterName(t.counter_id)),
      sanitizeForExport(t.date_for),
      sanitizeForExport(formatDateTime(t.created_at)),
      sanitizeForExport(t.finished_at ? formatDateTime(t.finished_at) : '-'),
      sanitizeForExport(getStatusLabel(t.status)),
      sanitizeForExport(getCalledByName(t))
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-antrian-${assignedLocation.value?.name || 'data'}-${filters.startDate}-${filters.endDate}.csv`
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
      location: assignedLocation.value?.name,
      period: { start: filters.startDate, end: filters.endDate },
      generatedAt: new Date().toISOString(),
      summary: stats.value,
      tickets: filteredTickets.value.map(t => ({
        queue_number: t.queue_number,
        counter: getCounterName(t.counter_id),
        date: t.date_for,
        created_at: t.created_at,
        finished_at: t.finished_at,
        status: t.status,
        called_by: getCalledByName(t)
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-antrian-${assignedLocation.value?.name || 'data'}-${filters.startDate}-${filters.endDate}.json`
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
  if (filteredTickets.value.length === 0) {
    toast.add({ title: 'Tidak ada data', description: 'Tidak ada data untuk dicetak', color: 'red' })
    return
  }
  
  // Create print-friendly HTML
  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Antrian - ${assignedLocation.value?.name || 'WaitLess'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      color: #1f2937;
      background: white;
      position: relative;
    }
    
    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: bold;
      color: rgba(37, 99, 235, 0.05);
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    .brand h1 {
      font-size: 24px;
      color: #1f2937;
      margin: 0;
    }
    .brand p {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0 0 0;
    }
    .report-info {
      text-align: right;
    }
    .report-info h2 {
      font-size: 18px;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    .report-info p {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0;
    }
    
    /* Branch Badge */
    .branch-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    
    /* Summary Stats */
    .summary {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-card .label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }
    .stat-card.success .value { color: #059669; }
    .stat-card.warning .value { color: #d97706; }
    .stat-card.danger .value { color: #dc2626; }
    .stat-card.purple .value { color: #7c3aed; }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #1f2937;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }
    .status-done { background: #d1fae5; color: #065f46; }
    .status-waiting { background: #fef3c7; color: #92400e; }
    .status-calling { background: #dbeafe; color: #1e40af; }
    .status-hold { background: #fed7aa; color: #c2410c; }
    .status-cancelled { background: #fee2e2; color: #b91c1c; }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }
    
    @media print {
      body { padding: 20px; }
      .watermark { font-size: 100px; }
    }
  </style>
</head>
<body>
  <div class="watermark">WAITLESS</div>
  
  <div class="header">
    <div class="logo-section">
      <div class="logo">W</div>
      <div class="brand">
        <h1>WaitLess</h1>
        <p>Sistem Manajemen Antrian</p>
      </div>
    </div>
    <div class="report-info">
      <h2>Laporan Antrian Harian</h2>
      <p>Periode: ${formatDateRange(filters.startDate, filters.endDate)}</p>
      <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
    </div>
  </div>
  
  <div class="branch-badge">📍 ${assignedLocation.value?.name || 'Cabang'}</div>
  
  <div class="summary">
    <div class="stat-card">
      <div class="value">${stats.value.total}</div>
      <div class="label">Total Antrian</div>
    </div>
    <div class="stat-card success">
      <div class="value">${stats.value.completed}</div>
      <div class="label">Selesai</div>
    </div>
    <div class="stat-card warning">
      <div class="value">${stats.value.waiting}</div>
      <div class="label">Menunggu</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.value.hold}</div>
      <div class="label">Ditahan</div>
    </div>
    <div class="stat-card danger">
      <div class="value">${stats.value.cancelled}</div>
      <div class="label">Dibatalkan</div>
    </div>
    <div class="stat-card purple">
      <div class="value">${stats.value.completionRate}%</div>
      <div class="label">Penyelesaian</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>No. Antrian</th>
        <th>Loket</th>
        <th>Tanggal</th>
        <th>Waktu Dibuat</th>
        <th>Waktu Selesai</th>
        <th>Status</th>
        <th>Dipanggil Oleh</th>
      </tr>
    </thead>
    <tbody>
      ${filteredTickets.value.map((t, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${t.queue_number}</strong></td>
          <td>${getCounterName(t.counter_id)}</td>
          <td>${t.date_for}</td>
          <td>${formatDateTime(t.created_at)}</td>
          <td>${t.finished_at ? formatDateTime(t.finished_at) : '-'}</td>
          <td><span class="status-badge status-${t.status.toLowerCase()}">${getStatusLabel(t.status)}</span></td>
          <td>${getCalledByName(t)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <div>© ${new Date().getFullYear()} WaitLess - Sistem Manajemen Antrian</div>
    <div>Total ${filteredTickets.value.length} record | Halaman 1</div>
  </div>
  
  <scr` + `ipt>
    window.onload = function() {
      window.print();
    }
  </scr` + `ipt>
</body>
</html>
  `
  
  // Open print window
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    toast.add({ title: 'Menyiapkan Cetak', description: 'Jendela cetak akan terbuka', color: 'blue' })
  } else {
    toast.add({ title: 'Gagal', description: 'Tidak dapat membuka jendela cetak', color: 'red' })
  }
}

const copyToClipboard = async () => {
  if (filteredTickets.value.length === 0) return
  
  try {
    const text = filteredTickets.value.map(t => 
      `${t.queue_number}\t${getCounterName(t.counter_id)}\t${getStatusLabel(t.status)}\t${formatDateTime(t.created_at)}`
    ).join('\n')
    
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Data Disalin', description: 'Data berhasil disalin ke clipboard', color: 'green' })
  } catch (error) {
    toast.add({ title: 'Gagal Menyalin', color: 'red' })
  }
}

// Watch filters
watch([() => filters.startDate, () => filters.endDate], async () => {
  pagination.page = 1
  if (assignedLocation.value) {
    loading.value = true
    await loadTickets()
    loading.value = false
  }
})

watch([() => filters.counterId, () => filters.status], () => {
  pagination.page = 1
})

// Initialize
onMounted(() => {
  loadData()
})

// SEO
useHead({
  title: 'Laporan Harian - Admin - WaitLess',
  meta: [{ name: 'description', content: 'Analisis dan laporan statistik antrian cabang.' }]
})
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
  table { font-size: 10px; }
}
</style>