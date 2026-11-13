# Хийгдсэн өөрчлөлтүүд (2026 оны 6-р сар)

Энэ баримт нь Vercel/Supabase-аас локал Postgres + локал сервер рүү шилжсэний дараа гарсан асуудлуудыг засаж, нэвтрэлт болон AI чатын урсгалыг сайжруулсан өөрчлөлтүүдийн товч тайлбар юм.

---

## 1. Build алдаа — `daily-check` route (Supabase init)

**Файл:** `app/api/mind/emotion/daily-check/route.ts`

**Асуудал:** Supabase client болон `throw new Error("supabaseUrl is required.")` нь модулийн дээд түвшинд (module-level) байсан тул build хийх үед (env хувьсагч байхгүй үед) шууд ажиллаж, build-ийг унагааж байсан.

**Засвар:** Supabase-ийн инициализацийг `getSupabase()` функц рүү зөөж, зөвхөн хүсэлт (request) ирэх үед ажилладаг болгосон. GET болон POST handler хоёул дотроо `getSupabase()`-ийг дуудна.

---

## 2. AI Gateway → OpenAI provider-ийн type алдаа

**Файл:** `lib/ai/providers.ts`

**Асуудал:** `@ai-sdk/openai` өөрийн дотоод `@ai-sdk/provider` хувилбартай байсан нь дээд түвшний `@ai-sdk/provider`-той зөрж, `wrapLanguageModel`-д type алдаа өгч байсан.

**Засвар:** `model: openai(cleanId) as any` гэж cast хийж, хувилбар хоорондын зөрүүг шийдсэн.

---

## 3. Deploy workflow сайжруулалт

**Файл:** `.github/workflows/deploy.yml`

**Өөрчлөлтүүд:**
- `rm -rf .next` мөрийг устгасан — Turbopack-ийн incremental cache-ийг дахин ашиглаж, build-ийг хурдасгасан.
- `command_timeout: 30m` нэмсэн — SSH action-ийн default 10 минутын timeout build дуусахаас өмнө таслаж байсныг зассан (build дуусаагүй байхад PM2 restart хийгдэж байсан гол шалтгаан).
- `NODE_OPTIONS=--max-old-space-size=...` нэмж, Node.js-д хангалттай санах ой өгсөн.

---

## 4. Build удаашрал ба санах ойн асуудал

**Файлууд:** `next.config.ts`, `package.json`

**Асуудлууд ба засвар:**
- Серверт build удаан байсан гол шалтгаан: `rm -rf .next` бүр deploy бүрт cache-ийг устгаж байсан → бүхэлд нь дахин compile.
- Turbopack-ийн panic (`creating new process / unexpected end of file`) — сервер санах ой дутаж, worker process унаж байсан.
- TypeScript болон ESLint шалгалтыг build үед алгасах тохиргоог түр нэмж/хассан.

> **Тэмдэглэл:** Дараа нь зарим тохиргоо засагдсан/буцаагдсан. Эцсийн төлөвт `next.config.ts` нь зөвхөн `images` тохиргоотой.

---

## 5. Vercel deploy хийгдэхгүй байсан — Lint workflow

**Файл:** `.github/workflows/lint.yml` (устгасан)

**Асуудал:** `lint.yml` workflow нь `npx ultracite@latest`-ийг (хатуу шалгалттай 7.8.3 хувилбар) татаж, 1595 алдаа гаргаж байсан. Vercel нь GitHub status check амжилтгүй болоход deploy-ийг хүлээдэг тул deploy зогсож байсан.

**Засвар:** `lint.yml`-ийг бүхэлд нь устгасан. Мөн `@ai-sdk/gateway`-ийг `package.json`-д нэмсэн (lockfile-д байсан ч `npm install` дээр дутаж байсан).

---

## 6. `not_found:chat` алдааны тайлбар (vote route)

**Файл:** `app/(chat)/api/vote/route.ts`

**Асуудал:** Хариулт ирсний дараа (`messages.length >= 2` үед) клиент `/api/vote?chatId=...` руу SWR хүсэлт явуулдаг. Тухайн чат DB-д хадгалагдаагүй (зочин/guest эсвэл шинэ чат) бол `getChatById` нь `null` буцааж, `not_found:chat` алдаа toast болж харагдаж байсан.

**Тайлбар:** Энэ нь guest хэрэглэгчийн чатыг DB-д огт хадгалдаггүйтэй холбоотой байсан. (Дараа нь guest хандалтыг бүхэлд нь хаасан — 7-р хэсэг.)

