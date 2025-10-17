# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**쇼핑 비서 서비스** - OpenAI API와 추천 시스템을 활용한 AI 기반 쇼핑 어시스턴트

- **목적**: 대학교 졸업 프로젝트
- **기술 스택**: React 19 + TypeScript + Vite (프론트엔드), Python + FastAPI (백엔드)
- **현재 개발 범위**: 프론트엔드 중심 구현
- **최종 목표**: 배포가 완료된 서비스

## 개발 명령어

```bash
# 개발 서버 시작 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 코드 린팅
npm run lint
```

## 페이지 구조

1. **로그인 페이지**: 회원가입 및 로그인 기능
2. **메인페이지 (채팅)**: 로그인 후 첫 화면, AI 채팅, 우측 장바구니, 하단 네비게이션
3. **결제통계 페이지**: 우측 통계 분석 선택지, 좌측 분석 결과 출력
4. **구매이력 페이지**: 사용자 구매 이력 표시
5. **모달창들**: 상품 추천, 제품 상세 정보, 3/3 추천 시스템

## 아키텍처 핵심 개념

### Context 기반 상태 관리

7개의 Context가 전역 상태를 관리합니다:

- **AppProvider.tsx**: 모든 Context를 통합하여 제공하는 최상위 Provider
- **AuthContext.tsx**: 인증 상태 (user, tokens, isAuthenticated)
- **ChatContext.tsx**: 채팅 세션 및 메시지 관리
- **CartContext.tsx**: 장바구니 아이템 및 요약 정보
- **PanelContext.tsx**: 동적 패널 표시 및 제어
- **ModalContext.tsx**: 제품 상세 모달 관리
- **NavigationContext.tsx**: 페이지 네비게이션 상태

**중요**: 모든 Context는 Provider 컴포넌트와 custom hook을 **같은 파일**에서 export합니다. 이는 React Fast Refresh와 호환되지 않아 코드 변경 시 전체 페이지 리로드가 발생하지만, 기능적으로는 정상 작동합니다.

### Context 사용 패턴

```typescript
// Context 파일 구조 (예: CartContext.tsx)
export const CartProvider: React.FC = ({ children }) => { ... }
export const useCart = (): CartContextValue => { ... }

// 컴포넌트에서 사용
import { useCart } from '@/contexts/AppProvider';
const { items, addToCart } = useCart();
```

### Path Alias 설정

tsconfig.json과 vite.config.js에서 설정된 경로 alias:

```typescript
@/*              -> ./src/*
@/components/*   -> ./src/components/*
@/contexts/*     -> ./src/contexts/*
@/types/*        -> ./src/types/*
@/hooks/*        -> ./src/hooks/*
@/services/*     -> ./src/services/*
```

**항상 상대 경로 대신 alias 사용**하여 import하세요.

### TypeScript 설정

- **Strict Mode 활성화**: 엄격한 타입 검사
- **exactOptionalPropertyTypes: true**: optional 속성에 `undefined` 명시 불가
  ```typescript
  // ❌ 잘못됨
  const state = { currentPage: 'chat', previousPage: undefined };

  // ✅ 올바름
  const state = { currentPage: 'chat' }; // previousPage 생략
  ```
- **noImplicitReturns: true**: 모든 코드 경로에서 반환값 필요

### API 서비스 구조

`src/services/api/` 디렉토리의 모든 API 서비스는 **mock 데이터**를 반환합니다:

- **auth.ts**: 로그인, 회원가입, 토큰 갱신
- **chat.ts**: 채팅 메시지 전송 및 세션 관리
- **cart.ts**: 장바구니 CRUD 작업
- **statistics.ts**: KPI 데이터, 차트 데이터
- **purchaseHistory.ts**: 구매 이력 조회
- **recommendations.ts**: 상품 추천 데이터

**중요**: 실제 백엔드 연동 시 API 응답 형식을 유지하면서 mock 로직만 제거하세요.

### 동적 패널 시스템

`PanelContext`와 `DynamicPanel` 컴포넌트를 통해 다양한 콘텐츠를 표시:

```typescript
// Panel 타입
type PanelType =
  | 'coupang'           // 쿠팡 연동
  | 'statistics'        // 통계 분석
  | 'productGrid'       // 상품 그리드
  | 'comparison'        // 상품 비교
  | 'reviews'           // 리뷰
  | 'product-list'      // 상품 목록
  | 'product-detail'    // 상품 상세
  | 'recommendations'   // 추천
  | 'search-results'    // 검색 결과
  | 'category';         // 카테고리

// Panel 표시
const { showPanel } = usePanel();
showPanel({
  type: 'product-list',
  data: { products: [...] },
  title: '추천 상품',
  height: 400
});
```

