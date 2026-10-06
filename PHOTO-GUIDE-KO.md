# HELLO SEA 사진·영상 갤러리 안내

현재 사진 탭은 HELLO SEA LOMBOK이 그루뿍 현장에서 직접 촬영한 사진 2장과 영상 4개로 구성됩니다. 외부 아카이브 사진과 제3자 라이선스 자료는 사용하지 않습니다.

## 현재 원본과 웹 파일

| 원본 | 종류 | 웹 파일 | 촬영·출처 |
|---|---|---|---|
| IMG_2347.HEIC | 사진 | `inside-gerupuk.jpg` | HELLO SEA LOMBOK |
| IMG_2348.MOV | 영상 | `gerupuk-lineup.mp4` | HELLO SEA LOMBOK |
| IMG_2396.HEIC | 사진 | `boat-to-the-break.jpg` | HELLO SEA LOMBOK |
| IMG_2428.MOV | 영상 | `sunset-boat.mp4` | HELLO SEA LOMBOK |
| IMG_2437.MOV | 영상 | `sunset-glow.mp4` | HELLO SEA LOMBOK |
| IMG_2442.MOV | 영상 | `gerupuk-cliffs.mp4` | HELLO SEA LOMBOK |

사진은 `public/assets/photos/`, 영상은 `public/assets/videos/`에 저장합니다. 카드에 표시하는 영상 대표 이미지는 `public/assets/photos/*-poster.jpg`입니다. 웹 파일은 원본 HEIC·MOV를 브라우저용 JPG·MP4로 변환한 사본입니다.

## 새 미디어를 추가하는 방법

1. 직접 촬영하거나 사업 홍보 사용 허락을 받은 원본만 사용합니다. 식별 가능한 고객이 있으면 웹사이트·SNS 공개 동의를 먼저 확인합니다.
2. 사진은 JPG/PNG/WebP, 영상은 MP4/WebM으로 최적화합니다. 파일명은 영문·숫자·하이픈만 사용합니다.
3. 영상에는 JPG/PNG/WebP 포스터 이미지를 한 장 만듭니다. 카드에서는 포스터만 불러오고, 확대 뷰어를 연 뒤 영상을 불러오도록 해 초기 로딩을 줄입니다.
4. `public/gallery.json`에 `kind`(`image` 또는 `video`), `src`, 영상의 `poster`·`duration`, 가로·세로 크기, 분류(`scenery` 또는 `surf`), EN·KO·JA 제목·장소·대체 텍스트를 작성합니다.
5. 직접 촬영물은 `author: "HELLO SEA LOMBOK"`, `license: "Original content"`로 표기하고 `source`, `licenseUrl`은 빈 문자열로 둡니다. 원본 파일명, 촬영일, 웹 변환 내용을 함께 기록합니다.
6. `featured: true`는 정확히 한 항목에만 지정합니다. 배열 순서가 실제 표시 순서입니다.
7. `npm run build`, `npm test`를 실행한 뒤 사진 확대, 영상 재생, 좌우 이동, ESC 닫기, EN·KO·JA, 모바일 레이아웃을 확인합니다.

원본 파일은 웹 최적화 파일과 별도로 보관합니다. 웹 배포용으로 줄인 JPG·MP4를 다시 원본으로 사용하지 마세요.
