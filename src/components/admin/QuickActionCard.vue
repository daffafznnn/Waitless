<template>
  <component
    :is="to ? 'NuxtLink' : 'button'"
    :to="to"
    @click="!to && $emit('click')"
    :class="[
      'flex items-center justify-center gap-3 p-4 text-white rounded-lg transition-colors',
      colorClasses,
      'hover:opacity-90'
    ]"
  >
    <component :is="iconComponent" v-if="iconComponent" class="w-5 h-5" />
    <slot name="icon" v-else-if="$slots.icon" />
    
    <span class="font-medium">{{ label }}</span>
  </component>
</template>

<script setup lang="ts">
interface Props {
  label: string
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  icon?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue'
})

const emit = defineEmits<{
  click: []
}>()

const colorClasses = computed(() => {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-600 hover:bg-red-700'
  }
  
  return colors[props.color]
})

const iconComponent = computed(() => {
  if (!props.icon) return null
  
  // Map icon names to components or return null for custom icons
  const iconMap: Record<string, any> = {
    // Add your icon mappings here if using a specific icon library
  }
  
  return iconMap[props.icon] || null
})
</script>