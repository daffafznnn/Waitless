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
        <div class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <!-- Header -->
          <div class="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-purple-50 to-white">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ isEditing ? 'Edit Loket' : 'Tambah Loket Baru' }}
                </h3>
                <p class="text-sm text-gray-500 mt-0.5">
                  {{ locationName }}
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
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
            <!-- Nama Loket -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-gray-700">
                Nama Loket <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="Contoh: Loket Pelayanan Umum"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                :class="{ 'border-red-300 focus:border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="text-xs text-red-600">{{ errors.name }}</p>
            </div>

            <!-- 2 Columns: Prefix & Kapasitas -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">
                  Prefix Antrian <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.prefix"
                  type="text"
                  placeholder="A"
                  maxlength="3"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm uppercase"
                  :class="{ 'border-red-300 focus:border-red-500': errors.prefix }"
                />
                <p v-if="errors.prefix" class="text-xs text-red-600">{{ errors.prefix }}</p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Kapasitas/Hari</label>
                <input
                  v-model.number="formData.capacityPerDay"
                  type="number"
                  min="1"
                  max="999"
                  placeholder="100"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <!-- 2 Columns: Jam Buka & Tutup -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Jam Buka</label>
                <input
                  v-model="formData.openTime"
                  type="time"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Jam Tutup</label>
                <input
                  v-model="formData.closeTime"
                  type="time"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <!-- Deskripsi -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea
                v-model="formData.description"
                rows="2"
                placeholder="Deskripsi layanan loket ini..."
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm resize-none"
              ></textarea>
            </div>

            <!-- Status Toggle (only for edit) -->
            <div v-if="isEditing" class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p class="text-sm font-medium text-gray-900">Status Loket</p>
                <p class="text-xs text-gray-500">{{ formData.isActive ? 'Loket aktif menerima antrian' : 'Loket tidak aktif' }}</p>
              </div>
              <button
                type="button"
                @click="formData.isActive = !formData.isActive"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  formData.isActive ? 'bg-purple-600' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  ]"
                ></span>
              </button>
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
              class="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditing ? 'Perbarui Loket' : 'Tambah Loket' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Counter } from '~/types'

interface CounterFormData {
  name: string
  description: string
  prefix: string
  openTime: string
  closeTime: string
  capacityPerDay: number
  isActive: boolean
}

interface Props {
  modelValue: boolean
  counter?: Counter | null
  locationName?: string
}

const props = withDefaults(defineProps<Props>(), {
  counter: null,
  locationName: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: Partial<CounterFormData>]
  cancel: []
}>()

// Form data
const formData = reactive<CounterFormData>({
  name: '',
  description: '',
  prefix: '',
  openTime: '08:00',
  closeTime: '17:00',
  capacityPerDay: 100,
  isActive: true
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

// Computed
const isEditing = computed(() => !!props.counter)

const isFormValid = computed(() => {
  return formData.name.trim().length >= 2 &&
         formData.prefix.trim().length >= 1
})

// Methods
const validateForm = (): boolean => {
  errors.value = {}
  
  if (!formData.name.trim()) {
    errors.value.name = 'Nama loket harus diisi'
  } else if (formData.name.trim().length < 2) {
    errors.value.name = 'Nama loket minimal 2 karakter'
  }
  
  if (!formData.prefix.trim()) {
    errors.value.prefix = 'Prefix antrian harus diisi'
  }
  
  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    description: '',
    prefix: '',
    openTime: '08:00',
    closeTime: '17:00',
    capacityPerDay: 100,
    isActive: true
  })
  errors.value = {}
}

const populateForm = () => {
  if (props.counter) {
    Object.assign(formData, {
      name: props.counter.name || '',
      description: props.counter.description || '',
      prefix: props.counter.prefix || '',
      openTime: props.counter.open_time?.substring(0, 5) || '08:00',
      closeTime: props.counter.close_time?.substring(0, 5) || '17:00',
      capacityPerDay: props.counter.capacity_per_day || 100,
      isActive: props.counter.is_active ?? true
    })
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    emit('submit', {
      name: formData.name.trim(),
      description: formData.description.trim(),
      prefix: formData.prefix.trim().toUpperCase(),
      openTime: formData.openTime + ':00',
      closeTime: formData.closeTime + ':00',
      capacityPerDay: formData.capacityPerDay,
      isActive: formData.isActive
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
watch(() => props.counter, () => {
  if (props.modelValue) {
    if (props.counter) {
      populateForm()
    } else {
      resetForm()
    }
  }
}, { immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    if (props.counter) {
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