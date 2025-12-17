<template>
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-gray-900">Laporan Harian</h1>
      <p class="text-gray-600">Analisis dan laporan statistik harian sistem antrian</p>
    </div>

    <!-- Date Filter -->
    <AdminFilterSection title="Filter Laporan" @reset="resetFilters">
      <!-- Date Range -->
      <UiFormField
        label="Tanggal Mulai"
        type="date"
        v-model="filters.startDate"
      />
      
      <UiFormField
        label="Tanggal Akhir"
        type="date"
        v-model="filters.endDate"
      />

      <!-- Location Filter -->
      <UiFormField
        label="Lokasi"
        type="select"
        v-model="filters.locationId"
        placeholder="Semua Lokasi"
        :options="locationOptions"
      />

      <!-- Report Type -->
      <div class="flex flex-col gap-2 items-start w-[264px] max-md:w-[calc(50%_-_8px)] max-sm:w-full">
        <label class="flex justify-start items-center h-5">
          <div class="text-sm font-medium text-gray-700">Jenis Laporan</div>
        </label>
        <UiButtonGroup
          v-model="filters.reportType"
          :buttons="reportTypeOptions"
        />
      </div>
    </AdminFilterSection>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Total Antrian"
        :value="reportStats.totalTickets || 0"
        subtitle="Periode terpilih"
        icon="queue"
        color="blue"
      />
      
      <AdminStatsCard
        title="Rata-rata Waktu Tunggu"
        :value="`${reportStats.avgWaitTime || 0} min`"
        subtitle="Per antrian"
        icon="clock"
        color="yellow"
      />
      
      <AdminStatsCard
        title="Tingkat Penyelesaian"
        :value="`${reportStats.completionRate || 0}%`"
        subtitle="Antrian selesai"
        icon="check"
        color="green"
      />
      
      <AdminStatsCard
        title="Loket Aktif"
        :value="reportStats.activeCounters || 0"
        subtitle="Loket beroperasi"
        icon="counter"
        color="purple"
      />
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Daily Queue Chart -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Grafik Antrian Harian</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <!-- Placeholder for chart -->
          <div class="text-center">
            <svg class="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p>Grafik akan ditampilkan di sini</p>
          </div>
        </div>
      </div>

      <!-- Service Distribution -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Distribusi Layanan</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <!-- Placeholder for pie chart -->
          <div class="text-center">
            <svg class="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
            </svg>
            <p>Grafik distribusi layanan</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Actions -->
    <AdminQuickActions title="Export Laporan">
      <AdminQuickActionCard
        label="Export PDF"
        color="red"
        @click="exportToPDF"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
        </template>
      </AdminQuickActionCard>
      
      <AdminQuickActionCard
        label="Export Excel"
        color="green"
        @click="exportToExcel"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </template>
      </AdminQuickActionCard>
      
      <AdminQuickActionCard
        label="Print Laporan"
        color="blue"
        @click="printReport"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
        </template>
      </AdminQuickActionCard>
      
      <AdminQuickActionCard
        label="Email Laporan"
        color="purple"
        @click="emailReport"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </template>
      </AdminQuickActionCard>
    </AdminQuickActions>

    <!-- Detailed Report Table -->
    <UiDataTable
      title="Detail Laporan"
      subtitle="Data detail berdasarkan filter yang dipilih"
      :columns="detailColumns"
      :data="reportDetails"
      :loading="reportsLoading"
      :refreshing="refreshing"
      :total="reportDetails.length"
      item-label="record"
      :show-pagination="true"
      :pagination="pagination"
      @refresh="refreshData"
      @page-change="handlePageChange"
    >
      <template #column-date="{ value }">
        <div class="text-sm text-gray-900">
          {{ formatDate(value) }}
        </div>
      </template>
      
      <template #column-location="{ item }">
        <div class="text-sm text-gray-900">
          {{ getLocationName(item.location_id) }}
        </div>
      </template>
      
      <template #column-total_tickets="{ value }">
        <div class="text-sm font-medium text-gray-900">
          {{ value || 0 }}
        </div>
      </template>
      
      <template #column-completed_tickets="{ value }">
        <div class="text-sm text-green-600 font-medium">
          {{ value || 0 }}
        </div>
      </template>
      
      <template #column-avg_wait_time="{ value }">
        <div class="text-sm text-gray-900">
          {{ value ? `${value} min` : '-' }}
        </div>
      </template>
      
      <template #column-completion_rate="{ value }">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {{ value ? `${value}%` : '0%' }}
        </span>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { Location } from '~/types'
import AdminStatsCard from '~/components/admin/StatsCard.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

// Reactive data
const refreshing = ref(false)
const reportsLoading = ref(false)

