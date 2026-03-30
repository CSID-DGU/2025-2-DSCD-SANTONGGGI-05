# 현재 해결해야 할 이슈 목록

> 마지막 업데이트: 2026-03-26
> 대상 프로젝트: AI Shopping Assistant (capstoneProject)

---

## 1. [Critical] 이벤트 루프 블로킹

**파일**: `backend/app/api/chat.py:41`, `backend/app/ai/openai_client.py:69`

**문제**:
`send_chat_message()`가 `async def`로 선언되어 있어 FastAPI 이벤트 루프에서 직접 실행된다.
그런데 내부에서 호출하는 `OpenAI().responses.create()`는 **동기(synchronous) 호출**이다.
이로 인해 OpenAI 응답을 기다리는 동안(최대 300초) **이벤트 루프 전체가 블로킹**되어, 다른 모든 사용자의 요청이 대기 상태에 빠진다.

```
User A 요청 → OpenAI 호출 (300초 대기) → 이 동안 User B, C, D 전부 대기
```

**영향 범위**: 동시 접속 사용자 전체

**해결 방안 (택 1)**:

| 방안 | 변경 내용 | 장점 | 단점 |
|------|-----------|------|------|
| A. `def`로 변경 | `async def` → `def` | 최소 변경, FastAPI가 자동으로 threadpool 실행 | 스레드 수 제한(기본 40개) |
| B. `AsyncOpenAI` 사용 | `OpenAI` → `AsyncOpenAI`, `await` 추가 | 비동기 네이티브, 높은 동시성 | 변경 범위 큼 (openai_client.py, orchestrator.py 등) |

---

## 2. [Critical] OpenAI 대화 컨텍스트 없음 (멀티턴 미지원)

**파일**: `backend/app/ai/openai_client.py`, `backend/app/services/chat_service.py`

**문제**:
매 OpenAI 호출이 완전히 독립적이다. DB에 채팅 이력(`ChatMessage`)을 저장하고 있지만, OpenAI API 호출 시 **이전 대화 내용을 전혀 전달하지 않는다**.

```python
# chat_service.py - 현재 메시지만 전달, 이전 대화 없음
ai_result = self._ai_orchestrator.generate(
    user_id=request.user_id,
    message=request.message,  # ← 현재 메시지만
)
```

**결과**:
- AI가 이전 대화를 기억하지 못함
- "아까 추천해준 거 말고 다른 거" 같은 맥락 의존 질문에 응답 불가
- 사용자 경험 저하

**해결 방안 (택 1)**:

| 방안 | 설명 |
|------|------|
| A. DB 이력 포함 | `ChatMessage` 테이블에서 최근 N개 메시지를 조회하여 OpenAI `input`에 대화 이력으로 포함 |
| B. `previous_response_id` 활용 | OpenAI Responses API의 `previous_response_id` 파라미터로 서버 측 대화 연결 (응답 ID를 DB에 저장 필요) |

---

## 3. [High] 보안: 비밀번호 평문 저장

**파일**: `backend/app/services/auth_service.py`

**문제**:
사용자 비밀번호가 **해싱 없이 평문으로** DB에 저장되고, 로그인 시에도 평문 비교를 수행한다.

```python
# 회원가입 시
new_user = User(username=username, password=password)  # 평문 저장

# 로그인 시
if user.password != password:  # 평문 비교
```

**영향**: DB 유출 시 전체 사용자 비밀번호 노출

**해결 방안**: `bcrypt` 또는 `passlib` 라이브러리로 해싱 적용

---

## 4. [High] 보안: JWT/세션 인증 없음

**파일**: `backend/app/api/chat.py`, `backend/app/api/auth.py`

**문제**:
API 요청에 인증 토큰 검증이 없다. 프론트엔드에서 `user_id`를 직접 전송하며, 서버는 이를 검증 없이 신뢰한다.

```python
# 누구나 user_id=1로 요청하면 해당 사용자의 데이터에 접근 가능
payload = SendChatMessageRequest(user_id=1, message="...")
```

**영향**: 사용자 간 데이터 접근 가능 (인증 우회)

**해결 방안**: JWT 토큰 발급/검증 미들웨어 추가, `Depends(get_current_user)` 패턴 적용

---

## 5. [High] MCP 서버 인증 없이 공개 노출

**파일**: `nginx/nginx.conf`, `docker-compose.yml`

