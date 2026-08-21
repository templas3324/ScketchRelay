# Scketch Relay 실행 환경과 서버 구성

## 1. 기술 구성

| 영역 | 사용 기술 | 역할 |
| --- | --- | --- |
| 프론트엔드 | Next.js 16, React 19, TypeScript | 화면 렌더링과 사용자 입력 처리 |
| 애플리케이션 서버 | Next.js Route Handler | 방 생성·참가·조회·시작 API와 권한 검증 |
| 데이터베이스 | Supabase PostgreSQL | 방, 참가자, 채팅, 게임 데이터 저장 |
| 실시간 통신 | Supabase Realtime | 참가자·방·채팅 변경 알림, 접속 상태 공유 |
| 스타일 | Tailwind CSS 4 | 반응형 UI 스타일 |
| 테스트 | Node.js 내장 테스트 러너 | 입력 검증 등 순수 함수 단위 테스트 |

## 2. 전체 요청 흐름

```text
사용자 브라우저
  │
  ├─ Next.js 페이지 요청
  │    └─ 화면 렌더링
  │
  ├─ Next.js /api/rooms 요청
  │    ├─ 입력값 검증
  │    ├─ HttpOnly 참가 쿠키 검증
  │    └─ Supabase 데이터 조회·변경
  │
  └─ Supabase Realtime 연결
       └─ 방, 참가자, 채팅, 게임 제출 변경 신호 수신

Supabase PostgreSQL
  └─ rooms, players, chat_messages, games, relays, submissions 저장
```

브라우저는 데이터베이스를 직접 읽거나 변경하지 않는다. 중요한 데이터 작업은 Next.js 서버 API를 통하고, Realtime은 변경 사실을 알려주는 용도로 사용한다.

## 3. WAS와 Tomcat이 필요 없는 이유

현재 프로젝트에는 별도의 Tomcat 서버가 필요하지 않다.

- Tomcat은 주로 Java Servlet이나 Spring 기반 웹 애플리케이션을 실행하는 WAS다.
- 이 프로젝트는 Java가 아닌 Node.js 기반 Next.js 애플리케이션이다.
- Next.js 서버가 페이지 렌더링과 API 실행을 모두 담당한다.
- Supabase가 PostgreSQL 데이터베이스와 실시간 통신을 담당한다.

따라서 현재 서버 구성은 `Next.js + Supabase`로 충분하다.

Tomcat이 필요해지는 경우는 백엔드를 Spring Boot 또는 Java 기반 서비스로 별도 개발하도록 아키텍처를 변경할 때다. 그 경우에도 Spring Boot 내장 Tomcat을 사용할 수 있으므로 외부 Tomcat 설치가 반드시 필요한 것은 아니다.

## 4. 로컬 개발 환경

### 필수 프로그램

- Node.js 22 이상 권장
- npm
- Git
- 최신 Chrome, Edge 또는 Firefox

### 최초 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

기본 접속 주소:

```text
http://localhost:3000
```

포트 3000이 이미 사용 중이면 Next.js가 3001과 같은 다른 포트를 안내할 수 있다.

### 2명 테스트

1. 일반 브라우저 창에서 닉네임을 입력하고 방을 만든다.
2. 대기실에서 초대 링크를 복사한다.
3. 시크릿 창 또는 다른 브라우저에서 초대 링크를 연다.
4. 다른 닉네임으로 참가한다.
5. 두 창에서 참가자 목록, 온라인 상태와 방장 표시를 확인한다.
6. 방장 창에서 게임 시작 버튼을 확인한다.
7. 방장 창에서 인원, 라운드 시간, 공개 방식을 저장한다.
8. 게임을 시작하고 두 창에서 서로 다른 첫 문장을 제출한다.
9. 두 창 모두 제출 현황이 `2 / 2명`으로 표시되는지 확인한다.

서로 다른 브라우저 저장 공간과 쿠키를 사용해야 두 명의 사용자로 인식되므로 일반 탭 두 개보다 시크릿 창이나 다른 브라우저 사용을 권장한다.

## 5. 환경 변수

로컬 비밀 설정은 프로젝트 루트의 `.env.local`에 저장한다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 공개 범위

