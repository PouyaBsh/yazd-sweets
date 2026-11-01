# شیرینی‌ها و سوغات اصیل یزد

A compact, single-page Persian (RTL) editorial site built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · lucide-react**. Set up to run locally on **Windows**.

---

## اجرا روی ویندوز (PowerShell یا CMD)

نیازمندی: **Node.js 20.9 یا جدیدتر** (`node -v`)

```powershell
cd D:\yazd-sweets
npm install
npm run dev
```

سپس مرورگر را روی **http://localhost:3000** باز کنید.

`npm run dev` قبل از اجرا، خودکار `scripts/download-images.mjs` را اجرا می‌کند تا مطمئن شود هر ۹ تصویر در `public/images/` وجود دارند (عکس‌ها محلی‌اند و دیگر از اینترنت دانلود نمی‌شوند؛ اگر یکی گم شود، placeholder جایش می‌نشیند).

| دستور | کار |
| --- | --- |
| `npm run dev` | چک تصاویر + سرور توسعه |
| `npm run build` → `npm run start` | نسخه‌ی production |
| `npm run download-images` | دانلود تصاویرِ ناموجود (عکس‌های موجود دست نمی‌خورند) |
| `npm run download-images:force` | دانلود دوباره‌ی همه (عکس‌های فعلی جایگزین می‌شوند) |
| `npm run lint` / `npm run typecheck` | بررسی ESLint / TypeScript |
| `npm run audit:install` | (یک‌بار) دانلود Chromium برای Playwright |
| `npm run audit` | ممیزی خودکار Kinetic / بصری / UX / دسترس‌پذیری در ۳ viewport |

---

## تعویض تصاویر روی ویندوز

همه‌ی تصاویر محلی‌اند و از `D:\yazd-sweets\public\images\` خوانده می‌شوند:

| فایل | کجا نمایش داده می‌شود |
| --- | --- |
| `qottab.webp` | قطاب |
| `baghlava.webp` | باقلوا |
| `pashmak.webp` | پشمک |
| `loz.webp` | لوز |
| `haji-badam.webp` | حاجی بادام |
| `cake-yazdi.webp` | کیک یزدی |
| `coffee-1.webp` · `coffee-2.webp` · `coffee-3.webp` | سه کارت گالری قهوه یزدی |

1. عکس جدید را با **همان نام فایل** در `public\images\` جایگزین کنید (در File Explorer: Copy → Paste → Replace).
2. صفحه را در مرورگر رفرش کنید (`Ctrl + F5` برای دور زدن کش).

عکس می‌تواند عمودی، مربع، پانوراما، 4K یا کوچک باشد — کامپوننت `AdaptiveImage` قاب را با نسبت ثابت نگه می‌دارد و عکس را با `object-cover` داخل آن برش می‌دهد، پس چیدمان هیچ‌وقت به‌هم نمی‌ریزد.
عکس‌ها WebP هستند؛ JPG یا PNG هم با همین نام‌ها (پسوند `.webp`) درست نمایش داده می‌شوند. اگر می‌خواهید پسوند را عوض کنید، مسیر `image` را در `src/data/yazd-content.ts` و نام فایل را در `scripts/download-images.mjs` هم تغییر دهید.

اسکریپت دانلود **هیچ‌وقت عکسی را که خودتان گذاشته‌اید بازنویسی نمی‌کند** (مگر با `:force`). اگر دانلودی شکست بخورد، یک placeholder تمیز SVG با همان نام نوشته می‌شود و سایت سالم می‌ماند؛ اجرای بعدی دوباره برای آن فایل تلاش می‌کند.

---

## ساختار پروژه

```
scripts/download-images.mjs   ← دانلودر cross-platform (fs/promises + fetch) با fallback SVG
public/images/                ← ۹ تصویر محلی
src/data/yazd-content.ts      ← کل متن فارسی سایت
src/app/layout.tsx            ← RTL، فونت Vazirmatn از CDN، لایه‌ی noise
src/app/globals.css           ← پالت معماری یزد (Tailwind v4 @theme)
src/components/
  AdaptiveImage.tsx           ← قاب تصویر مقاوم (skeleton، fallback، zoom)
  experience/                 ← state مشترک (شیرینی انتخاب‌شده + حالت نمایش)
  layout/                     ← هدر شیشه‌ای + فوتر
  ornaments/                  ← گره‌چینی، شمسه، لچکی، فریز بادگیر، نور کویری
  kinetic/                    ← Kinetic3DShowcase، ScrollReactiveCard، ذرات ادویه، hookها
  hero/                       ← بخش ۱: هیرو، روایت تاریخی (bento / deck موبایل)، گالری پرش سریع
  studio/                     ← بخش ۲: استودیو شیرینی‌ها (studio ⇄ bento، tilt، gauge، modal)
  coffee/                     ← بخش ۳: قهوه یزدی (deck سه‌بعدی، کارت‌های شیشه‌ای)
  ui/                         ← TiltFrame، MagneticButton، تزئینات هندسی
