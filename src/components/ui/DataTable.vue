<template>
  <div class="flex flex-col justify-center items-start rounded-2xl border border-surface-200 border-solid shadow-sm w-full overflow-hidden bg-white">
    <!-- Table Header -->
    <div class="flex justify-center items-center p-6 border-b border-surface-200 border-solid w-full max-md:p-4">
      <div class="flex justify-between items-center w-full max-md:flex-col max-md:gap-4 max-md:items-start max-sm:items-start">
        <div class="flex flex-col gap-1 justify-center items-start">
          <div class="text-lg font-semibold leading-7 text-gray-900 max-sm:text-base">
            {{ title }}
          </div>
          <div class="text-sm leading-5 text-gray-500 max-sm:text-xs">
            {{ subtitle }}
          </div>
        </div>
        <div class="flex gap-4 justify-center items-center max-md:justify-start">
          <div class="text-sm leading-5 text-gray-500 max-sm:text-xs">
            Total: {{ total || 0 }} {{ itemLabel }}
          </div>
          <slot name="header-actions">
            <UiActionButton
              v-if="showRefresh"
              @click="$emit('refresh')"
              :disabled="refreshing"
              variant="primary"
              size="sm"
              :loading="refreshing"
            >
              <template #icon>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" :class="{ 'animate-spin': refreshing }">
                  <g clip-path="url(#clip0_refresh)">
                    <path d="M2.87383 5.53979C3.08437 4.9437 3.42617 4.38315 3.90742 3.90464C5.61641 2.19565 8.38633 2.19565 10.0953 3.90464L10.5629 4.37495H9.1875C8.70352 4.37495 8.3125 4.76597 8.3125 5.24995C8.3125 5.73394 8.70352 6.12495 9.1875 6.12495H12.6738H12.6848C13.1687 6.12495 13.5598 5.73394 13.5598 5.24995V1.74995C13.5598 1.26597 13.1687 0.874951 12.6848 0.874951C12.2008 0.874951 11.8098 1.26597 11.8098 1.74995V3.14995L11.3313 2.6687C8.93867 0.276123 5.06133 0.276123 2.66875 2.6687C2.00156 3.33589 1.52031 4.12065 1.225 4.96011C1.06367 5.41675 1.3043 5.9144 1.7582 6.07573C2.21211 6.23706 2.7125 5.99644 2.87383 5.54253V5.53979ZM1.06641 7.9105C0.929688 7.95151 0.798437 8.02534 0.691797 8.13472C0.582422 8.24409 0.508594 8.37534 0.470313 8.51753C0.462109 8.55034 0.453906 8.58589 0.448437 8.62144C0.440234 8.66792 0.4375 8.7144 0.4375 8.76089V12.25C0.4375 12.7339 0.828516 13.125 1.3125 13.125C1.79648 13.125 2.1875 12.7339 2.1875 12.25V10.8527L2.66875 11.3312C5.06133 13.721 8.93867 13.721 11.3285 11.3312C11.9957 10.664 12.4797 9.87925 12.775 9.04253C12.9363 8.58589 12.6957 8.08823 12.2418 7.9269C11.7879 7.76558 11.2875 8.0062 11.1262 8.46011C10.9156 9.0562 10.5738 9.61675 10.0926 10.0953C8.38359 11.8042 5.61367 11.8042 3.90469 10.0953L3.90195 10.0925L3.43438 9.62495H4.8125C5.29648 9.62495 5.6875 9.23394 5.6875 8.74995C5.6875 8.26597 5.29648 7.87495 4.8125 7.87495H1.32344C1.27969 7.87495 1.23594 7.87769 1.19219 7.88315C1.14844 7.88862 1.10742 7.89683 1.06641 7.9105Z" fill="white"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_refresh">
                      <path d="M0 0H14V14H0V0Z" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </template>
              Refresh
            </UiActionButton>
          </slot>
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="flex justify-center items-center w-full max-md:overflow-x-auto">
      <div class="flex flex-col justify-center items-start w-full" :class="{ 'max-md:min-w-[1150px]': responsive }">
        <!-- Table Header -->
        <div class="flex justify-center items-center border-b border-surface-200 border-solid h-[49px] w-full">
          <div class="flex justify-center items-start h-[49px] w-full">
            <div
              v-for="column in columns"
              :key="column.key"
              class="flex justify-center items-center h-[49px] flex-1"
              :class="column.width || 'min-w-[120px]'"
              :style="column.align ? { justifyContent: column.align === 'left' ? 'flex-start' : column.align === 'right' ? 'flex-end' : 'center' } : {}"
            >
              <div class="text-xs font-semibold tracking-wide text-center text-gray-600">
                {{ column.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col justify-center items-start w-full">
          <div class="flex justify-center items-center w-full py-12">
            <div class="text-sm text-gray-500">{{ loadingText }}</div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!data || data.length === 0" class="flex flex-col justify-center items-start w-full">
          <div class="flex justify-center items-center w-full py-12">
            <div class="text-sm text-gray-500">{{ emptyText }}</div>
          </div>
        </div>

        <!-- Table Body -->
        <div v-else class="flex flex-col justify-center items-start w-full">
          <div
            v-for="(item, index) in data"
            :key="getItemKey(item, index)"
            :class="[
              'flex justify-center items-start w-full',
              rowHeight || 'h-[59px]',
              index > 0 ? 'border-t border-surface-200' : ''
            ]"
          >
            <div
              v-for="column in columns"
              :key="column.key"
              class="flex justify-center items-center flex-1 px-6 py-0"
              :class="column.width || 'min-w-[120px]'"
              :style="column.align ? { justifyContent: column.align === 'left' ? 'flex-start' : column.align === 'right' ? 'flex-end' : 'center' } : {}"
            >
              <slot
                :name="`column-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
              >
                <div
                  :class="[
                    'text-sm',
                    column.textClass || 'text-gray-900',
                    column.fontWeight || ''
                  ]"
                >
                  {{ formatValue(getNestedValue(item, column.key), column.format) }}
                </div>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="showPagination && pagination"
      class="flex justify-between items-center px-6 border-t border-surface-200 border-solid h-[69px] w-full max-md:flex-col max-md:gap-4 max-md:px-4 max-md:h-auto max-md:py-4"
    >
      <div class="flex justify-center items-center">
        <div class="text-sm text-gray-500">
          Menampilkan {{ paginationStart }}–{{ paginationEnd }} dari {{ total || 0 }} {{ itemLabel }}
        </div>
      </div>
      <div class="flex gap-2 justify-center items-start max-md:-order-1 max-sm:flex-wrap max-sm:justify-center">
        <UiActionButton
          @click="$emit('page-change', pagination.page - 1)"
          :disabled="pagination.page === 1"
          variant="ghost"
          size="sm"
        >
          <template #icon>
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_prev)">
                <path d="M0.25708 6.38201C-0.0847168 6.7238 -0.0847168 7.27888 0.25708 7.62068L5.50708 12.8707C5.84888 13.2125 6.40395 13.2125 6.74575 12.8707C7.08755 12.5289 7.08755 11.9738 6.74575 11.632L2.11372 6.99998L6.74302 2.36794C7.08482 2.02615 7.08482 1.47107 6.74302 1.12927C6.40122 0.787476 5.84614 0.787476 5.50435 1.12927L0.254346 6.37927L0.25708 6.38201Z" fill="#6B7280"/>
              </g>
              <defs>
                <clipPath id="clip0_prev">
                  <path d="M0 0H8.75V14H0V0Z" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </template>
          Sebelumnya
        </UiActionButton>
        
        <UiActionButton
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('page-change', page)"
          :variant="pagination.page === page ? 'primary' : 'ghost'"
          size="sm"
          class="w-[30px]"
        >
          {{ page }}
        </UiActionButton>
        
        <UiActionButton
          @click="$emit('page-change', pagination.page + 1)"
          :disabled="pagination.page === totalPages"
          variant="ghost"
          size="sm"
        >
          Selanjutnya
          <template #icon-right>
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.49294 6.38201C8.83474 6.7238 8.83474 7.27888 8.49294 7.62068L3.24294 12.8707C2.90115 13.2125 2.34607 13.2125 2.00427 12.8707C1.66248 12.5289 1.66248 11.9738 2.00427 11.632L6.6363 6.99998L2.00701 2.36794C1.66521 2.02615 1.66521 1.47107 2.00701 1.12927C2.3488 0.787476 2.90388 0.787476 3.24568 1.12927L8.49568 6.37927L8.49294 6.38201Z" fill="#6B7280"/>
            </svg>
          </template>
        </UiActionButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T = Record<string, any>">
