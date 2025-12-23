<!-- FILE: src/layouts/owner.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex h-screen">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-sm border-r border-gray-200">
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-3">
                <h1 class="text-xl font-bold text-gray-900">WaitLess</h1>
                <p class="text-xs text-gray-500">Portal Pemilik</p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 p-4 space-y-1">
            <!-- Main Menu -->
            <p class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Utama</p>
            
            <NuxtLink
              to="/owner/dashboard"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="$route.path === '/owner/dashboard' 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Dashboard</span>
            </NuxtLink>
            
            <NuxtLink
              to="/owner/branches"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="$route.path.startsWith('/owner/branches') 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
              </svg>
              <span>Cabang & Loket</span>
            </NuxtLink>

            <NuxtLink
              to="/owner/staff"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="$route.path.startsWith('/owner/staff') 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>Staf & Akses</span>
            </NuxtLink>

            <NuxtLink
              to="/owner/reports"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="$route.path.startsWith('/owner/reports') 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span>Laporan & Ekspor</span>
            </NuxtLink>
            
            <!-- Separator -->
            <div class="border-t border-gray-200 my-4"></div>
            
            <!-- Settings Menu -->
            <p class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pengaturan</p>
            
            <NuxtLink
              to="/owner/profile"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="$route.path.startsWith('/owner/profile') 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Profil & Pengaturan</span>
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="p-4 border-t border-gray-200">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">{{ userInitials }}</span>
              </div>
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ user?.name || 'Pemilik Bisnis' }}</p>
                <p class="text-xs text-gray-500 truncate">{{ user?.email || 'owner@bisnis.com' }}</p>
              </div>
              <button 
                @click="handleLogout"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Keluar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <button
                @click="toggleSidebar"
                class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div class="ml-4 md:ml-0">
                <h2 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h2>
                <p class="text-sm text-gray-500">{{ pageDescription }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <!-- Business Selector -->
              <select 
                v-if="businesses.length > 1"
                v-model="selectedBusiness"
                class="text-sm rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2"
                @change="handleBusinessChange"
              >
                <option v-for="business in businesses" :key="business.id" :value="business.id">
                  {{ business.name }}
                </option>
              </select>

              <!-- Notifications -->
              <button class="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span v-if="hasNotifications" class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              <!-- Quick Actions -->
              <NuxtLink
                to="/owner/branches"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Cabang
              </NuxtLink>
            </div>
          </div>
        </header>

        <!-- Breadcrumb -->
        <div v-if="breadcrumbs.length > 1" class="bg-white border-b border-gray-200 px-6 py-2">
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
                <template v-if="index > 0">
                  <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </template>
                <NuxtLink
                  v-if="crumb.to && index < breadcrumbs.length - 1"
                  :to="crumb.to"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  {{ crumb.title }}
                </NuxtLink>
                <span v-else class="text-sm font-medium text-gray-900">
                  {{ crumb.title }}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto p-6 bg-gray-50">
          <slot />
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-50 md:hidden"
      @click="toggleSidebar"
    >
      <div class="absolute inset-0 bg-gray-900 opacity-50"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()
const { businesses, selectedBusiness, selectBusiness, initializeBusinesses } = useBusiness()

// Sidebar state for mobile
const sidebarOpen = ref(false)

// Computed properties
const userInitials = computed(() => {
  const name = user.value?.name || 'Pemilik Bisnis'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/owner/dashboard': 'Dashboard Pemilik',
    '/owner/branches': 'Cabang & Loket',
    '/owner/reports': 'Laporan & Ekspor', 
    '/owner/staff': 'Staf & Akses',
    '/owner/profile': 'Profil & Pengaturan'
  }
  
  // Handle dynamic routes
  if (route.path.includes('/branches/')) {
    if (route.path.includes('/create')) return 'Tambah Cabang Baru'
    if (route.path.includes('/edit')) return 'Edit Cabang'
    return 'Detail Cabang'
  }
  
  return titles[route.path] || 'Portal Pemilik'
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    '/owner/dashboard': 'Monitor performa bisnis dan metrik antrian Anda',
    '/owner/branches': 'Kelola cabang dan loket pelayanan bisnis',
    '/owner/reports': 'Lihat analitik bisnis dan ekspor laporan',
    '/owner/staff': 'Kelola staf dan hak akses',
    '/owner/profile': 'Konfigurasi pengaturan dan preferensi bisnis'
  }
  return descriptions[route.path] || 'Kelola operasional bisnis Anda'
})

const breadcrumbs = computed(() => {
  const crumbs = [{ title: 'Dashboard', to: '/owner/dashboard' }]
  
  const path = route.path
  if (path.includes('/branches')) {
    crumbs.push({ title: 'Cabang & Loket', to: '/owner/branches' })
    if (path.includes('/create')) {
      crumbs.push({ title: 'Tambah Cabang' })
    } else if (path.includes('/edit')) {
      crumbs.push({ title: 'Edit Cabang' })
    } else if (path !== '/owner/branches') {
      crumbs.push({ title: 'Detail Cabang' })
    }
  } else if (path.includes('/reports')) {
    crumbs.push({ title: 'Laporan & Ekspor' })
  } else if (path.includes('/staff')) {
    crumbs.push({ title: 'Staf & Akses' })
  } else if (path.includes('/profile')) {
    crumbs.push({ title: 'Profil & Pengaturan' })
  }
  
  return crumbs
})

const hasNotifications = computed(() => {
  return false // Placeholder
})

// Methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  try {
    await logout()
    await router.push('/owner/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleBusinessChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const businessId = parseInt(target.value, 10)
  if (!isNaN(businessId)) {
    selectBusiness(businessId)
  }
}

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

// Initialize businesses on mount
onMounted(async () => {
  try {
    await initializeBusinesses()
  } catch (error) {
    console.warn('Failed to initialize businesses:', error)
  }
})
</script>

<style scoped>
/* Custom styles for owner layout */
</style>