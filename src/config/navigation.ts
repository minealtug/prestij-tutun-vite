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
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const sidebarSections: NavSection[] = [
  {
    items: [
      { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard, end: true },
      { to: '/soru-yonetimi', label: 'Soru Yönetimi', icon: FileQuestion },
      { to: '/anket-yonetimi', label: 'Anket Yönetimi', icon: ClipboardList },
      { to: '/anket-cevaplari', label: 'Anket Cevapları', icon: MessageSquareReply },
      { to: '/raporlar', label: 'Raporlar', icon: BarChart3 },
      { to: '/tanimlamalar', label: 'Tanımlamalar', icon: BookMarked },
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
  '/soru-yonetimi': 'Soru Yönetimi',
  '/anket-yonetimi': 'Anket Yönetimi',
  '/anket-cevaplari': 'Anket Cevapları',
  '/raporlar': 'Raporlar',
  '/tanimlamalar': 'Tanımlamalar',
  '/yetkilendirme': 'Yetkilendirme',
  '/users': 'Kullanıcılar',
  '/settings': 'Ayarlar',
}
