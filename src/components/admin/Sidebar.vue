<template>
  <div class="w-64 bg-white border-r border-gray-200 min-h-screen">
    <!-- Logo/Brand -->
    <div class="px-6 py-6 border-b border-gray-200">
      <div class="text-xl font-bold text-gray-900">WaitLess Admin</div>
    </div>

    <!-- Navigation -->
    <nav class="px-4 py-4">
      <ul class="space-y-2">
        <li>
          <NuxtLink
            to="/admin/dashboard"
            class="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors"
            :class="isActiveRoute('/admin/dashboard') 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>Dashboard</span>
          </NuxtLink>
        </li>
        
        <li>
          <NuxtLink
            to="/admin/queue"
            class="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors"
            :class="isActiveRoute('/admin/queue') 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Antrian Hari Ini</span>
          </NuxtLink>
        </li>
        
        <li>
          <NuxtLink
            to="/admin/reports"
            class="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors"
            :class="isActiveRoute('/admin/reports') 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <svg class="w-3 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span>Laporan Harian</span>
          </NuxtLink>
        </li>
        
        <li>
          <NuxtLink
            to="/admin/settings"
            class="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors"
            :class="isActiveRoute('/admin/settings') 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
            <span>Pengaturan Loket</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- User Info -->
    <div class="absolute bottom-0 left-0 w-64 px-4 py-5 border-t border-gray-200">
      <div class="text-sm text-gray-500">Login sebagai:</div>
      <div class="mt-1.5 text-sm font-medium text-gray-900">
        {{ displayName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const route = useRoute()

// Computed for user display name
const displayName = computed(() => {
  return user.value?.name || user.value?.email || 'Admin User'
})

// Method to check if route is active
const isActiveRoute = (routePath: string) => {
  return route.path === routePath || route.path.startsWith(routePath)
}
</script>