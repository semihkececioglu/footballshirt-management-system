# ⚽ Forma Yönetim Sistemi — Proje Dökümanı & Roadmap

> **Stack:** MongoDB · Express.js · React (Vite) · Node.js  
> **UI:** Shadcn UI · Tailwind CSS · Geist + Prata fonts  
> **Deploy:** Vercel (Frontend) · Railway (Backend) · Cloudinary (Media)  
> **Theme:** Vintage Paper · Dark/Light Mode

---

## 📁 Proje Yapısı (Monorepo)

```
forma-yonetim/
├── scripts/
│   └── migrate-country-keys.js    # DB migration: ülke adlarını key formatına çevirir
│
├── client/                        # React + Vite Frontend
│   ├── public/
│   │   └── data/
│   │       ├── teams.json         # Takım listesi (168 takım, statik)
│   │       ├── competitions.json  # Ülke/lig hiyerarşisi (TeamSelector için)
│   │       ├── brands.json        # Marka listesi
│   │       └── technologies.json  # Teknoloji listesi
│   ├── src/
│   │   ├── assets/
│   │   │   └── logos/             # Takım SVG logoları
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn UI base components
│   │   │   ├── common/            # Reusable custom components
│   │   │   │   ├── DataTable/
│   │   │   │   ├── JerseyCard/
│   │   │   │   ├── ImageUploader/
│   │   │   │   ├── TeamSelector/
│   │   │   │   ├── FilterBar/
│   │   │   │   ├── BulkActions/
│   │   │   │   ├── StatCard/
│   │   │   │   └── ViewToggle/    # Grid/List toggle
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── MobileNav.jsx
│   │   │   │   └── PageWrapper.jsx
│   │   │   └── forms/
│   │   │       ├── JerseyForm/
│   │   │       ├── SaleForm/
│   │   │       ├── BuyerForm/
│   │   │       └── ReminderForm/
│   │   ├── pages/
│   │   │   ├── ForSale/           # Satılıklar
│   │   │   ├── Sold/              # Satılanlar
│   │   │   ├── Wishlist/          # Satın Alma Listesi
│   │   │   ├── Sellers/           # Satıcılar
│   │   │   ├── Purchased/         # Satın Alınanlar
│   │   │   ├── Statistics/        # İstatistikler
│   │   │   ├── Reports/           # Raporlar
│   │   │   ├── Reminders/         # Hatırlatıcılar
│   │   │   └── Public/            # Herkese açık vitrin
│   │   ├── store/                 # Zustand state management
│   │   ├── hooks/                 # Custom hooks
│   │   ├── lib/                   # Utils, helpers, constants
│   │   ├── services/              # API çağrıları (axios)
│   │   └── styles/
│   │       ├── globals.css        # Tailwind + CSS variables
│   │       └── vintage-theme.css  # Vintage Paper Theme
│   └── vite.config.js
│
├── server/                        # Express.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── jersey.controller.js
│   │   │   ├── sale.controller.js
│   │   │   ├── purchase.controller.js
│   │   │   ├── seller.controller.js
│   │   │   ├── wishlist.controller.js
│   │   │   ├── reminder.controller.js
│   │   │   ├── stats.controller.js
│   │   │   └── report.controller.js
│   │   ├── models/
│   │   │   ├── Jersey.model.js
│   │   │   ├── Sale.model.js
│   │   │   ├── Purchase.model.js
│   │   │   ├── Seller.model.js
│   │   │   ├── Wishlist.model.js
│   │   │   └── Reminder.model.js
│   │   ├── routes/
│   │   │   ├── jersey.routes.js
│   │   │   ├── sale.routes.js
│   │   │   ├── purchase.routes.js
│   │   │   ├── seller.routes.js
│   │   │   ├── wishlist.routes.js
│   │   │   ├── reminder.routes.js
│   │   │   ├── stats.routes.js
│   │   │   ├── report.routes.js
│   │   │   └── public.routes.js   # Auth gerektirmeyen route
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT doğrulama
│   │   │   ├── upload.middleware.js # Cloudinary
│   │   │   └── error.middleware.js
│   │   ├── services/
│   │   │   └── cloudinary.service.js
│   │   └── utils/
│   └── server.js
│
└── README.md
```

