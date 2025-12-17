<template>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  />
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Filter Section -->
    <AdminFilterSection title="Filter Antrian" @reset="resetFilters">
      <!-- Loket Filter -->
      <UiFormField
        label="Loket"
        type="select"
        v-model="filters.counterId"
        placeholder="Semua Loket"
        :options="counterOptions"
      />

      <!-- Status Filter -->
      <div class="flex flex-col gap-2 items-start w-[264px] max-md:w-[calc(50%_-_8px)] max-sm:w-full">
        <label class="flex justify-start items-center h-5">
          <div class="text-sm font-medium text-gray-700">Status</div>
        </label>
        <UiButtonGroup
          v-model="filters.status"
          :buttons="statusOptions"
        />
      </div>

      <!-- Date Filter -->
      <UiFormField
        label="Tanggal"
        type="date"
        v-model="filters.date"
      />

      <!-- Search Filter -->
      <UiFormField
        label="Cari"
        type="search"
        v-model="filters.search"
        placeholder="Cari nomor antrian..."
      />
    </AdminFilterSection>

    <!-- Queue Table -->
    <UiDataTable
      title="Daftar Antrian Hari Ini"
      subtitle="Panggil nomor berikutnya sesuai urutan antrean"
      :columns="tableColumns"
      :data="currentPageTickets"
      :loading="ticketsLoading"
      :refreshing="refreshing"
      :total="paginatedTickets.total"
      item-label="antrean"
      :pagination="pagination"
      @refresh="refreshData"
      @page-change="handlePageChange"
    >
      <template #column-queue_number="{ value }">
        <div class="text-sm font-semibold text-gray-900">
          {{ value }}
        </div>
      </template>
      
      <template #column-counter_name="{ item }">
        <div class="text-sm text-gray-900">
          {{ getCounterName(item.counter_id) }}
        </div>
      </template>
      
      <template #column-created_at="{ value }">
        <div class="text-sm text-gray-500">
          {{ formatTime(value) }}
        </div>
      </template>
      
      <template #column-status="{ value }">
        <span
          :class="[
            'flex justify-center items-center px-3 h-6 rounded-full text-xs font-medium text-center',
            getStatusClasses(value)
          ]"
        >
          {{ getStatusLabel(value) }}
        </span>
      </template>
      
      <template #column-served_by="{ item }">
        <div class="text-sm text-gray-900">
          {{ getServedByName(item) }}
        </div>
      </template>
      
      <template #column-actions="{ item }">
        <div v-if="item.status === 'DONE'" class="px-6 py-0 text-sm leading-5 text-gray-500">
          Selesai dilayani
        </div>
        <div v-else-if="item.status === 'HOLD'" class="flex gap-2 items-start px-6 py-0">
          <UiActionButton
            @click="handleResumeTicket(item)"
            variant="ghost"
            size="xs"
            class="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            Lepas Hold
          </UiActionButton>
          <UiActionButton
            @click="handleMarkDone(item)"
            variant="ghost"
            size="xs"
            class="bg-green-50 text-green-600 hover:bg-green-100"
          >
            Selesai
          </UiActionButton>
        </div>
        <div v-else class="flex gap-2 items-start px-6 py-0">
          <UiActionButton
            v-if="item.status === 'WAITING'"
            @click="handleCallTicket(item)"
            variant="ghost"
            size="xs"
            class="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            Panggil
          </UiActionButton>
          <UiActionButton
            v-if="item.status === 'WAITING' || item.status === 'CALLING'"
            @click="handleHoldTicket(item)"
            variant="ghost"
            size="xs"
            class="bg-amber-50 text-amber-600 hover:bg-amber-100"
          >
            Hold
          </UiActionButton>
          <UiActionButton
            v-if="item.status === 'WAITING' || item.status === 'CALLING' || item.status === 'SERVING'"
            @click="handleMarkDone(item)"
            variant="ghost"
            size="xs"
            class="bg-green-50 text-green-600 hover:bg-green-100"
          >
            Selesai
          </UiActionButton>
        </div>
      </template>
    </UiDataTable>


    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Total Antrian"
        :value="queueStats.total || 0"
        subtitle="Hari ini"
        icon="queue"
        color="blue"
      />
      
      <AdminStatsCard
        title="Sedang Menunggu"
        :value="queueStats.waiting || 0"
        subtitle="Antrian aktif"
        icon="clock"
        color="indigo"
      />
      
      <AdminStatsCard
        title="Selesai Dilayani"
        :value="queueStats.completed || 0"
        subtitle="Completed"
        icon="check"
        color="green"
      />
      
      <AdminStatsCard
        title="Ditahan (Hold)"
        :value="queueStats.hold || 0"
        subtitle="On hold"
        icon="pause"
        color="yellow"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ticket, Counter } from '~/types'
