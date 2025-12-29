<script setup lang="ts">
interface Props {
  location: string
  subtitle?: string
}

defineProps<Props>()

const emit = defineEmits<{
  change: []
}>()
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xs p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-2 flex-1 min-w-0">
        <!-- Location Icon -->
        <svg
          class="w-[11px] h-3.5 mt-0.5 flex-shrink-0 text-primary-600"
          viewBox="0 0 11 14"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.89805 13.65C7.30078 11.8945 10.5 7.63984 10.5 5.25C10.5 2.35156 8.14844 0 5.25 0C2.35156 0 0 2.35156 0 5.25C0 7.63984 3.19922 11.8945 4.60195 13.65C4.93828 14.0684 5.56172 14.0684 5.89805 13.65ZM5.25 3.5C5.71413 3.5 6.15925 3.68437 6.48744 4.01256C6.81563 4.34075 7 4.78587 7 5.25C7 5.71413 6.81563 6.15925 6.48744 6.48744C6.15925 6.81563 5.71413 7 5.25 7C4.78587 7 4.34075 6.81563 4.01256 6.48744C3.68437 6.15925 3.5 5.71413 3.5 5.25C3.5 4.78587 3.68437 4.34075 4.01256 4.01256C4.34075 3.68437 4.78587 3.5 5.25 3.5Z"/>
        </svg>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-900 leading-5">
            Lokasi kamu: {{ location }}
          </p>
          <p v-if="subtitle" class="text-xs text-surface-500 mt-1">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <button
        class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
        @click="emit('change')"
      >
        Ubah
      </button>
    </div>
  </div>
</template>
