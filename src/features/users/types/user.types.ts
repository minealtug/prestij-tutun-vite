export interface UserDto {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface UsersQueryParams {
  page?: number
  pageSize?: number
  search?: string
}
