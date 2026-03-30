# AI 쇼핑 어시스턴트 - 서비스 아키텍처

> 대화형 AI 기반 쇼핑 추천/분석 서비스
> Live: https://csid-shopping.duckdns.org

---

## 1. 시스템 전체 구성도

### 1.1 배포 아키텍처 (Docker 컨테이너 기준)

```
  ┌──────────────┐                                        ┌─────────────────┐
  │ 사용자 (브라우저) │                                        │  OpenAI API 서버  │
  └──────┬───────┘                                        │ (api.openai.com) │
         │ HTTPS (443)                                    └────────┬────────┘
         ▼                                                         │
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ AWS EC2  ·  Docker Network: shopping-network (bridge)                               │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────┐                      │
│  │  📦 shopping-nginx                                         │                      │
│  │  image: nginx:alpine  │  ports: 80, 443 (호스트)           │                      │
│  │  역할: 리버스 프록시, SSL 종료, React SPA 정적 파일 서빙       │                      │
│  └──┬─────────────┬─────────────┬──────────────┬─────────────┘                      │
│     │ /api/*      │ /mcp-       │ /mcp-        │ /mcp-                              │
│     │             │ recommend/* │ shopping/*   │ statistics/*                        │
│     ▼             ▼             ▼              ▼                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐                      │
│  │📦 shopping- │ │📦 shopping- │ │📦 shopping- │ │📦 shopping-  │                      │
│  │  backend    │ │  mcp-      │ │  mcp-      │ │  mcp-       │                      │
│  │             │ │  recommend │ │  shopping  │ │  statistics │                      │
│  │ Dockerfile  │ │Dockerfile  │ │Dockerfile  │ │Dockerfile   │                      │
│  │ FastAPI     │ │.mcp        │ │.mcp        │ │.mcp         │                      │
│  │ port: 8000  │ │port: 8001  │ │port: 8002  │ │port: 8003   │                      │
│  │ (내부)      │ │(호스트+내부)│ │(호스트+내부)│ │(호스트+내부) │                      │
│  │             │ │            │ │            │ │             │                      │
│  │ REST API,   │ │구매이력 기반│ │11번가/네이버│ │구매 통계     │                      │
│  │ AI 오케스트 │ │추천 MCP    │ │검색 MCP    │ │분석 MCP     │   ◄── OpenAI가 직접  │
│  │ 레이션      │ │            │ │            │ │             │       MCP 호출       │
│  └──────┬─────┘ └─────┬──────┘ └────────────┘ └──────┬──────┘                      │
│         │             │                               │                              │
│         │  DB 접근    │  DB 접근                       │  DB 접근                     │
│         ▼             ▼                               ▼                              │
│  ┌──────────────────────────────────────────────────────────┐                        │
│  │  📦 shopping-postgres                                     │                        │
│  │  image: postgres:15-alpine  │  ports: 5433→5432 (호스트)  │                        │
│  │  역할: PostgreSQL 데이터베이스 (capstone_db)                │                        │
│  │  헬스체크: pg_isready (5초 간격, 5회 재시도)                 │                        │
│  └──────────────────────────────────────────────────────────┘                        │
│                                                                                     │
│  컨테이너 총 6개 · 컨테이너 간 통신: 서비스명 DNS (예: backend:8000)                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

  통신 흐름 요약:
    사용자 ──HTTPS──▶ nginx ──프록시──▶ backend / mcp-*
    backend ──OpenAI API──▶ OpenAI ──MCP tool 호출──▶ nginx ──▶ mcp-*
    backend, mcp-recommend, mcp-statistics ──TCP──▶ postgres
    mcp-shopping ──HTTPS──▶ 11번가 OpenAPI, 네이버 쇼핑 API
```

### 1.2 외부 서비스 연동 구성

```
                                 ┌────────────────────────┐
                                 │    OpenAI API 서버       │
                                 │    (미국, api.openai.com)│
                                 └────┬──────────┬────────┘
                                      │          │
                    Responses API 응답  │          │ MCP tool 호출
                    (output_text)      │          │ (POST /mcp/)
                                      │          │
              ┌───────────────────────┘          └──────────────────┐
              │                                                     │
              ▼                                                     ▼
┌──────────────────────┐                          ┌──────────────────────────┐
│   Backend :8000       │                          │ MCP 서버 (nginx 경유)      │
│   (API 요청 발신자)    │                          │ csid-shopping.duckdns.org │
│                       │                          │   /mcp-recommend/mcp/     │
│ client.responses      │                          │   /mcp-shopping/mcp/      │
│   .create(            │                          │   /mcp-statistics/mcp/    │
│     tools=[{type:mcp}]│                          └──────────┬───────────────┘
│   )                   │                                     │
└───────────────────────┘                                     │
                                                              │
                                                  ┌───────────┴────────────┐
                                                  │                        │
                                                  ▼                        ▼
                                        ┌──────────────┐        ┌──────────────┐
                                        │ 11번가 OpenAPI │        │ 네이버 쇼핑 API│
                                        │ (XML 응답)     │        │ (JSON 응답)    │
                                        └──────────────┘        └──────────────┘
```

**핵심 포인트**: Backend가 MCP 서버를 호출하는 것이 **아닙니다**. Backend는 OpenAI에게 `tools: [{type: "mcp", server_url: "..."}]`를 전달하고, **OpenAI의 서버(미국)가 MCP 서버 URL에 직접 HTTPS로 접속**합니다. 따라서 MCP 서버는 반드시 공인 URL로 노출되어야 합니다.

### 1.3 Docker Compose 컨테이너 상세 (6개)

| 컨테이너 | 이미지 | 포트 | 역할 | 환경변수 | 의존성 |
|----------|--------|------|------|---------|--------|
| `shopping-nginx` | nginx:alpine | 80, 443 (호스트) | 리버스 프록시, SSL 종료, 정적 파일 서빙 | - | backend |
| `shopping-backend` | Dockerfile | 8000 (내부) | FastAPI REST API 서버 | DATABASE_URL, OPENAI_*, MCP_* | postgres, mcp-* |
| `shopping-mcp-recommend` | Dockerfile.mcp | 8001 (호스트+내부) | 구매이력 기반 추천 MCP 서버 | DATABASE_URL | postgres (healthy) |
| `shopping-mcp-shopping` | Dockerfile.mcp | 8002 (호스트+내부) | 11번가/네이버 실시간 검색 MCP 서버 | ELEVENST_API_KEY, NAVER_* | - |
| `shopping-mcp-statistics` | Dockerfile.mcp | 8003 (호스트+내부) | 구매 통계 분석 MCP 서버 | DATABASE_URL | postgres (healthy) |
| `shopping-postgres` | postgres:15-alpine | 5433:5432 | PostgreSQL 데이터베이스 | POSTGRES_DB/USER/PASSWORD | - |

**Docker 네트워크**: `shopping-network` (bridge 드라이버)
- 컨테이너 간 통신: 서비스명으로 DNS 해석 (예: `backend:8000`, `mcp-shopping:8002`)
- 호스트 포트 매핑: postgres는 5433→5432 (호스트의 기본 postgres와 충돌 방지)

**헬스체크**: postgres만 `pg_isready` 헬스체크 적용 (5초 간격, 5회 재시도)
- backend는 `condition: service_healthy`로 postgres 준비 완료 후 시작
- mcp-recommend, mcp-statistics도 postgres 헬스체크 의존

**볼륨**:
- `postgres_data`: PostgreSQL 데이터 영속 저장
- `./nginx/nginx.conf`: nginx 설정 (읽기 전용 마운트)
- `./frontend/dist`: React 빌드 산출물 (읽기 전용 마운트)
- `/etc/letsencrypt`: Let's Encrypt SSL 인증서 (읽기 전용 마운트)

---

## 2. 기술 스택

### Frontend

