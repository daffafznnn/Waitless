<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left side: Page title and breadcrumb -->
      <div class="flex-1 min-w-0">
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
          <div class="min-w-0">
            <h1 class="text-xl font-semibold text-gray-900 truncate">
              {{ pageTitle }}
            </h1>
            <nav class="flex text-sm text-gray-500 mt-0.5" v-if="breadcrumbs.length > 0">
              <span v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
                <span v-if="index > 0" class="mx-1.5 text-gray-400">/</span>
                <NuxtLink 
                  v-if="crumb.to" 
                  :to="crumb.to" 
                  class="hover:text-gray-700"
                >
                  {{ crumb.name }}
                </NuxtLink>
                <span v-else class="text-gray-700">{{ crumb.name }}</span>
              </span>
            </nav>
          </div>
        </div>
      </div>

      <!-- Right side: Search, notifications, and profile -->
      <div class="flex items-center space-x-3">
        <!-- Search -->
        <div class="relative hidden md:block" ref="searchContainer">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg v-if="!searching" class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <svg v-else class="h-4 w-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
          <input
            v-model="searchQuery"
            @input="debouncedSearch"
            @focus="showSearchResults = true"
            type="text"
            placeholder="Cari nomor antrian..."
            class="block w-56 pl-9 pr-8 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          
          <!-- Search Results Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showSearchResults && (searchQuery.length >= 1 || searchResults.length > 0)"
              class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
            >
              <div class="p-3 border-b border-gray-100 bg-gray-50">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Hasil Pencarian</p>
              </div>
              
              <div class="max-h-80 overflow-y-auto">
                <!-- Loading -->
                <div v-if="searching" class="p-4 text-center">
                  <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <p class="text-sm text-gray-500 mt-2">Mencari...</p>
                </div>
                
                <!-- No Results -->
                <div v-else-if="searchQuery.length >= 1 && searchResults.length === 0" class="p-4 text-center">
                  <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <p class="text-sm text-gray-500">Tidak ditemukan hasil untuk "{{ searchQuery }}"</p>
                </div>
                
                <!-- Results -->
                <div v-else>
                  <!-- Queue Results -->
                  <div v-if="searchResults.filter(r => r.type === 'queue').length > 0">
                    <p class="px-3 py-2 text-xs font-medium text-gray-400 uppercase bg-gray-50">Antrian</p>
                    <div
                      v-for="result in searchResults.filter(r => r.type === 'queue')"
                      :key="result.id"
                      @click="goToResult(result)"
                      class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                           :class="getStatusBgClass(result.status)">
                        {{ result.title }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ result.subtitle }}</p>
                        <p class="text-xs text-gray-500">{{ result.meta }}</p>
                      </div>
                      <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', getStatusClass(result.status)]">
                        {{ getStatusLabel(result.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Counter Results -->
                  <div v-if="searchResults.filter(r => r.type === 'counter').length > 0">
                    <p class="px-3 py-2 text-xs font-medium text-gray-400 uppercase bg-gray-50">Loket</p>
                    <div
                      v-for="result in searchResults.filter(r => r.type === 'counter')"
                      :key="result.id"
                      @click="goToResult(result)"
                      class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ result.title }}</p>
                        <p class="text-xs text-gray-500">{{ result.subtitle }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div v-if="searchResults.length > 0" class="p-2 border-t border-gray-100 bg-gray-50">
                <button
                  @click="viewAllResults"
                  class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1"
                >
                  Lihat semua di halaman Antrian →
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Notifications -->
        <div class="relative" ref="notificationContainer">
          <button
            @click="toggleNotifications"
            class="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <!-- Notification badge -->
            <span 
              v-if="unreadCount > 0" 
              class="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 flex items-center justify-center animate-pulse"
            >
              <span class="text-[10px] font-bold text-white">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </span>
          </button>

          <!-- Notifications dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Notifikasi</h3>
                  <p class="text-xs text-gray-500">{{ unreadCount }} belum dibaca</p>
                </div>
                <button
                  v-if="notifications.length > 0"
                  @click="markAllAsRead"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tandai semua dibaca
                </button>
              </div>
              
              <div class="max-h-96 overflow-y-auto">
                <div v-if="loadingNotifications" class="p-6 text-center">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                
                <div v-else-if="notifications.length === 0" class="p-6 text-center">
                  <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                  </div>
                  <p class="text-sm text-gray-500">Tidak ada notifikasi baru</p>
                </div>
                
                <div v-else>
                  <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    @click="handleNotificationClick(notification)"
                    :class="[
                      'px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors',
                      notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                    ]"
                  >
                    <div class="flex gap-3">
                      <div :class="['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', getNotificationIconBg(notification.type)]">
                        <svg v-if="notification.type === 'queue_called'" class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                        <svg v-else-if="notification.type === 'queue_done'" class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <svg v-else-if="notification.type === 'queue_waiting'" class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <svg v-else class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p :class="['text-sm', notification.read ? 'text-gray-700' : 'text-gray-900 font-medium']">
                          {{ notification.title }}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                        <p class="text-xs text-gray-400 mt-1">{{ formatTime(notification.timestamp) }}</p>
                      </div>
                      <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div v-if="notifications.length > 5" class="p-2 border-t border-gray-100 bg-gray-50">
                <button
                  @click="showNotifications = false"
                  class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1"
                >
                  Lihat semua notifikasi
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Profile dropdown -->
        <div class="relative" ref="profileContainer">
          <button
            @click="toggleProfile"
            class="flex items-center space-x-2 text-sm rounded-lg p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span class="text-white font-semibold text-sm">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'A' }}
              </span>
            </div>
            <div class="hidden lg:block text-left">
              <p class="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                {{ authStore.getDisplayName }}
              </p>
              <p class="text-xs text-gray-500">
                Admin
              </p>
            </div>
            <svg class="h-4 w-4 text-gray-400 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Profile dropdown menu -->
          <Transition name="dropdown">
            <div
              v-if="showProfile"
              class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
            >
              <!-- User Info -->
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p class="text-sm font-medium text-gray-900">{{ authStore.getDisplayName }}</p>
                <p class="text-xs text-gray-500">{{ authStore.user?.email }}</p>
              </div>
              
              <div class="py-1">
                <NuxtLink
                  to="/admin/dashboard"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  @click="showProfile = false"
                >
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  Dashboard
                </NuxtLink>
                <NuxtLink
                  to="/admin/settings"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  @click="showProfile = false"
                >
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Pengaturan
                </NuxtLink>
              </div>
              
              <div class="border-t border-gray-100">
                <button
                  @click="handleLogout"
                  class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Keluar
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Counter, Ticket } from '~/types'

