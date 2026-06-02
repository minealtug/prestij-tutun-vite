export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn?: number
  user: {
    id: string
    email: string
    fullName: string
    role?: string
  }
}
