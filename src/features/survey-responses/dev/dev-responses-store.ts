import type {
  AlimNoktasiDto,
  AnketCevapDetayDto,
  AnketCevapOzetItem,
  AnketSoruCevapDto,
  BolgeDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import { getAnketCevapRowId } from '../types/survey-response.types'
import { filterAnketCevapList } from '../utils/filter-anket-cevap-list'
import { sortAnketCevapOzetList } from '../utils/map-anket-cevap'

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

const OZET_SEED: AnketCevapOzetItem[] = [
  {
    id: getAnketCevapRowId('dev-ekici-1', 1),
    ekiciId: 'dev-ekici-1',
    baslikId: 1,
    sablonId: 1,
    ekiciAd: 'Test',
    ekiciSoyad: 'Ekici',
    mintikaAdi: 'KALE',
    baslikAdi: 'Sezon Sonu Anketi',
    sablonAdi: 'Sezon Sonu Anketi',
    sonIslemTarihi: '2026-05-20T14:32:00.000Z',
    yanitlananSoruSayisi: 2,
    yanitlanmayanSoruSayisi: 2,
  },
]

const DETAIL_SORULAR: AnketSoruCevapDto[] = [
  {
    sira: 1,
    soruId: 1,
    soruMetni: 'Genel memnuniyetiniz?',
    yanitlandi: true,
    cevap: { cevapAltSecenekAdi: null, cevapText: 'Çok memnunum' },
  },
  {
    sira: 2,
    soruId: 2,
    soruMetni: 'Ürün kalitesi hakkında görüşünüz',
    yanitlandi: true,
    cevap: { cevapAltSecenekAdi: null, cevapText: 'Kalite standartların üzerinde' },
  },
  {
    sira: 3,
    soruId: 3,
    soruMetni: 'Ek önerileriniz?',
    yanitlandi: false,
    cevap: null,
  },
  {
    sira: 4,
    soruId: 4,
    soruMetni: 'Detaylı açıklama',
    altSoruMetni: 'Kalite değerlendirmenize göre',
    bagliSoru: true,
    bagliOlduguSoruId: 2,
    yanitlandi: false,
    cevap: null,
  },
]

export const devResponsesStore = {
  getMenseiler(): FilterOptionDto[] {
    return MENSEI_SEED
  },

  getBolgeler(menseiId?: number): BolgeDto[] {
    if (menseiId) return BOLGE_SEED.filter((b) => b.menseiId === menseiId)
    return BOLGE_SEED
  },

  getMintikalar(bolgeId?: number): MintikaDto[] {
    if (bolgeId) return MINTIKA_SEED.filter((m) => m.bolgeId === bolgeId)
    return MINTIKA_SEED
  },

  getAlimNoktalari(mintikaId?: number): AlimNoktasiDto[] {
    if (mintikaId) return ALIM_NOKTASI_SEED.filter((a) => a.mintikaId === mintikaId)
    return ALIM_NOKTASI_SEED
  },

  getKoyler(alimNoktasiId?: number): KoyDto[] {
    if (alimNoktasiId) return KOY_SEED.filter((k) => k.alimNoktasiId === alimNoktasiId)
    return KOY_SEED
  },

  getList(params: SurveyResponsesQueryParams): AnketCevapOzetItem[] {
    return filterAnketCevapList(sortAnketCevapOzetList(OZET_SEED), params)
  },

  getDetail(ekiciId: string, sablonId: number): AnketCevapDetayDto {
    if (ekiciId === 'dev-ekici-1' && sablonId === 1) {
      return {
        sorular: DETAIL_SORULAR,
        yanitlanmayanSoruSayisi: 2,
      }
    }
    return { sorular: [], yanitlanmayanSoruSayisi: 0 }
  },
}