interface Breadcrumb {
  name: string
  to?: string
}

interface SearchResult {
  id: string
  type: 'queue' | 'counter'
  title: string
  subtitle: string
  meta?: string
  status?: string
  route: string
}

interface Notification {
  id: string
  type: 'queue_called' | 'queue_done' | 'queue_waiting' | 'system' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

const props = defineProps<{
  pageTitle?: string
  breadcrumbs?: Breadcrumb[]
}>()

defineEmits<{
  'toggle-sidebar': []
}>()

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const queueStore = useQueueStore()
const { logout } = useAuth()

// Refs for click outside
const searchContainer = ref<HTMLElement | null>(null)
const notificationContainer = ref<HTMLElement | null>(null)
const profileContainer = ref<HTMLElement | null>(null)

// Reactive data
const searchQuery = ref('')
const showSearchResults = ref(false)
const searching = ref(false)
const searchResults = ref<SearchResult[]>([])

const showNotifications = ref(false)
const loadingNotifications = ref(false)
const notifications = ref<Notification[]>([])

const showProfile = ref(false)

// Assigned location for admin
const assignedLocationId = ref<number | null>(null)

// Computed
const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Debounce search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => performSearch(), 300)
}

// Search functionality
const performSearch = async () => {
  const query = searchQuery.value.trim()
  if (query.length < 1) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  searchResults.value = []
  
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch data from store (already restricted to admin's location)
    const counters = adminStore.accessibleCounters || []
    
    // Get today's tickets if we have a location
    let tickets: Ticket[] = []
    if (assignedLocationId.value) {
      const response = await queueStore.fetchTodayTickets(assignedLocationId.value, { date: today })
      tickets = response.tickets || []
    }
    
    const results: SearchResult[] = []
    
    // Search in queue numbers
    tickets.forEach(ticket => {
      if (ticket.queue_number.toLowerCase().includes(query.toLowerCase())) {
        const counter = counters.find((c: Counter) => c.id === ticket.counter_id)
        results.push({
          id: `queue-${ticket.id}`,
          type: 'queue',
          title: ticket.queue_number,
          subtitle: counter?.name || 'Loket',
          meta: `Dibuat ${formatDateTime(ticket.created_at)}`,
          status: ticket.status,
          route: '/admin/queue'
        })
      }
    })
    
    // Search in counters
    counters.forEach((counter: Counter) => {
      if (
        counter.name.toLowerCase().includes(query.toLowerCase()) ||
        counter.prefix.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          id: `counter-${counter.id}`,
          type: 'counter',
          title: counter.name,
          subtitle: `Prefix: ${counter.prefix}`,
          route: '/admin/settings'
        })
      }
    })
    
    searchResults.value = results.slice(0, 10) // Limit to 10 results
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

const goToResult = (result: SearchResult) => {
  showSearchResults.value = false
  searchQuery.value = ''
  searchResults.value = []
  router.push(result.route)
}

