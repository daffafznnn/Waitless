<script setup lang="ts">
interface Props {
  status: 'open' | 'closed' | 'active' | 'waiting' | 'serving' | 'completed' | 'on-hold'
  text?: string
  showDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDot: true
})

const statusConfig = {
  open: {
    bg: 'bg-success-50',
    text: 'text-success-500',
    dot: 'bg-success-500'
  },
  closed: {
    bg: 'bg-warning-50',
    text: 'text-warning-500',
    dot: 'bg-warning-500'
  },
  active: {
    bg: 'bg-success-50',
    text: 'text-success-500',
    dot: 'bg-success-500'
  },
  waiting: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    dot: 'bg-primary-600'
  },
  serving: {
    bg: 'bg-success-50',
    text: 'text-success-500',
    dot: 'bg-success-500'
  },
  completed: {
    bg: 'bg-surface-100',
    text: 'text-surface-600',
    dot: 'bg-surface-600'
  },
  'on-hold': {
    bg: 'bg-warning-50',
    text: 'text-warning-500',
    dot: 'bg-warning-500'
  }
}

const config = statusConfig[props.status]
</script>

<template>
  <span 
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="config.bg"
  >
    <span 
      v-if="showDot" 
      class="w-2 h-2 rounded-full"
      :class="config.dot"
    />
    <span :class="config.text">
      {{ text }}
    </span>
  </span>
</template>
