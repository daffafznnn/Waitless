<script setup lang="ts">
interface Props {
  id: string
  name: string
  address: string
  status: 'open' | 'closed'
  statusText: string
  queueInfo: string
  actionText: string
  actionType?: 'primary' | 'secondary' | 'disabled'
  totalWaiting?: number
}

const props = withDefaults(defineProps<Props>(), {
  actionType: 'primary',
  totalWaiting: 0
})

const emit = defineEmits<{
  action: [id: string]
}>()
</script>

<template>
  <div 
    class="bg-white rounded-2xl shadow-sm hover:shadow-md p-4 flex flex-col gap-3 transition-all duration-300 ease-out hover:-translate-y-0.5 cursor-pointer group"
    @click="props.actionType !== 'disabled' && emit('action', id)"
  >
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-semibold text-surface-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {{ name }}
        </h3>
        <!-- Queue Count Badge -->
        <div 
          v-if="status === 'open' && totalWaiting !== undefined"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 transition-all duration-300"
          :class="totalWaiting > 0 
            ? 'bg-warning-100 text-warning-700' 
            : 'bg-success-100 text-success-700'"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
          </svg>
          <span>{{ totalWaiting }}</span>
        </div>
      </div>
      
      <p class="text-sm text-surface-500 line-clamp-1">
        {{ address }}
      </p>
      
      <StatusBadge :status="status" :text="statusText" />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-4 pt-1 border-t border-surface-100">
      <span class="text-sm text-surface-600 truncate">
        {{ queueInfo }}
      </span>
      
      <button
        v-if="actionType === 'primary'"
        class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow"
        @click.stop="emit('action', id)"
      >
        {{ actionText }}
      </button>
      
      <button
        v-else-if="actionType === 'secondary'"
        class="px-4 py-1.5 bg-surface-100 text-surface-700 text-sm font-medium rounded-lg hover:bg-surface-200 active:scale-95 transition-all duration-200 whitespace-nowrap"
        @click.stop="emit('action', id)"
      >
        {{ actionText }}
      </button>
      
      <button
        v-else
        class="px-4 py-1.5 bg-surface-200 text-surface-400 text-sm font-medium rounded-lg cursor-not-allowed whitespace-nowrap"
        disabled
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
