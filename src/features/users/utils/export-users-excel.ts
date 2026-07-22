import * as XLSX from 'xlsx-js-style'
import { applyExcelHeaderStyles } from '@/lib/utils/excel-header-style'
import type { UserDto } from '../types/user.types'

function formatExportDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function exportUsersToExcel(rows: UserDto[]): void {
  const sheetRows = rows.map((row) => ({
    Kullanıcı: row.userName || '',
    'Ad Soyad': row.fullName || '',
    Durum: row.aktif ? 'Aktif' : 'Pasif',
    Admin: row.admin ? 'Evet' : 'Hayır',
    Tip: row.userTypeDescription || '',
    Lokasyon: row.lokasyon || '',
    Departman: row.departmanAdi || '',
    Mıntıka: row.mintikaAdi || '',
    'Üretim Merkezi': row.uretimMerkeziYetki ? 'Var' : 'Yok',
    'E-posta': row.email || '',
    Tel: row.tel || '',
    'Sigorta No': row.insuranceNumber || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  applyExcelHeaderStyles(worksheet)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kullanıcılar')

  XLSX.writeFile(workbook, `kullanicilar-${formatExportDate()}.xlsx`, { cellStyles: true })
}