### 장바구니 API 호환성

CartContext는 두 가지 addItem API를 제공합니다:

```typescript
// 1. 원본 API (권장)
addItem(productId: string, quantity?: number, variantId?: string): Promise<void>

// 2. 호환성 API (간단한 컴포넌트용)
addToCart(item: {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}): Promise<void>
```

두 API 모두 사용 가능하며, 내부적으로 `addToCart`는 `addItem`을 호출합니다.

### CSS Modules

모든 컴포넌트는 CSS Modules를 사용합니다:

```typescript
import styles from './Component.module.css';

<div className={styles.container}>
  <button className={styles.button} />
</div>
```

- **localsConvention: 'camelCase'**: CSS 클래스가 camelCase로 변환됨
- 각 컴포넌트 폴더에 `.module.css` 파일 포함

### 반응형 디자인

`useWindowSize` 훅을 통한 breakpoint 관리:

```typescript
const { width, height, breakpoint } = useWindowSize();
// breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'

// Breakpoint 값
// mobile: < 768px
// tablet: 768px - 1024px
// desktop: 1024px - 1440px
// wide: >= 1440px
```

## 개발 가이드라인

### 코드 스타일

1. **직관적인 코드 작성**: 복잡한 추상화나 과도한 최적화 지양
2. **구현된 기능에 집중**: 추가 기능 제안하지 말 것
3. **졸업 프로젝트 수준**: 실용적이고 이해하기 쉬운 코드
4. **TypeScript 타입 안전성**: 모든 함수와 컴포넌트에 명시적 타입 지정

### 컴포넌트 작성 규칙

```typescript
// ✅ 올바른 컴포넌트 구조
interface ComponentProps {
  title: string;
  onClose: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onClose }) => {
  // 상태 관리
  const [state, setState] = useState<StateType>(initialState);

  // Context 사용
  const { user } = useAuth();

  // 이벤트 핸들러
  const handleClick = () => { ... };

  return <div>...</div>;
};
```

### useEffect 의존성 주의사항

React Hook 의존성 배열 관련 주의사항:

```typescript
// ❌ 잘못됨 - 객체 전체를 의존성으로 추가
useEffect(() => {
  loadData();
}, [user]); // user 객체가 매번 새로 생성되면 무한 루프

// ✅ 올바름 - 필요한 속성만 의존성에 추가
useEffect(() => {
  loadData();
}, [user?.id]); // user의 id만 변경 시 실행

// 또는 eslint-disable 주석 사용
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id]); // 의도적으로 일부 의존성 제외
```

### 에러 처리

```typescript
try {
  const response = await api.someMethod();
  // 성공 처리
} catch (error: any) {
  // 에러 상태 업데이트
  dispatch({ type: 'SET_ERROR', payload: error.message });
  throw error; // 상위 컴포넌트로 에러 전파
}
```

## 알려진 제한사항

1. **Fast Refresh 비활성화**: Context 파일 구조로 인해 코드 변경 시 전체 페이지 리로드
2. **Mock API**: 모든 API 응답이 mock 데이터
3. **ESLint 미설정**: ESLint 설정 파일 없음 (TypeScript 컴파일러만 사용)
4. **테스트 없음**: 테스트 프레임워크 미설정

## 문제 해결

### TypeScript 에러

```bash
# TypeScript 컴파일러 실행 (에러 확인)
npx tsc --noEmit
```

### Context 관련 에러

- 모든 Context는 `AppProvider`에서 통합 제공
- 컴포넌트는 `@/contexts/AppProvider`에서 hook import
- Context Provider 외부에서 hook 사용 시 에러 발생

### Import 에러

- path alias 사용: `@/components/...` 형식
- 상대 경로 사용 금지: `../../../components` (X)
- 파일 확장자 생략: `.tsx`, `.ts` 확장자 불필요

## 주의사항

- **기능 추가 금지**: 요청되지 않은 기능 구현하지 말 것
- **API 변경 주의**: mock API 응답 구조 변경 시 타입 정의도 함께 업데이트
- **Context 수정 시**: 해당 Context를 사용하는 모든 컴포넌트 확인 필요
- **배포 전 확인**: `npm run build` 성공 여부 반드시 확인

