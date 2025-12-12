<!-- FILE: src/components/ui/StatusBadge.vue -->
<template>
  <span :class="badgeClasses">
    <!-- Status dot -->
    <span 
      v-if="showDot"
      :class="dotClasses"
      class="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
    ></span>
    
    <!-- Status text -->
    <span class="truncate">{{ displayText }}</span>
  </span>
</template>

<script setup lang="ts">
import type { StatusBadgeProps, TicketStatus } from '~/types'

interface Props extends StatusBadgeProps {
  status: TicketStatus | 'online' | 'offline' | 'active' | 'inactive'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDot: true
})

// Status configuration
const statusConfig = {
  // Ticket statuses
  WAITING: { 
    label: 'Waiting', 
    color: 'warning',
    dotColor: 'bg-warning-400'
  },
  CALLING: { 
    label: 'Calling', 
    color: 'info',
    dotColor: 'bg-primary-400 animate-pulse'
  },
  SERVING: { 
    label: 'In Service', 
    color: 'primary',
    dotColor: 'bg-primary-400'
  },
  HOLD: { 
    label: 'On Hold', 
    color: 'warning',
    dotColor: 'bg-warning-400'
  },
  DONE: { 
    label: 'Completed', 
    color: 'success',
    dotColor: 'bg-success-400'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'danger',
    dotColor: 'bg-danger-400'
  },
  EXPIRED: { 
    label: 'Expired', 
    color: 'neutral',
    dotColor: 'bg-surface-400'
  },
  
  // General statuses
  online: { 
    label: 'Online', 
    color: 'success',
    dotColor: 'bg-success-400'
  },
  offline: { 
    label: 'Offline', 
    color: 'neutral',
    dotColor: 'bg-surface-400'
  },
  active: { 
    label: 'Active', 
    color: 'success',
    dotColor: 'bg-success-400'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'neutral',
    dotColor: 'bg-surface-400'
  }
}

// Compute display text
const displayText = computed(() => {
  return statusConfig[props.status]?.label || props.status
})

// Compute badge classes
const badgeClasses = computed(() => {
  const config = statusConfig[props.status]
  if (!config) return ['badge', 'badge-neutral']

  const base = ['inline-flex items-center font-medium rounded-full']
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm', 
    lg: 'px-3 py-1 text-sm'
  }

  // Color classes
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800', 
    danger: 'bg-danger-100 text-danger-800',
    info: 'bg-primary-100 text-primary-800',
    neutral: 'bg-surface-100 text-surface-800'
  }

  return [
    ...base,
    sizeClasses[props.size],
    colorClasses[config.color] || colorClasses.neutral
  ]
})

// Compute dot classes
const dotClasses = computed(() => {
  const config = statusConfig[props.status]
  return config?.dotColor || 'bg-surface-400'
})
</script>