# Agora Test Data Generator — Rebuild Design

**Date:** 2026-08-07
**Status:** Approved (pending spec review)

## 1. Mục tiêu

Dựng lại website sinh dummy data test cho các form Agora, lấy ý tưởng từ repo gốc
`huytrandev/agora-test-data-generator` (vanilla JS thuần, no-build), nhưng chuyển sang
stack hiện đại, dễ maintain, deploy miễn phí trên GitHub Pages. Không overtech.

Data phải "đẹp" (realistic) và đúng ngữ cảnh Agora Singapore, không phải chuỗi ngẫu nhiên vô nghĩa.

## 2. Phạm vi

**Giữ (8 record types):** Parent, Student/Child, Course, Course Instance, Class,
Product, Update Message, Ticket.

**Bỏ:** record type "Files" (sinh PNG/JPEG/PDF, file-size presets, "Download all") —
người dùng không dùng chức năng này. Kéo theo bỏ các control file trong toolbar và
mọi dependency tạo ảnh/PDF.

**Tính năng cốt lõi giữ lại:**
- Seeded randomness → reproducible khi nhập cùng seed (blank = random).
- No-duplicate trong batch (bucket tracking + retry, cùng cạn thì gắn suffix).
- Text length modes: Normal / Long / Stress (overflow) cho các field mô tả.
- Export JSON, CSV. Copy-on-click từng value. Preview HTML cho Message/Ticket.
- Keyboard shortcut 1–8 chọn entity.

## 3. Tech stack

- **Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui** (Radix primitives).
- **Icons:** lucide-react.
- **Data lib — hybrid:**
  - **Faker.js (`@faker-js/faker`)** cho field generic: email, lorem/paragraph,
    ngày tháng, địa chỉ generic, câu chữ rich text, SKU/UUID.
  - **Lõi SG tự viết** (port từ repo gốc) cho field đặc thù: tên Singapore có
    trọng số nhân khẩu học (Chinese/Malay/Indian/Eurasian), tên Trung, preferred
    name, postcode 6 số SG, mobile bắt đầu 8/9, DEV_MARKER.
  - **Seed dùng chung:** khi có seed, gọi `faker.seed(n)` đồng thời seed cho PRNG
    lõi để toàn bộ output reproducible.
- **Testing:** Vitest cho `core/`.
- **Deploy:** GitHub Actions build `dist/` → publish GitHub Pages. `vite.config` set
  `base` theo tên repo (`/agora-test-data-generator/`).

## 4. Kiến trúc

Tách lõi sinh data (thuần TS, không phụ thuộc React/DOM) khỏi UI để dễ test và mở rộng.

```
src/
  core/                    # thuần TS
    rng.ts                 # seeded PRNG + sampling (pick, weighted, int, shuffle)
    faker-seed.ts          # wrapper đồng bộ seed cho faker + rng
    data.ts                # SG name pools, enum tokens (GRADES, SUBJECTS, VENUES...)
    names.ts               # sinh tên SG + chống trùng, chineseName, email
    text.ts                # lorem, rich HTML message, chat transcript (Ticket)
    uniqueness.ts          # bucket tracking, retry (~50), suffix fallback
    types.ts               # Record, FieldMeta, GenerateOptions, Generator<T>
    generators/            # 1 file / entity
      parent.ts student.ts course.ts instance.ts
      klass.ts product.ts message.ts ticket.ts
    registry.ts            # entity key -> { label, generator, fields[] }
  components/
    Sidebar.tsx            # branding, entity selector (shortcut 1-8), theme toggle
    Toolbar.tsx            # count (1-100), seed, text-length; ticket: messages count
    RecordCard.tsx         # render 1 record, copy-on-click value + toast
    ExportBar.tsx          # Generate, Export JSON, Export CSV
    HtmlPreviewDialog.tsx  # preview Message/Ticket HTML
  export/
    to-json.ts  to-csv.ts
  hooks/
    use-generator.ts       # gọi registry, giữ dataset hiện tại
  App.tsx  main.tsx  index.css
  __tests__/               # Vitest cho core
```

