<template>
  <UiModal
    v-model="isOpen"
    :title="isEdit ? 'Edit Loket' : 'Tambah Loket Baru'"
    :subtitle="isEdit ? 'Update informasi loket' : 'Buat loket pelayanan baru'"
    size="2xl"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Counter Name -->
      <UiFormField
        label="Nama Loket"
        type="text"
        v-model="formData.name"
        placeholder="Contoh: Loket Pendaftaran"
        :error="formErrors.name"
        width="w-full"
        required
      />

      <UiFormField
        label="Kode Loket"
        type="text"
        v-model="formData.prefix"
        placeholder="Contoh: A, B, C"
        :error="formErrors.prefix"
        width="w-full"
        required
      />

      <!-- Location Selection -->
      <UiFormField
        v-if="!isEdit"
        label="Lokasi"
        type="select"
        v-model="formData.locationId"
        placeholder="Pilih lokasi"
        :options="locationOptions"
        :error="formErrors.locationId"
        width="w-full"
        required
      />

      <!-- Operating Hours -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UiFormField
          label="Jam Buka"
          type="time"
          v-model="formData.openTime"
          :error="formErrors.openTime"
          required
        />

        <UiFormField
          label="Jam Tutup"
          type="time"
          v-model="formData.closeTime"
          :error="formErrors.closeTime"
          required
        />

        <UiFormField
          label="Kapasitas per Hari"
          type="number"
          v-model="formData.capacityPerDay"
          placeholder="100"
          min="1"
          max="1000"
          :error="formErrors.capacityPerDay"
          required
        />
      </div>

      <!-- Description - Full width -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Deskripsi Loket
        </label>
        <textarea
          v-model="formData.description"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
          placeholder="Deskripsi singkat tentang loket (opsional)"
        ></textarea>
        <p v-if="formErrors.description" class="text-sm text-red-600">
          {{ formErrors.description }}
        </p>
      </div>

      <!-- Closed Message - Full width -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Pesan Loket Tutup
        </label>
        <textarea
          v-model="formData.closedMessage"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
          placeholder="Pesan yang akan ditampilkan ketika loket tutup (opsional)"
        ></textarea>
        <p v-if="formErrors.closedMessage" class="text-sm text-red-600">
          {{ formErrors.closedMessage }}
        </p>
      </div>

      <!-- Status - Full width alignment (only for edit) -->
      <div v-if="isEdit" class="flex items-center space-x-3 pt-2">
        <input
          id="is-active"
          v-model="formData.isActive"
          type="checkbox"
          class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label for="is-active" class="text-sm font-medium text-gray-700">
          Loket Aktif
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UiActionButton
          variant="secondary"
          @click="handleCancel"
          :disabled="loading"
        >
          Batal
        </UiActionButton>

        <UiActionButton
          variant="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!isFormValid"
        >
          {{ isEdit ? "Update Loket" : "Buat Loket" }}
        </UiActionButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Counter, Location } from "~/types";

interface CounterFormData {
  name: string;
  prefix: string;
  locationId: string;
  openTime: string;
  closeTime: string;
  capacityPerDay: string;
  description: string;
  closedMessage: string;
  isActive: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface Props {
  modelValue: boolean;
  counter?: Counter | null;
  locations: Location[];
}

const props = withDefaults(defineProps<Props>(), {
  counter: null,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [data: CounterFormData];
  cancel: [];
}>();

// Reactive data
const loading = ref(false);
const formErrors = ref<FormErrors>({});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const isEdit = computed(() => !!props.counter);

// Form data
const formData = ref<CounterFormData>({
  name: "",
  prefix: "",
  locationId: "",
  openTime: "08:00",
  closeTime: "17:00",
  capacityPerDay: "50",
  description: "",
  closedMessage: "",
  isActive: true,
});

// Computed options
const locationOptions = computed(() =>
  props.locations.map((location) => ({
    value: location.id,
    label: location.name,
  }))
);

// Form validation
const isFormValid = computed(() => {
  return !!(
    formData.value.name &&
    formData.value.prefix &&
    formData.value.locationId &&
    formData.value.openTime &&
    formData.value.closeTime &&
    formData.value.capacityPerDay &&
    parseInt(formData.value.capacityPerDay) > 0
  );
});

// Methods
const resetForm = () => {
  formData.value = {
    name: "",
    prefix: "",
    locationId: "",
    openTime: "08:00",
    closeTime: "17:00",
    capacityPerDay: "50",
    description: "",
    closedMessage: "",
    isActive: true,
  };
  formErrors.value = {};
};

const populateForm = () => {
  if (props.counter) {
    formData.value = {
      name: props.counter.name,
      prefix: props.counter.prefix,
      locationId: props.counter.location_id.toString(),
      openTime: props.counter.open_time.slice(0, 5), // Convert HH:MM:SS to HH:MM
      closeTime: props.counter.close_time.slice(0, 5), // Convert HH:MM:SS to HH:MM
      capacityPerDay: props.counter.capacity_per_day.toString(),
      description: props.counter.description || "",
      closedMessage: "", // Add this field to Counter type if needed
      isActive: props.counter.is_active,
    };
  }
};

const validateForm = (): boolean => {
  formErrors.value = {};

  // Name validation
  if (!formData.value.name.trim()) {
    formErrors.value.name = "Nama loket harus diisi";
  } else if (formData.value.name.length < 3) {
    formErrors.value.name = "Nama loket minimal 3 karakter";
  }

  // Prefix validation
  if (!formData.value.prefix.trim()) {
    formErrors.value.prefix = "Kode loket harus diisi";
  } else if (formData.value.prefix.length > 3) {
    formErrors.value.prefix = "Kode loket maksimal 3 karakter";
  }

  // Location validation
  if (!formData.value.locationId && !isEdit.value) {
    formErrors.value.locationId = "Lokasi harus dipilih";
  }

  // Time validation
  if (!formData.value.openTime) {
    formErrors.value.openTime = "Jam buka harus diisi";
  }

  if (!formData.value.closeTime) {
    formErrors.value.closeTime = "Jam tutup harus diisi";
  }

  if (formData.value.openTime && formData.value.closeTime) {
    if (formData.value.openTime >= formData.value.closeTime) {
      formErrors.value.closeTime = "Jam tutup harus lebih besar dari jam buka";
    }
  }

  // Capacity validation
  const capacity = parseInt(formData.value.capacityPerDay);
  if (!formData.value.capacityPerDay || isNaN(capacity) || capacity < 1) {
    formErrors.value.capacityPerDay = "Kapasitas harus berupa angka positif";
  } else if (capacity > 1000) {
    formErrors.value.capacityPerDay = "Kapasitas maksimal 1000 per hari";
  }

  return Object.keys(formErrors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  try {
    // Convert time format from HH:MM to HH:MM:SS for backend
    const submitData = {
      ...formData.value,
      openTime: formData.value.openTime + ':00',
      closeTime: formData.value.closeTime + ':00'
    };
    emit("submit", submitData);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
  isOpen.value = false;
};

// Watchers
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.counter) {
        populateForm();
      } else {
        resetForm();
      }
    }
  }
);

watch(
  () => props.counter,
  () => {
    if (props.modelValue && props.counter) {
      populateForm();
    }
  }
);
</script>
