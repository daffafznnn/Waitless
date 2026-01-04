<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-[22px] font-bold text-gray-900">Cabang & Loket</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola cabang dan loket pelayanan bisnis Anda</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="toggleAutoRefresh"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            autoRefresh 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full', autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400']"></span>
            {{ autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF' }}
          </span>
        </button>
        <button
          @click="refreshData"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <span class="flex items-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Memperbarui...' : 'Refresh' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Warning/Info Banner - Figma Style -->
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <div class="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
        <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-medium text-amber-800">Tips Optimasi</p>
        <p class="text-sm text-amber-700 mt-0.5">Sesuaikan jam operasional saat sepi untuk meningkatkan efisiensi dan mengurangi waktu tunggu pelanggan.</p>
      </div>
      <button class="ml-auto text-amber-500 hover:text-amber-700 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Search and Add Button Row -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="relative w-full sm:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari cabang..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Tambah Cabang
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Branches Table (Left/Main Column) -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-900">Daftar Cabang</h3>
          <p class="text-sm text-gray-500">{{ filteredLocations.length }} cabang terdaftar</p>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Cabang</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Loket</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr 
                v-for="location in filteredLocations" 
                :key="location.id"
                :class="[
                  'hover:bg-gray-50 transition-colors cursor-pointer',
                  selectedLocation?.id === location.id ? 'bg-blue-50' : ''
                ]"
                @click="selectBranch(location)"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-900">{{ location.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-gray-600 truncate max-w-[200px]">{{ location.address || 'Belum ada alamat' }}</p>
                  <p v-if="location.city" class="text-xs text-gray-400">{{ location.city }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ (location as any).counters_count ?? location.counters?.length ?? 0 }} loket
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      location.is_active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', location.is_active ? 'bg-emerald-500' : 'bg-gray-400']"></span>
                    {{ location.is_active ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click.stop="selectBranch(location)"
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Kelola
                  </button>
                </td>
              </tr>
              <tr v-if="filteredLocations.length === 0 && !loading">
                <td colspan="5" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                    </svg>
                    <p class="text-sm text-gray-500">Belum ada cabang terdaftar</p>
                    <button
                      @click="openCreateModal"
                      class="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Tambah Cabang Baru
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Side Panel: Branch Detail / Loket List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <template v-if="selectedLocation">
          <div class="px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-900">Detail Cabang</h3>
                <p class="text-sm text-gray-500">{{ selectedLocation.name }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="editLocation(selectedLocation)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Cabang"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  @click="toggleLocationStatus(selectedLocation)"
                  :class="[
                    'p-2 rounded-lg transition-colors',
                    selectedLocation.is_active 
                      ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                      : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                  ]"
                  :title="selectedLocation.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Branch Info -->
          <div class="px-6 py-4 border-b border-gray-100 space-y-3">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <div>
                <p class="text-xs text-gray-500">Alamat</p>
                <p class="text-sm text-gray-700">{{ selectedLocation.address || 'Belum ada alamat' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="text-xs text-gray-500">Jam Operasional</p>
                <p class="text-sm text-gray-700">{{ (selectedLocation as any).operating_hours ?? '08:00 - 17:00' }}</p>
              </div>
            </div>
          </div>

          <!-- Loket List -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900">Daftar Loket</h4>
              <button
                @click="openAddCounterModal"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Loket
              </button>
            </div>

            <div class="space-y-3">
              <!-- Loket Cards -->
              <div 
                v-for="counter in locationCounters" 
                :key="counter.id"
                class="p-3 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-all"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span class="text-xs font-bold text-purple-600">{{ counter.prefix || 'L' }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ counter.name }}</p>
                      <p class="text-xs text-gray-500">{{ counter.description || 'Layanan Umum' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span 
                      :class="[
                        'w-2 h-2 rounded-full',
                        counter.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                      ]"
                    ></span>
                    <button 
                      @click.stop="editCounter(counter)"
                      class="text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button 
                      @click.stop="confirmDeleteCounter(counter)"
                      class="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="locationCounters.length === 0 && !loadingCounters" class="py-6 text-center">
                <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <p class="text-sm text-gray-500">Belum ada loket</p>
                <button @click="openAddCounterModal" class="mt-2 text-xs text-purple-600 hover:text-purple-800 font-medium">+ Tambah Loket</button>
              </div>
              <div v-if="loadingCounters" class="py-6 text-center">
                <svg class="animate-spin h-6 w-6 text-purple-600 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-xs text-gray-500 mt-2">Memuat loket...</p>
              </div>
            </div>
          </div>
        </template>

        <!-- No Branch Selected State -->
        <template v-else>
          <div class="flex flex-col items-center justify-center py-16 px-6">
            <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
            </div>
            <h4 class="text-base font-medium text-gray-900 mb-1">Pilih Cabang</h4>
            <p class="text-sm text-gray-500 text-center">Klik pada salah satu cabang untuk melihat detail dan kelola loket</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Create/Edit Branch Modal -->
    <OwnerBranchFormModal
      v-model="showModal"
      :location="editingLocation"
      @submit="handleSubmit"
      @cancel="closeModal"
    />

    <!-- Create/Edit Counter Modal -->
    <OwnerCounterFormModal
      v-model="showCounterModal"
      :counter="editingCounter"
      :location-name="selectedLocation?.name || ''"
      @submit="handleCounterSubmit"
      @cancel="closeCounterModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { ServiceLocation, Counter } from '~/types'

definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { 
  getMyLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation: deleteLocationApi,
  getLocationCounters,
  createCounter,
  updateCounter,
  deleteCounter
} = useOwnerApi()
const toast = useToast()

// Reactive data
const loading = ref(false)
const autoRefresh = ref(true)
const autoRefreshInterval = ref<NodeJS.Timeout>()
const showModal = ref(false)
const selectedLocation = ref<ServiceLocation | null>(null)
const editingLocation = ref<ServiceLocation | null>(null)
const locations = ref<ServiceLocation[]>([])
const searchQuery = ref('')

// Counter management
const showCounterModal = ref(false)
const editingCounter = ref<Counter | null>(null)
const locationCounters = ref<Counter[]>([])
const loadingCounters = ref(false)

// Computed
const filteredLocations = computed(() => {
  if (!searchQuery.value) return locations.value
  const query = searchQuery.value.toLowerCase()
  return locations.value.filter(location => 
    location.name.toLowerCase().includes(query) ||
    location.address?.toLowerCase().includes(query) ||
    location.city?.toLowerCase().includes(query)
  )
})

// Methods
const refreshData = async () => {
  loading.value = true
  
  try {
    const response = await getMyLocations()
    if (response.ok && response.data) {
      locations.value = response.data.locations
    } else {
      console.warn('Failed to fetch locations:', response.error)
    }
  } catch (error) {
    console.error('Failed to refresh data:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data cabang',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const selectBranch = async (location: ServiceLocation) => {
  selectedLocation.value = location
  // Fetch counters for selected branch
  await fetchCounters(location.id)
}

const openCreateModal = () => {
  editingLocation.value = null
  showModal.value = true
}

const editLocation = (location: ServiceLocation) => {
  editingLocation.value = location
  showModal.value = true
}

const openAddCounterModal = () => {
  editingCounter.value = null
  showCounterModal.value = true
}

const editCounter = (counter: Counter) => {
  editingCounter.value = counter
  showCounterModal.value = true
}

const closeCounterModal = () => {
  showCounterModal.value = false
  editingCounter.value = null
}

const fetchCounters = async (locationId: number) => {
  loadingCounters.value = true
  try {
    const response = await getLocationCounters(locationId)
    if (response.ok && response.data) {
      locationCounters.value = response.data.counters
    } else {
      console.warn('Failed to fetch counters:', response.error)
      locationCounters.value = []
    }
  } catch (error) {
    console.error('Failed to fetch counters:', error)
    locationCounters.value = []
  } finally {
    loadingCounters.value = false
  }
}

const handleCounterSubmit = async (formData: any) => {
  if (!selectedLocation.value) return
  
  try {
    let response
    
    if (editingCounter.value) {
      response = await updateCounter(editingCounter.value.id, formData)
    } else {
      response = await createCounter(selectedLocation.value.id, formData)
    }
    
    if (response.ok && response.data) {
      await fetchCounters(selectedLocation.value.id)
      closeCounterModal()
      toast.add({
        title: 'Berhasil',
        description: `Loket berhasil ${editingCounter.value ? 'diperbarui' : 'ditambahkan'}`,
        color: 'green'
      })
    } else {
      throw new Error(response.error || 'Failed to save counter')
    }
  } catch (error: any) {
    console.error('Failed to save counter:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Gagal menyimpan loket',
      color: 'red'
    })
  }
}

const confirmDeleteCounter = async (counter: Counter) => {
  const { $modal } = useNuxtApp()
  
  const confirmed = await $modal.confirmDelete(`Hapus loket "${counter.name}"?`)
  if (!confirmed) return
  
  if (!selectedLocation.value) return
  
  try {
    const response = await deleteCounter(counter.id)
    
    if (response.ok) {
      await fetchCounters(selectedLocation.value.id)
      toast.add({
        title: 'Berhasil',
        description: 'Loket berhasil dihapus',
        color: 'green'
      })
    } else {
      throw new Error(response.error || 'Failed to delete counter')
    }
  } catch (error: any) {
    console.error('Failed to delete counter:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Gagal menghapus loket',
      color: 'red'
    })
  }
}

const toggleLocationStatus = async (location: ServiceLocation) => {
  try {
    const response = await updateLocation(location.id, {
      isActive: !location.is_active
    })
    
    if (response.ok && response.data) {
      await refreshData()
      if (selectedLocation.value?.id === location.id) {
        selectedLocation.value = { ...location, is_active: !location.is_active }
      }
      toast.add({
        title: 'Berhasil',
        description: `Cabang berhasil ${location.is_active ? 'dinonaktifkan' : 'diaktifkan'}`,
        color: 'green'
      })
    } else {
      throw new Error(response.error || 'Failed to update location status')
    }
  } catch (error) {
    console.error('Failed to toggle location status:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengubah status cabang',
      color: 'red'
    })
  }
}

const handleSubmit = async (formData: any) => {
  try {
    let response
    
    if (editingLocation.value) {
      response = await updateLocation(editingLocation.value.id, formData)
    } else {
      response = await createLocation(formData)
    }
    
    if (response.ok && response.data) {
      await refreshData()
      closeModal()
      toast.add({
        title: 'Berhasil',
        description: `Cabang berhasil ${editingLocation.value ? 'diperbarui' : 'ditambahkan'}`,
        color: 'green'
      })
    } else {
      throw new Error(response.error || 'Failed to save location')
    }
  } catch (error) {
    console.error('Failed to save location:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal menyimpan cabang',
      color: 'red'
    })
  }
}

const closeModal = () => {
  editingLocation.value = null
  showModal.value = false
}

// Auto refresh
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    if (!loading.value) {
      refreshData()
    }
  }, 30000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

// Initialize data
onMounted(async () => {
  await refreshData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// SEO
useHead({
  title: 'Cabang & Loket - Waitless',
  meta: [
    { name: 'description', content: 'Kelola cabang dan loket pelayanan bisnis Anda.' }
  ]
})
</script>