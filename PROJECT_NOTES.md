# Part 9 — Bookmark Manager

30 günde 30 proje serisi. "The Build Log" carousel Part 9 projesi: link kaydetme, etiketleme ve arama — hepsi tarayıcıda.

---

## Konsept

Carousel'de anlatılan hikâye:

- **Learn. Build. Ship.** — Coddy'de array, object ve localStorage çalışıldı
- **Save. Organize. Find.** — öğrenilen üç konsept birebir üç özelliğe karşılık geliyor:
  - `array` → bookmark listesi, filtreleme, sıralama
  - `object` → her bookmark'ın şeması (`url`, `title`, `tags`, `favorite`, `createdAt`)
  - `localStorage` → kalıcılık + JSON import/export

Yani proje, slide'daki öğrenme konularının doğrudan uygulaması olacak şekilde kurgulandı.

---

## Tasarım Dili (seri ile birebir)

`timestamp-converter` ve `second-brain` baz alındı, aynı token seti kopyalandı:

- **Dark-first** zemin `#0a0a0c` + üstte radial gradient (`background-attachment: fixed`)
- **Tek aksan rengi** indigo `#6366f1` — CTA, focus ring, aktif chip, favicon tile, yıldız
- **Surface katmanları** `--surface` / `--surface-2` / `--surface-hover`
- **Köşeler** 20px (add card) / 14px (input, bookmark kart) / pill (CTA, chip, segment)
- **Sticky glass header** — `backdrop-filter: blur(16px)` + yarı saydam zemin
- **Micro-interactions** 180ms ease — kart hover'da `translateY(-1px)` + border parlaması
- **İkonlar** inline SVG, 14px, stroke 1.6 — kütüphane yok
- **Pure CSS + custom properties** (Tailwind YOK)

Serideki diğer projelerden farkı: domain baş harfinden üretilen **letter-tile favicon**. Google favicon servisi gibi external bir istek yapmamak için — "no data leaves your machine" iddiası böylece gerçek kalıyor.

---

## Stack

| Katman | Seçim | Neden |
|---|---|---|
| Framework | React 19 + Vite 5 | Serideki standart |
| Dil | JavaScript (`.jsx`) | TypeScript yok |
| Styling | Pure CSS + design tokens | `timestamp-converter` ile aynı |
| State | `useState` + `useMemo` + `useCallback` | Tek dosyada yönetilebilir |
| Persistence | `localStorage` (`bookmark-manager-v1`) | Tam client-side |
| Font | Inter (400/500/600/700) | Seri stack'i |

---

## Özellikler

1. **Link kaydetme** — protokolsüz girdi (`react.dev`) otomatik `https://` ile normalize edilir
2. **Otomatik başlık** — başlık boşsa domain'den türetilir (`react.dev` → `React`)
3. **Tag sistemi** — virgülle ayrılmış, lowercase'e çevrilir, `#` kırpılır, dedup + max 8
4. **Canlı arama** — başlık, URL ve tag'lerde eşleşme; `⌘K` ile focus
5. **Tag filtre barı** — yatay kaydırmalı chip'ler, her birinde canlı sayaç
6. **Favori (star)** — kart üzerinden işaretle, "starred only" filtresiyle daralt
7. **3 sıralama modu** — Recent / Title / Domain
8. **Inline edit** — kart yerinde form'a dönüşür, başlık + tag güncellenir
9. **Copy to clipboard** — 1.4s'lik check feedback'i ile
10. **JSON import / export** — URL doğrulaması + duplicate atlama ile merge
11. **Duplicate guard** — aynı URL ikinci kez kaydedilemez
12. **Demo data** — 8 örnek bookmark'ı tek tıkla yükler (boş durumda ayrıca büyük CTA olarak)
13. **Reset** — iki adımlı onay ile her şeyi siler (`Reset` → `Delete all` / `Cancel`)
14. **Boş durum** — "hiç yok" ve "filtre eşleşmedi" için ayrı mesaj

---

## Mimari Notlar

### Dosya yapısı
```
bookmark-manager/
├── index.html         (inline SVG favicon + Inter)
├── package.json
├── vite.config.js
├── README.md
├── PROJECT_NOTES.md   ← bu dosya
└── src/
    ├── main.jsx       (React mount)
    ├── App.jsx        (tüm UI + mantık, ~640 satır)
    └── styles.css     (design tokens + komponent stilleri)
```

