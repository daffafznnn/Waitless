<script setup lang="ts">
interface Props {
  locationName: string
  counterName: string
  ticketNumber: string
  status: 'waiting' | 'serving' | 'completed' | 'on-hold'
  statusText: string
  queueInfo?: string
  takenAt: string
  actionText?: string
  actionType?: 'primary' | 'success' | 'default'
  highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  actionType: 'default'
})

const emit = defineEmits<{
  action: []
  detail: []
}>()

const ticketColorClass = {
  waiting: 'text-primary-600',
  serving: 'text-success-500',
  completed: 'text-surface-600',
  'on-hold': 'text-warning-500'
}

const queueBgClass = {
  waiting: 'bg-primary-50',
  serving: 'bg-success-50',
  completed: 'bg-surface-50',
  'on-hold': 'bg-warning-50'
}

const queueTextClass = {
  waiting: 'text-primary-600',
  serving: 'text-success-500',
  completed: 'text-surface-600',
  'on-hold': 'text-warning-500'
}

const actionBgClass = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  success: 'bg-success-500 hover:bg-success-600 text-white',
  default: 'bg-surface-50 hover:bg-surface-100 text-surface-700'
}
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-xs overflow-hidden"
    :class="highlight ? 'border-l-4 border-success-500' : ''"
  >
    <div class="p-4 space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-surface-900 truncate">
            {{ locationName }}
          </h3>
          <p class="text-sm text-surface-600 mt-0.5">
            {{ counterName }}
          </p>
        </div>
        <StatusBadge :status="status" :text="statusText" />
      </div>

      <!-- Ticket Number -->
      <div class="py-4 px-1 border border-surface-100 rounded-xl">
        <div class="text-center">
          <div
            class="text-3xl font-bold leading-none mb-1"
            :class="ticketColorClass[status]"
          >
            {{ ticketNumber }}
          </div>
          <div class="text-sm text-surface-600">
            Nomor Kamu
          </div>
        </div>
      </div>

      <!-- Queue Info -->
      <div
        v-if="queueInfo"
        class="px-3 py-3 rounded-xl flex items-center justify-center gap-2"
        :class="queueBgClass[status]"
      >
        <svg
          v-if="status === 'waiting'"
          class="w-4 h-4 flex-shrink-0"
          :class="queueTextClass[status]"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0ZM7.25 3.75V8C7.25 8.25 7.375 8.48438 7.58437 8.625L10.5844 10.625C10.9281 10.8562 11.3938 10.7625 11.625 10.4156C11.8562 10.0687 11.7625 9.60625 11.4156 9.375L8.75 7.6V3.75C8.75 3.33437 8.41562 3 8 3C7.58437 3 7.25 3.33437 7.25 3.75Z"/>
        </svg>
        <svg
          v-else-if="status === 'serving'"
          class="w-4 h-4 flex-shrink-0"
          :class="queueTextClass[status]"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 12.25C8.48325 12.25 8.875 11.8582 8.875 11.375C8.875 10.8918 8.48325 10.5 8 10.5C7.51675 10.5 7.125 10.8918 7.125 11.375C7.125 11.8582 7.51675 12.25 8 12.25Z"/>
          <path d="M8.24069 9.75H7.74069C7.53444 9.75 7.36569 9.58125 7.36569 9.375C7.36569 7.15625 9.78444 7.37812 9.78444 6.00625C9.78444 5.38125 9.22819 4.75 7.99069 4.75C7.08132 4.75 6.60632 5.05 6.14069 5.64687C6.01882 5.80312 5.79382 5.83438 5.63444 5.72188L5.22507 5.43437C5.05007 5.3125 5.00944 5.06562 5.14382 4.89687C5.80632 4.04687 6.59382 3.5 7.99382 3.5C9.62819 3.5 11.0376 4.43125 11.0376 6.00625C11.0376 8.11875 8.61882 7.99062 8.61882 9.375C8.61569 9.58125 8.44694 9.75 8.24069 9.75Z"/>
          <path d="M8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0Z"/>
        </svg>
        <span
          class="text-base font-medium"
          :class="queueTextClass[status]"
        >
          {{ queueInfo }}
        </span>
      </div>

      <!-- Taken At -->
      <div class="text-xs text-surface-500">
        Diambil: {{ takenAt }}
      </div>

      <!-- Action Button -->
      <button
        v-if="actionText"
        class="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="actionBgClass[actionType]"
        @click="emit('action')"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
