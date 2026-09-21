# HELLO SEA 사진 추가 안내

현재 웹앱에는 그루뿍 해변, 마위 서핑, 탄중안 해변 사진 3장이 있습니다. 그루뿍 이외 사진은 실제 장소를 명시했습니다. HELLO SEA 수업이나 고객의 촬영 사진이라고 표시하지 않습니다.

## 사진을 추가하는 방법

1. 사용 허락을 받은 JPG/PNG/WebP 사진을 `public/assets/photos/`에 넣습니다. 파일명은 영문·숫자·하이픈으로 작성합니다.
2. `public/gallery.json`의 기존 항목을 복사해 새 사진의 `id`, `src`, 가로·세로 크기, 분류(`scenery` 또는 `surf`), 영어·한국어·일본어 제목/장소/대체 텍스트를 작성합니다.
3. `author`, `source`, `license`, `licenseUrl`, `date`, `changes`에 실제 작가·허락 근거·촬영일·수정 내용을 적습니다. 직접 촬영했어도 식별 가능한 인물이 있으면 사업 홍보에 사용하는 동의를 확인합니다.
4. `npm run build`를 실행하면 새 카드와 출처 목록이 자동 반영됩니다. `npm run preview`는 다운로드해서 열 수 있는 단일 HTML도 다시 만듭니다. 배포 사이트 반영은 새 버전을 배포해야 합니다.

배열 순서가 표시 순서입니다. 대표 사진에는 `featured: true`를 지정하세요. 대표 사진은 한 장만 선택하세요.
현재는 파일 목록을 편집하는 방식이며, 운영자 로그인/웹 업로드 관리 화면은 포함하지 않습니다.

## 포함된 사진과 사용 조건

| 사진 | 작가 | 촬영일 | 라이선스 |
|---|---|---|---|
| Gerupuk Beach.jpg | 伊賀上野ニンニン | 2017-03-28 | CC BY-SA 4.0 |
| Dave B @ Mawi | David Hunt | 2008-05-25 | CC BY 2.0 |
| PANTAI TANJUNG AAN.jpg | Suryanata budi / PAGESPHOTOGRAPH | 2017-06-02 | CC BY-SA 4.0 |

원본 출처:
- https://commons.wikimedia.org/wiki/File:Gerupuk_Beach.jpg
- https://commons.wikimedia.org/wiki/File:Dave_B_@_Mawi_(2706207006).jpg
- https://commons.wikimedia.org/wiki/File:PANTAI_TANJUNG_AAN.jpg

이용 조건:
- https://creativecommons.org/licenses/by-sa/4.0/
- https://creativecommons.org/licenses/by/2.0/

각 원본 페이지에서 라이선스를 확인한 날짜: 2026-09-21.

사진 원본 바이트는 수정하지 않았습니다. 화면 카드에서 일부가 잘려 보일 수 있으며, CC BY-SA 사진의 표시용 잘림에도 동일 라이선스를 적용합니다. 확대 보기에서는 원본 전체 비율을 표시합니다. 사진 아래 작가·출처·라이선스 표시를 유지하세요. CC BY-SA 사진을 다시 편집해 배포하면 해당 편집 이미지에도 같은 라이선스를 적용하고 변경 사항을 명시해야 합니다. 웹앱 코드와 HELLO SEA 자체 로고의 라이선스를 사진의 라이선스와 혼동하지 마세요.

저작권 라이선스를 확인한 자료이며, 모든 초상권·상표권이나 기타 권리까지 무조건 보장한다는 뜻은 아닙니다. 사진 속 인물이나 작가가 HELLO SEA 강사·고객이거나 브랜드를 추천하는 것처럼 사용하지 마세요.