| 기술 | 버전 | 용도 | 비고 |
|------|------|------|------|
| React | 19.1.1 | UI 프레임워크 | Functional Component + Hooks |
| TypeScript | strict mode | 타입 안전성 | `exactOptionalPropertyTypes: true` |
| Vite | 7.1.7 | 빌드 도구 | HMR, path alias (`@/`) |
| CSS Modules | camelCase | 스코프 격리 스타일링 | `localsConvention: 'camelCase'` |
| Nivo | 0.88.0 | 차트 시각화 | ResponsivePie, ResponsiveLine, ResponsiveBar |

### Backend

| 기술 | 버전 | 용도 | 비고 |
|------|------|------|------|
| FastAPI | 0.115.5 | REST API 프레임워크 | async 지원, 자동 문서화 |
| SQLAlchemy | 2.0.35 | ORM | Mapped Column 스타일 |
| Alembic | 1.14.0 | DB 마이그레이션 | 스키마 버전 관리 |
| OpenAI SDK | >=1.58.1 | Responses API 호출 | `client.responses.create()` |
| httpx | 0.27.2 | HTTP 클라이언트 | OpenAI SDK 내부 타임아웃 설정 |
| Pydantic | v2 | 요청/응답 스키마 | `model_validate`, `ConfigDict` |
| psycopg | (binary) | PostgreSQL 드라이버 | `postgresql+psycopg://` URL |

### MCP 서버

| 기술 | 버전 | 용도 | 비고 |
|------|------|------|------|
| FastMCP | 2.13.0 | MCP 서버 프레임워크 | `streamable-http` 트랜스포트 |
| pandas | 2.2.3 | 데이터 분석 | 추천/통계 데이터프레임 처리 |
| numpy | 2.1.3 | 수치 연산 | 코사인 유사도, Z-score 정규화 |
| requests | 2.32.3 | 외부 API 호출 | 11번가 XML API / 네이버 JSON API |

### 인프라

| 기술 | 용도 | 비고 |
|------|------|------|
| Docker Compose v3.8 | 서비스 오케스트레이션 | 6개 컨테이너 관리 |
| Nginx (alpine) | 리버스 프록시 + SSL | HTTP/2, Gzip 압축, 스트리밍 |
| Let's Encrypt | SSL/TLS 인증서 | certbot 자동 갱신 |
| AWS EC2 | 클라우드 호스팅 | 단일 인스턴스 배포 |
| DuckDNS | 동적 DNS | `csid-shopping.duckdns.org` |

---

## 3. AI 오케스트레이션 아키텍처

이 서비스의 핵심은 **OpenAI Responses API + MCP(Model Context Protocol)** 조합입니다.

### 3.1 전체 흐름 시퀀스 다이어그램

```
사용자          Frontend         Backend           OpenAI API        MCP Server       외부 API
  │               │               │                   │                │               │
  │  메시지 입력   │               │                   │                │               │
  ├──────────────►│               │                   │                │               │
  │               │ POST /api/    │                   │                │               │
  │               │ chat/messages │                   │                │               │
  │               ├──────────────►│                   │                │               │
  │               │               │                   │                │               │
  │               │               │  1단계: Intent 분류                  │               │
  │               │               │  responses.create(│                │               │
  │               │               │    input=메시지,   │                │               │
  │               │               │    expect_json)   │                │               │
  │               │               ├──────────────────►│                │               │
  │               │               │  {"selected_tool":│                │               │
  │               │               │   "platform_      │                │               │
  │               │               │    search"}       │                │               │
  │               │               │◄──────────────────┤                │               │
  │               │               │                   │                │               │
  │               │               │  2단계: MCP 워크플로                  │               │
  │               │               │  responses.create(│                │               │
  │               │               │    input=프롬프트,  │                │               │
  │               │               │    tools=[{type:  │                │               │
  │               │               │     "mcp",...}])  │                │               │
  │               │               ├──────────────────►│                │               │
  │               │               │                   │                │               │
  │               │               │                   │  POST /mcp/    │               │
  │               │               │                   │  (tool 호출)    │               │
  │               │               │                   ├───────────────►│               │
  │               │               │                   │                │  11번가 API    │
  │               │               │                   │                ├──────────────►│
  │               │               │                   │                │◄──────────────┤
  │               │               │                   │                │  네이버 API    │
  │               │               │                   │                ├──────────────►│
  │               │               │                   │                │◄──────────────┤
  │               │               │                   │  tool 결과 반환 │               │
  │               │               │                   │◄───────────────┤               │
  │               │               │                   │                │               │
  │               │               │  JSON 응답 반환    │                │               │
  │               │               │◄──────────────────┤                │               │
  │               │               │                   │                │               │
  │               │               │  _extract_json()  │                │               │
  │               │               │  마크다운 제거 후   │                │               │
  │               │               │  파싱              │                │               │
  │               │               │                   │                │               │
  │               │  응답 반환     │                   │                │               │
  │               │◄──────────────┤                   │                │               │
  │  UI 업데이트   │               │                   │                │               │
  │◄──────────────┤               │                   │                │               │
```

### 3.2 AiOrchestrator 클래스 구조

```python
# backend/app/ai/orchestrator.py

class AiOrchestrator:
    """ChatService가 사용하는 AI 응답 생성 엔트리 포인트"""

    def __init__(self, *, config, openai_client, recommendation_service):
        self._config: AiConfig          # 환경변수 매핑 (Pydantic, frozen)
        self._client: OpenAIChatClient  # OpenAI Responses API 래퍼
        self._recommendation_service    # Mock 추천 (fallback용)

    def generate(self, *, user_id: int, message: str) -> AiOrchestratorResult:
        """메인 진입점 - Intent 분류 후 MCP 라우팅"""

    # private 메서드:
    def _classify_tool_intent(message, available_tools) -> ToolIntentPrediction
    def _run_platform_search(message) -> AiOrchestratorResult
    def _run_purchase_recommendation(user_id, limit) -> AiOrchestratorResult
    def _run_statistics_analysis(message) -> AiOrchestratorResult
    def _fallback_response(message, user_id) -> AiOrchestratorResult
```

**반환 타입 (`AiOrchestratorResult`)**:
```python
@dataclass
class AiOrchestratorResult:
    ai_message: str                              # AI 응답 텍스트
    response_type: int                           # 0=텍스트, 1=상품추천, 2=통계분석
    recommendation_items: List[RecommendationItem]  # 추천 상품 목록 (type=1일 때)
```

### 3.3 Intent 분류 → MCP 라우팅 상세

```
사용자 메시지 입력
       │
       ▼
 ┌─────────────────────────────────┐
 │  0단계: OpenAI 설정 확인          │
 │  self._client.is_configured?    │
 │  (API 키 존재 여부)              │
 └──────────┬──────────────────────┘
            │
     ┌──────┴──────┐
     │ False       │ True
     ▼             ▼
 _fallback     ┌──────────────────────────────┐
 _response()   │  1단계: Intent 분류             │
 (키워드 기반   │  _classify_tool_intent()       │
  Mock 응답)   │                                │
               │  OpenAI Responses API 호출:     │
               │   input: tool_selection_prompt  │
               │   expect_json: true             │
               │                                │
               │  응답 파싱:                      │
               │   {"selected_tool": "...",      │
               │    "reason": "..."}             │
               └──────────┬─────────────────────┘
                          │
                 ┌────────┼────────────┬──────────────┐
                 ▼        ▼            ▼              ▼
           platform   purchase    statistics        none
           _search    _recommend  _analysis        (잡담)
                 │        │            │              │
                 │   ┌────┴────┐       │              │
                 │   │보정 체크 │       │              │
                 │   │PRODUCT_  │       │              │
                 │   │SEARCH_   │       │              │
                 │   │KEYWORDS  │       │              │
                 │   │매칭 시   │       │              │
                 │   │platform_ │       │              │
                 │   │search로  │       │              │
                 │   │재분류    │       │              │
                 │   └────┬────┘       │              │
                 │        │            │              │
                 ▼        ▼            ▼              ▼
           ┌──────────────────────────────────────────────┐
           │  2단계: MCP 워크플로 실행                       │
           ├──────────────────────────────────────────────┤
           │                                              │
           │  platform_search:                            │
           │    prompt = build_platform_search_prompt()   │
           │    tools = build_search_toolset()            │
           │    → search_11st_products + search_naver     │
           │    → response_type = 1 (상품 카드)            │
           │                                              │
           │  purchase_recommendation:                    │
           │    prompt = build_purchase_prompt(user_id)   │
           │    tools = build_purchase_toolset()          │
           │    → recommend_products_final_v4             │
           │    → response_type = 1 (상품 카드)            │
           │                                              │
           │  statistics_analysis:                        │
           │    prompt = message (사용자 원문)              │
           │    instructions = build_statistics_prompt()  │
           │    tools = build_statistics_toolset()        │
           │    → 7개 통계 도구 중 OpenAI가 선택            │
           │    → response_type = 2 (텍스트 분석)          │
           │                                              │
           │  none (잡담):                                 │
           │    prompt = build_smalltalk_prompt()         │
           │    tools = 없음                               │
           │    → response_type = 0 (텍스트)               │
           └──────────────────────────────────────────────┘
                          │
                          ▼
                   ChatMessage DB 저장
                          │
                          ▼
                   응답 반환 (type: 0|1|2)
```

