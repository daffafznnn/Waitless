<template>
  <header class="bg-white shadow-xs px-4 py-4 sticky top-0 z-10 safe-area-top">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Back Button -->
        <button
          v-if="showBack"
          class="w-8 h-11 flex items-center justify-center -ml-2 text-surface-600 hover:text-surface-900 transition-colors"
          @click="handleBack"
        >
          <svg class="w-4 h-[18px]" viewBox="0 0 16 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.330444 8.20547C-0.109009 8.64492 -0.109009 9.35859 0.330444 9.79805L5.95544 15.423C6.3949 15.8625 7.10857 15.8625 7.54802 15.423C7.98748 14.9836 7.98748 14.2699 7.54802 13.8305L3.83904 10.125H14.625C15.2472 10.125 15.75 9.62227 15.75 9C15.75 8.37774 15.2472 7.875 14.625 7.875H3.84255L7.54451 4.16953C7.98396 3.73008 7.98396 3.01641 7.54451 2.57695C7.10505 2.1375 6.39138 2.1375 5.95193 2.57695L0.326929 8.20195L0.330444 8.20547Z"/>
          </svg>
        </button>

        <!-- Title & Subtitle -->
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-surface-900 mb-0.5 truncate">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm text-surface-600 truncate">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <slot name="actions">
          <!-- Default Actions: Notification + Profile -->
          
          <!-- Notification Icon -->
          <button v-if="showNotification" class="relative group">
            <svg
              class="w-4 h-[18px] text-surface-600 group-hover:text-primary-600 transition-colors"
              viewBox="0 0 16 18"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0ZM7.87495 3.375H8.1562C10.1742 3.375 11.8124 5.01328 11.8124 7.03125V8.20547C11.8124 9.88945 12.3011 11.5312 13.2081 12.9375H2.54174C3.44877 11.5312 3.93745 9.88945 3.93745 8.20547V7.03125C3.93745 5.01328 5.57573 3.375 7.5937 3.375H7.87495ZM10.1249 15.75H7.87495H5.62495C5.62495 16.3477 5.86049 16.9207 6.28237 17.3426C6.70424 17.7645 7.27729 18 7.87495 18C8.4726 18 9.04565 17.7645 9.46752 17.3426C9.8894 16.9207 10.1249 16.3477 10.1249 15.75Z"/>
            </svg>
          </button>

          <!-- Profile Avatar / Login -->
          <NuxtLink 
            v-if="showProfile"
            :to="isAuthenticated ? '/profile' : '/login'"
            class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden hover:bg-primary-200 transition-colors"
          >
            <span v-if="!isAuthenticated" class="text-primary-600 text-sm font-medium">?</span>
            <span v-else class="text-primary-600 text-sm font-bold">{{ userInitials }}</span>
          </NuxtLink>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  subtitle?: string
  showNotification?: boolean
  showProfile?: boolean
  userName?: string
  isAuthenticated?: boolean
  showBack?: boolean
  backTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  showNotification: true,
  showProfile: true,
  userName: 'Tamu',
  isAuthenticated: false,
  showBack: false,
  backTo: ''
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()

const userInitials = computed(() => {
  if (!props.userName || props.userName === 'Tamu') return '?'
  return props.userName.charAt(0).toUpperCase()
})

const handleBack = () => {
  if (props.backTo) {
    navigateTo(props.backTo)
  } else {
    emit('back')
    router.back()
  }
}
</script>
