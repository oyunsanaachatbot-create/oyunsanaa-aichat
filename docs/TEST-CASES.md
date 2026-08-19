# Oyunsanaa AI Chat — тестийн мастер төлөвлөгөө

Огноо: 2026-08-20  
Хамрах хүрээ: `oyunsanaa-aichat`-ийн одоогийн route, schema, UI урсгал, эрхийн шалгалт, AI/QPay/Supabase/Redis интеграци.

## Ашиглах заавар

- `P0`: мөнгө, эрх, нууцлал, өгөгдөл алдагдал; release бүрт заавал.
- `P1`: үндсэн хэрэглэгчийн урсгал; PR/RC бүрт.
- `P2`: нэмэлт, compatibility, UX; regression циклд.
- Төлөв: `NT` (ажиллуулаагүй), `PASS`, `FAIL`, `BLOCKED`, `N/A`.
- Test data-г тусгаарласан DB/schema болон QPay sandbox/mock дээр ажиллуулна. Production төлбөр, бодит хэрэглэгчийн эмзэг мэдээлэл ашиглахгүй.
- API бүр дээр хүснэгтэд дурдсан кейсээс гадна нийтлэг матриц `no session / guest / regular / өөр хэрэглэгчийн ID / malformed JSON / wrong Content-Type / DB timeout`-г давтан хэрэглэнэ.

## Орчин ба суурь өгөгдөл

| Код | Өгөгдөл |
|---|---|
| U-GUEST | Guest session |
| U-TRIAL | Trial хүчинтэй regular хэрэглэгч |
| U-EXPIRED | Trial ба paid period дууссан хэрэглэгч |
| U-PAID | Paid period хүчинтэй хэрэглэгч |
| U-OTHER | Өөр хэрэглэгчийн resource-тэй regular хэрэглэгч |
| U-PSY | Сэтгэлзүйч role-той хэрэглэгч |
| U-ADMIN | Admin role-той хэрэглэгч |
| INV-PENDING | U-TRIAL-д харьяалагдах төлөгдөөгүй QPay invoice |
| INV-PARTIAL | Нийт төлөлт нь үнээс бага invoice |
| INV-PAID | Бүрэн төлөгдсөн invoice |

## Системийн заавал хадгалах invariant

| Invariant | Ямар ч failure/race-ийн дараах шаардлага |
|---|---|
| Ownership | Chat, document, vote, run, goal, health, finance, therapy, upload нь зөвхөн session user-д уншигдаж/өөрчлөгдөнө |
| Subscription | QPay provider-оос stored invoice-ийн бүтэн дүн батлагдаагүй бол paid access олгохгүй |
| Idempotency | Нэг invoice-ийн callback/poll/retry нь paid period-ийг яг нэг удаа сунгана |
| Atomicity | Payment state ба subscription end-ийн аль нэг нь дангаараа commit болохгүй |
| Program snapshot | Published definition шинэчлэгдсэн ч эхэлсэн run өөрийн version-оор үргэлжилнэ |
| Completion | COMPLETED usage/run нь retry эсвэл хуучин draft-аар доошлохгүй |
| Upload safety | MIME/өргөтгөлд дангаар итгэхгүй; хэрэглэгчийн файл executable origin/content-type-аар serve болохгүй |
| Privacy | Prompt, private message, OTP, token, төлбөрийн credential log/error/analytics-д бүтнээр орохгүй |

