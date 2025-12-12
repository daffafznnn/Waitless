<template>
  <div class="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
    <!-- Logo Section -->
    <div class="flex h-16 items-center justify-center border-b border-gray-200">
      <div class="flex items-center space-x-2">
        <div class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">W</span>
        </div>
        <span class="text-xl font-bold text-gray-900">Waitless</span>
      </div>
    </div>

    <!-- Navigation Section -->
    <nav class="flex-1 space-y-1 px-3 py-6">
      <!-- Dashboard -->
      <NuxtLink
        to="/admin/dashboard"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path === '/admin/dashboard', 'text-gray-700': $route.path !== '/admin/dashboard' }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path === '/admin/dashboard', 'text-gray-400': $route.path !== '/admin/dashboard' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z"/>
        </svg>
        Dashboard
      </NuxtLink>

      <!-- Queue Management -->
      <NuxtLink
        to="/admin/queues"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path.startsWith('/admin/queues'), 'text-gray-700': !$route.path.startsWith('/admin/queues') }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path.startsWith('/admin/queues'), 'text-gray-400': !$route.path.startsWith('/admin/queues') }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
        Queue Management
      </NuxtLink>

      <!-- Location Management -->
      <NuxtLink
        to="/admin/locations"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path.startsWith('/admin/locations'), 'text-gray-700': !$route.path.startsWith('/admin/locations') }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path.startsWith('/admin/locations'), 'text-gray-400': !$route.path.startsWith('/admin/locations') }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Locations
      </NuxtLink>

      <!-- User Management -->
      <NuxtLink
        to="/admin/users"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path.startsWith('/admin/users'), 'text-gray-700': !$route.path.startsWith('/admin/users') }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path.startsWith('/admin/users'), 'text-gray-400': !$route.path.startsWith('/admin/users') }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
        Users
      </NuxtLink>

      <!-- Reports -->
      <NuxtLink
        to="/admin/reports"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path.startsWith('/admin/reports'), 'text-gray-700': !$route.path.startsWith('/admin/reports') }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path.startsWith('/admin/reports'), 'text-gray-400': !$route.path.startsWith('/admin/reports') }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Reports
      </NuxtLink>

      <!-- Settings -->
      <NuxtLink
        to="/admin/settings"
        class="group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': $route.path.startsWith('/admin/settings'), 'text-gray-700': !$route.path.startsWith('/admin/settings') }"
      >
        <svg class="mr-3 h-5 w-5 flex-shrink-0" :class="{ 'text-blue-600': $route.path.startsWith('/admin/settings'), 'text-gray-400': !$route.path.startsWith('/admin/settings') }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Settings
      </NuxtLink>
    </nav>

    <!-- User Profile Section -->
    <div class="border-t border-gray-200 p-4">
      <div class="flex items-center">
        <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span class="text-sm font-medium text-gray-700">
            {{ authStore.user?.name?.charAt(0) || 'A' }}
          </span>
        </div>
        <div class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ authStore.getDisplayName }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
        <button
          @click="handleLogout"
          class="ml-3 inline-flex items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          title="Logout"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { logout } = useAuth()

const handleLogout = async () => {
  try {
    await logout()
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>