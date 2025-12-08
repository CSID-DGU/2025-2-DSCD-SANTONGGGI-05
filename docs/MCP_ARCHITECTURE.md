# MCP (Model Context Protocol) 아키텍처

이 문서는 쇼핑 비서 서비스의 MCP 서버 아키텍처와 OpenAI API 통합 구조를 설명합니다.

---

## 목차

- [MCP 개요](#mcp-개요)
- [아키텍처 구조](#아키텍처-구조)
- [MCP 서버 구성](#mcp-서버-구성)
- [통신 프로토콜](#통신-프로토콜)
- [데이터 흐름](#데이터-흐름)
- [오케스트레이터 패턴](#오케스트레이터-패턴)
- [알려진 이슈 및 해결책](#알려진-이슈-및-해결책)
- [배포 및 운영](#배포-및-운영)

---

## MCP 개요

### MCP란?

**Model Context Protocol (MCP)**은 OpenAI API가 외부 도구(tools)와 상호작용할 수 있게 하는 프로토콜입니다. MCP 서버는 특정 기능을 수행하는 독립적인 서비스로, OpenAI 모델이 필요에 따라 호출할 수 있습니다.

### 우리 프로젝트에서의 역할

쇼핑 비서 서비스는 3개의 MCP 서버를 통해 다음 기능을 제공합니다:

1. **Recommendation MCP** - 구매 기반 상품 추천
2. **Shopping Search MCP** - 다중 플랫폼 상품 검색
3. **Statistics MCP** - 구매 통계 분석

---

## 아키텍처 구조

### 전체 시스템 구조

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                           │
│                      (React 19)                           │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
                         ↓
┌────────────────────────────────────────────────────────────┐
│                        Nginx                                │
│              (Reverse Proxy + SSL)                          │
└─────┬──────────┬──────────┬──────────┬──────────┬──────────┘
      │          │          │          │          │
      │          │          │          │          │
      ↓          ↓          ↓          ↓          ↓
┌──────────┐ ┌────────────────────────────────┐ ┌──────────┐
│ Frontend │ │     Backend FastAPI            │ │MCP Server│
│  Static  │ │    (Orchestrator + API)        │ │ Cluster  │
│  Files   │ └────────────┬───────────────────┘ └──────────┘
└──────────┘              │                           │
                          │                           │
                          ↓                           ↓
              ┌───────────────────────┐   ┌──────────────────┐
              │    PostgreSQL         │   │   MCP Servers    │
              │     Database          │   │  (Port 8001-8003)│
              └───────────────────────┘   └──────────────────┘
                          ↑                           ↓
                          │              ┌────────────────────┐
                          └──────────────│   OpenAI API       │
                                         │ (GPT-5/GPT-3.5)    │
                                         └────────────────────┘
```

### MCP 통신 흐름

```
1. 사용자 요청
   Frontend → Backend API

2. 의도 분석
   Backend → OpenAI API (Tool Intent Classification)
   ← 적절한 MCP 서버 선택

3. MCP 도구 실행
   Backend → MCP Server (via HTTPS)
   MCP Server → Database (데이터 조회)
   MCP Server → Backend (결과 반환)

4. AI 응답 생성
   Backend → OpenAI API (MCP 도구 결과 포함)
   ← AI 생성 응답

5. 최종 응답
   Backend → Frontend
```

---

## MCP 서버 구성

### 1. Recommendation MCP Server

**목적**: 사용자 구매 이력 기반 상품 추천

**Port**: 8001
**URL**: `https://csid-shopping.duckdns.org/mcp-recommend/mcp`

#### 제공 도구

##### `get_purchase_recommendations`
사용자의 과거 구매 이력을 분석하여 맞춤 상품 추천

**Parameters:**
```python
{
    "user_id": int,      # 유저 ID
    "limit": int = 5     # 추천 상품 수 (기본값: 5)
}
```

**Returns:**
```python
{
    "recommendations": [
        {
            "id": int,
            "name": str,
            "price": int,
            "original_price": int,      # 할인 전 가격
            "savings_rate": float,      # 절약률 (%)
            "platform_name": str,
            "category": str,
            "url": str,
            "image": str,
            "rating": float,
            "review_count": int
        }
    ]
}
```

**알고리즘:**
1. 사용자 구매 이력에서 카테고리 추출
2. 동일 카테고리의 다른 플랫폼 상품 검색
3. 가격 비교 및 절약률 계산
4. 평점 및 리뷰 수 기준 정렬

#### 구현 파일
- `backend/app/mcp_servers/recommendation_server.py`
- `backend/app/services/recommendation_service.py`

---

### 2. Shopping Search MCP Server

**목적**: 다중 플랫폼 상품 검색 및 가격 비교

**Port**: 8002
**URL**: `https://csid-shopping.duckdns.org/mcp-shopping/mcp`

#### 제공 도구

##### `search_products`
여러 쇼핑 플랫폼에서 상품 검색

**Parameters:**
```python
{
    "query": str,                    # 검색 키워드
    "platforms": list[str] = None,   # 검색할 플랫폼 목록
    "limit": int = 10                # 결과 수 제한
}
```

**Returns:**
```python
{
    "products": [
        {
            "id": int,
            "name": str,
            "price": int,
            "platform_name": str,
            "category": str,
            "url": str,
            "image": str,
            "rating": float,
            "review_count": int
        }
    ],
    "total_count": int
}
```

**검색 전략:**
1. 키워드 정규화 (띄어쓰기, 특수문자 제거)
2. 플랫폼별 병렬 검색
3. 중복 상품 필터링 (유사도 기반)
4. 가격순 정렬

#### 구현 파일
- `backend/app/mcp_servers/shopping_server.py`

---

### 3. Statistics MCP Server

**목적**: 구매 통계 분석 및 AI 인사이트 제공

**Port**: 8003
**URL**: `https://csid-shopping.duckdns.org/mcp-statistics/mcp`

#### 제공 도구

##### `get_purchase_statistics`
사용자 구매 패턴 분석

**Parameters:**
```python
{
    "user_id": int,
    "period": str = "7days"  # "7days" | "30days" | "90days"
}
```

**Returns:**
```python
{
    "total_spending": int,
    "total_orders": int,
    "average_order_value": int,
    "most_purchased_category": str,
    "platform_breakdown": [
        {
            "platform_name": str,
            "order_count": int,
            "total_spent": int,
            "percentage": float
        }
    ],
    "category_breakdown": [
        {
            "category": str,
            "count": int,
            "total_spent": int
        }
    ],
    "spending_trend": [
        {
            "date": str,
            "amount": int
        }
    ]
}
```

##### `analyze_spending_patterns`
AI 기반 지출 패턴 분석 및 조언

**Parameters:**
```python
{
    "user_id": int,
    "analysis_type": str = "comprehensive"  # "comprehensive" | "savings" | "habits"
}
```

**Returns:**
```python
{
    "analysis": str,           # AI 생성 분석 텍스트
    "insights": list[str],     # 주요 인사이트
    "recommendations": list[str],  # 절약 팁
    "risk_factors": list[str]  # 주의사항
}
```

#### 구현 파일
- `backend/app/mcp_servers/statistics_server.py`
- `backend/app/ai/statistics/analysis.py`

---

## 통신 프로토콜

### MCP over HTTPS

모든 MCP 서버는 FastMCP 라이브러리를 사용하여 HTTPS 통신을 지원합니다.

#### 요청 형식

```http
POST https://domain.com/mcp-server/mcp
Content-Type: application/json

{
  "method": "tool_name",
  "params": {
    "user_id": 123,
    "limit": 5
  }
}
```

#### 응답 형식

**성공 (200 OK)**
```json
{
  "result": {
    "recommendations": [...]
  }
}
```

**실패 (424 Failed Dependency)**
```json
{
  "error": {
    "code": 424,
    "message": "MCP server temporarily unavailable"
  }
}
```

### OpenAI API 통합

#### Tool Definition

MCP 서버의 각 도구는 OpenAI API에 다음과 같이 등록됩니다:

```python
{
    "type": "function",
    "function": {
        "name": "get_purchase_recommendations",
        "description": "사용자 구매 이력 기반 상품 추천",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "유저 ID"
                },
                "limit": {
                    "type": "integer",
                    "description": "추천 상품 수"
                }
            },
            "required": ["user_id"]
        }
    }
}
```

#### Tool Call Flow

```python
# 1. OpenAI API 호출 (도구 포함)
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[...],
    tools=[recommendation_tool, search_tool, statistics_tool]
)

# 2. Tool Call 감지
if response.choices[0].finish_reason == "tool_calls":
    tool_call = response.choices[0].message.tool_calls[0]

    # 3. MCP 서버 호출
    result = mcp_client.call_tool(
        url=MCP_PURCHASE_URL,
        method=tool_call.function.name,
        params=json.loads(tool_call.function.arguments)
    )

    # 4. 결과를 OpenAI에 전달
    final_response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            ...,
            tool_call_message,
            {"role": "tool", "content": json.dumps(result)}
        ]
    )
```

---

## 데이터 흐름

### 상품 추천 시나리오

```
1. 사용자: "나한테 맞는 상품 추천해줘"
   ↓
2. Frontend → Backend: POST /api/chat/messages
   ↓
3. Backend Orchestrator:
   - 의도 분석 (Tool Intent Classification)
   - 결과: "purchase_recommendation"
   ↓
4. Backend → OpenAI API:
   - Prompt: "사용자에게 맞춤 상품 추천"
   - Tools: [get_purchase_recommendations]
   ↓
5. OpenAI → Backend:
   - Tool Call: get_purchase_recommendations(user_id=123, limit=5)
   ↓
6. Backend → Recommendation MCP:
   - HTTPS POST request
   ↓
7. Recommendation MCP:
   - Database 조회 (구매 이력)
   - 추천 알고리즘 실행
   - 결과 반환
   ↓
8. Backend → OpenAI API:
   - Tool 결과 전달
   ↓
9. OpenAI → Backend:
   - AI 생성 응답 + 추천 상품 목록
   ↓
10. Backend → Frontend:
    - Response: {
        ai_message: "...",
        type: 1,
        recommendationItems: [...]
      }
```

### 통계 분석 시나리오

```
1. 사용자: "내 지출 패턴 분석해줘"
   ↓
2. Backend Orchestrator:
   - 의도 분석: "statistics_analysis"
   ↓
3. Backend → Statistics MCP:
   - get_purchase_statistics(user_id=123, period="30days")
   ↓
4. Statistics MCP → Database:
   - 구매 이력 조회
   - 집계 계산
   ↓
5. Backend → OpenAI API:
   - Prompt: "다음 통계를 바탕으로 분석..."
   - Context: 통계 데이터
   ↓
6. OpenAI → Backend:
   - AI 생성 분석 및 조언
   ↓
7. Backend → Frontend:
   - Response: {
        ai_message: "분석 결과...",
        type: 2
      }
```

---

## 오케스트레이터 패턴

### AiOrchestrator 구조

`backend/app/ai/orchestrator.py`는 모든 AI 관련 로직을 조정합니다.

#### 핵심 기능

1. **Tool Intent Classification**
   - 사용자 메시지 → 적절한 도구 선택
   - OpenAI API를 통한 의도 분석

2. **MCP Server Selection**
   - 의도에 따른 MCP 서버 라우팅
   - Fallback 메커니즘

3. **Error Handling**
   - MCP 서버 실패 시 대체 로직
   - 에러 로깅 및 모니터링

#### 의사결정 흐름

```python
def generate(user_id: int, message: str) -> AiOrchestratorResult:
    # 1. Tool Intent Classification
    intent = classify_tool_intent(message)

    # 2. MCP Server 호출
    if intent == "purchase_recommendation":
        try:
            return run_purchase_recommendation(user_id)
        except OpenAIErrorWrapper:
            # Fallback: 기본 추천 시스템
            return recommendation_service.generate_chat_recommendations()

    elif intent == "platform_search":
        try:
            return run_platform_search(message)
        except OpenAIErrorWrapper:
            # Fallback: 데이터베이스 검색
            return database_search(message)

    elif intent == "statistics_analysis":
        try:
            return run_statistics_analysis(message)
        except OpenAIErrorWrapper:
            # Fallback: 기본 통계
            return get_basic_statistics(user_id)

    # 3. Small Talk (기본 대화)
    else:
        return run_smalltalk(message)
```

### Fallback 전략

모든 MCP 호출은 실패 시 대체 로직을 갖추고 있습니다:

| MCP 서버 | Fallback 전략 |
|---------|--------------|
| Recommendation | 데이터베이스 직접 조회 기반 추천 |
| Shopping Search | PostgreSQL LIKE 검색 |
| Statistics | 기본 집계 쿼리 |

---

## 알려진 이슈 및 해결책

### 1. MCP 424 Failed Dependency

**증상:**
- OpenAI API가 MCP 서버 호출 시 간헐적 424 에러
- 특히 긴 처리 시간(>30초)이 필요한 경우 발생

**원인:**
- FastMCP 2.13.0과 OpenAI Responses API 호환성 문제
- GitHub Issue: [fastmcp#855](https://github.com/jlowin/fastmcp/issues/855)

**해결책:**
1. **Fallback 메커니즘**
   ```python
   try:
       return self._run_purchase_recommendation(user_id)
   except OpenAIErrorWrapper as exc:
       logger.warning("Purchase MCP failed: %s", exc)
       return self._recommendation_service.generate_chat_recommendations()
   ```

2. **타임아웃 증가**
   ```python
   OPENAI_REQUEST_TIMEOUT=180  # 180초로 증가
   ```

3. **HTTPS 필수**
   - OpenAI는 HTTPS 없이 MCP 서버 접근 불가
   - Let's Encrypt SSL 인증서 사용

**현재 상태:**
- 완전히 해결 불가 (upstream 이슈)
- Fallback으로 서비스 정상 작동 보장
- 에러 발생률: ~10-15%

### 2. HTTP 499 Client Closed Request

**증상:**
- 프론트엔드에서 499 에러 표시
- 백엔드는 정상 처리 완료

**원인:**
- 사용자가 응답 대기 중 페이지 이동/새로고침
- 중복 요청 전송

**해결:**
- 정상적인 동작 (클라이언트 측 취소)
- 프론트엔드에 로딩 인디케이터 추가로 사용자 이탈 방지

### 3. 성능 최적화

**문제:**
- MCP 서버 호출 시 지연 시간 (평균 5-10초)

**최적화:**
1. **캐싱 전략**
   ```python
   @lru_cache(maxsize=128)
   def get_recommendations(user_id: int, limit: int):
       # 추천 결과 캐싱 (5분)
   ```

2. **병렬 처리**
   ```python
   # 여러 플랫폼 동시 검색
   results = await asyncio.gather(
       search_coupang(query),
       search_naver(query),
       search_11st(query)
   )
   ```

3. **데이터베이스 인덱스**
   ```sql
   CREATE INDEX idx_user_purchases ON purchase_history(user_id, purchase_date);
   CREATE INDEX idx_products_category ON products(category, price);
   ```

---

## 배포 및 운영

### Docker Compose 설정

```yaml
services:
  # Backend API
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MCP_PURCHASE_URL=https://domain.com/mcp-recommend/mcp
      - MCP_SEARCH_URL=https://domain.com/mcp-shopping/mcp
      - MCP_STATISTICS_URL=https://domain.com/mcp-statistics/mcp

  # MCP Servers
  mcp-recommendation:
    build: ./backend
    command: python -m app.mcp_servers.recommendation_server
    ports:
      - "8001:8001"

  mcp-shopping:
    build: ./backend
    command: python -m app.mcp_servers.shopping_server
    ports:
      - "8002:8002"

  mcp-statistics:
    build: ./backend
    command: python -m app.mcp_servers.statistics_server
    ports:
      - "8003:8003"
```

### Nginx 설정

```nginx
# Backend API
location /api/ {
    proxy_pass http://backend:8000;
    proxy_read_timeout 180s;
    proxy_connect_timeout 180s;
    proxy_send_timeout 180s;
}

# MCP Servers
location /mcp-recommend/ {
    proxy_pass http://mcp-recommendation:8001/;
    proxy_read_timeout 180s;
}

location /mcp-shopping/ {
    proxy_pass http://mcp-shopping:8002/;
    proxy_read_timeout 180s;
}

location /mcp-statistics/ {
    proxy_pass http://mcp-statistics:8003/;
    proxy_read_timeout 180s;
}
```

### 모니터링

#### 로그 확인

```bash
# Backend 로그
docker-compose logs -f backend

# MCP 서버 로그
docker-compose logs -f mcp-recommendation
docker-compose logs -f mcp-shopping
docker-compose logs -f mcp-statistics
```

#### 헬스 체크

```python
# 각 MCP 서버 헬스체크 엔드포인트
GET /health

Response:
{
    "status": "healthy",
    "server": "recommendation",
    "version": "1.0.0",
    "uptime": 3600
}
```

### 트러블슈팅

#### MCP 서버 응답 없음

```bash
# 1. 서버 상태 확인
docker-compose ps

# 2. 로그 확인
docker-compose logs mcp-recommendation

# 3. 재시작
docker-compose restart mcp-recommendation

# 4. URL 접근 테스트
curl -X POST https://domain.com/mcp-recommend/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "health", "params": {}}'
```

#### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker-compose exec postgres psql -U user -d shopping_db -c "SELECT 1;"

# 마이그레이션 실행
docker-compose exec backend alembic upgrade head
```

---

## 참고 자료

### FastMCP 공식 문서
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [FastMCP Documentation](https://jlowin.github.io/fastmcp/)

### OpenAI API 문서
- [OpenAI Tools/Functions](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)

### 관련 이슈
- [FastMCP #855: 424 Failed Dependency](https://github.com/jlowin/fastmcp/issues/855)
- [OpenAI Community: MCP Integration](https://community.openai.com/t/mcp-integration)

---

## 향후 개선 사항

### 성능 개선
- [ ] Redis 캐싱 도입
- [ ] MCP 서버 로드 밸런싱
- [ ] 비동기 처리 최적화

### 안정성 개선
- [ ] Circuit Breaker 패턴 적용
- [ ] Retry 메커니즘 강화
- [ ] 헬스 체크 자동화

### 기능 확장
- [ ] 추가 MCP 서버 (리뷰 분석, 가격 알림 등)
- [ ] 실시간 웹소켓 통신
- [ ] 멀티 모달 지원 (이미지 검색)