const filters = reactive({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
  endDate: new Date().toISOString().split('T')[0], // today
  locationId: '',
  reportType: 'daily'
})

const pagination = reactive({
  page: 1,
  limit: 10
})

// Mock data
const locations = ref<Location[]>([])
const reportDetails = ref([])

const reportStats = computed(() => {
  // Calculate stats from reportDetails
  const total = reportDetails.value.length
  const totalTickets = reportDetails.value.reduce((sum: number, item: any) => sum + (item.total_tickets || 0), 0)
  const completedTickets = reportDetails.value.reduce((sum: number, item: any) => sum + (item.completed_tickets || 0), 0)
  const avgWaitTime = reportDetails.value.reduce((sum: number, item: any) => sum + (item.avg_wait_time || 0), 0) / (total || 1)
  const completionRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0

  return {
    totalTickets,
    avgWaitTime: Math.round(avgWaitTime),
    completionRate,
    activeCounters: 5 // Mock data
  }
})

const locationOptions = computed(() => {
  return locations.value.map(location => ({
    value: location.id,
    label: location.name
  }))
})

const reportTypeOptions = [
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' }
]

const detailColumns = [
  {
    key: 'date',
    title: 'Tanggal',
    width: 'min-w-[120px]'
  },
  {
    key: 'location',
    title: 'Lokasi',
    width: 'min-w-[150px]'
  },
  {
    key: 'total_tickets',
    title: 'Total Antrian',
    width: 'min-w-[120px]'
  },
  {
    key: 'completed_tickets',
    title: 'Selesai',
    width: 'min-w-[100px]'
  },
  {
    key: 'avg_wait_time',
    title: 'Rata-rata Tunggu',
    width: 'min-w-[130px]'
  },
  {
    key: 'completion_rate',
    title: 'Tingkat Selesai',
    width: 'min-w-[130px]'
  }
]

// Methods
const resetFilters = () => {
  filters.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  filters.endDate = new Date().toISOString().split('T')[0]
  filters.locationId = ''
  filters.reportType = 'daily'
  refreshData()
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadReportData(),
      loadLocations()
    ])
  } finally {
    refreshing.value = false
  }
}

const loadReportData = async () => {
  reportsLoading.value = true
  try {
    // Replace with actual API call
    const response = await $fetch('/api/admin/reports', {
      query: {
        start_date: filters.startDate,
        end_date: filters.endDate,
        location_id: filters.locationId,
        type: filters.reportType,
        page: pagination.page,
        limit: pagination.limit
      }
    })
    reportDetails.value = response.data || []
  } catch (error) {
    console.error('Failed to load report data:', error)
    // Mock data for demo
    reportDetails.value = generateMockReportData()
  } finally {
    reportsLoading.value = false
  }
}

const loadLocations = async () => {
  try {
    const response = await $fetch('/api/admin/locations')
    locations.value = response.data || []
  } catch (error) {
    console.error('Failed to load locations:', error)
    // Mock data
    locations.value = [
      { id: 1, name: 'Kantor Pusat' },
      { id: 2, name: 'Cabang A' },
      { id: 3, name: 'Cabang B' }
    ]
  }
}

const generateMockReportData = () => {
  const data = []
  const startDate = new Date(filters.startDate)
  const endDate = new Date(filters.endDate)
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    data.push({
      date: new Date(d).toISOString().split('T')[0],
      location_id: 1,
      total_tickets: Math.floor(Math.random() * 100) + 50,
      completed_tickets: Math.floor(Math.random() * 80) + 40,
      avg_wait_time: Math.floor(Math.random() * 30) + 10,
      completion_rate: Math.floor(Math.random() * 20) + 80
    })
  }
  
  return data
}

const getLocationName = (locationId: number) => {
  const location = locations.value.find(l => l.id === locationId)
  return location?.name || 'Unknown'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadReportData()
}

// Export functions
const exportToPDF = () => {
  console.log('Exporting to PDF...')
  // Implement PDF export
}

const exportToExcel = () => {
  console.log('Exporting to Excel...')
  // Implement Excel export
}

const printReport = () => {
  console.log('Printing report...')
  // Implement print functionality
  window.print()
}

const emailReport = () => {
  console.log('Emailing report...')
  // Implement email functionality
}

// Watch for filter changes
watch(() => [filters.startDate, filters.endDate, filters.locationId, filters.reportType], () => {
  pagination.page = 1
  refreshData()
})

// Load data on mount
onMounted(() => {
  refreshData()
})

// SEO
useHead({
  title: 'Laporan Harian - Admin - WaitLess',
  meta: [
    { name: 'description', content: 'Analisis dan laporan statistik harian sistem antrian.' }
  ]
})
</script>