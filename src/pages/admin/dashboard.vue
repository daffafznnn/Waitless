<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Access Error Alert -->
      <div 
        v-if="accessError" 
        class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
      >
        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">Akses Ditolak</h3>
          <p class="text-sm text-red-600 mt-1">{{ accessError }}</p>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <span 
                v-if="assignedLocation" 
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ assignedLocation.name }}
              </span>
            </div>
            <p class="mt-2 text-gray-600">Kelola antrian dan pantau statistik real-time cabang Anda</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="toggleAutoRefresh"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                autoRefresh 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              ]"
            >
              <span class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400']"></span>
                {{ autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF' }}
              </span>
            </button>
            <button
              @click="refreshDashboard"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <span class="flex items-center gap-2">
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loading ? 'Memperbarui...' : 'Refresh' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Date Info -->
      <div class="mb-6 flex items-center gap-4 text-sm text-gray-500">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(new Date()) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Terakhir diperbarui: {{ lastUpdated }}</span>
        </div>
      </div>

      <!-- Stats Cards Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <!-- Total Antrian Hari Ini -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Antrian</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalIssued }}</p>
            </div>
            <div class="p-2 bg-blue-50 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Sedang Menunggu -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Menunggu</p>
              <p class="text-2xl font-bold text-amber-600 mt-1">{{ stats.waiting }}</p>
            </div>
            <div class="p-2 bg-amber-50 rounded-lg">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Selesai -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Selesai</p>
              <p class="text-2xl font-bold text-emerald-600 mt-1">{{ stats.completed }}</p>
            </div>
            <div class="p-2 bg-emerald-50 rounded-lg">
              <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Hold -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Ditahan</p>
              <p class="text-2xl font-bold text-orange-600 mt-1">{{ stats.hold }}</p>
            </div>
            <div class="p-2 bg-orange-50 rounded-lg">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Loket Aktif -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Loket Aktif</p>
              <p class="text-2xl font-bold text-indigo-600 mt-1">{{ stats.activeCounters }}</p>
            </div>
            <div class="p-2 bg-indigo-50 rounded-lg">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Tingkat Penyelesaian -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Penyelesaian</p>
              <p class="text-2xl font-bold text-purple-600 mt-1">{{ stats.completionRate }}%</p>
            </div>
            <div class="p-2 bg-purple-50 rounded-lg">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Active Counters List -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-900">Status Loket</h3>
                <p class="text-sm text-gray-500">Kondisi loket saat ini</p>
              </div>
            </div>
          </div>
          
          <div class="divide-y divide-gray-100">
            <div 
              v-for="counter in counters" 
              :key="counter.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div 
                    :class="[
                      'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold',
                      counter.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    ]"
                  >
                    {{ counter.prefix }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ counter.name }}</p>
                    <p class="text-xs text-gray-500">
                      {{ counter.open_time?.slice(0,5) }} - {{ counter.close_time?.slice(0,5) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">{{ getCounterStats(counter.id).waiting }} menunggu</p>
                    <p class="text-xs text-gray-500">{{ getCounterStats(counter.id).completed }} selesai</p>
                  </div>
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      counter.is_active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ counter.is_active ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="counters.length === 0 && !loading" class="px-6 py-12 text-center">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
              </svg>
              <p class="text-sm text-gray-500">Belum ada loket</p>
              <NuxtLink 
                to="/admin/settings"
                class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Tambah Loket Baru
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Queue Summary -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-base font-semibold text-gray-900">Ringkasan Antrian</h3>
            <p class="text-sm text-gray-500">Status antrian hari ini</p>
          </div>
          
          <div class="p-6">
            <!-- Progress Ring -->
            <div class="flex justify-center mb-6">
              <div class="relative w-40 h-40">
                <svg class="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#E5E7EB"
                    stroke-width="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#10B981"
                    stroke-width="12"
                    fill="none"
                    :stroke-dasharray="`${progressCircle} ${440 - progressCircle}`"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-3xl font-bold text-gray-900">{{ stats.completionRate }}%</span>
                  <span class="text-xs text-gray-500">Selesai</span>
                </div>
              </div>
            </div>

            <!-- Stats List -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span class="text-sm text-gray-600">Menunggu</span>
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ stats.waiting }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span class="text-sm text-gray-600">Calling/Serving</span>
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ stats.serving }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="text-sm text-gray-600">Selesai</span>
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ stats.completed }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span class="text-sm text-gray-600">Ditahan</span>
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ stats.hold }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Queue Activity -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900">Antrian Terbaru</h3>
              <p class="text-sm text-gray-500">5 antrian terakhir di update</p>
            </div>
            <NuxtLink 
              to="/admin/queue"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Lihat Semua →
            </NuxtLink>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Antrian</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loket</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr 
                v-for="ticket in recentTickets" 
                :key="ticket.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-gray-900">{{ ticket.queue_number }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ getCounterName(ticket.counter_id) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusClasses(ticket.status)
                    ]"
                  >
                    {{ getStatusLabel(ticket.status) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-500">{{ formatTime(ticket.updated_at || ticket.created_at) }}</span>
                </td>
              </tr>
              <tr v-if="recentTickets.length === 0 && !loading">
                <td colspan="4" class="px-6 py-12 text-center">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p class="text-sm text-gray-500">Belum ada antrian hari ini</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            to="/admin/queue"
            class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Kelola Antrian</span>
          </NuxtLink>
          
          <NuxtLink
            to="/admin/settings"
            class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Pengaturan Loket</span>
          </NuxtLink>
          
          <NuxtLink
            to="/admin/reports"
            class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Laporan</span>
          </NuxtLink>
          
          <button
            @click="refreshDashboard"
            class="flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Counter, Ticket } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const adminStore = useAdminStore()
const queueStore = useQueueStore()
const toast = useToast()

// State
const loading = ref(false)
const autoRefresh = ref(false)
const autoRefreshInterval = ref<ReturnType<typeof setInterval>>()
const lastUpdated = ref(new Date().toLocaleTimeString('id-ID'))
const accessError = ref<string | null>(null)

// Admin's assigned location
const assignedLocation = ref<{ id: number; name: string } | null>(null)
const counters = ref<Counter[]>([])
const tickets = ref<Ticket[]>([])

// Computed stats
const stats = computed(() => {
  const waiting = tickets.value.filter(t => t.status === 'WAITING').length
  const calling = tickets.value.filter(t => t.status === 'CALLING').length
  const serving = tickets.value.filter(t => t.status === 'SERVING').length
  const completed = tickets.value.filter(t => t.status === 'DONE').length
  const hold = tickets.value.filter(t => t.status === 'HOLD').length
  const total = tickets.value.length
  const activeCounters = counters.value.filter(c => c.is_active).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    totalIssued: total,
    waiting,
    calling,
    serving: calling + serving,
    completed,
    hold,
    activeCounters,
    completionRate
  }
})

const progressCircle = computed(() => {
  return (stats.value.completionRate / 100) * 440
})

const recentTickets = computed(() => {
  return [...tickets.value]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5)
})

