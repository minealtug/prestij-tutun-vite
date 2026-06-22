export type Gender = 'erkek' | 'kadin' | 'bilinmiyor'

export type PersonRole = 'yetiştirici' | 'cocuk' | 'es'

export interface DemographicPerson {
  id: string
  ekiciId: string
  role: PersonRole
  gender: Gender
  birthDate: string | null
  age: number | null
  bolgeAdi: string | null
  menseiAdi: string | null
  birimId?: number | null
}

export interface AgeGenderReportFilters {
  menseiId?: number
  bolgeId?: number
  mintikaId?: number
  compareBolgeA?: string
  compareBolgeB?: string
  yil?: number
}

export interface AgeGenderKpis {
  analyzedGrowerCount: number
  avgGrowerAge: number | null
  avgHouseholdSize: number | null
  childUnder18Ratio: number | null
  femaleChildRatio: number | null
  maleChildRatio: number | null
}

export interface AgeGroupBucket {
  label: string
  minAge: number
  maxAge: number | null
  erkek: number
  kadin: number
}

export interface PyramidSeries {
  label: string
  buckets: AgeGroupBucket[]
  color: string
}

export interface GrowerAgeBucket {
  label: string
  count: number
}

export interface GrowerAgeSeries {
  bolgeAdi: string
  buckets: GrowerAgeBucket[]
  color: string
}

export interface HouseholdBucket {
  childCount: string
  childCountNum: number
  percentage: number
}

export interface HouseholdSeries {
  bolgeAdi: string
  buckets: HouseholdBucket[]
  color: string
}

export interface AgeGenderReportData {
  kpis: AgeGenderKpis
  pyramid: PyramidSeries[]
  growerAge: GrowerAgeSeries[]
  household: HouseholdSeries[]
}
