import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  ClipboardPen,
  MessageSquareReply,
  BarChart3,
  BookMarked,
  Shield,
  Users,
  Ruler,
  UserRound,
  List,
} from 'lucide-react'

export interface NavItem {
  to?: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/** Yalnızca admin kullanıcıların görebileceği rotalar */
export const ADMIN_ONLY_PATHS = ['/yetkilendirme', '/users'] as const

export function isAdminOnlyPath(path: string): boolean {
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path || '/'
  return (ADMIN_ONLY_PATHS as readonly string[]).includes(normalized)
}

export interface AssignableMenuUrlOption {
  value: string
  label: string
}

/** Yetkilendirme modalı — admin sayfaları hariç tüm sidebar rotaları */
export function getAssignableMenuUrlOptions(): AssignableMenuUrlOption[] {
  const seen = new Set<string>()
  const options: AssignableMenuUrlOption[] = []

  function collect(items: NavItem[]) {
    for (const item of items) {
      if (item.to && !isAdminOnlyPath(item.to) && !seen.has(item.to)) {
        seen.add(item.to)
        options.push({
          value: item.to,
          label: pageTitles[item.to] ?? item.label,
        })
      }
      if (item.children?.length) collect(item.children)
    }
  }

  for (const section of sidebarSections) {
    collect(section.items)
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))
}

export const sidebarSections: NavSection[] = [
  {
    items: [
      { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard, end: true },
      { to: '/soru-yonetimi', label: 'Soru Ekleme', icon: FileQuestion },
      { to: '/anket-doldurma', label: 'Anket Doldurma Ekranı', icon: ClipboardPen },
      { to: '/anket-cevaplari', label: 'Cevaplanan Anketler', icon: MessageSquareReply },
      { to: '/cevapladigim-anketler', label: 'Cevapladığım Anketler', icon: MessageSquareReply },
      { to: '/raporlar', label: 'Raporlar', icon: BarChart3 },
      {
        label: 'Tanımlamalar',
        icon: BookMarked,
        children: [
          { to: '/tanimlamalar/soru-tanimlamalari', label: 'Tanımlı Sorular', icon: FileQuestion },
          { to: '/tanimlamalar/anket-tanimlamalari', label: 'Anket Tanımlama', icon: ClipboardList },
          { to: '/tanimlamalar/birim-tanimlamalari', label: 'Birim Tanımlama', icon: Ruler },
          { to: '/tanimlamalar/secenek-tanimlamalari', label: 'Seçenek Tanımla', icon: List },
          { to: '/tanimlamalar/ekici-tanimlamalari', label: 'Ekici Tanımlama', icon: UserRound },
        ],
      },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { to: '/yetkilendirme', label: 'Yetkilendirme', icon: Shield },
      { to: '/users', label: 'Kullanıcılar', icon: Users },
    ],
  },
]

export const pageTitles: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/soru-yonetimi': 'Soru Ekleme',
  '/anket-doldurma': 'Anket Doldurma Ekranı',
  '/anket-cevaplari': 'Cevaplanan Anketler',
  '/cevapladigim-anketler': 'Cevapladığım Anketler',
  '/raporlar': 'Raporlar',
  '/raporlar/yas-cinsiyet': 'Yaş–Cinsiyet Raporu',
  '/tanimlamalar': 'Tanımlamalar',
  '/tanimlamalar/soru-tanimlamalari': 'Tanımlı Sorular',
  '/tanimlamalar/anket-tanimlamalari': 'Anket Tanımlama',
  '/tanimlamalar/birim-tanimlamalari': 'Birim Tanımlama',
  '/tanimlamalar/secenek-tanimlamalari': 'Seçenek Tanımla',
  '/tanimlamalar/ekici-tanimlamalari': 'Ekici Tanımlama',
  '/yetkilendirme': 'Yetkilendirme',
  '/users': 'Kullanıcılar',
  '/settings': 'Ayarlar',
}
