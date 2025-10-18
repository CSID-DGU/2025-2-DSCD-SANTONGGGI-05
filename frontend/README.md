# 쇼핑 비서 서비스 - 프론트엔드

> AI 기반 쇼핑 어시스턴트 대학교 졸업 프로젝트 - React 프론트엔드 애플리케이션
>
> **백엔드 개발자를 위한 가이드**

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [빠른 시작](#빠른-시작)
4. [프로젝트 구조](#프로젝트-구조)
5. [아키텍처 설명](#아키텍처-설명)
6. [핵심 개념](#핵심-개념)
7. [API 통합 가이드](#api-통합-가이드)
8. [개발 가이드](#개발-가이드)
9. [알려진 제한사항](#알려진-제한사항)

---

## 프로젝트 개요

**쇼핑 비서 서비스**는 OpenAI API와 추천 시스템을 활용한 AI 기반 쇼핑 어시스턴트 입니다.

### 주요 기능

- 🤖 **AI 채팅 인터페이스**: OpenAI 기반 대화형 쇼핑 상담
- 🛒 **스마트 장바구니**: 실시간 장바구니 관리 및 요약
- 📊 **구매 통계 분석**: 주간/카테고리별 지출 분석
- 🎯 **상품 추천 시스템**: 평점 및 리뷰 기반 3/3 추천
- 📜 **구매 이력 관리**: 과거 구매 내역 조회
- 🌐 **다중 플랫폼 통합**: 쿠팡, 네이버쇼핑, 11번가 등

### 현재 상태

- ✅ 프론트엔드 UI 완성
- ✅ 7개 Context 기반 상태 관리 구현
- ⏳ Mock API 사용 중 (백엔드 연동 대기)
- 🎯 목표: 배포 완료된 서비스

---

## 기술 스택

### 코어 기술

```
React 19.1.1        - UI 라이브러리
TypeScript 5.x      - 타입 안전성
Vite 7.1.7          - 빌드 도구 및 개발 서버
```

### 개발 도구

```
ESLint 9.36.0       - 코드 린팅
CSS Modules         - 컴포넌트 스타일링 (camelCase)
```

### 프로젝트 규모

```
총 코드 라인: ~7,107 lines
주요 컴포넌트: 33개
API 서비스: 6개 파일 (15개 엔드포인트)
Context: 7개
```

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:5173`에서 시작됩니다.

### 3. 빌드

```bash
npm run build
```

### 4. 프로덕션 미리보기

```bash
npm run preview
```

### 5. 코드 린팅

```bash
npm run lint
```

---

## 프로젝트 구조

### 디렉토리 구조

```
frontend/
├── src/
│   ├── components/          # UI 컴포넌트
│   │   ├── cart/           # 장바구니 관련 컴포넌트
│   │   │   ├── CartSidebar/      # 우측 장바구니 사이드바
│   │   │   ├── CartItem/         # 장바구니 아이템
│   │   │   └── CartSummary/      # 장바구니 요약 정보
│   │   ├── chat/           # 채팅 인터페이스
│   │   │   ├── ChatInterface/    # 메인 채팅 화면
│   │   │   ├── ChatMessages/     # 메시지 목록
│   │   │   └── TypingIndicator/  # AI 입력 중 표시
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   │   └── MainLayout/       # 메인 레이아웃 (3단 구조)
│   │   ├── modals/         # 모달창
│   │   │   ├── ProductDetailModal/       # 제품 상세 정보
│   │   │   └── ProductRecommendationModal/ # 상품 추천 모달
│   │   ├── panels/         # 동적 패널 시스템
│   │   │   ├── DynamicPanel/         # 패널 컨테이너
│   │   │   ├── ProductListPanel/     # 상품 목록
│   │   │   ├── ProductDetailPanel/   # 상품 상세
│   │   │   ├── RecommendationsPanel/ # 추천 상품
│   │   │   ├── SearchResultsPanel/   # 검색 결과
│   │   │   └── CategoryPanel/        # 카테고리별 상품
│   │   ├── purchaseHistory/ # 구매 이력 대시보드
│   │   │   └── PurchaseHistoryDashboard/
│   │   ├── statistics/     # 통계 대시보드
│   │   │   ├── StatisticsDashboard/      # 통계 메인 화면
│   │   │   ├── StatisticsNavigation/     # 통계 네비게이션
│   │   │   ├── KPICards/                 # KPI 카드
│   │   │   ├── Charts/                   # 차트 컴포넌트
│   │   │   │   ├── WeeklyChart/          # 주간 차트
│   │   │   │   └── CategoryChart/        # 카테고리 차트
│   │   │   └── ProductRecommendations/   # 추천 상품
│   │   └── ui/             # 공통 UI 컴포넌트
│   │       ├── LoadingSpinner/   # 로딩 스피너
│   │       └── ErrorBoundary/    # 에러 경계
│   ├── contexts/           # React Context (전역 상태 관리)
│   │   ├── AppProvider.tsx       # 통합 Provider
│   │   ├── AuthContext.tsx       # 인증 상태
│   │   ├── ChatContext.tsx       # 채팅 세션 및 메시지
│   │   ├── CartContext.tsx       # 장바구니 관리
│   │   ├── PanelContext.tsx      # 동적 패널 제어
│   │   ├── ModalContext.tsx      # 모달 관리
│   │   └── NavigationContext.tsx # 페이지 네비게이션
│   ├── services/           # API 및 서비스 레이어
│   │   ├── api/            # API 서비스 (Mock 구현)
│   │   │   ├── auth.ts           # 로그인, 회원가입
│   │   │   ├── chat.ts           # 채팅 메시지, 기록
│   │   │   ├── cart.ts           # 장바구니 CRUD
│   │   │   ├── statistics.ts     # 통계 데이터
│   │   │   ├── purchaseHistory.ts # 구매 이력
│   │   │   └── recommendations.ts # 상품 추천
│   │   └── storage/        # 로컬 스토리지 유틸
│   │       └── localStorage.ts
│   ├── types/              # TypeScript 타입 정의
│   │   ├── index.ts        # 공통 타입
│   │   ├── api.ts          # API 관련 타입
│   │   ├── auth.ts         # 인증 타입
│   │   ├── cart.ts         # 장바구니 타입
│   │   ├── chat.ts         # 채팅 타입
│   │   ├── modal.ts        # 모달 타입
│   │   └── panel.ts        # 패널 타입
│   ├── hooks/              # Custom React Hooks
│   │   └── useWindowSize.ts # 반응형 브레이크포인트
│   ├── styles/             # 전역 스타일
│   ├── App.tsx             # 루트 컴포넌트
│   ├── main.tsx            # 엔트리 포인트
│   └── index.css           # 전역 CSS
├── public/                 # 정적 파일
├── CLAUDE.md               # 프로젝트 가이드 (AI 개발 참고)
├── API_SPECIFICATION.md    # API 명세서 (이 문서 참고)
├── package.json            # 의존성 관리
├── tsconfig.json           # TypeScript 설정
├── vite.config.js          # Vite 설정
└── README.md               # 이 파일
```

### 파일 명명 규칙

```
컴포넌트:    ComponentName/ComponentName.tsx
스타일:      ComponentName/ComponentName.module.css
인덱스:      ComponentName/index.ts
타입:        types/*.ts
API:         services/api/*.ts
Context:     contexts/*Context.tsx
```

---

## 아키텍처 설명

### 1. 애플리케이션 흐름

```
main.tsx (엔트리)
  ↓
AppProvider (7개 Context 통합)
  ↓
App.tsx (초기화 및 에러 처리)
  ↓
MainLayout (3단 레이아웃)
  ├── ChatInterface (좌측 - 채팅)
  ├── CartSidebar (우측 - 장바구니)
  └── DynamicPanel (하단 - 동적 패널)
```

### 2. Context 계층 구조

```typescript
<AppProvider>
  <AuthProvider>           // 1. 인증 (최상위)
    <NavigationProvider>   // 2. 네비게이션
      <CartProvider>       // 3. 장바구니
        <PanelProvider>    // 4. 동적 패널
          <ModalProvider>  // 5. 모달
            <ChatProvider> // 6. 채팅 (하위 의존성)
              {children}
              <ProductDetailModal /> // 전역 모달
            </ChatProvider>
          </ModalProvider>
        </PanelProvider>
      </CartProvider>
    </NavigationProvider>
  </AuthProvider>
</AppProvider>
```

**Context 의존성 이유:**
- ChatProvider는 CartContext를 사용 (AI가 장바구니 추가)
- PanelProvider는 제품 정보 표시에 사용
- AuthProvider가 최상위 (모든 기능이 인증 필요)

### 3. 페이지 구조

#### 메인 페이지 (채팅)

```
┌─────────────────────────────────────────┬────────────┐
│                                         │            │
│  ChatInterface                          │ CartSidebar│
│  (AI 대화, 메시지 입력)                  │ (장바구니) │
│                                         │            │
│                                         │            │
└─────────────────────────────────────────┴────────────┘
┌───────────────────────────────────────────────────────┐
│ DynamicPanel (동적 패널 - 상황에 따라 표시)            │
│ - 상품 목록 / 상품 상세 / 추천 상품 등                │
└───────────────────────────────────────────────────────┘
```

#### 통계 페이지

```
┌───────────────────┬─────────────────────────────────────┐
│                   │                                     │
│ StatisticsNav     │  통계 분석 결과                      │
│ (선택지 목록)      │  - KPI 카드                         │
│                   │  - 주간 차트                        │
│                   │  - 카테고리 차트                     │
│                   │                                     │
└───────────────────┴─────────────────────────────────────┘
```

#### 구매이력 페이지

```
┌─────────────────────────────────────────────────────┐
│  PurchaseHistoryDashboard                           │
│  - 구매 내역 목록                                    │
│  - 주문 상세 정보                                    │
│  - 총 지출액, 평균 주문액 등                         │
└─────────────────────────────────────────────────────┘
```

---

## 핵심 개념

### 1. Context 기반 상태 관리

모든 전역 상태는 React Context로 관리됩니다.

**⚠️ 주의**: Fast Refresh가 비활성화되어 Context 변경 시 전체 페이지가 리로드됩니다.

#### AuthContext - 인증 상태 관리

```typescript
interface AuthContextValue {
  user: User | null;              // 현재 로그인 사용자
  isAuthenticated: boolean;       // 로그인 여부
  isLoading: boolean;             // 인증 확인 중
  error: string | null;           // 에러 메시지

  login: (credentials) => Promise<void>;    // 로그인
  register: (data) => Promise<void>;        // 회원가입
  logout: () => Promise<void>;              // 로그아웃
  initialize: () => Promise<void>;          // 앱 초기화
}
```

**사용 예시:**
```typescript
import { useAuth } from '@/contexts/AppProvider';

const { user, isAuthenticated, login } = useAuth();

await login({ email: 'user@example.com', password: 'pass' });
```

#### ChatContext - 채팅 세션 및 메시지 관리

```typescript
interface ChatContextValue {
  messages: Message[];            // 메시지 목록
  isLoading: boolean;             // AI 응답 대기 중
  error: string | null;           // 에러

  sendMessage: (content: string) => Promise<void>;  // 메시지 전송
  clearMessages: () => void;                        // 메시지 초기화
  loadHistory: () => Promise<void>;                 // 이전 대화 불러오기
}
```

**메시지 타입:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: number;                  // 0: 일반, 1: 상품추천, 2: 통계
  recommendationItems?: Product[]; // 추천 상품 데이터
}
```

#### CartContext - 장바구니 관리

```typescript
interface CartContextValue {
  items: CartItemType[];          // 장바구니 아이템
  total: number;                  // 총 금액
  itemCount: number;              // 총 아이템 수
  isLoading: boolean;

  // 원본 API (권장)
  addItem: (productId, quantity?, variantId?) => Promise<void>;
  removeItem: (itemId) => Promise<void>;
  updateQuantity: (itemId, quantity) => Promise<void>;
  clearCart: () => Promise<void>;

  // 호환성 API (간단한 컴포넌트용)
  addToCart: (item) => Promise<void>;
}
```

**사용 예시:**
```typescript
// 방법 1: 원본 API (권장)
await addItem('product-123', 2);

// 방법 2: 호환성 API
await addToCart({
  id: 'product-123',
  name: '생수 2L',
  price: 12000,
  quantity: 2
});
```

#### PanelContext - 동적 패널 제어

```typescript
type PanelType =
  | 'product-list'      // 상품 목록
  | 'product-detail'    // 상품 상세
  | 'recommendations'   // 추천 상품
  | 'search-results'    // 검색 결과
  | 'category';         // 카테고리별 상품

interface PanelContextValue {
  currentPanel: PanelData | null; // 현재 표시 중인 패널
  isExpanded: boolean;            // 패널 확장 여부
  height: number;                 // 패널 높이

  showPanel: (panelData) => void;  // 패널 표시
  hidePanel: () => void;           // 패널 숨김
  updatePanel: (updates) => void;  // 패널 업데이트
}
```

**사용 예시:**
```typescript
const { showPanel } = usePanel();

showPanel({
  type: 'product-list',
  data: { products: [...] },
  title: '추천 상품',
  height: 400
});
```

### 2. Path Alias

모든 import는 path alias를 사용합니다:

```typescript
// ✅ 올바른 사용
import { useAuth } from '@/contexts/AppProvider';
import { Button } from '@/components/ui/Button';

// ❌ 잘못된 사용 (상대 경로)
import { useAuth } from '../../../contexts/AppProvider';
```

**설정된 Alias:**
```
@/*              → ./src/*
@/components/*   → ./src/components/*
@/contexts/*     → ./src/contexts/*
@/types/*        → ./src/types/*
@/hooks/*        → ./src/hooks/*
@/services/*     → ./src/services/*
```

### 3. TypeScript 엄격 모드

#### exactOptionalPropertyTypes

선택적 속성에 `undefined`를 명시할 수 없습니다:

```typescript
// ❌ 잘못됨
const state = {
  currentPage: 'chat',
  previousPage: undefined  // Error!
};

// ✅ 올바름
const state = {
  currentPage: 'chat'  // previousPage 생략
};
```

#### noImplicitReturns

모든 코드 경로에서 반환값이 필요합니다:

```typescript
// ❌ 잘못됨
function getStatus(code: number) {
  if (code === 200) {
    return 'success';
  }
  // Error: 다른 경로에서 반환값 없음
}

// ✅ 올바름
function getStatus(code: number): string {
  if (code === 200) {
    return 'success';
  }
  return 'error';
}
```

### 4. CSS Modules

모든 컴포넌트는 CSS Modules를 사용합니다:

```css
/* ComponentName.module.css */
.container {
  padding: 20px;
}

.primary-button {  /* CSS에서는 kebab-case */
  background: blue;
}
```

```typescript
// ComponentName.tsx
import styles from './ComponentName.module.css';

<div className={styles.container}>
  <button className={styles.primaryButton} />  {/* JS에서는 camelCase */}
</div>
```

### 5. 반응형 디자인

`useWindowSize` 훅으로 브레이크포인트 관리:

```typescript
const { width, height, breakpoint } = useWindowSize();

// breakpoint 값
// 'mobile'  : < 768px
// 'tablet'  : 768px - 1024px
// 'desktop' : 1024px - 1440px
// 'wide'    : >= 1440px

{breakpoint === 'mobile' && <MobileView />}
{breakpoint === 'desktop' && <DesktopView />}
```

---

## API 통합 가이드

### 현재 상태: Mock API

모든 API는 현재 **Mock 데이터**를 반환합니다. 실제 백엔드 연동 시 아래 가이드를 따르세요.

### API 서비스 구조

```
src/services/api/
├── auth.ts           # 인증 API (2개 엔드포인트)
├── chat.ts           # 채팅 API (2개 엔드포인트)
├── cart.ts           # 장바구니 API (3개 엔드포인트)
├── statistics.ts     # 통계 API (5개 엔드포인트)
├── purchaseHistory.ts # 구매이력 API (2개 엔드포인트)
└── recommendations.ts # 추천 API (2개 엔드포인트)
```

### 백엔드 연동 절차

#### 1단계: 환경 변수 설정

`.env` 파일 생성:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
```

#### 2단계: API 클라이언트 설정

`src/services/api/client.ts` 파일 생성:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  },
};
```

#### 3단계: Mock 로직 제거

각 API 파일 (`auth.ts`, `chat.ts` 등)에서:

```typescript
// ❌ Mock 코드 제거
export const chatApi = {
  sendMessage: async (user_id: number, message: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));  // 제거
    const mockProducts: Product[] = [...];  // 제거
    return { success: true, data: mockProducts };  // 제거
  }
};

// ✅ 실제 API 호출로 변경
export const chatApi = {
  sendMessage: async (user_id: number, message: string) => {
    const data = await apiClient.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ user_id, message }),
    });
    return { success: true, data };
  }
};
```

#### 4단계: 타입 검증

API 응답 타입이 CLAUDE.md 명세와 일치하는지 확인:

```typescript
// ERD 기반 타입 (변경 금지)
interface SendMessageResponse {
  user_id: number;
  ai_message: string;
  type: number;
  recommendationItems: Product[];
}