### 3.4 Intent 분류 우선순위 규칙

| 우선순위 | Intent | 핵심 조건 | 예시 | response_type |
|---------|--------|----------|------|---------------|
| 1 | `statistics_analysis` | 과거 소비 데이터 분석 키워드 | "이번달 얼마 썼어?" | 2 |
| 2 | `platform_search` | 구체적 상품명/카테고리/스펙 포함 | "패딩 추천해줘", "다이슨 청소기" | 1 |
| 3 | `purchase_recommendation` | 상품명 없이 모호한 추천 요청 | "뭐 살까?", "추천해줘" | 1 |
| 4 | `none` | 쇼핑 무관 | "안녕", "날씨 어때?" | 0 |

**보정 로직** (`_looks_like_product_query`):
`purchase_recommendation`으로 분류되었더라도 아래 18개 키워드에 매칭되면 `platform_search`로 재분류:

```python
PRODUCT_SEARCH_KEYWORDS = (
    "패딩", "자켓", "코트", "외투", "점퍼", "데스크테리어", "책상",
    "꾸밀", "소품", "장식", "가전", "노트북", "키보드", "마우스",
    "모니터", "헤드폰", "이어폰", "의자",
)
```

### 3.5 OpenAI Responses API 호출 상세

```python
# backend/app/ai/openai_client.py

class OpenAIChatClient:
    def __init__(self, config):
        self._client = OpenAI(
            api_key=config.openai_api_key,
            timeout=httpx.Timeout(
                timeout=300.0,    # 전체 타임아웃 5분
                connect=10.0,     # 연결 타임아웃 10초
                read=240.0,       # 읽기 타임아웃 4분
            ),
            max_retries=0,        # 재시도 없음
        )

    def run_prompt(self, *, prompt, instructions=None, tools=None) -> str:
        payload = {
            "model": "gpt-5",    # .env의 OPENAI_MODEL
            "input": prompt,      # str 또는 list
        }
        if instructions:
            payload["instructions"] = instructions  # 시스템 프롬프트
        if tools:
            payload["tools"] = tools  # MCP 도구 정의
        response = self._client.responses.create(**payload)
        return response.output_text
```

**JSON 파싱 (`_extract_json`)**:
OpenAI가 종종 ` ```json ... ``` ` 형태로 응답하므로 마크다운 코드블록을 제거:

```python
def _extract_json(text: str) -> dict:
    stripped = text.strip()
    match = re.search(r"```(?:json)?\s*\n?(.*?)```", stripped, re.DOTALL)
    if match:
        stripped = match.group(1).strip()
    return json.loads(stripped)
```

### 3.6 MCP Tool 정의 구조

```python
# backend/app/ai/mcp_client.py

# OpenAI Responses API에 전달되는 MCP 도구 정의
{
    "type": "mcp",
    "server_label": "shopping_search",       # 식별 라벨
    "server_url": "https://csid-shopping.duckdns.org/mcp-shopping/mcp/",
    "allowed_tools": [
        "search_11st_products",
        "search_naver_products"
    ],
    "require_approval": "never"              # 자동 승인
}
```

**서버별 MCP 도구 정의:**

| server_label | server_url 경로 | allowed_tools | 용도 |
|-------------|----------------|---------------|------|
| `purchase_reco` | `/mcp-recommend/mcp/` | `recommend_products_final_v4` | 구매이력 기반 추천 |
| `shopping_search` | `/mcp-shopping/mcp/` | `search_11st_products`, `search_naver_products` | 실시간 상품 검색 |
| `purchase_statistics` | `/mcp-statistics/mcp/` | 7개 통계 도구 | 구매 통계 분석 |

### 3.7 프롬프트 템플릿 체계 (5종)

| 템플릿 | 함수 | 용도 | 반환 형식 |
|--------|------|------|----------|
| 공통 기반 | `build_common_prompt()` | 모든 프롬프트에 포함되는 기본 지침 | - |
| Intent 분류 | `build_tool_selection_prompt()` | 사용자 메시지 → MCP 워크플로 선택 | JSON: `{selected_tool, reason}` |
| 상품 검색 | `build_platform_search_prompt()` | 11번가+네이버 MCP 호출 지시 | JSON: `{ai_message, elevenst[], naver[]}` |
| 구매 추천 | `build_purchase_prompt()` | 구매이력 MCP 호출 지시 | JSON: `{recommendationItems[]}` |
| 통계 분석 | `build_statistics_prompt()` | 통계 MCP 호출 + 자연어 해석 지시 | 텍스트 (구조화된 마크다운) |
| 잡담 | `build_smalltalk_prompt()` | 쇼핑 무관 대화 처리 | 텍스트 (2-3문장) |

**통계 분석 프롬프트 특이사항**: `instructions` 파라미터로 전달 (Responses API의 시스템 프롬프트)
- 다른 워크플로: `input`에 프롬프트 직접 전달
- 통계 워크플로: `input`=사용자 원문, `instructions`=시스템 프롬프트 (분석 전문가 역할 지시)

---

## 4. MCP 서버 상세

### 4.1 공통 아키텍처

모든 MCP 서버는 동일한 구조를 따릅니다:

```python
mcp = FastMCP("server_name", stateless_http=True)

@mcp.tool()
def tool_function(param1, param2) -> dict | list:
    """도구 설명 (OpenAI가 이 docstring을 읽고 호출 여부를 판단)"""
    # 비즈니스 로직 실행
    return result

mcp.run(
    transport="streamable-http",  # HTTP 기반 스트리밍 트랜스포트
    host="0.0.0.0",
    port=PORT,
    path="/mcp/",                  # URL 경로 (trailing slash 필수)
    stateless_http=True,           # 세션 없는 요청/응답 방식
)
```

**호출 경로**: OpenAI 서버 → HTTPS → nginx (`/mcp-{name}/`) → Docker 내부 → FastMCP (`/mcp/`)

### 4.2 Shopping MCP (:8002) - 실시간 상품 검색

**파일**: `backend/app/mcp_servers/shopping_server.py`
**환경변수**: `ELEVENST_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`

#### 도구 1: `search_11st_products`

| 항목 | 내용 |
|------|------|
| 파라미터 | `keyword: str`, `limit: int = 3` |
| 외부 API | `http://openapi.11st.co.kr/openapi/OpenApiService.tmall` |
| 응답 형식 | XML → 파싱 |
| 정렬 기준 | `sortCd: "A"` (정확도순) |
| 가격 우선순위 | SalePrice → ProductPrice → Price → LowestPrice |
| 이미지 우선순위 | 300px → 250px → 200px → ... → 100px |
| 타임아웃 | 15초 |

```
반환 예시:
[
  {
    "name": "남성 겨울 패딩",
    "price": "89000",
    "platform_name": "11번가",
    "category": null,
    "product_url": "http://www.11st.co.kr/product/...",
    "image_url": "https://..."
  }
]
```

#### 도구 2: `search_naver_products`

