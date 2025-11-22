# AI Shopping Assistant - 배포 가이드

> **버전**: 1.0.0
> **최종 수정**: 2025-11-22

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [STEP 1: 프론트엔드 빌드](#step-1-프론트엔드-빌드)
3. [STEP 2: 환경변수 설정](#step-2-환경변수-설정)
4. [STEP 3: 로컬 테스트](#step-3-로컬-테스트)
5. [STEP 4: AWS EC2 배포](#step-4-aws-ec2-배포)
6. [운영 명령어](#운영-명령어)
7. [트러블슈팅](#트러블슈팅)

---

## 1. 사전 준비

### 필요한 것들

| 항목 | 설명 | 확인 |
|------|------|------|
| Docker Desktop | 컨테이너 실행 환경 | `docker --version` |
| Node.js | 프론트엔드 빌드용 | `node --version` |
| Git | 버전 관리 | `git --version` |
| OpenAI API Key | AI 기능용 | [OpenAI Console](https://platform.openai.com/) |
| 11번가 API Key | 상품 검색용 | [11번가 개발자센터](https://openapi.11st.co.kr/) |
| 네이버 API Key | 상품 검색용 | [네이버 개발자센터](https://developers.naver.com/) |

### 프로젝트 구조

```
capstoneProject/
├── docker-compose.yml        # 컨테이너 오케스트레이션
├── .env.example              # 환경변수 템플릿
├── .env                      # 실제 환경변수 (직접 생성)
├── nginx/
│   └── nginx.conf            # Nginx 설정
├── backend/
│   ├── Dockerfile            # Backend 이미지
│   ├── Dockerfile.mcp        # MCP 서버 이미지
│   ├── requirements.txt
│   ├── requirements-mcp.txt
│   └── app/
└── frontend/
    ├── package.json
    ├── src/
    └── dist/                 # 빌드 결과물 (npm run build 후 생성)
```

---

## STEP 1: 프론트엔드 빌드

### 1-1. 의존성 설치

```bash
# 프론트엔드 폴더로 이동
cd frontend

# 의존성 설치
npm install
```

### 1-2. 프로덕션 빌드

```bash
# 빌드 실행
npm run build
```

### 1-3. 빌드 결과 확인

```bash
# dist 폴더 확인
ls -la dist/
```

**예상 결과:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

---

## STEP 2: 환경변수 설정

### 2-1. 환경변수 파일 생성

```bash
# 프로젝트 루트로 이동
cd ..

# 템플릿 복사
cp .env.example .env
```

### 2-2. 환경변수 편집

`.env` 파일을 열어서 실제 값으로 수정합니다:

```bash
# ===========================================
# Database Configuration
# ===========================================
POSTGRES_DB=capstone_db
POSTGRES_USER=capstone
POSTGRES_PASSWORD=여기에_안전한_비밀번호_입력        # ⚠️ 변경 필수!

DATABASE_URL=postgresql+psycopg://capstone:여기에_같은_비밀번호@postgres:5432/capstone_db

# ===========================================
# OpenAI Configuration
# ===========================================
OPENAI_API_KEY=sk-proj-여기에_실제_API키            # ⚠️ 변경 필수!
OPENAI_MODEL=gpt-4o
OPENAI_REQUEST_TIMEOUT=30

# ===========================================
# MCP Tool Names
# ===========================================
MCP_RECOMMEND_TOOL=recommend_products_final_v4
MCP_SEARCH_11ST_TOOL=search_11st_products
MCP_SEARCH_NAVER_TOOL=search_naver_products

# ===========================================
# External Shopping APIs
# ===========================================
ELEVENST_API_KEY=여기에_11번가_API키                # ⚠️ 변경 필수!
NAVER_CLIENT_ID=여기에_네이버_클라이언트ID           # ⚠️ 변경 필수!
NAVER_CLIENT_SECRET=여기에_네이버_시크릿             # ⚠️ 변경 필수!
```

### 2-3. 보안 주의사항

```
⚠️  중요: .env 파일은 절대 Git에 커밋하지 마세요!

.gitignore에 다음이 포함되어 있는지 확인:
.env
.env.local
.env.production
```

---

## STEP 3: 로컬 테스트

### 3-1. Docker 실행 확인

```bash
# Docker 실행 중인지 확인
docker --version
docker-compose --version

# Docker Desktop이 실행 중이어야 합니다!
```

### 3-2. 컨테이너 빌드 및 실행

```bash
# 프로젝트 루트에서 실행
cd /path/to/capstoneProject

# 이미지 빌드 + 컨테이너 실행
docker-compose up --build

# 또는 백그라운드 실행
docker-compose up --build -d
```

### 3-3. 실행 결과 확인

**정상 실행 시 출력:**
```
Creating network "capstoneproject_shopping-network" ...
Creating shopping-postgres ... done
Creating shopping-mcp-recommend ... done
Creating shopping-mcp-shopping ... done
Creating shopping-backend ... done
Creating shopping-nginx ... done
```

### 3-4. 서비스 확인

```bash
# 컨테이너 상태 확인
docker-compose ps
```

**예상 결과:**
```
NAME                    STATUS              PORTS
shopping-nginx          Up                  0.0.0.0:80->80/tcp
shopping-backend        Up                  8000/tcp
shopping-mcp-recommend  Up                  8001/tcp
shopping-mcp-shopping   Up                  8002/tcp
shopping-postgres       Up (healthy)        5432/tcp
```

### 3-5. 접속 테스트

```bash
# 헬스 체크
curl http://localhost/health
# 예상 응답: {"status":"ok"}

# 브라우저에서 접속
open http://localhost
```

### 3-6. 로그 확인 (문제 발생 시)

```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs nginx
docker-compose logs postgres

# 실시간 로그 (follow)
docker-compose logs -f backend
```

---

## STEP 4: AWS EC2 배포

### 4-1. EC2 인스턴스 생성

**AWS Console에서 설정:**

| 항목 | 권장 값 |
|------|---------|
| AMI | Amazon Linux 2023 |
| 인스턴스 타입 | t3.medium (최소) |
| 스토리지 | 30GB |
| 키 페어 | 새로 생성 또는 기존 사용 |

**보안 그룹 설정:**

| 타입 | 포트 | 소스 |
|------|------|------|
| SSH | 22 | 내 IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

### 4-2. EC2 접속

```bash
# 키 파일 권한 설정
chmod 400 your-key.pem

# EC2 접속
ssh -i "your-key.pem" ec2-user@<EC2-퍼블릭-IP>
```

### 4-3. Docker 설치 (EC2)

```bash
# 시스템 업데이트
sudo yum update -y

# Docker 설치
sudo yum install -y docker

# Docker 서비스 시작 및 자동 시작 설정
sudo systemctl enable docker
sudo systemctl start docker

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재접속 (그룹 권한 적용)
exit
```

```bash
# 다시 접속
ssh -i "your-key.pem" ec2-user@<EC2-퍼블릭-IP>

# 설치 확인
docker --version
docker-compose --version
```

### 4-4. 코드 업로드

**방법 1: Git Clone (권장)**
```bash
# EC2에서
cd ~
git clone <your-repo-url> app
cd app
```

**방법 2: SCP로 직접 전송**
```bash
# 로컬에서
scp -i "your-key.pem" -r ./capstoneProject ec2-user@<EC2-IP>:~/app
```

### 4-5. 환경변수 설정 (EC2)

```bash
# EC2에서
cd ~/app

# .env 파일 생성
cp .env.example .env

# 편집
nano .env
# 또는
vim .env
```

### 4-6. 프론트엔드 빌드 (EC2에서 하는 경우)

```bash
# Node.js 설치 (필요시)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 프론트엔드 빌드
cd frontend
npm install
npm run build
cd ..
```

### 4-7. 실행

```bash
# 빌드 및 실행
docker-compose up --build -d

# 상태 확인
docker-compose ps

# 헬스 체크
curl http://localhost/health
```

### 4-8. 접속 확인

브라우저에서 `http://<EC2-퍼블릭-IP>` 접속

---

## 운영 명령어

### 기본 명령어

```bash
# 시작
docker-compose up -d

# 중지
docker-compose down

# 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart backend
```

### 로그 확인

```bash
# 전체 로그
docker-compose logs

# 실시간 로그
docker-compose logs -f

# 특정 서비스 로그 (최근 100줄)
docker-compose logs --tail=100 backend
```

### 업데이트 배포

```bash
# 코드 업데이트
git pull

# 프론트엔드 재빌드 (변경된 경우)
cd frontend && npm run build && cd ..

# 컨테이너 재빌드 및 실행
docker-compose up --build -d
```

### 리소스 정리

```bash
# 중지된 컨테이너 삭제
docker-compose down

# 사용하지 않는 이미지 삭제
docker image prune -f

# 전체 삭제 (데이터 포함! 주의!)
docker-compose down -v
```

---

## 트러블슈팅

### 문제 1: 포트 충돌

```
Error: Bind for 0.0.0.0:80 failed: port is already allocated
```

**해결:**
```bash
# 80 포트 사용 중인 프로세스 확인
sudo lsof -i :80

# 해당 프로세스 종료 또는 docker-compose.yml에서 포트 변경
ports:
  - "8080:80"  # 80 대신 8080 사용
```

### 문제 2: Database 연결 실패

```
Error: connection refused to postgres:5432
```

**해결:**
```bash
# postgres 컨테이너 상태 확인
docker-compose ps postgres

# postgres 로그 확인
docker-compose logs postgres

# 재시작
docker-compose restart postgres
```

### 문제 3: 프론트엔드 접속 안됨

**확인 사항:**
```bash
# dist 폴더 존재 확인
ls -la frontend/dist/

# nginx 로그 확인
docker-compose logs nginx
```

### 문제 4: Backend API 오류

```bash
# backend 로그 확인
docker-compose logs backend

# 컨테이너 내부 접속
docker-compose exec backend sh

# 환경변수 확인
docker-compose exec backend env | grep OPENAI
```

### 문제 5: 메모리 부족 (EC2)

```bash
# 메모리 확인
free -h

# 스왑 추가 (t3.micro 등 작은 인스턴스)
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 체크리스트

### 로컬 테스트

- [ ] Docker Desktop 설치 및 실행
- [ ] Node.js 설치
- [ ] `npm run build` 성공 (frontend/dist 생성)
- [ ] `.env` 파일 생성 및 설정
- [ ] `docker-compose up --build` 성공
- [ ] `http://localhost` 접속 확인
- [ ] `http://localhost/health` 응답 확인

### AWS 배포

- [ ] EC2 인스턴스 생성
- [ ] 보안 그룹 설정 (22, 80, 443 포트)
- [ ] Docker/Docker Compose 설치
- [ ] 코드 업로드 (Git 또는 SCP)
- [ ] `.env` 파일 설정
- [ ] `docker-compose up --build -d` 성공
- [ ] 퍼블릭 IP로 접속 확인

---

## 참고 자료

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

  ---
  자주 쓰는 명령어

  # 시작
  docker-compose up -d

  # 중지
  docker-compose down

  # 재시작
  docker-compose restart

  # 로그 보기
  docker-compose logs -f backend
  docker-compose logs -f nginx

  # 상태 확인
  docker-compose ps

  # 이미지 재빌드 후 시작
  docker-compose up --build -d

  # 전체 삭제 (데이터 포함!)
  docker-compose down -v


*문제가 발생하면 `docker-compose logs` 명령어로 로그를 확인하세요!*
