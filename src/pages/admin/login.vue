<template>
  <LoginPage 
    type="admin" 
    :show-location-select="false"
    :show-demo-credentials="true"
    demo-email="admin1@waitless.app"
    demo-password="admin123"
  />
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  layout: false,
  middleware: ['guest'] // Redirect if already logged in
})

// SEO
useHead({
  title: 'Admin Login - Waitless',
  meta: [
    { name: 'description', content: 'Admin login for Waitless queue management system. Access your dashboard to manage queues and counters.' }
  ]
})
</script>