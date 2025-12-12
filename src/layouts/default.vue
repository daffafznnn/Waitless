<!-- FILE: src/layouts/default.vue -->
<template>
  <div class="min-h-screen bg-surface-50">
    <div class="flex flex-col h-screen">
      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>