// 백엔드 응답이 이 타입과 정확히 일치해야 함
```

### 중요 사항

**🚨 타입 변경 금지**

API 응답 타입은 CLAUDE.md에 정의된 ERD 기반 구조를 따릅니다. 백엔드는 이 타입에 맞춰 응답해야 합니다.

**🚨 LocalStorage 제거**

실제 백엔드 연동 시 LocalStorage 기반 게스트 장바구니는 제거하고 서버 기반 장바구니로 대체해야 합니다.

**🚨 인증 토큰**

모든 인증이 필요한 API는 `Authorization: Bearer {token}` 헤더를 포함해야 합니다.

---

## 개발 가이드

### 코드 스타일

#### 컴포넌트 작성 규칙

```typescript
// ✅ 올바른 컴포넌트 구조
interface ComponentProps {
  title: string;
  onClose: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onClose }) => {
  // 1. 상태 관리
  const [state, setState] = useState<StateType>(initialState);

  // 2. Context 사용
  const { user } = useAuth();

  // 3. 이펙트
  useEffect(() => {
    // ...
  }, []);

  // 4. 이벤트 핸들러
  const handleClick = () => {
    // ...
  };

  // 5. 렌더링
  return <div>...</div>;
};
```

### 디버깅 가이드

#### TypeScript 에러 확인

```bash
npx tsc --noEmit
```

#### Context 관련 에러

**에러:** "useAuth must be used within AuthProvider"

**원인:** Context Provider 외부에서 hook 사용

**해결:**
```typescript
// App.tsx에서 모든 컴포넌트가 <AppProvider> 내부에 있는지 확인
<AppProvider>
  <Component />  {/* 여기서 useAuth 사용 가능 */}