---

## 🗄️ MongoDB Şemaları

### Jersey (Forma)
```javascript
{
  // Görsel
  images: [{ url: String, publicId: String, isMain: Boolean }],

  // Temel Bilgiler
  teamName: String,           // teams.json'dan
  country: String,
  league: String,
  season: String,             // "2024/25" formatı
  
  // Forma Özellikleri
  type: { enum: ['Home','Away','3rd','4th','5th','Anniversary','Special',
                 'Pre-match','Şort','Ceket','Antrenman','Kaleci','Diğer'] },
  quality: { enum: ['Supporter Tee','Replica','Authentic',
                    'Player Issue','Match Issue','Match Worn'] },
  brand: String,
  technology: String,
  size: { enum: ['XS','S','M','L','XL','XXL','3XL','4XL','5XL'] },
  
  // Ölçüler
  measurements: {
    armpit: Number,           // Koltuk altı (cm)
    length: Number            // Uzunluk (cm)
  },
  
  // Detaylar
  sponsor: String,
  condition: { enum: ['Sıfır etiketli','Sıfır etiketli defolu','Sıfır',
                      'Sıfır defolu','Mükemmel','İyi','Orta','Kötü'] },
  printing: {
    hasNumber: Boolean,
    number: String,
    playerName: String
  },
  
  // Fiyat & Stok
  buyPrice: Number,           // TL
  sellPrice: Number,          // TL
  stockCount: Number,
  
  // Platform Linkleri
  platforms: [{
    name: { enum: ['Dolap','Sahibinden','Letgo','eBay','Vinted','Diğer'] },
    listingUrl: String,
    isActive: Boolean
  }],
  
  // Durum
  status: { enum: ['for_sale','sold','not_for_sale'] },
  
  // Tarihler
  purchaseDate: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // Meta
  notes: String,
  tags: [String]
}
```

### Sale (Satış)
```javascript
{
  jerseyId: ObjectId,         // ref: Jersey
  
  // Alıcı Bilgileri
  buyerName: String,
  buyerUsername: String,
  buyerPhone: String,
  
  // Satış Detayları
  platform: String,
  listingUrl: String,
  salePrice: Number,          // TL
  paymentMethod: { enum: ['IBAN','Nakit','Papara','Havale','Diğer'] },
  
  soldAt: Date,
  notes: String
}
```

### Purchase (Satın Alma)
```javascript
{
  images: [{ url: String, publicId: String }],
  
  teamName: String,
  season: String,
  type: String,
  quality: String,
  brand: String,
  size: String,
  condition: String,
  
  buyPrice: Number,
  seller: { type: ObjectId, ref: 'Seller' },
  platform: String,
  
  isForResale: Boolean,       // Satılık olarak sisteme eklenecek mi?
  linkedJerseyId: ObjectId,  // Satılıklara bağlıysa
  
  purchaseDate: Date,
  notes: String
}
```

### Seller (Satıcı)
```javascript
{
  name: String,
  username: String,
  phone: String,
  platforms: [{
    name: String,
    profileUrl: String,
    username: String
  }],
  notes: String,
  createdAt: Date
}
```

### Wishlist (Satın Alma Listesi)
```javascript
{
  image: String,
  teamName: String,
  season: String,
  type: String,
  targetPrice: Number,
  listingUrl: String,
  priority: { enum: ['low','medium','high'] },
  status: { enum: ['active','purchased','cancelled'] },
  notes: String,
  createdAt: Date
}
```

### Reminder (Hatırlatıcı)
```javascript
{
  // İsteyen Kişi
  contactName: String,
  contactPhone: String,
  contactPlatforms: [{
    name: String,
    username: String
  }],
  
  // İstek Detayı
  requestNote: String,
  image: String,
  
  status: { enum: ['open','notified','closed'] },
  
  // İlgili forma bilgisi (opsiyonel)
  teamName: String,
  season: String,
  type: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Tema: Vintage Paper

### CSS Variables
```css
:root {
  /* Vintage Paper Light */
  --bg-primary: #F5F0E8;
  --bg-secondary: #EDE8DE;
  --bg-card: #FAF7F2;
  --text-primary: #2C2416;
  --text-secondary: #6B5B45;
  --text-muted: #9C8B76;
  --accent: #8B4513;          /* Saddle Brown */
  --accent-light: #D2691E;
  --border: #D4C9B8;
  --shadow: rgba(44,36,22,0.12);
  
  /* Fonts */
  --font-display: 'Prata', Georgia, serif;
  --font-body: 'Geist', system-ui, sans-serif;
}