// Counter stats per counter
const counterStatsMap = computed(() => {
  const map = new Map<number, { waiting: number; completed: number }>()
  
  counters.value.forEach(counter => {
    const counterTickets = tickets.value.filter(t => t.counter_id === counter.id)
    map.set(counter.id, {
      waiting: counterTickets.filter(t => t.status === 'WAITING' || t.status === 'CALLING').length,
      completed: counterTickets.filter(t => t.status === 'DONE').length
    })
  })
  
  return map
})

// Helper functions
const getCounterStats = (counterId: number) => {
  return counterStatsMap.value.get(counterId) || { waiting: 0, completed: 0 }
}

const getCounterName = (counterId: number) => {
  const counter = counters.value.find(c => c.id === counterId)
  return counter?.name || `Loket ${counterId}`
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'WAITING': 'Menunggu',
    'CALLING': 'Dipanggil',
    'SERVING': 'Dilayani',
    'HOLD': 'Ditahan',
    'DONE': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  }
  return labels[status] || status
}

const getStatusClasses = (status: string) => {
  const classes: Record<string, string> = {
    'WAITING': 'bg-amber-100 text-amber-800',
    'CALLING': 'bg-blue-100 text-blue-800',
    'SERVING': 'bg-indigo-100 text-indigo-800',
    'HOLD': 'bg-orange-100 text-orange-800',
    'DONE': 'bg-emerald-100 text-emerald-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Data loading
const loadAdminData = async () => {
  try {
    accessError.value = null
    
    // Fetch counters (backend will restrict to assigned location)
    const accessibleCounters = await adminStore.fetchAllAccessibleCounters()
    
    if (accessibleCounters && accessibleCounters.length > 0) {
      counters.value = accessibleCounters
      
      // Get location from first counter
      const firstCounter = accessibleCounters[0]
      if (firstCounter.location_id) {
        const locationApi = useLocationApi()
        const response = await locationApi.getLocationById(firstCounter.location_id)
        if (response.ok && response.data?.location) {
          assignedLocation.value = {
            id: response.data.location.id,
            name: response.data.location.name
          }
          
          // Load tickets for this location
          const today = new Date().toISOString().split('T')[0]
          const ticketResponse = await queueStore.fetchTodayTickets(firstCounter.location_id, { date: today })
          tickets.value = ticketResponse.tickets || []
        }
      }
    } else {
      accessError.value = 'Anda tidak memiliki akses ke cabang manapun. Hubungi owner untuk mendapatkan akses.'
      counters.value = []
      tickets.value = []
    }
  } catch (error: any) {
    console.error('Failed to load admin data:', error)
    
    if (error.message?.includes('403') || error.message?.includes('akses')) {
      accessError.value = 'Akses Anda ke cabang ini telah dinonaktifkan'
    } else {
      accessError.value = error.message || 'Gagal memuat data dashboard'
    }
    
    counters.value = []
    tickets.value = []
  }
}

const refreshDashboard = async (showToast = true) => {
  loading.value = true
  
  try {
    await loadAdminData()
    lastUpdated.value = new Date().toLocaleTimeString('id-ID')
    
    if (showToast) {
      toast.add({
        title: 'Dashboard Diperbarui',
        description: 'Data berhasil diperbarui',
        color: 'green'
      })
    }
  } catch (error: any) {
    console.error('Failed to refresh dashboard:', error)
    if (showToast) {
      toast.add({
        title: 'Error',
        description: 'Gagal memperbarui dashboard',
        color: 'red'
      })
    }
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    toast.add({
      title: 'Auto Refresh Aktif',
      description: 'Dashboard akan diperbarui setiap 15 detik',
      color: 'green'
    })
  } else {
    stopAutoRefresh()
    toast.add({
      title: 'Auto Refresh Nonaktif',
      color: 'gray'
    })
  }
}

const startAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    if (!loading.value) {
      refreshDashboard(false)
    }
  }, 15000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = undefined
  }
}

// Initialize
onMounted(async () => {
  await refreshDashboard(false)
})

onUnmounted(() => {
  stopAutoRefresh()
})

// SEO
useHead({
  title: 'Dashboard Admin - WaitLess',
  meta: [
    { name: 'description', content: 'Dashboard admin untuk mengelola antrian dan memantau statistik real-time cabang.' }
  ]
})
</script>