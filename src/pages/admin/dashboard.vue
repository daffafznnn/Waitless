<!-- FILE: src/pages/admin/dashboard.vue -->
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-surface-200 pb-4">
      <h1 class="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
      <p class="text-surface-600 mt-1">Manage your queue system and monitor real-time statistics</p>
    </div>

    <!-- Enhanced Stats Cards -->
    <AdminStatsCards 
      :stats="{
        totalQueues: stats?.totalQueues || 0,
        activeUsers: stats?.activeUsers || 0,
        avgWaitTime: `${stats?.avgWaitTime || 0} min`,
        totalLocations: stats?.totalLocations || 0,
        queuesTrend: 12,
        usersTrend: 8,
        waitTimeTrend: -3,
        locationsTrend: 2
      }"
    />

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="primary"
          size="lg"
          to="/admin/queue"
          label="Manage Queue"
          icon="queue-list"
        />
        <Button
          variant="success"
          size="lg"
          @click="openCallNext"
          label="Call Next"
          icon="megaphone"
        />
        <Button
          variant="warning"
          size="lg"
          @click="openCounterSettings"
          label="Counter Settings"
          icon="cog"
        />
        <Button
          variant="secondary"
          size="lg"
          to="/admin/reports"
          label="View Reports"
          icon="chart"
        />
      </div>
    </div>

    <!-- Real-time Queue Status -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Active Queues with DataTable -->
      <div class="lg:col-span-2">
        <AdminDataTable
          title="Active Queues"
          :data="activeQueues || []"
          :columns="[
            { key: 'counter_name', label: 'Counter', type: 'text' },
            { key: 'location_name', label: 'Location', type: 'text' },
            { key: 'current_number', label: 'Current #', type: 'text' },
            { key: 'waiting_count', label: 'Waiting', type: 'text' },
            { key: 'status', label: 'Status', type: 'badge' }
          ]"
          :page-size="10"
          :show-actions="false"
          action-text="Add Queue"
          empty-message="No active queues at the moment."
          @view-item="viewQueue"
          @edit-item="editQueue"
        >
          <template #cell-current_number="{ value }">
            <div class="text-lg font-bold text-blue-600">
              #{{ value || 'None' }}
            </div>
          </template>
          
          <template #cell-waiting_count="{ value }">
            <span class="text-sm text-gray-600">
              {{ value || 0 }} waiting
            </span>
          </template>
          
          <template #row-actions="{ item }">
            <div class="flex items-center space-x-2">
              <button
                @click="callNext(item.counter_id)"
                :disabled="!item.waiting_count"
                class="text-blue-600 hover:text-blue-900 disabled:text-gray-400 text-sm font-medium"
                title="Call Next"
              >
                Call Next
              </button>
              <button
                @click="manageQueue(item)"
                class="text-gray-600 hover:text-gray-900 text-sm font-medium"
                title="Manage Queue"
              >
                Manage
              </button>
            </div>
          </template>
        </AdminDataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QueueStats, ActiveQueue, Counter, Activity } from '~/types'

// Page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive data
const refreshing = ref(false)
const autoRefresh = ref(true)
const autoRefreshInterval = ref<NodeJS.Timeout>()

// Fetch dashboard data
const { data: stats, pending: statsLoading } = await useFetch<QueueStats>('/api/admin/dashboard/stats')
const { data: activeQueues, pending: queuesLoading, refresh: refreshQueuesData } = await useFetch<ActiveQueue[]>('/api/admin/dashboard/active-queues')
const { data: counters, pending: countersLoading } = await useFetch<Counter[]>('/api/admin/counters')
const { data: recentActivity } = await useFetch<Activity[]>('/api/admin/dashboard/recent-activity')

// Methods
const refreshQueues = async () => {
  refreshing.value = true
  try {
    await refreshQueuesData()
  } finally {
    refreshing.value = false
  }
}

const callNext = async (counterId: string) => {
  try {
    await $fetch(`/api/admin/counters/${counterId}/call-next`, { method: 'POST' })
    await refreshQueues()
    // Show success notification
  } catch (error) {
    console.error('Failed to call next:', error)
    // Show error notification
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
  autoRefreshInterval.value = setInterval(refreshQueues, 10000) // Every 10 seconds
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

const openCallNext = () => {
  // Open modal or navigate to call next page
}

const openCounterSettings = () => {
  // Open counter settings modal or navigate
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// New methods for enhanced components
const viewQueue = (queue: any) => {
  navigateTo(`/admin/queues/${queue.id}`)
}

const editQueue = (queue: any) => {
  navigateTo(`/admin/queues/${queue.id}/edit`)
}

const manageQueue = (queue: any) => {
  navigateTo(`/admin/queues?counter=${queue.counter_id}`)
}

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
  title: 'Admin Dashboard - Waitless',
  meta: [
    { name: 'description', content: 'Admin dashboard for managing queue system and monitoring real-time statistics.' }
  ]
})
</script>