**문제**:
MCP 서버 3개(`/mcp-recommend/`, `/mcp-shopping/`, `/mcp-statistics/`)가 nginx를 통해 공개 URL로 노출되어 있다. OpenAI가 직접 접근해야 하므로 공개가 필요하지만, **아무나 접근 가능**한 상태이다.

```nginx
location /mcp-recommend/ {
    proxy_pass http://mcp-recommend:8001/;  # 인증 없음
}
```

**영향**: 외부에서 MCP 도구를 직접 호출하여 DB 데이터 조회 가능

**해결 방안**: API Key 기반 인증 또는 IP 화이트리스트(OpenAI IP 대역만 허용)

---

## 6. [Medium] 요청마다 새 OpenAI 클라이언트 인스턴스 생성

**파일**: `backend/app/api/chat.py:19`, `backend/app/ai/orchestrator.py:60`

**문제**:
`get_chat_service()`가 요청마다 `ChatService()` → `AiOrchestrator()` → `OpenAIChatClient()` → `OpenAI()`를 새로 생성한다. `OpenAI()` 생성 시 `httpx` 커넥션 풀이 매번 초기화된다.

```python
def get_chat_service() -> ChatService:
    return ChatService()  # 매 요청마다 새 인스턴스
```

**영향**: 불필요한 오버헤드, TCP 연결 재생성 비용

**해결 방안**: `OpenAIChatClient`를 싱글턴으로 관리하거나, FastAPI `lifespan`에서 한 번만 생성

---

## 7. [Medium] CORS 설정이 localhost로 고정

**파일**: `backend/app/main.py`

**문제**:
```python
allow_origins=["http://localhost:5173"]
```
프로덕션 도메인(`https://shopping-assistant.mina-na.dev`)이 CORS 허용 목록에 없다.
현재 nginx에서 프론트엔드를 서빙하므로 같은 도메인이라 문제가 없지만, 프론트/백 분리 배포 시 이슈 발생.

**해결 방안**: 환경변수로 `CORS_ORIGINS` 관리

---

## 8. [Medium] 추천 알고리즘 전체 데이터 인메모리 로딩

**파일**: `backend/app/mcp_servers/recommendation_server.py`

**문제**:
`recommend_products_final_v4` 함수가 호출될 때마다 해당 사용자의 **전체 구매 이력**을 메모리에 로드하고, 코사인 유사도 계산을 수행한다.

```python
purchases = db.query(PurchaseHistory).filter(
    PurchaseHistory.user_id == user_id
).all()  # 전체 로드
```

**영향**: 구매 이력이 많아지면 메모리 사용량과 응답 시간 증가

**해결 방안**: 최근 N건만 조회, 또는 사전 계산된 임베딩/집계 테이블 활용

---

## 9. [Low] 프론트엔드 일부 API 서비스에서 mock 데이터 반환

**파일**: `frontend/src/services/api/` 내 일부 파일

**문제**:
프론트엔드 API 서비스 중 일부가 실제 백엔드 호출 대신 **하드코딩된 mock 데이터**를 반환하고 있다.

**영향**: 해당 기능이 실제 데이터와 연동되지 않음

**해결 방안**: 백엔드 API 연동으로 교체

---

## 우선순위 요약

| 순위 | 이슈 | 심각도 | 난이도 |
|------|------|--------|--------|
| 1 | 이벤트 루프 블로킹 | Critical | 낮음~중간 |
| 2 | 대화 컨텍스트 미지원 | Critical | 중간 |
| 3 | 비밀번호 평문 저장 | High | 낮음 |
| 4 | JWT 인증 없음 | High | 중간 |
| 5 | MCP 서버 무인증 노출 | High | 중간 |
| 6 | OpenAI 클라이언트 재생성 | Medium | 낮음 |
| 7 | CORS 하드코딩 | Medium | 낮음 |
| 8 | 추천 인메모리 로딩 | Medium | 중간 |
| 9 | 프론트엔드 mock 데이터 | Low | 낮음 |

---

## 권장 작업 순서

1. **이벤트 루프 블로킹 해결** — 동시 접속 시 서비스 마비 방지 (가장 시급)
2. **대화 컨텍스트 추가** — 사용자 경험의 핵심 기능
3. **OpenAI 클라이언트 싱글턴화** — 1번과 함께 진행하면 효율적
4. **보안 이슈 일괄 처리** (비밀번호 해싱 + JWT + MCP 인증)
5. **나머지 이슈** — CORS, 추천 최적화, mock 데이터 교체