| 항목 | 내용 |
|------|------|
| 파라미터 | `query: str`, `page_size: int = 3` |
| 외부 API | `https://openapi.naver.com/v1/search/shop.json` |
| 인증 | `X-Naver-Client-Id`, `X-Naver-Client-Secret` 헤더 |
| 정렬 기준 | `sort: "sim"` (유사도순) |
| HTML 처리 | `<b>` 태그 제거, `unescape()` |
| 타임아웃 | 15초 |

```
반환 예시:
[
  {
    "name": "남성 겨울 경량 패딩",
    "price": "79900",
    "platform_name": "네이버",
    "category": "패션의류",
    "product_url": "https://...",
    "image_url": "https://..."
  }
]
```

### 4.3 Recommendation MCP (:8001) - 개인화 추천

**파일**: `backend/app/mcp_servers/recommendation_server.py`
**환경변수**: `DATABASE_URL`
**데이터 소스**: `purchase_history` + `products` 테이블 (SQL 직접 쿼리)

#### 도구: `recommend_products_final_v4`

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| `top_k` | 30 | 반환할 추천 상품 수 |
| `exclude_bought` | True | 이미 구매한 상품 제외 |
| `alpha` | 0.7 | 유사도(similarity) 가중치 |
| `beta` | 0.3 | 절약률(savings_ratio) 가중치 |

#### 추천 알고리즘 상세 흐름

```
Phase 1: 데이터 로드
─────────────────────
  purchases = SELECT FROM purchase_history   (구매 이력)
  catalog   = SELECT FROM products           (전체 카탈로그)

Phase 2: Feature Engineering
───────────────────────────
  각 상품에 대해:
  ├── price → log_price = log(1 + price)
  ├── unit_price → log_unit_price = log(1 + unit_price)
  ├── unit_volume → unit_base 추출 (정규식: "100ml당" → 100.0)
  ├── normalized_price = unit_price(유효시) 또는 price/unit_base
  ├── log_norm_price = log(1 + normalized_price)
  ├── reviews → log_review = log(1 + reviews)
  ├── rating (그대로 사용)
  └── small_category → 원-핫 인코딩 (small_cat_식품, small_cat_음료, ...)

  Feature 벡터 = [log_price, log_unit_price, log_unit_base,
                  log_norm_price, log_review, rating,
                  small_cat_A, small_cat_B, ...]

Phase 3: 정규화
──────────────
  Z-score 정규화: X_norm = (X - mean) / std
  ※ purchases와 catalog 각각 독립 정규화
  ※ Feature 컬럼 정렬(align): 양쪽 누락 컬럼은 0으로 채움

Phase 4: 사용자 프로필 생성
────────────────────────
  user_profiles = {
      "생수": mean(구매 이력 중 생수 카테고리의 feature 벡터),
      "음료": mean(구매 이력 중 음료 카테고리의 feature 벡터),
      ...
  }
  user_profile_overall = mean(전체 구매 이력의 feature 벡터)  # fallback용

Phase 5: 이중 Baseline 계산
─────────────────────────
  각 small_category별:
  ├── 용량형 상품 (unit_volume ≠ "1"):
  │   unit_baseline = Σ(normalized_price × quantity) / Σ(quantity)
  ├── 단품형 상품 (unit_volume == "1"):
  │   item_baseline = Σ(price × quantity) / Σ(quantity)
  └── avg_quantity = mean(quantity)

Phase 6: 스코어링 (각 카탈로그 상품)
──────────────────────────────────
  for each product in catalog:
    1. 상품 타입 감지: unit_volume == "1" ? item_based : unit_based
    2. 비교 가격 결정:
       - unit_based → comparison_price = normalized_price
       - item_based → comparison_price = price
    3. Baseline 선택: 타입에 맞는 baseline
    4. 가격 필터: comparison_price > baseline × 3 이면 제외
    5. 코사인 유사도:
       similarity = dot(user_vec, item_vec) /
                    (|user_vec| × |item_vec| + 1e-8)
    6. 절약률:
       save_ratio = max(0, baseline - comparison_price) / baseline
       save_ratio = save_ratio / (1 + save_ratio)    # dampen
       save_ratio = min(save_ratio, 0.5)              # cap at 50%
    7. 구매 빈도 가중치:
       freq_weight = 해당 카테고리 구매 건수
    8. 최종 점수:
       final_score = (α × similarity + β × save_ratio) × log(1 + freq_weight)

Phase 7: 다양성 보장 및 정렬
──────────────────────────
  1. final_score 내림차순 정렬
  2. exclude_bought=True이면 이미 구매한 상품명 제외
  3. 카테고리 다양성: 각 small_category에서 1개씩만 선택
  4. top_k개 반환

Phase 8: Fallback
────────────────
  매칭 상품 0개이면 → 인기도 기반 추천:
  popularity_score = log(1 + reviews) × 0.7 + rating × 0.3
```

#### 반환 필드 상세

```python
{
    "rank": 1,                    # 순위
    "product_id": 12345,          # 상품 ID
    "small_category": "생수",     # 소분류 카테고리
    "category": "식품",           # 대분류 카테고리
    "product_name": "삼다수 2L",  # 상품명
    "platform": "쿠팡",          # 플랫폼
    "price": 15000,              # 판매가
    "unit_volume": "2L",         # 용량 단위
    "unit_price": 750.0,         # 단위당 가격
    "normalized_price": 750.0,   # 정규화 가격
    "product_type": "unit_based",# 상품 타입 (unit_based/item_based)
    "comparison_price": 750.0,   # 실제 비교 가격
    "user_avg_baseline": 820.0,  # 사용자 평균 baseline
    "savings_ratio_pct": 8.54,   # 절약률 (%)
    "similarity": 0.87,          # 코사인 유사도
    "final_score": 1.23,         # 최종 점수
    "reviews": 1200,             # 리뷰 수
    "rating": 4.5,               # 평점
    "image_url": "https://...",  # 상품 이미지
    "product_url": "https://..." # 상품 URL
}
```

### 4.4 Statistics MCP (:8003) - 구매 통계 분석

**파일**: `backend/app/mcp_servers/statistics_server.py`
**환경변수**: `DATABASE_URL`
**데이터 소스**: `purchase_history` 테이블 (SQL 직접 쿼리)

#### 7개 도구 상세

| # | 도구명 | 파라미터 | 분석 내용 | 반환 형식 |
|---|--------|---------|----------|----------|
| 1 | `analyze_category_share` | start_date, end_date | 카테고리별 지출 금액/비율 | `[{category, amount, ratio}]` |
| 2 | `analyze_platform_ratio` | start_date, end_date | 플랫폼별 지출 금액/비율 | `[{platform, amount, ratio}]` |
| 3 | `analyze_monthly_category_trend` | start_date, end_date, top_n(=5) | 월별 상위 N개 카테고리 소비 추이 | `[{year_month, category, amount}]` |
| 4 | `analyze_monthly_platform_trend` | start_date, end_date | 월별 플랫폼별 소비 추이 | `[{year_month, platform, amount}]` |
| 5 | `analyze_monthly_total_trend` | start_date, end_date | 월별 총 소비 추이 | `[{year_month, amount}]` |
| 6 | `analyze_hourly_trend` | start_date, end_date | 시간대별(0~23시) 소비 분포 | `[{hour, amount}]` (24개 항목) |
| 7 | `analyze_top_product` | start_date, end_date, top_k(=5), metric | 최다 구매 상품 | `[{product_name, category, total_quantity, total_price, platforms}]` |

**금액 계산 로직**:
- `total_price` 필드 존재 시 사용
- 없으면 `price × quantity` 계산

**날짜 필터링**:
- start_date/end_date 모두 ISO 형식 (YYYY-MM-DD 또는 YYYY-MM-DDTHH:MM:SS)
- 날짜 부분만 비교 (시간대, 타임존 무시)
- 미지정 시 전체 데이터 기간

**통계 분석 응답 형식** (OpenAI가 생성하는 자연어):
```
📊 **[한 줄 요약]**
기간, 총액, 주요 카테고리/플랫폼을 한 문장으로 요약

📋 **[핵심 내용]**
• **기간·총액**: ...
• **카테고리별**: ... (비율 내림차순)
• **플랫폼별**: ... (비율 내림차순)
• **시간대별**: ... (패턴 설명)
• **주요 상품**: ... (상위 3개)

💬 추가로 궁금한 점 있으면 편하게 물어봐!
```