## 1. Бүртгэл, нэвтрэлт, email баталгаажуулалт, нууц үг

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-AUTH-001 | P0 | Зөв email/password-аар нэвтрэх | Session үүсэж зөв redirect хийнэ; cookie нь secure орчинд хамгаалагдсан байна |
| AC-AUTH-002 | P1 | Буруу password | Ерөнхий алдаа; account байгаа эсэх, hash, stack илрэхгүй |
| AC-AUTH-003 | P1 | Байхгүй email | AC-AUTH-002-той ялгагдахгүй ерөнхий хариу; enumeration үүсэхгүй |
| AC-AUTH-004 | P1 | Email-ийн өмнө/хойно space, үсгийн case өөр | Trim/normalize хийсний дараа зөв account-д орно |
| AC-AUTH-005 | P1 | Empty, null, malformed JSON, хэт урт email/password | 4xx validation; 500, DB write, session үүсэхгүй |
| AC-AUTH-006 | P0 | Нэг email-аар зэрэгцээ 2 бүртгэл | Нэг л user үүснэ; нөгөө хүсэлт deterministic conflict авна |
| AC-AUTH-007 | P1 | Password яг min boundary, түүнээс 1 богино, маш урт | Min зөвшөөрөгдөнө; богино нь татгалзана; урт input DoS/500 үүсгэхгүй |
| AC-AUTH-008 | P0 | Email OTP зөв, буруу, хугацаа дууссан, аль хэдийн ашигласан | Зөв код нэг удаа ажиллана; бусад нь 4xx бөгөөд token дахин ашиглагдахгүй |
| AC-AUTH-009 | P0 | OTP-г зэрэгцээ 2 verify хийх | Нэг л хүсэлт амжилттай; replay session/verification давхар үүсгэхгүй |
| AC-AUTH-010 | P1 | OTP request-ийг богино хугацаанд олноор хийх | Rate limit/cooldown үйлчилж email flood хийхгүй |
| AC-AUTH-011 | P0 | Password reset request: байгаа ба байхгүй email | Ижил success response/time profile; account enumeration үгүй |
| AC-AUTH-012 | P0 | Reset token зөв/expired/used/tampered; хоёр зэрэг submit | Зөв token нэг удаа password солино; бусад нь 4xx; хуучин password ажиллахгүй |
| AC-AUTH-013 | P0 | Reset хийсний дараа өмнөх идэвхтэй session | Төслийн policy-ийн дагуу invalidate эсвэл баримтжуулсан зан төлөв; нууц эрсдэлгүй |
| AC-AUTH-014 | P1 | Guest route-ийн `redirectUrl`-д external URL, `//evil`, encoded URL | Open redirect үүсэхгүй; зөвхөн зөвшөөрсөн дотоод route |
| AC-AUTH-015 | P1 | Logout дараа browser back, protected deep link | Cache-аас хувийн data харагдахгүй; login руу шилжинэ |
| AC-AUTH-016 | P1 | Cookie устсан/expired session-тай form submit | 401/redirect; mutation хийгдэхгүй |
| AC-AUTH-017 | P2 | MN/EN/RU/KO/JA хэл дээр auth validation | Орчуулга эвдэхгүй, key raw-аар харагдахгүй, Unicode input зөв |
| AC-AUTH-018 | P0 | CSRF origin зөрүүтэй auth/mutation хүсэлт | Framework/policy дагуу хориглоно; session өөрчлөгдөхгүй |

