<template>
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Access Error Alert -->
    <div 
      v-if="accessError" 
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
    >
      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800">Akses Ditolak</h3>
        <p class="text-sm text-red-600 mt-1">{{ accessError }}</p>
      </div>
    </div>

    <!-- Page Header with Location Info -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-900">Pengaturan Loket</h1>
        <span 
          v-if="assignedLocation" 
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ assignedLocation.name }}
        </span>
      </div>
      <p class="text-gray-600">Kelola pengaturan dan konfigurasi loket pelayanan di cabang Anda</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatsCard
        title="Total Loket"
        :value="countersStats.total || 0"
        subtitle="Loket terdaftar"
        icon="counter"
        color="blue"
      />
      
      <AdminStatsCard
        title="Loket Aktif"
        :value="countersStats.active || 0"
        subtitle="Sedang beroperasi"
        icon="check"
        color="green"
      />
      
      <AdminStatsCard
        title="Loket Nonaktif"
        :value="countersStats.inactive || 0"
        subtitle="Tidak beroperasi"
        icon="pause"
        color="red"
      />
      
    </div>

    <!-- Quick Actions - Only functional actions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 class="text-base font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Add Counter -->
        <button
          @click="openAddCounterModal"
          :disabled="!assignedLocation"
          class="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900">Tambah Loket Baru</p>
            <p class="text-xs text-gray-500">Buat loket pelayanan baru</p>
          </div>
        </button>
        
        <!-- Refresh Data -->
        <button
          @click="refreshData"
          :disabled="refreshing"
          class="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div class="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg :class="['w-5 h-5 text-white', refreshing && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900">{{ refreshing ? 'Memperbarui...' : 'Refresh Data' }}</p>
            <p class="text-xs text-gray-500">Perbarui daftar loket</p>
          </div>
        </button>

        <!-- Activate All -->
        <button
          @click="activateAllCounters"
          :disabled="!assignedLocation || countersStats.inactive === 0"
          class="flex items-center gap-3 p-4 rounded-xl border-2 border-green-100 hover:bg-green-50 hover:border-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900">Aktifkan Semua</p>
            <p class="text-xs text-gray-500">{{ countersStats.inactive }} loket nonaktif</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Filter Section - Location filter removed since admin only sees their location -->
    <AdminFilterSection title="Filter Loket" @reset="resetFilters">
      <!-- Status Filter -->
      <div class="flex flex-col gap-2 items-start w-[264px] max-md:w-[calc(50%_-_8px)] max-sm:w-full">
        <label class="flex justify-start items-center h-5">
          <div class="text-sm font-medium text-gray-700">Status</div>
        </label>
        <UiButtonGroup
          v-model="filters.status"
          :buttons="statusFilterOptions"
        />
      </div>

      <!-- Search Filter -->
      <UiFormField
        label="Cari"
        type="search"
        v-model="filters.search"
        placeholder="Cari nama loket..."
      />
    </AdminFilterSection>

    <!-- Counters Table -->
    <UiDataTable
      title="Daftar Loket"
      :subtitle="assignedLocation ? `Loket di cabang ${assignedLocation.name}` : 'Kelola semua loket pelayanan yang tersedia'"
      :columns="tableColumns"
      :data="filteredCounters"
      :loading="countersLoading"
      :refreshing="refreshing"
      :total="filteredCounters.length"
      item-label="loket"
      :show-pagination="false"
      @refresh="refreshData"
    >
      <template #column-name="{ item }">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <span class="text-lg font-bold">{{ item.prefix }}</span>
          </div>
          <div>
            <div class="text-sm font-semibold text-gray-900">{{ item.name }}</div>
            <div class="text-xs text-gray-500 line-clamp-1">{{ item.description || 'Tidak ada deskripsi' }}</div>
          </div>
        </div>
      </template>
      
      <template #column-hours="{ item }">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formatTime(item.open_time) }} - {{ formatTime(item.close_time) }}</span>
        </div>
      </template>
      
      <template #column-capacity="{ item }">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{{ item.capacity_per_day }} / hari</span>
        </div>
      </template>
      
      <template #column-status="{ item }">
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
            item.status === 'ACTIVE' 
              ? 'bg-green-50 text-green-700 ring-green-600/20' 
              : 'bg-red-50 text-red-700 ring-red-600/10'
          ]"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', item.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-500']"></span>
          {{ item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
        </span>
      </template>
      
      <template #column-actions="{ item }">
        <div class="flex items-center justify-end gap-2">
          <!-- Edit Button -->
          <button
            @click="editCounter(item)"
            class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Loket"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <!-- Toggle Status Button -->
          <button
            @click="toggleCounterStatus(item)"
            class="p-1.5 rounded-lg transition-colors"
            :class="item.status === 'ACTIVE' 
              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'"
            :title="item.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'"
          >
            <svg v-if="item.status === 'ACTIVE'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- Delete Button -->
          <button
            @click="deleteCounter(item)"
            class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Loket"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Counter Form Modal -->
    <AdminCounterFormModal
      v-model="showCounterModal"
      :counter="selectedCounter"
      :locations="restrictedLocations"
      :services="[]"
      @submit="handleCounterSubmit"
      @cancel="handleCancelModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { Counter, Location } from '~/types'
import AdminStatsCard from '~/components/admin/StatsCard.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

// Stores
const adminStore = useAdminStore()
const toast = useToast()

// Admin's assigned location
const assignedLocation = ref<{ id: number; name: string } | null>(null)
const accessError = ref<string | null>(null)

// Reactive data
const refreshing = ref(false)
const countersLoading = ref(false)
const showCounterModal = ref(false)
const selectedCounter = ref<Counter | null>(null)

const filters = reactive({
  status: '',
  search: ''
})

// Data refs
const counters = ref<Counter[]>([])

// Restricted locations for modal - only admin's assigned location
const restrictedLocations = computed<Location[]>(() => {
  if (!assignedLocation.value) return []
  return [{
    id: assignedLocation.value.id,
    name: assignedLocation.value.name,
    owner_id: 0,
    is_active: true,
    created_at: '',
    updated_at: ''
  }]
})

const countersStats = computed(() => {
  return {
    total: counters.value.length,
    active: counters.value.filter(c => c.status === 'ACTIVE').length,
    inactive: counters.value.filter(c => c.status === 'INACTIVE').length
  }
})

const statusFilterOptions = [
  { label: 'Semua', value: '' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Nonaktif', value: 'INACTIVE' }
]

const tableColumns = [
  {
    key: 'name',
    title: 'Nama Loket',
    width: 'min-w-[200px]'
  },
  {
    key: 'hours',
    title: 'Jam Operasi',
    width: 'min-w-[150px]'
  },
  {
    key: 'capacity',
    title: 'Kapasitas',
    width: 'min-w-[100px]'
  },
  {
    key: 'status',
    title: 'Status',
    width: 'min-w-[100px]'
  },
  {
    key: 'actions',
    title: 'Aksi',
    width: 'min-w-[200px]'
  }
]

const filteredCounters = computed(() => {
  let filtered = counters.value

  if (filters.status) {
    filtered = filtered.filter(counter => counter.status === filters.status)
  }

  if (filters.search) {
    filtered = filtered.filter(counter =>
      counter.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      counter.prefix.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  return filtered
})

// Helper functions
const formatTime = (time: string) => {
  if (!time) return '-'
  return time.slice(0, 5) // Format HH:MM from HH:MM:SS
}

// Methods
const resetFilters = () => {
  filters.status = ''
  filters.search = ''
}

/**
 * Load admin's assigned location and counters
 */
const loadAdminData = async () => {
  try {
    accessError.value = null
    
    // Fetch accessible counters - backend will only return counters from admin's assigned location
    const accessibleCounters = await adminStore.fetchAllAccessibleCounters()
    
    if (accessibleCounters && accessibleCounters.length > 0) {
      // Get location from first counter
      const firstCounter = accessibleCounters[0]
      if (firstCounter.location_id) {
        const locationApi = useLocationApi()
        const response = await locationApi.getLocationById(firstCounter.location_id)
        if (response.ok && response.data?.location) {
          assignedLocation.value = {
            id: response.data.location.id,
            name: response.data.location.name
          }
        }
      }
      
      // Set counters with status field
      counters.value = accessibleCounters.map(counter => ({
        ...counter,
        status: counter.is_active ? 'ACTIVE' : 'INACTIVE'
      }))
    } else {
      accessError.value = 'Anda tidak memiliki akses ke cabang manapun. Hubungi owner untuk mendapatkan akses.'
      counters.value = []
    }
  } catch (error: any) {
    console.error('Failed to load admin data:', error)
    
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = 'Akses Anda ke cabang ini telah dinonaktifkan'
    } else {
      accessError.value = error.message || 'Gagal memuat data'
    }
    
    counters.value = []
  }
}

const refreshData = async () => {
  refreshing.value = true
  countersLoading.value = true
  try {
    await loadAdminData()
    toast.add({ title: 'Data Diperbarui', color: 'green' })
  } finally {
    refreshing.value = false
    countersLoading.value = false
  }
}

// Activate all inactive counters
const activateAllCounters = async () => {
  const { $modal } = useNuxtApp()
  
  const inactiveCounters = counters.value.filter(c => !c.is_active)
  if (inactiveCounters.length === 0) {
    toast.add({ title: 'Tidak ada loket nonaktif', color: 'blue' })
    return
  }
  
  const confirmed = await $modal.confirm({
    title: 'Aktifkan Semua Loket',
    message: `Anda akan mengaktifkan ${inactiveCounters.length} loket yang sedang nonaktif. Lanjutkan?`,
    type: 'info',
    confirmText: 'Ya, Aktifkan Semua',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  let successCount = 0
  let failCount = 0
  
  for (const counter of inactiveCounters) {
    try {
      await adminStore.updateCounter(counter.id, { is_active: true })
      
      // Update local state
      const index = counters.value.findIndex(c => c.id === counter.id)
      if (index !== -1) {
        counters.value[index].is_active = true
        counters.value[index].status = 'ACTIVE'
      }
      successCount++
    } catch (error) {
      console.error(`Failed to activate counter ${counter.name}:`, error)
      failCount++
    }
  }
  
  if (successCount > 0) {
    toast.add({ 
      title: 'Berhasil', 
      description: `${successCount} loket berhasil diaktifkan`,
      color: 'green' 
    })
  }
  
  if (failCount > 0) {
    toast.add({ 
      title: 'Sebagian Gagal', 
      description: `${failCount} loket gagal diaktifkan`,
      color: 'orange' 
    })
  }
}

// Modal handlers
const openAddCounterModal = () => {
  if (!assignedLocation.value) {
    toast.add({
      title: 'Error',
      description: 'Anda tidak memiliki akses ke cabang manapun',
      color: 'red'
    })
    return
  }
  selectedCounter.value = null
  showCounterModal.value = true
}

const openEditCounterModal = (counter: Counter) => {
  selectedCounter.value = counter
  showCounterModal.value = true
}

const handleCancelModal = () => {
  selectedCounter.value = null
  showCounterModal.value = false
}

const handleCounterSubmit = async (formData: any) => {
  const { $modal } = useNuxtApp()
  
  // Ensure location is admin's assigned location
  if (!assignedLocation.value) {
    await $modal.alert({
      title: 'Error',
      message: 'Tidak dapat menyimpan. Anda tidak memiliki akses ke cabang manapun.',
      type: 'error'
    })
    return
  }
  
  try {
    if (selectedCounter.value) {
      // Update existing counter
      await adminStore.updateCounter(selectedCounter.value.id, {
        name: formData.name,
        prefix: formData.prefix,
        description: formData.description,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        capacityPerDay: parseInt(formData.capacityPerDay),
        is_active: formData.isActive
      })
      
      await $modal.alert({
        title: 'Berhasil',
        message: `Loket ${formData.name} berhasil diperbarui`,
        type: 'success'
      })
    } else {
      // Create new counter - ALWAYS use admin's assigned location
      await adminStore.createCounter({
        locationId: assignedLocation.value.id,
        name: formData.name,
        prefix: formData.prefix,
        description: formData.description,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        capacityPerDay: parseInt(formData.capacityPerDay)
      })
      
      await $modal.alert({
        title: 'Berhasil',
        message: `Loket ${formData.name} berhasil ditambahkan`,
        type: 'success'
      })
    }
    
    // Refresh data and close modal
    await refreshData()
    handleCancelModal()
  } catch (error: any) {
    console.error('Failed to save counter:', error)
    
    // Check for 403 errors
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      await $modal.alert({
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki izin untuk operasi ini',
        type: 'error'
      })
    } else {
      await $modal.alert({
        title: 'Error',
        message: error.message || `Gagal ${selectedCounter.value ? 'memperbarui' : 'menambahkan'} loket`,
        type: 'error'
      })
    }
  }
}


const createBackup = async () => {
  toast.add({
    title: 'Info',
    description: 'Memulai proses backup data...',
    icon: 'i-heroicons-arrow-down-tray',
    color: 'blue'
  })
  
  // Simulate backup process
  setTimeout(() => {
    toast.add({
      title: 'Berhasil',
      description: 'Backup data berhasil dibuat',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  }, 2000)
}

const confirmSystemReset = async () => {
  const { $modal } = useNuxtApp()
  
  const confirmed = await $modal.confirm({
    title: 'Konfirmasi Reset Sistem',
    message: 'Apakah Anda yakin ingin mereset sistem? Tindakan ini tidak dapat dibatalkan.',
    type: 'danger',
    confirmText: 'Ya, Reset',
    cancelText: 'Batal'
  })
  
  if (confirmed) {
    await $modal.alert({
      title: 'Info',
      message: 'Memulai proses reset sistem...',
      type: 'warning'
    })
    
    // Simulate system reset
    setTimeout(async () => {
      await $modal.alert({
        title: 'Berhasil',
        message: 'Sistem berhasil direset',
        type: 'success'
      })
    }, 3000)
  }
}

const editCounter = (counter: Counter) => {
  openEditCounterModal(counter)
}

const toggleCounterStatus = async (counter: Counter) => {
  try {
    const newStatus = counter.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const newActiveStatus = newStatus === 'ACTIVE'
    
    await adminStore.updateCounter(counter.id, {
      is_active: newActiveStatus
    })
    
    // Update local data
    const index = counters.value.findIndex((c: Counter) => c.id === counter.id)
    if (index !== -1) {
      counters.value[index].status = newStatus
      counters.value[index].is_active = newActiveStatus
    }
    
    toast.add({
      title: 'Berhasil',
      description: `Loket ${counter.name} berhasil ${newActiveStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      icon: 'i-heroicons-check-circle',
      color: newActiveStatus ? 'green' : 'orange'
    })
  } catch (error: any) {
    console.error('Failed to toggle counter status:', error)
    
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      toast.add({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk operasi ini',
        color: 'red'
      })
    } else {
      toast.add({
        title: 'Error',
        description: 'Gagal mengubah status loket',
        icon: 'i-heroicons-x-circle',
        color: 'red'
      })
    }
  }
}

const deleteCounter = async (counter: Counter) => {
  const { $modal } = useNuxtApp()
  
  const confirmed = await $modal.confirm({
    title: 'Konfirmasi Hapus Loket',
    message: `Apakah Anda yakin ingin menghapus loket ${counter.name}? Tindakan ini tidak dapat dibatalkan.`,
    type: 'danger',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal'
  })
  
  if (confirmed) {
    try {
      await adminStore.deleteCounter(counter.id)
      
      // Remove from local data
      const index = counters.value.findIndex((c: Counter) => c.id === counter.id)
      if (index !== -1) {
        counters.value.splice(index, 1)
      }
      
      await $modal.alert({
        title: 'Berhasil',
        message: `Loket ${counter.name} berhasil dihapus`,
        type: 'success'
      })
    } catch (error: any) {
      console.error('Failed to delete counter:', error)
      
      if (error.message?.includes('403') || error.message?.includes('akses')) {
        await $modal.alert({
          title: 'Akses Ditolak',
          message: 'Anda tidak memiliki izin untuk menghapus loket ini',
          type: 'error'
        })
      } else {
        await $modal.alert({
          title: 'Error',
          message: error.message || 'Gagal menghapus loket',
          type: 'error'
        })
      }
    }
  }
}

// Load data on mount
onMounted(() => {
  refreshData()
})

// SEO
useHead({
  title: 'Pengaturan Loket - Admin - WaitLess',
  meta: [
    { name: 'description', content: 'Kelola pengaturan dan konfigurasi loket pelayanan sistem antrian.' }
  ]
})
</script>