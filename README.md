# 풋조이 행사 대시보드

백화점 행사(팝업·시즌오프 등)를 행사별로 쌓아 두고 한 화면에서 보는 저장소입니다.
Railway에 배포되어 아이디·비밀번호로 보호됩니다.

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 대시보드: 전체 요약, 진행 중·예정·종료 필터, 행사 카드 목록 |
| `events.json` | 행사 목록 데이터 (대시보드 카드가 이 파일을 읽음) |
| `events/<행사ID>/index.html` | 행사 상세 페이지 (행사계획 · 물량계획 · 요약 · 골프화 · 회신 메일) |
| `events/<행사ID>/images/` | 메인컷·LMS컷, `products/`에 대표상품 사진 |
| `events/<행사ID>/*.xlsx` | 행사계획서·물량계획 엑셀 |
| `server.js`, `package.json` | 비밀번호 보호 서버 (외부 패키지 없음) |

## 행사 목록

| 행사ID | 행사 | 기간 |
|---|---|---|
| `2026-12-lotte-jamsil` | 롯데백화점 잠실점 12월 팝업 | 2026.12.11 ~ 12.20 |

## 새 행사 추가

1. `events/<행사ID>/` 폴더를 만듭니다. 행사ID는 영문 소문자·숫자·하이픈만 씁니다 (예: `2027-01-hyundai-pangyo`).
2. 그 폴더에 상세 페이지 `index.html`, `images/`, 엑셀을 넣습니다.
3. `events.json`에 항목을 하나 추가합니다. 상태(진행 중·예정·종료)와 D-day는 `start`·`end` 날짜로 자동 계산됩니다.

```json
{
  "slug": "2027-01-hyundai-pangyo",
  "title": "행사명",
  "store": "점포명",
  "place": "층·위치",
  "start": "2027-01-10",
  "end": "2027-01-19",
  "type": "행사 형태",
  "apparel": { "styles": 0, "qty": 0, "tag": 0, "sale": 0 },
  "golf": { "models": 0, "qty": 0, "tag": 0, "sale": 0 },
  "target": 0,
  "excel": "엑셀파일명.xlsx",
  "cover": "images/대표이미지.jpg",
  "updated": "2027-01-02"
}
```

`apparel`·`golf` 중 없는 항목은 빼도 됩니다.

## Railway

- 저장소 `yuyumiso77-ops/sales-plan`, Root Directory는 비워 둡니다.
- Variables: `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` (없으면 페이지가 열리지 않음, 503)
- `main`에 push하면 자동으로 다시 배포됩니다.
- 사진 첨부 기능은 claude.ai 페이지에서만 동작합니다. Railway 페이지는 저장소의 사진 파일을 보여줍니다.
