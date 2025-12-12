<!-- FILE: src/components/ui/DataTable.vue -->
<template>
  <div class="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
    <!-- Table header -->
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-surface-200 bg-surface-50">
      <div class="flex items-center justify-between">
        <div v-if="title">
          <h3 class="text-lg font-medium text-surface-900">{{ title }}</h3>
          <p v-if="description" class="text-sm text-surface-600 mt-1">{{ description }}</p>
        </div>
        <slot name="header" />
      </div>
    </div>

    <!-- Table container -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-surface-200">
        <!-- Table head -->
        <thead class="bg-surface-50">
          <tr>
            <!-- Selection column -->
            <th 
              v-if="selectable" 
              scope="col" 
              class="w-12 px-6 py-3 text-left"
            >
              <input
                v-model="selectAllChecked"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
                :indeterminate="isSelectAllIndeterminate"
                @change="handleSelectAll"
              />
            </th>
            
            <!-- Column headers -->
            <th 
              v-for="column in columns" 
              :key="column.key"
              scope="col"
              :class="getHeaderClasses(column)"
              :style="column.width ? { width: column.width } : undefined"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="group inline-flex items-center space-x-1 hover:text-surface-900 focus:outline-none"
                @click="handleSort(column.key)"
              >
                <span>{{ column.label }}</span>
                <div class="flex flex-col ml-2">
                  <ChevronUpIcon 
                    :class="getSortIconClasses(column.key, 'asc')"
                    class="w-3 h-3 -mb-0.5"
                  />
                  <ChevronDownIcon 
                    :class="getSortIconClasses(column.key, 'desc')"
                    class="w-3 h-3"
                  />
                </div>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>

        <!-- Table body -->
        <tbody class="bg-white divide-y divide-surface-200">
          <!-- Loading state -->
          <tr v-if="loading">
            <td :colspan="totalColumns" class="px-6 py-12 text-center">
              <div class="flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-surface-300 border-t-primary-600 rounded-full animate-spin mr-3"></div>
                <span class="text-sm text-surface-500">Loading...</span>
              </div>
            </td>
          </tr>
          
          <!-- Empty state -->
          <tr v-else-if="data.length === 0">
            <td :colspan="totalColumns" class="px-6 py-12 text-center">
              <EmptyState
                :title="emptyState?.title || 'No data'"
                :description="emptyState?.description || 'No records found'"
                :icon="emptyState?.icon"
              />
            </td>
          </tr>
          
          <!-- Data rows -->
          <tr 
            v-else
            v-for="(row, index) in data" 
            :key="getRowKey(row, index)"
            class="hover:bg-surface-50 transition-colors duration-150"
          >
            <!-- Selection cell -->
            <td v-if="selectable" class="w-12 px-6 py-4">
              <input
                v-model="selectedRowsModel"
                type="checkbox"
                :value="getRowKey(row, index)"
                class="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
              />
            </td>
            
            <!-- Data cells -->
            <td 
              v-for="column in columns"
              :key="column.key"
              :class="getCellClasses(column)"
            >
              <div v-if="column.render" v-html="column.render(get(row, column.key), row)"></div>
              <span v-else>{{ formatCellValue(get(row, column.key)) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Table footer -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-surface-200 bg-surface-50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataTableProps, DataTableColumn } from '~/types'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'

interface Props<T = any> extends DataTableProps<T> {
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  selectedRows: () => [],
  sortDirection: 'asc'
})

const emit = defineEmits<{
  sort: [{ column: string; direction: 'asc' | 'desc' }]
  'update:selectedRows': [value: any[]]
  'update:sortBy': [value: string]
  'update:sortDirection': [value: 'asc' | 'desc']
}>()

// Computed properties
const totalColumns = computed(() => {
  return props.columns.length + (props.selectable ? 1 : 0)
})

const selectedRowsModel = computed({
  get: () => props.selectedRows,
  set: (value) => emit('update:selectedRows', value)
})

const selectAllChecked = computed({
  get: () => props.data.length > 0 && props.selectedRows.length === props.data.length,
  set: () => {} // Handled by handleSelectAll
})

const isSelectAllIndeterminate = computed(() => {
  return props.selectedRows.length > 0 && props.selectedRows.length < props.data.length
})

// Methods
const getRowKey = (row: any, index: number): string => {
  return row.id?.toString() || index.toString()
}

const get = (obj: any, path: string): any => {
  return path.split('.').reduce((o, p) => o?.[p], obj)
}

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const handleSort = (columnKey: string) => {
  const newDirection = props.sortBy === columnKey && props.sortDirection === 'asc' ? 'desc' : 'asc'
  
  emit('update:sortBy', columnKey)
  emit('update:sortDirection', newDirection)
  emit('sort', { column: columnKey, direction: newDirection })
}

const handleSelectAll = () => {
  if (selectAllChecked.value) {
    emit('update:selectedRows', [])
  } else {
    const allKeys = props.data.map((row, index) => getRowKey(row, index))
    emit('update:selectedRows', allKeys)
  }
}

const getHeaderClasses = (column: DataTableColumn) => {
  const base = [
    'px-6 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider'
  ]
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  }
  
  return [
    ...base,
    alignClasses[column.align || 'left']
  ]
}

const getCellClasses = (column: DataTableColumn) => {
  const base = ['px-6 py-4 whitespace-nowrap text-sm']
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  
  return [
    ...base,
    alignClasses[column.align || 'left'],
    'text-surface-900'
  ]
}

const getSortIconClasses = (columnKey: string, direction: 'asc' | 'desc') => {
  const base = ['transition-colors']
  
  if (props.sortBy === columnKey && props.sortDirection === direction) {
    return [...base, 'text-primary-600']
  }
  
  return [...base, 'text-surface-400 group-hover:text-surface-600']
}
</script>