---

## 5. Backend 계층 구조

### 5.1 디렉토리 맵 (역할별)

```
backend/app/
│
├── main.py                        ─── FastAPI 앱 팩토리
│   ├── create_app()                   CORS, 라우터 등록, init_db
│   ├── CORSMiddleware                 localhost:5173 허용 (개발)
│   └── /health 엔드포인트              배포 모니터링용
│
├── core/
│   └── database.py                ─── SQLAlchemy 설정
│       ├── Base                       DeclarativeBase (ORM 기반)
│       ├── engine                     create_engine(DATABASE_URL)
│       ├── SessionLocal               sessionmaker(autoflush=False)
│       ├── get_db()                   FastAPI Depends용 제너레이터
│       └── init_db()                  Base.metadata.create_all()
│
├── db/
│   └── models.py                  ─── SQLAlchemy ORM 모델 (5개)
│       ├── User                       users 테이블
│       ├── Product                    products 테이블
│       ├── CartItem                   cart_items 테이블
│       ├── PurchaseHistory            purchase_history 테이블
│       └── ChatMessage                chat_messages 테이블
│
├── models/                        ─── Pydantic 요청/응답 스키마
│   ├── auth.py                        LoginRequest, RegisterRequest/Response
│   ├── chat.py                        SendChatMessageRequest/Response, ChatMessage
│   ├── cart.py                        CartItem, AddCartItemRequest
│   ├── recommendation.py             RecommendationItem, CustomRecommendation*
│   ├── purchase_history.py           PurchaseItemOut, CheckoutRequest/Response
│   └── statistics.py                 StatisticsDashboardResponse
│
├── api/                           ─── Route Layer (thin controllers)
│   ├── auth.py                        POST /api/auth/register, /login
│   ├── chat.py                        POST /api/chat/messages, GET /history
│   ├── cart.py                        GET/POST/DELETE /api/cart
│   ├── recommendations.py            POST /api/recommendations/custom
│   ├── purchase_history.py           GET /api/purchase-history, POST /checkout
│   └── statistics.py                 GET /api/statistics/dashboard
│
├── services/                      ─── Business Logic Layer
│   ├── auth_service.py                AuthService (평문 비밀번호, JWT 없음)
│   ├── chat_service.py                ChatService → AiOrchestrator 위임
│   ├── cart_service.py                CartService (CRUD, upsert)
│   ├── recommendation_service.py     RecommendationService (10개 하드코딩 fallback)
│   ├── purchase_history_service.py   PurchaseHistoryService (결제=checkout)
│   └── statistics_service.py         StatisticsService (대시보드 집계)
│
├── ai/                            ─── AI 오케스트레이션 모듈
│   ├── __init__.py                    AiOrchestrator re-export
│   ├── orchestrator.py                AiOrchestrator 메인 클래스
│   ├── openai_client.py               OpenAIChatClient (Responses API 래퍼)
│   ├── mcp_client.py                  McpToolDefinition + 빌더 함수 3개
│   ├── prompt_templates.py            프롬프트 템플릿 5종
│   ├── config.py                      AiConfig (Pydantic, 환경변수 매핑)
│   └── types.py                       AiOrchestratorResult, ToolIntentPrediction
│
└── mcp_servers/                   ─── 독립 프로세스 MCP 서버
    ├── recommendation_server.py       :8001 - 추천 알고리즘 (pandas/numpy)
    ├── shopping_server.py             :8002 - 11번가/네이버 API
    └── statistics_server.py           :8003 - 통계 분석 (7개 도구)
```

### 5.2 요청 처리 흐름 상세

```
HTTP 요청
    │
    ▼
api/ (Route Layer)
    │  - 요청 파라미터 파싱
    │  - Depends(get_db)로 DB 세션 주입
    │  - 서비스 호출 후 Pydantic 응답 반환
    ▼
services/ (Business Logic Layer)
    │  - 비즈니스 규칙 적용
    │  - DB CRUD 실행
    │  - AI 오케스트레이터 호출 (chat만)
    │
    ├───→ ai/orchestrator.py
    │       │  - Intent 분류 (OpenAI)
    │       │  - MCP 워크플로 실행
    │       ├───→ ai/openai_client.py
    │       │       └─ OpenAI Responses API 호출
    │       └───→ ai/mcp_client.py
    │               └─ MCP tool 정의 빌드
    │
    └───→ db/models.py (SQLAlchemy ORM)
            │
            ▼
        PostgreSQL
```

### 5.3 인증 시스템

```python
# services/auth_service.py

class AuthService:
    def create_user(*, db, phone_number, password, name) -> User:
        # 1. 중복 전화번호 체크 (SELECT WHERE number == phone_number)
        # 2. User 생성 (password 평문 저장)
        # 3. commit + refresh

    def authenticate_user(*, db, phone_number, password) -> User | None:
        # 1. 전화번호로 User 조회
        # 2. user.password == password 직접 비교 (평문)
        # 3. 일치하면 User 반환, 아니면 None
```

**보안 참고**: 현재 평문 비밀번호 저장/비교, JWT 토큰 미사용 (프로토타입 수준)

---

## 6. 데이터베이스 스키마

### 6.1 ER 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                         users                                    │
│─────────────────────────────────────────────────────────────────│
│ id         : BigInteger   PK, AUTO_INCREMENT                     │
│ number     : String(255)  UNIQUE, NOT NULL (전화번호=로그인 ID)    │
│ password   : String(255)  NOT NULL (⚠ 평문 저장)                  │
│ name       : String(255)  NOT NULL                               │
│ created_at : DateTime(tz) DEFAULT now()                          │
└──────────┬─────────────────┬─────────────────┬──────────────────┘
           │ 1:N (CASCADE)   │ 1:N (CASCADE)   │ 1:N (CASCADE)
           ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│   cart_items      │ │ purchase_history │ │   chat_messages      │
│──────────────────│ │──────────────────│ │──────────────────────│
│ product_id  : Big│ │ id : BigInt PK   │ │ id : BigInt PK       │
│ user_id     : Big│ │ user_id : Big FK │ │ user_id : Big FK     │
│   ⚷ PK(product_  │ │ product_id : Big │ │ message : Text       │
│       id,user_id)│ │   ⚠ FK 아님      │ │ ai_message : Text    │
│ name    : Str255 │ │ date : DateTime  │ │ response_type : Int  │
│ platform_name    │ │ name : Str255    │ │   (0=텍스트, 1=추천,  │
│   : Str255       │ │ platform_name    │ │    2=통계)            │
│ category: Str255 │ │   : Str255       │ │ statistics_image_url │
│ price : Num(10,2)│ │ price: Num(10,2) │ │   : Str512 (nullable)│
│ image_url: Str512│ │ category: Str255 │ │ created_at: DateTime │
│ product_url      │ │ image_url: Str512│ │ updated_at: DateTime │
│   : Str512       │ │ product_url      │ │   (auto onupdate)    │
│ quantity : Int   │ │   : Str512       │ └──────────────────────┘
│   DEFAULT 1      │ │ unit_volume      │
│ created_at       │ │   : Str100       │
│   : DateTime     │ │ unit_price       │
└──────────────────┘ │   : Num(10,2)    │
                     │ small_category   │ ┌──────────────────────┐
                     │   : Str255       │ │     products          │
                     │ review : Int     │ │──────────────────────│
                     │ rating: Num(3,2) │ │ id : BigInt PK       │
                     │ quantity : Int   │ │ title : Str255       │
                     │   DEFAULT 1      │ │ price : Num(10,2)    │
                     │ created_at       │ │ platform_name: Str255│
                     │   : DateTime     │ │ category : Str255    │
                     └──────────────────┘ │ small_category: Str255│
                                          │ review : Int         │
                      ⚠ purchase_history  │ rating : Num(3,2)   │
                        .product_id는     │ url : Str512         │
                        FK가 아님 (의도적) │ image_url : Str512   │
                        → 스냅샷 보존      │ unit_volume : Str100 │
                                          │ unit_price: Num(10,2)│
                                          └──────────────────────┘
