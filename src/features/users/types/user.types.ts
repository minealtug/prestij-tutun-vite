export interface UserDto {
  id: number
  userName: string
  fullName: string
  userTypeDescription: string | null
  admin: boolean
  aktif: boolean
  lokasyon: string | null
  departmanId: number | null
  departmanAdi: string | null
  mintikaAdi: string | null
  uretimMerkeziYetki: boolean
  email: string | null
  tel: string | null
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

export interface CreateUserRequest {
  userName: string
  fullName: string
  password: string
  insuranceNumber: string | null
  userTypeId: number
  admin: boolean
  aktif: boolean
  lokasyon: string | null
  departmanId: number | null
  supervisorUserId: number | null
  mintikaId: number | null
  uretimMerkeziYetki: boolean
  email: string | null
  tel: string | null
  icraOdemeUyari: boolean
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
  mintikaId: string
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
  mintikaId: '',
  uretimMerkeziYetki: true,
  email: '',
  tel: '',
  icraOdemeUyari: false,
}
