import { useMemo, useRef, useState } from 'react'

import { Link } from 'react-router-dom'

import { ArrowLeft } from 'lucide-react'

import { Card } from '@/components/ui/Card'

import { PageContainer } from '@/components/layout/PageContainer'

import { QueryBoundary } from '@/components/feedback/QueryBoundary'

import { useRequirePagePermission } from '@/features/permissions/hooks/use-require-page-permission'

import { AgeGenderKpiCards } from '../components/AgeGenderKpiCards'

import { AgeGenderPdfExportButton } from '../components/AgeGenderPdfExportButton'

import { AgeGenderReportFiltersBar } from '../components/AgeGenderReportFiltersBar'

import { GrowerAgeHistogram } from '../components/GrowerAgeHistogram'

import { HouseholdStructureChart } from '../components/HouseholdStructureChart'

import { PopulationPyramidChart } from '../components/PopulationPyramidChart'

import { useAgeGenderReport } from '../hooks/use-age-gender-report'

import type { AgeGenderReportFilters } from '../types/age-gender-report.types'



export function AgeGenderReportPage() {

  const { canRead, loading: permissionLoading } = useRequirePagePermission()

  const [draftFilters, setDraftFilters] = useState<AgeGenderReportFilters>({})

  const [appliedFilters, setAppliedFilters] = useState<AgeGenderReportFilters>({})

  const kpiExportRef = useRef<HTMLDivElement>(null)

  const chartsExportRef = useRef<HTMLDivElement>(null)



  const { report, bolgeler, menseiler, ekiciQuery } = useAgeGenderReport(appliedFilters)



  const compareMode = Boolean(

    appliedFilters.compareBolgeA && appliedFilters.compareBolgeB,

  )



  const defaultCompare = useMemo(() => {

    if (bolgeler.length >= 2) {

      return { compareBolgeA: bolgeler[0], compareBolgeB: bolgeler[1] }

    }

    return {}

  }, [bolgeler])



  if (permissionLoading) {

    return (

      <PageContainer>

        <p className="text-sm text-muted">Yükleniyor…</p>

      </PageContainer>

    )

  }



  if (!canRead) return null



  return (

    <PageContainer>

      <Link

        to="/raporlar"

        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary-600"

      >

        <ArrowLeft className="h-4 w-4" aria-hidden />

        Tüm raporlar

      </Link>



      <QueryBoundary

        query={ekiciQuery}

        loadingLabel="Özet kartları hazırlanıyor…"

        loadingVariant="skeleton-stats"

        errorVariant="compact"

      >

        {report && (

          <div ref={kpiExportRef}>

            <AgeGenderKpiCards kpis={report.kpis} />

          </div>

        )}

      </QueryBoundary>



      <AgeGenderReportFiltersBar

        bolgeler={bolgeler}

        menseiler={menseiler}

        filters={draftFilters}

        onChange={setDraftFilters}

        onApply={() => setAppliedFilters({ ...draftFilters })}

      />



      <QueryBoundary

        query={ekiciQuery}

        loadingLabel="Rapor verileri hazırlanıyor…"

      >

        {report && (

          <div ref={chartsExportRef} className="page-stack">

            <Card

              title="Nüfus piramidi"

              description="Yaş × cinsiyet dağılımı — sol erkek, sağ kadın"

              accent

              className="overflow-hidden"

            >

              <div className="border-t border-border/60 pt-5">

                <PopulationPyramidChart

                  series={report.pyramid}

                  compareMode={compareMode}

                />

              </div>

            </Card>



            <div className="grid gap-6 lg:grid-cols-2">

              <Card

                title="Yetiştirici yaş dağılımı"

                description="Üretici kitlesi yaşlanıyor mu? Bölgesel overlay"

              >

                <GrowerAgeHistogram series={report.growerAge} />

              </Card>



              <Card

                title="Hane yapısı dağılımı"

                description="Çocuk sayısına göre yetiştirici yüzdesi — bölge karşılaştırması"

              >

                <HouseholdStructureChart series={report.household} />

              </Card>

            </div>

          </div>

        )}

      </QueryBoundary>



      {report && (

        <div className="flex justify-end">

          <AgeGenderPdfExportButton

            kpiRef={kpiExportRef}

            chartsRef={chartsExportRef}

            appliedFilters={appliedFilters}

            disabled={ekiciQuery.isLoading || ekiciQuery.isFetching}

          />

        </div>

      )}



      {!ekiciQuery.isLoading && bolgeler.length >= 2 && !appliedFilters.compareBolgeA && (

        <p className="text-center text-xs text-muted">

          İpucu: Karşılaştırma için{' '}

          <button

            type="button"

            className="font-medium text-primary-600 underline-offset-2 hover:underline"

            onClick={() => {

              const next = { ...defaultCompare }

              setDraftFilters(next)

              setAppliedFilters(next)

            }}

          >

            {defaultCompare.compareBolgeA} vs {defaultCompare.compareBolgeB}

          </button>{' '}

          seçimini uygulayabilirsiniz.

        </p>

      )}

    </PageContainer>

  )

}