```

### 6.2 설계 결정 근거

| 결정 | 이유 | 영향 |
|------|------|------|
| `purchase_history.product_id`에 FK 없음 | 상품 변경/삭제 시 구매 시점 데이터(가격, 이름 등) 보존 | MCP 추천 서버가 JOIN 없이 직접 쿼리 가능 |
| `cart_items` 복합 PK (product_id + user_id) | 동일 사용자의 동일 상품 중복 방지 | Upsert 패턴으로 수량만 업데이트 |
| `chat_messages.response_type` 정수 | 프론트엔드 렌더링 분기 단순화 | 0=텍스트만, 1=상품카드+텍스트, 2=통계텍스트 |
| `purchase_history` 비정규화 | Products 테이블과 독립적으로 구매 기록 보존 | 데이터 중복 발생하지만 이력 정확성 확보 |
| `products`는 카탈로그 전용 | 추천 알고리즘의 후보 풀로만 사용 | 직접적인 FK 관계 없음 (checkout 시 보강 데이터 source) |

### 6.3 Checkout 시 데이터 흐름

```
CartItem (장바구니)
    │
    ├── product_id → Products 테이블 조회
    │                 ├── category (보강)
    │                 ├── unit_volume
    │                 ├── unit_price
    │                 ├── small_category
    │                 ├── review
    │                 └── rating
    │
    └──────────────────────┐
                           ▼
                    PurchaseHistory (비정규화 스냅샷 생성)
                    ├── CartItem의 name, platform_name, price, image_url...
                    ├── Products에서 보강된 category, unit_*, review, rating
                    └── quantity, date(현재 UTC)
                           │
                           └── CartItem 삭제 (DELETE)
```

---

## 7. Frontend 아키텍처

### 7.1 Context 기반 상태 관리 (7개 Provider)

```
<AppProvider>                        ← 최상위 통합 Provider
  └── AuthProvider                   ← user, isAuthenticated, login(), register()
    └── NavigationProvider           ← currentPage, navigateTo()
      └── CartProvider               ← items[], addItem(), removeItem(), checkout()
        └── PanelProvider            ← panelType, panelData, showPanel()
          └── ModalProvider          ← isOpen, productId, openModal()
            └── ChatProvider         ← messages[], sendMessage(), isTyping
              └── {children}
              └── <ProductDetailModal />  ← 전역 모달
```

**중첩 순서 근거**: 하위 Context가 상위 Context의 값에 의존
- ChatProvider → AuthProvider의 `user.id` 사용 (메시지 전송 시)
- CartProvider → AuthProvider의 `user.id` 사용 (장바구니 조회 시)
- PanelProvider → NavigationProvider의 페이지 상태에 따라 패널 변경

### 7.2 ChatContext 상태 머신

```
초기 상태
  │
  ├── isAuthenticated 변경 → loadHistory()
  │                          GET /api/chat/history?user_id={id}
  │                          → SET_MESSAGES (히스토리 로드)
  │
  └── sendMessage(content) 호출:
        │
        ├── ADD_MESSAGE (유저 메시지, status='sending')
        ├── SET_TYPING = true
        │
        ├── POST /api/chat/messages
        │     {user_id, message}
        │
        ├── 성공:
        │   ├── UPDATE_MESSAGE (status='sent')
        │   ├── ADD_MESSAGE (AI 응답, role='assistant')
        │   │
        │   └── response.type 분기:
        │       ├── type=0: 텍스트만 표시
        │       ├── type=1 + recommendationItems:
        │       │   ├── savings_ratio_pct > 0 또는 similarity 있음
        │       │   │   → onRecommendation 콜백 (맞춤추천 모달)
        │       │   └── 그 외
        │       │       → OPEN_RECOMMENDATION_MODAL (검색추천 모달)
        │       └── type=2: 통계 텍스트 표시
        │
        └── 실패:
            ├── UPDATE_MESSAGE (status='failed')
            └── SET_ERROR
```

### 7.3 화면 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│                        MainLayout                             │
├──────────────┬────────────────────────────┬──────────────────┤
│              │                            │                  │
│ ChatInterface│      DynamicPanel          │   CartSidebar    │
│ (왼쪽 고정)  │      (가운데, 동적 변경)     │   (오른쪽 접이식) │
│              │                            │                  │
│ ┌──────────┐ │  타입별 렌더링:              │ ┌──────────────┐ │
│ │ 메시지   │ │  ├ recommendations         │ │ CartItem[]   │ │
│ │ 히스토리  │ │  │  (추천 상품 그리드)       │ │              │ │
│ │          │ │  ├ product-detail          │ │ 수량 ±       │ │
│ │ AI 응답  │ │  │  (상품 상세)             │ │ 삭제 버튼    │ │
│ │          │ │  ├ statistics              │ │              │ │
│ │ Typing.. │ │  │  (StatisticsDashboard)  │ ├──────────────┤ │
│ │          │ │  ├ search-results          │ │ CartSummary  │ │
│ ├──────────┤ │  │  (검색 결과)             │ │ 총액         │ │
│ │ 입력창   │ │  └ purchase-history         │ │ 결제 버튼    │ │
│ └──────────┘ │    (구매이력 대시보드)       │ └──────────────┘ │
├──────────────┴────────────────────────────┴──────────────────┤
│                    BottomNavigation                           │
│              [채팅]    [구매이력]    [통계]                      │
└──────────────────────────────────────────────────────────────┘

모달 (전역 오버레이):
  ├── ProductDetailModal        (상품 상세 팝업)
  ├── ChatRecommendationModal   (검색 추천 결과)
  ├── CustomRecommendationModal (맞춤 추천 결과)
  └── StatisticsImageModal      (통계 이미지 확대)
```

### 7.4 반응형 Breakpoint

| Breakpoint | 너비 | 레이아웃 |
|-----------|------|---------|
| `mobile` | < 768px | 단일 컬럼, 하단 탭 전환 |
| `tablet` | 768-1024px | 2컬럼 (채팅 + 패널) |
| `desktop` | 1024-1440px | 3컬럼 (채팅 + 패널 + 장바구니) |
| `wide` | >= 1440px | 3컬럼 확장 |

---

## 8. 주요 데이터 흐름 상세

### 8.1 채팅 → 상품 검색 (type=1, platform_search)

```
1. Frontend
   ├── sendMessage("패딩 추천해줘")
   ├── Optimistic Update: 유저 메시지 즉시 표시
   └── POST /api/chat/messages {user_id: 1, message: "패딩 추천해줘"}

2. Backend: ChatService.send_message()
   └── AiOrchestrator.generate(user_id=1, message="패딩 추천해줘")

3. Intent 분류 (1차 OpenAI 호출)
   ├── prompt: build_tool_selection_prompt("패딩 추천해줘", available_tools=[...])
   ├── OpenAI 응답: {"selected_tool": "platform_search", "reason": "패딩 키워드"}
   └── _looks_like_product_query("패딩 추천해줘") → True (보정 불필요, 이미 platform_search)

4. MCP 워크플로 실행 (2차 OpenAI 호출)
   ├── prompt: build_platform_search_prompt("패딩 추천해줘")
   │   → "키워드를 추출한 뒤 두 개의 MCP 검색 툴을 모두 호출하세요..."
   ├── tools: [{type:"mcp", server_url:".../mcp-shopping/mcp/",
   │            allowed_tools:["search_11st_products","search_naver_products"]}]
   │
   ├── OpenAI → MCP Shopping (:8002)
   │   ├── search_11st_products(keyword="패딩", limit=3)
   │   │   └── 11번가 XML API 호출 → 3개 상품 반환
   │   └── search_naver_products(query="패딩", page_size=3)
   │       └── 네이버 JSON API 호출 → 3개 상품 반환
   │
   └── OpenAI 최종 응답 (JSON):
       {
         "ai_message": "🛒 패딩을 찾아봤어요!\n\n🛒 11번가 추천\n[1] ...",
         "elevenst": [{name, price, platform_name, product_url, image_url}, ...],
         "naver": [{name, price, platform_name, category, product_url, image_url}, ...]
       }

5. 응답 매핑
   ├── _extract_json() → 마크다운 코드블록 제거
   ├── _map_to_recommendation() × N개 → RecommendationItem[] 변환
   │   ├── product_id = hash(platform_key, name, idx) & 0xFFFFFFFF
   │   ├── price = float(str(price_raw).replace(",",""))
   │   └── platform_name = "11번가" 또는 "네이버"
   └── AiOrchestratorResult(ai_message, response_type=1, items[:6])

6. DB 저장
   └── ChatMessage(user_id=1, message="패딩 추천해줘",
                   ai_message="🛒 패딩을 찾아봤어요!...",
                   response_type=1)

7. Frontend 수신
   ├── ai_message → 채팅 버블로 표시
   ├── type=1 → 상품 카드 모달 열기
   └── recommendationItems → ChatRecommendationModal 표시
```

