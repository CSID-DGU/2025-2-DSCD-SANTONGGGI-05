import json
from collections import defaultdict
from datetime import datetime
import locale

# 참고: 월, 시간 정렬을 위해 로케일 설정 
## --- 0. 공통 헬퍼 함수 ---

def get_total_price(record):
    """레코드에서 총 가격을 안전하게 계산"""
    try:
        # 1. total_price 키가 있는지 확인
        total_price = record.get('total_price')
        if total_price is not None:
            return float(total_price)
        
        # 2. price * quantity 계산
        price = float(record.get('price', 0))
        quantity = float(record.get('quantity', 0))
        return price * quantity
    except (ValueError, TypeError, AttributeError):
        # 숫자로 변환 실패 시 0 반환
        return 0.0

def get_month_key(date_str):
    """'YYYY-MM-DDTHH:MM:SS' -> 'YYYY-MM' (월) 키로 변환"""
    try:
        dt = datetime.fromisoformat(date_str)
        return dt.strftime("%Y-%m")
    except (ValueError, TypeError):
        return None

def get_hour_key(date_str):
    """'YYYY-MM-DDTHH:MM:SS' -> 'H시' (시간) 키로 변환"""
    try:
        dt = datetime.fromisoformat(date_str)
        return f"{dt.hour}시"
    except (ValueError, TypeError):
        return None

## --- 1. 탭 1: 카테고리 분석 ---

def get_category_share(records):
    """API 1: 카테고리별 지출 비율 (Pie/Bar 차트용)"""
    share_map = defaultdict(float)
    for r in records:
        cat = r.get("category") or "기타"
        share_map[cat] += get_total_price(r)

    # Nivo 형식으로 변환 및 정렬
    output = [
        {"id": cat, "label": cat, "value": round(total, 2)}
        for cat, total in share_map.items()
    ]
    output.sort(key=lambda x: x["value"], reverse=True)
    return output

def get_monthly_category_trend(records, top_n=5):
    """API 2: 카테고리별 월별 추이 (Line 차트용)"""
    
    # 1. Top N 카테고리 추출
    cat_totals = defaultdict(float)
    for r in records:
        cat = r.get("category") or "기타"
        cat_totals[cat] += get_total_price(r)
    
    sorted_cats = sorted(cat_totals.keys(), key=lambda k: cat_totals[k], reverse=True)
    top_cats = set(sorted_cats[:top_n])
    include_others = len(sorted_cats) > top_n

    # 2. (카테고리, 월)로 집계
    series_map = defaultdict(lambda: defaultdict(float))
    all_months = set()
    
    for r in records:
        month_key = get_month_key(r.get("purchase_date"))
        if not month_key:
            continue
        all_months.add(month_key)
        
        raw_cat = r.get("category") or "기타"
        cat = raw_cat if raw_cat in top_cats else ("기타" if include_others else raw_cat)
        
        series_map[cat][month_key] += get_total_price(r)

    # 3. X축(월) 도메인 정렬
    month_domain = sorted(list(all_months))

    # 4. Nivo 라인 시리즈 변환
    output = []
    for cat, month_map in series_map.items():
        points = [
            {"x": month, "y": round(month_map.get(month, 0), 2)}
            for month in month_domain
        ]
        output.append({"id": cat, "data": points})

    # 5. 보기 좋게 정렬 (Top N 우선, 기타 맨 뒤)
    output.sort(key=lambda x: (
        1 if x["id"] == "기타" else 0,
        sorted_cats.index(x["id"]) if x["id"] in sorted_cats else top_n
    ))
    return output

## --- 2. 탭 2: 플랫폼 분석 ---

def get_platform_ratio(records):
    """API 3: 플랫폼별 지출 비율 (Pie 차트용)"""
    share_map = defaultdict(float)
    for r in records:
        platform = r.get("platform") or "기타"
        share_map[platform] += get_total_price(r)

    # Nivo 형식으로 변환 및 정렬
    output = [
        {"id": p, "label": p, "value": round(total, 2)}
        for p, total in share_map.items()
    ]
    output.sort(key=lambda x: x["value"], reverse=True)
    return output

def get_monthly_platform_trend(records):
    """API 4: 플랫폼별 월별 추이 (Line 차트용)"""
    series_map = defaultdict(lambda: defaultdict(float))
    all_months = set()
    
    for r in records:
        month_key = get_month_key(r.get("purchase_date"))
        if not month_key:
            continue
        all_months.add(month_key)
        
        platform = r.get("platform") or "기타"
        series_map[platform][month_key] += get_total_price(r)

    month_domain = sorted(list(all_months))

    # Nivo 라인 시리즈 변환
    output = []
    for platform, month_map in series_map.items():
        points = [
            {"x": month, "y": round(month_map.get(month, 0), 2)}
            for month in month_domain
        ]
        output.append({"id": platform, "data": points})
        
    return output

## --- 3. 탭 3: 소비 패턴 분석 ---

def get_hourly_trend(records):
    """API 5: 시간대별 소비 추이 (Line 차트용)"""
    hours_map = defaultdict(float)
    for r in records:
        hour_key = get_hour_key(r.get("purchase_date"))
        if not hour_key:
            continue
        hours_map[hour_key] += get_total_price(r)

    # X축(시간) 도메인 생성 (0시 ~ 23시)
    hour_domain = [f"{h}시" for h in range(24)]
    
    # Nivo 형식 변환
    points = [
        {"x": hour, "y": round(hours_map.get(hour, 0), 2)}
        for hour in hour_domain
    ]
    return [{"id": "시간대별", "data": points}]

def get_monthly_total_trend(records):
    """API 6: 월별 총 소비 추이 (Line 차트용)"""
    months_map = defaultdict(float)
    for r in records:
        month_key = get_month_key(r.get("purchase_date"))
        if not month_key:
            continue
        months_map[month_key] += get_total_price(r)

    month_domain = sorted(months_map.keys())

    # Nivo 형식 변환
    points = [
        {"x": month, "y": round(months_map[month], 2)}
        for month in month_domain
    ]
    return [{"id": "월별 총액", "data": points}]


# --- 메인 실행 (테스트용) ---
"""
if __name__ == "__main__":
    # 이 스크립트가 잘 작동하는지 테스트합니다.
    
    DATA_FILE = "Purchase_ToyDataset.json"
    
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            all_records = json.load(f)
        
        print(f" '{DATA_FILE}' 로드 성공 (총 {len(all_records)}개 레코드)")
        
        # --- API 1 테스트 ---
        print("\n--- API 1: 카테고리 비율 ---")
        api1_output = get_category_share(all_records)
        print(json.dumps(api1_output[:3], indent=2, ensure_ascii=False)) # 상위 3개만 출력
        
        # --- API 2 테스트 ---
        print("\n--- API 2: 카테고리별 월별 추이 ---")
        api2_output = get_monthly_category_trend(all_records, top_n=3)
        print(json.dumps(api2_output, indent=2, ensure_ascii=False))
        
        # --- API 5 테스트 ---
        print("\n--- API 5: 시간대별 추이 ---")
        api5_output = get_hourly_trend(all_records)
        # 시간대별 데이터는 너무 기므로, 13시~15시 데이터만 잠시 확인
        print([d for d in api5_output[0]['data'] if d['x'] in ['13시', '14시', '15시']])

    except FileNotFoundError:
        print(f"🚨 에러: '{DATA_FILE}'을 찾을 수 없습니다.")
    except Exception as e:
        print(f"🚨 에러 발생: {e}")
"""

