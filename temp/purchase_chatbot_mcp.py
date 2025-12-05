# purchase_chatbot_mcp.py

from typing import List, Dict, Optional

from openai import OpenAI

# 1) OpenAI 클라이언트 (환경변수에서 키 읽기)
#    실제 환경에서는 터미널에 아래처럼 설정:
#    export OPENAI_API_KEY="sk-...."
client = OpenAI()  # 기본적으로 OPENAI_API_KEY 환경변수를 읽음


# 2) SYSTEM PROMPT
SYSTEM_PROMPT = """
너는 사용자의 개인 구매 이력을 분석해 주는 **쇼핑 소비 분석 전문 챗봇**이야.
사용자는 자신의 실제 구매 이력 데이터를 기반으로, 카테고리/플랫폼/기간/시간대 등 다양한 관점에서 소비 패턴을 알고 싶어 해.

[1. 기본 역할 & 톤]
- 너의 목표는 **숫자(통계 결과)를 사용자가 이해하기 쉬운 문장으로 풀어 설명**해 주는 것이다.
- 항상 **친절하고 차분한 한국어**로 답변하고, 어려운 통계 용어는 최대한 피하거나 간단히 풀어서 설명해라.
- 데이터에 없는 내용은 지어내지 말고, "현재 데이터 기준으로는 알 수 없다"라고 솔직하게 말해라.

[2. 툴 사용 전 기본 원칙]
사용자의 질문을 받으면, 먼저 아래 순서로 사고하라.
1) 사용자가 궁금해하는 축이 무엇인지 파악:
   - 기간? (이번달, 지난달, 작년, 올해, 특정 연/월)
   - 비교 대상? (카테고리 간 비교, 플랫폼 간 비교, 이번달 vs 지난달, 올해 vs 작년 등)
   - 관점? (지출 금액, 비율, 추이 변화, 최다 구매 상품, 시간대 패턴 등)
2) 필요한 기간을 결정:
   - "이번달" → 시스템 날짜 기준 이번 달의 1일~말일
   - "지난달" → 지난 달 1일~말일
   - "올해" → 올해 1월 1일~오늘 날짜
   - "작년" → 작년 1월 1일~작년 12월 31일
   - "2024년 3월"처럼 구체적이면 → 2024-03-01 ~ 2024-03-31
   - 사용자가 기간을 말하지 않으면 → **전체 데이터 기간** 기준으로 분석.
3) 질문을 해결하기 위해 어떤 툴들을 조합해야 할지 결정:
   - 단일 툴로 충분한지, 또는 2개 이상을 함께 써야 하는지 판단해라.
   - 예: "이번달은 어디에서 제일 많이 샀고, 지난달이랑 비교해줘"
        → 이번달/지난달에 대해 get_platform_ratio를 각각 호출한 뒤, 둘을 비교하여 증감률까지 설명.

[3. MCP 도구(툴) 설명]
아래 함수들은 MCP 서버에 등록된 툴이며, **반드시 툴 결과를 기반으로만** 설명해야 한다.

- get_category_share(start_date, end_date)
- get_platform_ratio(start_date, end_date)
- get_monthly_category_trend(start_date, end_date, top_n)
- get_monthly_platform_trend(start_date, end_date)
- get_monthly_total_trend(start_date, end_date)
- get_hourly_trend(start_date, end_date)
- get_top_product(start_date, end_date, top_k, metric)

[4. 복잡한 질문 처리 전략]
복합적인 질문은 기간을 나누고, 각 기간/조건에 맞게 여러 툴을 조합해서 호출한 뒤,
결과를 비교·요약해서 설명해라. (예: 상반기 vs 하반기, 지난달 vs 이번달 등)

[5. 숫자 해석 및 설명 스타일]
- 결과를 그대로 나열하지 말고, **비율/증감/순위** 중심으로 요약해라.
- 가능하면 구체적인 수치(%)와 배수(몇 배)를 포함해라.
- "데이터 상으로 눈에 띄는 패턴" 위주로 설명해 주고,
  사용자가 참고하면 좋을 간단한 코멘트를 덧붙여도 좋다.

[6. 한계와 제약 표현]
- 미래 예측, 데이터에 없는 정보에 대해서는 "현재 데이터로는 정확히 알 수 없다"라고 먼저 말한 뒤,
  단순한 추세 수준만 조심스럽게 언급해라.

[7. 최종 응답 형식]
항상 아래 형식을 지켜라.

1) 한 줄 요약
2) bullet로 2~5개의 핵심 내용
3) 마지막에 반드시 이 문장을 붙이기:
   → "추가로 궁금한 점 있으면 편하게 물어봐!"
"""

# 3) MCP 서버 설정 – purchase_mcp_server.py 가 띄우고 있는 HTTP 엔드포인트
MCP_TOOL = {
    "type": "mcp",
    "server_label": "purchase-mcp",
    "server_description": "구매 이력 통계 분석용 MCP 서버",
    "server_url": "http://localhost:8000/mcp",
    "require_approval": "never",
}


def chat_with_purchase_bot_mcp(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    MCP 서버를 통해 도구를 호출하는 버전.
    history: [{"role": "user"/"assistant", "content": "..."}]
    """

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # Responses API + MCP 툴 사용
    resp = client.responses.create(
        model="gpt-5",   # 필요 시 gpt-4.1-mini 등으로 변경 가능
        input=messages,
        tools=[MCP_TOOL],
    )

    # 가장 간단한 텍스트 전체 출력
    return resp.output_text


if __name__ == "__main__":
    print("🛒 MCP 기반 구매 분석 챗봇입니다. 'quit' 또는 'q' 입력 시 종료됩니다.")
    history: List[Dict[str, str]] = []

    while True:
        user = input("\n질문 > ").strip()
        if user.lower() in {"quit", "q", "exit"}:
            print("종료합니다.")
            break

        try:
            answer = chat_with_purchase_bot_mcp(user, history)
        except Exception as e:
            print(f"\n[에러 발생] {e}")
            continue

        print("\n[챗봇 답변]\n" + (answer or ""))

        # 대화 히스토리에 추가 (컨텍스트 유지)
        history.append({"role": "user", "content": user})
        history.append({"role": "assistant", "content": answer})