<!-- FILE: src/components/common/EmptyState.vue -->
<template>
  <div class="text-center py-12">
    <!-- Icon -->
    <div v-if="icon" class="mx-auto w-12 h-12 text-surface-400 mb-4">
      <component 
        :is="iconComponent" 
        class="w-12 h-12"
      />
    </div>
    
    <!-- Default icon if none provided -->
    <div v-else class="mx-auto w-12 h-12 text-surface-400 mb-4">
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    
    <!-- Title -->
    <h3 class="text-lg font-medium text-surface-900 mb-2">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p class="text-sm text-surface-600 max-w-md mx-auto mb-6">
      {{ description }}
    </p>
    
    <!-- Action button -->
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon?: string
}

const props = defineProps<Props>()

// Compute icon component
const iconComponent = computed(() => {
  if (!props.icon) return null
  
  try {
    return resolveComponent(`${props.icon}Icon`)
  } catch {
    return props.icon
  }
})
</script>