<template>
  <UiModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="staff ? `Kelola Hak Akses - ${staff.name}` : 'Kelola Hak Akses Umum'"
    size="lg"
  >
    <div class="space-y-6">
      <!-- Staff Info (if specific staff) -->
      <div v-if="staff" class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <span class="text-purple-600 font-bold text-lg">
              {{ getInitials(staff.name) }}
            </span>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900">{{ staff.name }}</h3>
            <p class="text-sm text-gray-500">{{ staff.email }}</p>
            <span 
              :class="[
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1',
                staff.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              ]"
            >
              {{ staff.role === 'admin' ? 'Admin' : 'Operator' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Permission Categories -->
      <div class="space-y-6">
        <div 
          v-for="category in permissionCategories" 
          :key="category.name"
          class="space-y-4"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-900 flex items-center">
              <component :is="category.icon" class="w-5 h-5 mr-2 text-gray-500" />
              {{ category.name }}
            </h4>
            <button
              @click="toggleCategoryAll(category)"
              class="text-xs text-blue-600 hover:text-blue-800"
            >
              {{ isAllCategorySelected(category) ? 'Batalkan Semua' : 'Pilih Semua' }}
            </button>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="permission in category.permissions" 
              :key="permission.key"
              class="flex items-center justify-between py-2 pl-4 border-l-2 border-gray-100"
            >
              <div>
                <label class="text-sm font-medium text-gray-900">{{ permission.label }}</label>
                <p class="text-sm text-gray-500">{{ permission.description }}</p>
                <div v-if="permission.dependencies && permission.dependencies.length > 0" class="mt-1">
                  <span class="text-xs text-orange-600">
                    Memerlukan: {{ getDependencyLabels(permission.dependencies).join(', ') }}
                  </span>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  :value="permission.key"
                  v-model="selectedPermissions"
                  :disabled="!canSelectPermission(permission)"
                  class="sr-only peer"
                  @change="handlePermissionChange(permission)"
                >
                <div 
                  :class="[
                    'w-11 h-6 rounded-full peer transition-colors',
                    canSelectPermission(permission) 
                      ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600' 
                      : 'bg-gray-100 cursor-not-allowed',
                    'peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all'
                  ]"
                ></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Summary -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-900 mb-2">Ringkasan Hak Akses</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-blue-700">Total Hak Akses:</span>
            <span class="font-medium text-blue-900 ml-1">{{ selectedPermissions.length }}</span>
          </div>
          <div>
            <span class="text-blue-700">Level Akses:</span>
            <span 
              :class="[
                'font-medium ml-1',
                getAccessLevel() === 'Full' ? 'text-red-600' :
                getAccessLevel() === 'High' ? 'text-orange-600' :
                getAccessLevel() === 'Medium' ? 'text-yellow-600' :
                'text-blue-600'
              ]"
            >
              {{ getAccessLevel() }}
            </span>
          </div>
        </div>
        
        <div v-if="selectedPermissions.length > 0" class="mt-3">
          <p class="text-sm text-blue-700 mb-2">Hak akses yang dipilih:</p>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="permissionKey in selectedPermissions" 
              :key="permissionKey"
              class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ getPermissionLabel(permissionKey) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <UiActionButton
          @click="$emit('cancel')"
          variant="secondary"
          type="button"
        >
          Batal
        </UiActionButton>
        <UiActionButton
          @click="handleSubmit"
          variant="primary"
          :loading="loading"
        >
          Simpan Hak Akses
        </UiActionButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
interface Permission {
  key: string
  label: string
  description: string
  level: 'low' | 'medium' | 'high' | 'critical'
  dependencies?: string[]
  roleRestrictions?: string[]
}

interface PermissionCategory {
  name: string
  icon: any
  permissions: Permission[]
}

interface Props {
  modelValue: boolean
  staff?: any
}

