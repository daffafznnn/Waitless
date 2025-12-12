<template>
  <div class="bg-white overflow-hidden shadow rounded-lg">
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div 
            class="w-8 h-8 rounded-md flex items-center justify-center"
            :class="iconBgClass"
          >
            <component :is="iconComponent" class="w-5 h-5" :class="iconClass" />
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">{{ title }}</dt>
            <dd>
              <div class="text-lg font-medium text-gray-900">{{ formattedValue }}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div v-if="showTrend" class="bg-gray-50 px-5 py-3">
      <div class="text-sm">
        <span 
          class="font-medium"
          :class="trendClass"
        >
          {{ trendIcon }} {{ Math.abs(trendValue) }}{{ trendUnit }}
        </span>
        <span class="text-gray-500 ml-2">{{ trendLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number | string
  trend?: number
  trendLabel?: string
  trendUnit?: string
  icon?: 'users' | 'queue' | 'time' | 'location' | 'chart' | 'alert'
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  showTrend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trendLabel: 'vs last period',
  trendUnit: '%',
  icon: 'chart',
  variant: 'primary',
  showTrend: true
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value > 999999) {
      return (props.value / 1000000).toFixed(1) + 'M'
    } else if (props.value > 999) {
      return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value.toLocaleString()
  }
  return props.value
})

const trendValue = computed(() => props.trend || 0)

const trendClass = computed(() => {
  if (trendValue.value > 0) return 'text-green-600'
  if (trendValue.value < 0) return 'text-red-600'
  return 'text-gray-600'
})

const trendIcon = computed(() => {
  if (trendValue.value > 0) return '↗'
  if (trendValue.value < 0) return '↘'
  return '→'
})

const iconBgClass = computed(() => {
  const classes = {
    primary: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100',
    info: 'bg-cyan-100'
  }
  return classes[props.variant]
})

const iconClass = computed(() => {
  const classes = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-cyan-600'
  }
  return classes[props.variant]
})

const iconComponent = computed(() => {
  const icons = {
    users: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
      })
    ]),
    queue: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
      })
    ]),
    time: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ]),
    location: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      }),
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'
      })
    ]),
    chart: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      })
    ]),
    alert: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
      })
    ])
  }
  return icons[props.icon]
})
</script>