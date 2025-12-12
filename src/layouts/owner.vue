<!-- FILE: src/layouts/owner.vue -->
<template>
  <div class="min-h-screen bg-surface-50">
    <div class="flex h-screen">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-sm border-r border-surface-200">
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="p-6 border-b border-surface-200">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h1 class="text-xl font-bold text-surface-900">Waitless</h1>
                <p class="text-xs text-surface-500">Business Portal</p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 p-4 space-y-2">
            <NavLink
              to="/owner/dashboard"
              icon="dashboard"
              label="Business Overview"
              :active="$route.path === '/owner/dashboard'"
            />
            <NavLink
              to="/owner/locations"
              icon="building"
              label="Locations"
              :active="$route.path.startsWith('/owner/locations')"
            />
            <NavLink
              to="/owner/reports"
              icon="chart"
              label="Reports & Analytics"
              :active="$route.path.startsWith('/owner/reports')"
            />
            <NavLink
              to="/owner/staff"
              icon="users"
              label="Staff Management"
              :active="$route.path.startsWith('/owner/staff')"
            />
            <NavLink
              to="/owner/settings"
              icon="cog"
              label="Business Settings"
              :active="$route.path.startsWith('/owner/settings')"
            />
            
            <!-- Separator -->
            <div class="border-t border-surface-200 my-4"></div>
            
            <NavLink
              to="/owner/billing"
              icon="credit-card"
              label="Billing & Plans"
              :active="$route.path.startsWith('/owner/billing')"
            />
            <NavLink
              to="/owner/support"
              icon="help"
              label="Help & Support"
              :active="$route.path.startsWith('/owner/support')"
            />
          </nav>

          <!-- User Menu -->
          <div class="p-4 border-t border-surface-200">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-primary-700">{{ userInitials }}</span>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-surface-900">{{ user?.name || 'Business Owner' }}</p>
                <p class="text-xs text-surface-500">{{ user?.email || 'owner@business.com' }}</p>
              </div>
              <button 
                @click="handleLogout"
                class="text-surface-400 hover:text-surface-600 transition-colors"
                title="Logout"
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
        <header class="bg-white shadow-sm border-b border-surface-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <button
                @click="toggleSidebar"
                class="md:hidden p-2 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div class="ml-4 md:ml-0">
                <h2 class="text-lg font-semibold text-surface-900">{{ pageTitle }}</h2>
                <p class="text-sm text-surface-600">{{ pageDescription }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <!-- Business Selector -->
              <select 
                v-model="selectedBusiness"
                class="text-sm rounded-md border-surface-300 focus:border-primary-500 focus:ring-primary-500"
                @change="handleBusinessChange"
              >
                <option v-for="business in businesses" :key="business.id" :value="business.id">
                  {{ business.name }}
                </option>
              </select>

              <!-- Notifications -->
              <button class="relative p-2 text-surface-400 hover:text-surface-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.97 4.97a.75.75 0 011.06 0l1.47 1.47a.75.75 0 01-1.06 1.06L11 6.06 9.53 7.53a.75.75 0 01-1.06-1.06l1.47-1.47z" />
                </svg>
                <span v-if="hasNotifications" class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400"></span>
              </button>

              <!-- Quick Actions -->
              <Button
                variant="primary"
                size="sm"
                to="/owner/locations/create"
                label="Add Location"
                icon="plus"
              />
            </div>
          </div>
        </header>

        <!-- Breadcrumb -->
        <div v-if="breadcrumbs.length > 1" class="bg-white border-b border-surface-200 px-6 py-2">
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-4">
              <li v-for="(crumb, index) in breadcrumbs" :key="index">
                <div class="flex items-center">
                  <template v-if="index > 0">
                    <svg class="flex-shrink-0 h-5 w-5 text-surface-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </template>
                  <NuxtLink
                    v-if="crumb.to && index < breadcrumbs.length - 1"
                    :to="crumb.to"
                    class="ml-4 text-sm font-medium text-surface-500 hover:text-surface-700"
                  >
                    {{ crumb.title }}
                  </NuxtLink>
                  <span v-else class="ml-4 text-sm font-medium text-surface-900">
                    {{ crumb.title }}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto p-6">
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
      <div class="absolute inset-0 bg-surface-900 opacity-50"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()
const { businesses, selectedBusiness } = useBusiness()

// Sidebar state for mobile
const sidebarOpen = ref(false)

// Computed properties
const userInitials = computed(() => {
  const name = user.value?.name || 'Business Owner'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/owner/dashboard': 'Business Overview',
    '/owner/locations': 'Location Management',
    '/owner/reports': 'Reports & Analytics', 
    '/owner/staff': 'Staff Management',
    '/owner/settings': 'Business Settings',
    '/owner/billing': 'Billing & Plans',
    '/owner/support': 'Help & Support'
  }
  
  // Handle dynamic routes
  if (route.path.includes('/locations/')) {
    if (route.path.includes('/create')) return 'Add New Location'
    if (route.path.includes('/edit')) return 'Edit Location'
    return 'Location Details'
  }
  
  return titles[route.path] || 'Business Portal'
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    '/owner/dashboard': 'Monitor your business performance and queue metrics',
    '/owner/locations': 'Manage your business locations and service counters',
    '/owner/reports': 'View detailed business analytics and customer insights',
    '/owner/staff': 'Manage staff access and permissions',
    '/owner/settings': 'Configure business settings and preferences',
    '/owner/billing': 'Manage subscription and billing information',
    '/owner/support': 'Get help and access support resources'
  }
  return descriptions[route.path] || 'Manage your business operations'
})

const breadcrumbs = computed(() => {
  const crumbs = [{ title: 'Business Overview', to: '/owner/dashboard' }]
  
  const path = route.path
  if (path.includes('/locations')) {
    crumbs.push({ title: 'Locations', to: '/owner/locations' })
    if (path.includes('/create')) {
      crumbs.push({ title: 'Add Location' })
    } else if (path.includes('/edit')) {
      crumbs.push({ title: 'Edit Location' })
    } else if (path !== '/owner/locations') {
      crumbs.push({ title: 'Location Details' })
    }
  } else if (path.includes('/reports')) {
    crumbs.push({ title: 'Reports & Analytics' })
  } else if (path.includes('/staff')) {
    crumbs.push({ title: 'Staff Management' })
  } else if (path.includes('/settings')) {
    crumbs.push({ title: 'Settings' })
  }
  
  return crumbs
})

const hasNotifications = computed(() => {
  // Check for business notifications
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
  // Handle business selection change
  console.log('Business changed to:', target.value)
}

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<style scoped>
/* Custom styles for owner layout */
.nav-link-active {
  @apply bg-primary-50 text-primary-700 border-primary-200;
}

.nav-link {
  @apply text-surface-600 hover:text-surface-900 hover:bg-surface-50;
}
</style>