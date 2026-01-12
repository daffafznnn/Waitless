import { defineStore } from 'pinia'
import type {
  Ticket,
  QueueStatusResponse,
  EstimateResponse,
  IssueTicketRequest,
  CallNextRequest,
  StartServingRequest,
  HoldTicketRequest,
  ResumeTicketRequest,
  MarkDoneRequest,
  CancelTicketRequest,
  LoadingState
} from '~/types'

interface QueueState {
  tickets: Record<number, Ticket[]>
  currentQueueStatus: Record<number, QueueStatusResponse>
  userTickets: Ticket[]
  loading: LoadingState
  errors: Record<string, string | null>
}

export const useQueueStore = defineStore('queue', {
  state: (): QueueState => ({
    tickets: {},
    currentQueueStatus: {},
    userTickets: [],
    loading: {
      loading: false,
      error: null,
      lastFetch: null
    },
    errors: {}
  }),

  getters: {
    getTicketsByLocation: (state) => (locationId: number) => {
      return state.tickets[locationId] || []
    },

    getQueueStatusByCounter: (state) => (counterId: number) => {
      return state.currentQueueStatus[counterId] || null
    },

    isLoading: (state) => state.loading.loading,

    hasError: (state) => (key: string) => {
      return state.errors[key] || null
    },

    getWaitingTickets: (state) => (locationId: number) => {
      const tickets = state.tickets[locationId] || []
      return tickets.filter(ticket => ticket.status === 'WAITING')
    },

    getServingTickets: (state) => (locationId: number) => {
      const tickets = state.tickets[locationId] || []
      return tickets.filter(ticket => ['CALLING', 'SERVING'].includes(ticket.status))
    }
  },

  actions: {
    setLoading(loading: boolean, error: string | null = null) {
      this.loading = {
        loading,
        error,
        lastFetch: loading ? null : new Date()
      }
    },

    setError(key: string, error: string | null) {
      this.errors[key] = error
    },

    clearError(key: string) {
      this.errors[key] = null
    },

    async issueTicket(data: IssueTicketRequest) {
      try {
        this.setLoading(true)
        this.clearError('issueTicket')

        const queueApi = useQueueApi()
        const response = await queueApi.issueTicket(data)

        if (response.ok && response.data) {
          const ticket = response.data.ticket
          
          if (!this.tickets[ticket.location_id]) {
            this.tickets[ticket.location_id] = []
          }
          
          this.tickets[ticket.location_id].push(ticket)
          this.userTickets.push(ticket)
          
          return ticket
        } else {
          throw new Error(response.error || 'Failed to issue ticket')
        }
      } catch (error: any) {
        this.setError('issueTicket', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async callNext(data: CallNextRequest) {
      try {
        this.setLoading(true)
        this.clearError('callNext')

        const queueApi = useQueueApi()
        const response = await queueApi.callNext(data)

        if (response.ok && response.data) {
          if (response.data.ticket) {
            await this.updateTicketInStore(response.data.ticket)
          }
          return response.data
        } else {
          throw new Error(response.error || 'Failed to call next ticket')
        }
      } catch (error: any) {
        this.setError('callNext', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async recallTicket(data: { ticketId: number }) {
      try {
        this.setLoading(true)
        this.clearError('recallTicket')

        const queueApi = useQueueApi()
        const response = await queueApi.recallTicket(data)

        if (response.ok && response.data) {
          if (response.data.ticket) {
            await this.updateTicketInStore(response.data.ticket)
          }
          return response.data
        } else {
          throw new Error(response.error || 'Failed to recall ticket')
        }
      } catch (error: any) {
        this.setError('recallTicket', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async startServing(data: StartServingRequest) {
      try {
        this.setLoading(true)
        this.clearError('startServing')

        const queueApi = useQueueApi()
        const response = await queueApi.startServing(data)

        if (response.ok && response.data) {
          await this.updateTicketInStore(response.data.ticket)
          return response.data.ticket
        } else {
          throw new Error(response.error || 'Failed to start serving ticket')
        }
      } catch (error: any) {
        this.setError('startServing', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async holdTicket(data: HoldTicketRequest) {
      try {
        this.setLoading(true)
        this.clearError('holdTicket')

        const queueApi = useQueueApi()
        const response = await queueApi.holdTicket(data)

        if (response.ok && response.data) {
          await this.updateTicketInStore(response.data.ticket)
          return response.data.ticket
        } else {
          throw new Error(response.error || 'Failed to hold ticket')
        }
      } catch (error: any) {
        this.setError('holdTicket', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async resumeTicket(data: ResumeTicketRequest) {
      try {
        this.setLoading(true)
        this.clearError('resumeTicket')

        const queueApi = useQueueApi()
        const response = await queueApi.resumeTicket(data)

        if (response.ok && response.data) {
          await this.updateTicketInStore(response.data.ticket)
          return response.data.ticket
        } else {
          throw new Error(response.error || 'Failed to resume ticket')
        }
      } catch (error: any) {
        this.setError('resumeTicket', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async markDone(data: MarkDoneRequest) {
      try {
        this.setLoading(true)
        this.clearError('markDone')

        const queueApi = useQueueApi()
        const response = await queueApi.markDone(data)

        if (response.ok && response.data) {
          await this.updateTicketInStore(response.data.ticket)
          return response.data.ticket
        } else {
          throw new Error(response.error || 'Failed to mark ticket as done')
        }
      } catch (error: any) {
        this.setError('markDone', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async cancelTicket(data: CancelTicketRequest) {
      try {
        this.setLoading(true)
        this.clearError('cancelTicket')

        const queueApi = useQueueApi()
        const response = await queueApi.cancelTicket(data)

        if (response.ok && response.data) {
          await this.updateTicketInStore(response.data.ticket)
          return response.data.ticket
        } else {
          throw new Error(response.error || 'Failed to cancel ticket')
        }
      } catch (error: any) {
        this.setError('cancelTicket', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchQueueStatus(counterId: number, date?: string) {
      try {
        this.setLoading(true)
        this.clearError('queueStatus')

        const queueApi = useQueueApi()
        const response = await queueApi.getQueueStatus(counterId, date)

        if (response.ok && response.data) {
          this.currentQueueStatus[counterId] = response.data.status
          return response.data.status
        } else {
          throw new Error(response.error || 'Failed to fetch queue status')
        }
      } catch (error: any) {
        this.setError('queueStatus', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchTodayTickets(locationId: number, options?: { page?: number; limit?: number; date?: string }) {
      try {
        this.setLoading(true)
        this.clearError('todayTickets')

        const queueApi = useQueueApi()
        const response = await queueApi.getTodayTickets(locationId, options)

        if (response.ok && response.data) {
          this.tickets[locationId] = response.data.tickets
          return response.data
        } else {
          throw new Error(response.error || 'Failed to fetch tickets')
        }
      } catch (error: any) {
        this.setError('todayTickets', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchUserTickets(date?: string) {
      try {
        this.setLoading(true)
        this.clearError('userTickets')

        const queueApi = useQueueApi()
        const response = await queueApi.getUserTickets(date)

        if (response.ok && response.data) {
          this.userTickets = response.data.tickets
          return response.data.tickets
        } else {
          throw new Error(response.error || 'Failed to fetch user tickets')
        }
      } catch (error: any) {
        this.setError('userTickets', error.message)
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async getEstimatedWaitTime(ticketId: number): Promise<EstimateResponse | null> {
      try {
        this.setLoading(true)
        this.clearError('estimateWait')

        const queueApi = useQueueApi()
        const response = await queueApi.getEstimatedWaitTime(ticketId)

        if (response.ok && response.data) {
          return response.data.estimate
        } else {
          throw new Error(response.error || 'Failed to get estimated wait time')
        }
      } catch (error: any) {
        this.setError('estimateWait', error.message)
        return null
      } finally {
        this.setLoading(false)
      }
    },

    updateTicketInStore(updatedTicket: Ticket) {
      const locationId = updatedTicket.location_id
      
      if (this.tickets[locationId]) {
        const index = this.tickets[locationId].findIndex(t => t.id === updatedTicket.id)
        if (index !== -1) {
          this.tickets[locationId][index] = updatedTicket
        }
      }

      const userTicketIndex = this.userTickets.findIndex(t => t.id === updatedTicket.id)
      if (userTicketIndex !== -1) {
        this.userTickets[userTicketIndex] = updatedTicket
      }
    },

    clearLocationTickets(locationId: number) {
      this.tickets[locationId] = []
    },

    clearQueueStatus(counterId: number) {
      delete this.currentQueueStatus[counterId]
    },

    reset() {
      this.tickets = {}
      this.currentQueueStatus = {}
      this.userTickets = []
      this.loading = { loading: false, error: null, lastFetch: null }
      this.errors = {}
    }
  }
})