.dark {
  --bg-primary: #1A1510;
  --bg-secondary: #221D16;
  --bg-card: #2A231A;
  --text-primary: #F0EAD6;
  --text-secondary: #C4B99A;
  --text-muted: #8A7D66;
  --accent: #C4854A;
  --border: #3D3326;
}
```

### Tipografi
- **Başlıklar:** `Prata` — serif, güçlü, vintage karakter
- **Body/UI:** `Geist` — modern, okunabilir, clean
- **Sayılar/Kod:** `Geist Mono`

---

## 🖥️ Sayfa Detayları

### 1. Satılıklar (`/for-sale`)
**Tablo Kolonları:** Görsel · Takım · Sezon · Tip · Nitelik · Beden · Kondisyon · Fiyat · Stok · Platformlar · Durum · Actions

**Actions:** Görüntüle · Düzenle · Satıldı İşaretle · Kopyala · Sil

**Filters:** Takım · Lig · Ülke · Sezon · Tip · Nitelik · Marka · Beden · Kondisyon · Fiyat Aralığı

**Bulk Actions:** Seçilenleri Sil · Fiyat Güncelle · Platforma Ekle

**View Modes:** Tablo (default) · Kart (3:4 oranında)

---

### 2. Satılanlar (`/sold`)
Satılıklar tablosuna ek olarak: Alıcı Adı · Platform · Satış Fiyatı · Satış Tarihi · Ödeme Yöntemi

---

### 3. Satın Alma Listesi (`/wishlist`)
**Kolonlar:** Görsel · Takım · Sezon · Tip · Hedef Fiyat · İlan Linki · Öncelik · Durum

---

### 4. Satıcılar (`/sellers`)
**Kolonlar:** Ad · Kullanıcı Adı · Telefon · Platformlar · Alım Sayısı · İletişime Geç

**İletişime Geç:** WhatsApp deep link → `https://wa.me/90XXXXXXXXXX`

---

### 5. Satın Alınanlar (`/purchased`)
Koleksiyon amaçlı satın alınanlar dahil tüm alımlar.

---

### 6. İstatistikler (`/statistics`)
**Kartlar:** Toplam Satış · Toplam Ciro · Net Kar · Aktif İlan Sayısı · Stok Değeri

**Grafikler (Shadcn Charts):**
- Aylık Satış Adedi (Bar)
- Aylık Ciro/Kar (Line)
- Takım Bazlı Satış Dağılımı (Pie)
- Beden Dağılımı (Bar)
- Platform Performansı (Bar)
- En Çok Satan Takımlar (Top 10)
- Alıcı Bazlı Satış Geçmişi

**Filtre:** Yıl · Ay seçimi

---

### 7. Raporlar (`/reports`)
**Klasör Yapısı:**
```
Raporlar/
├── 2024/
│   ├── Ocak
│   ├── Şubat
│   └── ...
└── 2025/
    ├── Ocak
    └── ...
```

**Rapor İçeriği:** Satılan ürünler · Alınan ürünler · Alış/Satış farkı · Kar oranı · Ciro · Kar · Platform bazlı özet

---

### 8. Hatırlatıcılar (`/reminders`)
**Kolonlar:** Kişi · Telefon · Platform · İstek · Görsel · Durum · Tarih · İletişim

---

### 9. Public Vitrin (`/vitrin` — Auth gerekmez)
**Hassas olmayan bilgiler:** Görsel · Takım · Sezon · Tip · Nitelik · Beden · Kondisyon · Satış Fiyatı · Marka

**İletişim:** Sabit bir iletişim butonu (WhatsApp/eBay/Dolap linkleri)

