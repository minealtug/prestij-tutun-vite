import { useCallback, useState, type RefObject } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AgeGenderReportFilters } from '../types/age-gender-report.types'
import {
  buildAgeGenderPdfSubtitle,
  exportElementsToPdf,
} from '../utils/export-age-gender-report-pdf'

interface AgeGenderPdfExportButtonProps {
  kpiRef: RefObject<HTMLElement | null>
  chartsRef: RefObject<HTMLElement | null>
  appliedFilters: AgeGenderReportFilters
  disabled?: boolean
}

export function AgeGenderPdfExportButton({
  kpiRef,
  chartsRef,
  appliedFilters,
  disabled = false,
}: AgeGenderPdfExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    const elements = [kpiRef.current, chartsRef.current].filter(
      (el): el is HTMLElement => el != null,
    )

    if (elements.length === 0) {
      window.alert('Rapor icerigi henuz hazir degil. Lutfen verilerin yuklenmesini bekleyin.')
      return
    }

    setExporting(true)
    try {
      await exportElementsToPdf(elements, {
        title: 'Yas-Cinsiyet Raporu',
        subtitle: buildAgeGenderPdfSubtitle(appliedFilters),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
      console.error('PDF disa aktarma hatasi:', error)
      window.alert(`PDF olusturulurken bir hata olustu: ${message}`)
    } finally {
      setExporting(false)
    }
  }, [appliedFilters, chartsRef, kpiRef])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={exporting}
      disabled={disabled || exporting}
      onClick={() => void handleExport()}
    >
      <FileDown className="h-4 w-4" aria-hidden />
      PDF İndir
    </Button>
  )
}
