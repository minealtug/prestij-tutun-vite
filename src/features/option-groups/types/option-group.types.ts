export interface AltSecenekDto {
  id: number
  secenekGrupId: number
  adi: string
  siraNo: number
}

export interface SecenekGrupDto {
  secenekGrupId: number
  grupAdi: string
  altSecenekler: AltSecenekDto[]
}

export interface AltSecenekInput {
  adi: string
  siraNo: number
}

export interface AltSecenekUpdateInput extends AltSecenekInput {
  id?: number
}

export interface CreateSecenekGrupRequest {
  grupAdi: string
  altSecenekler: AltSecenekInput[]
}

export interface UpdateSecenekGrupRequest {
  grupAdi: string
  altSecenekler: AltSecenekUpdateInput[]
}

export interface AltSecenekFormItem {
  id?: number
  adi: string
}

export interface SecenekGrupFormValues {
  grupAdi: string
  altSecenekler: AltSecenekFormItem[]
}
