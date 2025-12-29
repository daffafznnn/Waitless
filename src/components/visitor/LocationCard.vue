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
}

const props = withDefaults(defineProps<Props>(), {
  actionType: 'primary'
})

const emit = defineEmits<{
  action: [id: string]
}>()
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xs p-4 flex flex-col gap-3">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h3 class="text-base font-semibold text-surface-900 line-clamp-1">
        {{ name }}
      </h3>
      <p class="text-sm text-surface-600">
        {{ address }}
      </p>
      <StatusBadge :status="status" :text="statusText" />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-surface-600">
        {{ queueInfo }}
      </span>
      <button
        v-if="actionType === 'primary'"
        class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
        @click="emit('action', id)"
      >
        {{ actionText }}
      </button>
      <button
        v-else-if="actionType === 'secondary'"
        class="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
        @click="emit('action', id)"
      >
        {{ actionText }}
      </button>
      <button
        v-else
        class="px-4 py-1.5 bg-surface-200 text-surface-500 text-sm font-medium rounded-lg cursor-not-allowed whitespace-nowrap"
        disabled
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>
