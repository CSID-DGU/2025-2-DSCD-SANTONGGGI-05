# API 명세서 - 쇼핑 비서 서비스

> 프론트엔드 - 백엔드 API 통신 명세
>
> **백엔드 개발자를 위한 완전한 API 가이드**

---

## 📋 목차

1. [개요](#개요)
2. [데이터베이스 ERD](#데이터베이스-erd)
3. [API 엔드포인트 목록](#api-엔드포인트-목록)
4. [인증 API](#1-인증-api)
5. [채팅 API](#2-채팅-api)
6. [장바구니 API](#3-장바구니-api)
7. [통계 API](#4-통계-api)
8. [구매이력 API](#5-구매이력-api)
9. [추천 API](#6-추천-api)
10. [공통 규약](#공통-규약)
11. [에러 처리](#에러-처리)

---

## 개요

### 기본 정보

- **Base URL**: `http://localhost:8000/api` (개발 환경)
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `application/json`
- **인코딩**: UTF-8
- **총 API 수**: 15개

### API 우선순위

- ⭐ **최우선**: 채팅, 장바구니 - 핵심 기능
- 🔵 **상**: 통계, 구매이력, 추천 - 주요 기능
- 🟢 **중**: 기타 부가 기능

---

## 데이터베이스 ERD

### 테이블 구조

#### users (유저)

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  number VARCHAR(255) NOT NULL UNIQUE,  -- 전화번호 (로그인 아이디)
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL            -- 사용자 이름
);
```

**TypeScript 타입:**
```typescript
interface User {
  id: number;           // Long
  number: string;       // 전화번호 (로그인 아이디)
  password: string;     // 비밀번호
  name: string;         // 사용자 이름
}
```

#### cart (장바구니)

```sql
CREATE TABLE cart (
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  platform_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (product_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**TypeScript 타입:**
```typescript
interface CartItem {
  product_id: number;    // 상품 ID
  user_id: number;       // 유저 ID
  platform_name: string; // 플랫폼 이름 (예: 쿠팡, 네이버 등)
  price: number;         // 가격
}
```

#### purchase_history (구매이력)

```sql
CREATE TABLE purchase_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  date VARCHAR(10) NOT NULL,      -- YYYY-MM-DD
  platform_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**TypeScript 타입:**
```typescript
interface PurchaseHistory {
  id: number;            // 구매 이력 ID
  user_id: number;       // 유저 ID
  date: string;          // 구매 날짜 (YYYY-MM-DD)
  platform_name: string; // 플랫폼 이름
  price: number;         // 가격
}
```

#### products (전체상품)

```sql
CREATE TABLE products (
  product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  price DECIMAL(10, 2) NOT NULL,
  platform_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  review INT NOT NULL DEFAULT 0
);
```

**TypeScript 타입:**
```typescript
interface Product {
  product_id: number;    // 상품 ID
  price: number;         // 가격
  platform_name: string; // 플랫폼 이름
  category: string;      // 카테고리
  review: number;        // 리뷰 수
}
```

---

## API 엔드포인트 목록

| No | API 이름 | 엔드포인트 | 메서드 | 우선순위 | 파일 |
|----|---------|-----------|--------|---------|------|
| 1 | 로그인 | `/api/auth/login` | POST | 상 | auth.ts |
| 2 | 회원가입 | `/api/auth/register` | POST | 상 | auth.ts |
| 3 | 메시지 전송 | `/api/chat/messages` | POST | ⭐ 최우선 | chat.ts |
| 4 | 채팅 기록 조회 | `/api/chat/history` | GET | ⭐ 최우선 | chat.ts |
| 5 | 장바구니 조회 | `/api/cart` | GET | ⭐ 최우선 | cart.ts |
| 6 | 장바구니 추가 | `/api/cart/items` | POST | ⭐ 최우선 | cart.ts |
| 7 | 장바구니 제거 | `/api/cart/items/{itemId}` | DELETE | ⭐ 최우선 | cart.ts |
| 8 | 전체 통계 대시보드 | `/api/statistics/main` | GET | 상 | statistics.ts |
| 9 | 결제 통계 리스트 | `/api/statistics/list` | GET | 중 | statistics.ts |
| 10 | 주간 통계 조회 | `/api/statistics/weekly` | GET | 상 | statistics.ts |
| 11 | 카테고리별 통계 | `/api/statistics/categories` | GET | 상 | statistics.ts |
| 12 | 구매이력 조회 | `/api/purchase-history` | GET | 상 | purchaseHistory.ts |
| 13 | 추천 상품 조회 | `/api/recommendations` | POST | 상 | recommendations.ts |

---

## 1. 인증 API

### 1.1 로그인

**우선순위**: 상

**엔드포인트**: `POST /api/auth/login`

**Request Body:**
```typescript
interface LoginRequest {
  phone_number: string;  // user.number 필드에 대응 (전화번호)
  password: string;
}
```

**Request 예시:**
```json
{
  "phone_number": "010-1234-5678",
  "password": "password123"
}
```

**Response Body:**
```typescript
interface LoginResponse {
  token: string;    // JWT 액세스 토큰
  user_id: number;  // user.id (Long)
}
```

**Response 예시:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1123
}
```

**프론트엔드 처리:**
```typescript
// AuthContext에서 사용
const response = await authApi.login({ phone_number, password });
localStorage.setItem('auth_token', response.token);
```

---

### 1.2 회원가입

**우선순위**: 상

**엔드포인트**: `POST /api/auth/register`

**Request Body:**
```typescript
interface RegisterRequest {
  phone_number: string;  // user.number 필드에 저장 (전화번호)
  password: string;
  name: string;          // user.name 필드에 저장 (사용자 이름)
}
```

**Request 예시:**
```json
{
  "phone_number": "010-1234-5678",
  "password": "securepass",
  "name": "홍길동"
}
```

**Response Body:**
```typescript
interface RegisterResponse {
  user_id: number;  // 생성된 user.id (Long)
  status: string;   // "success" | "error"
}
```

**Response 예시:**
```json
{
  "user_id": 1124,
  "status": "success"
}
```

---

## 2. 채팅 API

### 2.1 메시지 전송 ⭐

**우선순위**: 최우선

**엔드포인트**: `POST /api/chat/messages`

**Request Body:**
```typescript
interface SendMessageRequest {
  user_id: number;  // 유저 ID
  message: string;  // 사용자 메시지
}
```

**Request 예시:**
```json
{
  "user_id": 1123,
  "message": "나 물 6개 사야 될 것 같아"
}
```

**Response Body:**
```typescript
interface SendMessageResponse {
  user_id: number;              // 유저 ID
  ai_message: string;           // AI 응답 메시지
  type: number;                 // 응답 유형 (0: 일반, 1: 상품 추천, 2: 결제통계사진첨부)
  recommendationItems: Product[]; // 추천 상품 리스트
}

interface Product {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  review: number;
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "ai_message": "물 6개를 찾아드렸습니다. 가성비 좋은 상품을 추천해드릴게요!",
  "type": 1,
  "recommendationItems": [
    {
      "product_id": 501,
      "price": 12000,
      "platform_name": "쿠팡",
      "category": "생수",
      "review": 250
    },
    {
      "product_id": 502,
      "price": 15000,
      "platform_name": "네이버쇼핑",
      "category": "생수",
      "review": 180
    }
  ]
}
```

**프론트엔드 처리:**
```typescript
// ChatContext에서 사용
const response = await chatApi.sendMessage(userId, message);
// type에 따라 다른 UI 표시
if (response.data.type === 1) {
  // 상품 추천 패널 표시
  showPanel({
    type: 'product-list',
    data: { products: response.data.recommendationItems }
  });
}
```

---

### 2.2 채팅 기록 조회 ⭐

**우선순위**: 최우선

**엔드포인트**: `GET /api/chat/history`

**Query Parameters:**
```typescript
interface GetHistoryParams {
  user_id?: number;  // 선택적: 특정 유저의 채팅 기록
}
```

**Request 예시:**
```
GET /api/chat/history?user_id=1123
```

**Response Body:**
```typescript
interface GetHistoryResponse {
  messages: ChatMessage[];
}

interface ChatMessage {
  id: number;
  user_id: number;
  message: string;      // 사용자 메시지
  ai_message: string;   // AI 응답
  timestamp: string;    // ISO 8601
}
```

**Response 예시:**
```json
{
  "messages": [
    {
      "id": 1,
      "user_id": 1123,
      "message": "나 물 6개 사야 될 것 같아",
      "ai_message": "물 6개를 찾아드렸습니다...",
      "timestamp": "2025-10-17T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": 1123,
      "message": "가장 저렴한 거 보여줘",
      "ai_message": "가장 저렴한 상품을 찾았습니다...",
      "timestamp": "2025-10-17T10:32:00Z"
    }
  ]
}
```

---

## 3. 장바구니 API

### 3.1 장바구니 조회 ⭐

**우선순위**: 최우선

**엔드포인트**: `GET /api/cart`

**Query Parameters:**
```typescript
interface GetCartParams {
  user_id: number;  // 유저 ID (필수)
}
```

**Request 예시:**
```
GET /api/cart?user_id=1123
```

**Response Body:**
```typescript
interface GetCartResponse {
  items: CartItem[];
}

interface CartItem {
  product_id: number;    // 상품 ID
  user_id: number;       // 유저 ID
  platform_name: string; // 플랫폼 이름
  price: number;         // 가격
}
```

**Response 예시:**
```json
{
  "items": [
    {
      "product_id": 501,
      "user_id": 1123,
      "platform_name": "쿠팡",
      "price": 12000
    },
    {
      "product_id": 502,
      "user_id": 1123,
      "platform_name": "네이버쇼핑",
      "price": 15000
    }
  ]
}
```

**프론트엔드 처리:**
```typescript
// CartContext에서 사용
const response = await cartApi.getCart(userId);
// items 배열을 UI에 맞게 변환
```

---

### 3.2 장바구니에 상품 추가 ⭐

**우선순위**: 최우선

**엔드포인트**: `POST /api/cart/items`

**Request Body:**
```typescript
interface AddToCartRequest {
  user_id: number;       // 유저 ID
  product_id: number;    // 상품 ID
  platform_name: string; // 플랫폼 이름
  price: number;         // 가격
}
```

**Request 예시:**
```json
{
  "user_id": 1123,
  "product_id": 503,
  "platform_name": "11번가",
  "price": 18000
}
```

**Response Body:**
```typescript
interface AddToCartResponse {
  success: boolean;
  message: string;
  item: CartItem;  // 추가된 아이템
}
```

**Response 예시:**
```json
{
  "success": true,
  "message": "장바구니에 추가되었습니다",
  "item": {
    "product_id": 503,
    "user_id": 1123,
    "platform_name": "11번가",
    "price": 18000
  }
}
```

---

### 3.3 장바구니 아이템 삭제 ⭐

**우선순위**: 최우선

**엔드포인트**: `DELETE /api/cart/items/{itemId}`

**Path Parameters:**
- `itemId`: 삭제할 상품 ID (product_id)

**Query Parameters:**
```typescript
interface DeleteCartItemParams {
  user_id: number;  // 유저 ID (필수)
}
```

**Request 예시:**
```
DELETE /api/cart/items/503?user_id=1123
```

**Response Body:**
```typescript
interface DeleteCartItemResponse {
  success: boolean;
  message: string;
}
```

**Response 예시:**
```json
{
  "success": true,
  "message": "장바구니에서 삭제되었습니다"
}
```

---

## 4. 통계 API

### 4.1 전체 통계 대시보드 데이터 조회

**우선순위**: 상

**엔드포인트**: `GET /api/statistics/main`

**Query Parameters:**
```typescript
interface GetMainStatisticsParams {
  user_id: number;  // 유저 ID (필수)
}
```

**Request 예시:**
```
GET /api/statistics/main?user_id=1123
```

**Response Body:**
```typescript
interface MainStatisticsResponse {
  user_id: number;
  period: string;
  total_spending: number;       // 총 지출액
  total_orders: number;         // 총 주문 수
  average_order_value: number;  // 평균 주문 금액
  most_purchased_category: string; // 가장 많이 구매한 카테고리
  platform_breakdown: PlatformStat[]; // 플랫폼별 통계
}

interface PlatformStat {
  platform_name: string;
  order_count: number;
  total_spent: number;
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "period": "7days",
  "total_spending": 150000,
  "total_orders": 5,
  "average_order_value": 30000,
  "most_purchased_category": "생수",
  "platform_breakdown": [
    {
      "platform_name": "쿠팡",
      "order_count": 3,
      "total_spent": 90000
    },
    {
      "platform_name": "네이버쇼핑",
      "order_count": 2,
      "total_spent": 60000
    }
  ]
}
```

---

### 4.2 결제 통계 리스트 조회

**우선순위**: 중

**엔드포인트**: `GET /api/statistics/list`

**Query Parameters:**
```typescript
interface GetStatisticsListParams {
  user_id: number;   // 유저 ID (필수)
  page?: number;     // 페이지 번호 (기본값: 1)
  limit?: number;    // 페이지당 항목 수 (기본값: 10)
}
```

**Request 예시:**
```
GET /api/statistics/list?user_id=1123&page=1&limit=10
```

**Response Body:**
```typescript
interface StatisticsListResponse {
  transactions: Transaction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

interface Transaction {
  id: number;                // purchase_history.id
  date: string;              // ISO 8601
  platform_name: string;
  price: number;
  category?: string;         // products 테이블 조인 시
}
```

**Response 예시:**
```json
{
  "transactions": [
    {
      "id": 1,
      "date": "2025-10-17T10:30:00Z",
      "platform_name": "쿠팡",
      "price": 12000,
      "category": "생수"
    },
    {
      "id": 2,
      "date": "2025-10-16T15:20:00Z",
      "platform_name": "네이버쇼핑",
      "price": 15000,
      "category": "음료"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25
  }
}
```

---

### 4.3 주간 통계 조회

**우선순위**: 상

**엔드포인트**: `GET /api/statistics/weekly`

**Query Parameters:**
```typescript
interface GetWeeklyStatisticsParams {
  user_id: number;  // 유저 ID (필수)
}
```

**Request 예시:**
```
GET /api/statistics/weekly?user_id=1123
```

**Response Body:**
```typescript
interface WeeklyStatisticsResponse {
  user_id: number;
  week_start: string;  // ISO 8601 (주 시작일)
  week_end: string;    // ISO 8601 (주 종료일)
  daily_data: DailyData[];
  weekly_total: number;
}

interface DailyData {
  day: string;      // 'Mon', 'Tue', 'Wed', ...
  day_kor: string;  // '월', '화', '수', ...
  date: string;     // ISO 8601
  amount: number;   // 일별 지출액
  order_count: number; // 일별 주문 수
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "week_start": "2025-10-14T00:00:00Z",
  "week_end": "2025-10-20T23:59:59Z",
  "daily_data": [
    {
      "day": "Mon",
      "day_kor": "월",
      "date": "2025-10-14T00:00:00Z",
      "amount": 25000,
      "order_count": 2
    },
    {
      "day": "Tue",
      "day_kor": "화",
      "date": "2025-10-15T00:00:00Z",
      "amount": 18000,
      "order_count": 1
    }
  ],
  "weekly_total": 150000
}
```

---

### 4.4 카테고리별 통계 조회

**우선순위**: 상

**엔드포인트**: `GET /api/statistics/categories`

**Query Parameters:**
```typescript
interface GetCategoryStatisticsParams {
  user_id: number;  // 유저 ID (필수)
}
```

**Request 예시:**
```
GET /api/statistics/categories?user_id=1123
```

**Response Body:**
```typescript
interface CategoryStatisticsResponse {
  user_id: number;
  categories: CategoryData[];
  total_amount: number;
}

interface CategoryData {
  category: string;      // 카테고리명
  amount: number;        // 카테고리별 지출액
  percentage: number;    // 전체 대비 비율 (%)
  order_count: number;   // 주문 수
  platform_breakdown: { platform_name: string; amount: number }[];
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "categories": [
    {
      "category": "생수",
      "amount": 50000,
      "percentage": 33.3,
      "order_count": 3,
      "platform_breakdown": [
        { "platform_name": "쿠팡", "amount": 30000 },
        { "platform_name": "네이버쇼핑", "amount": 20000 }
      ]
    },
    {
      "category": "음료",
      "amount": 40000,
      "percentage": 26.7,
      "order_count": 2,
      "platform_breakdown": [
        { "platform_name": "11번가", "amount": 40000 }
      ]
    }
  ],
  "total_amount": 150000
}
```

---

## 5. 구매이력 API

### 5.1 구매 이력 조회

**우선순위**: 상

**엔드포인트**: `GET /api/purchase-history`

**Query Parameters:**
```typescript
interface GetPurchaseHistoryParams {
  user_id: number;   // 유저 ID (필수)
}
```

**Request 예시:**
```
GET /api/purchase-history?user_id=1123
```

**Response Body:**
```typescript
interface PurchaseHistoryResponse {
  user_id: number;
  purchases: PurchaseItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
  summary: {
    total_spent: number;      // 총 지출액
    total_orders: number;     // 총 주문 수
  };
}

interface PurchaseItem {
  id: number;                // purchase_history.id
  user_id: number;
  date: string;              // ISO 8601
  platform_name: string;
  price: number;
  product_info?: {           // products 테이블 조인 시 (선택)
    product_id: number;
    category: string;
    review: number;
  };
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "purchases": [
    {
      "id": 1,
      "user_id": 1123,
      "date": "2025-10-17T10:30:00Z",
      "platform_name": "쿠팡",
      "price": 12000,
      "product_info": {
        "product_id": 501,
        "category": "생수",
        "review": 250
      }
    },
    {
      "id": 2,
      "user_id": 1123,
      "date": "2025-10-16T15:20:00Z",
      "platform_name": "네이버쇼핑",
      "price": 15000,
      "product_info": {
        "product_id": 502,
        "category": "음료",
        "review": 180
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25
  },
  "summary": {
    "total_spent": 450000,
    "total_orders": 25
  }
}
```

---

## 6. 추천 API

### 6.1 추천 상품 조회

**우선순위**: 상

**엔드포인트**: `POST /api/recommendations`

**Request Body:**
```typescript
interface GetRecommendationsRequest {
  user_id: number;    // 유저 ID
  rating: number;     // 평점 가중치 선택
  review: number;     // 리뷰 가중치 선택
}
```

**Request 예시:**
```json
{
  "user_id": 1123,
  "rating": 4,
  "review": 6
}
```

**Response Body:**
```typescript
interface RecommendationsResponse {
  user_id: number;
  recommendations: RecommendedProduct[];
  generated_at: string;     // ISO 8601
}

interface RecommendedProduct {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  url: string;  // 외부 쇼핑몰 URL
}
```

**Response 예시:**
```json
{
  "user_id": 1123,
  "recommendations": [
    {
      "product_id": 501,
      "price": 12000,
      "platform_name": "쿠팡",
      "category": "생수",
      "url": "https://www.coupang.com/vp/products/5625704601"
    },
    {
      "product_id": 505,
      "price": 18000,
      "platform_name": "11번가",
      "category": "음료",
      "url": "https://www.11st.co.kr/products/8584772955"
    },
    {
      "product_id": 502,
      "price": 15000,
      "platform_name": "네이버쇼핑",
      "category": "생수",
      "url": "https://search.shopping.naver.com/catalog/34739644906"
    },
    {
      "product_id": 506,
      "price": 22000,
      "platform_name": "쿠팡",
      "category": "청소용품",
      "url": "https://www.coupang.com/vp/products/6789012345"
    },
    {
      "product_id": 507,
      "price": 9500,
      "platform_name": "네이버쇼핑",
      "category": "생활용품",
      "url": "https://search.shopping.naver.com/catalog/45678901234"
    },
    {
      "product_id": 508,
      "price": 14500,
      "platform_name": "11번가",
      "category": "음료",
      "url": "https://www.11st.co.kr/products/9876543210"
    }
  ],
  "generated_at": "2025-10-18T10:00:00Z"
}
```

---

## 공통 규약

### 인증 헤더

로그인이 필요한 모든 API는 Authorization 헤더 포함:

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**예시:**
```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
};
```

### 날짜 형식

- **ISO 8601**: `2025-10-17T10:30:00Z`
- **YYYY-MM-DD**: `2025-10-17`

### HTTP 상태 코드

- `200 OK`: 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 에러

---

## 에러 처리

### 에러 응답 형식

```typescript
interface ErrorResponse {
  error: string;      // 에러 타입 (예: "UNAUTHORIZED", "NOT_FOUND")
  message: string;    // 에러 메시지
  timestamp: string;  // ISO 8601
}
```

### 에러 응답 예시

```json
{
  "error": "UNAUTHORIZED",
  "message": "인증 토큰이 유효하지 않습니다",
  "timestamp": "2025-10-17T12:00:00Z"
}
```

### 프론트엔드 에러 처리

```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error: any) {
  console.error('API Error:', error.message);
  // UI에 에러 표시
  throw error;
}
```

---

## 백엔드 개발 체크리스트

### API 구현 순서

#### 1단계: 핵심 기능 (최우선)

- [ ] POST `/api/chat/messages` - 채팅 메시지 전송
- [ ] GET `/api/chat/history` - 채팅 기록 조회
- [ ] GET `/api/cart` - 장바구니 조회
- [ ] POST `/api/cart/items` - 장바구니 추가
- [ ] DELETE `/api/cart/items/{itemId}` - 장바구니 삭제

#### 2단계: 주요 기능 (상)

- [ ] POST `/api/auth/login` - 로그인
- [ ] POST `/api/auth/register` - 회원가입
- [ ] GET `/api/statistics/main` - 전체 통계
- [ ] GET `/api/statistics/weekly` - 주간 통계
- [ ] GET `/api/statistics/categories` - 카테고리 통계
- [ ] GET `/api/purchase-history` - 구매이력 조회
- [ ] POST `/api/recommendations` - 추천 상품

#### 3단계: 부가 기능 (중)

- [ ] GET `/api/statistics/list` - 결제 통계 리스트

### 검증 사항

#### 데이터 타입 검증

- [ ] 모든 필드가 ERD 타입과 일치
- [ ] 날짜는 ISO 8601 형식
- [ ] 숫자는 정확한 타입 (Long, Decimal)

#### 인증 검증

- [ ] JWT 토큰 발급 및 검증
- [ ] Authorization 헤더 파싱
- [ ] 유효하지 않은 토큰 처리

#### 에러 처리

- [ ] 표준 에러 응답 형식 준수
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] 에러 메시지 명확성

#### CORS 설정

- [ ] 프론트엔드 도메인 허용 (`localhost:5173`)
- [ ] 필요한 HTTP 메서드 허용
- [ ] 인증 헤더 허용

---

## 부록

### Mock API 파일 위치

```
frontend/src/services/api/
├── auth.ts           # 인증 Mock API
├── chat.ts           # 채팅 Mock API
├── cart.ts           # 장바구니 Mock API
├── statistics.ts     # 통계 Mock API
├── purchaseHistory.ts # 구매이력 Mock API
└── recommendations.ts # 추천 Mock API
```

### 참고 문서

- **CLAUDE.md**: 전체 프로젝트 가이드 및 상세 규칙
- **README.md**: 프론트엔드 설명 및 아키텍처

---

**작성일**: 2025-10-18
**버전**: 1.0.0
**작성자**: Frontend Team
