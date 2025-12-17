<template>
  <div class="flex gap-2 items-start w-full max-sm:flex-wrap">
    <UiActionButton
      v-for="button in buttons"
      :key="button.value || button.label"
      @click="$emit('update:modelValue', button.value); $emit('change', button.value)"
      :variant="modelValue === button.value ? 'primary' : 'ghost'"
      size="sm"
    >
      {{ button.label }}
    </UiActionButton>
  </div>
</template>

<script setup lang="ts">
interface ButtonOption {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  buttons: ButtonOption[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()
</script>