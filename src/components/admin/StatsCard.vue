<template>
  <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ displayValue }}</p>
        <p v-if="showTrend && trend !== undefined" class="text-sm mt-1" :class="trendColor">
          <span class="inline-flex items-center">
            <svg v-if="trend >= 0" class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
            <svg v-else class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
            {{ trendText }}
          </span>
        </p>
        <p v-else-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
      </div>
      <div class="p-3 rounded-xl" :class="iconBgColor">
        <svg class="w-6 h-6" :class="iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="icon === 'queue'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <path v-else-if="icon === 'users'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"/>
          <path v-else-if="icon === 'clock'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else-if="icon === 'check'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else-if="icon === 'pause'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else-if="icon === 'chart'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AdminStatsCard'
})
interface Props {
  title: string
  value: number | string
  subtitle?: string
  trend?: number
  showTrend?: boolean
  icon: 'queue' | 'users' | 'clock' | 'check' | 'pause' | 'chart' | string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  format?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  format: 'number',
  showTrend: false
})

// Format value display
const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(props.value)
    case 'percentage':
      return `${props.value}%`
    case 'number':
    default:
      return new Intl.NumberFormat('id-ID').format(props.value)
  }
})

// Color classes
const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100', 
    text: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600'  
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600'
  }
}

const iconBgColor = computed(() => colorClasses[props.color as keyof typeof colorClasses].bg)
const iconColor = computed(() => colorClasses[props.color as keyof typeof colorClasses].text)

// Trend calculations
const trendColor = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'text-green-600' : 'text-red-600'
})

const trendText = computed(() => {
  if (props.trend === undefined) return ''
  const sign = props.trend >= 0 ? '+' : ''
  return `${sign}${props.trend}%`
})
</script>