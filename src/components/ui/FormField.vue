<template>
  <div class="flex flex-col gap-2 items-start" :class="width || 'w-[264px] max-md:w-[calc(50%_-_8px)] max-sm:w-full'">
    <label v-if="label" class="flex justify-start items-center h-5">
      <div class="text-sm font-medium text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500 ml-1">*</span>
      </div>
    </label>
    
    <!-- Select Field -->
    <div v-if="type === 'select'" class="relative w-full">
      <select
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        :class="selectClasses"
        :required="required"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M6.27598 8.65194C6.44789 8.48655 6.67844 8.39617 6.91695 8.40067C7.15547 8.40517 7.38244 8.50418 7.54798 8.67594L12 13.4015L16.452 8.67594C16.5329 8.58673 16.6309 8.51467 16.7402 8.46403C16.8495 8.41339 16.9678 8.3852 17.0882 8.38113C17.2086 8.37706 17.3286 8.3972 17.441 8.44035C17.5535 8.4835 17.6561 8.54878 17.7429 8.63233C17.8296 8.71587 17.8987 8.81599 17.9461 8.92673C17.9935 9.03748 18.0181 9.15661 18.0186 9.27705C18.0191 9.3975 17.9954 9.51682 17.9489 9.62794C17.9024 9.73905 17.8341 9.83971 17.748 9.92394L12.648 15.3239C12.564 15.411 12.4634 15.4803 12.352 15.5277C12.2407 15.575 12.121 15.5994 12 15.5994C11.879 15.5994 11.7593 15.575 11.6479 15.5277C11.5366 15.4803 11.4359 15.411 11.352 15.3239L6.25198 9.92394C6.08659 9.75203 5.99621 9.52149 6.00071 9.28298C6.00521 9.04446 6.10422 8.81749 6.27598 8.65194Z" fill="black"/>
        </svg>
      </div>
    </div>
    
    <!-- Input Field -->
    <div v-else class="relative w-full">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :required="required"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :class="inputClasses"
      />
      
      <!-- Search Icon -->
      <div v-if="type === 'search'" class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_search)">
            <path d="M13 6.5C13 7.93437 12.5344 9.25938 11.75 10.3344L15.7063 14.2937C16.0969 14.6844 16.0969 15.3188 15.7063 15.7094C15.3156 16.1 14.6812 16.1 14.2906 15.7094L10.3344 11.75C9.25938 12.5375 7.93437 13 6.5 13C2.90937 13 0 10.0906 0 6.5C0 2.90937 2.90937 0 6.5 0C10.0906 0 13 2.90937 13 6.5ZM6.5 11C7.09095 11 7.67611 10.8836 8.22208 10.6575C8.76804 10.4313 9.26412 10.0998 9.68198 9.68198C10.0998 9.26412 10.4313 8.76804 10.6575 8.22208C10.8836 7.67611 11 7.09095 11 6.5C11 5.90905 10.8836 5.32389 10.6575 4.77792C10.4313 4.23196 10.0998 3.73588 9.68198 3.31802C9.26412 2.90016 8.76804 2.56869 8.22208 2.34254C7.67611 2.1164 7.09095 2 6.5 2C5.90905 2 5.32389 2.1164 4.77792 2.34254C4.23196 2.56869 3.73588 2.90016 3.31802 3.31802C2.90016 3.73588 2.56869 4.23196 2.34254 4.77792C2.1164 5.32389 2 5.90905 2 6.5C2 7.09095 2.1164 7.67611 2.34254 8.22208C2.56869 8.76804 2.90016 9.26412 3.31802 9.68198C3.73588 10.0998 4.23196 10.4313 4.77792 10.6575C5.32389 10.8836 5.90905 11 6.5 11Z" fill="#9CA3AF"/>
          </g>
          <defs>
            <clipPath id="clip0_search">
              <path d="M0 0H16V16H0V0Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </div>
      
      <!-- Calendar Icon -->
      <div v-if="type === 'date'" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 3V5.25M17.25 3V5.25M3 18.75V7.5C3 6.90326 3.23705 6.33097 3.65901 5.90901C4.08097 5.48705 4.65326 5.25 5.25 5.25H18.75C19.3467 5.25 19.919 5.48705 20.341 5.90901C20.7629 6.33097 21 6.90326 21 7.5V18.75M3 18.75C3 19.3467 3.23705 19.919 3.65901 20.341C4.08097 20.7629 4.65326 21 5.25 21H18.75C19.3467 21 19.919 20.7629 20.341 20.341C20.7629 19.919 21 19.3467 21 18.75M3 18.75V11.25C3 10.6533 3.23705 10.081 3.65901 9.65901C4.08097 9.23705 4.65326 9 5.25 9H18.75C19.3467 9 19.919 9.23705 20.341 9.65901C20.7629 10.081 21 10.6533 21 11.25V18.75" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <p v-if="error" class="text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string | number
  label: string
}

interface Props {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'select' | 'search'
  modelValue?: string | number
  placeholder?: string
  options?: Option[] | (string | number)[]
  width?: string
  error?: string
  required?: boolean
  min?: string | number
  max?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputClasses = computed(() => {
  const baseClasses = [
    'flex',
    'items-center',
    'h-11',
    'rounded-lg',
    'border',
    'border-solid',
    'w-full',
    'text-base',
    'leading-6',
    'text-black',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-600',
    'focus:border-transparent'
  ]
  
  // Add error styling
  if (props.error) {
    baseClasses.push('border-red-300', 'focus:ring-red-500', 'focus:border-red-500')
  } else {
    baseClasses.push('border-gray-300')
  }
  
  // Adjust padding based on icons
  if (props.type === 'search') {
    baseClasses.push('px-10', 'placeholder-gray-400')
  } else if (props.type === 'date') {
    baseClasses.push('px-3', 'pr-10')
  } else {
    baseClasses.push('px-3')
  }
  
  return baseClasses
})

const selectClasses = computed(() => {
  const baseClasses = [
    'flex',
    'justify-between',
    'items-center',
    'px-3',
    'h-10',
    'rounded-lg',
    'border',
    'border-solid',
    'w-full',
    'text-base',
    'text-black',
    'appearance-none',
    'bg-white',
    'pr-10',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-600',
    'focus:border-transparent'
  ]
  
  // Add error styling
  if (props.error) {
    baseClasses.push('border-red-300', 'focus:ring-red-500', 'focus:border-red-500')
  } else {
    baseClasses.push('border-gray-300')
  }
  
  return baseClasses
})

const getOptionValue = (option: Option | string | number) => {
  if (typeof option === 'object') {
    return option.value
  }
  return option
}

const getOptionLabel = (option: Option | string | number) => {
  if (typeof option === 'object') {
    return option.label
  }
  return String(option)
}
</script>