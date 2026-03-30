# n8n 가격 모니터링 통합 구현 계획

> 장바구니 상품의 가격 변동을 자동 감지하여 사용자에게 알려주는 기능

---

## 개요

n8n 워크플로우가 매일 1회 장바구니 상품의 네이버 최저가를 조회하고,
가격이 변하면 백엔드 webhook을 호출하여 알림을 DB에 저장한다.
프론트엔드 장바구니 페이지에서 "500원 내렸어요!" 같은 뱃지로 표시.

### 데이터 흐름

```
[n8n: Cron 하루 1회]
  → [PostgreSQL: cart_items에서 상품 목록 조회]
  → [Loop: 상품마다]
    → [Naver Shopping API: 현재 최저가 조회]
    → [IF: 가격 변동 감지?]
      → Yes: [POST http://backend:8000/api/price-alerts/webhook]
             → Backend가 price_alerts 테이블에 저장
      → No: 다음 상품으로
```

### 아키텍처 패턴

- **외부 감지**: 폴링(Cron) — 11번가/네이버가 가격변동 webhook을 제공하지 않으므로
- **내부 전달**: 이벤트 드리븐(webhook) — n8n이 변동 감지 시 Backend webhook 호출
- **프론트 표시**: 장바구니 로드 시 폴링으로 알림 조회

---

## Phase 1: Backend (DB + API)

### 1-1. PriceAlert ORM 모델

**파일**: `backend/app/db/models.py`

```python
class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id            : BigInteger PK autoincrement
    user_id       : BigInteger FK(users.id, CASCADE)
    product_id    : BigInteger
    product_name  : String(255) nullable
    old_price     : Numeric(10,2)
    new_price     : Numeric(10,2)
    price_diff    : Numeric(10,2)   # new - old (음수=하락, 양수=상승)
    is_read       : Boolean default=False
    created_at    : DateTime(tz) default=now(utc)

    user → relationship(back_populates="price_alerts")
```

User 모델에 `price_alerts` relationship 추가 필요.

### 1-2. Pydantic 스키마

**파일 (신규)**: `backend/app/models/price_alert.py`

| 스키마 | 용도 |
|--------|------|
| `PriceAlertWebhookRequest` | n8n webhook 요청 바디 (user_id, product_id, product_name, old_price, new_price, price_diff) |
| `PriceAlertOut` | API 응답용 (위 필드 + id, is_read, created_at) |
| `PriceAlertListResponse` | `{ alerts: list[PriceAlertOut] }` |
| `PriceAlertOperationResult` | `{ success: bool, message: str }` |

### 1-3. Service

**파일 (신규)**: `backend/app/services/price_alert_service.py`

| 메서드 | 기능 |
|--------|------|
| `create_alert(db, payload)` | PriceAlert 레코드 생성 |
| `list_unread_alerts(db, user_id)` | is_read=False인 알림 목록 반환 |
| `mark_as_read(db, alert_id)` | 알림 읽음 처리 |

### 1-4. API Router

**파일 (신규)**: `backend/app/api/price_alerts.py`

| Method | Path | 호출자 | 설명 |
|--------|------|--------|------|
| POST | `/price-alerts/webhook` | n8n | 가격 변동 알림 생성 |
| GET | `/price-alerts?user_id=N` | Frontend | 미읽은 알림 조회 |
| PUT | `/price-alerts/{alert_id}/read` | Frontend | 알림 읽음 처리 |

### 1-5. 등록

- `backend/app/models/__init__.py` → import/export 추가
- `backend/app/services/__init__.py` → import/export 추가
- `backend/app/main.py` → `price_alerts_router` include 추가

---

## Phase 2: Infrastructure

### 2-1. docker-compose.yml — n8n 컨테이너 추가

```yaml
n8n:
  image: n8nio/n8n:latest
  container_name: shopping-n8n
  expose:
    - "5678"
  environment:
    - N8N_HOST=csid-shopping.duckdns.org
    - N8N_PORT=5678
    - N8N_PROTOCOL=https
    - WEBHOOK_URL=https://csid-shopping.duckdns.org/n8n/
    - N8N_PATH=/n8n/
    - N8N_BASIC_AUTH_ACTIVE=true
    - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
    - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-changeme}
    - GENERIC_TIMEZONE=Asia/Seoul
    - TZ=Asia/Seoul
    - NAVER_CLIENT_ID=${NAVER_CLIENT_ID}
    - NAVER_CLIENT_SECRET=${NAVER_CLIENT_SECRET}
    - DB_TYPE=postgresdb
    - DB_POSTGRESDB_HOST=postgres
    - DB_POSTGRESDB_PORT=5432
    - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
    - DB_POSTGRESDB_USER=${POSTGRES_USER}
    - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
  volumes:
    - n8n_data:/home/node/.n8n
  depends_on:
    postgres:
      condition: service_healthy
  restart: unless-stopped
  networks:
    - shopping-network
```

- `volumes:` 섹션에 `n8n_data:` 추가
- `nginx` 서비스 `depends_on`에 `n8n` 추가

### 2-2. nginx.conf — /n8n/ 라우팅

```nginx
location /n8n/ {
    proxy_pass http://n8n:5678/n8n/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
    client_max_body_size 16m;
}
```

### 2-3. .env 추가 변수

```env
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<비밀번호>
```

---

## Phase 3: n8n 워크플로우 (UI에서 구성)

배포 후 `https://csid-shopping.duckdns.org/n8n/` 에서 수동 생성.

### 워크플로우: "Price Monitor"

