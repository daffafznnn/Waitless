<!-- FILE: src/layouts/admin.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex h-screen">
      <!-- Enhanced Sidebar -->
      <div class="hidden md:block flex-shrink-0">
        <AdminSidebar />
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Enhanced Header -->
        <AdminHeader 
          :page-title="pageTitle"
          :breadcrumbs="breadcrumbs"
          @toggle-sidebar="toggleMobileSidebar"
        />

        <!-- Page Content with smooth transitions -->
        <main class="flex-1 overflow-auto bg-gray-50">
          <Transition name="page-slide" mode="out-in">
            <div :key="route.fullPath" class="min-h-full">
              <slot />
            </div>
          </Transition>
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <Teleport to="body">
      <Transition name="overlay-fade">
        <div
          v-if="mobileSidebarOpen"
          class="fixed inset-0 z-50 md:hidden"
        >
          <div 
            class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            @click="toggleMobileSidebar"
          ></div>
          <Transition name="sidebar-slide" appear>
            <div v-if="mobileSidebarOpen" class="absolute left-0 top-0 h-full shadow-2xl">
              <AdminSidebar />
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
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
    '/admin/queue': 'Manajemen Antrian',
    '/admin/locations': 'Manajemen Lokasi',
    '/admin/users': 'Manajemen Pengguna',
    '/admin/reports': 'Laporan Harian',
    '/admin/settings': 'Pengaturan Loket'
  }
  return titles[route.path] || 'Admin Panel'
})

const breadcrumbs = computed(() => {
  const crumbs: Array<{ name: string; to?: string }> = []
  
  if (route.path !== '/admin/dashboard') {
    crumbs.push({ name: 'Dashboard', to: '/admin/dashboard' })
  }
  
  if (route.path.startsWith('/admin/queue')) {
    crumbs.push({ name: 'Antrian' })
  } else if (route.path.startsWith('/admin/locations')) {
    crumbs.push({ name: 'Lokasi' })
  } else if (route.path.startsWith('/admin/users')) {
    crumbs.push({ name: 'Pengguna' })
  } else if (route.path.startsWith('/admin/reports')) {
    crumbs.push({ name: 'Laporan' })
  } else if (route.path.startsWith('/admin/settings')) {
    crumbs.push({ name: 'Pengaturan' })
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
/* Page slide transition - smooth fade + slide */
.page-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Overlay fade transition */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Sidebar slide transition */
.sidebar-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}
</style>