---

## 데이터베이스 ERD

### 테이블 구조

#### 유저 (users)
```typescript
interface User {
  id: number;           // Long
  number: string;       // username (계정명)
  password: string;     // 비밀번호
}
```

#### 장바구니 (cart)
```typescript
interface CartItem {
  product_id: number;   // 상품 ID
  user_id: number;      // 유저 ID
  platform_name: string; // 플랫폼 이름 (예: 쿠팡, 네이버 등)
  price: number;        // 가격
}
```

#### 구매이력 (purchase_history)
```typescript
interface PurchaseHistory {
  id: number;           // 구매 이력 ID
  user_id: number;      // 유저 ID
  date: string;         // 구매 날짜 (YYYY-MM-DD)
  platform_name: string; // 플랫폼 이름
  price: number;        // 가격
}
```

#### 전체상품 (products)
```typescript
interface Product {
  product_id: number;   // 상품 ID
  price: number;        // 가격
  platform_name: string; // 플랫폼 이름
  category: string;     // 카테고리
  review: number;       // 리뷰 수
}
```

---

## API 상세 문서

**총 15개 API**

모든 API는 현재 **Mock 데이터**를 반환합니다. 실제 백엔드 연동 시 ERD 기반 데이터 구조를 사용하세요.

### 1. 인증 API (auth.ts)

#### 1.1 로그인

**엔드포인트:** `POST /api/auth/login`

**Request Body:**
```typescript
interface LoginRequest {
  username: string;  // user.number 필드에 대응
  password: string;
}
```

