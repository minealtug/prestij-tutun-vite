import { domToCanvas } from 'modern-screenshot'
import { jsPDF } from 'jspdf'

const PAGE_MARGIN = 10
const EXPORT_ROOT_CLASS = 'pdf-export-root'

export interface ExportReportPdfOptions {
  title: string
  subtitle?: string
  fileName?: string
}

function lockChartContainerHeights(root: HTMLElement): Array<{ el: HTMLElement; height: string }> {
  const saved: Array<{ el: HTMLElement; height: string }> = []

  root.querySelectorAll('.recharts-responsive-container').forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    const rect = node.getBoundingClientRect()
    if (rect.height <= 0) return

    saved.push({ el: node, height: node.style.height })
    node.style.height = `${rect.height}px`
    node.style.width = `${rect.width}px`
  })

  return saved
}

function restoreChartContainerHeights(
  saved: Array<{ el: HTMLElement; height: string }>,
): void {
  for (const { el, height } of saved) {
    el.style.height = height
    el.style.width = ''
  }
}

async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  element.classList.add(EXPORT_ROOT_CLASS)
  const lockedHeights = lockChartContainerHeights(element)

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => resolve(), 150)
      })
    })
  })

  try {
    return await domToCanvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    })
  } finally {
    restoreChartContainerHeights(lockedHeights)
    element.classList.remove(EXPORT_ROOT_CLASS)
  }
}

function addImagePaginated(
  pdf: jsPDF,
  imgData: string,
  imgWidth: number,
  imgHeight: number,
  startY: number,
): void {
  const pageHeight = pdf.internal.pageSize.getHeight()
  let heightLeft = imgHeight
  let position = startY

  pdf.addImage(imgData, 'PNG', PAGE_MARGIN, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - position - PAGE_MARGIN

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', PAGE_MARGIN, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - PAGE_MARGIN * 2
  }
}

function toAsciiPdfText(value: string): string {
  return value
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/–/g, '-')
}

export async function exportElementsToPdf(
  elements: HTMLElement[],
  options: ExportReportPdfOptions,
): Promise<void> {
  if (elements.length === 0) {
    throw new Error('PDF icin yakalanacak icerik bulunamadi.')
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const printableWidth = pageWidth - PAGE_MARGIN * 2

  let cursorY = PAGE_MARGIN

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(toAsciiPdfText(options.title), PAGE_MARGIN, cursorY)
  cursorY += 9

  if (options.subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(90)
    const lines = pdf.splitTextToSize(toAsciiPdfText(options.subtitle), printableWidth)
    pdf.text(lines, PAGE_MARGIN, cursorY)
    cursorY += lines.length * 4.2 + 5
    pdf.setTextColor(0)
  }

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i]
    const canvas = await captureElement(element)

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Grafik goruntusu olusturulamadi.')
    }

    const imgData = canvas.toDataURL('image/png')
    const imgHeight = (canvas.height * printableWidth) / canvas.width

    if (cursorY + 30 > pageHeight - PAGE_MARGIN) {
      pdf.addPage()
      cursorY = PAGE_MARGIN
    }

    addImagePaginated(pdf, imgData, printableWidth, imgHeight, cursorY)

    if (i < elements.length - 1) {
      pdf.addPage()
      cursorY = PAGE_MARGIN
    }
  }

  const dateStamp = new Date().toISOString().slice(0, 10)
  pdf.save(options.fileName ?? `yas-cinsiyet-raporu-${dateStamp}.pdf`)
}

export function buildAgeGenderPdfSubtitle(filters: {
  yil?: number
  compareBolgeA?: string
  compareBolgeB?: string
  menseiId?: number
}): string {
  const parts = [`Olusturulma: ${new Date().toLocaleString('tr-TR')}`]
  if (filters.yil) parts.push(`Yil: ${filters.yil}`)
  if (filters.compareBolgeA) parts.push(`Karsilastirma A: ${filters.compareBolgeA}`)
  if (filters.compareBolgeB) parts.push(`Karsilastirma B: ${filters.compareBolgeB}`)
  return parts.join('  |  ')
}
