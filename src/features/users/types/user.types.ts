export interface UserDto {
  id: number
  userName: string
  fullName: string
  userTypeId: number | null
  userTypeDescription: string | null
  admin: boolean
  aktif: boolean
  lokasyon: string | null
  departmanId: number | null
  departmanAdi: string | null
  mintikaId: number | null
  mintikaIds: number[]
  mintikalar: MintikaOptionDto[]
  mintikaAdi: string | null
  supervisorUserId: number | null
  insuranceNumber: string | null
  icraOdemeUyari: boolean
  uretimMerkeziYetki: boolean
  email: string | null
  tel: string | null
  fotografUrl: string | null
}

export interface UsersQueryParams {
  search?: string
}

export interface UserTypeOptionDto {
  id: number
  description: string
  active: boolean
}

export type DepartmanAdi = string

export interface MintikaOptionDto {
  id: number
  adi: string
}

export interface UserWriteRequest {
  userName: string
  fullName: string
  insuranceNumber: string | null
  userTypeId: number
  admin: boolean
  aktif: boolean
  lokasyon: string | null
  departmanId: number | null
  supervisorUserId: number | null
  mintikaId: number | null
  mintikaIds: number[]
  uretimMerkeziYetki: boolean
  email: string | null
  tel: string | null
  icraOdemeUyari: boolean
}

export interface CreateUserRequest extends UserWriteRequest {
  password: string
}

export type UpdateUserRequest = UserWriteRequest & {
  password?: string | null
}

export interface CreateUserFormState {
  userName: string
  fullName: string
  password: string
  insuranceNumber: string
  userTypeId: string
  admin: boolean
  aktif: boolean
  lokasyon: string
  departmanAdi: string
  supervisorUserId: string
  mintikaIds: number[]
  uretimMerkeziYetki: boolean
  email: string
  tel: string
  icraOdemeUyari: boolean
}

export type CreateUserFormErrors = Partial<Record<keyof CreateUserFormState, string>>

export const defaultCreateUserFormState: CreateUserFormState = {
  userName: '',
  fullName: '',
  password: '',
  insuranceNumber: '',
  userTypeId: '',
  admin: false,
  aktif: true,
  lokasyon: '',
  departmanAdi: '',
  supervisorUserId: '',
  mintikaIds: [],
  uretimMerkeziYetki: true,
  email: '',
  tel: '',
  icraOdemeUyari: false,
}