**Request 예시:**
```json
{
  "username": "user123",
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

#### 1.2 회원가입

**엔드포인트:** `POST /api/auth/register`

**Request Body:**
```typescript
interface RegisterRequest {
  username: string;  // user.number 필드에 저장
  password: string;
  email: string;
}
```

**Request 예시:**
```json
{
  "username": "newuser",
  "password": "securepass",
  "email": "user@example.com"
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

### 2. 채팅 API (chat.ts)

총 2개 엔드포인트

#### 2.1 메시지 전송 (우선순위: 상)

**엔드포인트:** `POST /api/chat/messages`

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
  type: int;                    // 응답 유형 (0: 일반, 1: 상품 추천, 2: 결제통계사진첨부)
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

#### 2.2 채팅 기록 조회 (우선순위: 상)

**엔드포인트:** `GET /api/chat/history`

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

### 3. 장바구니 API (cart.ts)

총 3개 엔드포인트

#### 3.1 장바구니 조회 (우선순위: 상)

**엔드포인트:** `GET /api/cart`

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

#### 3.2 장바구니에 상품 추가 (우선순위: 상)

**엔드포인트:** `POST /api/cart/items`

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

#### 3.3 장바구니 아이템 삭제 (우선순위: 상)

**엔드포인트:** `DELETE /api/cart/items/{itemId}`

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

### 4. 통계 API (statistics.ts)

총 4개 엔드포인트

#### 4.1 전체 통계 대시보드 데이터 조회 (우선순위: 상)

**엔드포인트:** `GET /api/statistics/main`

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

#### 4.2 결제 통계 리스트 조회 (우선순위: 중)

**엔드포인트:** `GET /api/statistics/list`

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

#### 4.3 주간 통계 조회 (우선순위: 상)

**엔드포인트:** `GET /api/statistics/weekly`

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

#### 4.4 카테고리별 통계 조회 (우선순위: 상)

**엔드포인트:** `GET /api/statistics/categories`

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

### 5. 구매 이력 API (purchaseHistory.ts)

총 1개 엔드포인트

#### 5.1 구매 이력 조회 (우선순위: 상)

**엔드포인트:** `GET /api/purchase-history`

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

### 6. 추천 API (recommendations.ts)

총 2개 엔드포인트

#### 6.1 추천 상품 조회 (우선순위: 상)

**엔드포인트:** `POST /api/recommendations`

**Request Body:**
```typescript
interface GetRecommendationsRequest {
  user_id: number;            // 유저 ID
  rating: number;              // 평점
  review: number;             // 리뷰 
  // 평점 및 리뷰의 가중치 선택
}
```

**Request 예시:**
```json
{
  "user_id": 1123,
  "rating" : 4,
  "review" : 6
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
  url: string;
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
      "url": "https://www.coupang.com/vp/products/5625704601?itemId=9133866800&vendorItemId=79544780507&pickType=COU_PICK&sourceType=srp_product_ads&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&traceId=mguk9fwx"
    },
    {
      "product_id": 505,
      "price": 18000,
      "platform_name": "11번가",
      "category": "음료",
      "url": "https://www.11st.co.kr/products/8584772955?&trTypeCd=PW24&trCtgrNo=585021&priceCompare=false"
    },     {
      "product_id": 501,
      "price": 12000,
      "platform_name": "쿠팡",
      "category": "생수",
      "url": "https://www.coupang.com/vp/products/5625704601?itemId=9133866800&vendorItemId=79544780507&pickType=COU_PICK&sourceType=srp_product_ads&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&traceId=mguk9fwx"
    },
    {
      "product_id": 505,
      "price": 18000,
      "platform_name": "11번가",
      "category": "음료",
      "url": "https://www.11st.co.kr/products/8584772955?&trTypeCd=PW24&trCtgrNo=585021&priceCompare=false"
    }, 
        {
      "product_id": 501,
      "price": 12000,
      "platform_name": "쿠팡",
      "category": "생수",
      "url": "https://www.coupang.com/vp/products/5625704601?itemId=9133866800&vendorItemId=79544780507&pickType=COU_PICK&sourceType=srp_product_ads&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&clickEventId=9e236de0-ab2f-11f0-b550-fa5416b9814c&korePlacement=15&koreSubPlacement=1&traceId=mguk9fwx"
    },
    {
      "product_id": 505,
      "price": 18000,
      "platform_name": "11번가",
      "category": "음료",
      "url": "https://www.11st.co.kr/products/8584772955?&trTypeCd=PW24&trCtgrNo=585021&priceCompare=false"
    }
  ],
}
```
---

## API 구현 요약

### 전체 API 목록

**총 15개 API** (우선순위 상 12개, 우선순위 중 3개)

| No | API 이름 | 엔드포인트 | 메서드 | 우선순위 |
|----|---------|-----------|--------|---------|
| 1 | 로그인 | `/api/auth/login` | POST | 상 |
| 2 | 회원가입 | `/api/auth/register` | POST | 상 |
| 3 | 메시지 전송 | `/api/chat/messages` | POST | 상 |
| 4 | 채팅 기록 조회 | `/api/chat/history` | GET | 상 |
| 5 | 장바구니 조회 | `/api/cart` | GET | 상 |
| 6 | 장바구니 추가 | `/api/cart/items` | POST | 상 |
| 7 | 장바구니 제거 | `/api/cart/items/{itemId}` | DELETE | 상 |
| 8 | 전체 통계 대시보드 | `/api/statistics/main` | GET | 상 |
| 9 | 결제 통계 리스트 | `/api/statistics/list` | GET | 중 |
| 10 | 주간 통계 조회 | `/api/statistics/weekly` | GET | 상 |
| 11 | 카테고리별 통계 | `/api/statistics/categories` | GET | 상 |
| 12 | 구매이력 조회 | `/api/purchase-history` | GET | 상 |
| 13 | 추천 상품 조회 | `/api/recommendations` | POST | 상 |
| 15 | 추가 통계 데이터 | 미정 | 미정 | 중 |

### API 공통 구조

#### 성공 응답
```typescript
{
  // 각 API별 정의된 Response Body
}
```

#### 에러 응답
```typescript
interface ErrorResponse {
  error: string;      // 에러 타입 (예: "UNAUTHORIZED", "NOT_FOUND")
  message: string;    // 에러 메시지
  timestamp: string;  // ISO 8601
}
```

**예시:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "인증 토큰이 유효하지 않습니다",
  "timestamp": "2025-10-17T12:00:00Z"
}
```

### 에러 처리

API 호출 실패 시:
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
  throw error;
}
```

### 인증 헤더

로그인이 필요한 API는 Authorization 헤더 포함:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Mock API 설정

현재 모든 API는 Mock 데이터를 반환합니다. 실제 백엔드 연동 시:
1. API 엔드포인트 URL을 환경 변수로 설정
2. Mock 로직 제거
3. ERD 기반 데이터 구조 유지
4. Response 타입 정의 유지

### LocalStorage 사용

프론트엔드에서 임시 저장:
- `auth_token`: JWT 토큰 저장
- `guest_cart`: 비로그인 사용자 장바구니
- 실제 백엔드 연동 시 제거 필요

