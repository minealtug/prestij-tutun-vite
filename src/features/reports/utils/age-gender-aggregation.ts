import type { EkiciDefinitionDto } from '@/features/ekici-definitions/types/ekici-definition.types'
import type {
  AgeGenderKpis,
  AgeGenderReportData,
  AgeGenderReportFilters,
  AgeGroupBucket,
  DemographicPerson,
  Gender,
  GrowerAgeBucket,
  GrowerAgeSeries,
  HouseholdBucket,
  HouseholdSeries,
  PyramidSeries,
} from '../types/age-gender-report.types'
import {
  AGE_GROUP_RANGES,
  GROWER_AGE_BUCKETS,
  computeAge,
  deriveGenderFromTc,
  estimateChildCountFromSeed,
  generateSyntheticChildren,
  getAgeGroupLabel,
  getGrowerAgeBucket,
} from './age-utils'

const SERIES_COLORS = ['#2a8f9e', '#3dbdd4', '#1a3d5c', '#6ec5e0', '#237a87'] as const

function matchesGeoFilter(ekici: EkiciDefinitionDto, filters: AgeGenderReportFilters): boolean {
  if (filters.menseiId != null && ekici.menseiId !== filters.menseiId) return false
  if (filters.bolgeId != null && ekici.bolgeId !== filters.bolgeId) return false
  if (filters.mintikaId != null && ekici.mintikaId !== filters.mintikaId) return false
  if (filters.yil != null && ekici.yil !== filters.yil) return false
  return true
}

function buildGrowerPerson(ekici: EkiciDefinitionDto): DemographicPerson {
  const age = computeAge(ekici.dogumTarihi)
  return {
    id: `grower-${ekici.id}`,
    ekiciId: ekici.id,
    role: 'yetiştirici',
    gender: deriveGenderFromTc(ekici.tcKimlikNo),
    birthDate: ekici.dogumTarihi,
    age,
    bolgeAdi: ekici.bolgeAdi,
    menseiAdi: ekici.menseiAdi,
  }
}

function buildChildrenForGrower(ekici: EkiciDefinitionDto): DemographicPerson[] {
  const childCount = estimateChildCountFromSeed(ekici.id)
  const synthetic = generateSyntheticChildren(ekici.id, childCount, ekici.bolgeAdi)

  return synthetic.map((child, index) => ({
    id: `child-${ekici.id}-${index + 1}`,
    ekiciId: ekici.id,
    role: 'cocuk' as const,
    gender: child.gender,
    birthDate: child.birthDate,
    age: child.age,
    bolgeAdi: ekici.bolgeAdi,
    menseiAdi: ekici.menseiAdi,
    birimId: index + 1,
  }))
}

export function buildDemographicPopulation(
  ekiciler: EkiciDefinitionDto[],
  filters: AgeGenderReportFilters = {},
): DemographicPerson[] {
  const filtered = ekiciler.filter((e) => e.aktif !== 0 && matchesGeoFilter(e, filters))
  const people: DemographicPerson[] = []

  for (const ekici of filtered) {
    people.push(buildGrowerPerson(ekici))
    people.push(...buildChildrenForGrower(ekici))
  }

  return people
}

function computeKpis(people: DemographicPerson[], growers: DemographicPerson[]): AgeGenderKpis {
  const children = people.filter((p) => p.role === 'cocuk')
  const growerAges = growers.map((g) => g.age).filter((a): a is number => a != null)

  const householdSizes = growers.map((grower) => {
    const childCount = children.filter((c) => c.ekiciId === grower.ekiciId).length
    return 1 + childCount
  })

  const totalPopulation = people.length
  const under18 = children.filter((c) => c.age != null && c.age <= 18).length
  const femaleChildren = children.filter((c) => c.gender === 'kadin').length
  const maleChildren = children.filter((c) => c.gender === 'erkek').length
  const knownGenderChildren = children.filter((c) => c.gender !== 'bilinmiyor').length

  return {
    analyzedGrowerCount: growers.length,
    avgGrowerAge:
      growerAges.length > 0
        ? Math.round((growerAges.reduce((a, b) => a + b, 0) / growerAges.length) * 10) / 10
        : null,
    avgHouseholdSize:
      householdSizes.length > 0
        ? Math.round((householdSizes.reduce((a, b) => a + b, 0) / householdSizes.length) * 10) / 10
        : null,
    childUnder18Ratio:
      totalPopulation > 0 ? Math.round((under18 / totalPopulation) * 1000) / 10 : null,
    femaleChildRatio:
      knownGenderChildren > 0
        ? Math.round((femaleChildren / knownGenderChildren) * 1000) / 10
        : null,
    maleChildRatio:
      knownGenderChildren > 0
        ? Math.round((maleChildren / knownGenderChildren) * 1000) / 10
        : null,
  }
}

function buildPyramidForGroup(
  label: string,
  people: DemographicPerson[],
  color: string,
): PyramidSeries {
  const buckets: AgeGroupBucket[] = AGE_GROUP_RANGES.map((range) => ({
    label: range.label,
    minAge: range.minAge,
    maxAge: range.maxAge,
    erkek: 0,
    kadin: 0,
  }))

  for (const person of people) {
    if (person.age == null || person.gender === 'bilinmiyor') continue
    const groupLabel = getAgeGroupLabel(person.age)
    if (!groupLabel) continue
    const bucket = buckets.find((b) => b.label === groupLabel)
    if (!bucket) continue
    if (person.gender === 'erkek') bucket.erkek += 1
    if (person.gender === 'kadin') bucket.kadin += 1
  }

  return { label, buckets, color }
}

