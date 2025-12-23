<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <!-- Header -->
          <div class="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ isEditing ? 'Edit Cabang' : 'Tambah Cabang Baru' }}
                </h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  {{ isEditing ? 'Perbarui informasi cabang' : 'Isi informasi cabang baru' }}
                </p>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                @click="closeModal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <!-- Informasi Dasar Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div class="p-1.5 bg-blue-100 rounded-lg">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                </div>
                <h4 class="text-sm font-medium text-gray-900">Informasi Dasar</h4>
              </div>
              
              <!-- Nama Cabang -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">
                  Nama Cabang <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="Contoh: Cabang Bandung Utara"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.name }"
                />
                <p v-if="errors.name" class="text-xs text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Alamat Lengkap -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">
                  Alamat Lengkap <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="formData.address"
                  rows="2"
                  placeholder="Masukkan alamat lengkap cabang"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                  :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.address }"
                ></textarea>
                <p v-if="errors.address" class="text-xs text-red-600">{{ errors.address }}</p>
              </div>

              <!-- 2 Columns: Kota & Kode Pos -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">
                    Kota <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.city"
                    type="text"
                    placeholder="Nama kota"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.city }"
                  />
                  <p v-if="errors.city" class="text-xs text-red-600">{{ errors.city }}</p>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">Kode Pos</label>
                  <input
                    v-model="formData.postal_code"
                    type="text"
                    placeholder="12345"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <!-- 2 Columns: Phone & Email -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    placeholder="+62 21 1234567"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.phone }"
                  />
                  <p v-if="errors.phone" class="text-xs text-red-600">{{ errors.phone }}</p>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="cabang@company.com"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500/20': errors.email }"
                  />
                  <p v-if="errors.email" class="text-xs text-red-600">{{ errors.email }}</p>
                </div>
              </div>
            </div>

            <!-- Jam Operasional Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div class="p-1.5 bg-emerald-100 rounded-lg">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 class="text-sm font-medium text-gray-900">Jam Operasional</h4>
              </div>

              <!-- 2 Columns: Jam Buka & Jam Tutup -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">
                    Jam Buka <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.open_time"
                    type="time"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-gray-700">
                    Jam Tutup <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.close_time"
                    type="time"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                  <p v-if="errors.close_time" class="text-xs text-red-600">{{ errors.close_time }}</p>
                </div>
              </div>
            </div>

            <!-- Pengaturan Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div class="p-1.5 bg-purple-100 rounded-lg">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h4 class="text-sm font-medium text-gray-900">Pengaturan</h4>
              </div>

              <!-- Status Toggle -->
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p class="text-sm font-medium text-gray-900">Status Cabang</p>
                  <p class="text-xs text-gray-500">{{ formData.is_active ? 'Cabang akan aktif dan terlihat' : 'Cabang tidak aktif' }}</p>
                </div>
                <button
                  type="button"
                  @click="formData.is_active = !formData.is_active"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    formData.is_active ? 'bg-blue-600' : 'bg-gray-300'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  ></span>
                </button>
              </div>

              <!-- Deskripsi -->
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                <textarea
                  v-model="formData.description"
                  rows="2"
                  placeholder="Deskripsi singkat tentang cabang ini"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                ></textarea>
              </div>
            </div>
          </form>

          <!-- Footer Actions -->
          <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleSubmit"
              :disabled="!isFormValid || loading"
              class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditing ? 'Perbarui Cabang' : 'Tambah Cabang' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ServiceLocation } from '~/types'

interface BranchFormData {
  name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  open_time: string
  close_time: string
  is_active: boolean
  description: string
}

interface Props {
  modelValue: boolean
  location?: ServiceLocation | null
}

const props = withDefaults(defineProps<Props>(), {
  location: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Partial<BranchFormData>]
  cancel: []
}>()

// Form data
const formData = reactive<BranchFormData>({
  name: '',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  open_time: '08:00',
  close_time: '17:00',
  is_active: true,
  description: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

// Computed
const isEditing = computed(() => !!props.location)

const isFormValid = computed(() => {
  return formData.name.trim().length >= 3 &&
         formData.address.trim().length >= 5 &&
         formData.city.trim().length >= 2 &&
         formData.open_time &&
         formData.close_time
})

// Methods
const validateForm = (): boolean => {
  errors.value = {}
  
  if (!formData.name.trim()) {
    errors.value.name = 'Nama cabang harus diisi'
  } else if (formData.name.trim().length < 3) {
    errors.value.name = 'Nama cabang minimal 3 karakter'
  }
  
  if (!formData.address.trim()) {
    errors.value.address = 'Alamat harus diisi'
  } else if (formData.address.trim().length < 5) {
    errors.value.address = 'Alamat minimal 5 karakter'
  }
  
  if (!formData.city.trim()) {
    errors.value.city = 'Kota harus diisi'
  }
  
  if (formData.phone && !/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
    errors.value.phone = 'Format nomor telepon tidak valid'
  }
  
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = 'Format email tidak valid'
  }
  
  if (formData.open_time && formData.close_time && formData.open_time >= formData.close_time) {
    errors.value.close_time = 'Jam tutup harus setelah jam buka'
  }
  
  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    open_time: '08:00',
    close_time: '17:00',
    is_active: true,
    description: ''
  })
  errors.value = {}
}

const populateForm = () => {
  if (props.location) {
    Object.assign(formData, {
      name: props.location.name || '',
      address: props.location.address || '',
      city: props.location.city || '',
      postal_code: '',
      phone: '',
      email: '',
      open_time: '08:00',
      close_time: '17:00',
      is_active: props.location.is_active ?? true,
      description: ''
    })
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    // Emit only the fields used by API
    emit('submit', {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      isActive: formData.is_active
    })
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

// Watchers
watch(() => props.location, () => {
  if (props.modelValue) {
    if (props.location) {
      populateForm()
    } else {
      resetForm()
    }
  }
}, { immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.location) {
      populateForm()
    } else {
      resetForm()
    }
  }
})

// Keyboard shortcut
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      closeModal()
    }
  }
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>