<!-- FILE: src/layouts/admin.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex h-screen">
      <!-- Enhanced Sidebar -->
      <div class="hidden md:block">
        <AdminSidebar />
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Enhanced Header -->
        <AdminHeader 
          :page-title="pageTitle"
          :breadcrumbs="breadcrumbs"
          @toggle-sidebar="toggleMobileSidebar"
        />

        <!-- Page Content -->
        <main class="flex-1 overflow-auto p-6 bg-gray-50">
          <slot />
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-50 md:hidden"
    >
      <div 
        class="absolute inset-0 bg-gray-900 opacity-50"
        @click="toggleMobileSidebar"
      ></div>
      <div class="absolute left-0 top-0 h-full">
        <AdminSidebar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Mobile sidebar state
const mobileSidebarOpen = ref(false)

// Computed properties
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/queues': 'Queue Management',
    '/admin/locations': 'Location Management',
    '/admin/users': 'User Management',
    '/admin/reports': 'Reports & Analytics',
    '/admin/settings': 'System Settings'
  }
  return titles[route.path] || 'Admin Panel'
})

const breadcrumbs = computed(() => {
  const crumbs: Array<{ name: string; to?: string }> = []
  
  if (route.path !== '/admin/dashboard') {
    crumbs.push({ name: 'Dashboard', to: '/admin/dashboard' })
  }
  
  if (route.path.startsWith('/admin/queues')) {
    crumbs.push({ name: 'Queues' })
  } else if (route.path.startsWith('/admin/locations')) {
    crumbs.push({ name: 'Locations' })
  } else if (route.path.startsWith('/admin/users')) {
    crumbs.push({ name: 'Users' })
  } else if (route.path.startsWith('/admin/reports')) {
    crumbs.push({ name: 'Reports' })
  } else if (route.path.startsWith('/admin/settings')) {
    crumbs.push({ name: 'Settings' })
  }
  
  return crumbs
})

// Methods
const toggleMobileSidebar = () => {
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

// Close mobile sidebar on route change
watch(() => route.path, () => {
  mobileSidebarOpen.value = false
})
</script>

<style scoped>
/* Custom styles for admin layout */
.nav-link-active {
  @apply bg-primary-50 text-primary-700 border-primary-200;
}

.nav-link {
  @apply text-surface-600 hover:text-surface-900 hover:bg-surface-50;
}
</style>