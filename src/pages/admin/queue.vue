<template>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  />
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Access Error Alert -->
    <div 
      v-if="accessError" 
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
    >
      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800">Akses Ditolak</h3>
        <p class="text-sm text-red-600 mt-1">{{ accessError }}</p>
      </div>
    </div>

    <!-- Location Info Header -->
    <div 
      v-if="assignedLocation" 
      class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2"
    >
      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-sm font-medium text-blue-800">
        Cabang: {{ assignedLocation.name }}
      </span>
    </div>

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
            v-if="item.status === 'WAITING' || item.status === 'CALLING'"
            @click="handleCallTicket(item)"
            variant="ghost"
            size="xs"
            class="bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            {{ item.status === 'CALLING' ? 'Panggil Ulang' : 'Panggil' }}
          </UiActionButton>
          <UiActionButton
            v-if="item.status === 'CALLING' || item.status === 'SERVING'"
            @click="handleHoldTicket(item)"
            variant="ghost"
            size="xs"
            class="bg-amber-50 text-amber-600 hover:bg-amber-100"
          >
            Hold
          </UiActionButton>
          <UiActionButton
            v-if="item.status === 'CALLING' || item.status === 'SERVING'"
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
const adminStore = useAdminStore()
const toast = useToast()

// Track admin's assigned location
const assignedLocation = ref<{ id: number; name: string } | null>(null)
const accessError = ref<string | null>(null)

// Get current location from assigned location
const currentLocationId = computed(() => assignedLocation.value?.id || null)

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
  // First check if ticket has events array
  if (!ticket.events || !Array.isArray(ticket.events) || ticket.events.length === 0) {
    // If no events, check ticket status - only show '-' for relevant statuses
    if (ticket.status === 'WAITING') {
      return 'Belum dipanggil'
    }
    return '-'
  }
  
  // Find the CALLED event which has the caller (actor) info
  // Look for events in order: CALLED, RESUMED, or most recent with actor
  const calledEvent = ticket.events.find((e: any) => e.event_type === 'CALLED' && e.actor)
  if (calledEvent?.actor?.name) {
    return calledEvent.actor.name
  }
  
  // Try RESUMED event (if ticket was re-called)
  const resumedEvent = ticket.events.find((e: any) => e.event_type === 'RESUMED' && e.actor)
  if (resumedEvent?.actor?.name) {
    return resumedEvent.actor.name
  }
  
  // Fallback: find any event with actor
  const anyEventWithActor = ticket.events.find((e: any) => e.actor?.name)
  if (anyEventWithActor?.actor?.name) {
    return anyEventWithActor.actor.name
  }
  
  return '-'
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

/**
 * Load admin's assigned location first, then load data
 */
const loadAdminLocation = async () => {
  try {
    accessError.value = null
    
    // Fetch accessible counters - this will only return counters from assigned location
    const accessibleCounters = await adminStore.fetchAllAccessibleCounters()
    
    if (accessibleCounters && accessibleCounters.length > 0) {
      // Get location from first counter (all should be from same location for admin)
      const firstCounter = accessibleCounters[0]
      if (firstCounter.location_id) {
        // Fetch location details
        const locationApi = useLocationApi()
        const response = await locationApi.getLocationById(firstCounter.location_id)
        if (response.ok && response.data?.location) {
          assignedLocation.value = {
            id: response.data.location.id,
            name: response.data.location.name
          }
        }
      }
      counters.value = accessibleCounters
    } else {
      accessError.value = 'Anda tidak memiliki akses ke cabang manapun'
      counters.value = []
    }
  } catch (error: any) {
    console.error('Failed to load admin location:', error)
    
    // Check for 403 Forbidden
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = 'Akses Anda ke cabang ini telah dinonaktifkan'
    } else {
      accessError.value = error.message || 'Gagal memuat data cabang'
    }
    
    counters.value = []
  }
}

const refreshData = async () => {
  refreshing.value = true
  try {
    // First ensure we have the admin's assigned location
    if (!assignedLocation.value) {
      await loadAdminLocation()
    }
    
    // Only load tickets if we have access to a location
    if (currentLocationId.value) {
      await loadTickets()
      await loadCounters()
    }
  } catch (error: any) {
    console.error('Refresh failed:', error)
    
    // Handle 403 errors
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = error.message
      toast.add({
        title: 'Akses Ditolak',
        description: error.message || 'Anda tidak memiliki akses ke cabang ini',
        color: 'red'
      })
    }
  } finally {
    refreshing.value = false
  }
}

