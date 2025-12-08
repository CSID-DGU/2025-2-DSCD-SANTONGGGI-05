# 프롬프트 엔지니어링 문서

이 문서는 쇼핑 비서 서비스에서 사용하는 OpenAI API 프롬프트 전략과 최적화 기법을 설명합니다.

---

## 목차

- [프롬프트 아키텍처](#프롬프트-아키텍처)
- [Tool Intent Classification](#tool-intent-classification)
- [도구별 프롬프트 전략](#도구별-프롬프트-전략)
- [프롬프트 최적화 기법](#프롬프트-최적화-기법)
- [응답 형식 설계](#응답-형식-설계)
- [에러 핸들링 전략](#에러-핸들링-전략)
- [프롬프트 버전 관리](#프롬프트-버전-관리)

---

## 프롬프트 아키텍처

### 전체 프롬프트 시스템 구조

```
사용자 메시지
    ↓
┌─────────────────────────────────────┐
│  Tool Intent Classification Prompt  │
│  (어떤 도구를 사용할지 결정)           │
└────────────┬────────────────────────┘
             ↓
    ┌────────┴────────┐
    ↓                  ↓
┌────────────┐    ┌────────────┐
│ MCP Prompt │ or │Small Talk  │
│ (도구 실행)  │    │   Prompt   │
└────────────┘    └────────────┘
```

### 프롬프트 템플릿 파일

`backend/app/ai/prompt_templates.py`에 모든 프롬프트가 정의되어 있습니다.

```python
def build_tool_selection_prompt(message: str, available_tools: list[str]) -> str:
    """도구 선택 프롬프트"""

def build_purchase_prompt(user_context: dict) -> str:
    """구매 추천 프롬프트"""

def build_platform_search_prompt(query: str) -> str:
    """상품 검색 프롬프트"""

def build_statistics_prompt(stats_data: dict) -> str:
    """통계 분석 프롬프트"""

def build_smalltalk_prompt(message: str) -> str:
    """일반 대화 프롬프트"""
```

---

## Tool Intent Classification

### 목적

사용자 메시지를 **지능적으로 분석**하여 가장 적합한 MCP 도구를 선택합니다. 단순 키워드 매칭이 아닌 **우선순위 기반 의도 파악** 시스템입니다.

### 핵심 철학

본 시스템은 AI가 쿼리를 분석해서 **문맥을 이해하고 판단**합니다:
- ✅ 우선순위 기반 의도 분석
- ✅ 문맥에 따른 동적 해석 (같은 키워드도 문맥에 따라 다르게 해석)
- ✅ 복잡한 엣지 케이스 처리

### 프롬프트 구조 (실제 구현)

실제 `prompt_templates.py:build_tool_selection_prompt`는 다음과 같은 복잡한 로직을 사용합니다:

```python
def build_tool_selection_prompt(user_message: str, *, available_tools: Iterable[str]) -> str:
    """
    우선순위 기반 도구 선택 프롬프트

    1️⃣ statistics_analysis - 과거 소비 데이터 분석
    2️⃣ platform_search - 구체적 상품 실시간 검색
    3️⃣ purchase_recommendation - 개인화 추천
    4️⃣ none - 쇼핑 무관 대화
    """
    return """
    ========== 선택 기준 (우선순위 순) ==========

    1️⃣ statistics_analysis - 과거 소비 데이터 "분석" 요청
       [핵심 의도] 이미 산 것을 분석하고 싶다
       [키워드] 통계, 분석, 얼마, 지출, 소비, 카테고리별, 플랫폼별, 월별, 추이, 패턴

    2️⃣ platform_search - 특정 상품 "실시간 검색"
       [핵심 의도] 지금 살 수 있는 상품을 찾고 싶다
       ⚠️ 중요: 구체적 스펙(용량, 사이즈, 색상)이 있으면 무조건 platform_search

    3️⃣ purchase_recommendation - 개인화 상품 "추천"
       [핵심 의도] 내 취향/구매 이력에 맞는 새로운 상품을 추천받고 싶다

    4️⃣ none - 쇼핑과 무관한 요청

    ========== 혼동 주의 케이스 ==========
    ⚠️ "많이 샀어" vs "많이 살까"
       - "OO 많이 샀어?" → statistics_analysis (과거 분석)
       - "OO 많이 살까?" → purchase_recommendation (미래 추천)

    ⚠️ "추천" 키워드 + 구체적 스펙
       - "생수 추천해줘" → purchase_recommendation (모호함)
       - "500ml 생수 추천해줘" → platform_search (구체적 용량)
       - "2L 생수 6개 추천" → platform_search (구체적 용량+수량)
    """
```

### 우선순위 기반 판단 로직

#### 1️⃣ 최우선: Statistics Analysis
**핵심 판단 기준**: 질문이 **과거(이미 산 것)**에 대한 것인가?

| 쿼리 예시 | 판단 | 이유 |
|---------|------|------|
| "이번달 얼마나 썼어?" | ✅ statistics | 과거 지출 분석 |
| "어느 카테고리에서 제일 많이 샀어?" | ✅ statistics | 과거 구매 패턴 |
| "쿠팡이랑 11번가 중에 어디서 더 많이 샀지?" | ✅ statistics | 플랫폼 비교 분석 |
| "작년이랑 올해 소비 비교해줘" | ✅ statistics | 시계열 비교 |

**키워드**: 통계, 분석, 얼마, 지출, 소비, 카테고리별, 플랫폼별, 월별, 추이, 패턴, 시간대, 많이 샀, 비교

#### 2️⃣ 두 번째: Platform Search
**핵심 판단 기준**: **구체적 상품 스펙**이 포함되어 있는가?

⚠️ **중요**: 구체적 스펙(용량/사이즈/색상/모델명)이 있으면 "추천" 키워드와 무관하게 무조건 platform_search!

| 쿼리 예시 | 판단 | 이유 |
|---------|------|------|
| "다이슨 청소기 찾아줘" | ✅ platform_search | 구체적 브랜드 |
| "아이폰 15 어디가 싸?" | ✅ platform_search | 구체적 모델명 |
| "500ml 생수 추천해줘" | ✅ platform_search | ⚠️ 구체적 용량 스펙 |
| "2L 생수 6개 추천" | ✅ platform_search | ⚠️ 구체적 용량+수량 |
| "나이키 운동화 검색해줘" | ✅ platform_search | 구체적 브랜드 |

**스펙 감지 패턴**:
- 용량: `500ml`, `2L`, `100g`, `1kg` 등
- 사이즈: `XL`, `95`, `32인치` 등
- 색상: `검정색`, `빨간색`, `white` 등
- 모델명: `iPhone 15`, `갤럭시 S24` 등

#### 3️⃣ 세 번째: Purchase Recommendation
**핵심 판단 기준**: 요청이 **모호하고** 개인화된 추천이 필요한가?

| 쿼리 예시 | 판단 | 이유 |
|---------|------|------|
| "뭐 살까?" | ✅ purchase_rec | 완전히 모호함 |
| "나한테 맞는 상품 추천해줘" | ✅ purchase_rec | 개인화 요청 |
| "요즘 뭐가 좋을까" | ✅ purchase_rec | 취향 기반 추천 |
| "주말에 쓸만한 거 있어?" | ✅ purchase_rec | 상황 기반 추천 |
| "저렴한 생수 추천" | ✅ purchase_rec | 모호한 취향 (구체적 스펙 없음) |

#### 4️⃣ 마지막: None (Small Talk)
쇼핑과 무관한 일반 대화

| 쿼리 예시 | 판단 |
|---------|------|
| "안녕!" | ✅ none |
| "고마워" | ✅ none |
| "오늘 날씨 어때?" | ✅ none |

### 복잡한 엣지 케이스 처리

#### 케이스 1: "카테고리" 키워드 - 문맥에 따라 다르게 해석

```
❌ 단순 매칭: "카테고리" → statistics_analysis (틀림!)
✅ 문맥 분석:
  - "식품 카테고리에서 얼마 썼어?" → statistics_analysis (지출 분석)
  - "식품 카테고리 상품 찾아줘" → platform_search (상품 검색)
```

#### 케이스 2: "플랫폼" 키워드 - 문맥에 따라 다르게 해석

```
❌ 단순 매칭: "쿠팡" → platform_search (틀림!)
✅ 문맥 분석:
  - "쿠팡에서 얼마나 샀지?" → statistics_analysis (소비 분석)
  - "쿠팡에서 OO 찾아줘" → platform_search (상품 검색)
```

#### 케이스 3: "추천" 키워드 - 구체성 여부로 판단

```
❌ 단순 매칭: "추천" → purchase_recommendation (틀릴 수 있음!)
✅ 스펙 기반 분석:
  - "생수 추천해줘" → purchase_recommendation (모호함)
  - "500ml 생수 추천해줘" → platform_search (구체적 용량)
  - "2L 생수 6개 추천" → platform_search (구체적 용량+수량)
  - "저렴한 생수 추천" → purchase_recommendation (모호한 취향)
```

#### 케이스 4: 시제 구분 - 과거 vs 미래

```
✅ 시제 분석:
  - "OO 많이 샀어?" → statistics_analysis (과거 분석)
  - "OO 많이 살까?" → purchase_recommendation (미래 추천)
  - "지난달에 뭐 샀지?" → statistics_analysis (과거)
  - "이번주에 뭐 살까?" → purchase_recommendation (미래)
```

### 최종 판단 규칙 (실제 구현)

```
1️⃣ 질문이 과거(이미 산 것)에 대한 것인가?
   → YES: statistics_analysis

2️⃣ 구체적 상품 스펙(용량/사이즈/색상/모델명)이 포함되어 있는가?
   → YES: platform_search ("추천" 키워드와 무관!)

3️⃣ 구체적 브랜드/상품명이 포함되어 있는가?
   → YES: platform_search

4️⃣ 모호한 상황/취향만 있는가?
   → YES: purchase_recommendation

5️⃣ 쇼핑과 무관한가?
   → YES: none
```

### 실제 응답 형식

```json
{
    "selected_tool": "platform_search",
    "reason": "구체적 용량 스펙(500ml)이 포함되어 있어 실시간 검색이 필요"
}
```

### 예시 입력/출력

**예시 1: 스펙 감지**
```
입력: "500ml 생수 추천해줘"
출력: {
    "selected_tool": "platform_search",
    "reason": "구체적 용량 스펙(500ml)이 포함되어 있어 platform_search 선택"
}
```

**예시 2: 과거/미래 구분**
```
입력: "이번달 얼마나 썼어?"
출력: {
    "selected_tool": "statistics_analysis",
    "reason": "과거 지출 내역 분석 요청"
}
```

**예시 3: 모호한 추천**
```
입력: "나한테 맞는 물 추천해줘"
출력: {
    "selected_tool": "purchase_recommendation",
    "reason": "구체적 스펙 없이 개인화된 추천 요청"
}
```

**예시 4: 문맥 기반 해석**
```
입력: "쿠팡에서 얼마나 샀지?"
출력: {
    "selected_tool": "statistics_analysis",
    "reason": "과거 플랫폼별 지출 분석 요청"
}
```

---

## Orchestrator 실행 흐름 (실제 구현)

### 전체 실행 로직

실제 `orchestrator.py:generate` 메서드는 다음과 같은 **우선순위 기반 fallback** 시스템을 사용합니다:

```python
def generate(self, *, user_id: int, message: str) -> AiOrchestratorResult:
    """
    실행 순서:
    1. Tool Intent Classification 실행
    2. 선택된 도구 실행 시도
    3. 실패 시 키워드 기반 fallback
    4. 모든 도구 실패 시 smalltalk
    5. smalltalk도 실패 시 기본 응답
    """
```

### 단계별 실행 흐름

```
┌─────────────────────────────────────────────────┐
│ 1. OpenAI 설정 확인                               │
│    - AI 비활성화 시 → _fallback_response()        │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 2. Tool Intent Classification                   │
│    - build_tool_selection_prompt() 호출          │
│    - AI가 쿼리 분석해서 도구 선택                   │
│    - 실패 시 → selected_tool = "none"            │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 3. 선택된 도구 실행 (우선순위 순)                    │
│    ├─ platform_search → _run_platform_search()  │
│    ├─ purchase_rec → _run_purchase_recommendation() │
│    └─ statistics → _run_statistics_analysis()   │
│    - 실패 시 → 다음 단계로                          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 4. Fallback 1: 키워드 기반 재시도                   │
│    ├─ _should_trigger_statistics() 확인          │
│    │  → statistics MCP 재시도                    │
│    └─ _should_trigger_platform_search() 확인     │
│       → platform_search MCP 재시도               │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 5. Fallback 2: Purchase Recommendation          │
│    - 위 모든 것 실패 시 기본 추천 실행               │
│    - _run_purchase_recommendation()             │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 6. Fallback 3: Small Talk                      │
│    - build_smalltalk_prompt() 호출               │
│    - 가벼운 대화 응답 생성                          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│ 7. Final Fallback: 기본 응답                     │
│    - _fallback_response()                       │
│    - "현재 서비스 개발중입니다" 메시지               │
└─────────────────────────────────────────────────┘
```

### 실제 코드 구현

```python
# orchestrator.py:41-106 (실제 코드)

def generate(self, *, user_id: int, message: str) -> AiOrchestratorResult:
    # 1. AI 비활성화 체크
    if not self._client.is_configured:
        return self._fallback_response(message=message, user_id=user_id)

    # 2. Tool Intent Classification
    selected_tool = "none"
    available_tools = self._available_tool_options()
    if available_tools:
        try:
            intent = self._classify_tool_intent(message, available_tools=available_tools)
            if intent:
                selected_tool = intent.selected_tool
        except OpenAIErrorWrapper as exc:
            logger.warning("Tool intent classification failed: %s", exc)

    # 3. 선택된 도구 실행
    if selected_tool == "platform_search" and self._config.has_search_mcp:
        try:
            return self._run_platform_search(message)
        except OpenAIErrorWrapper as exc:
            logger.warning("Platform search failed: %s", exc)

    if selected_tool == "purchase_recommendation" and self._config.has_purchase_mcp:
        try:
            return self._run_purchase_recommendation(user_id=user_id, limit=5)
        except OpenAIErrorWrapper as exc:
            logger.warning("Purchase MCP failed: %s", exc)

    if selected_tool == "statistics_analysis" and self._config.has_statistics_mcp:
        try:
            return self._run_statistics_analysis(message)
        except OpenAIErrorWrapper as exc:
            logger.warning("Statistics MCP failed: %s", exc)

    # 4. Fallback 1: 키워드 기반 재시도
    if self._should_trigger_statistics(message) and self._config.has_statistics_mcp:
        try:
            return self._run_statistics_analysis(message)
        except OpenAIErrorWrapper as exc:
            logger.warning("Fallback statistics analysis failed: %s", exc)

    if self._should_trigger_platform_search(message) and self._config.has_search_mcp:
        try:
            return self._run_platform_search(message)
        except OpenAIErrorWrapper as exc:
            logger.warning("Fallback platform search failed: %s", exc)

    # 5. Fallback 2: Purchase Recommendation
    if self._config.has_purchase_mcp:
        try:
            return self._run_purchase_recommendation(user_id=user_id, limit=5)
        except OpenAIErrorWrapper as exc:
            logger.warning("Fallback purchase MCP failed: %s", exc)

    # 6. Fallback 3: Small Talk
    try:
        text = safe_run(
            self._client,
            prompt=build_smalltalk_prompt(message),
            expect_json=False,
        )
        if isinstance(text, str):
            return AiOrchestratorResult(ai_message=text, response_type=0)
    except OpenAIErrorWrapper as exc:
        logger.warning("Smalltalk prompt failed: %s", exc)

    # 7. Final Fallback
    return self._fallback_response(message=message, user_id=user_id)
```

### Fallback 키워드 로직

#### Statistics Trigger Keywords
```python
# orchestrator.py:334-337
def _should_trigger_statistics(message: str) -> bool:
    lowered = message.lower()
    trigger_keywords = (
        "통계", "분석", "소비", "지출", "카테고리",
        "플랫폼", "월별", "시간대", "얼마", "많이", "패턴"
    )
    return any(keyword in lowered for keyword in trigger_keywords)
```

#### Platform Search Trigger Keywords
```python
# orchestrator.py:328-331
def _should_trigger_platform_search(message: str) -> bool:
    lowered = message.lower()
    trigger_keywords = ("추천", "찾아줘", "어디서", "상품", "사고싶")
    return any(keyword in lowered for keyword in trigger_keywords)
```

### 에러 처리 전략

각 단계에서 `OpenAIErrorWrapper` 예외를 캐치하고 다음 fallback으로 넘어갑니다:

```python
try:
    return self._run_platform_search(message)
except OpenAIErrorWrapper as exc:
    logger.warning("Platform search failed: %s", exc)
    # 다음 단계로 자동 진행
```

**주요 에러 시나리오:**
- MCP 서버 응답 실패 (424 Failed Dependency)
- OpenAI API 타임아웃
- JSON 파싱 실패
- 네트워크 오류

### Graceful Degradation 예시

```
사용자 쿼리: "500ml 생수 추천해줘"

1. Tool Selection → platform_search 선택
2. platform_search MCP 호출 → 실패 (424 에러)
3. Fallback 1: 키워드 체크 ("추천") → platform_search 재시도 → 실패
4. Fallback 2: purchase_recommendation 실행 → 성공!
   → 사용자는 실시간 검색 대신 개인화 추천을 받음

최종 결과: 서비스 중단 없이 차선책 제공
```

### 응답 타입 (Response Type)

```python
# types.py
class AiOrchestratorResult:
    ai_message: str              # AI 생성 메시지
    response_type: int           # 0=대화, 1=상품, 2=통계
    recommendation_items: list   # 추천 상품 리스트 (type=1)
```

**Type 매핑:**
- `0`: 일반 대화 (smalltalk, 에러 메시지)
- `1`: 상품 추천/검색 결과 (platform_search, purchase_recommendation)
- `2`: 통계 분석 결과 (statistics_analysis)

---

## 도구별 프롬프트 전략

### 1. Purchase Recommendation Prompt

**목적**: 사용자 구매 이력을 바탕으로 자연스러운 추천 메시지 생성

#### 프롬프트 구조

```python
def build_purchase_prompt(user_context: dict) -> str:
    return f"""
당신은 전문 쇼핑 어드바이저입니다.
사용자의 구매 이력을 분석하여 맞춤형 상품을 추천하세요.

사용자 정보:
- 유저 ID: {user_context['user_id']}
- 최근 구매 카테고리: {user_context['recent_categories']}
- 평균 구매 가격대: {user_context['avg_price']}원
- 선호 플랫폼: {user_context['preferred_platforms']}

추천할 상품 정보:
{format_recommendations(user_context['recommendations'])}

추천 메시지 작성 가이드:
1. 친근하고 자연스러운 톤 사용
2. 절약률이 높은 상품 강조
3. 평점과 리뷰가 좋은 상품 언급
4. 플랫폼별 특징 간략히 소개
5. 2-3문장으로 간결하게

예시:
"최근 생수를 자주 구매하시는 것 같아요! 쿠팡에서 2L 6병 세트가 15% 할인 중이고,
평점 4.8로 리뷰도 좋아요. 네이버쇼핑 상품도 비슷한 가격대인데 배송비가 무료예요."
"""
```

#### 핵심 전략

1. **개인화**
   - 사용자 구매 이력 컨텍스트 제공
   - "최근 {카테고리}를 자주 구매하시는 것 같아요" 패턴

2. **가치 강조**
   - 절약률 명시 ("15% 할인")
   - 리뷰 점수 언급 ("평점 4.8")
   - 추가 혜택 강조 ("배송비 무료")

3. **비교 제공**
   - 여러 플랫폼 옵션 제시
   - 가격 vs 품질 트레이드오프 설명

---

### 2. Platform Search Prompt

**목적**: 검색 쿼리를 자연어로 풀어서 상품 정보 제공

#### 프롬프트 구조

```python
def build_platform_search_prompt(query: str) -> str:
    return f"""
당신은 쇼핑 검색 전문가입니다.
사용자가 찾는 상품을 여러 플랫폼에서 검색한 결과를 요약하세요.

검색 키워드: "{query}"

검색 결과:
{format_search_results(results)}

응답 가이드:
1. 검색 결과를 2-3개 플랫폼으로 그룹화
2. 가격 범위 및 평균가 언급
3. 베스트 옵션 1-2개 추천
4. 가격 외 차별점 언급 (배송, 리뷰 등)

예시:
"'{query}'로 검색한 결과, 쿠팡에 12,000~15,000원대 상품이 많고,
11번가는 조금 더 저렴한 10,000원대도 있어요.
베스트는 쿠팡의 △△ 상품(12,800원)으로 평점 4.9에 리뷰 500개 이상이에요!"
"""
```

#### 핵심 전략

1. **결과 요약**
   - 플랫폼별 가격 범위 제시
   - 평균가 계산 및 언급

2. **베스트 픽 추천**
   - 가성비 최고 상품 1개
   - 프리미엄 옵션 1개

3. **추가 정보 제공**
   - 배송 정보
   - 리뷰 신뢰도
   - 재고 상황

---

### 3. Statistics Prompt (실제 구현)

**목적**: MCP 도구를 활용한 **구매 이력 심층 분석** 및 인사이트 제공

⚠️ **중요**: 이 프롬프트는 데이터를 직접 받는 것이 아니라, **MCP 도구를 호출하도록 AI를 유도**합니다.

#### 실제 프롬프트 구조 (prompt_templates.py:141-229)

실제 코드에서는 매우 상세하고 복잡한 시스템 프롬프트를 사용합니다:

```python
def build_statistics_prompt() -> str:
    """
    System prompt for statistics analysis chatbot.

    - AI가 사용자 질문을 분석해서 적절한 MCP 도구 선택
    - 기간 추론 로직 (이번달, 지난달, 올해, 작년 등)
    - 복합 질문 처리 (비교, 추이 분석 등)
    - 구조화된 응답 형식 강제
    """
```

**주요 섹션:**
1. **역할 정의**: "쇼핑 소비 분석 전문 챗봇"
2. **기본 원칙**: 툴 사용 전 사고 과정 (기간/비교/관점 파악)
3. **MCP 도구 설명**: 7개 분석 도구 상세 설명
4. **복잡한 질문 처리**: 복합 질문을 여러 도구 조합으로 해결
5. **응답 형식**: 구조화된 형식 강제 (📊/📋/💬 섹션)

#### 핵심 전략 (실제 구현)

1. **MCP 도구 중심 분석**
   ```
   ❌ 데이터를 직접 받지 않음
   ✅ AI가 사용자 질문을 분석해서 적절한 MCP 도구 선택 및 호출
   ✅ 도구 결과를 기반으로 자연어 설명 생성
   ```

2. **기간 추론 로직**
   ```
   "이번달" → 시스템 날짜 기준 이번 달 1일~말일
   "지난달" → 지난 달 1일~말일
   "올해" → 올해 1월 1일~오늘
   "작년" → 작년 1월 1일~12월 31일
   "2024년 3월" → 2024-03-01 ~ 2024-03-31
   기간 없음 → 전체 데이터 기간
   ```

3. **사용 가능한 MCP 도구 (7개)**
   ```python
   # 카테고리/플랫폼 비중
   - analyze_category_share(start_date, end_date)
   - analyze_platform_ratio(start_date, end_date)

   # 월별 추이
   - analyze_monthly_category_trend(start_date, end_date, top_n)
   - analyze_monthly_platform_trend(start_date, end_date)
   - analyze_monthly_total_trend(start_date, end_date)

   # 시간대/상품
   - analyze_hourly_trend(start_date, end_date)
   - analyze_top_product(start_date, end_date, top_k, metric)
   ```

4. **복합 질문 처리 전략**
   ```
   질문: "이번달은 어디에서 제일 많이 샀고, 지난달이랑 비교해줘"

   AI 사고 과정:
   1. 두 기간 파악: 이번달 vs 지난달
   2. 필요한 분석: 플랫폼별 지출
   3. 도구 조합:
      - analyze_platform_ratio(이번달)
      - analyze_platform_ratio(지난달)
   4. 결과 비교 및 증감률 계산
   5. 자연어 설명 생성
   ```

5. **구조화된 응답 형식 (강제)**
   ```
   📊 **[한 줄 요약]**
   기간, 총액, 주요 카테고리/플랫폼을 한 문장으로 요약

   (빈 줄)

   📋 **[핵심 내용]**

   • **기간·총액**:
   분석 기간과 총 지출액

   • **카테고리별**:
   상위 카테고리 비중과 금액 (비율 내림차순)

   • **플랫폼별**:
   상위 플랫폼 비중과 금액 (비율 내림차순)

   • **시간대별** (있는 경우):
   주요 구매 시간대 패턴

   • **주요 상품** (있는 경우):
   금액 기준 상위 3개 상품

   (빈 줄)

   💬 추가로 궁금한 점 있으면 편하게 물어봐!
   ```

6. **객관적이고 친절한 톤**
   - 판단하지 않고 사실 전달
   - 숫자를 비율/증감/순위 중심으로 설명
   - "~인 것 같아요", "~해보시는 건 어떨까요?" 같은 부드러운 표현

#### 실제 실행 흐름 예시

**사용자 질문:** "이번달 얼마나 썼어?"

**AI 실행 과정:**
```
1. 기간 파악: "이번달" → 2024-12-01 ~ 2024-12-31

2. 필요한 분석 판단:
   - 총 지출액 (필수)
   - 카테고리별 지출 (선택)
   - 플랫폼별 지출 (선택)

3. MCP 도구 호출:
   - analyze_monthly_total_trend("2024-12-01", "2024-12-31")
   - analyze_category_share("2024-12-01", "2024-12-31")
   - analyze_platform_ratio("2024-12-01", "2024-12-31")

4. 응답 생성 (구조화된 형식):
   📊 이번달 총 지출액은 약 35만원으로, 식품 카테고리에서 가장 많이 쓰셨어요.

   📋 [핵심 내용]
   • 기간·총액: 2024년 12월 1일~31일, 347,230원
   • 카테고리별: 식품 52.3% (181,500원), 생활용품 28.1% (97,550원)
   • 플랫폼별: 쿠팡 61.2% (212,500원), 11번가 23.4% (81,230원)

   💬 추가로 궁금한 점 있으면 편하게 물어봐!
```

#### 복합 질문 예시

**사용자 질문:** "올해랑 작년 소비 패턴 비교해줘"

**AI 실행 과정:**
```
1. 두 기간 파악:
   - 올해: 2024-01-01 ~ 2024-12-31
   - 작년: 2023-01-01 ~ 2023-12-31

2. 각 기간별로 도구 호출:
   - analyze_category_share(올해)
   - analyze_category_share(작년)
   - analyze_platform_ratio(올해)
   - analyze_platform_ratio(작년)

3. 비교 분석:
   - 총액 증감: +15% (250만 → 287.5만)
   - 카테고리 변화: 식품 비중 증가 (45% → 52%)
   - 플랫폼 변화: 쿠팡 점유율 증가 (50% → 61%)

4. 응답 생성 (비교 중심)
```

---

### 4. Small Talk Prompt

**목적**: AI 어시스턴트로서 자연스러운 대화 유지

#### 프롬프트 구조

```python
def build_smalltalk_prompt(message: str) -> str:
    return f"""
당신은 친근한 쇼핑 비서입니다.
사용자와 자연스러운 대화를 나누세요.

사용자 메시지: "{message}"

응답 가이드:
1. 짧고 친근한 톤 (1-2문장)
2. 쇼핑과 관련된 컨텍스트 유지
3. 필요시 추천이나 검색 제안
4. 이모지 적절히 사용 (최대 1-2개)

예시:
사용자: "안녕!"
어시스턴트: "안녕하세요! 😊 오늘은 어떤 상품을 찾으시나요?"

사용자: "고마워"
어시스턴트: "천만에요! 더 필요한 게 있으면 언제든 말씀해주세요."

사용자: "심심해"
어시스턴트: "그럼 요즘 인기 상품을 보여드릴까요? 아니면 특별한 할인 정보를 찾아볼까요?"
"""
```

#### 핵심 전략

1. **짧고 간결**
   - 1-2문장 제한
   - 불필요한 정보 배제

2. **컨텍스트 유지**
   - 항상 쇼핑 관련 응답
   - 다음 액션 자연스럽게 유도

3. **친근함**
   - 이모지 사용
   - 존댓말 일관성

---

## 프롬프트 최적화 기법

### 1. Few-Shot Learning

도구 선택이 애매한 경우 예시를 제공하여 정확도 향상:

```python
examples = """
예시 1:
사용자: "물 추천해줘"
선택: purchase_recommendation
이유: 명확한 추천 요청

예시 2:
사용자: "쿠팡에서 물 가격 어때?"
선택: platform_search
이유: 특정 플랫폼 검색 요청

예시 3:
사용자: "이번 달 얼마나 썼어?"
선택: statistics_analysis
이유: 지출 통계 조회

예시 4:
사용자: "오늘 날씨 어때?"
선택: none
이유: 쇼핑과 무관한 대화
"""
```

### 2. Chain-of-Thought

복잡한 분석 시 단계별 사고 유도:

```python
def build_analysis_prompt(data: dict) -> str:
    return f"""
다음 단계로 분석하세요:

1단계: 데이터 요약
- 총 지출: {data['total']}원
- 주문 수: {data['orders']}건

2단계: 패턴 인식
- 어떤 카테고리에 가장 많이 지출?
- 어떤 플랫폼을 선호?

3단계: 비교 분석
- 이전 기간 대비 증감 추이
- 평균 대비 현재 위치

4단계: 인사이트 도출
- 주요 발견 사항
- 개선 기회

5단계: 조언 생성
- 구체적 액션 아이템 2-3개
"""
```

### 3. 토큰 최적화

불필요한 토큰 사용 줄이기:

**Before:**
```python
f"""
당신은 매우 친절하고 전문적인 쇼핑 어시스턴트입니다.
사용자에게 최고의 쇼핑 경험을 제공하는 것이 목표입니다.
항상 정확하고 유용한 정보를 제공해야 합니다.
...
"""
```

**After:**
```python
f"""
쇼핑 어시스턴트로서 정확하고 유용한 추천을 제공하세요.
"""
```

### 4. 동적 컨텍스트 조정

필요한 정보만 포함:

```python
def build_context(user_id: int, include_history: bool = False):
    context = {
        "user_id": user_id,
        "preferences": get_user_preferences(user_id)
    }

    # 추천 시에만 구매 이력 포함 (토큰 절약)
    if include_history:
        context["purchase_history"] = get_purchase_history(user_id, limit=5)

    return context
```

---

## 응답 형식 설계

### JSON 구조화 응답

MCP 도구 결과를 포함한 응답:

```typescript
interface AiOrchestratorResult {
    ai_message: string;           // AI 생성 메시지
    type: 0 | 1 | 2;              // 응답 유형
    recommendationItems?: Product[];  // 추천 상품 (type=1)
    statisticsData?: Statistics;      // 통계 데이터 (type=2)
}

// Type 0: 일반 대화
{
    "ai_message": "안녕하세요! 무엇을 도와드릴까요?",
    "type": 0
}

// Type 1: 상품 추천
{
    "ai_message": "최근 생수를 자주 구매하시는 것 같아요...",
    "type": 1,
    "recommendationItems": [...]
}

// Type 2: 통계 분석
{
    "ai_message": "지난 30일간 총 150,000원을 지출하셨네요...",
    "type": 2,
    "statisticsData": {...}
}
```

### 에러 응답

```typescript
interface ErrorResponse {
    ai_message: string;
    type: 0;
    error?: {
        code: string;
        message: string;
    };
}

// 예시
{
    "ai_message": "죄송해요, 일시적인 문제로 추천을 불러올 수 없어요. 잠시 후 다시 시도해주세요.",
    "type": 0,
    "error": {
        "code": "MCP_UNAVAILABLE",
        "message": "Recommendation MCP server is temporarily unavailable"
    }
}
```

---

## 에러 핸들링 전략

### 1. Graceful Degradation

MCP 실패 시 점진적 품질 저하:

```python
try:
    # MCP 도구 사용
    result = mcp_client.get_recommendations(user_id)
    message = generate_rich_message(result)
except MCPError:
    # Fallback: 데이터베이스 직접 조회
    result = db.get_basic_recommendations(user_id)
    message = generate_simple_message(result)
```

### 2. 사용자 친화적 에러 메시지

기술적 에러를 자연스러운 메시지로 변환:

```python
ERROR_MESSAGES = {
    "MCP_TIMEOUT": "죄송해요, 추천을 불러오는 데 시간이 좀 걸리네요. 잠시만 기다려주세요!",
    "MCP_UNAVAILABLE": "일시적으로 추천 기능을 사용할 수 없어요. 대신 최근 인기 상품을 보여드릴게요!",
    "DATABASE_ERROR": "데이터를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
    "OPENAI_ERROR": "AI 분석 중 문제가 발생했어요. 기본 정보를 제공해드릴게요."
}
```

### 3. 재시도 로직

```python
@retry(max_attempts=3, backoff=exponential)
async def generate_with_retry(prompt: str):
    try:
        return await openai_client.create_completion(prompt)
    except RateLimitError:
        await asyncio.sleep(1)
        raise
    except APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise
```

---

## 프롬프트 버전 관리

### 버전 관리 전략

```python
# prompt_templates.py

PROMPT_VERSION = "2.1.0"

PROMPTS = {
    "v2.1.0": {
        "tool_selection": """...""",
        "purchase": """...""",
        "search": """...""",
        "statistics": """...""",
    },
    "v2.0.0": {
        # 이전 버전 보존
    }
}

def get_prompt(prompt_type: str, version: str = PROMPT_VERSION):
    return PROMPTS[version][prompt_type]
```

### A/B 테스트

```python
def get_prompt_variant(user_id: int):
    # 사용자 ID 기반 A/B 테스트
    variant = "A" if user_id % 2 == 0 else "B"

    if variant == "A":
        # 기존 프롬프트
        return build_purchase_prompt_v1()
    else:
        # 새로운 프롬프트
        return build_purchase_prompt_v2()
```

### 성능 모니터링

```python
# 프롬프트 성능 로깅
logger.info({
    "prompt_version": "2.1.0",
    "prompt_type": "purchase",
    "user_id": user_id,
    "response_time": response_time,
    "token_usage": token_count,
    "user_satisfaction": feedback_score
})
```

---

## 프롬프트 테스트

### 단위 테스트

```python
def test_tool_selection_prompt():
    message = "나한테 맞는 물 추천해줘"
    result = classify_tool_intent(message)

    assert result.selected_tool == "purchase_recommendation"
    assert result.confidence > 0.8

def test_statistics_prompt():
    stats = {"total_spending": 150000, ...}
    response = generate_statistics_analysis(stats)

    assert "150,000원" in response
    assert len(response.split()) < 200  # 길이 제한
```

### 평가 메트릭

```python
# 프롬프트 품질 평가
metrics = {
    "accuracy": 0.92,        # 의도 분류 정확도
    "relevance": 0.88,       # 응답 관련성
    "coherence": 0.95,       # 응답 일관성
    "conciseness": 0.85,     # 간결성
    "avg_token_usage": 450   # 평균 토큰 사용
}
```

---

## 모범 사례

### Do's ✅

1. **명확한 지시사항**
   ```python
   "다음 형식으로 응답하세요: {...}"
   ```

2. **구체적인 예시 제공**
   ```python
   "예시: '최근 생수를 자주 구매하시는 것 같아요...'"
   ```

3. **길이 제한**
   ```python
   "2-3문장으로 간결하게"
   ```

4. **톤 명시**
   ```python
   "친근하고 자연스러운 톤 사용"
   ```

5. **컨텍스트 제공**
   ```python
   "사용자 구매 이력: {...}"
   ```

### Don'ts ❌

1. **모호한 지시**
   ```python
   # ❌
   "좋은 응답을 생성하세요"

   # ✅
   "2-3문장으로 상품의 장점과 가격을 언급하여 추천하세요"
   ```

2. **과도한 정보**
   ```python
   # ❌
   전체 구매 이력 1000건 포함

   # ✅
   최근 5건의 구매 이력만 포함
   ```

3. **긴 프롬프트**
   ```python
   # ❌
   3000 토큰의 상세한 설명

   # ✅
   500 토큰의 핵심 지시사항
   ```

4. **불필요한 반복**
   ```python
   # ❌
   "매우 친절하고, 매우 정확하고, 매우 유용하게..."

   # ✅
   "친절하고 정확한 추천을 제공하세요"
   ```

---

## 향후 개선 사항

### 계획된 최적화

- [ ] **프롬프트 캐싱**: 반복되는 시스템 프롬프트 캐싱
- [ ] **동적 예시 선택**: 사용자 컨텍스트에 맞는 Few-Shot 예시
- [ ] **멀티모달 지원**: 이미지 기반 상품 검색 프롬프트
- [ ] **개인화 강화**: 사용자별 프롬프트 튜닝
- [ ] **A/B 테스트 자동화**: 프롬프트 성능 자동 비교

### 실험 중인 기법

- **메타 프롬프트**: 프롬프트를 개선하는 프롬프트
- **자가 평가**: AI가 자신의 응답 품질 평가
- **반복 정제**: 초기 응답 → 피드백 → 개선된 응답

---

## 참고 자료

### OpenAI 공식 문서
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Best Practices](https://platform.openai.com/docs/guides/best-practices)

### 유용한 자료
- [Anthropic's Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Prompt Engineering Techniques](https://www.promptingguide.ai/)

---

## 문의 및 개선 제안

프롬프트 관련 개선 아이디어나 문제점은 이슈로 등록해주세요.
