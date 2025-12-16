import type {
  ApiResponse,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  UserWithToken
} from '~/types'

export const useAuthApi = () => {
  const { get, post, put } = useApi()

  const register = async (data: RegisterRequest): Promise<ApiResponse<UserWithToken>> => {
    return await post('/api/auth/register', data)
  }

  const login = async (data: LoginRequest): Promise<ApiResponse<UserWithToken>> => {
    return await post('/api/auth/login', data)
  }

  const getProfile = async (): Promise<ApiResponse<{ user: User }>> => {
    return await get('/api/auth/profile')
  }

  const updateProfile = async (data: UpdateProfileRequest): Promise<ApiResponse<{ user: User }>> => {
    return await put('/api/auth/profile', data)
  }

  const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return await post('/api/auth/change-password', data)
  }

  const refreshToken = async (data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
    return await post('/api/auth/refresh', data)
  }

  const logout = async (): Promise<ApiResponse<{ message: string }>> => {
    return await post('/api/auth/logout')
  }

  return {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    logout
  }
}