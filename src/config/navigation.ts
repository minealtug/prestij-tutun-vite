import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  MessageSquareReply,
  BarChart3,
  BookMarked,
  Shield,
  Users,
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

export const sidebarSections: NavSection[] = [
  {
    items: [
      { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard, end: true },
      { to: '/soru-yonetimi', label: 'Soru Ekleme', icon: FileQuestion },
      { to: '/anket-cevaplari', label: 'Cevaplanan Anketler', icon: MessageSquareReply },
      { to: '/raporlar', label: 'Raporlar', icon: BarChart3 },
      {
        label: 'Tanımlamalar',
        icon: BookMarked,
        children: [
          { to: '/tanimlamalar/soru-tanimlamalari', label: 'Tanımlı Sorular', icon: FileQuestion },
          { to: '/tanimlamalar/anket-tanimlamalari', label: 'Anket Tanımlama', icon: ClipboardList },
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
  '/anket-cevaplari': 'Cevaplanan Anketler',
  '/raporlar': 'Raporlar',
  '/tanimlamalar': 'Tanımlamalar',
  '/tanimlamalar/soru-tanimlamalari': 'Tanımlı Sorular',
  '/tanimlamalar/anket-tanimlamalari': 'Anket Tanımlama',
  '/yetkilendirme': 'Yetkilendirme',
  '/users': 'Kullanıcılar',
  '/settings': 'Ayarlar',
}