## 2. Chat, model, attachment, stream, history

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-CHAT-001 | P1 | U-TRIAL шинэ чатад энгийн message | Chat/message хадгалагдаж assistant stream ирнэ; title нэг удаа үүснэ |
| AC-CHAT-002 | P1 | U-GUEST зөвшөөрсөн guest chat | Guest quota дотор хариулна; DB user resource-д буруу ownership үүсэхгүй |
| AC-CHAT-003 | P0 | Guest хамгаалагдсан/paid intent ашиглах | 401/403; subscription эсвэл private tool тойрохгүй |
| AC-CHAT-004 | P0 | U-EXPIRED чат илгээх | Subscription gate 403; LLM дуудлага, message write хийхгүй |
| AC-CHAT-005 | P1 | U-PAID paid period-ийн сүүлийн миллисекундээс өмнө/яг төгсөхөд | `< end` үед л access; boundary deterministic |
| AC-CHAT-006 | P1 | Empty/whitespace message, missing id, malformed parts | 400; empty chat/message үүсэхгүй |
| AC-CHAT-007 | P1 | Маш урт text, олон parts/attachments | Schema/size limit-ээр аюулгүй татгалзах; process memory өсөж унахгүй |
| AC-CHAT-008 | P0 | Өөр хэрэглэгчийн private chat ID-д POST/DELETE/stream | 403/404; title/message/stream metadata задрахгүй |
| AC-CHAT-009 | P1 | Public chat-ыг owner бус хүн унших | Зөвхөн public data; mutation, vote, delete эрх өгөхгүй |
| AC-CHAT-010 | P1 | Нэг message-ийг double-click/сүлжээ retry | Client duplicate-ийг хязгаарлана; server duplicate илэрвэл тодорхой зан төлөвтэй |
| AC-CHAT-011 | P0 | Өдөр тутмын message limit-ийн N-1/N/N+1 | Зөв boundary дээр rate_limit; rejected message LLM/DB usage нэмэхгүй |
| AC-CHAT-012 | P1 | Guest Redis rate store unavailable/corrupt value | Fail-safe зан төлөв; 500 stack/Redis key илрэхгүй |
| AC-CHAT-013 | P1 | Invalid/unknown model id | 400 эсвэл default; provider-д дурын model name дамжихгүй |
| AC-CHAT-014 | P1 | Model selector солих, reload, шинэ чат | Сонголт policy-ийн дагуу хадгалагдаж зөв provider ашиглана |
| AC-CHAT-015 | P0 | Prompt injection: system prompt/secret/other-user memory нэхэх | System instruction, env secret, өөр user context задрахгүй |
| AC-CHAT-016 | P0 | Tool approval-г forged message/part-аар батлах | Server талд зөв chat/user/tool call-тайг батална; дурын tool execute хийхгүй |
| AC-CHAT-017 | P1 | Provider timeout/429/5xx | UI retry-friendly алдаа; partial stream цэвэр хаагдаж user message алга болохгүй |
| AC-CHAT-018 | P1 | Stream дундуур offline болоод reconnect `/stream` | Давхар assistant message үгүй; байгаа stream resume эсвэл empty stream зөв |
| AC-CHAT-019 | P1 | Stream байхгүй, most recent нь user, already-completed assistant | Тус бүр documented empty/404 behavior; infinite spinner үгүй |
| AC-CHAT-020 | P1 | Chat DELETE owner, дараа refresh/history | Chat болон холбогдох data policy-ийн дагуу арилж history-д үзэгдэхгүй |
| AC-CHAT-021 | P0 | Chat DELETE guest | `skipped` боловч бусдын data устахгүй |
| AC-CHAT-022 | P1 | History default limit, limit=1, max, 0, negative, NaN, huge | Pagination тогтвортой; invalid утга 4xx/clamp; memory DoS үгүй |
| AC-CHAT-023 | P1 | `starting_after` ба `ending_before` хоёуланг өгөх | 400; ambiguous pagination query ажиллахгүй |
| AC-CHAT-024 | P1 | Cursor байхгүй/өөр user-ийн chat ID | Data leak үгүй; deterministic empty/4xx |
| AC-CHAT-025 | P1 | Олон chat ижил timestamp-тай pagination | Duplicate/skip үгүй; stable ordering |
| AC-CHAT-026 | P1 | Image attachment: valid jpeg/png/webp/heic, metadata rotation | Preview ба model input зөв orientation; unsupported gracefully rejected |
| AC-CHAT-027 | P0 | MIME spoof, polyglot, SVG/script, executable нэртэй файл | Content/type шалгалтаар хориглоно; executable serve хийхгүй |
| AC-CHAT-028 | P1 | Upload size яг limit, limit+1, 0 byte, тасарсан upload | Boundary зөв; orphan object/DB row үүсэхгүй |
| AC-CHAT-029 | P1 | Олон зурагтай intent ба text-only intent | Image model зөвхөн шаардлагатай үед; attachment mapping алдагдахгүй |
| AC-CHAT-030 | P2 | Markdown/code/math/table/RTL/Unicode/emoji output | XSS-гүй render; layout, copy, selection хэвийн |

