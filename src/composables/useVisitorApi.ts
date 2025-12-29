/**
 * Composable for visitor-specific API calls
 * Combines location and queue APIs for visitor use cases
 */
import type { ApiResponse, Ticket, LocationWithOwner, Counter } from '~/types'

export interface VisitorLocation {
  id: number
  name: string
  address: string
  city: string
  status: 'open' | 'closed'
  statusText: string
  queueInfo: string
  actionText: string
  actionType: 'primary' | 'secondary' | 'disabled'
  counters?: Counter[]
  totalWaiting?: number
}

export interface VisitorTicket {
  id: number
  queueNumber: string
  locationName: string
  counterName: string
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'on_hold'
  statusText: string
  queueInfo: string
  takenAt: string
  position?: number
  estimatedWait?: string
}

export const useVisitorApi = () => {
  const locationApi = useLocationApi()
  const queueApi = useQueueApi()
  const authStore = useAuthStore()
  
  /**
   * Get list of public locations for visitor landing page
   */
  const getPublicLocations = async (): Promise<VisitorLocation[]> => {
    try {
      const response = await locationApi.getAllLocations({ limit: 50 })
      
      if (!response.ok || !response.data) {
        console.error('Failed to fetch locations:', response.error)
        return []
      }
      
      // API returns { ok: true, data: { count, rows: [...] } }
      const locations = response.data.rows || response.data.data || response.data.items || []
      
      // Filter out inactive locations - only show open/active locations to visitors
      const activeLocations = locations.filter((loc: LocationWithOwner) => loc.is_active !== false)
      
      // Transform locations to visitor format
      const visitorLocations: VisitorLocation[] = activeLocations.map((loc: LocationWithOwner) => {
        // Use is_active as the primary source of truth for location status
        const isOpen = loc.is_active ?? true
        const waitingCount = 0
        
        return {
          id: loc.id,
          name: loc.name,
          address: loc.address || '',
          city: loc.city || '',
          status: isOpen ? 'open' : 'closed',
          statusText: isOpen ? 'Buka' : 'Tutup',
          queueInfo: isOpen 
            ? `Antrian sekarang: ${waitingCount} orang` 
            : 'Buka lagi besok',
          actionText: isOpen ? 'Ambil Nomor' : 'Tidak bisa ambil',
          actionType: isOpen ? 'primary' : 'disabled',
          totalWaiting: waitingCount
        }
      })
      
      return visitorLocations
    } catch (error) {
      console.error('Error fetching public locations:', error)
      return []
    }
  }
  
  /**
   * Get location detail with counters
   */
  const getLocationDetail = async (locationId: number): Promise<{
    location: VisitorLocation | null
    counters: Counter[]
  }> => {
    try {
      const [locResponse, countersResponse] = await Promise.all([
        locationApi.getLocationById(locationId),
        locationApi.getLocationCounters(locationId)
      ])
      
      if (!locResponse.ok || !locResponse.data) {
        return { location: null, counters: [] }
      }
      
      const loc = locResponse.data.location
      const allCounters = countersResponse.data?.counters || []
      
      // Filter out inactive counters - only show active counters to visitors
      const activeCounters = allCounters.filter((counter: Counter) => counter.is_active === true)
      
      // Use is_active as the source of truth for location status
      const isLocationOpen = loc.is_active ?? true
      
      // If no active counters, treat location as closed even if is_active is true
      const hasActiveCounters = activeCounters.length > 0
      const effectivelyOpen = isLocationOpen && hasActiveCounters
      
      return {
        location: {
          id: loc.id,
          name: loc.name,
          address: loc.address || '',
          city: loc.city || '',
          status: effectivelyOpen ? 'open' : 'closed',
          statusText: effectivelyOpen ? 'Buka' : 'Tutup',
          queueInfo: !hasActiveCounters ? 'Tidak ada loket tersedia' : '',
          actionText: '',
          actionType: effectivelyOpen ? 'primary' : 'disabled',
          counters: activeCounters
        },
        counters: activeCounters
      }
    } catch (error) {
      console.error('Error fetching location detail:', error)
      return { location: null, counters: [] }
    }
  }
  
  /**
   * Issue a ticket (take queue number)
   */
  const takeQueueNumber = async (
    locationId: number,
    counterId: number,
    name?: string,
    phone?: string
  ): Promise<{
    success: boolean
    ticket?: Ticket
    queueNumber?: string
    error?: string
  }> => {
    try {
      const response = await queueApi.issueTicket({
        locationId: locationId,
        counterId: counterId
      })
      
      if (response.ok && response.data?.ticket) {
        return {
          success: true,
          ticket: response.data.ticket,
          queueNumber: response.data.ticket.queue_number
        }
      }
      
      return {
        success: false,
        error: response.error || 'Gagal mengambil nomor antrian'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Terjadi kesalahan'
      }
    }
  }
  
  /**
   * Get user's tickets (for logged in users)
   */
  const getMyTickets = async (): Promise<VisitorTicket[]> => {
    try {
      const response = await queueApi.getUserTickets()
      
      if (!response.ok || !response.data?.tickets) {
        return []
      }
      
      return response.data.tickets.map((ticket: any) => {
        // Extract names from nested relations
        // Backend returns: ticket.counter.name and ticket.counter.location.name
        const counterName = ticket.counter?.name || ticket.counter_name || 'Unknown'
        const locationName = ticket.counter?.location?.name || ticket.location_name || 'Unknown'
        
        // Map backend status (UPPERCASE) to frontend status (lowercase)
        const statusMap: Record<string, VisitorTicket['status']> = {
          'WAITING': 'waiting',
          'CALLING': 'called',
          'SERVING': 'serving',
          'HOLD': 'on_hold',
          'DONE': 'completed',
          'CANCELLED': 'cancelled',
          // Also handle lowercase from cache
          'waiting': 'waiting',
          'calling': 'called',
          'serving': 'serving',
          'hold': 'on_hold',
          'done': 'completed',
          'cancelled': 'cancelled'
        }
        const mappedStatus = statusMap[ticket.status] || 'waiting'
        
        return {
          id: ticket.id,
          queueNumber: ticket.queue_number,
          locationName,
          counterName,
          status: mappedStatus,
          statusText: getStatusText(mappedStatus),
          queueInfo: getQueueInfo({ ...ticket, status: mappedStatus }),
          takenAt: formatTime(ticket.created_at),
          position: ticket.position
        }
      })
    } catch (error) {
      console.error('Error fetching user tickets:', error)
      return []
    }
  }
  
  /**
   * Cancel a ticket
   */
  const cancelMyTicket = async (ticketId: number, reason: string = 'Dibatalkan oleh pengguna'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await queueApi.cancelTicket({ ticketId, reason })
      
      if (response.ok) {
        return { success: true }
      }
      
      return { success: false, error: response.error || 'Gagal membatalkan antrian' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Helper functions
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      waiting: 'Menunggu',
      called: 'Dipanggil',
      serving: 'Sedang Dilayani',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      on_hold: 'Ditahan',
      // Also handle uppercase
      WAITING: 'Menunggu',
      CALLING: 'Dipanggil',
      SERVING: 'Sedang Dilayani',
      DONE: 'Selesai',
      CANCELLED: 'Dibatalkan',
      HOLD: 'Ditahan'
    }
    return statusMap[status] || status
  }
  
  const getQueueInfo = (ticket: Ticket): string => {
    if (ticket.status === 'serving') {
      return 'Sedang dipanggil, segera ke loket'
    }
    if (ticket.status === 'called') {
      return 'Nomor Anda dipanggil!'
    }
    if (ticket.position && ticket.position > 0) {
      return `${ticket.position} lagi giliran kamu`
    }
    return 'Menunggu giliran'
  }
  
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }
  
  return {
    getPublicLocations,
    getLocationDetail,
    takeQueueNumber,
    getMyTickets,
    cancelMyTicket
  }
}
