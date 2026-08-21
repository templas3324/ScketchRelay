<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Scketch Relay 작업 규칙

## 작업 시작 전

- 소스 코드나 설정 파일을 수정하기 전에 이 `AGENTS.md` 전체를 다시 읽고 적용한다.
- Next.js 코드를 수정하기 전에는 위 규칙에 따라 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.
- `docs/PROJECT_PLAN.md`에서 현재 단계와 완료 기준을 확인한다.
- 실행 환경, 서버 구성 또는 환경 변수를 다룰 때는 `docs/ENVIRONMENT.md`와 `docs/SUPABASE_SETUP.md`를 확인한다.

## 주석 작성

- 함수, 복잡한 로직, 권한 검사, 보안 경계, 실시간 동기화, 상태 전환처럼 코드만으로 의도나 이유를 파악하기 어려운 부분에는 간결한 주석을 작성한다.
- 주석은 코드가 무엇을 하는지 그대로 반복하지 말고, 왜 이 방식이 필요한지와 지켜야 할 조건을 설명한다.
- 공개 함수의 이름과 타입만으로 계약이 충분히 드러나지 않으면 입력값, 반환값, 부작용 또는 실패 조건을 주석으로 남긴다.
- 임시 우회 처리나 후속 작업이 필요하면 이유와 제거 조건을 함께 기록한다. 담당자나 기한이 없는 모호한 `TODO`는 추가하지 않는다.
- 자명한 변수 할당, 단순 JSX, 짧은 검증 조건에는 불필요한 주석을 달지 않는다.
- 코드가 변경되어 더 이상 맞지 않는 주석은 같은 작업에서 수정하거나 삭제한다.

## 구현 원칙

- 브라우저가 Supabase 테이블을 직접 읽거나 변경하지 않도록 하고, 데이터 작업은 Next.js Route Handler에서 참가 권한을 검증한 뒤 수행한다.
- `SUPABASE_SERVICE_ROLE_KEY`와 참가 세션 토큰 등 비밀값을 소스, 로그, 문서, 테스트 출력 또는 Git에 노출하지 않는다.
- 예상 가능한 사용자 오류는 명시적인 반환값과 한국어 안내 메시지로 처리하고, 예상하지 못한 오류만 오류 경계와 서버 로그로 전달한다.
- DB 스키마를 변경할 때는 기존에 원격 적용된 migration을 다시 쓰지 않고 `supabase/migrations/`에 새로운 migration을 추가한다.
- 기능 상태와 범위가 바뀌면 같은 작업에서 관련 Markdown 문서와 체크리스트도 갱신한다.
- 사용자와 화면에 노출되는 문구는 개발 메모가 아닌 실제 서비스 안내 문구로 작성한다.

## 검증과 Git

- 소스 수정 후 작업 범위에 맞는 테스트를 추가하거나 갱신한다.
- 완료 전 `npm run lint`, `npm test`, `npm run build`를 순서대로 실행한다.
- Supabase 기능은 가능하면 서로 다른 두 참가 세션으로 실제 통합 흐름을 확인하고 생성한 테스트 데이터는 삭제한다.
- `.env.local`, IDE 설정, 임시 파일, 인증 정보가 스테이징되지 않았는지 커밋 전에 확인한다.
- 사용자가 요청하지 않은 기존 변경사항을 되돌리거나 덮어쓰지 않는다.

## 커밋 메시지

- 커밋 제목과 본문은 한글로 작성한다. 라이브러리명, 명령어, 파일명처럼 고유한 기술 용어만 원문 표기를 허용한다.
- 제목은 `<종류>: <변경 요약>` 형식으로 작성한다. 종류는 `기능`, `수정`, `문서`, `테스트`, `리팩터링`, `설정`, `성능`, `빌드` 중에서 선택한다.
- 제목 아래에 빈 줄을 한 줄 넣고, 본문은 `- ...` 형식의 항목으로 작성한다.
- 본문에는 주요 변경 내용, 중요한 구현 이유, 검증 결과를 구체적으로 기록한다.
- 관련 없는 변경을 한 커밋에 섞지 않고 논리적인 작업 단위로 나눈다.
- 제목만으로 충분한 아주 작은 변경이 아니라면 본문 항목을 최소 두 개 작성한다.
- 커밋 형식은 다음 예시를 따른다.

```text
기능: 대기실 실시간 채팅 추가

- 방 참가자만 메시지를 전송할 수 있도록 서버에서 참가 쿠키 검증
- 게임 시작 후 채팅 입력과 API 전송 차단
- 단위 테스트 6개와 production build 통과
```
