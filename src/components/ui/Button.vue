<!-- FILE: src/components/ui/Button.vue -->
<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="htmlType"
    v-bind="linkAttrs"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <div v-if="loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
    
    <!-- Left icon -->
    <component 
      v-if="icon && iconPosition === 'left' && !loading"
      :is="iconComponent"
      class="w-4 h-4"
      :class="{ 'mr-2': $slots.default || label }"
    />
    
    <!-- Button content -->
    <span v-if="$slots.default || label">
      <slot>{{ label }}</slot>
    </span>
    
    <!-- Right icon -->
    <component 
      v-if="icon && iconPosition === 'right' && !loading"
      :is="iconComponent"
      class="w-4 h-4"
      :class="{ 'ml-2': $slots.default || label }"
    />
  </component>
</template>

<script setup lang="ts">
import type { ButtonProps } from '~/types'

interface Props extends ButtonProps {
  label?: string
  htmlType?: 'button' | 'submit' | 'reset'
  to?: string
  href?: string
  target?: string
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  htmlType: 'button',
  tag: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Compute component tag
const tag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'
  return props.tag
})

// Compute link attributes
const linkAttrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: props.target }
  return {}
})

// Compute icon component
const iconComponent = computed(() => {
  if (!props.icon) return null
  
  // Try to resolve Heroicons first
  try {
    const heroIcon = resolveComponent(`${props.icon}Icon`)
    return heroIcon
  } catch {
    // Fallback to string (for custom icons)
    return props.icon
  }
})

// Button classes
const buttonClasses = computed(() => {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-colors duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none'
  ]

  // Size variants
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
    xl: 'px-6 py-3 text-base'
  }

  // Color variants
  const variantClasses = {
    primary: [
      'bg-primary-600 text-white',
      'hover:bg-primary-700 active:bg-primary-800',
      'focus:ring-primary-500',
      'border border-transparent'
    ],
    secondary: [
      'bg-white text-surface-900 border border-surface-300',
      'hover:bg-surface-50 active:bg-surface-100',
      'focus:ring-primary-500'
    ],
    success: [
      'bg-success-600 text-white',
      'hover:bg-success-700 active:bg-success-800', 
      'focus:ring-success-500',
      'border border-transparent'
    ],
    warning: [
      'bg-warning-600 text-white',
      'hover:bg-warning-700 active:bg-warning-800',
      'focus:ring-warning-500',
      'border border-transparent'
    ],
    danger: [
      'bg-danger-600 text-white',
      'hover:bg-danger-700 active:bg-danger-800',
      'focus:ring-danger-500',
      'border border-transparent'
    ],
    ghost: [
      'bg-transparent text-surface-700',
      'hover:bg-surface-100 active:bg-surface-200',
      'focus:ring-primary-500',
      'border border-transparent'
    ]
  }

  return [
    ...base,
    sizeClasses[props.size],
    ...variantClasses[props.variant]
  ]
})

// Handle click events
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  
  emit('click', event)
}
</script>