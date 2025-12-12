<template>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Total Queues -->
    <StatsCard
      title="Total Queues"
      :value="stats.totalQueues"
      icon="queue"
      variant="primary"
      :trend="stats.queuesTrend"
      trend-label="from yesterday"
    />

    <!-- Active Users -->
    <StatsCard
      title="Active Users"
      :value="stats.activeUsers"
      icon="users"
      variant="success"
      :trend="stats.usersTrend"
      trend-label="from yesterday"
    />

    <!-- Average Wait Time -->
    <StatsCard
      title="Avg Wait Time"
      :value="stats.avgWaitTime"
      icon="time"
      variant="warning"
      :trend="stats.waitTimeTrend"
      trend-label="from yesterday"
      trend-unit="min"
    />

    <!-- Total Locations -->
    <StatsCard
      title="Total Locations"
      :value="stats.totalLocations"
      icon="location"
      variant="info"
      :trend="stats.locationsTrend"
      trend-label="from yesterday"
    />
  </div>
</template>

<script setup lang="ts">
interface StatsData {
  totalQueues: number
  activeUsers: number
  avgWaitTime: string
  totalLocations: number
  queuesTrend: number
  usersTrend: number
  waitTimeTrend: number
  locationsTrend: number
}

const props = withDefaults(defineProps<{
  stats?: StatsData
}>(), {
  stats: () => ({
    totalQueues: 0,
    activeUsers: 0,
    avgWaitTime: '0 min',
    totalLocations: 0,
    queuesTrend: 0,
    usersTrend: 0,
    waitTimeTrend: 0,
    locationsTrend: 0
  })
})
</script>