### State şeması
```js
{
  bookmarks: [{ id, url, title, tags: string[], favorite: bool, createdAt }],
  query: '',            // arama
  activeTag: 'all',     // tag filtresi
  sort: 'recent',       // 'recent' | 'title' | 'domain'
  favOnly: false,       // starred filtresi
  formUrl / formTitle / formTags / formError,
  editingId / editTitle / editTags,
  copiedId,
  confirmReset: false,  // Reset butonunun iki adımlı onay durumu
}
```

### Önemli yardımcılar
- `normalizeUrl` — protokol yoksa `https://` ekler
- `isValidUrl` — `URL` constructor + http/https + nokta içeren hostname kontrolü
- `getDomain` — `www.` kırpılmış hostname, parse hatasında string fallback
- `parseTags` — split → trim → lowercase → `#` kırp → dedup (`Set`) → slice(0, 8)
- `formatRelative` — just now / Xm / Xh / Xd / tarih
- `loadDemo` — `DEMO_BOOKMARKS`'ı URL bazlı dedup ile merge eder; `age` (saat) alanı sayesinde kartlar kademeli tarihlerle görünür (2h ago → Sep 17)
- `resetAll` — bookmark listesini ve tüm filtreleri sıfırlar

### Türetilmiş veri (hepsi `useMemo`)
- `tags` — sayıya göre azalan, eşitlikte alfabetik tag listesi
- `visible` — favOnly → activeTag → query zinciri, sonra sort
- `favCount` — stat satırı için

### Erişilebilirlik
- Tüm icon butonlarda açıklayıcı `aria-label` (`Delete React Docs` gibi, kart adıyla)
- Filtre ve segment butonlarında `aria-pressed`
- `role="group"` tag barı ve sort segmentinde
- `:focus-visible` global outline (aksan rengi, 2px offset)
- `Esc` — aramayı temizler / inline edit'i / reset onayını iptal eder
- `role="alert"` form hatalarında

---

## Test Sonuçları

| Adım | Sonuç |
|---|---|
| `npm install` | temiz (61 paket) |
| `npm run build` | temiz — 365ms, CSS 12.52 kB (gzip 2.83), JS 237.35 kB (gzip 73.85) |
| `npm run dev` | `localhost:5173` → **200 OK** |
| Konsol | hata yok (favicon 404'ü inline SVG ile kapatıldı) |

Playwright ile doğrulanan akışlar:
- Ekleme: `react.dev` → `https://react.dev`, `www.figma.com/design` → başlık otomatik `Figma`
- Arama: `"vite"` → 3 karttan 1'i kaldı
- Star + "starred only" filtresi → 1 kart
- Inline edit: başlık `Vite Guide` → `Vite Docs`, tag'ler güncellendi
- Delete → kart gitti, `localStorage` 2 kayda düştü
- Hata durumları: `"not a url"` → geçersiz URL mesajı, tekrar `react.dev` → duplicate mesajı
- `⌘K` → `document.activeElement` = `.search-input`
- Demo: boş durum CTA'sı → 8 kart, 10 tag, 3 starred; tarihler kademeli (`2h ago` → `Sep 17`)
- Demo tekrar basıldığında → hâlâ 8 kart (URL bazlı dedup çalışıyor)
- Reset: `Reset` → onay çıkıyor, `Cancel` → 8 kart duruyor, `Delete all` → 0 kart + `localStorage` boş
- Header'da `.day-badge` elementi kalmadı (`querySelector` → 0)
- Responsive: 390 / 600 / 720 / 1280px'te yatay taşma yok; 390px'te aksiyon butonları alt satıra sarıyor

---

## Sonraki Adımlar (opsiyonel)

- Netscape bookmark HTML (`bookmarks.html`) import — tarayıcıdan direkt taşıma
- Drag & drop ile manuel sıralama
- Tag rename / merge (tek yerden toplu düzenleme)
- Klasör / koleksiyon katmanı (tag'lerin üstünde ikinci bir gruplama)
- Açık link kontrolü — 404'e düşen bookmark'ları işaretleme (CORS nedeniyle sınırlı)
