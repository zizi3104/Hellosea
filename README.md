# HELLO SEA · 문의형 웹앱

GitHub 소스 관리 → Vercel 웹/서버 배포 → Supabase 문의 저장을 위한 첫 버전입니다.
실제 계정 연결, 데이터베이스 마이그레이션, 배포 및 도메인 연결은 아직 수행되지 않았습니다.

## 포함된 기능

- 영어 반응형 브랜드 소개, 서핑 경험 선택, 문의 폼
- 희망 날짜/인원/경험/이름/이메일/선택 WhatsApp 번호/메시지
- 문의는 예약 확정이 아니며 결제를 받지 않음
- 서버 입력 검증, Lombok 날짜 기준, 실제 저장 후 성공 표시
- 저장 실패 시 입력 유지, 재시도 요청 ID로 중복 접수 방지
- 공개 DB 읽기/쓰기 차단, 서버 전용 Supabase secret key
- DB 기반 IP 해시별 시간당 5건 제한, 숨김 스팸 필드
- 선택 WhatsApp 직접 문의 버튼 (운영 번호 등록 시 표시)
- GitHub Actions 테스트/빌드

자동 결제, 예약 확정, 재고/수업 정원, 문의 관리 웹화면, 자동 문의 이메일 알림은 포함하지 않습니다. 초기 문의 관리는 Supabase의 surf_inquiries 테이블에서 진행합니다. status는 new/contacted/closed입니다.

## 로컬 실행

Node.js 24를 사용합니다. 외부 npm 의존성이 없어 설치 없이 실행됩니다.

```sh
npm run dev
npm test
npm run build
```

http://localhost:3000 에서 확인합니다. `.env.example`을 `.env.local`로 복사하고 필요한 서버 환경변수를 설정하면 실제 Supabase에 연결할 수 있습니다. 설정 전에는 접수 버튼이 비활성화되고 준비 중 안내가 표시됩니다. 모의 성공으로 고객을 오인시키지 않습니다.

## Supabase 설정

1. HELLO SEA 전용 프로젝트를 선택하거나 생성합니다. 생성 비용/요금제는 계정에서 확인합니다.
2. `supabase/migrations/202609210001_inquiries.sql`을 마이그레이션으로 적용합니다. 이미 적용된 프로젝트에 반복 실행하지 않습니다.
3. Project URL과 서버용 secret key (`sb_secret_…`)를 Vercel 환경변수에 설정합니다. 키를 GitHub나 채팅에 올리지 않습니다.
4. 접수 테스트 후 Table Editor의 `surf_inquiries`에서 테스트 행을 확인하고 삭제합니다.

RLS가 활성화되어 있고 anon/authenticated에게 테이블/함수 접근 권한이 없습니다. 모든 저장은 Vercel 서버의 검증을 거친 뒤 service_role 권한의 secret key로 진행됩니다. 별도의 고객 인증은 없습니다.

## GitHub와 Vercel 배포

1. 새 private GitHub 저장소에 이 폴더 내용을 올립니다. `.env.local`과 실제 비밀키는 올리지 않습니다.
2. Vercel에서 해당 저장소를 Import합니다. Framework Preset은 Other, Build Command는 `npm run build`, Output Directory는 `dist`입니다. `vercel.json`에 설정되어 있습니다.
3. Vercel 환경변수에 아래 값을 등록합니다.

| 변수 | 값 |
|---|---|
| SUPABASE_URL | 실제 프로젝트 HTTPS URL |
| SUPABASE_SECRET_KEY | 서버용 secret key |
| RATE_LIMIT_SECRET | 무작위 32바이트 이상 값 |
| ALLOWED_ORIGINS | https://hellosea.shop,https://www.hellosea.shop |
| WHATSAPP_NUMBER | 6287861136585 (사용자 확인 번호) |