| # | 노드 타입 | 설정 |
|---|-----------|------|
| 1 | **Schedule Trigger** | 매일 09:00 KST (00:00 UTC) |
| 2 | **PostgreSQL** | `SELECT DISTINCT product_id, user_id, name, price, platform_name FROM cart_items WHERE name IS NOT NULL AND name != ''` |
| 3 | **SplitInBatches** | batch size = 1 |
| 4 | **HTTP Request** | GET `https://openapi.naver.com/v1/search/shop.json` / query=`{{$json.name}}`, display=5, sort=sim / Headers: X-Naver-Client-Id, X-Naver-Client-Secret |
| 5 | **Set** | `naver_price` = `Math.min(...$json.items.map(i => parseInt(i.lprice)))` |
| 6 | **IF** | `naver_price != price` AND `naver_price > 0` |
| 7 | **HTTP Request** (True) | POST `http://backend:8000/api/price-alerts/webhook` / Body: `{ user_id, product_id, product_name: name, old_price: price, new_price: naver_price, price_diff: naver_price - price }` |
| 8 | **Wait** | 1초 (Naver API rate limit 보호) |

```
[1: Schedule] → [2: PostgreSQL] → [3: SplitInBatches]
  → [4: Naver API] → [5: Set] → [6: IF]
    → True: [7: Webhook POST] → [8: Wait] → [3으로 루프]
    → False: [8: Wait] → [3으로 루프]
```

---

## Phase 4: Frontend

### 4-1. API 서비스

**파일 (신규)**: `frontend/src/services/api/priceAlerts.ts`

```typescript
import { apiClient } from './client';

interface PriceAlertItem {
  id: number;
  product_id: number;
  product_name: string | null;
  old_price: number;
  new_price: number;
  price_diff: number;
  is_read: boolean;
  created_at: string;
}

export const priceAlertsApi = {
  getAlerts: (userId: number) =>
    apiClient.get<{ alerts: PriceAlertItem[] }>('/price-alerts', { user_id: userId }),
  markAsRead: (alertId: number) =>
    apiClient.put(`/price-alerts/${alertId}/read`),
};
```

### 4-2. CartItemType 확장

**파일**: `frontend/src/types/cart.ts`

```typescript
export interface CartItemType {
  // ... 기존 필드
  priceAlert?: {
    priceDiff: number;
    oldPrice: number;
    newPrice: number;
    alertId: number;
  };
}
```

### 4-3. CartContext 수정

**파일**: `frontend/src/contexts/CartContext.tsx`

- 장바구니 로드 후 `priceAlertsApi.getAlerts(userId)` 호출
- `items` useMemo (line 457-486)에서 product_id 매칭하여 `priceAlert` 부착

### 4-4. CartItem 컴포넌트

**파일**: `frontend/src/components/cart/CartItem/CartItem.tsx`

priceInfo div (line 107-111) 아래에 뱃지 추가:
- 하락: 초록 `▼ 500원 내렸어요!`
- 상승: 빨간 `▲ 500원 올랐어요!`

### 4-5. CSS

**파일**: `frontend/src/components/cart/CartItem/CartItem.module.css`

`.priceDropBadge` (초록), `.priceUpBadge` (빨간)

---

## 전체 파일 변경 목록

| # | 파일 | 작업 |
|---|------|------|
| 1 | `backend/app/db/models.py` | PriceAlert 모델 + User relationship |
| 2 | `backend/app/models/price_alert.py` | **신규** — Pydantic 스키마 |
| 3 | `backend/app/models/__init__.py` | import/export 추가 |
| 4 | `backend/app/services/price_alert_service.py` | **신규** — 서비스 |
| 5 | `backend/app/services/__init__.py` | import/export 추가 |
| 6 | `backend/app/api/price_alerts.py` | **신규** — API 라우터 |
| 7 | `backend/app/main.py` | 라우터 등록 |
| 8 | `docker-compose.yml` | n8n 컨테이너 + 볼륨 |
| 9 | `nginx/nginx.conf` | /n8n/ 라우팅 |
| 10 | `.env.example` | n8n 환경변수 |
| 11 | `frontend/src/services/api/priceAlerts.ts` | **신규** — API 클라이언트 |
| 12 | `frontend/src/types/cart.ts` | CartItemType에 priceAlert 추가 |
| 13 | `frontend/src/contexts/CartContext.tsx` | 알림 조회 + items 병합 |
| 14 | `frontend/src/components/cart/CartItem/CartItem.tsx` | 뱃지 렌더링 |
| 15 | `frontend/src/components/cart/CartItem/CartItem.module.css` | 뱃지 스타일 |

---

## 구현 순서

1. **Backend**: 모델 → 스키마 → 서비스 → API → main.py 등록
2. **Infrastructure**: docker-compose → nginx → env
3. **Frontend**: API 서비스 → 타입 → Context → 컴포넌트 → CSS
4. **n8n 워크플로우**: 배포 후 n8n UI에서 구성

---

## 검증 방법

```bash
# 1. Backend 단독 테스트
curl -X POST http://localhost:8000/api/price-alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"product_id":501,"product_name":"삼다수 2L","old_price":6500,"new_price":5900,"price_diff":-600}'

curl "http://localhost:8000/api/price-alerts?user_id=1"

# 2. n8n 워크플로우 수동 실행
# n8n UI에서 "Test Workflow" 버튼 클릭

# 3. 프론트엔드 확인
# 장바구니 페이지 → 가격 변동 뱃지 표시 확인
```

**시연 팁**: 발표 시 curl로 webhook을 직접 호출하면 확실하게 뱃지가 표시됨.
