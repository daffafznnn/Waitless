<!-- FILE: src/pages/(visitor)/queue/me.vue -->
<template>
  <PublicLayout>
    <div class="min-h-screen bg-surface-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-surface-200">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-surface-900">My Tickets</h1>
              <p class="text-surface-600 mt-1">Track your queue positions and status</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              to="/queue"
              label="Get New Ticket"
            />
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <!-- Search/Filter -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by queue number or location..."
                class="w-full rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500"
              >
            </div>
            <div class="flex gap-2">
              <select 
                v-model="statusFilter"
                class="rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="waiting">Waiting</option>
                <option value="called">Called</option>
                <option value="serving">Being Served</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                @click="refreshTickets"
                :loading="refreshing"
                label="Refresh"
              />
            </div>
          </div>
        </div>

        <!-- Tickets List -->
        <div v-if="filteredTickets?.length" class="space-y-4">
          <!-- Active Tickets -->
          <div v-if="activeTickets.length">
            <h2 class="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <span class="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></span>
              Active Tickets
            </h2>
            <div class="grid gap-4">
              <TicketCard
                v-for="ticket in activeTickets"
                :key="ticket.id"
                :ticket="ticket"
                :is-active="true"
                @cancel="cancelTicket"
                @refresh="refreshTicket"
              />
            </div>
          </div>

          <!-- Recent Tickets -->
          <div v-if="recentTickets.length" class="mt-8">
            <h2 class="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <svg class="w-5 h-5 text-surface-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              Recent Tickets
            </h2>
            <div class="grid gap-4">
              <TicketCard
                v-for="ticket in recentTickets"
                :key="ticket.id"
                :ticket="ticket"
                :is-active="false"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else-if="!pending && !filteredTickets?.length"
          title="No Tickets Found"
          :description="searchQuery || statusFilter ? 'No tickets match your current filters.' : 'You haven\'t issued any tickets yet.'"
        >
          <template #actions>
            <Button
              variant="primary"
              to="/queue"
              label="Get Your First Ticket"
              v-if="!searchQuery && !statusFilter"
            />
            <Button
              variant="secondary"
              @click="clearFilters"
              label="Clear Filters"
              v-else
            />
          </template>
        </EmptyState>

        <!-- Loading State -->
        <div v-else-if="pending" class="text-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-surface-600">Loading your tickets...</p>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import type { Ticket } from '~/types'

// Page meta
definePageMeta({
  layout: 'public'
})

// Reactive data
const searchQuery = ref('')
const statusFilter = ref('')
const refreshing = ref(false)

// Fetch tickets (this would need to be implemented based on your auth system)
const { data: tickets, pending, refresh } = await useFetch<Ticket[]>('/api/tickets/me', {
  // This might need authentication token or session handling
})

// Computed properties
const filteredTickets = computed(() => {
  if (!tickets.value) return []
  
  let filtered = tickets.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ticket => 
      ticket.queue_number.toLowerCase().includes(query) ||
      ticket.location_name?.toLowerCase().includes(query) ||
      ticket.counter_name?.toLowerCase().includes(query)
    )
  }
  
  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(ticket => ticket.status === statusFilter.value)
  }
  
  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const activeTickets = computed(() => {
  return filteredTickets.value.filter(ticket => 
    ['waiting', 'called', 'serving'].includes(ticket.status)
  )
})

const recentTickets = computed(() => {
  return filteredTickets.value.filter(ticket => 
    ['completed', 'cancelled'].includes(ticket.status)
  ).slice(0, 10) // Show last 10 recent tickets
})

// Methods
const refreshTickets = async () => {
  refreshing.value = true
  try {
    await refresh()
  } finally {
    refreshing.value = false
  }
}

const refreshTicket = async (ticketId: string) => {
  try {
    // Refresh individual ticket status
    await $fetch(`/api/tickets/${ticketId}/refresh`, { method: 'POST' })
    await refresh()
  } catch (error) {
    console.error('Failed to refresh ticket:', error)
  }
}

const cancelTicket = async (ticketId: string) => {
  try {
    await $fetch(`/api/tickets/${ticketId}/cancel`, { method: 'POST' })
    await refresh()
  } catch (error) {
    console.error('Failed to cancel ticket:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

// Auto-refresh active tickets every 30 seconds
const autoRefreshInterval = ref<NodeJS.Timeout>()

onMounted(() => {
  if (activeTickets.value.length > 0) {
    autoRefreshInterval.value = setInterval(refreshTickets, 30000)
  }
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})

// Watch for changes in active tickets to manage auto-refresh
watch(activeTickets, (newTickets, oldTickets) => {
  if (newTickets.length > 0 && !autoRefreshInterval.value) {
    autoRefreshInterval.value = setInterval(refreshTickets, 30000)
  } else if (newTickets.length === 0 && autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}, { immediate: false })

// SEO
useHead({
  title: 'My Tickets - Track Queue Status | Waitless',
  meta: [
    { name: 'description', content: 'Track your queue tickets and monitor your position in real-time. Get notified when it\'s your turn.' }
  ]
})
</script>