const props = withDefaults(defineProps<Props>(), {
  staff: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [permissions: string[]]
  cancel: []
}>()

// State
const selectedPermissions = ref<string[]>([])
const loading = ref(false)

// Permission definitions
const permissionCategories: PermissionCategory[] = [
  {
    name: 'Manajemen Antrian',
    icon: 'QueueListIcon',
    permissions: [
      {
        key: 'view_queue',
        label: 'Lihat Antrian',
        description: 'Dapat melihat daftar antrian dan statusnya',
        level: 'low'
      },
      {
        key: 'manage_queue',
        label: 'Kelola Antrian',
        description: 'Dapat memanggil nomor, skip, dan mengelola antrian',
        level: 'medium',
        dependencies: ['view_queue']
      },
      {
        key: 'call_queue',
        label: 'Panggil Antrian',
        description: 'Dapat memanggil nomor antrian berikutnya',
        level: 'medium',
        dependencies: ['view_queue']
      },
      {
        key: 'reset_queue',
        label: 'Reset Antrian',
        description: 'Dapat mereset nomor antrian (hati-hati)',
        level: 'high',
        dependencies: ['manage_queue'],
        roleRestrictions: ['admin']
      }
    ]
  },
  {
    name: 'Manajemen Loket',
    icon: 'BuildingOfficeIcon',
    permissions: [
      {
        key: 'view_counters',
        label: 'Lihat Loket',
        description: 'Dapat melihat daftar loket dan statusnya',
        level: 'low'
      },
      {
        key: 'manage_counters',
        label: 'Kelola Loket',
        description: 'Dapat menambah, edit, dan menghapus loket',
        level: 'high',
        dependencies: ['view_counters'],
        roleRestrictions: ['admin']
      },
      {
        key: 'open_close_counters',
        label: 'Buka/Tutup Loket',
        description: 'Dapat membuka dan menutup operasional loket',
        level: 'medium',
        dependencies: ['view_counters']
      }
    ]
  },
  {
    name: 'Laporan & Data',
    icon: 'ChartBarIcon',
    permissions: [
      {
        key: 'view_reports',
        label: 'Lihat Laporan',
        description: 'Dapat mengakses dan melihat laporan dasar',
        level: 'medium'
      },
      {
        key: 'view_detailed_reports',
        label: 'Laporan Detail',
        description: 'Dapat melihat laporan detail dan analitik',
        level: 'high',
        dependencies: ['view_reports'],
        roleRestrictions: ['admin']
      },
      {
        key: 'export_data',
        label: 'Export Data',
        description: 'Dapat mengunduh dan export data laporan',
        level: 'high',
        dependencies: ['view_reports']
      },
      {
        key: 'delete_data',
        label: 'Hapus Data',
        description: 'Dapat menghapus data historis (sangat hati-hati)',
        level: 'critical',
        dependencies: ['view_reports'],
        roleRestrictions: ['admin']
      }
    ]
  },
  {
    name: 'Administrasi',
    icon: 'CogIcon',
    permissions: [
      {
        key: 'view_settings',
        label: 'Lihat Pengaturan',
        description: 'Dapat melihat pengaturan sistem',
        level: 'low'
      },
      {
        key: 'manage_settings',
        label: 'Kelola Pengaturan',
        description: 'Dapat mengubah pengaturan sistem',
        level: 'high',
        dependencies: ['view_settings'],
        roleRestrictions: ['admin']
      },
      {
        key: 'manage_staff',
        label: 'Kelola Staf',
        description: 'Dapat menambah, edit, dan menghapus staf',
        level: 'critical',
        roleRestrictions: ['admin']
      },
      {
        key: 'system_backup',
        label: 'Backup Sistem',
        description: 'Dapat melakukan backup dan restore data',
        level: 'critical',
        dependencies: ['manage_settings'],
        roleRestrictions: ['admin']
      }
    ]
  }
]

// Methods
const getInitials = (name: string) => {
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase()
}

const canSelectPermission = (permission: Permission): boolean => {
  // Check role restrictions
  if (permission.roleRestrictions && props.staff) {
    if (!permission.roleRestrictions.includes(props.staff.role)) {
      return false
    }
  }
  
  // Check if all dependencies are selected
  if (permission.dependencies) {
    return permission.dependencies.every(dep => selectedPermissions.value.includes(dep))
  }
  
  return true
}

const handlePermissionChange = (permission: Permission) => {
  if (!selectedPermissions.value.includes(permission.key)) {
    // Adding permission - add dependencies automatically
    if (permission.dependencies) {
      permission.dependencies.forEach(dep => {
        if (!selectedPermissions.value.includes(dep)) {
          selectedPermissions.value.push(dep)
        }
      })
    }
  } else {
    // Removing permission - remove dependents
    removePermissionWithDependents(permission.key)
  }
}

const removePermissionWithDependents = (permissionKey: string) => {
  // Find all permissions that depend on this one
  const dependents = getAllPermissions().filter(p => 
    p.dependencies?.includes(permissionKey) && selectedPermissions.value.includes(p.key)
  )
  
  // Remove dependents first
  dependents.forEach(dependent => {
    removePermissionWithDependents(dependent.key)
  })
  
  // Remove the permission itself
  const index = selectedPermissions.value.indexOf(permissionKey)
  if (index > -1) {
    selectedPermissions.value.splice(index, 1)
  }
}

const getAllPermissions = (): Permission[] => {
  return permissionCategories.flatMap(category => category.permissions)
}

const toggleCategoryAll = (category: PermissionCategory) => {
  const availablePermissions = category.permissions.filter(p => canSelectPermission(p))
  const allSelected = availablePermissions.every(p => selectedPermissions.value.includes(p.key))
  
  if (allSelected) {
    // Remove all permissions in this category
    availablePermissions.forEach(p => {
      removePermissionWithDependents(p.key)
    })
  } else {
    // Add all available permissions in this category
    availablePermissions.forEach(p => {
      if (!selectedPermissions.value.includes(p.key)) {
        selectedPermissions.value.push(p.key)
        // Add dependencies
        if (p.dependencies) {
          p.dependencies.forEach(dep => {
            if (!selectedPermissions.value.includes(dep)) {
              selectedPermissions.value.push(dep)
            }
          })
        }
      }
    })
  }
}

const isAllCategorySelected = (category: PermissionCategory): boolean => {
  const availablePermissions = category.permissions.filter(p => canSelectPermission(p))
  return availablePermissions.length > 0 && availablePermissions.every(p => selectedPermissions.value.includes(p.key))
}

const getPermissionLabel = (permissionKey: string): string => {
  const permission = getAllPermissions().find(p => p.key === permissionKey)
  return permission?.label || permissionKey
}

const getDependencyLabels = (dependencies: string[]): string[] => {
  return dependencies.map(dep => getPermissionLabel(dep))
}

const getAccessLevel = (): string => {
  if (selectedPermissions.value.length === 0) return 'None'
  
  const permissions = getAllPermissions().filter(p => selectedPermissions.value.includes(p.key))
  const hasCritical = permissions.some(p => p.level === 'critical')
  const hasHigh = permissions.some(p => p.level === 'high')
  const hasMedium = permissions.some(p => p.level === 'medium')
  
  if (hasCritical) return 'Full'
  if (hasHigh) return 'High'
  if (hasMedium) return 'Medium'
  return 'Basic'
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    emit('submit', selectedPermissions.value)
  } finally {
    loading.value = false
  }
}

const initializePermissions = () => {
  if (props.staff?.permissions) {
    selectedPermissions.value = [...props.staff.permissions]
  } else {
    selectedPermissions.value = []
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializePermissions()
  }
})

watch(() => props.staff, () => {
  if (props.modelValue) {
    initializePermissions()
  }
}, { immediate: true })
</script>