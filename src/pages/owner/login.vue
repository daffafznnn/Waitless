<template>
  <LoginPage 
    type="owner" 
    :show-location-select="false"
    :show-demo-credentials="true"
    demo-email="owner@waitless.app"
    demo-password="password123"
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
  title: 'Business Owner Login - Waitless',
  meta: [
    { name: 'description', content: 'Business owner login for Waitless queue management system. Access your dashboard to manage locations and view business reports.' }
  ]
})
</script>