### 8.2 채팅 → 통계 분석 (type=2, statistics_analysis)

```
1. 사용자: "이번달 얼마 썼어?"

2. Intent 분류 → {"selected_tool": "statistics_analysis"}

3. MCP 워크플로 (통계 분석만 instructions 사용):
   ├── prompt = "이번달 얼마 썼어?" (사용자 원문 그대로)
   ├── instructions = build_statistics_prompt()
   │   → "너는 사용자의 개인 구매 이력을 분석해 주는 쇼핑 소비 분석 전문 챗봇이야..."
   ├── tools = 7개 통계 MCP 도구 정의
   └── expect_json = False (텍스트 응답)

4. OpenAI 판단 → MCP Statistics (:8003) 호출:
   ├── analyze_category_share(start_date="2026-03-01", end_date="2026-03-31")
   ├── analyze_platform_ratio(start_date="2026-03-01", end_date="2026-03-31")
   └── (OpenAI가 질문에 맞는 도구 조합을 자율적으로 선택)

5. OpenAI 최종 응답 (자연어 텍스트):
   "📊 이번달(3월) 총 125,000원을 사용하셨어요!
    📋 카테고리별로는 식품이 45%(56,250원)으로 가장 많고..."

6. AiOrchestratorResult(ai_message=텍스트, response_type=2, items=[])

7. Frontend: type=2 → 채팅 버블로 통계 텍스트 표시
```

### 8.3 결제(Checkout) 흐름

```
1. Frontend: CartSidebar → "결제" 버튼 클릭
   └── POST /api/purchase-history/checkout {user_id: 1}

2. Backend: PurchaseHistoryService.checkout()
   ├── _ensure_user(db, user_id) → 사용자 존재 확인
   ├── SELECT cart_items WHERE user_id = 1
   │
   ├── for each CartItem:
   │   ├── Products 테이블에서 상세정보 조회 (product_id로)
   │   │   └── category, unit_volume, unit_price, small_category, review, rating
   │   ├── PurchaseHistory 레코드 생성 (비정규화 스냅샷)
   │   │   └── CartItem 데이터 + Products 보강 데이터 병합
   │   └── CartItem DELETE
   │
   ├── db.commit() (트랜잭션 커밋)
   └── CheckoutResponse(success=True, purchased=[...])

3. Frontend: 장바구니 비움 + 구매 확인 표시
```

---

## 9. API 엔드포인트 상세

### 9.1 인증 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| POST | `/api/auth/register` | `{phone_number, password, name}` | `{user_id, name, status}` | 회원가입 (중복 전화번호 거부) |
| POST | `/api/auth/login` | `{phone_number, password}` | `{user_id, name}` | 로그인 (평문 비교) |

### 9.2 채팅 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| POST | `/api/chat/messages` | `{user_id, message}` | `{user_id, ai_message, type, recommendationItems[]}` | AI 채팅 (핵심 API) |
| GET | `/api/chat/history?user_id=N` | query param | `{messages: [{id, user_id, message, ai_message, timestamp}]}` | 채팅 히스토리 |

**SendChatMessageResponse 상세**:

```typescript
{
  user_id: number;
  ai_message: string;          // AI 응답 텍스트
  type: 0 | 1 | 2;            // 렌더링 분기
  recommendationItems: [       // type=1일 때만 존재
    {
      product_id: number;
      name: string;
      price: number;
      platform_name: string;
      category: string;
      review: number;
      image_url: string;
      product_url: string;
      unit_volume?: string;    // 구매추천(MCP Recommend)일 때
      unit_price?: number;     // 구매추천일 때
      savings_ratio_pct?: number; // 구매추천일 때 (절약률 %)
      similarity?: number;     // 구매추천일 때 (코사인 유사도)
    }
  ]
}
```

### 9.3 장바구니 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| GET | `/api/cart?user_id=N` | query param | `CartItem[]` | 장바구니 조회 |
| POST | `/api/cart/items` | `{user_id, product_id, name, platform_name, category, price, image_url, product_url, quantity}` | `CartItem` | 추가 (upsert: 동일 상품이면 수량 증가) |
| DELETE | `/api/cart/items/{product_id}?user_id=N` | path + query | `{success: true}` | 삭제 |

### 9.4 구매이력 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| GET | `/api/purchase-history?user_id=N` | query param (limit, offset) | `{user_id, purchases[], summary}` | 이력 조회 (페이지네이션) |
| POST | `/api/purchase-history/checkout` | `{user_id, product_ids?: []}` | `{success, purchased[]}` | 결제 (장바구니→이력) |

**PurchaseHistoryResponse.summary**:
```typescript
{
  total_orders: number;        // 총 주문 수
  total_spent: number;         // 총 지출액
  total_items: number;         // 현재 페이지 아이템 수
  average_order_value: number; // 평균 주문 금액
}
```

### 9.5 추천 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| POST | `/api/recommendations/custom` | `{user_id}` | `{user_id, generated_at, recommendations[]}` | AI 맞춤 추천 (MCP Recommend 직접 호출) |

### 9.6 통계 API

| Method | Endpoint | 요청 | 응답 | 설명 |
|--------|----------|------|------|------|
| GET | `/api/statistics/dashboard?user_id=N` | query param | `StatisticsDashboardResponse` | 대시보드 통계 집계 |

### 9.7 시스템 API

| Method | Endpoint | 응답 | 설명 |
|--------|----------|------|------|
| GET | `/health` | `{"status": "ok"}` | 헬스체크 (배포/모니터링) |

---

## 10. 네트워크 흐름 (배포 환경)

### 10.1 일반 API 호출 (브라우저 → Backend)

```
브라우저
  │ HTTPS (443)
  ▼
nginx (SSL 종료)
  │ HTTP/1.1
  │ proxy_pass http://backend:8000
  │ timeout: 120s(connect), 180s(send/read)
  ▼
Backend (FastAPI :8000)
  │ SQLAlchemy Session
  ▼
PostgreSQL :5432
```

### 10.2 MCP 도구 호출 (OpenAI 경유, 핵심 흐름)

```
Step 1: 브라우저 → Backend
  POST /api/chat/messages → nginx → backend:8000

Step 2: Backend → OpenAI
  client.responses.create(
    model="gpt-5",
    input=프롬프트,
    tools=[{type:"mcp", server_url:"https://csid-shopping.duckdns.org/mcp-shopping/mcp/"}]
  )
  → HTTPS → api.openai.com (미국)
  → timeout: 300s(전체), 10s(connect), 240s(read)

Step 3: OpenAI → MCP 서버 (OpenAI가 직접 접속)
  POST https://csid-shopping.duckdns.org/mcp-shopping/mcp/
  → nginx (SSL 종료)
    │ proxy_pass http://mcp-shopping:8002/
    │ proxy_buffering off (스트리밍)
    │ Connection: '' (keep-alive 방지)
    │ chunked_transfer_encoding on
    │ timeout: 180s
  → FastMCP (:8002)
    → tool 실행 (외부 API 호출 or DB 쿼리)
    → 결과 반환

Step 4: OpenAI → Backend (응답 반환)
  response.output_text → JSON 또는 텍스트

Step 5: Backend → 브라우저 (최종 응답)
  SendChatMessageResponse → nginx → 브라우저
```

