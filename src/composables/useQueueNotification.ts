import type { VisitorTicket } from './useVisitorApi'

interface TicketState {
  status: string
  updatedAt: string
}

/**
 * Composable for real-time queue notifications
 * Polls for ticket status changes and shows modal notifications
 * Persists notification state across page refreshes
 */

interface NotificationSettings {
  notifyOnCall: boolean
  notifyOnHold: boolean
}

interface PendingNotification {
  id: string
  ticketId: number
  queueNumber: string
  counterName: string
  locationName: string
  type: 'CALLING' | 'HOLD'
  holdReason?: string
  createdAt: number
}

interface NotificationState {
  lastSeen: Record<number, TicketState>
  pendingNotifications: PendingNotification[]
  acknowledgedIds: string[]
}

const STORAGE_KEY = 'waitless_notification_state'
const POLL_INTERVAL = 5000 // 5 seconds

// Global singleton state (not reactive to avoid SSR issues)
let pollingInterval: ReturnType<typeof setInterval> | null = null
let isPollingActive = false
let isShowingNotificationFlag = false

export const useQueueNotification = () => {
  const { $modal } = useNuxtApp()
  const authStore = useAuthStore()
  const { getMyTickets } = useVisitorApi()
  
  // Load state from localStorage
  const loadState = (): NotificationState => {
    if (typeof window === 'undefined') {
      return { lastSeen: {}, pendingNotifications: [], acknowledgedIds: [] }
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Ignore errors
    }
    return { lastSeen: {}, pendingNotifications: [], acknowledgedIds: [] }
  }
  
  // Save state to localStorage
  const saveState = (state: NotificationState) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore errors
    }
  }
  
  // Load settings from localStorage
  const loadSettings = (): NotificationSettings => {
    if (typeof window === 'undefined') {
      return { notifyOnCall: true, notifyOnHold: false }
    }
    try {
      const stored = localStorage.getItem('waitless_settings')
      if (stored) {
        const settings = JSON.parse(stored)
        return {
          notifyOnCall: settings.notifyOnCall ?? true,
          notifyOnHold: settings.notifyOnHold ?? false
        }
      }
    } catch {
      // Ignore errors
    }
    return { notifyOnCall: true, notifyOnHold: false }
  }
  
  // Generate notification ID
  const generateNotificationId = (ticketId: number, type: string): string => {
    return `${ticketId}-${type}-${Date.now()}`
  }
  
  // Show pending notifications one by one
  const showPendingNotifications = async () => {
    if (isShowingNotificationFlag) return
    
    const state = loadState()
    
    // Get first pending notification
    const notification = state.pendingNotifications.shift()
    if (!notification) return
    
    isShowingNotificationFlag = true
    
    // Save updated state (without this notification)
    saveState(state)
    
    try {
      // Show the notification modal
      if (notification.type === 'CALLING') {
        await $modal.alert({
          title: '🔔 Nomor Anda Dipanggil!',
          message: `
            <div class="text-center">
              <div class="mb-4">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-3 animate-pulse">
                  <span class="text-3xl font-bold text-green-600">${notification.queueNumber}</span>
                </div>
              </div>
              <p class="text-lg font-semibold text-gray-900 mb-1">${notification.counterName}</p>
              <p class="text-sm text-gray-500">${notification.locationName}</p>
              <p class="mt-4 text-sm text-green-600 font-medium">
                🚶 Segera menuju loket!
              </p>
            </div>
          `,
          type: 'success',
          confirmText: 'OK, Saya Mengerti',
          size: 'md',
          closable: false
        })
      } else {
        await $modal.alert({
          title: '⏸️ Antrian Anda Ditahan',
          message: `
            <div class="text-center">
              <div class="mb-4">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-3">
                  <span class="text-3xl font-bold text-orange-600">${notification.queueNumber}</span>
                </div>
              </div>
              <p class="text-lg font-semibold text-gray-900 mb-1">${notification.counterName}</p>
              <p class="text-sm text-gray-500">${notification.locationName}</p>
              ${notification.holdReason ? `
                <div class="mt-3 px-3 py-2 bg-orange-50 rounded-lg">
                  <p class="text-sm text-orange-700">Alasan: ${notification.holdReason}</p>
                </div>
              ` : ''}
              <p class="mt-4 text-sm text-orange-600 font-medium">
                Hubungi petugas untuk informasi lebih lanjut.
              </p>
            </div>
          `,
          type: 'warning',
          confirmText: 'OK, Saya Mengerti',
          size: 'md',
          closable: false
        })
      }
      
      // Mark as acknowledged
      const reloadedState = loadState()
      const ackKey = `${notification.ticketId}-${notification.type}`
      if (!reloadedState.acknowledgedIds.includes(ackKey)) {
        reloadedState.acknowledgedIds.push(ackKey)
      }
      
      // Keep only last 50 acknowledged IDs
      if (reloadedState.acknowledgedIds.length > 50) {
        reloadedState.acknowledgedIds = reloadedState.acknowledgedIds.slice(-50)
      }
      
      saveState(reloadedState)
      
    } finally {
      isShowingNotificationFlag = false
      
      // Show next notification if any
      const nextState = loadState()
      if (nextState.pendingNotifications.length > 0) {
        await showPendingNotifications()
      }
    }
  }
  
  // Check for status changes and create notifications
  const checkForStatusChanges = async () => {
    if (!authStore.isAuthenticated) return
    
    const settings = loadSettings()
    const state = loadState()
    
    try {
      const tickets = await getMyTickets()
      
      console.log('[QueueNotification] Checking', tickets.length, 'tickets')
      
      for (const ticket of tickets) {
        const ticketId = ticket.id
        // Status is already lowercase from VisitorTicket (e.g., 'called', 'waiting')
        // Convert to uppercase for comparison
        const currentStatus = ticket.status.toUpperCase()
        const currentUpdatedAt = ticket.updatedAt || new Date().toISOString()
        
        const lastState = state.lastSeen[ticketId]
        const lastStatus = lastState?.status
        const lastUpdatedAt = lastState?.updatedAt

        // Update last seen state
        state.lastSeen[ticketId] = {
          status: currentStatus,
          updatedAt: currentUpdatedAt
        }
        
        // Detect Status Change OR Re-call (Status same but updated_at changed)
        // Note: Frontend status 'called' maps to 'CALLED' after toUpperCase()
        const isStatusChanged = lastStatus !== currentStatus
        const isReCalled = lastStatus === 'CALLED' && currentStatus === 'CALLED' && lastUpdatedAt !== currentUpdatedAt
        
        if (!isStatusChanged && !isReCalled) continue
        
        console.log(`[QueueNotification] Ticket ${ticketId} update: ${lastStatus} -> ${currentStatus} (Re-call: ${isReCalled})`)
        
        // Check for CALLING notification (frontend status is 'called' -> 'CALLED' after uppercase)
        if (currentStatus === 'CALLED' || currentStatus === 'SERVING') {
          if (settings.notifyOnCall) {
            const ackKey = `${ticketId}-CALLING`
            
            // If re-called, remove from acknowledged list to allow new notification
            if (isReCalled) {
              state.acknowledgedIds = state.acknowledgedIds.filter(id => id !== ackKey)
              console.log('[QueueNotification] Re-call detected, resetting acknowledgment for ticket', ticketId)
            }
            
            // Skip if already acknowledged
            if (!state.acknowledgedIds.includes(ackKey)) {
              console.log('[QueueNotification] Adding CALLING notification for ticket', ticketId)
              state.pendingNotifications.push({
                id: generateNotificationId(ticketId, 'CALLING'),
                ticketId,
                queueNumber: ticket.queueNumber,
                counterName: ticket.counterName,
                locationName: ticket.locationName,
                type: 'CALLING',
                createdAt: Date.now()
              })
            }
          }
        }
        
        // Check for HOLD notification (frontend status is 'on_hold' -> 'ON_HOLD' after uppercase)
        if (currentStatus === 'ON_HOLD') {
          if (settings.notifyOnHold) {
            const ackKey = `${ticketId}-HOLD`
            
            // Skip if already acknowledged
            if (!state.acknowledgedIds.includes(ackKey)) {
              console.log('[QueueNotification] Adding HOLD notification for ticket', ticketId)
              state.pendingNotifications.push({
                id: generateNotificationId(ticketId, 'HOLD'),
                ticketId,
                queueNumber: ticket.queueNumber,
                counterName: ticket.counterName,
                locationName: ticket.locationName,
                type: 'HOLD',
                holdReason: (ticket as any).hold_reason,
                createdAt: Date.now()
              })
            }
          }
        }
      }
      
      // Clean up old statuses for tickets that no longer exist
      const activeTicketIds = new Set(tickets.map(t => t.id))
      for (const ticketId of Object.keys(state.lastSeen)) {
        if (!activeTicketIds.has(Number(ticketId))) {
          delete state.lastSeen[Number(ticketId)]
        }
      }
      
      saveState(state)
      
      // Show pending notifications
      if (state.pendingNotifications.length > 0) {
        await showPendingNotifications()
      }
      
    } catch (error) {
      console.warn('[QueueNotification] Failed to check status:', error)
    }
  }
  
  // Start polling (safe to call multiple times)
  const startPolling = () => {
    if (typeof window === 'undefined') return
    if (!authStore.isAuthenticated) return
    if (isPollingActive) {
      console.log('[QueueNotification] Polling already active')
      return
    }
    
    isPollingActive = true
    
    // Check immediately on start
    console.log('[QueueNotification] Starting polling...')
    checkForStatusChanges()
    
    // Then poll at interval
    pollingInterval = setInterval(checkForStatusChanges, POLL_INTERVAL)
    
    console.log('[QueueNotification] Polling started (interval:', POLL_INTERVAL, 'ms)')
  }
  
  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    isPollingActive = false
    console.log('[QueueNotification] Polling stopped')
  }
  
  // Clear all pending notifications
  const clearPendingNotifications = () => {
    const state = loadState()
    state.pendingNotifications = []
    saveState(state)
  }
  
  // Clear all state (for logout)
  const clearAllState = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }
  
  // Force show pending notifications (for page refresh)
  const showPendingOnLoad = () => {
    const state = loadState()
    if (state.pendingNotifications.length > 0) {
      console.log('[QueueNotification] Found', state.pendingNotifications.length, 'pending notifications on load')
      showPendingNotifications()
    }
  }
  
  return {
    isPolling: () => isPollingActive,
    startPolling,
    stopPolling,
    checkForStatusChanges,
    clearPendingNotifications,
    clearAllState,
    showPendingOnLoad
  }
}