**Generator interface (mọi entity implement chung):**

```ts
interface FieldMeta { key: string; label: string; html?: boolean }
interface GenerateOptions { count: number; len: 'normal'|'long'|'stress';
                            seed?: string; messagesPerTicket?: number }
interface GenContext { rng: Rng; uniq: Uniqueness }
interface Generator<T = Record<string,string>> {
  key: string; label: string; fields: FieldMeta[]
  generate(opts: GenerateOptions, ctx: GenContext): T[]
}
```

UI render field từ `fields[]` metadata → thêm entity mới chỉ cần thêm 1 generator +
đăng ký vào registry, không sửa UI.

## 5. Data flow

1. `Toolbar` giữ state: entity key, count, seed, len (+ messagesPerTicket cho Ticket).
2. Bấm **Generate** → `use-generator` khởi tạo 1 `Rng` seeded + 1 `Uniqueness` context
   dùng chung cho cả batch, gọi `registry[entity].generate(opts, ctx)`.
3. Trả `Record[]` → render qua `RecordCard`.
4. Export JSON/CSV đọc lại chính dataset đang hiển thị (không sinh lại).

## 6. Field từng entity (port đúng repo gốc)

- **Parent:** avatar, firstName, lastName(+[DEV]), fullName(+[DEV]),
  email (firstname.lastname@mailinator.com, chống trùng bằng sequence), mobile (SG),
  gender, relationship (theo gender), dob (28–50 tuổi), address (theo len), postcode.
- **Student:** firstName, lastName, fullName, preferredName, chineseName, gender,
  dob (4–16 tuổi), age (tính từ dob), gradeLevel, allergies (theo len).
- **Course:** name (subject+level, unique), description (theo len), slug, subjectType,
  minAge (4–12), maxAge (min+2..4), price (120–800), sessions (4–12),
  duration (60|90|120), seats (8–30).
- **Instance:** courseCode (8 chữ, unique), startDate (3–30 ngày tới), endDate (theo
  sessions), sessions, duration, price, seats, status, rateType.
- **Class:** className (grade+subject, unique), businessUnit, venue, teachers (1–3,
  unique), courses (1–3), programmes (1–2).
- **Product:** sku (AGR-XXXXXX, unique), name (unique), description (theo len), slug,
  variantName, status, productType, variantType, timePeriod, price (50–1200),
  currency=SGD, requireStudent, isDeposit.
- **Message:** title (theo len), message (HTML), sendTo, type=update.
- **Ticket:** participantA, participantB (unique), messages (count),
  conversation (HTML chat transcript).

## 7. Cải tiến UX (vs bản gốc)

- Layout responsive (sidebar collapse trên mobile), dark mode qua shadcn theme.
- Copy-on-click có toast xác nhận; thêm nút "Copy row (JSON)".
- Preview HTML Message/Ticket trong dialog thay vì inline.
- Giữ shortcut 1–8 chọn entity.

## 8. Testing (Vitest, chỉ core/)

- RNG reproducible: cùng seed → cùng output.
- No-duplicate: batch lớn không có value trùng ở field unique.
- Format: SG mobile (8/9 + 7 số), postcode 6 số, dob DD/MM/YYYY, age khớp dob.
- Không test UI nặng.

## 9. Deploy

- `.github/workflows/deploy.yml`: on push `main` → `npm ci` → `npm run build` →
  upload `dist/` → deploy Pages.
- Repo: `agora-test-data-generator` dưới account `huytranthanhtps`, tạo qua `gh`.
- `vite.config.ts` set `base: '/agora-test-data-generator/'`.

## 10. Out of scope

- Không có backend/API, không lưu server — thuần client-side static.
- Không sinh file ảnh/PDF.
- Không auth, không routing đa trang.
