export type Role = 'VISITOR' | 'ADMIN' | 'OWNER'

export interface User {
  id: number
  email: string
  name: string
  phone?: string
  role: Role
  google_id?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export interface UserWithToken {
  user: User
  token: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
  role?: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  initialized: boolean
}