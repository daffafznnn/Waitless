<!-- FILE: src/pages/(visitor)/queue/[locationId].vue -->
<template>
  <PublicLayout>
    <div class="min-h-screen bg-surface-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-surface-200">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-surface-900">{{ location?.name || 'Loading...' }}</h1>
              <p class="text-surface-600 mt-1">{{ location?.address }}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              to="/queue/me"
              label="My Tickets"
              v-if="hasActiveTickets"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="container mx-auto px-4 py-12 text-center">
        <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-surface-600">Loading location details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="container mx-auto px-4 py-12 text-center">
        <div class="bg-danger-50 text-danger-800 p-6 rounded-lg max-w-md mx-auto">
          <h3 class="font-semibold mb-2">Location Not Found</h3>
          <p class="mb-4">The requested location could not be found.</p>
          <Button variant="primary" to="/" label="Back to Home" />
        </div>
      </div>

      <!-- Content -->
      <div v-else class="container mx-auto px-4 py-8">
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Location Info & Queue Status -->
          <div>
            <!-- Location Info Card -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 class="text-lg font-semibold mb-4">Location Information</h2>
              <div class="space-y-3 text-sm">
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-surface-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ location?.address }}</span>
                </div>
                <div class="flex items-center" v-if="location?.phone">
                  <svg class="w-4 h-4 text-surface-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>{{ location?.phone }}</span>
                </div>
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-surface-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ formatBusinessHours(location?.business_hours) }}</span>
                </div>
              </div>
            </div>

            <!-- Current Queue Status -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">Current Queue Status</h2>
              <div class="grid grid-cols-2 gap-4" v-if="counters?.length">
                <div v-for="counter in counters" :key="counter.id" 
                     class="border border-surface-200 rounded-lg p-4 text-center">
                  <h3 class="font-medium text-surface-900 mb-2">{{ counter.name }}</h3>
                  <div class="text-2xl font-bold text-primary-600 mb-1">
                    {{ counter.current_queue_count || 0 }}
                  </div>
                  <p class="text-xs text-surface-500">people in queue</p>
                  <StatusBadge 
                    :status="counter.status" 
                    :variant="getCounterStatusVariant(counter.status)"
                    class="mt-2"
                  />
                </div>
              </div>
              <EmptyState 
                v-else
                title="No Counters Available"
                description="This location currently has no active service counters."
              />
            </div>
          </div>

          <!-- Get Ticket Form -->
          <div>
            <div class="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 class="text-lg font-semibold mb-4">Get Your Ticket</h2>
              
              <form @submit.prevent="issueTicket" class="space-y-4">
                <!-- Counter Selection -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    Select Counter
                  </label>
                  <select 
                    v-model="selectedCounter" 
                    required
                    class="w-full rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Choose a counter...</option>
                    <option 
                      v-for="counter in availableCounters" 
                      :key="counter.id" 
                      :value="counter.id"
                    >
                      {{ counter.name }} ({{ counter.current_queue_count || 0 }} in queue)
                    </option>
                  </select>
                </div>

                <!-- Customer Info -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    Your Name (Optional)
                  </label>
                  <input 
                    v-model="customerName"
                    type="text" 
                    placeholder="Enter your name"
                    class="w-full rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                </div>

                <!-- Phone Number -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input 
                    v-model="customerPhone"
                    type="tel" 
                    placeholder="Enter your phone number"
                    class="w-full rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500"
                  >
                  <p class="text-xs text-surface-500 mt-1">
                    For notifications when it's your turn
                  </p>
                </div>

                <!-- Estimated Wait Time -->
                <div v-if="estimatedWaitTime" class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-primary-900">Estimated Wait Time</p>
                      <p class="text-sm text-primary-700">{{ estimatedWaitTime }} minutes</p>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  :loading="isIssuing"
                  :disabled="!selectedCounter"
                  label="Get My Ticket"
                  class="w-full"
                />
              </form>

              <!-- Success Message -->
              <div v-if="ticketIssued" class="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-success-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-success-900">Ticket Issued Successfully!</p>
                    <p class="text-sm text-success-700">Your queue number is #{{ issuedTicket?.queue_number }}</p>
                  </div>
                </div>
                <div class="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    :to="`/queue/me`"
                    label="View My Tickets"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    @click="resetForm"
                    label="Get Another Ticket"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import type { Location, Counter, Ticket } from '~/types'

const route = useRoute()
const { $api } = useNuxtApp()

// Page meta
definePageMeta({
  layout: 'public'
})

// Reactive data
const locationId = computed(() => route.params.locationId as string)
const selectedCounter = ref('')
const customerName = ref('')
const customerPhone = ref('')
const isIssuing = ref(false)
const ticketIssued = ref(false)
const issuedTicket = ref<Ticket | null>(null)
const estimatedWaitTime = ref<number | null>(null)

// Fetch location data
const { data: location, pending, error } = await useFetch<Location>(`/api/locations/${locationId.value}`)

// Fetch counters for this location
const { data: counters } = await useFetch<Counter[]>(`/api/locations/${locationId.value}/counters`)

// Computed properties
const availableCounters = computed(() => {
  return counters.value?.filter(counter => counter.status === 'active') || []
})

const hasActiveTickets = computed(() => {
  // Check if user has active tickets (implement based on your auth system)
  return false
})

// Methods
const getCounterStatusVariant = (status: string) => {
  const variants = {
    'active': 'success',
    'busy': 'warning', 
    'inactive': 'danger'
  }
  return variants[status as keyof typeof variants] || 'secondary'
}

const formatBusinessHours = (hours: any) => {
  if (!hours) return 'Hours not available'
  return `${hours.open || '9:00 AM'} - ${hours.close || '5:00 PM'}`
}

const calculateEstimatedWaitTime = async () => {
  if (!selectedCounter.value) {
    estimatedWaitTime.value = null
    return
  }
  
  try {
    const response = await $api.queue.getEstimatedWaitTime(selectedCounter.value)
    estimatedWaitTime.value = response.estimated_minutes
  } catch (error) {
    console.error('Failed to calculate wait time:', error)
    estimatedWaitTime.value = null
  }
}

const issueTicket = async () => {
  if (!selectedCounter.value) return
  
  isIssuing.value = true
  try {
    const ticket = await $api.queue.issueTicket({
      counterId: selectedCounter.value,
      customerName: customerName.value || null,
      customerPhone: customerPhone.value || null
    })
    
    issuedTicket.value = ticket
    ticketIssued.value = true
  } catch (error) {
    console.error('Failed to issue ticket:', error)
    // Handle error (show notification)
  } finally {
    isIssuing.value = false
  }
}

const resetForm = () => {
  selectedCounter.value = ''
  customerName.value = ''
  customerPhone.value = ''
  ticketIssued.value = false
  issuedTicket.value = null
  estimatedWaitTime.value = null
}

// Watch for counter selection changes
watch(selectedCounter, () => {
  calculateEstimatedWaitTime()
})

// SEO
useHead({
  title: `${location.value?.name || 'Location'} - Get Your Ticket | Waitless`,
  meta: [
    { name: 'description', content: `Get your digital queue ticket for ${location.value?.name}. Skip the line and track your queue position in real-time.` }
  ]
})
</script>