**Özellikler:**
- Grid kart görünümü (3:4 oran) ve liste görünümü
- Gelişmiş arama + filtreleme
- Sıralama (fiyat, tarih, takım)
- Responsive / Mobile-first

---

## 🔐 Authentication

- Tek admin kullanıcı için **JWT tabanlı** basit auth
- `.env` dosyasında `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`
- Login sayfası → token → localStorage (veya httpOnly cookie)
- `/vitrin` route'u tamamen açık, diğer tüm route'lar korumalı

---

## 📸 Cloudinary Ayarları

```javascript
// Upload preset
transformation: [
  { quality: 'auto:good' },
  { fetch_format: 'webp' },
  { width: 1200, crop: 'limit' }
]
// Orijinal kalite yerine ~80% quality WebP dönüşümü
```

---

## 📦 NPM Paketleri

### Frontend
```json
{
  "react": "^18",
  "vite": "^6",
  "tailwindcss": "^3",
  "@shadcn/ui": "latest",
  "zustand": "^4",
  "axios": "^1",
  "react-router-dom": "^6",
  "react-hook-form": "^7",
  "zod": "^3",
  "@dnd-kit/core": "^6",       // Drag & Drop
  "sonner": "^1",               // Toast notifications
  "date-fns": "^3",
  "recharts": "^2",             // Charts (Shadcn Charts)
  "framer-motion": "^11"        // Animasyonlar
}
```

### Backend
```json
{
  "express": "^4",
  "mongoose": "^8",
  "cors": "^2",
  "dotenv": "^16",
  "bcryptjs": "^2",
  "jsonwebtoken": "^9",
  "multer": "^1",
  "cloudinary": "^2",
  "express-validator": "^7",
  "compression": "^1"
}
```

---

## 🗂️ JSON Veri Dosyaları

### teams.json yapısı
```json
[
  {
    "id": "133632",
    "name": "Galatasaray",
    "country": "Türkiye",
    "league": "Süper Lig",
    "badgeUrl": "https://www.thesportsdb.com/images/media/team/badge/xvuwtw1448813215.png",
    "aliases": ["GS", "Cim Bom"]
  }
]
```

> `id` alanı TheSportsDB'nin kendi `idTeam` değeridir — arama ve güncelleme scriptlerinde kullanılır.

**Kapsam:** Türkiye Süper Lig · Premier League · La Liga · Serie A · Bundesliga · Ligue 1 · Champions League takımları + diğerleri

---

### 🔌 TheSportsDB Entegrasyonu

**Kullanılan endpoint'ler (v1 — ücretsiz, key gerekmez):**

```
# İsme göre takım arama
GET https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t={teamName}

# Lig ID'sine göre tüm takımları çek
GET https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id={leagueId}
```

**Önemli Lig ID'leri:**
| Lig | TheSportsDB League ID |
|-----|----------------------|
| Süper Lig | 4966 |
| Premier League | 4328 |
| La Liga | 4335 |
| Serie A | 4332 |
| Bundesliga | 4331 |
| Ligue 1 | 4334 |
| Champions League | 4480 |

---

### 🛠️ Takım Verisi

`client/public/data/teams.json` — 168 takım, statik dosya (Süper Lig, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UCL). `TeamSelector` componenti bu dosyayı runtime'da fetch eder.

`client/public/data/competitions.json` — Ülke/lig hiyerarşisi. `TeamSelector`'ın ülke ve lig dropdown'ları bu dosyadan beslenir.

### brands.json
```json
["Nike","Adidas","Puma","Castore","Umbro","Jako","Kappa","Hummel","New Balance","Macron","Errea","Diğer"]
```

### technologies.json
```json
{
  "Nike": ["Dri-FIT","DRI-FIT ADV","Dri-FIT Strike","Therma-FIT"],
  "Adidas": ["Aeroready","Heat.rdy","Condivo","Ultraweave","Tiro"],
  "Puma": ["Drycell","teamGOAL","teamLIGA","teamRISE"],
  "Castore": ["TechPro","Velocity"],
  "generic": ["Standart"]
}
```

---

## 🚀 Geliştirme Aşamaları (Roadmap)