RATE_LIMIT_SECRET은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`로 생성할 수 있습니다. 프리뷰 주소는 Vercel이 제공하는 VERCEL_URL을 통해 허용됩니다. 별도 별칭 주소에서 문의를 보내려면 ALLOWED_ORIGINS에 정확한 origin을 추가합니다.

4. Deploy 후 실제 서버 문의 접수를 검증합니다. 로컬 테스트는 HTTP 계약과 예외 처리를 검증하며 실제 Supabase 연결을 대체하지 않습니다.
5. Vercel 프로젝트 Domains에 `hellosea.shop`을 추가합니다. `www.hellosea.shop`을 추가하면 대표 도메인으로 리다이렉트를 설정합니다.
6. Vercel이 **해당 프로젝트에 표시하는 DNS 값**을 가비아 DNS 관리에 입력합니다. 임의의 고정 IP를 사용하지 않습니다. 기존 메일용 MX/TXT 레코드는 보존합니다.
7. Vercel의 DNS/HTTPS 정상 상태를 확인하고 커스텀 도메인에서 문의 접수를 다시 확인합니다.

## 운영 전에 확인할 실제 정보

- 문의 담당자 (공식 WhatsApp +62 878-6113-6585 반영 완료)
- Asim/Yudha 영문 표기와 소개 문구
- 실제 가능한 수업 종류, 가격/포함 사항, 운영 일정 (현재 가격/일정은 임의로 쓰지 않음)
- 개인정보 책임자/연락처와 문의 데이터 보관·삭제 기준. 현재 개인정보 안내는 실제 데이터 흐름 설명용 초안이며 법률 검토 완료본이 아님
- 보관 정책에 맞는 문의 정리 일정. IP 해시는 오래된 기록을 다음 접수 시 제거하며, 장기 무접속 시 자동 삭제 스케줄은 별도로 설정해야 함

문의는 Supabase에 저장되며 자동 알림은 없으므로 담당자가 새 문의를 정기적으로 확인해야 합니다. 이메일 답장은 운영자가 직접 보냅니다. WhatsApp 버튼은 별도 채팅을 열며, 그 채팅은 이 데이터베이스에 자동 저장되지 않습니다.

## 디자인

선택된 A/B 디자인을 기준으로 배경·글자 없이 분리하고 선 굵기와 색상을 통일한 벡터 캐릭터를 사용합니다.
- `mascot-a.svg`, `mascot-b.svg`: 안내용 캐릭터.
- `wordmark.svg`: 두 버전에서 공유하는 HELLO SEA / LOMBOK 워드마크.
- `hello-sea-a-lockup.svg`, `hello-sea-b-lockup.svg`: 동일한 글자와 배치를 사용한 순수 벡터 조합.
기존 PNG와 시트는 참고용으로 보관하며 화면에는 사용하지 않습니다.
`npm run preview`로 이미지·CSS·JS가 내장된 단일 HTML 미리보기를 재생성합니다.

## 사진 갤러리

첫 화면은 실제 그루뿍 사진을 중심으로 구성하고 캐릭터는 작은 안내자로 배치했습니다. 사진 탭에서 전체·풍경·서핑 분류, 확대 보기, 이전·다음 이동을 지원합니다. 사진 설명과 조작 문구는 영어·한국어·일본어로 전환됩니다.

그루뿍 해변, 탄중안 해변, 마위 서핑 사진을 포함합니다. 촬영 연도와 장소를 구분하고, HELLO SEA의 실제 수업 사진으로 소개하지 않습니다. 원본 출처·촬영자·라이선스는 웹앱과 `public/gallery.json`에 기록되어 있습니다.

사진 추가는 `PHOTO-GUIDE-KO.md`를 참고하세요. 이미지 파일과 사진 목록을 수정하고 빌드·배포하는 방식이며 관리자 업로드 화면은 포함하지 않습니다.

## 공식 참고

- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel custom domain 연결](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Vector update
The active website now uses mascot-a.svg, mascot-b.svg, wordmark.svg and A/B lockups containing only vector paths. Shapes are traced from approved isolated artwork and flattened to four brand colours. The older PNGs remain reference assets. SVG/EPS files open in Illustrator; native AI saving has not been performed.

## English / Korean / Japanese
English is the default. The language selector saves only the chosen language in localStorage when available. Language changes preserve inquiry values. All page copy, labels, placeholders, errors, notices, privacy details, success messages and WhatsApp greeting text are localized in public/i18n.js. The same selected language is used by the standalone preview.

Date selection uses explicit Year / Month / Day dropdowns so browser locale cannot change the field format. Incomplete dates, invalid days, past dates and dates beyond two years are rejected. Dates use Lombok time. Online forms remain disabled when unconfigured or in preview; WhatsApp is available beside the form. No inquiry data is stored in localStorage.

## AYO SURF / 별도 관리자 페이지

고객 사이트에는 편집 메뉴·폼·스크립트가 없습니다. 관리자 페이지는 `/admin`이며 회원가입, 이메일 인증 후 로그인, 로그아웃, 승인 관리자용 사진·소개 편집을 제공합니다. 운영 연결 방법은 `ADMIN-SETUP-KO.md`를 참고하세요.

관리자는 AYO SURF 학교 소개, Asim과 Yudha의 이름·사진·각 언어 소개글, 예시 소개 안내 표시를 수정하고 저장·게시할 수 있습니다. 일반 가입자에게는 편집 권한이 없습니다. 게시된 내용은 DB에서 불러오며 기본 예시 내용은 `public/team.json`에 있습니다. 고객용 단일 HTML preview는 생성 시점의 기본 내용이며 운영 DB와 자동 동기화하지 않습니다.

## PRICING 참고 가격

`public/pricing.json`에서 상품과 참고 가격을 관리합니다. 2026-09-21에 https://lomboksurflessons.com/pricing/ 에서 확인한 그룹 500,000 / 개인 700,000 / 가이딩 400,000 / 3회 1,350,000 / 5회 2,000,000 IDR의 1인 가격입니다. HELLO SEA 확정 요금은 아니며 포함 사항도 확정하지 않았습니다. 영어·한국어·일본어로 참고 요금 안내를 표시합니다.

선택 상품과 인원별 참고 합계를 문의 폼에 표시합니다. 서버에서는 전송된 금액을 신뢰하지 않고 상품 ID로 가격을 다시 계산해 문의 메시지에 저장합니다. 메시지 입력은 1,800자로 제한해 상품 메모와 함께 DB 제한 2,000자를 넘지 않게 합니다. 실제 문의 저장·공개 배포는 기존 서버 연결 작업 이후 가능합니다. 가격 편집용 관리자 화면은 아직 포함하지 않습니다.


## September 2026 admin console

Production domain: https://hellosealombok.com. Admin: /admin.

- Approved, email-verified administrators can edit five lesson prices and upload/replace/reorder gallery photos. One gallery photo is selected as the homepage hero.
- The reservation calendar uses Lombok dates and four sessions per day. Each booking displays the guest name and headcount, with status, optional times and participant names.
- Inquiries can be assigned to the calendar with name, date, phone, message and headcount prefilled. Inquiries are not automatically confirmed bookings.
- Revision checks reject stale writes; one inquiry cannot be assigned twice. Cancel bookings using the status field.
- Apply db/admin-console.sql after the existing schema. Tables have RLS and no public client access. Server routes verify approved user UUIDs before returning personal data.
- Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, RATE_LIMIT_SECRET and ALLOWED_ORIGINS in Vercel Production. ADMIN_USER_IDS must list verified accounts explicitly approved by the owner. Redeploy after setting environment variables.
- CONTACT_EMAIL enables an email contact link beside WhatsApp. No address is guessed. These direct-contact links are separate channels; WhatsApp messages are not automatically copied into email or the database. Automatic cross-channel notifications require provider setup and are not enabled by this code.
- Photo uploads are resized to JPEG, max 12 images, with a total 2.8MB gallery payload. Original image licensing information is preserved until a photo is replaced.

Verification: npm run build; npm test. The admin console still requires a configured server and an approved account for end-to-end login/save verification.
