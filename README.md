# Prestij Tütün — Kurumsal Frontend

Production-ready **Vite + React + TypeScript** yönetim paneli. Backend **.NET API** ile entegre edilmek üzere tasarlanmıştır; **mock veri kullanılmaz**.

## Teknoloji yığını

| Teknoloji | Rol |
|-----------|-----|
| React 19 + TypeScript | UI ve tip güvenliği |
| Vite 8 | Derleme ve HMR |
| Tailwind CSS 4 | Responsive, yeşil-sarı kurumsal tema |
| React Router 7 | Sayfa yönlendirme, korumalı rotalar |
| Axios | HTTP istemcisi |
| TanStack Query | Sunucu state, cache, loading/error |
| Zustand | Auth, tema, UI (sidebar) state |
| ESLint + Prettier | Kod kalitesi ve format |

## Mimari kararlar

### Feature-based architecture
Her iş alanı `src/features/<feature>/` altında toplanır (`api`, `hooks`, `pages`, `types`). **Neden:** Domain sınırları net; yeni modül eklemek mevcut kodu minimum etkiler (ölçeklenebilirlik).

### `lib/api` abstraction (SOLID — DIP)
Feature'lar doğrudan Axios kullanmaz; `apiClient` üzerinden konuşur. **Neden:** HTTP katmanı değişirse (retry, auth, base URL) tek noktadan güncellenir.

### React Query + Zustand ayrımı (SRP)
- **Query:** API'den gelen veri (dashboard, users, settings).
- **Zustand:** Oturum, tema, sidebar durumu. **Neden:** Server/client state karışmaz; bakım kolaylaşır.

### Mock veri yok
Tüm listeler ve formlar gerçek endpoint'lere bağlıdır. API yokken `ErrorState` / boş tablo gösterilir. **Neden:** .NET sözleşmesiyle uyum bozulmaz.

### Absolute imports (`@/`)
`@/components/...` — **Neden:** Derin relative path'ler refactor'u zorlaştırır.

### Shared layout
`AppLayout` (sidebar + header) + `AuthLayout` (login). **Neden:** Sayfalar yalnızca içerik üretir (OCP).

## Klasör yapısı

```
src/
├── app/                 # Router, providers, App root
├── components/
│   ├── ui/              # Button, Input, Card, Modal, Table
│   ├── feedback/        # PageLoader, ErrorState, QueryBoundary
│   ├── layout/          # Sidebar, Header, AppLayout, AuthLayout
│   └── routing/         # ProtectedRoute, GuestRoute
├── features/
│   ├── auth/            # Login
│   ├── dashboard/       # KPI + aktivite
│   ├── users/           # Kullanıcı tablosu
│   └── settings/        # Profil ayarları
├── hooks/               # useTheme
├── lib/
│   ├── api/             # axios-instance, api-client, api-error
│   ├── query/           # query-keys
│   └── utils/           # cn()
├── pages/               # NotFoundPage
├── stores/              # auth, theme, ui
├── styles/              # Tailwind + tema tokenları
└── types/               # env.d.ts
```

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

Uygulama: [http://localhost:5173](http://localhost:5173)

## Geçici test kullanıcısı (geliştirme)

`.env` içinde `VITE_DEV_AUTH_ENABLED=true` iken (`npm run dev` — production build'de devreye girmez):

| Alan | Değer |
|------|--------|
| E-posta | `admin@prestij.com` |
| Şifre | `Test123!` |

Backend hazır olunca `.env` içinde `VITE_DEV_AUTH_ENABLED=false` yapın; giriş yalnızca .NET API üzerinden çalışır.

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `VITE_API_BASE_URL` | API kökü (örn. `/api` — Vite proxy ile .NET'e yönlenir) |
| `VITE_APP_NAME` | Uygulama adı (sidebar, login) |
| `VITE_DEV_AUTH_ENABLED` | `true` = geçici test girişi (yalnızca `npm run dev`) |

## .NET API entegrasyonu

### Beklenen endpoint'ler

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user }` |
| GET | `/auth/me` | Oturum doğrulama |
| GET | `/dashboard/summary` | KPI özeti |
| GET | `/dashboard/activity` | Son aktiviteler |
| GET | `/users` | Sayfalı liste (`page`, `pageSize`, `search`) |
| GET | `/settings/profile` | Kullanıcı ayarları |
| PUT | `/settings/profile` | Ayar güncelleme |

### Response zarfı (opsiyonel)

`apiClient` hem düz JSON hem de .NET tarzı zarfı destekler:

```json
{ "success": true, "data": { ... } }
```

Hata durumunda ASP.NET **ProblemDetails** (`title`, `detail`, `errors`) `AppError`'a normalize edilir.

### Geliştirme proxy'si

`vite.config.ts` içinde `/api` → `https://localhost:7001` (kendi .NET portunuza göre güncelleyin).

### Auth

JWT `Bearer` token; login sonrası `Authorization` header otomatik eklenir (Zustand persist).

## Script'ler

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run preview  # Build önizleme
npm run lint     # ESLint
npm run format   # Prettier
```

## Sayfalar

- `/login` — Giriş (GuestRoute)
- `/` — Dashboard (ProtectedRoute)
- `/users` — Kullanıcı listesi
- `/settings` — Ayarlar
- `*` — 404

## UI tema

Premium **yeşil (#1b7a3a) + sarı-altın (#e8b923)** kurumsal palet. Collapsible sidebar, modern header, mobil uyumlu drawer menü.

## Lisans

Özel proje — Prestij Tütün.