const loadTickets = async () => {
  if (!currentLocationId.value) {
    tickets.value = []
    return
  }
  
  ticketsLoading.value = true
  try {
    const response = await queueStore.fetchTodayTickets(currentLocationId.value, {
      date: filters.date
    })
    tickets.value = response.tickets || []
  } catch (error: any) {
    console.error('Failed to load tickets:', error)
    
    // Handle 403 errors
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = 'Akses Anda ke cabang ini telah dinonaktifkan'
      assignedLocation.value = null
    }
    
    tickets.value = []
  } finally {
    ticketsLoading.value = false
  }
}

const loadCounters = async () => {
  if (!currentLocationId.value) return
  
  try {
    // Use admin API to get counters for assigned location
    const response = await adminStore.fetchLocationCounters(currentLocationId.value)
    if (response) {
      counters.value = response
    }
  } catch (error: any) {
    console.error('Failed to load counters:', error)
    
    // Handle 403 errors
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = 'Akses ke cabang ini telah dinonaktifkan'
    }
    
    // Keep existing counters if any
  }
}

const handleCallTicket = async (ticket: Ticket) => {
  const toast = useToast()
  
  // Get counter_id from direct field or nested counter object
  const counterId = ticket.counter_id || (ticket as any).counter?.id
  
  if (!counterId) {
    console.error('Counter ID not found in ticket:', ticket)
    toast.add({
      title: 'Error',
      description: 'Data loket tidak ditemukan pada tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
    return
  }
  
  try {
    // Distinguish between call (WAITING) and recall (CALLING)
    const isRecall = ticket.status === 'CALLING'
    
    if (isRecall) {
      // Re-call an already calling ticket
      await queueStore.recallTicket({ ticketId: Number(ticket.id) })
      toast.add({
        title: 'Berhasil',
        description: `Tiket ${ticket.queue_number} berhasil dipanggil ulang`,
        icon: 'i-heroicons-megaphone',
        color: 'green'
      })
    } else {
      // Call next waiting ticket
      await queueStore.callNext({ counterId: Number(counterId) })
      toast.add({
        title: 'Berhasil',
        description: `Tiket ${ticket.queue_number} berhasil dipanggil`,
        icon: 'i-heroicons-megaphone',
        color: 'green'
      })
    }
    
    await refreshData()
  } catch (error: any) {
    console.error('Failed to call ticket:', error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Gagal memanggil tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleHoldTicket = async (ticket: Ticket) => {
  const toast = useToast()
  const { $modal } = useNuxtApp()
  
  // Validate ticket ID
  if (!ticket.id) {
    console.error('Ticket ID not found:', ticket)
    toast.add({
      title: 'Error',
      description: 'ID tiket tidak ditemukan',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
    return
  }
  
  try {
    // Prompt for hold reason using custom modal
    const reason = await $modal.prompt({
      title: 'Tahan Tiket',
      message: 'Masukkan alasan menahan antrian ini:',
      placeholder: 'Contoh: Pelanggan belum merespons panggilan',
      confirmText: 'Tahan Antrian',
      cancelText: 'Batal',
      required: true
    })
    
    // If user cancelled or empty input (though required handles empty), stop
    if (!reason) return
    
    await queueStore.holdTicket({ ticketId: Number(ticket.id), reason })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil di-hold`,
      icon: 'i-heroicons-pause',
      color: 'orange'
    })
  } catch (error: any) {
    console.error('Failed to hold ticket:', error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Gagal melakukan hold pada tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleResumeTicket = async (ticket: Ticket) => {
  const toast = useToast()
  
  // Validate ticket ID
  if (!ticket.id) {
    console.error('Ticket ID not found:', ticket)
    toast.add({
      title: 'Error',
      description: 'ID tiket tidak ditemukan',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
    return
  }
  
  try {
    await queueStore.resumeTicket({ ticketId: Number(ticket.id) })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil dilanjutkan`,
      icon: 'i-heroicons-play',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Failed to resume ticket:', error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Gagal melanjutkan tiket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
}

const handleMarkDone = async (ticket: Ticket) => {
  const toast = useToast()
  const { $modal } = useNuxtApp()
  
  // Validate ticket ID
  if (!ticket.id) {
    console.error('Ticket ID not found:', ticket)
    toast.add({
      title: 'Error',
      description: 'ID tiket tidak ditemukan',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
    return
  }

  // Confirm action
  const confirmed = await $modal.confirm({
    title: 'Selesaikan Pelayanan',
    message: `Apakah Anda yakin ingin menyelesaikan pelayanan untuk tiket <strong>${ticket.queue_number}</strong>?`,
    type: 'info',
    confirmText: 'Ya, Selesai',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  try {
    await queueStore.markDone({ ticketId: Number(ticket.id) })
    await refreshData()
    
    toast.add({
      title: 'Berhasil',
      description: `Tiket ${ticket.queue_number} berhasil diselesaikan`,
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Failed to mark ticket as done:', error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Gagal menyelesaikan tiket',
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