## 3. Document, suggestion, vote, artifact

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-ART-001 | P1 | Owner document create/read/update | Version зөв хадгалагдаж хамгийн сүүлийн content харагдана |
| AC-ART-002 | P0 | Өөр user-ийн document GET/POST/DELETE | 403/404; content болон existence задрахгүй |
| AC-ART-003 | P1 | Missing id, invalid timestamp, future timestamp | 400; буруу version устахгүй |
| AC-ART-004 | P1 | Ижил document дээр зэрэг update | Version history гэмтэхгүй; deterministic ordering/conflict |
| AC-ART-005 | P1 | Delete at timestamp | Заасан version болон дараах хувилбарын contract зөв; бусад document хэвээр |
| AC-ART-006 | P1 | Suggestion байхгүй document | 200 empty list; UI empty state |
| AC-ART-007 | P0 | Өөр user-ийн suggestion авах | 403; suggestion text leak үгүй |
| AC-ART-008 | P1 | Vote up/down, дараа reverse хийх | Нэг message-д нэг user vote; update зөв, duplicate row үгүй |
| AC-ART-009 | P0 | Өөр user-ийн chat message-д vote | 403; vote write үгүй |
| AC-ART-010 | P1 | Missing chat/message, invalid vote value | 400/404; database 500 үгүй |
| AC-ART-011 | P1 | Active artifact set/clear/reload | Зөв user-д хадгалагдаж chat context-т зөв artifact орно |
| AC-ART-012 | P0 | Forged artifact ID/type/content | Ownership/type server дээр шалгагдаж prompt context poison хийхгүй |

## 4. Subscription ба QPay

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-PAY-001 | P0 | Trial start+TRIAL_DAYS-1ms, яг end, +1ms | Өмнө нь trialing; яг end-ээс expired |
| AC-PAY-002 | P0 | Paid end-1ms, яг end; trial ба paid давхцах | Хүчинтэй цонх зөв сонгогдож daysLeft/status зөрөхгүй |
| AC-PAY-003 | P0 | Active хугацаа үлдсэн үед дахин төлөх | Одоогийн end-ээс PERIOD_DAYS сунгана; хугацаа алдагдахгүй |
| AC-PAY-004 | P0 | Expired үед төлөх | `now`-оос шинэ period эхэлнэ |
| AC-PAY-005 | P1 | QPay config дутуу үед invoice | 4xx; external/local invoice үүсэхгүй; secret response-д үгүй |
| AC-PAY-006 | P0 | Invoice create амжилттай | Amount/currency server constant; authenticated user ownership; callback зөв |
| AC-PAY-007 | P0 | QPay invoice үүссэн ч local save fail | External invoice cancel оролдоно; audit log; orphan payable invoice үлдэхгүй |
| AC-PAY-008 | P0 | Client amount/currency/receiver override оролдох | Ignore/reject; server stored amount өөрчлөгдөхгүй |
| AC-PAY-009 | P0 | Verify-д өөр user-ийн senderInvoiceNo | Not found/forbidden; төлбөр/эрх нөгөө user-д нөлөөлөхгүй |
| AC-PAY-010 | P1 | Verify malformed/missing/too long senderInvoiceNo | 400; provider call хийхгүй |
| AC-PAY-011 | P0 | No payment, partial payment, exact, overpayment, олон PAID row нийлбэр | Зөвхөн нийт PAID >= stored amount үед нэг удаа activate |
| AC-PAY-012 | P0 | CANCELLED/FAILED payment row хамт ирэх | Зөвхөн `PAID` нийлбэрт орно |
| AC-PAY-013 | P0 | Callback ижил invoice-д 10 удаа/зэрэгцээ | Бүгд safe response; subscription яг нэг PERIOD_DAYS сунана |
| AC-PAY-014 | P0 | Callback missing/unknown invoice | 400/controlled error; дурын хэрэглэгчийн эрх өөрчлөгдөхгүй |
| AC-PAY-015 | P0 | Callback body худал `paid=true`, provider unpaid | Server provider verification давамгай; access олгохгүй |
| AC-PAY-016 | P1 | Provider timeout/401/429/5xx verify/callback | Controlled 4xx/5xx; audit log secret-free; retry-д state эвдрэхгүй |
| AC-PAY-017 | P0 | Pending invoice cancel | QPay cancel эхэлж, амжилтын дараа local cancelled; дахин cancel idempotent |
| AC-PAY-018 | P0 | Cancel хийх агшинд payment орсон (`INVOICE_PAID`) | Verify хийж paid болгоно; cancelled болгож эрх алдахгүй |
| AC-PAY-019 | P0 | Paid invoice cancel оролдох | 409 paid; period буцааж хасахгүй |
| AC-PAY-020 | P0 | Өөр user-ийн invoice cancel | 404/403; external cancel call хийхгүй |
| AC-PAY-021 | P1 | Status endpoint trial/active/expired | UI ба chat gate нэг source-of-truth-той; daysLeft зөв round-up |
| AC-PAY-022 | P0 | DB transaction дунд fail | Payment marked paid ба subscription extension атомик; half state үгүй |
| AC-PAY-023 | P0 | Sender invoice uniqueness өндөр concurrency-д | Collision үгүй; зөв invoice/user mapping |
| AC-PAY-024 | P0 | Callback URL env-д malicious/invalid base | HTTPS allowlist/config validation; header-ээр open callback injection үгүй |

