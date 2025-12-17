<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="$emit('click')"
  >
    <slot name="icon" v-if="$slots.icon && !loading" />
    
    <!-- Loading icon -->
    <svg
      v-if="loading"
      class="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    
    <span v-if="$slots.default" :class="{ 'sr-only': iconOnly }">
      <slot />
    </span>
    
    <slot name="icon-right" v-if="$slots['icon-right'] && !loading" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  iconOnly?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  iconOnly: false,
  rounded: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'transition-colors',
    'duration-200',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ]
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }
  
  // Special handling for icon-only buttons
  const iconOnlySizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  }
  
  // Variant classes
  const variantClasses = {
    primary: [
      'bg-blue-600',
      'text-white',
      'border-transparent',
      'hover:bg-blue-700',
      'focus:ring-blue-500'
    ],
    secondary: [
      'bg-white',
      'text-gray-700',
      'border',
      'border-gray-300',
      'hover:bg-gray-50',
      'focus:ring-blue-500'
    ],
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'border-none',
      'hover:bg-gray-50',
      'focus:ring-blue-500'
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'border-transparent',
      'hover:bg-red-700',
      'focus:ring-red-500'
    ],
    success: [
      'bg-green-600',
      'text-white',
      'border-transparent',
      'hover:bg-green-700',
      'focus:ring-green-500'
    ],
    warning: [
      'bg-yellow-600',
      'text-white',
      'border-transparent',
      'hover:bg-yellow-700',
      'focus:ring-yellow-500'
    ]
  }
  
  // Rounded classes
  const roundedClasses = props.rounded ? 'rounded-full' : 'rounded-lg'
  
  // Gap between icon and text
  const gapClasses = props.iconOnly ? '' : 'gap-2'
  
  return [
    ...baseClasses,
    props.iconOnly ? iconOnlySizes[props.size] : sizeClasses[props.size],
    ...variantClasses[props.variant],
    roundedClasses,
    gapClasses
  ]
})
</script>