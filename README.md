# Whisky Collection

보유한 위스키와 구매 정보를 기록하고 조회하는 개인용 정적 웹사이트입니다. 별도의 서버나 데이터베이스가 없으며, 화면에서 데이터를 수정하지 않습니다.

## 데이터 관리

모든 병 기록은 [`data/whiskies.json`](data/whiskies.json) 배열에 저장합니다. 위스키를 추가하거나 수정할 때 이 파일만 변경하면 화면, 통계, 검색, 필터에 자동으로 반영됩니다. 이미지는 `images/`에 넣고 JSON의 `whisky.image`에 `/images/파일명` 형태로 기록합니다. 파일이 없거나 경로가 잘못되면 기본 placeholder가 표시됩니다.

## 로컬에서 보기

빌드나 패키지 설치는 필요하지 않습니다. 브라우저의 보안 정책상 JSON을 불러오려면 저장소 루트에서 간단한 정적 HTTP 서버만 실행하세요.

```sh
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. Python이 없다면 편집기의 정적 서버 기능 등 원하는 HTTP 서버를 사용해도 됩니다.

## GitHub Pages 배포

저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다. 이후 `main` 브랜치에 변경사항이 반영되면 `.github/workflows/pages.yml`이 저장소 루트의 정적 파일을 빌드 없이 그대로 배포합니다.

CSS, JavaScript, JSON, 이미지 경로는 GitHub Pages의 `/<repository>/` 하위 경로에서도 동작하도록 상대 경로로 해석됩니다.

## 구조

```text
index.html              화면 구조
styles.css              다크 테마와 반응형 스타일
app.js                  데이터 로딩, 검색, 필터, 정렬, 통계, 상세 보기
data/whiskies.json      컬렉션 데이터의 단일 원본
images/                 위스키 이미지
.github/workflows/      GitHub Pages 자동 배포
AGENTS.md               Codex 작업 규칙
```
