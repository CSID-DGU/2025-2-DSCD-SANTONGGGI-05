# API 명세서 (API Specification)

**쇼비자 (Shopping Assistant)** REST API 상세 명세

버전: v1.0.0
최종 업데이트: 2024-12-16

---

## 목차

1. [개요](#개요)
2. [인증 API](#인증-api-authapi)
3. [채팅 API](#채팅-api-chatapi)
4. [장바구니 API](#장바구니-api-cartapi)
5. [구매 이력 API](#구매-이력-api-purchasehistoryapi)
6. [통계 API](#통계-api-statisticsapi)
7. [추천 API](#추천-api-recommendationsapi)
8. [공통 타입 정의](#공통-타입-정의)
9. [에러 코드](#에러-코드)

---

## 개요

### Base URL
```
Mock: localhost:5173
Production: TBD
```

### 인증 방식
- **Bearer Token**: JWT 기반 인증
- **Header**: `Authorization: Bearer <access_token>`

### 응답 형식
모든 API는 다음 형식으로 응답합니다:

```typescript
interface ApiResponse<T> {
  success: boolean;      // 성공 여부
  data?: T;             // 응답 데이터
  error?: string;       // 에러 메시지
  message?: string;     // 추가 메시지
}
```

### HTTP 상태 코드
- `200` - 성공
- `201` - 생성 성공
- `400` - 잘못된 요청
- `401` - 인증 실패
- `403` - 권한 없음
- `404` - 리소스 없음
- `500` - 서버 에러

---

## 인증 API (authApi)

### 1. 로그인

사용자 로그인 및 인증 토큰 발급

**Endpoint**
```
POST /api/auth/login
```

**Request Body**
```typescript
{
  email: string;        // 이메일 (필수)
  password: string;     // 비밀번호 (필수)
}
```

**Example Request**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin';
      createdAt: Date;
      updatedAt: Date;
    },
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;      // 토큰 만료 시간
    }
  }
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "Demo User",
      "role": "user",
      "createdAt": "2024-12-16T00:00:00.000Z",
      "updatedAt": "2024-12-16T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-12-17T00:00:00.000Z"
    }
  }
}
```

**Error Responses**
- `400` - 이메일 또는 비밀번호 누락
- `401` - 인증 정보 불일치

**FastAPI Python 구현 예시**

```python
# models/auth.py - Pydantic 모델
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    createdAt: datetime
    updatedAt: datetime

class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: datetime

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: AuthTokens

class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None

# database/models.py - SQLAlchemy 모델
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# routes/auth.py - FastAPI 라우터
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24시간

def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=ApiResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    사용자 로그인

    - **email**: 사용자 이메일
    - **password**: 비밀번호
    """
    # 사용자 조회
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    # 액세스 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )

    # 리프레시 토큰 생성
    refresh_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "type": "refresh"},
        expires_delta=timedelta(days=30)
    )

    expires_at = datetime.utcnow() + access_token_expires

    return ApiResponse(
        success=True,
        data={
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "createdAt": user.created_at.isoformat(),
                "updatedAt": user.updated_at.isoformat()
            },
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "expiresAt": expires_at.isoformat()
            }
        }
    )

# main.py - FastAPI 앱 초기화
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Shopping Assistant API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 앱 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router)

# 데이터베이스 초기화
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./shopping_assistant.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 테이블 생성
Base.metadata.create_all(bind=engine)
```

**사용 방법**
```bash
# 의존성 설치
pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart

# 서버 실행
uvicorn main:app --reload --port 8000

# API 테스트
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

### 2. 회원가입

새 사용자 계정 생성

**Endpoint**
```
POST /api/auth/register
```

**Request Body**
```typescript
{
  email: string;        // 이메일 (필수)
  password: string;     // 비밀번호 (필수, 최소 8자)
  name: string;         // 이름 (필수)
}
```

**Example Request**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User"
}
```

**Response (201 Created)**
```typescript
{
  success: true,
  data: {
    user: User;
    tokens: AuthTokens;
  }
}
```

**Error Responses**
- `400` - 필수 필드 누락 또는 유효하지 않은 데이터
- `409` - 이미 존재하는 이메일

---

### 3. 토큰 갱신

만료된 Access Token 갱신

**Endpoint**
```
POST /api/auth/refresh-token
```

**Request Body**
```typescript
{
  refreshToken: string;  // Refresh Token (필수)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    accessToken: string;
    expiresAt: Date;
  }
}
```

**Error Responses**
- `401` - 유효하지 않은 Refresh Token
- `403` - 만료된 Refresh Token

---

### 4. 프로필 업데이트

사용자 프로필 정보 수정

**Endpoint**
```
PATCH /api/auth/profile
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Request Body**
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    user: User;
  }
}
```

---

### 5. 사용자 선호도 업데이트

사용자 쇼핑 선호도 설정

**Endpoint**
```
PATCH /api/auth/preferences
```

**Request Body**
```typescript
{
  preferences: {
    favoriteCategories?: string[];
    priceRange?: { min: number; max: number };
    notificationSettings?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  }
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    user: User;  // 업데이트된 preferences 포함
  }
}
```

---

### 6. 인증 상태 확인

현재 로그인 상태 및 사용자 정보 조회

**Endpoint**
```
GET /api/auth/check
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    user: User;
    tokens: AuthTokens;
  }
}
```

**Error Responses**
- `401` - 인증되지 않음

---

## 채팅 API (chatApi)

### 1. 메시지 전송

사용자 메시지 전송 및 AI 응답 수신

**Endpoint**
```
POST /api/chat/messages
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Request Body**
```typescript
{
  message: string;           // 메시지 내용 (필수)
  sessionId: string;         // 세션 ID (필수)
  attachments?: ChatAttachment[];  // 첨부 파일 (선택)
  context?: {
    cartItems?: string[];    // 현재 장바구니 아이템
    userPreferences?: any;   // 사용자 선호도
  };
}
```

**Example Request**
```json
{
  "message": "나 물 6개 사야 될 것 같아",
  "sessionId": "session-123",
  "context": {
    "cartItems": [],
    "userPreferences": {}
  }
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    message: {
      id: string;
      content: string;
      role: 'user' | 'assistant';
      type: 'text' | 'product' | 'action';
      createdAt: Date;
      updatedAt: Date;
      metadata?: {
        status: 'sending' | 'sent' | 'failed';
        edited?: boolean;
        editedAt?: Date;
      };
    };
    panelData?: PanelData;   // 패널 확장 데이터
    cartUpdates?: {          // 장바구니 업데이트
      type: 'add' | 'update_quantity' | 'remove';
      productId?: string;
      itemId?: string;
      quantity?: number;
      variantId?: string;
    }[];
  }
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-456",
      "content": "물 6개를 추천해 드릴게요. 다음 상품들을 확인해보세요.",
      "role": "assistant",
      "type": "text",
      "createdAt": "2024-12-16T12:00:00.000Z",
      "updatedAt": "2024-12-16T12:00:00.000Z"
    },
    "panelData": {
      "type": "product_list",
      "title": "물 추천 상품",
      "products": [...]
    }
  }
}
```

**FastAPI Python 구현 예시**

```python
# models/chat.py - Pydantic 모델
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatAttachment(BaseModel):
    id: str
    filename: str
    url: str
    type: str
    size: int

class MessageMetadata(BaseModel):
    status: str = "sent"
    edited: Optional[bool] = False
    editedAt: Optional[datetime] = None

class ChatMessage(BaseModel):
    id: str
    content: str
    role: str  # 'user' | 'assistant'
    type: str  # 'text' | 'product' | 'action'
    createdAt: datetime
    updatedAt: datetime
    metadata: Optional[MessageMetadata] = None

class SendMessageRequest(BaseModel):
    message: str
    sessionId: str
    attachments: Optional[List[ChatAttachment]] = None
    context: Optional[Dict[str, Any]] = None

class CartUpdate(BaseModel):
    type: str  # 'add' | 'update_quantity' | 'remove'
    productId: Optional[str] = None
    itemId: Optional[str] = None
    quantity: Optional[int] = None
    variantId: Optional[str] = None

class SendMessageResponse(BaseModel):
    message: ChatMessage
    panelData: Optional[Dict[str, Any]] = None
    cartUpdates: Optional[List[CartUpdate]] = None

# database/models.py - SQLAlchemy 모델 추가
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계 설정
    messages = relationship("Message", back_populates="session")
    user = relationship("User")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    type = Column(String, default="text")  # 'text' | 'product' | 'action'
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계 설정
    session = relationship("ChatSession", back_populates="messages")

# routes/chat.py - FastAPI 라우터
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List

router = APIRouter(prefix="/api/chat", tags=["chat"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """JWT 토큰에서 현재 사용자 추출"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

@router.post("/messages", response_model=ApiResponse)
async def send_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    메시지 전송 및 AI 응답 생성

    - **message**: 메시지 내용
    - **sessionId**: 채팅 세션 ID
    - **context**: 컨텍스트 정보 (장바구니, 사용자 선호도 등)
    """
    # 세션 확인
    session = db.query(ChatSession).filter(
        ChatSession.id == request.sessionId,
        ChatSession.user_id == user_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    # 사용자 메시지 저장
    user_message = Message(
        id=str(uuid.uuid4()),
        session_id=request.sessionId,
        content=request.message,
        role="user",
        type="text",
        metadata={"status": "sent"}
    )
    db.add(user_message)
    db.commit()

    # AI 응답 생성 (여기서는 간단한 예시)
    # 실제로는 LLM API 호출 또는 자체 AI 모델 사용
    ai_response_content = process_ai_response(request.message, request.context)

    # AI 응답 저장
    ai_message = Message(
        id=str(uuid.uuid4()),
        session_id=request.sessionId,
        content=ai_response_content["text"],
        role="assistant",
        type="text"
    )
    db.add(ai_message)
    db.commit()

    # 패널 데이터 생성 (상품 목록 등)
    panel_data = None
    cart_updates = None

    if "물" in request.message or "water" in request.message.lower():
        panel_data = {
            "type": "product_list",
            "title": "물 추천 상품",
            "products": get_water_products(db)
        }

    return ApiResponse(
        success=True,
        data={
            "message": {
                "id": ai_message.id,
                "content": ai_message.content,
                "role": ai_message.role,
                "type": ai_message.type,
                "createdAt": ai_message.created_at.isoformat(),
                "updatedAt": ai_message.updated_at.isoformat()
            },
            "panelData": panel_data,
            "cartUpdates": cart_updates
        }
    )

def process_ai_response(message: str, context: Optional[Dict] = None) -> Dict:
    """
    AI 응답 생성 로직
    실제로는 OpenAI GPT, Claude, 또는 자체 LLM 사용
    """
    # 간단한 키워드 기반 응답 (실제로는 LLM 사용)
    if "물" in message:
        return {
            "text": "물 6개를 추천해 드릴게요. 다음 상품들을 확인해보세요.",
            "intent": "product_search",
            "products": ["water-2l", "water-500ml"]
        }
    return {
        "text": "무엇을 도와드릴까요?",
        "intent": "general"
    }

def get_water_products(db: Session) -> List[Dict]:
    """물 관련 상품 조회"""
    # 실제로는 Product 테이블에서 조회
    return [
        {
            "id": "water-2l",
            "name": "미네랄 워터 2L",
            "price": 1500,
            "image": "https://cdn.pixabay.com/..."
        }
    ]
```

---

### 2. 채팅 기록 조회

사용자의 채팅 기록 조회

**Endpoint**
```
GET /api/chat/history?sessionId={sessionId}
```

**Query Parameters**
- `sessionId` (optional): 특정 세션의 기록 조회

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    messages: ChatMessage[];
  }
}
```

---

### 3. 세션 목록 조회

사용자의 모든 채팅 세션 조회

**Endpoint**
```
GET /api/chat/sessions
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: ChatSession[];
}
```

**ChatSession Type**
```typescript
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalMessages: number;
    lastActivity: Date;
  };
}
```

---

### 4. 새 세션 생성

새로운 채팅 세션 생성

**Endpoint**
```
POST /api/chat/sessions
```

**Request Body**
```typescript
{
  title?: string;  // 세션 제목 (선택)
}
```

**Response (201 Created)**
```typescript
{
  success: true,
  data: ChatSession;
}
```

---

### 5. 세션 삭제

채팅 세션 삭제

**Endpoint**
```
DELETE /api/chat/sessions/{sessionId}
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "Session deleted successfully"
}
```

---

### 6. 메시지 수정

기존 메시지 내용 수정

**Endpoint**
```
PATCH /api/chat/messages/{messageId}
```

**Request Body**
```typescript
{
  content: string;  // 새로운 메시지 내용
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    message: ChatMessage;  // 수정된 메시지
  }
}
```

---

### 7. 메시지 삭제

메시지 삭제

**Endpoint**
```
DELETE /api/chat/messages/{messageId}
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "Message deleted successfully"
}
```

---

## 장바구니 API (cartApi)

### 1. 장바구니 조회

현재 사용자의 장바구니 정보 조회

**Endpoint**
```
GET /api/cart
```

**Headers**
```
Authorization: Bearer <access_token> (선택, 게스트 지원)
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    items: CartItem[];
    summary: CartSummary;
  }
}
```

**CartItem Type**
```typescript
interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: { url: string; alt: string }[];
    brand: { id: string; name: string };
    category: { id: string; name: string };
    availability: { inStock: boolean; quantity: number };
  };
  variantId?: string;
  variant?: {
    id: string;
    name: string;
    attributes: Record<string, string>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**CartSummary Type**
```typescript
interface CartSummary {
  subtotal: number;      // 소계
  tax: number;           // 세금
  shipping: number;      // 배송비
  discount: number;      // 할인 금액
  total: number;         // 총액
  currency: string;      // 통화 (KRW, USD 등)
  itemCount: number;     // 총 아이템 수
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "productId": "water-2l",
        "product": {
          "id": "water-2l",
          "name": "미네랄 워터 2L",
          "price": 1500,
          "images": [{"url": "...", "alt": "미네랄 워터"}]
        },
        "quantity": 6,
        "unitPrice": 1500,
        "totalPrice": 9000
      }
    ],
    "summary": {
      "subtotal": 49500,
      "tax": 0,
      "shipping": 0,
      "discount": 0,
      "total": 49500,
      "currency": "KRW",
      "itemCount": 11
    }
  }
}
```

**FastAPI Python 구현 예시**

```python
# models/cart.py - Pydantic 모델
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class ProductImage(BaseModel):
    url: str
    alt: str

class Brand(BaseModel):
    id: str
    name: str

class Category(BaseModel):
    id: str
    name: str

class Availability(BaseModel):
    inStock: bool
    quantity: int

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    images: List[ProductImage]
    brand: Brand
    category: Category
    availability: Availability

class CartItemProduct(BaseModel):
    id: str
    productId: str
    product: Product
    quantity: int
    unitPrice: float
    totalPrice: float
    addedAt: datetime
    createdAt: datetime
    updatedAt: datetime

class CartSummary(BaseModel):
    subtotal: float
    tax: float
    shipping: float
    discount: float
    total: float
    currency: str
    itemCount: int

class CartResponse(BaseModel):
    items: List[CartItemProduct]
    summary: CartSummary

# database/models.py - SQLAlchemy 모델
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

class Cart(Base):
    __tablename__ = "carts"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # 게스트는 NULL
    session_id = Column(String, nullable=True)  # 게스트용 세션 ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    items = relationship("CartItem", back_populates="cart")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String, primary_key=True)
    cart_id = Column(String, ForeignKey("carts.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    brand_id = Column(String, ForeignKey("brands.id"))
    category_id = Column(String, ForeignKey("categories.id"))
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    brand = relationship("Brand")
    category = relationship("Category")
    images = relationship("ProductImage")

# routes/cart.py - FastAPI 라우터
from fastapi import APIRouter, Depends, HTTPException, Cookie
from sqlalchemy.orm import Session
import uuid

router = APIRouter(prefix="/api/cart", tags=["cart"])

def get_or_create_cart(
    db: Session,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
) -> Cart:
    """장바구니 조회 또는 생성 (게스트 지원)"""
    if user_id:
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    elif session_id:
        cart = db.query(Cart).filter(Cart.session_id == session_id).first()
    else:
        raise HTTPException(status_code=400, detail="사용자 정보 또는 세션 ID 필요")

    if not cart:
        cart = Cart(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart

def calculate_cart_summary(cart: Cart, db: Session) -> CartSummary:
    """장바구니 요약 계산"""
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()

    subtotal = sum(item.total_price for item in items)
    tax = subtotal * 0.1  # 10% 세금
    shipping = 0 if subtotal >= 50000 else 3000  # 5만원 이상 무료 배송
    discount = 0  # 할인 코드 적용 로직

    total = subtotal + tax + shipping - discount

    return CartSummary(
        subtotal=subtotal,
        tax=tax,
        shipping=shipping,
        discount=discount,
        total=total,
        currency="KRW",
        itemCount=len(items)
    )

@router.get("", response_model=ApiResponse)
async def get_cart(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
    session_id: Optional[str] = Cookie(None)
):
    """
    장바구니 조회 (게스트 지원)

    - 로그인 사용자: JWT 토큰으로 인증
    - 게스트: 쿠키 세션 ID 사용
    """
    cart = get_or_create_cart(db, user_id, session_id)

    # 장바구니 아이템 조회
    items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()

    cart_items = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            cart_items.append({
                "id": item.id,
                "productId": item.product_id,
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "images": [{"url": img.url, "alt": img.alt} for img in product.images]
                },
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "totalPrice": item.total_price
            })

    summary = calculate_cart_summary(cart, db)

    return ApiResponse(
        success=True,
        data={
            "items": cart_items,
            "summary": summary.dict()
        }
    )
```

---

### 2. 상품 추가

장바구니에 상품 추가

**Endpoint**
```
POST /api/cart/items
```

**Request Body**
```typescript
{
  productId: string;     // 상품 ID (필수)
  quantity: number;      // 수량 (필수)
  variantId?: string;    // 옵션 ID (선택)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    item: CartItem;
    summary: CartSummary;
  }
}
```

---

### 3. 상품 수량 변경

장바구니 아이템 수량 업데이트

**Endpoint**
```
PATCH /api/cart/items/{itemId}
```

**Request Body**
```typescript
{
  quantity: number;  // 새로운 수량 (필수)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    item: CartItem;
    summary: CartSummary;
  }
}
```

---

### 4. 상품 제거

장바구니에서 아이템 제거

**Endpoint**
```
DELETE /api/cart/items/{itemId}
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "Item removed from cart"
}
```

---

### 5. 장바구니 비우기

모든 아이템 제거

**Endpoint**
```
DELETE /api/cart
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "Cart cleared successfully"
}
```

---

### 6. 할인 코드 적용

할인 쿠폰 코드 적용

**Endpoint**
```
POST /api/cart/discount
```

**Request Body**
```typescript
{
  code: string;  // 할인 코드
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    discount: {
      code: string;
      value: number;
      type: 'percentage' | 'fixed';
    };
    summary: CartSummary;
  }
}
```

**Error Responses**
- `400` - 유효하지 않은 할인 코드
- `409` - 이미 적용된 할인 코드

---

### 7. 할인 코드 제거

적용된 할인 코드 제거

**Endpoint**
```
DELETE /api/cart/discount
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "Discount removed"
}
```

---

### 8. 배송비 계산

선택한 배송 방법에 따른 배송비 계산

**Endpoint**
```
POST /api/cart/shipping
```

**Request Body**
```typescript
{
  method: 'standard' | 'express' | 'overnight';
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    summary: CartSummary;
  }
}
```

---

## 구매 이력 API (purchaseHistoryApi)

### 1. 구매 이력 조회

사용자의 구매 이력 목록 조회 (페이지네이션)

**Endpoint**
```
GET /api/purchase-history
```

**Query Parameters**
```typescript
{
  page?: number;         // 페이지 번호 (기본: 1)
  limit?: number;        // 페이지당 아이템 수 (기본: 10)
  status?: string;       // 주문 상태 필터
  dateRange?: string;    // 날짜 범위 필터
}
```

**Example Request**
```
GET /api/purchase-history?page=1&limit=10&status=completed
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    purchaseHistory: {
      orders: PurchaseOrder[];
      summary: PurchaseSummary;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    };
    lastUpdated: string;
  }
}
```

**PurchaseOrder Type**
```typescript
interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  totalAmount: number;
  items: PurchaseItem[];
  paymentMethod: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}
```

**PurchaseItem Type**
```typescript
interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  brand?: string;
}
```

**PurchaseSummary Type**
```typescript
interface PurchaseSummary {
  totalOrders: number;
  totalSpent: number;
  totalItems: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  favoriteCategory: string;
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "purchaseHistory": {
      "orders": [
        {
          "id": "order-001",
          "orderNumber": "ORD-2024-001",
          "date": "2024-12-15T10:30:00Z",
          "status": "completed",
          "totalAmount": 45900,
          "paymentMethod": "카드",
          "trackingNumber": "TK123456789",
          "items": [...]
        }
      ],
      "summary": {
        "totalOrders": 24,
        "totalSpent": 486200,
        "totalItems": 67,
        "averageOrderValue": 20258,
        "lastPurchaseDate": "2024-12-15",
        "favoriteCategory": "생활용품"
      },
      "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalItems": 24,
        "itemsPerPage": 10
      }
    },
    "lastUpdated": "2024-12-16T00:00:00.000Z"
  }
}
```

---

### 2. 주문 상세 조회

특정 주문의 상세 정보 조회

**Endpoint**
```
GET /api/purchase-history/orders/{orderId}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    order: PurchaseOrder;
  }
}
```

**Error Responses**
- `404` - 주문을 찾을 수 없음

---

### 3. 재주문

이전 주문의 상품을 장바구니에 추가

**Endpoint**
```
POST /api/purchase-history/orders/{orderId}/reorder
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "장바구니에 상품이 추가되었습니다."
}
```

---

### 4. 주문 취소

진행 중인 주문 취소

**Endpoint**
```
POST /api/purchase-history/orders/{orderId}/cancel
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "주문이 취소되었습니다."
}
```

**Error Responses**
- `400` - 취소할 수 없는 주문 상태
- `404` - 주문을 찾을 수 없음

---

### 5. 환불 요청

완료된 주문에 대한 환불 요청

**Endpoint**
```
POST /api/purchase-history/orders/{orderId}/refund
```

**Request Body**
```typescript
{
  reason: string;  // 환불 사유 (필수)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  message: "환불 요청이 접수되었습니다."
}
```

---

## 통계 API (statisticsApi)

### 1. 통계 데이터 조회

전체 통계 대시보드 데이터 조회

**Endpoint**
```
GET /api/statistics
```

**Query Parameters**
```typescript
{
  period?: '7days' | '30days' | '90days' | '1year';  // 기간 (기본: 7days)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    statistics: {
      kpis: KPIData[];
      weeklyData: WeeklyData[];
      categoryData: CategoryData[];
      totalSpending: number;
      period: string;
    };
    lastUpdated: string;
  }
}
```

**KPIData Type**
```typescript
interface KPIData {
  id: string;
  title: string;
  value: string;
  change: number;        // 변화율 (%)
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
}
```

**WeeklyData Type**
```typescript
interface WeeklyData {
  day: string;           // Mon, Tue, Wed...
  dayKor: string;        // 월, 화, 수...
  amount: number;        // 구매 금액
}
```

**CategoryData Type**
```typescript
interface CategoryData {
  id: string;
  name: string;
  percentage: number;    // 비율 (%)
  amount: number;        // 금액
  color: string;         // 차트 색상
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "kpis": [
        {
          "id": "total-spending",
          "title": "총 구매 금액",
          "value": "₩248,500",
          "change": 12.5,
          "icon": "💰",
          "color": "green"
        },
        {
          "id": "product-count",
          "title": "구매한 상품 수",
          "value": "34개",
          "change": 8.2,
          "icon": "🛒",
          "color": "green"
        }
      ],
      "weeklyData": [
        {"day": "Mon", "dayKor": "월", "amount": 15000},
        {"day": "Tue", "dayKor": "화", "amount": 23000}
      ],
      "categoryData": [
        {
          "id": "lifestyle",
          "name": "생활용품",
          "percentage": 45,
          "amount": 125000,
          "color": "#10b981"
        }
      ],
      "totalSpending": 248500,
      "period": "7days"
    },
    "lastUpdated": "2024-12-16T00:00:00.000Z"
  }
}
```

---

### 2. 주간 통계 조회

상세 주간 통계 데이터

**Endpoint**
```
GET /api/statistics/weekly
```

**Query Parameters**
```typescript
{
  period?: '7days' | '30days';
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    weeklyData: WeeklyData[];
    summary: {
      totalWeeklySpending: number;
      averageDaily: number;
      highestDay: string;
      highestAmount: number;
    };
  }
}
```

---

### 3. 카테고리별 통계 조회

상세 카테고리별 통계

**Endpoint**
```
GET /api/statistics/categories
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    categoryData: CategoryData[];
    insights: {
      mostPurchasedCategory: string;
      growingCategory: string;
      seasonalTrend: string;
    };
  }
}
```

---

## 추천 API (recommendationsApi)

### 1. 상품 추천 조회

컨텍스트 기반 개인화 상품 추천

**Endpoint**
```
POST /api/recommendations
```

**Request Body**
```typescript
{
  context: {
    userId?: string;
    page: 'statistics' | 'chat' | 'cart' | 'purchase-history';
    categoryPreferences?: string[];
    recentPurchases?: string[];
  };
  limit?: number;  // 추천 상품 수 (기본: 5)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    products: RecommendedProduct[];
    context: RecommendationContext;
    algorithm: string;
    generatedAt: string;
  }
}
```

**RecommendedProduct Type**
```typescript
interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  discount?: number;
  reason: string;        // 추천 이유
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
}
```

**Example Request**
```json
{
  "context": {
    "page": "statistics",
    "categoryPreferences": ["생활용품", "청소용품"]
  },
  "limit": 5
}
```

**Example Response**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "rec-stat-1",
        "name": "프리미엄 물티슈 10팩",
        "price": 15900,
        "originalPrice": 19900,
        "image": "🧻",
        "category": "생활용품",
        "discount": 20,
        "reason": "자주 구매하는 생활용품",
        "rating": 4.8,
        "reviewCount": 256,
        "inStock": true
      }
    ],
    "context": {
      "page": "statistics",
      "categoryPreferences": ["생활용품", "청소용품"]
    },
    "algorithm": "collaborative-filtering-v2",
    "generatedAt": "2024-12-16T00:00:00.000Z"
  }
}
```

---

### 2. 추천 새로고침

현재 컨텍스트로 추천 새로고침

**Endpoint**
```
POST /api/recommendations/refresh
```

**Request Body**
```typescript
{
  context: RecommendationContext;
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    products: RecommendedProduct[];
    context: RecommendationContext;
    algorithm: string;
    generatedAt: string;
  }
}
```

---

### 3. 관련 상품 조회

특정 상품의 관련 상품 추천

**Endpoint**
```
GET /api/recommendations/related/{productId}
```

**Query Parameters**
```typescript
{
  limit?: number;  // 관련 상품 수 (기본: 3)
}
```

**Response (200 OK)**
```typescript
{
  success: true,
  data: {
    products: RecommendedProduct[];
  }
}
```

---

## 공통 타입 정의

### BaseEntity
```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PaginatedResponse
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### LoadingState
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

### AsyncState
```typescript
interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}
```

---

## 에러 코드

### 클라이언트 에러 (4xx)

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 400 | Bad Request | 잘못된 요청 형식 |
| 401 | Unauthorized | 인증 실패 또는 토큰 만료 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 409 | Conflict | 중복된 리소스 |
| 422 | Unprocessable Entity | 유효성 검증 실패 |
| 429 | Too Many Requests | 요청 횟수 제한 초과 |

### 서버 에러 (5xx)

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 500 | Internal Server Error | 서버 내부 오류 |
| 502 | Bad Gateway | 게이트웨이 오류 |
| 503 | Service Unavailable | 서비스 이용 불가 |
| 504 | Gateway Timeout | 게이트웨이 타임아웃 |

### 에러 응답 형식

```typescript
{
  success: false,
  error: string,      // 에러 메시지
  message?: string,   // 추가 정보
  code?: string,      // 에러 코드
  details?: any       // 상세 정보
}
```

**Example Error Response**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "이메일 형식이 올바르지 않습니다.",
  "code": "INVALID_EMAIL",
  "details": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

---

## Rate Limiting

API 요청 제한:
- **인증된 사용자**: 분당 100 요청
- **게스트**: 분당 20 요청

제한 초과 시:
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "분당 요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.",
  "retryAfter": 60
}
```

---

## WebSocket API (향후 구현 예정)

실시간 기능을 위한 WebSocket 연결

**Connection**
```
ws://localhost:3000/ws?token=<access_token>
```

**Events**
- `chat:message` - 새 메시지
- `cart:update` - 장바구니 업데이트
- `order:status` - 주문 상태 변경
- `notification` - 일반 알림

---

## Changelog

### v1.0.0 (2024-12-16)
- 초기 API 명세 작성
- 6개 주요 API 그룹 정의
- Mock API 구현 완료

---

## FastAPI 백엔드 프로젝트 구조

### 전체 프로젝트 디렉토리

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 앱 초기화
│   ├── config.py               # 환경 설정
│   ├── database.py             # 데이터베이스 연결
│   ├── dependencies.py         # 의존성 주입
│   │
│   ├── models/                 # Pydantic 모델
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── cart.py
│   │   ├── purchase_history.py
│   │   ├── statistics.py
│   │   └── recommendations.py
│   │
│   ├── database/               # SQLAlchemy 모델
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── routes/                 # API 라우터
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── cart.py
│   │   ├── purchase_history.py
│   │   ├── statistics.py
│   │   └── recommendations.py
│   │
│   ├── services/               # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── chat_service.py
│   │   ├── cart_service.py
│   │   └── ai_service.py       # LLM 통합
│   │
│   ├── utils/                  # 유틸리티 함수
│   │   ├── __init__.py
│   │   ├── jwt.py
│   │   ├── password.py
│   │   └── validators.py
│   │
│   └── middleware/             # 미들웨어
│       ├── __init__.py
│       ├── cors.py
│       └── error_handler.py
│
├── tests/                      # 테스트
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_chat.py
│   └── test_cart.py
│
├── alembic/                    # 데이터베이스 마이그레이션
│   ├── versions/
│   └── env.py
│
├── .env                        # 환경 변수
├── requirements.txt            # 의존성
├── alembic.ini                 # Alembic 설정
└── README.md
```

### 핵심 파일 구현

#### 1. config.py - 환경 설정

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 애플리케이션 설정
    APP_NAME: str = "Shopping Assistant API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 데이터베이스 설정
    DATABASE_URL: str = "sqlite:///./shopping_assistant.db"
    # PostgreSQL 사용 시:
    # DATABASE_URL: str = "postgresql://user:password@localhost/dbname"

    # JWT 설정
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24시간
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS 설정
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    # OpenAI API (AI 채팅용)
    OPENAI_API_KEY: Optional[str] = None

    # Redis (캐싱용)
    REDIS_URL: Optional[str] = "redis://localhost:6379"

    class Config:
        env_file = ".env"

settings = Settings()
```

#### 2. database.py - 데이터베이스 연결

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# SQLAlchemy 엔진 생성
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# 세션 로컬
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스
Base = declarative_base()

# 데이터베이스 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 3. dependencies.py - 인증 의존성

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from .database import get_db
from .database.models import User
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """JWT 토큰에서 현재 사용자 추출"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """선택적 사용자 인증 (게스트 허용)"""
    if not token:
        return None

    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None
```

#### 4. main.py - FastAPI 앱 초기화

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base
from .routes import auth, chat, cart, purchase_history, statistics, recommendations

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행"""
    # 시작 시
    print("🚀 Starting Shopping Assistant API...")
    yield
    # 종료 시
    print("👋 Shutting down Shopping Assistant API...")

# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI 기반 쇼핑 비서 API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 예외 처리
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "서버 내부 오류가 발생했습니다."
        }
    )

# 라우터 등록
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(cart.router)
app.include_router(purchase_history.router)
app.include_router(statistics.router)
app.include_router(recommendations.router)

# Health check 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Root 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Shopping Assistant API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }
```

#### 5. requirements.txt - 의존성

```txt
# FastAPI
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# 데이터베이스
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9  # PostgreSQL용
# aiosqlite==0.19.0  # SQLite 비동기용

# 인증
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Pydantic
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# AI/ML (선택)
openai==1.10.0
anthropic==0.8.1

# 유틸리티
python-dotenv==1.0.0
redis==5.0.1

# 테스트
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
```

#### 6. .env - 환경 변수

```env
# 애플리케이션
APP_NAME=Shopping Assistant API
DEBUG=True

# 데이터베이스
DATABASE_URL=sqlite:///./shopping_assistant.db
# DATABASE_URL=postgresql://user:password@localhost/shopping_assistant

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# OpenAI (AI 채팅용)
OPENAI_API_KEY=sk-your-openai-api-key

# Redis
REDIS_URL=redis://localhost:6379
```

### 데이터베이스 마이그레이션 (Alembic)

```bash
# Alembic 초기화
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

### 서버 실행

```bash
# 개발 모드 (자동 재시작)
uvicorn app.main:app --reload --port 8000

# 프로덕션 모드
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Docker로 실행
docker-compose up
```

### API 테스트 예시

```bash
# 로그인 테스트
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 장바구니 조회 (인증 필요)
curl -X GET "http://localhost:8000/api/cart" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 메시지 전송
curl -X POST "http://localhost:8000/api/chat/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "물 추천해줘", "sessionId": "session-123"}'
```

### Python 클라이언트 예시

```python
import requests

BASE_URL = "http://localhost:8000"

# 로그인
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "user@example.com", "password": "password123"}
)
data = response.json()
access_token = data["data"]["tokens"]["accessToken"]

# 장바구니 조회
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
cart = response.json()
print(cart)

# 메시지 전송
response = requests.post(
    f"{BASE_URL}/api/chat/messages",
    headers=headers,
    json={"message": "물 추천해줘", "sessionId": "session-123"}
)
message = response.json()
print(message)
```

---

## 프론트엔드 연동 가이드 (React)

### Axios 설정

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (토큰 자동 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (토큰 갱신)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('http://localhost:8000/api/auth/refresh-token', {
          refreshToken
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('access_token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 리프레시 실패 시 로그아웃
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

**문의사항**
API 관련 문의는 개발팀에 연락 바랍니다.