import AdminStatsCard from '~/components/admin/StatsCard.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const queueStore = useQueueStore()

// Get user's location - assuming admin users have a default location
// This should be adapted based on your user-location relationship
const currentLocationId = computed(() => {
  // For now, we'll use a default location ID of 1
  // In a real app, this should come from user's assigned location or be selectable
  return 1
})

// Watch for store loading states
watch(() => queueStore.isLoading, (loading: boolean) => {
  if (loading !== ticketsLoading.value) {
    ticketsLoading.value = loading
  }
})

const refreshing = ref(false)
const ticketsLoading = ref(false)
const autoRefreshInterval = ref<NodeJS.Timeout>()

const filters = reactive({
  counterId: '',
  status: '',
  date: new Date().toISOString().split('T')[0],
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 10
})

const tickets = ref<Ticket[]>([])
const counters = ref<Counter[]>([])

const counterOptions = computed(() => {
  return counters.value.map(counter => ({
    value: counter.id,
    label: counter.name
  }))
})

const statusOptions = [
  { label: 'Semua', value: '' },
  { label: 'Waiting', value: 'WAITING' },
  { label: 'Hold', value: 'HOLD' }
]

const tableColumns = [
  {
    key: 'queue_number',
    title: 'Nomor Antrian',
    width: 'min-w-[120px]',
    fontWeight: 'font-semibold'
  },
  {
    key: 'counter_name',
    title: 'Loket',
    width: 'min-w-[150px]'
  },
  {
    key: 'created_at',
    title: 'Waktu Dibuat',
    width: 'min-w-[130px]',
    format: 'time' as const
  },
  {
    key: 'status',
    title: 'Status',
    width: 'min-w-[100px]'
  },
  {
    key: 'served_by',
    title: 'Dipanggil Oleh',
    width: 'min-w-[150px]'
  },
  {
    key: 'actions',
    title: 'Aksi',
    width: 'min-w-[200px]'
  }
]

const queueStats = computed(() => {
  if (!tickets.value) return { total: 0, waiting: 0, completed: 0, hold: 0 }
  
  return {
    total: tickets.value.length,
    waiting: tickets.value.filter((t: Ticket) => t.status === 'WAITING' || t.status === 'CALLING').length,
    completed: tickets.value.filter((t: Ticket) => t.status === 'DONE').length,
    hold: tickets.value.filter((t: Ticket) => t.status === 'HOLD').length
  }
})

const filteredTickets = computed(() => {
  if (!tickets.value) return []
  
  let filtered = tickets.value
  
  if (filters.counterId) {
    filtered = filtered.filter((t: Ticket) => t.counter_id === Number(filters.counterId))
  }
  
  if (filters.status) {
    filtered = filtered.filter((t: Ticket) => t.status === filters.status)
  }
  
  if (filters.search) {
    filtered = filtered.filter((t: Ticket) => 
      t.queue_number.toLowerCase().includes(filters.search.toLowerCase())
    )
  }
  
  return filtered
})

const paginatedTickets = computed(() => {
  const start = (pagination.page - 1) * pagination.limit
  const end = start + pagination.limit
  return {
    data: filteredTickets.value.slice(start, end),
    total: filteredTickets.value.length
  }
})

const currentPageTickets = computed(() => paginatedTickets.value.data)

const totalPages = computed(() => {
  return Math.ceil((paginatedTickets.value.total || 0) / pagination.limit)
})

const paginationStart = computed(() => {
  return (pagination.page - 1) * pagination.limit + 1
})

