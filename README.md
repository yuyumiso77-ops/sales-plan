# 풋조이 롯데백화점 잠실점 12월 팝업 행사

기간 2026.12.11(금) ~ 12.20(일) · 잠실점 6층 팝업매장

## 파일

| 파일 | 내용 |
|---|---|
| `footjoy-jamsil-popup.html` | 행사 웹페이지 (행사계획 · 물량계획 · 요약 · 골프화 · 회신 메일) |
| `롯데잠실_12월행사_물량계획.xlsx` | 행사계획서, 의류·골프화 물량계획, 대표상품 이미지 정리 |
| `images/` | 메인컷·LMS컷 |
| `images/products/` | 대표상품 사진 (`품번_컬러_800x800.jpg`, 골프화 `GOLF_모델_색상_800x800.jpg`) |
| `server.js`, `package.json` | Railway 배포용 비밀번호 보호 서버 (외부 패키지 없음) |

## Railway 배포

1. Railway → New Project → Deploy from GitHub repo → `yuyumiso77-ops/sales-plan`
2. 서비스 Variables에 추가
   - `BASIC_AUTH_USER`: 접속 아이디
   - `BASIC_AUTH_PASSWORD`: 접속 비밀번호
3. Settings → Networking → **Generate Domain**

- Root Directory는 비워 둡니다(저장소 맨 위가 앱 위치).
- 비밀번호 변수가 없으면 페이지가 열리지 않습니다(503).
- 사진 첨부 기능은 claude.ai 페이지에서만 동작합니다. Railway에서는 보기 전용입니다.
- `main`에 push하면 Railway가 자동으로 다시 배포합니다.
