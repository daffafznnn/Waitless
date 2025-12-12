<!-- FILE: src/components/ui/StatCard.vue -->
<template>
  <div :class="cardClasses">
    <div class="p-6">
      <div class="flex items-center">
        <!-- Icon -->
        <div v-if="icon" :class="iconContainerClasses">
          <component 
            :is="iconComponent"
            :class="iconClasses"
          />
        </div>
        
        <!-- Content -->
        <div class="flex-1" :class="{ 'ml-4': icon }">
          <div class="flex items-baseline justify-between">
            <div>
              <p class="text-sm font-medium text-surface-600 truncate">
                {{ title }}
              </p>
              <p :class="valueClasses">
                {{ formattedValue }}
              </p>
            </div>
            
            <!-- Change indicator -->
            <div v-if="change" class="flex items-center ml-4">
              <component 
                :is="changeIcon"
                :class="changeIconClasses"
                class="w-4 h-4 mr-1"
              />
              <span :class="changeTextClasses">
                {{ Math.abs(change.value) }}%
              </span>
            </div>
          </div>
          
          <!-- Change description -->
          <p v-if="change?.period" class="text-xs text-surface-500 mt-1">
            {{ changeDescription }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Loading overlay -->
    <div 
      v-if="loading"
      class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl"
    >
      <div class="w-6 h-6 border-2 border-surface-300 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatCardProps } from '~/types'
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon 
} from '@heroicons/vue/20/solid'

interface Props extends StatCardProps {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  loading: false
})

// Compute icon component
const iconComponent = computed(() => {
  if (!props.icon) return null
  
  try {
    return resolveComponent(`${props.icon}Icon`)
  } catch {
    return props.icon
  }
})

// Format value
const formattedValue = computed(() => {
  const value = props.value
  
  if (typeof value === 'number') {
    // Format large numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString()
  }
  
  return value
})

// Change icon
const changeIcon = computed(() => {
  if (!props.change) return null
  
  switch (props.change.type) {
    case 'increase':
      return ArrowUpIcon
    case 'decrease':
      return ArrowDownIcon
    default:
      return MinusIcon
  }
})

// Change description
const changeDescription = computed(() => {
  if (!props.change) return ''
  
  const type = props.change.type === 'increase' ? 'increase' : 
               props.change.type === 'decrease' ? 'decrease' : 'no change'
  
  return `${type} from ${props.change.period}`
})

// Component classes
const cardClasses = computed(() => [
  'relative',
  'bg-white rounded-xl shadow-sm border border-surface-200',
  'hover:shadow-md transition-shadow duration-200',
  'overflow-hidden'
])

const iconContainerClasses = computed(() => {
  const colorClasses = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    danger: 'bg-danger-100'
  }
  
  return [
    'flex-shrink-0 p-3 rounded-lg',
    colorClasses[props.color]
  ]
})

const iconClasses = computed(() => {
  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-600', 
    warning: 'text-warning-600',
    danger: 'text-danger-600'
  }
  
  return [
    'w-6 h-6',
    colorClasses[props.color]
  ]
})

const valueClasses = computed(() => [
  'text-2xl font-semibold text-surface-900 mt-1'
])

const changeIconClasses = computed(() => {
  if (!props.change) return []
  
  const colorClasses = {
    increase: 'text-success-600',
    decrease: 'text-danger-600',
    neutral: 'text-surface-500'
  }
  
  return [colorClasses[props.change.type]]
})

const changeTextClasses = computed(() => {
  if (!props.change) return []
  
  const colorClasses = {
    increase: 'text-success-900',
    decrease: 'text-danger-900', 
    neutral: 'text-surface-500'
  }
  
  return [
    'text-sm font-medium',
    colorClasses[props.change.type]
  ]
})
</script>