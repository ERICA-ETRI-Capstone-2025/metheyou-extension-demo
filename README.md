# MeTheYou Chrome Extension

AI 기반 유튜브 안심 컨텐츠 분석 솔루션 믿어유(MeTheYou)의 Chromium 확장 프론트엔드 앱

## 주요 기능

- YouTube watch 페이지에서 자동으로 Pill 버튼 표시
- 분석된 영상: 적합성 점수 표시 (0-100점)
- 미분석 영상: "분석 필요" 상태로 분석 페이지로 이동 가능
- 분석 결과 캐싱으로 빠른 재조회

## 점수 표시 기준

| 점수 범위 | 표시 |
|----------|------|
| 80점 이상 | 매우 안전 |
| 60-79점 | 안전 |
| 40-59점 | 보통 |
| 40점 미만 | 주의 |

## 설치 방법

### 개발자 모드로 설치

1. 저장소를 클론하거나 다운로드합니다.
   ```bash
   git clone https://github.com/ERICA-ETRI-Capstone-2025/metheyou-extension-demo.git
   ```

2. Chrome 브라우저에서 `chrome://extensions/`를 엽니다.

3. 우측 상단의 **개발자 모드**를 활성화합니다.

4. **"압축해제된 확장 프로그램을 로드합니다"** 버튼을 클릭합니다.

5. `metheyou-extension-demo` 폴더를 선택합니다.

## 초기 설정

API 서버 주소를 설정합니다.

1. 확장 프로그램 아이콘을 클릭하여 팝업을 엽니다.
2. **API 서버 주소**를 입력합니다. (예: `https://api.example.com/api`)
3. **저장** 버튼을 클릭합니다.

## 사용 방법

1. YouTube 동영상 페이지(`https://www.youtube.com/watch?v=...`)로 이동합니다.

2. 페이지 로드 후 우측 상단에 **Pill 버튼**이 자동으로 표시됩니다.

3. 분석된 영상인 경우: 점수와 안전도 레벨이 표시되며, 클릭하면 분석 결과 페이지로 이동합니다.

4. 미분석 영상인 경우: "분석 필요" 상태가 표시되며, 클릭하면 분석 페이지로 이동합니다.

## 프로젝트 구조

```
metheyou-extension-demo/
├── manifest.json          # 확장 프로그램 설정 파일
├── content.js            # YouTube 페이지에 위젯 삽입 스크립트
├── content.css           # 위젯 스타일
├── utils.js              # API 클라이언트 및 유틸리티 함수
├── popup.html            # 확장 프로그램 팝업 UI
├── popup.js              # 팝업 로직
├── popup.css             # 팝업 스타일
├── icons/                # 확장 프로그램 아이콘
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## API 연동

이 확장 프로그램은 백엔드 API 서버와 통신합니다.

### 사용되는 엔드포인트

1. **`GET /api/ai_search.php?vidid={video_id}`**
   - 분석 결과 검색
   - Response: `{"found": true/false, "score": number, "task_id": string}`

2. **`POST /api/ai_request.php`**
   - 새로운 분석 요청
   - Body: `{"id": "video_id"}`
   - Response: `{"taskid": "task_id"}`

## 개발 계획

- [x] Pill 버튼 표시 기능
- [x] 분석 결과 캐싱
- [x] API 연동
- [ ] 확장 프로그램 팝업 상세 정보
- [ ] 분석 히스토리

## 기술 스택

- Manifest V3: Chrome Extension API
- JavaScript, CSS3: 로직 및 디자인
- Chrome Storage API: 설정 저장
