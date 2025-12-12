<!-- FILE: src/pages/owner/reports.vue -->
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-surface-200 pb-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-surface-900">Business Reports</h1>
          <p class="text-surface-600 mt-1">Analyze your queue performance and business insights</p>
        </div>
        <div class="flex gap-3">
          <Button
            variant="secondary"
            @click="exportReport"
            :loading="exporting"
            label="Export Report"
            icon="download"
          />
          <Button
            variant="primary"
            @click="refreshData"
            :loading="refreshing"
            label="Refresh"
          />
        </div>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">Date Range</label>
          <div class="flex gap-2">
            <input 
              v-model="filters.startDate"
              type="date"
              class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
            >
            <span class="self-center text-surface-500">to</span>
            <input 
              v-model="filters.endDate"
              type="date"
              class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
            >
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">Location</label>
          <select 
            v-model="filters.locationId"
            class="rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All Locations</option>
            <option 
              v-for="location in locations" 
              :key="location.id" 
              :value="location.id"
            >
              {{ location.name }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">Quick Ranges</label>
          <div class="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="setQuickRange('today')"
              label="Today"
            />
            <Button
              variant="secondary"
              size="sm"
              @click="setQuickRange('week')"
              label="This Week"
            />
            <Button
              variant="secondary"
              size="sm"
              @click="setQuickRange('month')"
              label="This Month"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Customers Served"
        :value="metrics?.totalServed || 0"
        icon="users"
        :trend="metrics?.servedTrend"
        :loading="metricsLoading"
      />
      <StatCard
        title="Average Wait Time"
        :value="`${metrics?.avgWaitTime || 0} min`"
        icon="clock"
        :trend="metrics?.waitTimeTrend"
        :loading="metricsLoading"
      />
      <StatCard
        title="Customer Satisfaction"
        :value="`${metrics?.satisfaction || 0}%`"
        icon="heart"
        :trend="metrics?.satisfactionTrend"
        :loading="metricsLoading"
      />
      <StatCard
        title="Peak Hours Efficiency"
        :value="`${metrics?.peakEfficiency || 0}%`"
        icon="trending-up"
        :trend="metrics?.efficiencyTrend"
        :loading="metricsLoading"
      />
    </div>

    <!-- Charts and Analytics -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Queue Volume Chart -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-surface-900">Queue Volume Trends</h3>
          <select 
            v-model="chartTimeframe"
            class="text-sm rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        
        <div v-if="chartData?.queueVolume" class="h-80">
          <!-- Chart component would go here -->
          <div class="h-full bg-surface-50 rounded-lg flex items-center justify-center text-surface-500">
            Queue Volume Chart
            <br>
            <small>{{ chartData.queueVolume.length }} data points</small>
          </div>
        </div>
        <div v-else class="h-80 bg-surface-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="mt-2 text-sm text-surface-500">No chart data available</p>
          </div>
        </div>
      </div>

      <!-- Wait Time Distribution -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-surface-900 mb-4">Wait Time Distribution</h3>
        <div v-if="chartData?.waitTimeDistribution" class="h-80">
          <!-- Chart component would go here -->
          <div class="h-full bg-surface-50 rounded-lg flex items-center justify-center text-surface-500">
            Wait Time Distribution Chart
          </div>
        </div>
        <div v-else class="h-80 bg-surface-50 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p class="mt-2 text-sm text-surface-500">No distribution data available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance by Location -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b border-surface-200">
        <h3 class="text-lg font-semibold text-surface-900">Performance by Location</h3>
      </div>
      
      <DataTable
        :columns="locationColumns"
        :data="locationPerformance"
        :loading="performanceLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #empty>
          <EmptyState
            title="No Location Data"
            description="No performance data available for the selected date range."
          />
        </template>
      </DataTable>
    </div>

    <!-- Customer Feedback Summary -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-surface-900 mb-4">Customer Feedback Summary</h3>
      
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Rating Distribution -->
        <div>
          <h4 class="font-medium text-surface-900 mb-3">Rating Distribution</h4>
          <div class="space-y-2">
            <div v-for="(rating, index) in feedbackSummary?.ratings || []" :key="index" class="flex items-center">
              <span class="w-8 text-sm text-surface-600">{{ 5 - index }}★</span>
              <div class="flex-1 mx-3 bg-surface-200 rounded-full h-2">
                <div 
                  class="bg-primary-600 h-2 rounded-full" 
                  :style="{ width: `${(rating.count / (feedbackSummary?.totalRatings || 1)) * 100}%` }"
                ></div>
              </div>
              <span class="text-sm text-surface-600 w-8">{{ rating.count }}</span>
            </div>
          </div>
        </div>
        
        <!-- Common Complaints -->
        <div>
          <h4 class="font-medium text-surface-900 mb-3">Common Issues</h4>
          <div class="space-y-2">
            <div 
              v-for="issue in feedbackSummary?.commonIssues || []" 
              :key="issue.type"
              class="flex justify-between text-sm"
            >
              <span class="text-surface-600">{{ issue.type }}</span>
              <span class="font-medium text-surface-900">{{ issue.count }}</span>
            </div>
          </div>
        </div>
        
        <!-- Positive Feedback -->
        <div>
          <h4 class="font-medium text-surface-900 mb-3">Positive Highlights</h4>
          <div class="space-y-2">
            <div 
              v-for="highlight in feedbackSummary?.positiveHighlights || []" 
              :key="highlight.type"
              class="flex justify-between text-sm"
            >
              <span class="text-surface-600">{{ highlight.type }}</span>
              <span class="font-medium text-success-600">{{ highlight.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Location, BusinessMetrics, ChartData, LocationPerformance, FeedbackSummary } from '~/types'

// Page meta
definePageMeta({
  layout: 'owner',
  middleware: ['auth', 'owner']
})

// Reactive data
const refreshing = ref(false)
const exporting = ref(false)
const chartTimeframe = ref('daily')

// Filters
const filters = reactive({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
  endDate: new Date().toISOString().split('T')[0], // Today
  locationId: ''
})

// Pagination
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// Fetch data
const { data: locations } = await useFetch<Location[]>('/api/owner/locations')
const { data: metrics, pending: metricsLoading } = await useFetch<BusinessMetrics>('/api/owner/reports/metrics', {
  query: computed(() => filters)
})
const { data: chartData } = await useFetch<ChartData>('/api/owner/reports/charts', {
  query: computed(() => ({ ...filters, timeframe: chartTimeframe.value }))
})
const { data: locationPerformance, pending: performanceLoading } = await useFetch<LocationPerformance[]>('/api/owner/reports/locations', {
  query: computed(() => ({ ...filters, ...pagination }))
})
const { data: feedbackSummary } = await useFetch<FeedbackSummary>('/api/owner/reports/feedback', {
  query: computed(() => filters)
})

// Table columns
const locationColumns = [
  { key: 'name', label: 'Location', sortable: true },
  { key: 'total_served', label: 'Customers Served', sortable: true },
  { key: 'avg_wait_time', label: 'Avg Wait Time', sortable: true, component: 'Duration' },
  { key: 'satisfaction_score', label: 'Satisfaction', sortable: true, component: 'Percentage' },
  { key: 'efficiency_score', label: 'Efficiency', sortable: true, component: 'Percentage' },
  { key: 'revenue', label: 'Revenue Impact', sortable: true, component: 'Currency' }
]

// Methods
const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      $fetch('/api/owner/reports/metrics', { query: filters }),
      $fetch('/api/owner/reports/charts', { query: { ...filters, timeframe: chartTimeframe.value } }),
      $fetch('/api/owner/reports/locations', { query: { ...filters, ...pagination } }),
      $fetch('/api/owner/reports/feedback', { query: filters })
    ])
  } finally {
    refreshing.value = false
  }
}

