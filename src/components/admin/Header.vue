<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left side: Page title and breadcrumb -->
      <div class="flex-1">
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <button
            @click="$emit('toggle-sidebar')"
            class="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          
          <!-- Page title -->
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">
              {{ pageTitle }}
            </h1>
            <nav class="flex text-sm text-gray-500 mt-1" v-if="breadcrumbs.length > 0">
              <span v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
                <span v-if="index > 0" class="mx-2">/</span>
                <NuxtLink 
                  v-if="crumb.to" 
                  :to="crumb.to" 
                  class="hover:text-gray-700"
                >
                  {{ crumb.name }}
                </NuxtLink>
                <span v-else>{{ crumb.name }}</span>
              </span>
            </nav>
          </div>
        </div>
      </div>

      <!-- Right side: Search, notifications, and profile -->
      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="relative hidden md:block">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="Search..."
            class="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <!-- Notifications -->
        <div class="relative">
          <button
            @click="toggleNotifications"
            class="relative inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <!-- Notification badge -->
            <span v-if="notificationCount > 0" class="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <span class="text-xs font-medium text-white">{{ notificationCount > 9 ? '9+' : notificationCount }}</span>
            </span>
          </button>

          <!-- Notifications dropdown -->
          <div
            v-if="showNotifications"
            class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div class="py-1">
              <div class="px-4 py-2 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-900">Notifications</h3>
              </div>
              <div class="max-h-64 overflow-y-auto">
                <div v-if="notifications.length === 0" class="px-4 py-3 text-sm text-gray-500 text-center">
                  No new notifications
                </div>
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p class="text-sm text-gray-900">{{ notification.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTime(notification.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile dropdown -->
        <div class="relative">
          <button
            @click="toggleProfile"
            class="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span class="text-white font-medium text-sm">
                {{ authStore.user?.name?.charAt(0) || 'A' }}
              </span>
            </div>
            <div class="hidden md:block text-left">
              <p class="text-sm font-medium text-gray-900">
                {{ authStore.getDisplayName }}
              </p>
              <p class="text-xs text-gray-500">
                {{ authStore.user?.role }}
              </p>
            </div>
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Profile dropdown menu -->
          <div
            v-if="showProfile"
            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div class="py-1">
              <NuxtLink
                to="/admin/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="showProfile = false"
              >
                Your Profile
              </NuxtLink>
              <NuxtLink
                to="/admin/settings"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="showProfile = false"
              >
                Settings
              </NuxtLink>
              <div class="border-t border-gray-100"></div>
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Breadcrumb {
  name: string
  to?: string
}

interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read?: boolean
}

const props = defineProps<{
  pageTitle?: string
  breadcrumbs?: Breadcrumb[]
}>()

defineEmits<{
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const { logout } = useAuth()
const route = useRoute()

// Reactive data
const searchQuery = ref('')
const showNotifications = ref(false)
const showProfile = ref(false)

// Sample notifications - replace with real data
const notifications = ref<Notification[]>([
  {
    id: '1',
    title: 'New Queue Created',
    message: 'Restaurant ABC has created a new queue',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Queue Alert',
    message: 'Queue wait time exceeded 30 minutes',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  }
])

// Computed
const notificationCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Methods
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // Implement search functionality
    console.log('Searching for:', searchQuery.value)
    // You can emit an event or navigate to search results
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showProfile.value = false
}

const toggleProfile = () => {
  showProfile.value = !showProfile.value
  showNotifications.value = false
}

const handleLogout = async () => {
  try {
    await logout()
    await navigateTo('/admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showNotifications.value = false
      showProfile.value = false
    }
  })
})
</script>