### 10.3 Nginx 설정 상세

```nginx
# HTTP → HTTPS 리다이렉트
server { listen 80; return 301 https://...; }

# HTTPS 서버
server {
    listen 443 ssl http2;

    # SSL
    ssl_certificate     /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    # Gzip 압축 (text, json, js, css, xml)
    gzip on; gzip_min_length 1024;

    # 성능: sendfile, tcp_nopush, tcp_nodelay, keepalive 65s

    # 라우팅
    /              → try_files (React SPA, HTML5 History fallback)
    /api/*         → backend:8000 (WebSocket 업그레이드 헤더 포함)
    /health        → backend:8000/health
    /mcp-recommend/* → mcp-recommend:8001/ (스트리밍 설정)
    /mcp-shopping/*  → mcp-shopping:8002/ (스트리밍 설정)
    /mcp-statistics/* → mcp-statistics:8003/ (스트리밍 설정)
}
```

**MCP 프록시 스트리밍 설정** (모든 MCP location 공통):
```nginx
proxy_http_version 1.1;
proxy_set_header Connection '';     # keep-alive 방지
proxy_buffering off;                # 응답 버퍼링 비활성화
proxy_cache off;                    # 캐싱 비활성화
chunked_transfer_encoding on;       # 청크 전송 활성화
proxy_connect_timeout 180s;
proxy_send_timeout 180s;
proxy_read_timeout 180s;
```

---

## 11. 에러 처리 및 Fallback 전략

### 11.1 AiOrchestrator 에러 처리 체계

```
AiOrchestrator.generate()
  │
  ├─ 조건: OpenAI API 키 없음 (is_configured == False)
  │  → _fallback_response() 즉시 반환
  │    ├─ 상품 키워드 매칭 → type=1, Mock 추천 (하드코딩 10개 중 랜덤 6개)
  │    ├─ "통계" 키워드 → type=2, "최근 결제 통계 이미지를 첨부해드렸어요."
  │    └─ 기타 → type=0, "현재 서비스 개발중입니다.."
  │
  ├─ 1단계: Intent 분류 실패 (OpenAIErrorWrapper)
  │  → selected_tool = "none" (잡담 fallback)
  │  → 로그: "Tool intent classification failed: ..."
  │
  ├─ 2단계: MCP 워크플로 실패 (OpenAIErrorWrapper)
  │  ├─ platform_search 실패:
  │  │  → "상품 검색 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." (type=0)
  │  ├─ purchase_recommendation 실패:
  │  │  → "개인화 추천 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." (type=0)
  │  └─ statistics_analysis 실패:
  │     → "통계 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." (type=0)
  │
  ├─ 3단계: Smalltalk 실패 (OpenAIErrorWrapper)
  │  → _fallback_response() (최종 Mock)
  │
  └─ 추천 상품 매핑 실패 (빈 목록):
     → RecommendationService.generate_chat_recommendations(limit=6)
       → 10개 하드코딩 상품에서 랜덤 선택
```

### 11.2 OpenAI SDK 에러 래핑

```python
# safe_run() 함수가 모든 OpenAI 호출을 감싸서 통일된 에러 처리:

try:
    client.run_prompt(...)  # 또는 run_prompt_as_json()
except (OpenAIError, json.JSONDecodeError, RuntimeError) as exc:
    logger.exception("OpenAI prompt failed: %s", exc)
    raise OpenAIErrorWrapper("Failed to execute OpenAI prompt", original=exc) from exc
```

### 11.3 타임아웃 설정 요약

| 구간 | 설정 | 값 |
|------|------|-----|
| 브라우저 → nginx | `proxy_read_timeout` | 180s |
| nginx → Backend | `proxy_send_timeout` | 180s |
| Backend → OpenAI | `httpx.Timeout.timeout` | 300s (전체) |
| Backend → OpenAI | `httpx.Timeout.connect` | 10s |
| Backend → OpenAI | `httpx.Timeout.read` | 240s |
| OpenAI → MCP (nginx) | `proxy_read_timeout` | 180s |
| MCP → 외부 API | `requests.timeout` | 15s |

---

## 12. 환경 변수 설정

```env
# ============================================
# Database
# ============================================
POSTGRES_DB=capstone_db
POSTGRES_USER=capstone
POSTGRES_PASSWORD=<비밀번호>
DATABASE_URL=postgresql+psycopg://capstone:<비밀번호>@postgres:5432/capstone_db

# ============================================
# OpenAI
# ============================================
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5                    # AiConfig 기본값: gpt-4.1-mini
OPENAI_REQUEST_TIMEOUT=30

# ============================================
# MCP Server URLs
# OpenAI 서버(미국)가 직접 접근하는 공인 URL
# nginx 리버스 프록시가 각 경로를 해당 MCP 컨테이너로 라우팅
# trailing slash 필수!
# ============================================
MCP_PURCHASE_URL=https://csid-shopping.duckdns.org/mcp-recommend/mcp/
MCP_SEARCH_URL=https://csid-shopping.duckdns.org/mcp-shopping/mcp/
MCP_STATISTICS_URL=https://csid-shopping.duckdns.org/mcp-statistics/mcp/

# Docker Compose 기본값 (MCP URL 미설정 시 내부 통신용):
#   MCP_PURCHASE_URL=http://mcp-recommend:8001/mcp
#   MCP_SEARCH_URL=http://mcp-shopping:8002/mcp
#   MCP_STATISTICS_URL=http://mcp-statistics:8003/mcp
# ⚠ 주의: 내부 URL은 OpenAI가 접근 불가! 반드시 공인 URL 사용

# ============================================
# MCP Tool Names (환경변수로 오버라이드 가능)
# ============================================
MCP_RECOMMEND_TOOL=recommend_products_final_v4
MCP_SEARCH_11ST_TOOL=search_11st_products
MCP_SEARCH_NAVER_TOOL=search_naver_products
MCP_STAT_CATEGORY_TOOL=analyze_category_share
MCP_STAT_PLATFORM_TOOL=analyze_platform_ratio
MCP_STAT_MONTHLY_CATEGORY_TOOL=analyze_monthly_category_trend
MCP_STAT_MONTHLY_PLATFORM_TOOL=analyze_monthly_platform_trend
MCP_STAT_MONTHLY_TOTAL_TOOL=analyze_monthly_total_trend
MCP_STAT_HOURLY_TOOL=analyze_hourly_trend
MCP_STAT_TOP_PRODUCT_TOOL=analyze_top_product

# ============================================
# External Shopping APIs (MCP Shopping 서버에서 사용)
# ============================================
ELEVENST_API_KEY=<11번가 OpenAPI 키>
NAVER_CLIENT_ID=<네이버 개발자 Client ID>
NAVER_CLIENT_SECRET=<네이버 개발자 Client Secret>
```

---

## 13. 보안 및 제한사항

### 현재 보안 수준 (프로토타입)

| 항목 | 상태 | 설명 |
|------|------|------|
| 비밀번호 저장 | 평문 | 해싱 미적용 (`user.password == input_password`) |
| 인증 토큰 | 없음 | JWT 미사용, user_id 직접 전송 |
| API 인증 | 없음 | 모든 API 엔드포인트 인증 없이 접근 가능 |
| CORS | localhost:5173 | 개발 환경만 허용 |
| MCP 서버 | 인증 없음 | 공인 URL로 노출, `require_approval: "never"` |
| HTTPS | 적용됨 | Let's Encrypt SSL, HTTP→HTTPS 리다이렉트 |

### 기능 제한사항

| 항목 | 설명 |
|------|------|
| Frontend API 서비스 | 일부 mock 데이터 반환 (statistics 등) |
| 채팅 세션 | 단일 세션만 지원, 멀티 세션 미구현 |
| 추천 알고리즘 | 전체 카탈로그 in-memory 처리 (대규모 데이터 시 성능 이슈) |
| 실시간 알림 | WebSocket 미사용, 폴링 방식 |
| 파일 업로드 | 미지원 |
| 다국어 | 한국어 전용 |