const paginationEnd = computed(() => {
  const end = pagination.page * pagination.limit
  return Math.min(end, paginatedTickets.value.total || 0)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = pagination.page
  const pages: number[] = []
  
  if (total <= 3) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current === 1) {
      pages.push(1, 2, 3)
    } else if (current === total) {
      pages.push(total - 2, total - 1, total)
    } else {
      pages.push(current - 1, current, current + 1)
    }
  }
  
  return pages
})

const getCounterName = (counterId: number) => {
  const counter = counters.value.find((c: Counter) => c.id === counterId)
  return counter?.name || 'Unknown'
}

const getServedByName = (ticket: Ticket) => {
  // Since the ticket might not have served_by relation loaded,
  // we'll display a placeholder for now
  // In a real app, you might want to load this data separately
  return ticket.events?.find((e: any) => e.event_type === 'CALLED')?.actor?.name || '-'
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'WAITING': 'Waiting',
    'CALLING': 'Calling',
    'SERVING': 'Serving',
    'HOLD': 'Hold',
    'DONE': 'Done',
    'CANCELLED': 'Cancelled'
  }
  return labels[status] || status
}

const getStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-blue-50 text-blue-600',
    'CALLING': 'bg-blue-50 text-blue-600',
    'SERVING': 'bg-blue-50 text-blue-600',
    'HOLD': 'bg-amber-50 text-amber-500',
    'DONE': 'bg-green-50 text-emerald-500',
    'CANCELLED': 'bg-red-50 text-red-500'
  }
  return classes[status] || 'bg-gray-50 text-gray-500'
}

const resetFilters = () => {
  filters.counterId = ''
  filters.status = ''
  filters.date = new Date().toISOString().split('T')[0]
  filters.search = ''
  pagination.page = 1
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await loadTickets()
    await loadCounters()
  } finally {
    refreshing.value = false
  }
}

const loadTickets = async () => {
  ticketsLoading.value = true
  try {
    const response = await queueStore.fetchTodayTickets(currentLocationId.value, {
      date: filters.date
    })
    tickets.value = response.tickets || []
  } catch (error) {
    console.error('Failed to load tickets:', error)
    tickets.value = []
  } finally {
    ticketsLoading.value = false
  }
}

const loadCounters = async () => {
  try {
    // Using the location API to get counters for current location
    const response = await $fetch<any>(`/api/locations/${currentLocationId.value}/counters`)
    counters.value = response.data?.counters || response.counters || []
  } catch (error) {
    console.error('Failed to load counters:', error)
    counters.value = []
  }
}

const handleCallTicket = async (ticket: Ticket) => {
  const toast = useToast()
  
  try {
    await queueStore.callNext({ counterId: ticket.counter_id })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil dipanggil`,
      icon: 'i-heroicons-megaphone',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to call ticket:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memanggil tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleHoldTicket = async (ticket: Ticket) => {
  const toast = useToast()
  
  try {
    // Prompt for hold reason
    const reason = prompt('Alasan hold tiket:') || 'Admin hold'
    await queueStore.holdTicket({ ticketId: ticket.id, reason })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil di-hold`,
      icon: 'i-heroicons-pause',
      color: 'orange'
    })
  } catch (error) {
    console.error('Failed to hold ticket:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal melakukan hold pada tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleResumeTicket = async (ticket: Ticket) => {
  const toast = useToast()
  
  try {
    await queueStore.resumeTicket({ ticketId: ticket.id })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil dilanjutkan`,
      icon: 'i-heroicons-play',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to resume ticket:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal melanjutkan tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleMarkDone = async (ticket: Ticket) => {
  const toast = useToast()
  
  try {
    await queueStore.markDone({ ticketId: ticket.id })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil diselesaikan`,
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to mark ticket as done:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal menyelesaikan tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const previousPage = () => {
  if (pagination.page > 1) {
    pagination.page--
  }
}

const nextPage = () => {
  if (pagination.page < totalPages.value) {
    pagination.page++
  }
}

const goToPage = (page: number) => {
  pagination.page = page
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

watch(() => filters.date, () => {
  pagination.page = 1
  refreshData()
})

onMounted(async () => {
  await refreshData()
  autoRefreshInterval.value = setInterval(refreshData, 15000)
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})

useHead({
  title: 'Queue Management - Admin - Waitless',
  meta: [
    { name: 'description', content: 'Manage customer queues and monitor queue status in real-time.' }
  ]
})
</script>
