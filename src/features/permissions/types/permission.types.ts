export const YETKI_OKUMA = 'Okuma'
export const YETKI_YAZMA = 'Yazma'

export interface MenuDto {
  id: number
  yetkiId: number
  menuAdi: string
  menuUrl: string
  yetkiAdi: string
}

export interface YetkiDto {
  id: number
  yetkiTuru: string
}

export interface DepartmanDto {
  id: number | null
  adi: string
  aktif: boolean
  kaynak?: string
}

export interface RolYetkiDto {
  id: number
  departmanId: number | null
  departmanAdi: string | null
  userId: number | null
  yetkiId: number
  yetkiTuru: string | null
  kaynak?: string
}

export interface MenuPermissionEntry {
  yetkiId: number
  yetkiTuru: string
  menuId: number
}

export type MenuPermissionMap = Record<string, MenuPermissionEntry[]>

export interface AddMenuPayload {
  menuAdi: string
  menuUrl: string
  yetkiId: number
}

export interface UpdateMenuPayload extends AddMenuPayload {}

export interface AddYetkiPayload {
  yetkiTuru: string
}
