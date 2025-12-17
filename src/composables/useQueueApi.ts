import type {
  ApiResponse,
  IssueTicketRequest,
  IssueTicketResponse,
  CallNextRequest,
  StartServingRequest,
  HoldTicketRequest,
  ResumeTicketRequest,
  MarkDoneRequest,
  CancelTicketRequest,
  Ticket,
  QueueStatusResponse,
  EstimateResponse,
  PaginatedResponse
} from '~/types'

export const useQueueApi = () => {
  const { get, post } = useApi()

  const issueTicket = async (data: IssueTicketRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/issue', data)
  }

  const callNext = async (data: CallNextRequest): Promise<ApiResponse<{ ticket?: Ticket; queueNumber?: string; message: string }>> => {
    return await post('/queue/call-next', data)
  }

  const startServing = async (data: StartServingRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/start-serving', data)
  }

  const holdTicket = async (data: HoldTicketRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/hold', data)
  }

  const resumeTicket = async (data: ResumeTicketRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/resume', data)
  }

  const markDone = async (data: MarkDoneRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/done', data)
  }

  const cancelTicket = async (data: CancelTicketRequest): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await post('/queue/cancel', data)
  }

  const getQueueStatus = async (counterId: number, date?: string): Promise<ApiResponse<{ status: QueueStatusResponse }>> => {
    const params = date ? { date } : {}
    return await get(`/queue/status/${counterId}`, { params })
  }

  const getTodayTickets = async (
    locationId: number,
    options?: {
      page?: number
      limit?: number
      date?: string
    }
  ): Promise<ApiResponse<{ tickets: Ticket[]; pagination: any }>> => {
    const params = {
      page: options?.page || 1,
      limit: options?.limit || 50,
      ...(options?.date && { date: options.date })
    }
    return await get(`/queue/today/${locationId}`, { params })
  }

  const getTicketByQueueNumber = async (queueNumber: string): Promise<ApiResponse<{ ticket: Ticket }>> => {
    return await get(`/queue/ticket/${queueNumber}`)
  }

  const getUserTickets = async (date?: string): Promise<ApiResponse<{ tickets: Ticket[] }>> => {
    const params = date ? { date } : {}
    return await get('/queue/user/tickets', { params })
  }

  const getEstimatedWaitTime = async (ticketId: number): Promise<ApiResponse<{ estimate: EstimateResponse }>> => {
    return await get(`/queue/estimate/${ticketId}`)
  }

  return {
    issueTicket,
    callNext,
    startServing,
    holdTicket,
    resumeTicket,
    markDone,
    cancelTicket,
    getQueueStatus,
    getTodayTickets,
    getTicketByQueueNumber,
    getUserTickets,
    getEstimatedWaitTime
  }
}