src/lib/motion.ts             ← spring واحد: stiffness 280 / damping 26
```

## ممیزی خودکار (Playwright + axe)

```powershell
npm install
npm run audit:install
npm run audit
```

اسکریپت `scripts/audit-site.mjs` اگر سروری در حال اجرا نباشد، خودش `next build` و `next start` (پورت 3100) را اجرا می‌کند و در پایان می‌بندد.
برای ممیزی سروری که از قبل بالا است: `$env:AUDIT_URL="http://localhost:3000"; npm run audit`

خروجی در `.audit-screenshots/`:

| فایل | محتوا |
| --- | --- |
| `01-fullpage-*.png` | کل صفحه |
| `02-hero-story-and-ornaments-*.png` | هیرو + روایت تاریخی + تزئینات |
| `03-gallery-strip-kinetic-*.png` | گالری (موج طلایی / spotlight مرکز) |
| `04-sweet-studio-3d-float-*.png` | کارت سه‌بعدی شناور |
| `05-sweet-studio-all-6-sweets-*.png` | هر ۶ شیرینی کنار هم (اثبات صفر بودن layout shift) |
| `06-sweet-studio-bento-grid-*.png` | نمای شبکه‌ای |
| `07-yazdi-coffee-3d-deck-*.png` | سه حالت deck قهوه |
| `audit-report.json` | گزارش کامل تست‌های A تا G |

تست‌ها: A levitation خودکار سه‌بعدی (بدون موس) · B چرخش خودکار و swipe · C صفر overflow افقی · D تصاویر و لایه‌های تزئینی · E اهداف لمسی ≥44px · F برش و تداخل متن · G axe (WCAG 2.2 AA) + کیبورد.

### Playwright MCP
برای ثبت سرور `@playwright/mcp` در Claude Code، فایل `playwright-mcp.example.json` را به `.mcp.json` تغییر نام دهید (یا دستور `claude mcp add playwright -- npx -y @playwright/mcp@latest` را اجرا کنید). روی ویندوزِ native اگر اجرا نشد، `command` را `cmd` و `args` را `["/c", "npx", "-y", "@playwright/mcp@latest"]` بگذارید.

---

## خروجی استاتیک و GitHub Pages

```powershell
npm run export                 # → پوشه out (سایت کامل HTML/CSS/JS + عکس‌ها، برای دامنهٔ خودتان)
npm run preview:static         # پیش‌نمایش out روی http://localhost:4173
```

- برای آدرس زیرپوشه‌ای مثل `https://<user>.github.io/<repo>/`: `npm run export -- --base-path=/<repo>`
- برای انتشار دستی از branch و دامنهٔ اختصاصی: `npm run export -- --domain=example.com` (فایل `CNAME` را هم می‌سازد)
- انتشار خودکار: فایل `deploy/deploy-pages.yml` را به `.github/workflows/deploy-pages.yml` منتقل کنید؛ با هر push روی `main` سایت را می‌سازد و منتشر می‌کند.
  در تنظیمات repo → **Pages** → Source را روی **GitHub Actions** بگذارید؛ base path از تنظیمات Pages خوانده می‌شود
  (با دامنهٔ اختصاصی خالی، بدون دامنه `/<repo>`). بعد از وصل کردن دامنه یک بار workflow را دوباره اجرا کنید.
- DNS دامنهٔ اصلی (apex): چهار رکورد `A` → `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153`
  (اختیاری `AAAA` → `2606:50c0:8000::153` تا `2606:50c0:8003::153`) · زیردامنهٔ `www`: رکورد `CNAME` → `<user>.github.io`

## Troubleshooting

- **`npm install` خطای شبکه می‌دهد** → اتصال/VPN را چک کنید و دوباره اجرا کنید.
- **فونت فارسی لود نمی‌شود** → فونت Vazirmatn از `cdn.jsdelivr.net` می‌آید؛ بدون دسترسی به آن، مرورگر از فونت سیستمی استفاده می‌کند.
- **پورت 3000 اشغال است** → `npm run dev -- -p 3001`
