<template>
  <div class="bg-white shadow rounded-lg">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
        <div class="flex items-center space-x-3">
          <!-- Search Input -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <!-- Filter Dropdown -->
          <div class="relative" v-if="showFilters">
            <button
              @click="showFilterDropdown = !showFilterDropdown"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
              </svg>
              Filter
            </button>
          </div>

          <!-- Action Button -->
          <button
            v-if="showActions"
            @click="$emit('action-click')"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {{ actionText }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Table Head -->
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              @click="handleSort(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <svg
                  v-if="sortColumn === column.key"
                  class="w-4 h-4"
                  :class="sortDirection === 'asc' ? 'transform rotate-180' : ''"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </th>
            <th v-if="showRowActions" scope="col" class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="(item, index) in paginatedData" 
            :key="index"
            class="hover:bg-gray-50"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm"
            >
              <!-- Custom slot for each column -->
              <slot 
                :name="`cell-${column.key}`" 
                :item="item" 
                :value="getNestedValue(item, column.key)"
              >
                <!-- Default cell content -->
                <span v-if="column.type === 'badge'" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getBadgeClass(getNestedValue(item, column.key))">
                  {{ getNestedValue(item, column.key) }}
                </span>
                <span v-else-if="column.type === 'date'" class="text-gray-900">
                  {{ formatDate(getNestedValue(item, column.key)) }}
                </span>
                <span v-else-if="column.type === 'time'" class="text-gray-900">
                  {{ formatTime(getNestedValue(item, column.key)) }}
                </span>
                <span v-else class="text-gray-900">
                  {{ getNestedValue(item, column.key) }}
                </span>
              </slot>
            </td>
            
            <!-- Row Actions -->
            <td v-if="showRowActions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <slot name="row-actions" :item="item">
                <div class="flex items-center space-x-2">
                  <button
                    @click="$emit('view-item', item)"
                    class="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button
                    @click="$emit('edit-item', item)"
                    class="text-yellow-600 hover:text-yellow-900"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="$emit('delete-item', item)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="filteredData.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No data found</h3>
      <p class="mt-1 text-sm text-gray-500">{{ emptyMessage }}</p>
    </div>

    <!-- Pagination -->
    <div v-if="filteredData.length > 0" class="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
      <div class="text-sm text-gray-700">
        Showing {{ Math.min((currentPage - 1) * pageSize + 1, filteredData.length) }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} results
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="currentPage > 1 && currentPage--"
          :disabled="currentPage === 1"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="text-sm text-gray-700">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          @click="currentPage < totalPages && currentPage++"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  type?: 'text' | 'badge' | 'date' | 'time'
  sortable?: boolean
}

interface Props {
  title: string
  data: any[]
  columns: Column[]
  pageSize?: number
  showActions?: boolean
  showRowActions?: boolean
  showFilters?: boolean
  actionText?: string
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  showActions: true,
  showRowActions: true,
  showFilters: true,
  actionText: 'Add New',
  emptyMessage: 'Get started by adding some data.'
})

defineEmits<{
  'action-click': []
  'view-item': [item: any]
  'edit-item': [item: any]
  'delete-item': [item: any]
}>()

const searchQuery = ref('')
const sortColumn = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const showFilterDropdown = ref(false)

const filteredData = computed(() => {
  let result = props.data

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(query)
      )
    })
  }

  // Apply sorting
  if (sortColumn.value) {
    result = [...result].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn.value)
      const bVal = getNestedValue(b, sortColumn.value)
      
      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return result
})

const totalPages = computed(() => 
  Math.ceil(filteredData.value.length / props.pageSize)
)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const getBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'PENDING': 'bg-yellow-100 text-yellow-800'
  }
  return classes[status?.toUpperCase()] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString()
}

const formatTime = (time: string | Date) => {
  if (!time) return '-'
  const d = new Date(time)
  return d.toLocaleTimeString()
}

// Reset page when search changes
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>