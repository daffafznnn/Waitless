<!-- FILE: src/pages/admin/queue.vue -->
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-surface-200 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-surface-900">Queue Management</h1>
          <p class="text-surface-600 mt-1">Monitor and manage customer queues in real-time</p>
        </div>
        <div class="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            @click="refreshData"
            :loading="refreshing"
            label="Refresh"
          />
          <StatusBadge 
            :status="autoRefresh ? 'active' : 'inactive'" 
            :label="autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'"
            @click="toggleAutoRefresh"
            class="cursor-pointer"
          />
        </div>
      </div>
    </div>

    <!-- Filters and Controls -->
    <FilterBar>
      <template #filters>
        <div class="flex flex-wrap gap-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Counter</label>
            <select 
              v-model="filters.counterId"
              class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Counters</option>
              <option 
                v-for="counter in counters" 
                :key="counter.id" 
                :value="counter.id"
              >
                {{ counter.name }} ({{ counter.location_name }})
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Status</label>
            <select 
              v-model="filters.status"
              class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="waiting">Waiting</option>
              <option value="called">Called</option>
              <option value="serving">Being Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Date</label>
            <input 
              v-model="filters.date"
              type="date"
              class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
            >
          </div>
        </div>
      </template>
      
      <template #actions>
        <Button
          variant="primary"
          @click="openIssueTicket"
          label="Issue New Ticket"
          icon="plus"
        />
      </template>
    </FilterBar>

    <!-- Queue Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total in Queue"
        :value="queueStats?.totalWaiting || 0"
        icon="queue"
        :loading="statsLoading"
      />
      <StatCard
        title="Being Served"
        :value="queueStats?.currentlyServing || 0"
        icon="serving"
        :loading="statsLoading"
      />
      <StatCard
        title="Completed Today"
        :value="queueStats?.completedToday || 0"
        icon="check"
        :loading="statsLoading"
      />
      <StatCard
        title="Avg Wait Time"
        :value="`${queueStats?.avgWaitTime || 0} min`"
        icon="clock"
        :loading="statsLoading"
      />
    </div>

    <!-- Queue Table -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b border-surface-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-surface-900">Current Queue</h3>
          <div class="text-sm text-surface-500">
            {{ filteredTickets?.length || 0 }} tickets
          </div>
        </div>
      </div>

      <DataTable
        :columns="queueColumns"
        :data="filteredTickets"
        :loading="ticketsLoading"
        :pagination="pagination"
        @action="handleAction"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
      >
        <template #empty>
          <EmptyState
            title="No Queue Items"
            description="No customers are currently in the queue for the selected filters."
          />
        </template>
      </DataTable>
    </div>
  </div>

  <!-- Issue Ticket Modal -->
  <Modal v-model="issueTicketModal" title="Issue New Ticket" size="md">
    <form @submit.prevent="handleIssueTicket" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-surface-700 mb-1">Counter</label>
        <select 
          v-model="ticketForm.counterId"
          required
          class="w-full rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select Counter</option>
          <option 
            v-for="counter in activeCounters" 
            :key="counter.id" 
            :value="counter.id"
          >
            {{ counter.name }} ({{ counter.location_name }})
          </option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-surface-700 mb-1">Customer Name (Optional)</label>
        <input 
          v-model="ticketForm.customerName"
          type="text"
          placeholder="Enter customer name"
          class="w-full rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-surface-700 mb-1">Phone Number (Optional)</label>
        <input 
          v-model="ticketForm.customerPhone"
          type="tel"
          placeholder="Enter phone number"
          class="w-full rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
        >
      </div>
      
      <div class="flex justify-end gap-3 pt-4">
        <Button
          variant="secondary"
          @click="issueTicketModal = false"
          label="Cancel"
        />
        <Button
          type="submit"
          variant="primary"
          :loading="issuingTicket"
          label="Issue Ticket"
        />
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import type { Ticket, Counter, QueueStats } from '~/types'

// Page meta
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

// Reactive data
const refreshing = ref(false)
const autoRefresh = ref(true)
const issueTicketModal = ref(false)
const issuingTicket = ref(false)
const autoRefreshInterval = ref<NodeJS.Timeout>()

// Filters
const filters = reactive({
  counterId: '',
  status: '',
  date: new Date().toISOString().split('T')[0]
})