### Faz 1 — Temel Altyapı (1-2 Hafta)
- [x] Monorepo yapısı kurulumu
- [x] Express + MongoDB bağlantısı
- [x] React + Vite + Tailwind + Shadcn kurulumu
- [x] Vintage Paper tema ve font entegrasyonu
- [x] Dark/Light mode
- [x] JWT auth sistemi (login sayfası)
- [x] Sidebar + Layout + Mobile nav
- [x] Cloudinary entegrasyonu
- [x] `teams.json` ve `competitions.json` statik veri dosyaları

### Faz 2 — Core Modeller & Formlar (2-3 Hafta)
- [x] Jersey CRUD (tam form)
- [x] TeamSelector komponenti (ülke→lig→takım cascading)
- [x] ImageUploader (çoklu, drag-drop, WebP)
- [x] Reusable DataTable (sort/filter/search/bulk)
- [x] JerseyCard komponenti (3:4)
- [x] ViewToggle (Grid/List)
- [x] Satıldı modal formu

### Faz 3 — Modüller (2-3 Hafta)
- [x] Satılıklar sayfası
- [x] Satılanlar sayfası
- [x] Satın Alınanlar sayfası
- [x] Satın Alma Listesi sayfası
- [x] Satıcılar sayfası
- [x] Hatırlatıcılar sayfası

### Faz 4 — Analytics & Raporlar (1-2 Hafta)
- [x] İstatistikler sayfası (tüm grafikler)
- [x] Raporlar sayfası (klasör yapısı + detaylar)

### Faz 5 — Public Vitrin (1 Hafta)
- [x] `/vitrin` route (unauth)
- [x] Arama/filtreleme/sıralama
- [x] Responsive kart görünümü

### Faz 6 — Polish & Deploy (1 Hafta)
- [x] Drag & Drop (wishlist sıralama, kart sıralama)
- [x] Sonner toast + Alert dialog entegrasyonu
- [x] Tüm bulk actions
- [x] Performance optimizasyonu
- [x] Railway (backend) deploy
- [x] Vercel (frontend) deploy
- [x] .env konfigürasyonu

---

## 🌐 Deployment Konfigürasyonu

### Vercel (Frontend)
```env
VITE_API_URL=https://your-app.railway.app/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Railway (Backend)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=bcrypt_hash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=https://your-app.vercel.app
```

### CORS Konfigürasyonu
```javascript
cors({
  origin: [process.env.CLIENT_URL],
  credentials: true
})
```

---

## 🧩 Reusable Komponent Listesi

| Komponent | Kullanım Yeri |
|-----------|--------------|
| `DataTable` | Tüm liste sayfaları |
| `JerseyCard` | Satılıklar, Satılanlar, Public vitrin |
| `ImageUploader` | Jersey form, Purchase form, Reminder form |
| `TeamSelector` | Jersey form, Wishlist form |
| `FilterBar` | Tüm liste sayfaları |
| `BulkActions` | Tüm liste sayfaları |
| `StatCard` | İstatistikler |
| `ViewToggle` | Grid/List değiştirme |
| `PlatformLinks` | Satılıklar, Satıcılar |
| `WhatsAppButton` | Satıcılar, Hatırlatıcılar |
| `SortableItem` | Drag-drop listeler |
| `ConfirmDialog` | Silme onayları |
| `StatusBadge` | Kondisyon, Durum göstergesi |

---

## 📋 Önemli UX Notları

1. **Her yerde tıkla-seç:** Select, Combobox, Toggle group — manuel giriş minimize
2. **Inline düzenleme:** Tablo hücresinde çift tıkla düzenle (basit alanlar için)
3. **Stok yönetimi:** Stok > 1 iken "Satıldı" işareti → stok -1; stok = 1 → otomatik "Satılanlar"a taşı
4. **Kopyala aksiyon:** Aynı formayı kopyala → formda küçük düzenleme yap → kaydet
5. **Hızlı ekleme:** Tablonun üstünde "Hızlı Ekle" butonu → minimal modal form
6. **Görsel lazy loading:** IntersectionObserver ile
7. **Offline-aware:** Network hata durumunda anlaşılır mesajlar
8. **Keyboard shortcuts:** `N` → yeni ekle, `Esc` → kapat, `/` → arama odakla
