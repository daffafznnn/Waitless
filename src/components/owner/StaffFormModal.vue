<template>
  <UiModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEditing ? 'Edit Staf' : 'Tambah Staf Baru'"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="max-h-[70vh] overflow-y-auto px-1">
      <!-- Personal Information Section -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          Informasi Personal
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">
              Nama Lengkap <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Masukkan nama lengkap"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{'border-red-500': errors.name}"
            />
            <p v-if="errors.name" class="text-xs text-red-500 mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              placeholder="email@company.com"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{'border-red-500': errors.email}"
            />
            <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">
              Nomor Telepon
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              placeholder="+628123456789"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Account & Assignment Section -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Informasi Akun & Penugasan
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Role - Static Admin -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
            <div class="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 font-medium">
              Admin
            </div>
            <p class="text-xs text-gray-500 mt-1">Role staf otomatis ditetapkan sebagai Admin</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1.5">
              Cabang <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.branch_id"
              class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{'border-red-500': errors.branch_id}"
            >
              <option :value="null">Pilih cabang</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
            <p v-if="errors.branch_id" class="text-xs text-red-500 mt-1">{{ errors.branch_id }}</p>
          </div>
        </div>
      </div>

      <!-- Status Section -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Status & Pengaturan
        </h4>
        
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <label class="text-sm font-medium text-gray-900">Status Aktif</label>
            <p class="text-xs text-gray-500 mt-0.5">Aktifkan atau nonaktifkan akses staf</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="formData.is_active" class="sr-only peer">
            <div class="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="!isFormValid || loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Menyimpan...' : (isEditing ? 'Perbarui Staf' : 'Tambah Staf') }}
        </button>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
interface StaffFormData {
  name: string
  email: string
  phone: string
  branch_id: number | null
  is_active: boolean
}

interface Props {
  modelValue: boolean
  staff?: any
  branches?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  staff: null,
  branches: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: StaffFormData]
  cancel: []
}>()

// Form data
const formData = reactive<StaffFormData>({
  name: '',
  email: '',
  phone: '',
  branch_id: null,
  is_active: true
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

// Computed
const isEditing = computed(() => !!props.staff)

const isFormValid = computed(() => {
  return formData.name.trim().length >= 2 &&
         formData.email.includes('@') &&
         formData.branch_id !== null
})

// Methods
const validateForm = (): boolean => {
  errors.value = {}
  
  if (!formData.name.trim()) {
    errors.value.name = 'Nama lengkap harus diisi'
  } else if (formData.name.trim().length < 2) {
    errors.value.name = 'Nama minimal 2 karakter'
  }
  
  if (!formData.email) {
    errors.value.email = 'Email harus diisi'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = 'Format email tidak valid'
  }
  
  if (!formData.branch_id) {
    errors.value.branch_id = 'Cabang harus dipilih'
  }
  
  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    email: '',
    phone: '',
    branch_id: null,
    is_active: true
  })
  errors.value = {}
}

const populateForm = () => {
  if (props.staff) {
    Object.assign(formData, {
      name: props.staff.name || '',
      email: props.staff.email || '',
      phone: props.staff.phone || '',
      branch_id: props.staff.locations?.[0]?.id || null,
      is_active: props.staff.is_active ?? true
    })
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    emit('submit', { ...formData })
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.staff, () => {
  if (props.modelValue) {
    if (props.staff) {
      populateForm()
    } else {
      resetForm()
    }
  }
}, { immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.staff) {
      populateForm()
    } else {
      resetForm()
    }
  }
})
</script>