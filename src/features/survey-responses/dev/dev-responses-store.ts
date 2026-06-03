import type {
  AlimNoktasiDto,
  AnketCevapDto,
  BolgeDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
  SurveyResponseGroup,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import { groupAnketCevaplari } from '../utils/map-anket-cevap'

const MENSEI_SEED: FilterOptionDto[] = [
  { id: 1, adi: 'TÜRKİYE' },
  { id: 2, adi: 'İTHAL' },
]

const BOLGE_SEED: BolgeDto[] = [
  { id: 1, adi: 'EGE', menseiId: 1 },
  { id: 2, adi: 'KARADENİZ', menseiId: 1 },
  { id: 3, adi: 'İTHAL BÖLGE', menseiId: 2 },
]

const MINTIKA_SEED: MintikaDto[] = [
  { id: 6, adi: 'KALE', bolgeId: 1 },
  { id: 7, adi: 'TORBALI', bolgeId: 1 },
  { id: 8, adi: 'AKHİSAR', bolgeId: 1 },
]

const ALIM_NOKTASI_SEED: AlimNoktasiDto[] = [
  { id: 1, adi: 'İZMİR', mintikaId: 6 },
  { id: 2, adi: 'MANİSA', mintikaId: 6 },
  { id: 3, adi: 'SAMSUN', mintikaId: 7 },
]

const KOY_SEED: KoyDto[] = [
  { id: 101, adi: 'YENİKÖY', alimNoktasiId: 1 },
  { id: 102, adi: 'KIRCAALI', alimNoktasiId: 1 },
  { id: 103, adi: 'ÇAMLIK', alimNoktasiId: 2 },
]

const CEVAP_SEED: AnketCevapDto[] = [
  {
    id: 'resp-1',
    soruId: 1,
    soruMetni: 'Genel memnuniyetiniz?',
    ekiciId: 'dev-ekici-1',
    ekiciAd: 'Test',
    ekiciSoyad: 'Ekici',
    sablonId: 1,
    sablonAdi: 'Sezon Sonu Anketi',
    menseiId: 1,
    menseiAdi: 'TÜRKİYE',
    bolgeId: 1,
    bolgeAdi: 'EGE',
    mintikaId: 6,
    mintikaAdi: 'KALE',
    alimNoktasiId: 1,
    alimNoktasiAdi: 'İZMİR',
    koyId: 101,
    koyAdi: 'YENİKÖY',
    kullaniciId: 1,
    islemTarihi: '2026-05-20T14:32:00.000Z',
    cevapAltSecenekId: null,
    cevapAltSecenekAdi: null,
    cevapText: 'Çok memnunum',
    cevapNumeric: null,
    cevapDatetime: null,
    birimId: null,
    kaynak: 'Dev',
  },
  {
    id: 'resp-2',
    soruId: 2,
    soruMetni: 'Ürün kalitesi hakkında görüşünüz',
    ekiciId: 'dev-ekici-1',
    ekiciAd: 'Test',
    ekiciSoyad: 'Ekici',
    sablonId: 1,
    sablonAdi: 'Sezon Sonu Anketi',
    menseiId: 1,
    menseiAdi: 'TÜRKİYE',
    bolgeId: 1,
    bolgeAdi: 'EGE',
    mintikaId: 6,
    mintikaAdi: 'KALE',
    alimNoktasiId: 1,
    alimNoktasiAdi: 'İZMİR',
    koyId: 101,
    koyAdi: 'YENİKÖY',
    kullaniciId: 1,
    islemTarihi: '2026-05-20T14:32:00.000Z',
    cevapAltSecenekId: null,
    cevapAltSecenekAdi: null,
    cevapText: 'Kalite standartların üzerinde',
    cevapNumeric: null,
    cevapDatetime: null,
    birimId: null,
    kaynak: 'Dev',
  },
]

function matchesFilters(row: AnketCevapDto, params: SurveyResponsesQueryParams): boolean {
  if (params.menseiId && row.menseiId !== params.menseiId) return false
  if (params.bolgeId && row.bolgeId !== params.bolgeId) return false
  if (params.mintikaId && row.mintikaId !== params.mintikaId) return false
  if (params.alimNoktasiId && row.alimNoktasiId !== params.alimNoktasiId) return false
  if (params.koyId && row.koyId !== params.koyId) return false
  return true
}

export const devResponsesStore = {
  getMenseiler(): FilterOptionDto[] {
    return MENSEI_SEED
  },

  getBolgeler(menseiId: number): BolgeDto[] {
    return BOLGE_SEED.filter((b) => b.menseiId === menseiId)
  },

  getMintikalar(bolgeId: number): MintikaDto[] {
    return MINTIKA_SEED.filter((m) => m.bolgeId === bolgeId)
  },

  getAlimNoktalari(mintikaId: number): AlimNoktasiDto[] {
    return ALIM_NOKTASI_SEED.filter((a) => a.mintikaId === mintikaId)
  },

  getKoyler(alimNoktasiId: number): KoyDto[] {
    return KOY_SEED.filter((k) => k.alimNoktasiId === alimNoktasiId)
  },

  getFiltered(params: SurveyResponsesQueryParams): SurveyResponseGroup[] {
    const items = CEVAP_SEED.filter((r) => matchesFilters(r, params))
    return groupAnketCevaplari(items)
  },
}
