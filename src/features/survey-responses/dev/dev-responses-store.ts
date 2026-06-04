import type {
  AlimNoktasiDto,
  AnketCevapGrupDto,
  BolgeDto,
  FilterOptionDto,
  KoyDto,
  MintikaDto,
  SurveyResponseGroup,
  SurveyResponsesQueryParams,
} from '../types/survey-response.types'
import { mapAnketCevapListFromApi } from '../utils/map-anket-cevap'

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

const CEVAP_GRUP_SEED: AnketCevapGrupDto[] = [
  {
    ekiciId: 'dev-ekici-1',
    ekiciAd: 'Test',
    ekiciSoyad: 'Ekici',
    mintikaId: 6,
    mintikaAdi: 'KALE',
    sablonId: 1,
    sablonAdi: 'Sezon Sonu Anketi',
    baslikId: 1,
    baslikAdi: 'Sezon Sonu Anketi',
    sonIslemTarihi: '2026-05-20T14:32:00.000Z',
    yanitlananSoruSayisi: 2,
    yanitlanmayanSoruSayisi: 2,
    sorular: [
      {
        sira: 1,
        soruId: 1,
        soruMetni: 'Genel memnuniyetiniz?',
        altSoruMetni: null,
        zorunlu: true,
        bagliSoru: false,
        yanitlandi: true,
        cevap: {
          id: 'resp-1',
          soruId: 1,
          soruMetni: 'Genel memnuniyetiniz?',
          ekiciId: 'dev-ekici-1',
          ekiciAd: 'Test',
          ekiciSoyad: 'Ekici',
          sablonId: 1,
          sablonAdi: 'Sezon Sonu Anketi',
          mintikaId: 6,
          mintikaAdi: 'KALE',
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
      },
      {
        sira: 2,
        soruId: 2,
        soruMetni: 'Ürün kalitesi hakkında görüşünüz',
        altSoruMetni: null,
        zorunlu: true,
        bagliSoru: false,
        yanitlandi: true,
        cevap: {
          id: 'resp-2',
          soruId: 2,
          soruMetni: 'Ürün kalitesi hakkında görüşünüz',
          ekiciId: 'dev-ekici-1',
          ekiciAd: 'Test',
          ekiciSoyad: 'Ekici',
          sablonId: 1,
          sablonAdi: 'Sezon Sonu Anketi',
          mintikaId: 6,
          mintikaAdi: 'KALE',
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
      },
      {
        sira: 3,
        soruId: 3,
        soruMetni: 'Ek önerileriniz?',
        altSoruMetni: null,
        zorunlu: false,
        bagliSoru: false,
        yanitlandi: false,
        cevap: null,
      },
      {
        sira: 4,
        soruId: 4,
        soruMetni: 'Detaylı açıklama',
        altSoruMetni: 'Kalite değerlendirmenize göre',
        zorunlu: false,
        bagliSoru: true,
        yanitlandi: false,
        cevap: null,
      },
    ],
    yanitlananSorular: [],
    yanitlanmayanSorular: [
      {
        id: 3,
        baslikId: 1,
        baslikAdi: 'Sezon Sonu Anketi',
        cevapGirdiTipAdi: 'Text',
        soruMetni: 'Ek önerileriniz?',
        altSoruMetni: null,
        zorunlu: false,
        aktif: true,
        secenekGrupId: null,
        bagliSoru: false,
        bagliOlduguSoruId: null,
        bagliOlduguSoru: null,
        kaynak: 'Dev',
      },
      {
        id: 4,
        baslikId: 1,
        baslikAdi: 'Sezon Sonu Anketi',
        cevapGirdiTipAdi: 'Text',
        soruMetni: 'Detaylı açıklama',
        altSoruMetni: 'Kalite değerlendirmenize göre',
        zorunlu: false,
        aktif: true,
        secenekGrupId: null,
        bagliSoru: true,
        bagliOlduguSoruId: 2,
        bagliOlduguSoru: 'Ürün kalitesi hakkında görüşünüz',
        kaynak: 'Dev',
      },
    ],
  },
]

function matchesFilters(grup: AnketCevapGrupDto, params: SurveyResponsesQueryParams): boolean {
  if (params.mintikaId && grup.mintikaId !== params.mintikaId) return false
  return true
}

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

  getFiltered(params: SurveyResponsesQueryParams): SurveyResponseGroup[] {
    const items = CEVAP_GRUP_SEED.filter((r) => matchesFilters(r, params))
    return mapAnketCevapListFromApi(items)
  },
}
