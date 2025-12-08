# 쇼핑 비서 서비스 - 프론트엔드

> AI 기반 쇼핑 어시스턴트 대학교 졸업 프로젝트 - React 프론트엔드 애플리케이션

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
9. [배포 정보](#배포-정보)

---

## 프로젝트 개요

**쇼핑 비서 서비스**는 OpenAI API와 MCP(Model Context Protocol) 서버를 활용한 AI 기반 쇼핑 어시스턴트입니다.

### 주요 기능

- 🤖 **AI 채팅 인터페이스**: OpenAI 기반 대화형 쇼핑 상담
- 🛒 **스마트 장바구니**: 실시간 장바구니 관리 및 요약
- 📊 **AI 구매 통계 분석**: OpenAI 기반 지출 패턴 분석 및 절약 조언
- 🎯 **MCP 기반 상품 추천**: 구매 이력 기반 맞춤 추천 시스템
- 📜 **구매 이력 관리**: 과거 구매 내역 조회 및 구매 완료 기능
- 🌐 **다중 플랫폼 통합**: 쿠팡, 네이버쇼핑, 11번가 등
- 💳 **구매 완료 기능**: 장바구니 → 구매 이력 전환

### 현재 상태

- ✅ 프론트엔드 UI 완성
- ✅ 7개 Context 기반 상태 관리 구현
- ✅ **백엔드 연동 완료** (FastAPI + PostgreSQL)
- ✅ **MCP 서버 통합** (Recommendation, Shopping, Statistics)
- ✅ **배포 완료** (Docker + Nginx + SSL)
- 🎯 목표: **운영 중인 서비스**

---

## 기술 스택

### 코어 기술

```
React 19.0.0        - UI 라이브러리
TypeScript 5.6.3    - 타입 안전성
Vite 6.0.1          - 빌드 도구 및 개발 서버
```

### 개발 도구

```
ESLint 9.36.0       - 코드 린팅
CSS Modules         - 컴포넌트 스타일링 (camelCase)
```

### 프로젝트 규모

```
총 코드 라인: ~7,500+ lines
주요 컴포넌트: 35개
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
│   │   ├── auth/           # 인증 관련 컴포넌트
│   │   │   ├── LoginForm/        # 로그인 폼
│   │   │   └── RegisterForm/     # 회원가입 폼
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
│   │   │   ├── ProductDetailModal/       # 상품 상세 정보 (간소화됨)
│   │   │   └── ProductRecommendationModal/ # 상품 추천 모달
│   │   ├── navigation/     # 네비게이션
│   │   │   └── BottomNavigation/  # 하단 네비게이션 바
│   │   ├── panels/         # 동적 패널 시스템
│   │   │   ├── DynamicPanel/         # 패널 컨테이너
│   │   │   ├── ProductListPanel/     # 상품 목록
│   │   │   └── ...
│   │   ├── purchaseHistory/ # 구매 이력 대시보드
│   │   │   └── PurchaseHistoryDashboard/
│   │   ├── statistics/     # 통계 대시보드
│   │   │   ├── StatisticsDashboard/      # 통계 메인 화면
│   │   │   ├── StatisticsNavigation/     # 통계 네비게이션
│   │   │   ├── KPICards/                 # KPI 카드
│   │   │   └── Charts/                   # 차트 컴포넌트
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
│   │   ├── api/            # API 서비스
│   │   │   ├── auth.ts           # 로그인, 회원가입
│   │   │   ├── chat.ts           # 채팅 메시지, 기록
│   │   │   ├── cart.ts           # 장바구니 CRUD
│   │   │   ├── statistics.ts     # 통계 데이터
│   │   │   ├── purchaseHistory.ts # 구매 이력
│   │   │   └── recommendations.ts # 상품 추천
│   │   └── storage/        # 로컬 스토리지 유틸
│   │       └── localStorage.ts
│   ├── types/              # TypeScript 타입 정의
│   ├── hooks/              # Custom React Hooks
│   │   └── useWindowSize.ts # 반응형 브레이크포인트
│   ├── styles/             # 전역 스타일
│   ├── App.tsx             # 루트 컴포넌트
│   ├── main.tsx            # 엔트리 포인트
│   └── index.css           # 전역 CSS
├── public/                 # 정적 파일
├── CLAUDE.md               # 상세 개발 가이드 (AI 참고용)
├── package.json            # 의존성 관리
├── tsconfig.json           # TypeScript 설정
├── vite.config.ts          # Vite 설정
└── README.md               # 이 파일
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
Router (페이지 라우팅)
  ├── LoginPage
  ├── MainLayout (메인 페이지)
  │   ├── ChatInterface (좌측 - 채팅)
  │   ├── CartSidebar (우측 - 장바구니)
  │   └── DynamicPanel (하단 - 동적 패널)
  ├── StatisticsDashboard (통계 페이지)
  └── PurchaseHistoryDashboard (구매이력 페이지)
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

### 3. 백엔드 연동 구조

```
Frontend → Backend API → OpenAI API
                      ↓
                   MCP Servers
                   ├── Recommendation MCP (구매 기반 추천)
                   ├── Shopping MCP (상품 검색)
                   └── Statistics MCP (통계 분석)
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
  type?: number;                  // 0: 일반, 1: 상품추천, 2: 통계분석
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

  addItem: (productId, quantity?, variantId?) => Promise<void>;
  removeItem: (itemId) => Promise<void>;
  updateQuantity: (itemId, quantity) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;  // 장바구니 새로고침
}
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