// Pagination
const pagination = reactive({
  page: 1,
  limit: 25,
  total: 0
})

// Issue ticket form
const ticketForm = reactive({
  counterId: '',
  customerName: '',
  customerPhone: ''
})

// Fetch data
const { data: counters } = await useFetch<Counter[]>('/api/admin/counters')
const { data: queueStats, pending: statsLoading } = await useFetch<QueueStats>('/api/admin/queue/stats')
const { data: tickets, pending: ticketsLoading, refresh: refreshTickets } = await useFetch<{tickets: Ticket[], total: number}>('/api/admin/queue/tickets', {
  query: computed(() => ({ ...filters, ...pagination }))
})

// Computed
const activeCounters = computed(() => {
  return counters.value?.filter(counter => counter.status === 'active') || []
})

const filteredTickets = computed(() => {
  return tickets.value?.tickets || []
})

// Table columns
const queueColumns = [
  { key: 'queue_number', label: 'Queue #', sortable: true },
  { key: 'customer_name', label: 'Customer', sortable: true },
  { key: 'counter_name', label: 'Counter', sortable: true },
  { key: 'status', label: 'Status', component: 'StatusBadge' },
  { key: 'created_at', label: 'Issued', sortable: true, component: 'DateTime' },
  { key: 'wait_time', label: 'Wait Time', component: 'Duration' },
  { 
    key: 'actions', 
    label: 'Actions', 
    component: 'ActionButtons',
    actions: [
      { label: 'Call', action: 'call', variant: 'primary', condition: (row: Ticket) => row.status === 'waiting' },
      { label: 'Serve', action: 'serve', variant: 'success', condition: (row: Ticket) => row.status === 'called' },
      { label: 'Complete', action: 'complete', variant: 'success', condition: (row: Ticket) => row.status === 'serving' },
      { label: 'Cancel', action: 'cancel', variant: 'danger', condition: (row: Ticket) => ['waiting', 'called'].includes(row.status) }
    ]
  }
]

// Methods
const refreshData = async () => {
  refreshing.value = true
  try {
    await refreshTickets()
  } finally {
    refreshing.value = false
  }
}

const handleAction = async (action: string, ticket: Ticket) => {
  try {
    switch (action) {
      case 'call':
        await $fetch(`/api/admin/queue/${ticket.id}/call`, { method: 'POST' })
        break
      case 'serve':
        await $fetch(`/api/admin/queue/${ticket.id}/serve`, { method: 'POST' })
        break
      case 'complete':
        await $fetch(`/api/admin/queue/${ticket.id}/complete`, { method: 'POST' })
        break
      case 'cancel':
        await $fetch(`/api/admin/queue/${ticket.id}/cancel`, { method: 'POST' })
        break
    }
    await refreshData()
  } catch (error) {
    console.error(`Failed to ${action} ticket:`, error)
  }
}

const openIssueTicket = () => {
  ticketForm.counterId = ''
  ticketForm.customerName = ''
  ticketForm.customerPhone = ''
  issueTicketModal.value = true
}

const handleIssueTicket = async () => {
  if (!ticketForm.counterId) return
  
  issuingTicket.value = true
  try {
    await $fetch('/api/admin/queue/issue', {
      method: 'POST',
      body: {
        counterId: ticketForm.counterId,
        customerName: ticketForm.customerName || null,
        customerPhone: ticketForm.customerPhone || null
      }
    })
    
    issueTicketModal.value = false
    await refreshData()
  } catch (error) {
    console.error('Failed to issue ticket:', error)
  } finally {
    issuingTicket.value = false
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
  autoRefreshInterval.value = setInterval(refreshData, 15000) // Every 15 seconds
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

const handleSortChange = (sort: any) => {
  // Handle sorting logic
}

// Watch filters
watch(filters, () => {
  pagination.page = 1
  refreshData()
}, { deep: true })

// Watch pagination total
watch(() => tickets.value?.total, (newTotal) => {
  if (newTotal !== undefined) {
    pagination.total = newTotal
  }
})

// Lifecycle
onMounted(() => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// SEO
useHead({
  title: 'Queue Management - Admin - Waitless',
  meta: [
    { name: 'description', content: 'Manage customer queues and monitor queue status in real-time.' }
  ]
})
</script>