</AppProvider>
```

---

## 알려진 제한사항

### 1. Fast Refresh 비활성화

**원인:** Context Provider와 custom hook이 같은 파일에 정의됨

**영향:** 코드 변경 시 전체 페이지 리로드 발생 (개발 경험 저하)

**해결 방법:** 없음 (현재 아키텍처 유지)

### 2. Mock API

**현재:** 모든 API 응답이 하드코딩된 Mock 데이터

**영향:** 실제 서버 없이 UI 개발 및 테스트 가능

**백엔드 연동 시:** API 서비스 파일의 Mock 로직만 제거하고 실제 fetch 호출로 변경

### 3. ESLint 미설정

**현재:** `eslint.config.js` 파일 존재하지만 실질적 규칙 없음

**영향:** TypeScript 컴파일러만으로 타입 체크

### 4. 테스트 없음

**현재:** 테스트 프레임워크 미설정

**영향:** 수동 테스트 필요

---

## 문제 해결

### 빌드 실패

```bash
# 캐시 삭제
rm -rf node_modules dist

# 재설치
npm install

# 빌드
npm run build
```

### 타입 에러

```bash
# TypeScript 검사
npx tsc --noEmit
```

### 개발 서버 포트 충돌

`vite.config.js` 수정:

```javascript
export default defineConfig({
  server: {
    port: 3000,  // 다른 포트로 변경
  }
})
```

---

## 추가 문서

- **[CLAUDE.md](CLAUDE.md)** - AI 개발 가이드 및 상세 프로젝트 규칙
- **[API_SPECIFICATION.md](API_SPECIFICATION.md)** - 전체 API 명세서 및 ERD
- **[ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md)** - 아키텍처 개요

---

## 라이선스

대학교 졸업 프로젝트 - 교육 목적

---

## 팀

백엔드 개발자를 위해 작성된 문서입니다. 프론트엔드 관련 질문이나 이슈는 프론트엔드 담당자에게 문의하세요.
