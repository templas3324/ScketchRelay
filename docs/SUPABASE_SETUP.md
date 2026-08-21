# Supabase 연결 방법

2단계 온라인 방과 대기실은 Supabase PostgreSQL과 Realtime을 사용한다.

## 1. 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 만든다.
2. 프로젝트 리전은 주요 사용자와 가까운 곳을 선택한다.
3. 프로젝트 준비가 끝나면 Connect 화면을 연다.

## 2. 데이터베이스 설정

Supabase SQL Editor에서 다음 파일의 내용을 전체 실행한다.

`supabase/migrations/202608210001_create_rooms.sql`

이 마이그레이션은 다음 항목을 생성한다.

- `rooms`, `players` 테이블
- 방 정원, 게임 시작 여부, 중복 닉네임 검사
- 방과 참가자 변경을 Realtime 채널에 알리는 트리거
- 브라우저의 직접 테이블 접근을 차단하는 RLS 설정

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 Connect 및 API Keys 화면의 값을 입력한다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

주의 사항:

- `SUPABASE_SERVICE_ROLE_KEY`는 브라우저 코드나 Git에 절대 노출하지 않는다.
- `.env.local`은 이미 Git 추적에서 제외되어 있다.
- 예시 키가 들어 있는 `.env.example`만 커밋한다.

## 4. 로컬 확인

```bash
npm run dev
```

1. 첫 번째 브라우저에서 닉네임을 입력하고 방을 만든다.
2. 초대 링크를 복사해 시크릿 창 또는 다른 브라우저에서 연다.
3. 다른 닉네임으로 참가한다.
4. 두 화면의 참가자 목록과 온라인 상태가 함께 바뀌는지 확인한다.
5. 방장 화면에서 게임 시작 버튼이 활성화되는지 확인한다.
6. 참가자가 나갔을 때 목록에서 제거되는지 확인한다.

## 5. 오류 확인 항목

- 존재하지 않는 방 코드
- 같은 방에서 중복된 닉네임
- 8명이 모두 참가한 방
- 이미 시작한 방 참가
- 참가자가 한 명뿐일 때 게임 시작
- 일반 참가자의 게임 시작 요청
