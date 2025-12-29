<script setup lang="ts">
import { ref } from 'vue'

interface Category {
  id: string
  label: string
}

interface Props {
  categories?: Category[]
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [
    { id: 'all', label: 'Semua' },
    { id: 'umkm', label: 'UMKM' },
    { id: 'clinic', label: 'Klinik' },
    { id: 'barbershop', label: 'Barbershop' },
    { id: 'perfume', label: 'Parfum' },
    { id: 'favorites', label: 'Favorit saya' }
  ]
})

const emit = defineEmits<{
  change: [categoryId: string]
}>()

const activeCategory = ref('all')

const selectCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  emit('change', categoryId)
}
</script>

<template>
  <div class="overflow-x-auto scrollbar-hide -mx-4 px-4">
    <div class="flex items-center gap-3 pb-2">
      <button
        v-for="category in categories"
        :key="category.id"
        class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
        :class="
          activeCategory === category.id
            ? 'bg-primary-50 text-primary-600'
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
        "
        @click="selectCategory(category.id)"
      >
        {{ category.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