### 3. CSS Modules

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

---

## API 통합 가이드

### 현재 상태: 백엔드 연동 완료

모든 API는 **실제 백엔드 서버**와 연동되어 있습니다.

### API 서비스 구조

```
src/services/api/
├── auth.ts           # 인증 API (2개 엔드포인트)
├── chat.ts           # 채팅 API (2개 엔드포인트)
├── cart.ts           # 장바구니 API (3개 엔드포인트)
├── statistics.ts     # 통계 API (5개 엔드포인트)
├── purchaseHistory.ts # 구매이력 API (2개 엔드포인트)
└── recommendations.ts # 추천 API (1개 엔드포인트)
```

### 환경 변수 설정

`.env` 파일:

```bash
VITE_API_BASE_URL=https://csid-shopping.duckdns.org/api
```

### API 응답 타입

모든 API 응답은 CLAUDE.md에 정의된 ERD 기반 구조를 따릅니다.

**채팅 응답 예시:**
```typescript
interface SendMessageResponse {
  user_id: number;
  ai_message: string;
  type: number;  // 0: 일반, 1: 상품추천, 2: 통계분석
  recommendationItems?: Product[];
}
```

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

## 배포 정보

### 배포 환경

- **호스팅**: AWS EC2
- **도메인**: https://csid-shopping.duckdns.org
- **SSL**: Let's Encrypt
- **Reverse Proxy**: Nginx
- **컨테이너**: Docker Compose

### 배포 구조

```
EC2 Instance
├── Nginx (Port 80/443)
│   ├── Frontend (/)
│   ├── Backend API (/api)
│   └── MCP Servers (/mcp-*)
├── Frontend Container (Port 5173)
├── Backend Container (Port 8000)
├── PostgreSQL Container (Port 5432)
└── MCP Server Containers (Port 5001-5003)
```

### 주요 기능 URL

- **메인 페이지**: https://csid-shopping.duckdns.org
- **API 엔드포인트**: https://csid-shopping.duckdns.org/api
- **MCP 서버**:
  - Recommendation: https://csid-shopping.duckdns.org/mcp-recommend
  - Shopping: https://csid-shopping.duckdns.org/mcp-shopping
  - Statistics: https://csid-shopping.duckdns.org/mcp-statistics

---

## 알려진 제한사항

### 1. Fast Refresh 비활성화

**원인:** Context Provider와 custom hook이 같은 파일에 정의됨

**영향:** 코드 변경 시 전체 페이지 리로드 발생 (개발 경험 저하)

### 2. MCP 424 에러

**증상:** OpenAI API가 MCP 서버 호출 시 간헐적 424 에러 발생

**원인:** FastMCP 2.13.0과 OpenAI Responses API 호환성 문제

**해결:** Fallback 메커니즘 구현 (기본 추천 시스템으로 자동 전환)

---

## 추가 문서

- **[CLAUDE.md](CLAUDE.md)** - AI 개발 가이드 및 상세 프로젝트 규칙
- **[프로젝트 루트 README](../README.md)** - 전체 프로젝트 개요
- **[MCP 아키텍처](../docs/MCP_ARCHITECTURE.md)** - MCP 서버 구조
- **[프롬프트 전략](../docs/PROMPTS.md)** - AI 프롬프트 엔지니어링

---

## 라이선스

대학교 졸업 프로젝트 - 교육 목적