function buildGrowerAgeForGroup(
  bolgeAdi: string,
  growers: DemographicPerson[],
  color: string,
): GrowerAgeSeries {
  const buckets: GrowerAgeBucket[] = GROWER_AGE_BUCKETS.map((label) => ({
    label,
    count: 0,
  }))

  for (const grower of growers) {
    const bucketLabel = getGrowerAgeBucket(grower.age)
    if (!bucketLabel) continue
    const bucket = buckets.find((b) => b.label === bucketLabel)
    if (bucket) bucket.count += 1
  }

  return { bolgeAdi, buckets, color }
}

function buildHouseholdForGroup(
  bolgeAdi: string,
  growers: DemographicPerson[],
  children: DemographicPerson[],
  color: string,
): HouseholdSeries {
  const counts = new Map<number, number>()
  for (const grower of growers) {
    const childCount = children.filter((c) => c.ekiciId === grower.ekiciId).length
    const bucket = childCount >= 4 ? 4 : childCount
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }

  const total = growers.length || 1
  const labels = ['0', '1', '2', '3', '4+']
  const buckets: HouseholdBucket[] = labels.map((label, index) => {
    const num = index === 4 ? 4 : index
    const count = index === 4 ? (counts.get(4) ?? 0) : (counts.get(num) ?? 0)
    return {
      childCount: label,
      childCountNum: num,
      percentage: Math.round((count / total) * 1000) / 10,
    }
  })

  return { bolgeAdi, buckets, color }
}

function getDistinctBolgeler(people: DemographicPerson[]): string[] {
  const set = new Set<string>()
  for (const p of people) {
    if (p.bolgeAdi?.trim()) set.add(p.bolgeAdi.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

export function aggregateAgeGenderReport(
  ekiciler: EkiciDefinitionDto[],
  filters: AgeGenderReportFilters = {},
): AgeGenderReportData {
  const people = buildDemographicPopulation(ekiciler, filters)
  const growers = people.filter((p) => p.role === 'yetiştirici')
  const children = people.filter((p) => p.role === 'cocuk')
  const bolgeler = getDistinctBolgeler(people)

  const compareA = filters.compareBolgeA?.trim()
  const compareB = filters.compareBolgeB?.trim()

  let pyramidSeries: PyramidSeries[]
  if (compareA && compareB) {
    pyramidSeries = [
      buildPyramidForGroup(
        compareA,
        people.filter((p) => p.bolgeAdi === compareA),
        SERIES_COLORS[0],
      ),
      buildPyramidForGroup(
        compareB,
        people.filter((p) => p.bolgeAdi === compareB),
        SERIES_COLORS[1],
      ),
    ]
  } else if (compareA) {
    pyramidSeries = [
      buildPyramidForGroup(
        compareA,
        people.filter((p) => p.bolgeAdi === compareA),
        SERIES_COLORS[0],
      ),
      buildPyramidForGroup('Tümü', people, SERIES_COLORS[1]),
    ]
  } else {
    const topRegions = bolgeler.slice(0, 2)
    if (topRegions.length >= 2) {
      pyramidSeries = topRegions.map((bolge, i) =>
        buildPyramidForGroup(
          bolge,
          people.filter((p) => p.bolgeAdi === bolge),
          SERIES_COLORS[i % SERIES_COLORS.length],
        ),
      )
    } else {
      pyramidSeries = [buildPyramidForGroup('Tümü', people, SERIES_COLORS[0])]
    }
  }

  const householdCompareA = compareA ?? bolgeler[0]
  const householdCompareB = compareB ?? bolgeler[1]

  const growerAge: GrowerAgeSeries[] = []
  const household: HouseholdSeries[] = []

  if (householdCompareA) {
    const regionGrowers = growers.filter((g) => g.bolgeAdi === householdCompareA)
    growerAge.push(
      buildGrowerAgeForGroup(householdCompareA, regionGrowers, SERIES_COLORS[0]),
    )
    household.push(
      buildHouseholdForGroup(
        householdCompareA,
        regionGrowers,
        children,
        SERIES_COLORS[0],
      ),
    )
  }

  if (householdCompareB && householdCompareB !== householdCompareA) {
    const regionGrowers = growers.filter((g) => g.bolgeAdi === householdCompareB)
    growerAge.push(
      buildGrowerAgeForGroup(householdCompareB, regionGrowers, SERIES_COLORS[1]),
    )
    household.push(
      buildHouseholdForGroup(
        householdCompareB,
        regionGrowers,
        children,
        SERIES_COLORS[1],
      ),
    )
  }

  if (growerAge.length === 0) {
    growerAge.push(buildGrowerAgeForGroup('Tümü', growers, SERIES_COLORS[0]))
    household.push(buildHouseholdForGroup('Tümü', growers, children, SERIES_COLORS[0]))
  }

  return {
    kpis: computeKpis(people, growers),
    pyramid: pyramidSeries,
    growerAge,
    household,
  }
}

export function formatGenderLabel(gender: Gender): string {
  if (gender === 'erkek') return 'Erkek'
  if (gender === 'kadin') return 'Kadın'
  return 'Bilinmiyor'
}