## 5. Сэтгэлзүйн тест, balance, program

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-MIND-001 | P1 | Static relations test бүрийг бүрэн бөглөх | Score, band boundary, title/summary зөв; result хадгалагдана |
| AC-MIND-002 | P1 | 0%, band boundary-1, boundary, 100% | Band сонголт overlap/gap-гүй |
| AC-MIND-003 | P1 | Асуулт алгасах, duplicate question ID, unknown option value | Complete хийхгүй; 400/validation; NaN score үгүй |
| AC-MIND-004 | P0 | Result POST-д forged score/band/answers | Server дахин тооцох эсвэл итгэмжгүй data гэж тусгаарлах; arbitrary object/script хадгалахгүй |
| AC-MIND-005 | P1 | AI test messages 1/12, 0/13; content 1/2000/2001 | Boundary дагуу 200/400; provider invalid input дээр дуудагдахгүй |
| AC-MIND-006 | P1 | AI structured output: 5/12 question, яг 5 options | Schema зөв үед хадгална, бусад үед 500 controlled; partial test үгүй |
| AC-MIND-007 | P0 | AI output-д diagnosis/self-harm unsafe wording | Medical diagnosis биш disclaimer/safety policy; crisis escalation хэрэгтэй үед зөв |
| AC-MIND-008 | P1 | AI generation provider timeout/invalid JSON | `test_generation_failed`; app event бичигдэнэ; broken test хадгалагдахгүй |
| AC-MIND-009 | P0 | AI test list-д өөр user-ийн generated test | Харагдахгүй, slug-аар direct access боломжгүй |
| AC-MIND-010 | P1 | Balance run missing field/invalid type | 400; half result үүсэхгүй |
| AC-MIND-011 | P1 | Who-am-I draft valid payload | Reload-д бүх screen/index/note/answer/score сэргээнэ |
| AC-MIND-012 | P1 | Who-am-I pct: тус бүр 0/100; complete нийлбэр 99/100/101 | Зөвхөн total=100 complete; draft partial байж болно |
| AC-MIND-013 | P1 | areaIdx -1/0/3/4, score -1/0/10/11, note 10000/10001 | Schema boundary зөв |
| AC-MIND-014 | P0 | Өөр user-ийн run UUID-г draft/complete хийх | Ownership зөрчихгүй; нөгөө run өөрчлөгдөхгүй |
| AC-MIND-015 | P1 | Program run шинэ/continue/complete | Version snapshot тогтвортой; published content өөрчлөгдсөн ч active run эвдрэхгүй |
| AC-MIND-016 | P1 | Required answer дутуу complete | `required_answers_missing` ба missing жагсаалт; status complete болохгүй |
| AC-MIND-017 | P1 | Completed run-г дахин complete/retry | Idempotent буюу 409; usage event давхар тоологдохгүй |
| AC-MIND-018 | P1 | Draft save offline/reconnect зэрэгцээ | Сүүлийн зөв payload алдагдахгүй; хуучин response шинэ state-г дарахгүй |
| AC-MIND-019 | P1 | Archived/unpublished/unknown program slug | Public хэрэглэгч start хийхгүй; 404/403; definition leak үгүй |
| AC-MIND-020 | P1 | Emotion/relations daily check нэг өдөр олон save | Date/user key policy дагуу update/idempotent; timezone өдөр солигдолт зөв |