const viewAllResults = () => {
  showSearchResults.value = false
  router.push('/admin/queue')
}

// Notification functionality
const loadNotifications = async () => {
  loadingNotifications.value = true
  
  try {
    // Generate notifications based on today's queue activity
    const today = new Date().toISOString().split('T')[0]
    const newNotifications: Notification[] = []
    
    if (assignedLocationId.value) {
      const response = await queueStore.fetchTodayTickets(assignedLocationId.value, { date: today })
      const tickets = response.tickets || []
      
      // Get recent activities (last 10 tickets sorted by updated_at)
      const recentTickets = [...tickets]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10)
      
      recentTickets.forEach((ticket, index) => {
        let type: Notification['type'] = 'info'
        let title = ''
        let message = ''
        
        if (ticket.status === 'CALLING') {
          type = 'queue_called'
          title = `Antrian ${ticket.queue_number} sedang dipanggil`
          message = 'Silakan segera layani pelanggan ini'
        } else if (ticket.status === 'DONE') {
          type = 'queue_done'
          title = `Antrian ${ticket.queue_number} selesai`
          message = 'Pelayanan telah selesai'
        } else if (ticket.status === 'WAITING') {
          type = 'queue_waiting'
          title = `Antrian ${ticket.queue_number} menunggu`
          message = 'Antrian baru telah dibuat'
        } else {
          return // Skip other statuses
        }
        
        newNotifications.push({
          id: `notif-${ticket.id}-${ticket.status}`,
          type,
          title,
          message,
          timestamp: new Date(ticket.updated_at),
          read: index > 2, // First 3 are unread
          data: ticket
        })
      })
    }
    
    notifications.value = newNotifications
  } catch (error) {
    console.error('Failed to load notifications:', error)
  } finally {
    loadingNotifications.value = false
  }
}

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  showProfile.value = false
  showSearchResults.value = false
  
  if (showNotifications.value) {
    await loadNotifications()
  }
}

const markAllAsRead = () => {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read
  const index = notifications.value.findIndex(n => n.id === notification.id)
  if (index !== -1) {
    notifications.value[index].read = true
  }
  
  // Navigate to queue page
  showNotifications.value = false
  router.push('/admin/queue')
}

const toggleProfile = () => {
  showProfile.value = !showProfile.value
  showNotifications.value = false
  showSearchResults.value = false
}

const handleLogout = async () => {
  try {
    await logout()
    await navigateTo('/admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Helper functions
const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`
  return `${Math.floor(minutes / 1440)} hari lalu`
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const getStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-amber-100 text-amber-700',
    'CALLING': 'bg-blue-100 text-blue-700',
    'SERVING': 'bg-indigo-100 text-indigo-700',
    'DONE': 'bg-emerald-100 text-emerald-700',
    'HOLD': 'bg-orange-100 text-orange-700',
    'CANCELLED': 'bg-red-100 text-red-700'
  }
  return classes[status || ''] || 'bg-gray-100 text-gray-700'
}

const getStatusBgClass = (status?: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-amber-100 text-amber-700',
    'CALLING': 'bg-blue-100 text-blue-700',
    'SERVING': 'bg-indigo-100 text-indigo-700',
    'DONE': 'bg-emerald-100 text-emerald-700',
    'HOLD': 'bg-orange-100 text-orange-700',
    'CANCELLED': 'bg-red-100 text-red-700'
  }
  return classes[status || ''] || 'bg-gray-100 text-gray-700'
}

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    'WAITING': 'Menunggu',
    'CALLING': 'Dipanggil',
    'SERVING': 'Dilayani',
    'DONE': 'Selesai',
    'HOLD': 'Ditahan',
    'CANCELLED': 'Batal'
  }
  return labels[status || ''] || status
}

const getNotificationIconBg = (type: Notification['type']) => {
  const classes: Record<string, string> = {
    'queue_called': 'bg-blue-100',
    'queue_done': 'bg-emerald-100',
    'queue_waiting': 'bg-amber-100',
    'system': 'bg-red-100',
    'info': 'bg-gray-100'
  }
  return classes[type] || 'bg-gray-100'
}

// Initialize location on mount
onMounted(async () => {
  try {
    const counters = await adminStore.fetchAllAccessibleCounters()
    if (counters && counters.length > 0 && counters[0].location_id) {
      assignedLocationId.value = counters[0].location_id
    }
  } catch (error) {
    console.error('Failed to load assigned location:', error)
  }
  
  // Click outside handlers
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    
    if (searchContainer.value && !searchContainer.value.contains(target)) {
      showSearchResults.value = false
    }
    if (notificationContainer.value && !notificationContainer.value.contains(target)) {
      showNotifications.value = false
    }
    if (profileContainer.value && !profileContainer.value.contains(target)) {
      showProfile.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>