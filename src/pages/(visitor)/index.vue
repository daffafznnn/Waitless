<!-- FILE: src/pages/(visitor)/index.vue -->
<template>
  <PublicLayout>
    <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      <!-- Hero Section -->
      <div class="container mx-auto px-4 pt-16 pb-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-surface-900 mb-6">
            Welcome to
            <span class="text-primary-600">Waitless</span>
          </h1>
          
          <p class="text-xl text-surface-600 max-w-2xl mx-auto mb-8">
            Modern queue management system that eliminates waiting lines and improves customer experience
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="primary"
              to="/queue"
              label="Get Your Ticket"
            />
            <Button
              size="lg"
              variant="secondary"
              to="/owner/login"
              label="Business Login"
            />
          </div>
        </div>
      </div>

      <!-- How It Works Section -->
      <div class="container mx-auto px-4 pb-24">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-surface-900 mb-4">How It Works</h2>
          <p class="text-lg text-surface-600 max-w-2xl mx-auto">
            Get in line digitally and track your queue position in real-time
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 text-primary-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span class="text-2xl font-bold">1</span>
            </div>
            <h3 class="text-xl font-semibold mb-3">Choose Location</h3>
            <p class="text-surface-600">Select your preferred business location and service counter</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-success-100 text-success-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span class="text-2xl font-bold">2</span>
            </div>
            <h3 class="text-xl font-semibold mb-3">Get Your Ticket</h3>
            <p class="text-surface-600">Receive your digital queue number and estimated wait time</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-warning-100 text-warning-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span class="text-2xl font-bold">3</span>
            </div>
            <h3 class="text-xl font-semibold mb-3">Track Progress</h3>
            <p class="text-surface-600">Monitor your position and get notified when it's your turn</p>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="bg-surface-50 py-24">
        <div class="container mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-surface-900 mb-4">Why Choose Waitless?</h2>
            <p class="text-lg text-surface-600 max-w-2xl mx-auto">
              Experience the future of queue management with our innovative features
            </p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4 flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">Digital Queue</h3>
              <p class="text-surface-600">Get your place in line digitally without physical waiting</p>
            </div>
            
            <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-success-100 text-success-600 rounded-lg mb-4 flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">Real-time Updates</h3>
              <p class="text-surface-600">Track your queue position with live notifications</p>
            </div>
            
            <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-warning-100 text-warning-600 rounded-lg mb-4 flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">Multi-location</h3>
              <p class="text-surface-600">Support for multiple business locations and counters</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-primary-600 text-white py-24">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4">Ready to Skip the Line?</h2>
          <p class="text-xl mb-8 opacity-90">
            Join thousands of customers who save time with digital queuing
          </p>
          <Button
            size="lg"
            variant="white"
            to="/queue"
            label="Get Started Now"
            class="shadow-lg"
          />
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
useHead({
  title: 'Waitless - Digital Queue Management System',
  meta: [
    { name: 'description', content: 'Modern queue management system for businesses. Eliminate waiting lines and improve customer experience with digital queuing.' },
    { name: 'keywords', content: 'queue management, digital queue, waiting line, customer service, business efficiency' },
    { property: 'og:title', content: 'Waitless - Digital Queue Management System' },
    { property: 'og:description', content: 'Modern queue management system for businesses' },
    { property: 'og:type', content: 'website' }
  ]
})

// Set visitor layout as default
definePageMeta({
  layout: 'public'
})
</script>