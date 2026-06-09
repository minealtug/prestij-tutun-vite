export interface LoginRequest {
  userName: string
  password: string
}

export interface AuthUserDto {
  id: string
  userName: string
  email?: string
  fullName: string
  role?: string
  admin: boolean
  departmanId: number | null
  departmanAdi: string | null
}

export interface LoginResponse {
  accessToken: string
  expiresIn?: number
  user: AuthUserDto
}

export interface AuthMeResponse {
  user: {
    id: number
    userName: string
    fullName: string
    email?: string | null
    departmanId?: number | null
    departmanAdi?: string | null
    aktif: boolean
    admin: boolean
  }
  permissions: string[]
  yetkiIds: number[]
}
