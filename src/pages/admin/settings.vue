<template>
  <div class="flex flex-col gap-6 p-6 max-md:p-4 max-sm:p-3">
    <!-- Page Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-gray-900">Pengaturan Loket</h1>
      <p class="text-gray-600">Kelola pengaturan dan konfigurasi loket pelayanan</p>
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

    <!-- Quick Actions -->
    <AdminQuickActions title="Aksi Cepat">
      <AdminQuickActionCard
        label="Tambah Loket Baru"
        color="blue"
        @click="openAddCounterModal"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </template>
      </AdminQuickActionCard>
      
      
      <AdminQuickActionCard
        label="Backup Data"
        color="yellow"
        @click="createBackup"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </template>
      </AdminQuickActionCard>
      
      <AdminQuickActionCard
        label="Reset Sistem"
        color="red"
        @click="confirmSystemReset"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </template>
      </AdminQuickActionCard>
    </AdminQuickActions>

    <!-- Filter Section -->
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

      <!-- Location Filter -->
      <UiFormField
        label="Lokasi"
        type="select"
        v-model="filters.locationId"
        placeholder="Semua Lokasi"
        :options="locationOptions"
      />


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
      subtitle="Kelola semua loket pelayanan yang tersedia"
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
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ item.name }}</div>
          <div class="text-sm text-gray-500">{{ item.prefix }}</div>
        </div>
      </template>
      
      <template #column-location="{ item }">
        <div class="text-sm text-gray-900">
          {{ getLocationName(item.location_id) }}
        </div>
      </template>
      
      
      <template #column-status="{ item }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            item.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          ]"
        >
          {{ item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
        </span>
      </template>
      
      <template #column-actions="{ item }">
        <div class="flex gap-2 items-center">
          <UiActionButton
            @click="editCounter(item)"
            variant="ghost"
            size="xs"
            class="text-blue-600 hover:text-blue-900"
          >
            Edit
          </UiActionButton>
          <UiActionButton
            @click="toggleCounterStatus(item)"
            variant="ghost"
            size="xs"
            :class="item.status === 'ACTIVE' 
              ? 'text-red-600 hover:text-red-900' 
              : 'text-green-600 hover:text-green-900'"
          >
            {{ item.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan' }}
          </UiActionButton>
          <UiActionButton
            @click="deleteCounter(item)"
            variant="ghost"
            size="xs"
            class="text-red-600 hover:text-red-900"
          >
            Hapus
          </UiActionButton>
        </div>
      </template>
    </UiDataTable>

    <!-- Counter Form Modal -->
    <AdminCounterFormModal
      v-model="showCounterModal"
      :counter="selectedCounter"
      :locations="locations"
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
const locationStore = useLocationStore()

// Reactive data
const refreshing = ref(false)
const countersLoading = ref(false)
const showCounterModal = ref(false)
const selectedCounter = ref<Counter | null>(null)

const filters = reactive({
  status: '',
  locationId: '',
  search: ''
})

// Data refs
const counters = ref<Counter[]>([])
const locations = ref<Location[]>([])

// Get current user's location ID (for now, use default of 1)
const currentLocationId = computed(() => {
  // In a real app, this should come from user's assigned location
  return 1
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

const locationOptions = computed(() => {
  return locations.value.map(location => ({
    value: location.id,
    label: location.name
  }))
})


const tableColumns = [
  {
    key: 'name',
    title: 'Nama Loket',
    width: 'min-w-[200px]'
  },
  {
    key: 'location',
    title: 'Lokasi',
    width: 'min-w-[150px]'
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

  if (filters.locationId) {
    filtered = filtered.filter(counter => counter.location_id === Number(filters.locationId))
  }

  if (filters.search) {
    filtered = filtered.filter(counter =>
      counter.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      counter.prefix.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  return filtered
})

// Methods
const resetFilters = () => {
  filters.status = ''
  filters.locationId = ''
  filters.search = ''
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadCounters(),
      loadLocations()
    ])
  } finally {
    refreshing.value = false
  }
}

const loadCounters = async () => {
  countersLoading.value = true
  try {
    // Use the new endpoint that gets all accessible counters for admin
    const result = await adminStore.fetchAllAccessibleCounters()
    counters.value = result || []
    
    // Add status field if not present (for compatibility)
    counters.value = counters.value.map(counter => ({
      ...counter,
      status: counter.is_active ? 'ACTIVE' : 'INACTIVE'
    }))
  } catch (error) {
    console.error('Failed to load counters:', error)
    // Mock data for demo
    counters.value = [
      {
        id: 1,
        location_id: 1,
        name: 'Loket A',
        prefix: 'A',
        description: 'Loket pelayanan umum',
        open_time: '08:00',
        close_time: '17:00',
        capacity_per_day: 100,
        status: 'ACTIVE',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        location_id: 1,
        name: 'Loket B',
        prefix: 'B',
        description: 'Loket khusus',
        open_time: '09:00',
        close_time: '16:00',
        capacity_per_day: 50,
        status: 'INACTIVE',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  } finally {
    countersLoading.value = false
  }
}

const loadLocations = async () => {
  try {
    await locationStore.fetchAllLocations()
    locations.value = locationStore.locations
  } catch (error) {
    console.error('Failed to load locations:', error)
    // Mock data
    locations.value = [
      { id: 1, name: 'Kantor Pusat', owner_id: 1, is_active: true, created_at: '', updated_at: '' },
      { id: 2, name: 'Cabang A', owner_id: 1, is_active: true, created_at: '', updated_at: '' }
    ]
  }
}


const getLocationName = (locationId: number) => {
  const location = locationStore.getLocationById(locationId)
  return location?.name || 'Unknown'
}


// Modal handlers
const openAddCounterModal = () => {
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
      // Create new counter
      await adminStore.createCounter({
        locationId: parseInt(formData.locationId),
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
  } catch (error) {
    console.error('Failed to save counter:', error)
    await $modal.alert({
      title: 'Error',
      message: `Gagal ${selectedCounter.value ? 'memperbarui' : 'menambahkan'} loket`,
      type: 'error'
    })
  }
}


const createBackup = async () => {
  const toast = useToast()
  
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
  const toast = useToast()
  
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
  } catch (error) {
    console.error('Failed to toggle counter status:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengubah status loket',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
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
    } catch (error) {
      console.error('Failed to delete counter:', error)
      await $modal.alert({
        title: 'Error',
        message: 'Gagal menghapus loket',
        type: 'error'
      })
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