- `NEXT_PUBLIC_SUPABASE_URL`: 브라우저에 공개 가능
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 브라우저에 공개 가능한 제한 키
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 비밀 키

`SUPABASE_SERVICE_ROLE_KEY`에는 절대로 `NEXT_PUBLIC_` 접두사를 붙이면 안 된다. `.env.local`은 Git에서 제외되며 GitHub에 커밋하지 않는다.

새 개발 환경을 구성할 때는 `.env.example`을 참고하고 실제 값은 Supabase Dashboard에서 가져온다. 자세한 절차는 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참고한다.

## 6. 개발 및 검증 명령

```bash
# 개발 서버
npm run dev

# 코드 규칙 검사
npm run lint

# 단위 테스트
npm test

# 운영 빌드 검사
npm run build

# 빌드된 운영 서버 실행
npm run start
```

기능 작업을 완료할 때는 최소한 lint, test, build를 모두 통과시킨다.

## 7. 데이터베이스 변경

DB 구조는 `supabase/migrations` 폴더의 SQL 파일로 관리한다.

원격 Supabase 프로젝트에 새 마이그레이션을 적용할 때 사용한다.

```bash
npx supabase db push
```

이미 적용된 마이그레이션 파일을 수정하는 대신 새로운 번호의 마이그레이션을 추가하는 것을 원칙으로 한다.

## 8. 운영 배포 구성

권장 MVP 운영 구성:

```text
사용자
  ↓ HTTPS
Vercel의 Next.js 애플리케이션
  ↓ HTTPS / WebSocket
Supabase PostgreSQL + Realtime
```

Vercel에 배포할 때 `.env.local` 파일을 올리지 않고 프로젝트 설정의 Environment Variables에 동일한 세 값을 등록한다.

직접 서버를 운영할 경우에는 Node.js로 `npm run start`를 실행한다. 도메인, HTTPS, 프로세스 재시작이 필요하면 Nginx와 PM2 또는 컨테이너를 추가할 수 있지만 MVP 단계에서는 필수가 아니다.

## 9. 보안 원칙

- Service Role Key는 서버 코드에서만 사용한다.
- 브라우저는 Supabase 테이블을 직접 조회하지 않는다.
- 참가자 인증 토큰은 JavaScript에서 읽을 수 없는 HttpOnly 쿠키에 저장한다.
- DB 테이블에는 RLS를 활성화한다.
- 입력값과 방장 권한은 항상 서버에서 다시 검증한다.
- 실제 비밀 키와 `.env.local`은 GitHub, 로그, 문서에 기록하지 않는다.

### 웹 공격 방어