interface Column {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  textClass?: string
  fontWeight?: string
  format?: 'date' | 'time' | 'currency' | 'number' | ((value: any) => string)
}

interface Pagination {
  page: number
  limit: number
}

interface Props {
  title: string
  subtitle?: string
  columns: Column[]
  data: T[]
  loading?: boolean
  loadingText?: string
  emptyText?: string
  total?: number
  itemLabel?: string
  showRefresh?: boolean
  refreshing?: boolean
  showPagination?: boolean
  pagination?: Pagination
  responsive?: boolean
  rowHeight?: string
  itemKey?: string | ((item: T) => string | number)
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  loading: false,
  loadingText: 'Memuat data...',
  emptyText: 'Tidak ada data',
  total: 0,
  itemLabel: 'item',
  showRefresh: true,
  refreshing: false,
  showPagination: true,
  responsive: true,
  rowHeight: 'h-[59px]',
  itemKey: 'id'
})

const emit = defineEmits<{
  refresh: []
  'page-change': [page: number]
}>()

const totalPages = computed(() => {
  if (!props.pagination) return 1
  return Math.ceil((props.total || 0) / props.pagination.limit)
})

const paginationStart = computed(() => {
  if (!props.pagination) return 1
  return (props.pagination.page - 1) * props.pagination.limit + 1
})

const paginationEnd = computed(() => {
  if (!props.pagination) return props.total || 0
  const end = props.pagination.page * props.pagination.limit
  return Math.min(end, props.total || 0)
})

const visiblePages = computed(() => {
  if (!props.pagination) return []
  
  const total = totalPages.value
  const current = props.pagination.page
  const pages: number[] = []
  
  if (total <= 3) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current === 1) {
      pages.push(1, 2, 3)
    } else if (current === total) {
      pages.push(total - 2, total - 1, total)
    } else {
      pages.push(current - 1, current, current + 1)
    }
  }
  
  return pages
})

const getItemKey = (item: T, index: number): string | number => {
  if (typeof props.itemKey === 'function') {
    return props.itemKey(item)
  }
  return item[props.itemKey] || index
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((o, p) => o?.[p], obj)
}

const formatValue = (value: any, format?: Column['format']) => {
  if (value === null || value === undefined) return '-'
  
  if (typeof format === 'function') {
    return format(value)
  }
  
  switch (format) {
    case 'date':
      return new Date(value).toLocaleDateString('id-ID')
    case 'time':
      return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    case 'currency':
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)
    case 'number':
      return new Intl.NumberFormat('id-ID').format(value)
    default:
      return value
  }
}
</script>