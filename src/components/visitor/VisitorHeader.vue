<template>
  <header class="bg-white/95 backdrop-blur-sm shadow-sm px-4 py-3 sticky top-0 z-10 safe-area-top border-b border-gray-100">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Back Button -->
        <button
          v-if="showBack"
          class="w-10 h-10 flex items-center justify-center -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all active:scale-95"
          @click="handleBack"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Title & Subtitle -->
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-gray-900 truncate">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-xs text-gray-500 truncate mt-0.5">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <slot name="before-actions"></slot>
        <slot name="actions">
          <!-- Default Actions: Notification + Profile -->
          
          <!-- Notification Icon -->
          <button 
            v-if="showNotification" 
            class="relative w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <!-- Notification dot -->
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          <!-- Profile Avatar / Login -->
          <NuxtLink 
            v-if="showProfile"
            :to="isAuthenticated ? '/profile' : '/login'"
            class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all active:scale-95 border border-gray-100"
            :class="isAuthenticated 
              ? 'bg-white shadow-sm hover:shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            <!-- Not authenticated: Show generic icon -->
            <svg v-if="!isAuthenticated" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            
            <!-- Authenticated: Show Avatar or Initials -->
            <ClientOnly v-else>
              <img 
                v-if="userAvatar && !imageError"
                :src="userAvatar" 
                :alt="userName"
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
                @error="handleImageError"
              />
              <div 
                v-else
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              >
                <span class="text-sm font-bold">{{ userInitials }}</span>
              </div>
              <template #fallback>
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <span class="text-sm font-bold">{{ userInitials }}</span>
                </div>
              </template>
            </ClientOnly>
          </NuxtLink>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  title: string
  subtitle?: string
  showNotification?: boolean
  showProfile?: boolean
  userName?: string
  userAvatar?: string
  isAuthenticated?: boolean
  showBack?: boolean
  backTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  showNotification: true,
  showProfile: true,
  userName: 'Tamu',
  userAvatar: '',
  isAuthenticated: false,
  showBack: false,
  backTo: ''
})

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()
const imageError = ref(false)

const userInitials = computed(() => {
  if (!props.userName || props.userName === 'Tamu') return '?'
  return props.userName.charAt(0).toUpperCase()
})

const handleImageError = () => {
  imageError.value = true
}

const handleBack = () => {
  if (props.backTo) {
    navigateTo(props.backTo)
  } else {
    emit('back')
    router.back()
  }
}
</script>