- React 텍스트 렌더링을 사용하고 사용자 입력을 HTML로 직접 삽입하지 않아 저장형 스크립트 실행을 막는다.
- CSP는 실행 가능한 스크립트와 Supabase 연결 출처를 제한하고 `object`, 외부 폼 전송, iframe 삽입을 차단한다.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` 보안 헤더를 모든 응답에 적용한다.
- JSON 요청은 `Content-Length`만 믿지 않고 실제 스트림 바이트를 세어 과대 요청을 `413`으로 차단한다.
- 닉네임·채팅·설정은 2~4KB, 그림 제출은 1.1MB 요청 상한을 사용한다.
- 제출 내용의 종류·길이·PNG 헤더는 Route Handler와 PostgreSQL 제약 조건에서 이중 검증한다.

현재 Next.js 정적 렌더링을 유지하기 위해 CSP의 프레임워크 인라인 스크립트는 허용한다. 결제나 개인정보처럼 보안 민감도가 높아지면 요청별 nonce 기반 CSP와 전체 동적 렌더링 전환을 검토한다.

## 10. 채팅 운영 원칙

- 채팅은 방에 참가한 사용자만 읽고 전송할 수 있다.
- 대기실 상태가 `waiting`일 때만 새 메시지를 전송할 수 있다.
- 방장이 게임을 시작해 상태가 `playing`으로 바뀌면 모든 참가자의 채팅 입력을 잠근다.
- 메시지는 공백을 제외하고 1~200자로 제한한다.
- 짧은 시간에 반복 전송하는 요청은 서버에서 차단한다.
- 채팅 변경은 Supabase Realtime으로 알리고 실제 메시지 조회는 Next.js 서버 API를 통한다.
- 방이 삭제되면 해당 방의 채팅 기록도 함께 삭제한다.

## 11. 현재 환경 정보

- Supabase 프로젝트 ID: `hjkcqlmfzpuoatgjurhp`
- Supabase 리전: 서울 `ap-northeast-2`
- Git 기본 브랜치: `main`
- 운영 배포: 아직 미설정
- 별도 Tomcat/WAS: 사용하지 않음

## 12. 게임 진행 데이터와 API

- `games`: 방별 현재 단계, 라운드, 전체 라운드 수와 서버 기준 마감 시각을 저장한다.
- `relays`: 게임 시작 시 참가자마다 생성되는 릴레이 묶음이다.
- `submissions`: 라운드별 문장 또는 그림과 작성자를 저장한다.
- `PATCH /api/rooms/[code]/settings`: 대기 중인 방의 방장만 게임 설정을 변경한다.
- `POST /api/rooms/[code]/start`: 참가자를 기준으로 게임과 릴레이를 생성하고 방을 `playing`으로 전환한다.
- `GET /api/rooms/[code]/game`: 참가자의 현재 게임과 제출 현황을 복구한다.
- `POST /api/rooms/[code]/game/submissions`: 참가 쿠키, 게임 단계, 마감 시각과 중복 여부를 검증한 뒤 첫 문장을 저장한다.

브라우저는 Realtime 변경 신호를 받으면 게임 API를 다시 호출한다. 제출 내용 자체를 Realtime payload로 보내지 않으므로 다른 참가자의 문장이 다음 라운드 전에 노출되지 않는다.

### 그림 데이터

- 그림판의 내부 해상도는 `800 × 500`이며 화면 너비에 맞춰 반응형으로 표시한다.
- 마우스와 터치의 좌표를 내부 해상도로 환산해 기기 크기가 달라도 같은 비율로 그린다.
- MVP에서는 그림을 PNG Data URL로 `submissions.content`에 저장한다.
- 서버는 PNG 헤더와 최대 1MB 크기를 검증한다.
- 이미지가 많아지는 운영 단계에서는 Supabase Storage 저장 후 경로만 DB에 기록하는 방식으로 전환한다.

### 릴레이 배정과 라운드 전환

참가 순서를 기준으로 라운드마다 릴레이를 한 칸씩 순환한다. 게임 API는 현재 참가자에게 배정된 직전 제출물 하나만 반환한다. 모든 참가자의 제출은 DB 트리거에서 집계하므로 마지막 제출 요청이 동시에 발생해도 라운드 전환은 잠긴 게임 행을 기준으로 한 번만 처리된다.

라운드 제한 시간이 지나면 다음 게임 API 조회가 DB의 만료 처리 함수를 호출한다. 미제출 문장은 안내 문장으로, 미제출 그림은 빈 PNG로 채운 뒤 다음 라운드로 전환한다. 별도 스케줄러가 없어도 열린 게임 화면이 10초마다 서버 상태를 확인하므로 게임이 멈추지 않는다. Realtime 변경 신호를 놓치거나 잠시 연결이 끊겨도 이 동기화와 HttpOnly 참가 쿠키를 이용해 현재 라운드와 제출 상태를 복구한다.

### 결과 공개

- `GET /api/rooms/[code]/results`: 게임을 완료한 방의 참가자에게 현재 공개된 릴레이만 반환한다.
- `POST /api/rooms/[code]/results/reveal`: 방장 진행 방식에서 방장만 다음 릴레이를 공개한다.
- 방장 진행 방식의 공개 개수는 `games.revealed_count`에 저장한다.
- 자동 공개 방식은 마지막 제출과 동시에 방을 `finished`로 바꾸고 전체 릴레이를 공개한다.
- 방장 공개 함수는 방과 게임 행을 잠근 뒤 공개 개수를 변경해 중복 요청에도 순서를 유지한다.
- 게임 화면과 결과 화면은 같은 Realtime 방 채널을 사용하므로 모든 참가자가 같은 공개 상태를 확인한다.