## 6. Health, meal analysis, finance, goals

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-LIFE-001 | P1 | Health profile create/read/update | Зөв user-ийн profile upsert; reload-д data зөв |
| AC-LIFE-002 | P1 | Health profile negative/absurd/NaN/Infinity/string numeric | Validation/clamp; DB 500 ба тооцооны NaN үгүй |
| AC-LIFE-003 | P1 | Daily record valid ISO day, missing/invalid/leap date | Зөв date л хадгална; timezone off-by-one үгүй |
| AC-LIFE-004 | P1 | History `days`: absent, 1, 90, 0, -1, 91, NaN | Default 7; 1..90 clamp; query bounded |
| AC-LIFE-005 | P1 | Manual meal missing day/type/title | 400; meal үүсэхгүй |
| AC-LIFE-006 | P1 | Analyzed meal numeric fields 0/max/max+epsilon/NaN/Infinity | 0..declared max зөв; invalid 400 |
| AC-LIFE-007 | P1 | Нэг analyzed mealId-г retry | Duplicate calorie entry үүсэхгүй эсвэл contract тодорхой |
| AC-LIFE-008 | P1 | Food image жинхэнэ хоол/хоол биш/blur/dark/олон хоол | Зөв structured result эсвэл `invalid_image`; hallucinated exactness-ийг confidence илтгэнэ |
| AC-LIFE-009 | P0 | Meal/receipt image-д prompt injection text | Model instruction override хийхгүй; зөвхөн schema data буцаана |
| AC-LIFE-010 | P1 | Image API key missing/provider timeout/invalid schema | Controlled 4xx/5xx + requestId; raw provider response/secret үгүй |
| AC-LIFE-011 | P1 | Finance receipt amount/category/date boundary | Structured transaction зөв; confidence 0..1 |
| AC-LIFE-012 | P1 | Finance POST empty rows, нэг/олон valid row, mixed invalid row | Empty 400; transaction policy дагуу бүхэлд нь эсвэл тодорхой partial result |
| AC-LIFE-013 | P0 | Finance GET/DELETE өөр user-ийн row IDs | Зөвхөн session user-ийн data; cross-user delete үгүй |
| AC-LIFE-014 | P1 | Delete нэг ID, all flag, missing selector, retry | Зөв scope; idempotent; accidental global delete үгүй |
| AC-LIFE-015 | P1 | Goal planner empty goals / олон goal / duplicate localId | Empty 400; unique user-local mapping; deterministic update |
| AC-LIFE-016 | P0 | Goal DELETE/PATCH өөр user-ийн localId | Ownership filter; нөгөө user-ийн goal өөрчлөгдөхгүй |
| AC-LIFE-017 | P1 | Increment progress зэрэгцээ 10 request | Lost update үгүй; expected +10 буюу defined idempotency |
| AC-LIFE-018 | P1 | Progress date invalid, leap day, timezone midnight | Invalid 400; local day зөв bucket |
| AC-LIFE-019 | P1 | Goal logs missing goal ID / unknown goal / маш урт note | 400/404/validation; orphan log үгүй |
| AC-LIFE-020 | P2 | Chart empty/single/large dataset | UI crash, overflow, misleading axis үгүй |

