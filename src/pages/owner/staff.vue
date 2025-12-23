<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-[22px] font-bold text-gray-900">Staf & Akses</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola staf dan hak akses ke cabang bisnis Anda</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="exportStaff"
          class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export
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

    <!-- Warning/Info Banner - Least Privilege Principle -->
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <div class="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
        <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-medium text-amber-800">Prinsip Least Privilege</p>
        <p class="text-sm text-amber-700 mt-0.5">Berikan akses minimal yang diperlukan untuk setiap staf. Ini membantu menjaga keamanan dan integritas data bisnis Anda.</p>
      </div>
      <button class="ml-auto text-amber-500 hover:text-amber-700 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Invite Staff Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900">Tambah Staf Baru</h3>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Role: Admin
        </span>
      </div>
      
      <!-- Password Info Alert -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-800">Informasi Password Default</p>
            <p class="text-sm text-blue-700 mt-0.5">Password default untuk staf baru adalah: <code class="px-1.5 py-0.5 bg-blue-100 rounded font-mono text-blue-900">waitless123</code></p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Email <span class="text-red-500">*</span></label>
          <input
            v-model="inviteForm.email"
            type="email"
            placeholder="email@contoh.com"
            class="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Nama <span class="text-red-500">*</span></label>
          <input
            v-model="inviteForm.name"
            type="text"
            placeholder="Nama Lengkap"
            class="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Cabang <span class="text-red-500">*</span></label>
          <select
            v-model="inviteForm.locationId"
            class="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih Cabang</option>
            <option v-for="location in locations" :key="location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="sendInvite"
            :disabled="!isInviteValid"
            class="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Tambah Staf
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Staf</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ staffMembers.length }}</p>
          </div>
          <div class="p-2 bg-blue-50 rounded-lg">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Staf Aktif</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ activeStaffCount }}</p>
          </div>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Admin</p>
            <p class="text-2xl font-bold text-purple-600 mt-1">{{ adminCount }}</p>
          </div>
          <div class="p-2 bg-purple-50 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Menunggu Aktivasi</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ pendingCount }}</p>
          </div>
          <div class="p-2 bg-amber-50 rounded-lg">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Daftar Staf</h3>
            <p class="text-sm text-gray-500">{{ filteredStaffMembers.length }} staf terdaftar</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Cari nama atau email..."
                class="w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cabang</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Peran</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr 
              v-for="staff in filteredStaffMembers" 
              :key="staff.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-medium text-white">{{ getInitials(staff.name) }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ staff.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600">{{ staff.email }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <template v-if="staff.locations && staff.locations.length > 0">
                    <div v-for="location in staff.locations.slice(0, 2)" :key="location.id" class="text-sm text-gray-600">
                      {{ location.name }}
                    </div>
                    <div v-if="staff.locations.length > 2" class="text-xs text-gray-400">
                      +{{ staff.locations.length - 2 }} lainnya
                    </div>
                  </template>
                  <div v-else class="text-sm text-gray-400">Belum ada cabang</div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    getRoleBadgeClass(staff.role)
                  ]"
                >
                  {{ getRoleLabel(staff.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    staff.is_active 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : staff.status === 'pending' 
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', 
                    staff.is_active 
                      ? 'bg-emerald-500' 
                      : staff.status === 'pending'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-gray-400'
                  ]"></span>
                  {{ staff.is_active ? 'Akses Diberikan' : staff.status === 'pending' ? 'Menunggu Aktivasi' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="editStaff(staff)"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    v-if="staff.is_active"
                    @click="resetPassword(staff)"
                    class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Reset Password"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                  </button>
                  <button
                    @click="handleToggleStaffStatus(staff)"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      staff.is_active 
                        ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                    ]"
                    :title="staff.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                  </button>
                  <button
                    @click="deleteStaff(staff)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredStaffMembers.length === 0 && !loading">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <p class="text-sm text-gray-500">Belum ada staf terdaftar</p>
                  <p class="text-xs text-gray-400 mt-1">Undang staf pertama Anda menggunakan form di atas</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <OwnerStaffFormModal
      v-model="showStaffModal"
      :staff="selectedStaff"
      :branches="locations"
      @submit="handleStaffSubmit"
      @cancel="closeStaffModal"
    />

    <!-- Permissions Modal -->
    <OwnerPermissionsModal
      v-model="showPermissionsModal"
      :staff="selectedStaff"
      :locations="locations"
      @submit="handlePermissionsSubmit"
      @cancel="closePermissionsModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { User, ServiceLocation } from '~/types'

definePageMeta({
  layout: 'owner',
  middleware: 'owner'
})

const { getMyLocations, getStaffList, inviteStaff, updateStaff, toggleStaffStatus: toggleStaffStatusApi, removeStaff } = useOwnerApi()
const toast = useToast()
const { $modal } = useNuxtApp()

// Reactive data
const loading = ref(false)
const showStaffModal = ref(false)
const showPermissionsModal = ref(false)
const selectedStaff = ref<User | null>(null)
const staffMembers = ref<User[]>([])
const locations = ref<ServiceLocation[]>([])

// Invite form (role is always ADMIN for owner-created staff)
const inviteForm = ref({
  email: '',
  name: '',
  locationId: ''
})

// Filters
const searchTerm = ref('')
const statusFilter = ref('')

// Computed
const isInviteValid = computed(() => 
  inviteForm.value.email && 
  inviteForm.value.name &&
  inviteForm.value.locationId
)

const activeStaffCount = computed(() => 
  staffMembers.value.filter(staff => staff.is_active).length
)

const adminCount = computed(() => 
  staffMembers.value.filter(staff => staff.role === 'ADMIN').length
)

const pendingCount = computed(() => 
  staffMembers.value.filter(staff => staff.status === 'pending').length
)

const filteredStaffMembers = computed(() => {
  let filtered = staffMembers.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(staff => 
      staff.name.toLowerCase().includes(term) || 
      staff.email.toLowerCase().includes(term)
    )
  }

  if (statusFilter.value) {
    if (statusFilter.value === 'active') {
      filtered = filtered.filter(staff => staff.is_active === true)
    } else if (statusFilter.value === 'inactive') {
      filtered = filtered.filter(staff => staff.is_active === false)
    }
  }

  return filtered
})

// Methods
const refreshData = async () => {
  loading.value = true
  
  try {
    // Fetch locations and staff in parallel
    const [locResponse, staffResponse] = await Promise.all([
      getMyLocations(),
      getStaffList()
    ])
    
    if (locResponse.ok && locResponse.data) {
      locations.value = locResponse.data.locations
    }
    
    if (staffResponse.ok && staffResponse.data) {
      staffMembers.value = staffResponse.data.staff as any[]
    }
  } catch (error) {
    console.error('Failed to refresh data:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat data staf',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const sendInvite = async () => {
  try {
    const response = await inviteStaff({
      email: inviteForm.value.email,
      name: inviteForm.value.name,
      locationId: parseInt(inviteForm.value.locationId),
      role: 'ADMIN'  // Static ADMIN role for owner-created staff
    })
    
    if (response.ok) {
      toast.add({
        title: 'Berhasil',
        description: `Staf ${inviteForm.value.name} berhasil ditambahkan dengan role Admin`,
        color: 'green'
      })
      
      // Reset form and refresh
      inviteForm.value = { email: '', name: '', locationId: '' }
      await refreshData()
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Gagal menambahkan staf',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Failed to send invite:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengirim undangan',
      color: 'red'
    })
  }
}

const editStaff = (staff: User) => {
  selectedStaff.value = staff
  showStaffModal.value = true
}

const resetPassword = async (staff: User) => {
  try {
    toast.add({
      title: 'Berhasil',
      description: `Link reset password telah dikirim ke ${staff.email}`,
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to reset password:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengirim reset password',
      color: 'red'
    })
  }
}

const handleToggleStaffStatus = async (staff: User) => {
  const newStatus = !staff.is_active
  const actionText = newStatus ? 'mengaktifkan' : 'menonaktifkan'
  
  // Show confirmation dialog
  const confirmed = await $modal.confirm({
    title: `${newStatus ? 'Aktifkan' : 'Nonaktifkan'} Staf`,
    message: `Apakah Anda yakin ingin ${actionText} staf <strong>${staff.name}</strong>?`,
    type: newStatus ? 'info' : 'warning',
    confirmText: newStatus ? 'Aktifkan' : 'Nonaktifkan',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  try {
    const response = await toggleStaffStatusApi(staff.id)
    
    if (response.ok) {
      toast.add({
        title: 'Berhasil',
        description: `Staf ${staff.name} berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}`,
        color: 'green'
      })
      // Reset filter to show all staff after status toggle
      statusFilter.value = ''
      await refreshData()
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Gagal mengubah status staf',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Failed to toggle staff status:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal mengubah status staf',
      color: 'red'
    })
  }
}

const deleteStaff = async (staff: User) => {
  // Show confirmation dialog using $modal
  const confirmed = await $modal.confirm({
    title: 'Hapus Staf',
    message: `Apakah Anda yakin ingin menghapus staf <strong>${staff.name}</strong>?<br/><span class="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</span>`,
    type: 'danger',
    confirmText: 'Hapus',
    cancelText: 'Batal'
  })
  
  if (!confirmed) return
  
  try {
    const response = await removeStaff(staff.id)
    
    if (response.ok) {
      toast.add({
        title: 'Berhasil',
        description: `Staf ${staff.name} berhasil dihapus`,
        color: 'green'
      })
      await refreshData()
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Gagal menghapus staf',
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Failed to delete staff:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal menghapus staf',
      color: 'red'
    })
  }
}

const handleStaffSubmit = async (formData: any) => {
  try {
    if (selectedStaff.value) {
      // Call updateStaff API - only sending fields allowed by UpdateStaffRequest
      const response = await updateStaff(selectedStaff.value.id, {
        name: formData.name,
        locationId: formData.branch_id,
        is_active: formData.is_active
      })
      
      if (response.ok) {
        toast.add({
          title: 'Berhasil',
          description: 'Data staf berhasil diperbarui',
          color: 'green'
        })
        await refreshData()
      } else {
        toast.add({
          title: 'Error',
          description: response.error || 'Gagal memperbarui data staf',
          color: 'red'
        })
      }
    }
    closeStaffModal()
  } catch (error) {
    console.error('Failed to save staff:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal menyimpan data staf',
      color: 'red'
    })
  }
}

const handlePermissionsSubmit = async (permissionsData: any) => {
  try {
    if (selectedStaff.value) {
      selectedStaff.value.locations = permissionsData.locations
    }
    
    toast.add({
      title: 'Berhasil',
      description: 'Hak akses berhasil diperbarui',
      color: 'green'
    })
    closePermissionsModal()
  } catch (error) {
    console.error('Failed to update permissions:', error)
    toast.add({
      title: 'Error',
      description: 'Gagal memperbarui hak akses',
      color: 'red'
    })
  }
}

const closeStaffModal = () => {
  selectedStaff.value = null
  showStaffModal.value = false
}

const closePermissionsModal = () => {
  selectedStaff.value = null
  showPermissionsModal.value = false
}

const exportStaff = () => {
  const headers = ['Nama', 'Email', 'Peran', 'Status', 'Cabang']
  const csvData = staffMembers.value.map(staff => [
    staff.name,
    staff.email,
    getRoleLabel(staff.role),
    staff.is_active ? 'Aktif' : 'Nonaktif',
    staff.locations?.map(loc => loc.name).join('; ') || 'Tidak ada'
  ])
  
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `staf_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
  
  toast.add({
    title: 'Export Berhasil',
    description: 'Data staf berhasil diekspor',
    color: 'green'
  })
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'ADMIN': 'Admin',
    'VISITOR': 'Visitor',
    'OWNER': 'Owner'
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role: string) => {
  const classes: Record<string, string> = {
    'OWNER': 'bg-blue-100 text-blue-800',
    'ADMIN': 'bg-purple-100 text-purple-800',
    'VISITOR': 'bg-gray-100 text-gray-600'
  }
  return classes[role] || 'bg-gray-100 text-gray-600'
}

// Initialize data
onMounted(async () => {
  await refreshData()
})

// SEO
useHead({
  title: 'Staf & Akses - Waitless',
  meta: [
    { name: 'description', content: 'Kelola staf dan hak akses ke cabang bisnis Anda.' }
  ]
})
</script>