const exportReport = async () => {
  exporting.value = true
  try {
    const response = await $fetch('/api/owner/reports/export', {
      method: 'POST',
      body: filters,
      responseType: 'blob'
    })
    
    // Download the file
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = `waitless-report-${filters.startDate}-to-${filters.endDate}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export report:', error)
  } finally {
    exporting.value = false
  }
}

const setQuickRange = (range: string) => {
  const today = new Date()
  const startDate = new Date()
  
  switch (range) {
    case 'today':
      filters.startDate = today.toISOString().split('T')[0]
      filters.endDate = today.toISOString().split('T')[0]
      break
    case 'week':
      startDate.setDate(today.getDate() - 7)
      filters.startDate = startDate.toISOString().split('T')[0]
      filters.endDate = today.toISOString().split('T')[0]
      break
    case 'month':
      startDate.setMonth(today.getMonth() - 1)
      filters.startDate = startDate.toISOString().split('T')[0]
      filters.endDate = today.toISOString().split('T')[0]
      break
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

// Watch filters and refresh data
watch([filters, chartTimeframe], () => {
  refreshData()
}, { deep: true })

// SEO
useHead({
  title: 'Business Reports - Owner Dashboard - Waitless',
  meta: [
    { name: 'description', content: 'Comprehensive business reports and analytics for queue management performance.' }
  ]
})
</script>