## 7. Therapy ба сэтгэлзүйчтэй чат

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-CARE-001 | P0 | Patient conversation create/list/open | Зөв participant mapping; өөр user жагсаалтад харагдахгүй |
| AC-CARE-002 | P0 | Өөр conversation ID-р GET/POST/PATCH/stream | 403/404; message/title/status leak үгүй |
| AC-CARE-003 | P1 | Empty/whitespace/too-long message | 400; empty row үүсэхгүй |
| AC-CARE-004 | P1 | Patient ба psychologist зэрэг message илгээх | Stable order, unique IDs, message loss/duplication үгүй |
| AC-CARE-005 | P1 | Stream disconnect/reconnect, Last-Event-ID equivalent | Missing messages нөхөгдөж duplicate render үгүй |
| AC-CARE-006 | P0 | Closed conversation-д message | Policy дагуу 409/403; reopen зөв role-д л |
| AC-CARE-007 | P0 | Role spoof хийж psychologist endpoint дуудах | Session/DB role шалгалт; body role-д итгэхгүй |
| AC-CARE-008 | P0 | HTML/script/link payload | Stored XSS үгүй; URL rendering аюулгүй |
| AC-CARE-009 | P0 | Therapy message/content logs | Эмзэг текст application/provider log-д бүтнээр орохгүй |
| AC-CARE-010 | P1 | DB/stream backend тасрах | User-friendly retry; илгээсэн эсэх тодорхой; duplicate retry хязгаарлана |
| AC-CARE-011 | P0 | Conversation list pagination том өгөгдөлтэй | User scope + stable order; timing/data leak үгүй |
| AC-CARE-012 | P1 | unread/read/archive state (хэрэв UI-д байгаа) | Зөв participant-д, refresh дараа persist |

## 8. Ebook, upload, content recommendation/usage

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-CONT-001 | P1 | Ebook image jpg/png/webp/gif <5MB | Upload success; URL зөв user/resource-т холбогдоно |
| AC-CONT-002 | P1 | 0 byte, яг 5MB, 5MB+1, missing file | Boundary зөв; 400; orphan file үгүй |
| AC-CONT-003 | P0 | MIME spoof, SVG, HTML, executable, double extension | Rejected; stored content executable response header-аар serve хийхгүй |
| AC-CONT-004 | P0 | Bucket/path traversal (`..`, encoded slash, null byte) | Allowlist/normalization; workspace/other bucket file уншихгүй |
| AC-CONT-005 | P0 | Өөр user-ийн private upload URL | 403/404; CDN/cache-аар leak үгүй |
| AC-CONT-006 | P1 | Ebook note create/update/read, empty ба Unicode note | Auto-save зөв; Unicode хадгалагдана; empty policy тогтвортой |
| AC-CONT-007 | P1 | Нэг note зэрэгцээ tab-аас save | Data corruption үгүй; last-write/version conflict ойлгомжтой |
| AC-CONT-008 | P1 | Content recommendation no history / зарим usage / completed content | Empty fallback зөв; completed item давтагдах policy зөв |
| AC-CONT-009 | P0 | Recommendation query-д forged user/tag/source ID | Session user scope; unpublished/private content leak үгүй |
| AC-CONT-010 | P1 | Usage STARTED/VIEWED/COMPLETED event retry | Upsert/idempotent; completion downgrade хийхгүй |
| AC-CONT-011 | P1 | Invalid usage state/type/source | 400; taxonomy/content foreign key эвдэхгүй |
| AC-CONT-012 | P2 | Recommendation card missing image/title/deleted content | Graceful fallback; broken navigation үгүй |

## 9. Security, privacy, resilience, accessibility, compatibility