---

## 7. Guest хандалтыг бүрэн хаах — заавал нэвтрэх шаардлага

Хэрэглэгчид автомат guest бүртгэл үүсгэгдэхгүй, бүх үйлдэл хийхэд заавал нэвтрэх ёстой болгосон.

**Файлууд ба өөрчлөлтүүд:**

- **`proxy.ts`** — Нэвтрээгүй зочдыг `/api/auth/guest` (нууцаар guest session үүсгэдэг байсан) рүү биш, `/login?callbackUrl=...` руу шилжүүлдэг болгосон. Хуучин guest token-ийг (`type === "guest"`) илрүүлж мөн login руу шилжүүлнэ.
- **`app/(auth)/auth.ts`** — `guest` Credentials provider болон ашиглагдахгүй болсон `createGuestIdentity` helper-ийг устгасан.
- **`app/(auth)/api/auth/guest/route.ts`** — Идэвхгүй болсон энэ route одоо зүгээр `/login` руу шилжүүлнэ.
- **`app/(chat)/api/chat/route.ts`** — Сервер талд guest session-ийг шууд татгалзана (`unauthorized:chat`).
- **`app/(auth)/login/page.tsx`** — `callbackUrl`-ийг уншиж, нэвтэрсний дараа хэрэглэгчийг очих гэсэн хуудас руу нь буцаадаг болгосон (`useSearchParams`-ийг Next.js шаардлагын дагуу `Suspense`-д боосон).

---

## 8. `getStreamContext` type засвар

**Файл:** `app/(chat)/api/chat/route.ts`

**Асуудал:** `getStreamContext()` нь үргэлж `null` буцаадаг тул type нь `null` болж, stream route дотор `never` болж type алдаа өгч байсан (build-ийг унагааж байсан, гэхдээ энэ session-ийн өөрчлөлтөөс үл хамаарах хуучин асуудал).

**Засвар:** `getStreamContext()`-д тодорхой `StreamContext | null` гэсэн буцаах type зарласан.

---

## 9. "Unexpected error" — буруу model ID (хуучирсан cookie)

**Файлууд:** `lib/ai/providers.ts`, `components/chat.tsx`

**Асуудал:** Хариулт авах үед "Unexpected error" toast гарч байсан. Шалтгаан: хуудас нь `chat-model` cookie-ийн утгыг шалгалгүй дамжуулдаг байсан. Vercel/Gateway-ийн үеийн хуучин cookie (ж: `chat-model` эсвэл `anthropic/...`) нь OpenAI-д буруу model ID болж, `model_not_found` алдаа өгч, stream дотроо унаж байсан.

**Засвар:**
- `lib/ai/providers.ts` дотор `getLanguageModel`-д ирсэн model ID-г мэдэгдэж буй жагсаалттай тулгаж шалгаад, танихгүй бол `DEFAULT_CHAT_MODEL` (`gpt-4o`) руу автоматаар буцаадаг болгосон.
- `components/chat.tsx` дотор алдааны toast-д бодит алдааны мессежийг харуулдаг болгосон (`error?.message || "Unexpected error"`).

---

## 10. AI SDK хувилбаруудын зөрүү — Stream protocol алдаа

**Файлууд:** `package.json`, `tests/prompts/utils.ts`

**Асуудал:** `finishReason` талаар Zod validation алдаа гарч байсан. Шалтгаан: `ai`, `@ai-sdk/react`, `@ai-sdk/provider` нь **beta** хувилбартай, харин `@ai-sdk/openai` нь **stable** (3.0.71) болж "drift" хийсэн. Stable provider нь шинэ протокол (`finishReason: {unified: "stop"}`) илгээдэг бол beta клиент нь хуучин формат (`finishReason: "stop"` гэсэн string) хүлээж байсан.

**Засвар:** Гурван beta багцыг stable v6 шугам руу нэгтгэсэн:
- `ai`: `6.0.0-beta.159` → `^6.0.205`
- `@ai-sdk/react`: `3.0.0-beta.162` → `^3.0.207`
- `@ai-sdk/provider`: `3.0.0-beta.27` → `^3.0.10`

Мөн `tests/prompts/utils.ts` дахь mock-ийг шинэ `LanguageModelV3FinishReason` (`{ unified, raw }`) type-д тохируулан зассан.

> **Deploy хийхдээ:** `package.json` болон `pnpm-lock.yaml` хоёрыг хоёуланг нь commit хийж, серверт build хийхээс өмнө `pnpm install` ажиллуулна.

