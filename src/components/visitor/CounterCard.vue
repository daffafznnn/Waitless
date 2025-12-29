<script setup lang="ts">
interface Props {
  name: string
  hours: string
  queueInfo: string
  status: 'active' | 'closed'
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  takeNumber: []
}>()
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-xs p-4 space-y-3 transition-opacity"
    :class="disabled ? 'opacity-75' : ''"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-semibold text-surface-900 mb-1">
          {{ name }}
        </h3>
        <p class="text-sm text-surface-500">
          {{ hours }}
        </p>
        <p class="text-sm text-surface-600 mt-2">
          {{ queueInfo }}
        </p>
      </div>

      <StatusBadge
        :status="status === 'active' ? 'active' : 'closed'"
        :text="status === 'active' ? 'Aktif' : 'Tutup'"
      />
    </div>

    <!-- Action Button -->
    <button
      v-if="!disabled"
      class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-full transition-colors"
      @click="emit('takeNumber')"
    >
      Ambil Nomor
    </button>
    <button
      v-else
      class="w-full py-2.5 bg-surface-300 text-surface-500 text-sm font-medium rounded-full cursor-not-allowed"
      disabled
    >
      Loket Tutup
    </button>
  </div>
</template>
