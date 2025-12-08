# 사용자 맞춤형 쇼핑 비서 서비스 (Shopping Assistant)

**AI 기반 쇼핑 어시스턴트 서비스** - OpenAI API와 MCP(Model Context Protocol) 기반의 지능형 쇼핑 추천 시스템

---

## 목차

- [서비스 소개](#서비스-소개)
- [주요 기능](#주요-기능)
- [서비스 화면](#서비스-화면)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [개발 가이드](#개발-가이드)
- [상세 문서](#상세-문서)

---

## 서비스 소개

쇼핑 비서 서비스는 OpenAI API와 MCP(Model Context Protocol) 서버를 활용하여 사용자에게 맞춤형 쇼핑 추천과 통계 분석을 제공하는 AI 기반 쇼핑 어시스턴트입니다.

### 핵심 가치

- **지능형 대화**: OpenAI GPT 모델을 통한 자연스러운 대화 기반 쇼핑
- **맞춤형 추천**: MCP 서버를 통한 사용자 맞춤 상품 추천
- **사용자 맞춤 추천**: 추천시스템을 통한 사용자 맞춤 상품 추천 제고
- **통계 분석**: 구매 이력 기반 지출 패턴 분석 및 인사이트 제공
- **멀티 플랫폼**: 쿠팡, 네이버쇼핑 등 다양한 쇼핑 플랫폼 통합

---

## 주요 기능

### 1. AI 채팅 기반 쇼핑

사용자와 자연스러운 대화를 통해 쇼핑을 도와주는 AI 어시스턴트

- 자연어 이해 및 의도 분석
- 실시간 상품 검색 및 추천
- 대화 기록 저장 및 컨텍스트 유지
- 3가지 응답 유형 지원:
  - **커머스 조회** : 커머스 API를 활용한 상품 조회
  - **상품 추천** : 추천 상품 목록 제공
  - **통계 분석** : 구매 패턴 분석 결과

### 2. 장바구니 관리

효율적인 장바구니 시스템으로 쇼핑 경험 최적화

- 상품 추가/삭제
- 플랫폼별 상품 구분
- 실제 상품 url로 이동

### 3. 구매 이력 관리

과거 구매 내역 조회 및 관리

- 시간순 구매 기록 조회
- 플랫폼별 구매 내역
- 상품별 구매 정보

### 4. 통계 분석

AI 기반 지출 패턴 분석 및 인사이트 제공

- **전체 통계 대시보드**
  - 총 지출액
  - 총 주문 수
  - 평균 주문 금액
  - 가장 많이 구매한 카테고리
  - 플랫폼별 구매 통계

- **AI 통계 분석**
  - OpenAI 기반 지출 패턴 분석
  - 절약 팁 제공
  - 구매 습관 인사이트

### 5. 상품 추천 시스템

MCP 서버 기반의 지능형 추천 엔진

- **구매 기반 추천**: 과거 구매 이력 분석
- **플랫폼 검색**: 다중 플랫폼 상품 검색
- **가격 비교**: 동일 상품 플랫폼별 가격 비교
- **절약률 표시**: 원가 대비 절약 금액 표시

---

## 서비스 화면

### 1. 로그인 / 회원가입

<p align="center">
  <img src="docs/images/signin.png" width="490" alt="로그인 화면">
  <img src="docs/images/signup.png" width="400" alt="회원가입 화면">
</p>

- 전화번호 기반 인증
- 간편한 회원가입

### 2. 메인 페이지 (채팅)

<p align="center">
  <img src="docs/images/main_page.png" width="800" alt="메인 페이지">
</p>

- 중앙: AI 채팅 인터페이스
- 우측: 장바구니 패널
- 하단: 네비게이션 바

### 3. 결제 통계 페이지

<p align="center">
  <img src="docs/images/statisics.png" width="800" alt="결제 통계 페이지">
</p>

- 좌측: 통계 분석 결과
- 우측: 통계 선택 옵션
  - 전체 통계
  - 기간별 통계
  - AI 통계 분석

### 4. 구매 이력 페이지

<p align="center">
  <img src="docs/images/history.png" width="800" alt="구매 이력 페이지">
</p>

- 구매 내역 리스트
- 상품별 상세 정보
- 플랫폼별 필터링

### 5. 모달 시스템

<p align="center">
  <img src="docs/images/item_detail.png" width="600" alt="상품 상세 모달">
</p>

- **상품 상세 모달**
  - 상품 이미지
  - 가격 정보 (할인가 표시)
  - 평점 및 리뷰
  - 플랫폼 이동 버튼
  - 이전/다음 상품 네비게이션
  - 구매 완료 기능

<p align="center">
  <img src="docs/images/recommendation.png" width="600" alt="상품 추천 모달">
</p>

- **상품 추천 모달**
  - 추천 상품 그리드
  - 절약률 표시
  - 장바구니 추가

---

## 기술 스택

### Frontend

```
React 19.0.0
TypeScript 5.6.3
Vite 6.0.1
CSS Modules
```

**주요 라이브러리:**
- React Router DOM - 라우팅
- Context API - 전역 상태 관리
- Fetch API - HTTP 통신

### Backend

```
Python 3.12
FastAPI 0.115.6
PostgreSQL 16
SQLAlchemy 2.0.36
Alembic 1.14.0
```

**주요 라이브러리:**
- FastMCP 2.13.0 - MCP 서버 구현
- OpenAI Python SDK - OpenAI API 연동
- Pydantic - 데이터 검증
- python-dotenv - 환경 변수 관리

### Infrastructure

```
Docker & Docker Compose
Nginx (Reverse Proxy + SSL)
Let's Encrypt (SSL Certificate)
AWS EC2 (Deployment)
DuckDNS (Dynamic DNS)
```

---

## 시스템 아키텍처

### 전체 구조

```
┌─────────────┐
│   Browser   │
│  (React 19) │
└──────┬──────┘
       │ HTTPS
       ↓
┌──────────────┐
│    Nginx     │
│  (Reverse    │
│   Proxy)     │
└──────┬───────┘
       │
       ├─→ Frontend (Port 5173)
       ├─→ Backend API (Port 8000)
       └─→ MCP Servers (Ports 8001-8003)
            ├─ Recommendation MCP (8001)
            ├─ Shopping Search MCP (8002)
            └─ Statistics MCP (8003)
```

### MCP (Model Context Protocol) 아키텍처

```
┌──────────────────┐
│  OpenAI API      │
│  (GPT-5) │
└────────┬─────────┘
         │ HTTPS
         ↓
┌──────────────────┐
│  Backend FastAPI │
│   (Orchestrator) │
└────────┬─────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│Purchase│ │Shopping│ │Statist-│ │PostgreSQL│
│  MCP   │ │  MCP   │ │ics MCP │ │ Database │
└────────┘ └────────┘ └────────┘ └──────────┘
```

**데이터 흐름:**
1. 사용자가 프론트엔드에서 메시지 전송
2. 백엔드 Orchestrator가 의도 분석
3. 적절한 MCP 서버 선택 및 호출
4. OpenAI API가 MCP 도구를 활용하여 응답 생성
5. 결과를 프론트엔드로 반환

### 상세 아키텍처 설명

자세한 MCP 아키텍처 및 프롬프트 엔지니어링 전략은 다음 문서를 참조하세요:
- [MCP 아키텍처 문서](docs/MCP_ARCHITECTURE.md)
- [프롬프트 엔지니어링 문서](docs/PROMPTS.md)

---

## 프로젝트 구조

```
capstoneProject/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── auth/       # 인증 관련
│   │   │   ├── cart/       # 장바구니
│   │   │   ├── chat/       # 채팅 인터페이스
│   │   │   ├── modals/     # 모달 컴포넌트
│   │   │   ├── navigation/ # 네비게이션
│   │   │   ├── panels/     # 동적 패널
│   │   │   └── statistics/ # 통계 화면
│   │   ├── contexts/        # React Context (전역 상태)
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── ...
│   │   ├── services/        # API 서비스
│   │   │   └── api/
│   │   ├── types/           # TypeScript 타입 정의
│   │   └── hooks/           # Custom React Hooks
│   ├── public/              # 정적 파일
│   └── CLAUDE.md            # 상세 개발 문서
│
├── backend/                 # Python FastAPI 백엔드
│   ├── app/
│   │   ├── api/            # API 엔드포인트
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── cart.py
│   │   │   ├── statistics.py
│   │   │   └── ...
│   │   ├── services/       # 비즈니스 로직
│   │   ├── models/         # Pydantic 모델
│   │   ├── db/             # SQLAlchemy 모델
│   │   ├── ai/             # AI/MCP 관련
│   │   │   ├── orchestrator.py    # AI 오케스트레이터
│   │   │   ├── openai_client.py   # OpenAI 클라이언트
│   │   │   ├── mcp_client.py      # MCP 클라이언트
│   │   │   └── prompt_templates.py # 프롬프트 템플릿
│   │   └── mcp_servers/    # MCP 서버 구현
│   │       ├── recommendation_server.py
│   │       ├── shopping_server.py
│   │       └── statistics_server.py
│   ├── migrations/         # Alembic 마이그레이션
│   └── requirements.txt
│
├── nginx/                   # Nginx 설정
│   └── nginx.conf
│
├── docker-compose.yml       # Docker Compose 설정
├── docker-compose.local.yml # 로컬 개발용
└── docs/                    # 추가 문서
    ├── MCP_ARCHITECTURE.md  # MCP 아키텍처
    └── PROMPTS.md           # 프롬프트 전략
```

---

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- Python 3.12+
- PostgreSQL 16+
- Docker & Docker Compose (배포 시)

### 로컬 개발 환경

#### 1. Frontend 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

#### 2. Backend 실행

```bash
cd backend

# 가상 환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (DATABASE_URL, OPENAI_API_KEY 등)

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# http://localhost:8000
```

#### 3. MCP 서버 실행

```bash
cd backend

# MCP 환경 설정
source .mcp-env/bin/activate

# Recommendation MCP
python -m app.mcp_servers.recommendation_server

# Shopping Search MCP (다른 터미널)
python -m app.mcp_servers.shopping_server

# Statistics MCP (다른 터미널)
python -m app.mcp_servers.statistics_server
```

### Docker Compose 배포

```bash
# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 환경 변수 설정

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shopping_db

# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
OPENAI_REQUEST_TIMEOUT=180

# MCP Servers
MCP_PURCHASE_URL=https://your-domain.com/mcp-recommend/mcp
MCP_SEARCH_URL=https://your-domain.com/mcp-shopping/mcp
MCP_STATISTICS_URL=https://your-domain.com/mcp-statistics/mcp

# JWT
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 개발 가이드

### Frontend 개발

#### 명령어
```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 미리보기
npm run lint       # 코드 린팅
npx tsc --noEmit   # TypeScript 타입 체크
```

#### 코드 스타일
- **TypeScript Strict Mode** 사용
- **CSS Modules** 사용 (camelCase)
- **Path Alias** 사용 (`@/*`)
- **Context API** 기반 상태 관리

### Backend 개발

#### 명령어
```bash
# 개발 서버 실행
uvicorn app.main:app --reload

# 데이터베이스 마이그레이션
alembic revision --autogenerate -m "description"
alembic upgrade head

# 테스트 (구현 예정)
pytest
```

#### API 문서
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 데이터베이스 스키마

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) UNIQUE NOT NULL,  -- 전화번호
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Cart Items
CREATE TABLE cart_items (
    product_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id),
    platform_name VARCHAR(50) NOT NULL,
    price INTEGER NOT NULL,
    product_name VARCHAR(255),
    product_url VARCHAR(512),
    image_url VARCHAR(512),
    category VARCHAR(100),
    PRIMARY KEY (product_id, user_id)
);

-- Purchase History
CREATE TABLE purchase_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    price INTEGER NOT NULL,
    product_name VARCHAR(255),
    category VARCHAR(100),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (전체 상품)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    price INTEGER NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    review_count INTEGER DEFAULT 0
);
```

---

## 상세 문서

### 프로젝트 문서
- [MCP 아키텍처](docs/MCP_ARCHITECTURE.md) - MCP 서버 구조 및 통신 프로토콜
- [프롬프트 엔지니어링](docs/PROMPTS.md) - AI 프롬프트 전략 및 최적화

---

## 라이선스

이 프로젝트는 대학교 졸업 프로젝트로 개발되었습니다.

---

## 팀

**캡스톤 프로젝트 팀**
- 개발 기간: 2024.10 - 2024.12
- 프로젝트 유형: 졸업 프로젝트

---

## 문의

프로젝트 관련 문의사항은 이슈를 통해 등록해주세요.