---

## 11. AI чатын хариултыг "бичиж байгаа мэт" урсгалтай болгох

**Файлууд:** `app/(chat)/api/chat/route.ts`, `components/chat.tsx`, `package.json`

**Асуудал:** Хариулт том блокоор нэг дор "popup" хэлбэрээр гарч байсан.

**Засвар:**
- **`route.ts`** — `streamText`-д `experimental_transform: smoothStream({ chunking: "word", delayInMs: 30 })` нэмсэн. Энэ нь хариултыг үг үгээр, бага зэргийн хугацааны зайтай гаргаж, бичих эффект үүсгэнэ.
- **`components/chat.tsx`** — `experimental_throttle`-ийг `100` → `50` мс болгож, UI-г илүү ойр ойрхон шинэчилдэг болгосон.
- **`package.json`** — `dev` скриптийг `next dev --turbo`-аас `next dev` (webpack) болгосон. Шалтгаан: `next dev --turbo` (Turbopack) нь SSE/stream хариултыг buffer хийж, нэг дор гаргадаг алдаатай. `dev:turbo` скриптийг хурдан хэрэгцээнд зориулж үлдээсэн.

**Тэмдэглэл:** Сервер тал зөв урсгалтай байгаа нь батлагдсан (text-delta SSE event-үүд ~36мс зайтай гарч байсан). Production (`next start`) болон бодит сервер дээр урсгал хэвийн ажиллана; зөвхөн `next dev --turbo` дээр buffer хийдэг байсан.

---

## 12. Зүүн talbar (Sidebar) дахин дизайн

**Файл:** `components/app-sidebar.tsx`

**Асуудал:** Цэснүүд нь `+`/`—` тэмдэгтэй бүдүүлэг accordion байсан; зарим ангилал зөвхөн нэг апптай атлаа дэмий "dropdown" нээдэг байсан.

**Засвар:**
- Зөвхөн нэг апптай, онолгүй ангилал (ж: *Сэтгэл хөдлөл*, *Өөрийгөө ойлгох*) → шууд апп руу үсэрдэг нэг даралттай линк болгосон.
- Онолтой ангилал → эргэдэг chevron (`›`), жигд нээгдэх/хаагдах анимаци, дээр нь онцолсон "Апп" товч, доор нь "Онол" жагсаалттай цэвэр dropdown.
- Идэвхтэй замыг (active route) accent өнгөөр тодотгодог болгосон.
- Icon chip, hover төлөв, нэгдсэн зай завсар; давхардсан кодыг `renderAppItem` / `renderTheoryItem` болгон цэгцэлсэн.

---

## 13. Цэсний идэвхтэй тодотгол (highlight) ба Харилцаа цэсний алдаа

**Файлууд:** `components/app-sidebar.tsx`, `config/menus.ts`

**Асуудал:** Dropdown-той ангиллууд (Харилцаа гэх мэт) тухайн хуудсан дээр байхад толгой нь тодрохгүй байсан. Мөн **Харилцаа** цэсний линк `/mind/relations/control/daily-check` руу заадаг байсан ч тэр хуудас нь `/mind/relations/tests` руу шилждэг тул идэвхтэй тодотгол хэзээ ч таардаггүй байсан.

**Засвар:**
- Ангилалын аль нэг хуудсан дээр байвал dropdown толгойг accent өнгө/хүрээгээр тодотгодог болгосон (`categoryActive`).
- `config/menus.ts` дахь Харилцаа цэсний линкийг бодит зам `/mind/relations/tests` болгож зассан.

---

## 14. Нэгдсэн `AppShell` компонент (цэнхэр шилэн дизайн)

**Файл:** `components/mind/app-shell.tsx` (шинэ)

Бүх апп хуудсыг ижил харагдуулах зорилгоор `daily-check`-тэй яг ижил **цэнхэр шилэн (blue glass)** загвартай дахин ашиглах боломжтой shell үүсгэсэн:
- `#2f5f84 → #18324a` градиент дэвсгэр, зөөлөн цэнхэр гэрэлтэлт.
- Шилэн (glass) topbar: дугуй `←` буцах товч + гарчиг/дэд гарчиг + `💬 Чат` pill.
- Контентын өргөнийг тохируулах `width` prop (2xl–5xl, full).
- Нэмэлтээр `AppCard` (шилэн карт wrapper) экспортолсон.

> Эхэндээ цайвар хувилбар хийсэн ч хэрэглэгчийн хүсэлтээр `daily-check`-тэй ижил **бараан цэнхэр** болгосон.

