<template>
  <div>
    <!-- <NuxtRouteAnnouncer /> -->
    <div class="container">
      <header class="text-center mt-4 mb-4">
        <h1>Waitless Frontend</h1>
        <p class="text-muted">Frontend development akan dikembangkan nanti</p>
      </header>
      
      <div class="placeholder-content">
        <div class="empty-state">
          <h3>🚧 Under Development</h3>
          <p>Frontend interface sedang dalam tahap pengembangan.</p>
          <p>Sementara ini, gunakan backend API untuk testing:</p>
          
          <div class="api-links">
            <a href="http://localhost:3001/health" target="_blank" class="api-link">
              📊 Health Check
            </a>
            <a href="http://localhost:3001/api/status" target="_blank" class="api-link">
              🔍 API Status
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.text-muted {
  color: #6c757d;
  margin-bottom: 2rem;
}

.placeholder-content {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 3rem 2rem;
  margin: 2rem 0;
}

.empty-state h3 {
  color: #495057;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.api-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.api-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.api-link:hover {
  background: #0056b3;
  color: white;
  text-decoration: none;
}

h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .placeholder-content {
    padding: 2rem 1rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .api-links {
    flex-direction: column;
    align-items: center;
  }
  
  .api-link {
    width: 200px;
  }
}
</style>