| ID | P | Тест / оролт | Хүлээгдэж буй үр дүн |
|---|---:|---|---|
| AC-NFR-001 | P0 | API бүрт horizontal IDOR автомат scan | Өөр user-ийн resource 2xx/metadata буцаахгүй |
| AC-NFR-002 | P0 | Role matrix guest/regular/psychologist/admin | Route бүр зөв role; UI нуусан ч direct API хориглогдоно |
| AC-NFR-003 | P0 | SQL/NoSQL injection strings query/body/name | Parameterized; query өөрчлөгдөхгүй; stack үгүй |
| AC-NFR-004 | P0 | Stored/reflected XSS бүх text field | Script execute хийхгүй; safe markdown/HTML policy |
| AC-NFR-005 | P0 | SSRF URL/file/reference input | Private IP, metadata endpoint, file scheme рүү server request хийхгүй |
| AC-NFR-006 | P0 | Oversized JSON/multipart, slow upload, олон parallel хүсэлт | 413/429/timeouts; process унахгүй |
| AC-NFR-007 | P0 | Response/log/error audit | Password, OTP, token, QPay credential, prompt, private message бүтнээр log-д үгүй |
| AC-NFR-008 | P0 | Cache header protected API/page | `private/no-store` зохистой; logout дараа shared cache leak үгүй |
| AC-NFR-009 | P1 | DB timeout/connection pool exhaustion | Controlled failure; transaction rollback; retry storm үгүй |
| AC-NFR-010 | P1 | Redis/Supabase/QPay/AI тус бүр тасрах | Хамааралгүй feature ажиллана; partial state ба secret leak үгүй |
| AC-NFR-011 | P1 | Browser refresh/back/multi-tab бүх wizard | Persisted state зөв; double submit хязгаарлагдана |
| AC-NFR-012 | P1 | Mobile 320px, tablet, desktop, 200% zoom | Гол action тасрахгүй; horizontal overflow үгүй |
| AC-NFR-013 | P1 | Keyboard-only: nav/dialog/chat/file/test | Focus visible, trap/restore зөв, бүх action keyboard-аар |
| AC-NFR-014 | P1 | Screen reader labels/live stream/errors | Нэр/role/state ойлгомжтой; streaming text хэт давтан зарлахгүй |
| AC-NFR-015 | P1 | Color contrast, reduced motion, dark/light | WCAG AA зорилт; хөдөлгөөн унтраахад content алга болохгүй |
| AC-NFR-016 | P2 | Chrome/Safari/Firefox latest, iOS/Android | Auth cookie, SSE/stream, upload, date input ижил ажиллана |
| AC-NFR-017 | P2 | Slow 3G/high latency/offline | Loading/skeleton/cancel/retry зөв; accidental duplicate үгүй |
| AC-NFR-018 | P1 | Locale/timezone Asia/Ulaanbaatar ба UTC | Day/date/payment period/program progress off-by-one үгүй |
| AC-NFR-019 | P1 | 10k chats/messages/results-т query performance | Pagination/index ашиглана; N+1 ба unbounded payload үгүй |
| AC-NFR-020 | P0 | Backup/restore эсвэл migration rehearsal | User ownership, payment audit, run/version холбоос бүрэн хадгалагдана |
| AC-NFR-021 | P0 | Dependency/security header scan | CSP/frame/referrer/content-type хамгаалалт; known critical vulnerability release blocker |
| AC-NFR-022 | P1 | Observability requestId бүхий 4xx/5xx | Алдаа мөрдөх боломжтой ч PII/secret агуулахгүй |

## 10. Release smoke дараалал

1. AC-AUTH-001, 008, 011, 012.
2. AC-CHAT-001, 004, 008, 017, 018.
3. AC-PAY-006, 011, 013, 017, 018, 022.
4. AC-MIND-001, 005, 011, 016.
5. AC-LIFE-003, 008, 013; AC-CARE-001, 002.
6. AC-CONT-001, 003, 005; AC-NFR-001, 007, 008.

## 11. Автоматжуулалтын санал

- Unit: subscription date boundary, role/ownership helpers, score/band, schemas, image normalization.
- API integration: auth matrix, IDOR, program run state, payment confirmation/cancel race, upload validation.
- Playwright: auth, chat stream/reconnect, subscription QR UI, relations/Who-am-I wizard, health/finance, therapy.
- Contract mocks: QPay `unpaid/partial/paid/duplicate/timeout`, AI `valid/invalid schema/429/timeout`, Supabase/Redis failure.
- Security CI: dependency audit, secret scan, ZAP passive scan, upload corpus, API fuzz with bounded payloads.