---

## 15. Апп хуудсуудыг нэгдсэн дизайнд оруулсан

**Файлууд:** `app/(chat)/mind/ebooks/*`, `app/(chat)/mind/self-care/stress/page.tsx`,
`app/(chat)/mind/relations/tests/page.tsx`, `app/(chat)/mind/life/finance-app/FinanceAppClient.tsx`

**Өөрчлөлтүүд:**
- **Ebooks** — `app/mind/ebooks` → `app/(chat)/mind/ebooks` рүү бүхэлд нь зөөсөн (`git mv`). Ингэснээр зүүн **sidebar** гарч ирдэг болсон (өмнө нь (chat) группээс гадуур байсан тул sidebar-гүй хоосон хуудас руу үсэрдэг байсан). Картуудыг шилэн (glass) загвартай болгож, `--card`/`--brandRgb` токенуудыг нэмж текст харагдах асуудлыг зассан.
- **Эрүүл мэнд (self-care/stress)** — `AppShell`-д боосон.
- **Харилцааны тестүүд** — өөрийн `TopBar` + гарчиг хэсгийг устгаж, `AppShell` + `AppCard`-д шилжүүлсэн.
- **Санхүү апп (finance)** — өөрийн бараан (near-black) дизайн, гар хийцийн толгойг устгаж `AppShell`-д шилжүүлсэн; дотоод хэсгүүдийг (тайлан, оруулга, гүйлгээний жагсаалт) хэвээр үлдээсэн.
- Бүх дээрх хуудсын өргөнийг ижил `4xl` болгож нэгтгэсэн.

---

## 16. Ebooks `[id]` — `params` Promise алдаа (Next 16)

**Файл:** `app/(chat)/mind/ebooks/[id]/page.jsx`

**Асуудал:** Next.js 16-д `params` нь Promise болсон тул `params.id`-г шууд унших нь console алдаа өгч байсан.

**Засвар:** React-ийн `use()`-ээр задалсан: `const { id } = use(params);`. Бусад ebooks хуудсуудад энэ алдаа байгаагүй.

---

## 17. Document-editor хуудсуудын өргөний нэгтгэл

**Файл:** `app/(chat)/mind/ebooks/preview/page.jsx`

Ebooks-ийн бичих/preview хэрэгслүүд ([id], extras, preview) нь A4 цаасан загвартай, өргөн 2 баганатай тусдай ангилал тул цайвар хэвээр үлдээсэн. Хоорондоо зөрүүтэй (6xl vs 7xl) байсныг preview-г `max-w-6xl` болгож тэгшитгэсэн.

---

## Дүгнэлт

| # | Сэдэв | Гол файл(ууд) |
|---|-------|---------------|
| 1 | daily-check build алдаа | `app/api/mind/emotion/daily-check/route.ts` |
| 2 | OpenAI provider type cast | `lib/ai/providers.ts` |
| 3 | Deploy workflow timeout/cache | `.github/workflows/deploy.yml` |
| 4 | Build хурд/санах ой | `next.config.ts`, `package.json` |
| 5 | Lint workflow устгасан | `.github/workflows/lint.yml` |
| 6 | vote `not_found:chat` тайлбар | `app/(chat)/api/vote/route.ts` |
| 7 | Guest хандалт хаасан | `proxy.ts`, `auth.ts`, `login/page.tsx`, чат route |
| 8 | getStreamContext type | `app/(chat)/api/chat/route.ts` |
| 9 | Буруу model ID fallback | `lib/ai/providers.ts`, `components/chat.tsx` |
| 10 | AI SDK хувилбар нэгтгэл | `package.json`, `tests/prompts/utils.ts` |
| 11 | Бичих эффект (streaming) | чат route, `chat.tsx`, `package.json` |
| 12 | Sidebar дахин дизайн | `components/app-sidebar.tsx` |
| 13 | Цэсний highlight + Харилцаа линк | `app-sidebar.tsx`, `config/menus.ts` |
| 14 | Нэгдсэн `AppShell` (blue glass) | `components/mind/app-shell.tsx` |
| 15 | Апп хуудсуудыг нэгтгэсэн | ebooks, self-care/stress, relations/tests, finance |
| 16 | ebooks `[id]` params Promise засвар | `app/(chat)/mind/ebooks/[id]/page.jsx` |
| 17 | Editor хуудсуудын өргөн нэгтгэл | `app/(chat)/mind/ebooks/preview/page.jsx` |
