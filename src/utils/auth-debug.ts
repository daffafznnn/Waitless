// Debug utility for auth localStorage
export const debugAuthStorage = () => {
  if (typeof localStorage !== 'undefined') {
    const data = localStorage.getItem('waitless_auth')
    console.log('🔍 Auth localStorage debug:')
    console.log('Raw data:', data)
    
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log('Parsed data:', parsed)
        console.log('User:', parsed.user?.email, 'Role:', parsed.user?.role)
        console.log('Authenticated:', parsed.isAuthenticated)
        console.log('Initialized:', parsed.initialized)
      } catch (error) {
        console.error('Failed to parse localStorage data:', error)
      }
    } else {
      console.log('No auth data in localStorage')
    }
  } else {
    console.log('localStorage not available')
  }
}

// Add to global for manual testing
if (import.meta.client) {
  (window as any).debugAuthStorage = debugAuthStorage
}