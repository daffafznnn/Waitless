<template>
  <div class="flex flex-col gap-4 p-6 rounded-2xl border border-surface-200 border-solid shadow-sm w-full">
    <div class="flex justify-between items-center h-7 w-full">
      <div class="text-lg font-semibold leading-7 text-gray-900">
        {{ title }}
      </div>
      <UiActionButton
        @click="$emit('reset')"
        variant="ghost"
        size="sm"
      >
        Reset Filter
      </UiActionButton>
    </div>
    
    <div class="flex gap-4 justify-start items-start w-full max-md:flex-wrap max-sm:flex-col">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()

const emit = defineEmits<{
  reset: []
}>()
</script>