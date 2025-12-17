<template>
  <div class="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ title }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>