# 믿어유 (MeTheYou) - AI 기반 유튜브 컨텐츠 분석 솔루션

AI 파이프라인을 거쳐 영상의 맥락을 파악하고 아동 적합성을 알려주는 Chrome 확장 프로그램입니다.

## 🎯 주요 기능

- ✅ 유튜브 동영상 페이지에서 자동으로 AI 분석 실행
- ✅ 적합성 점수 (0-100점) 표시
- ✅ 상세한 분석 의견 및 근거 제공
- ✅ 콘텐츠 특성 태그 자동 생성
- ✅ 분석 결과 캐싱으로 빠른 재조회
- ✅ 깔끔한 위젯 UI로 비침투적 표시
- ✅ 확장 프로그램 팝업에서도 결과 확인 가능

## 🧠 AI 분석 시스템

### 분석 프로세스
1. **영상 다운로드**: YouTube 영상을 480p SD 화질로 다운로드
2. **스틸컷 추출**: 0%, 25%, 50%, 75%, 100% 지점에서 5개 스틸컷 생성
3. **자막 추출**: 자동 자막 다운로드 (한국어 우선)
4. **AI 분석**: Google Gemini AI를 통한 종합 분석
5. **결과 저장**: 분석 결과를 데이터베이스에 캐싱

### 점수 기준
| 점수 범위 | 의미 | 색상 |
|----------|------|------|
| 80-100 | 매우 적합 (교육적, 긍정적) | 🟢 녹색 |
| 60-79 | 적합 (약간의 주의 필요) | 🟡 노란색 |
| 40-59 | 보통 (부모 감독 권장) | 🟠 주황색 |
| 20-39 | 부적합 (유해 요소 포함) | 🔴 빨간색 |
| 0-19 | 매우 부적합 (시청 금지) | 🔴 빨간색 |

## 📦 설치 방법

### 1. Chrome 웹 스토어에서 설치 (예정)
추후 Chrome 웹 스토어에 배포 예정입니다.

### 2. 개발자 모드로 설치 (현재)

1. 이 저장소를 클론하거나 다운로드합니다.
   ```bash
   git clone https://github.com/yourusername/metheyou-extension-demo.git
   ```

2. Chrome 브라우저에서 `chrome://extensions/` 페이지를 엽니다.

3. 우측 상단의 **"개발자 모드"**를 활성화합니다.

4. **"압축해제된 확장 프로그램을 로드합니다"** 버튼을 클릭합니다.

5. 다운로드한 `metheyou-extension-demo` 폴더를 선택합니다.

6. 확장 프로그램이 설치됩니다! 🎉

## ⚙️ 초기 설정

### API 서버 주소 설정

확장 프로그램을 사용하기 전에 백엔드 API 서버 주소를 설정해야 합니다.

1. 확장 프로그램 아이콘을 클릭하여 팝업을 엽니다.
2. 하단의 **"설정"** 섹션에서 **API 서버 주소**를 입력합니다.
   - 예: `https://api.example.com/api`
3. **"저장"** 버튼을 클릭합니다.

## 🚀 사용 방법

### 방법 1: 자동 분석 (권장)
1. YouTube 동영상 페이지(`https://www.youtube.com/watch?v=...`)로 이동합니다.
2. 페이지 로드 후 자동으로 AI 분석이 시작됩니다.
3. 우측 상단에 **믿어유 위젯**이 나타나며 분석 진행 상황을 표시합니다.
4. 분석 완료 후 점수, 의견, 태그가 표시됩니다.

### 방법 2: 확장 프로그램 팝업 사용
1. YouTube 동영상 페이지에서 확장 프로그램 아이콘을 클릭합니다.
2. 팝업에 현재 동영상의 분석 결과가 표시됩니다.
3. **"다시 분석하기"** 버튼으로 재분석할 수 있습니다.

### 위젯 제어
- **닫기 버튼 (×)**: 위젯을 숨깁니다 (다른 영상으로 이동하면 다시 표시)
- 위젯은 드래그할 수 없으며 우측 상단에 고정됩니다.

## 📁 프로젝트 구조

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

## 🔌 API 연동

이 확장 프로그램은 별도의 백엔드 API 서버와 통신합니다.

### 사용되는 API 엔드포인트

1. **`POST /api/ai_request.php`**
   - AI 분석 요청
   - Body: `{"id": "video_id"}`
   - Response: `{"taskid": "task_id"}`

2. **`GET /api/ai_status.php?tid={task_id}`**
   - 분석 진행 상태 확인
   - Response: `{"status": "ready|extract|trans|analysis|saving|success|error"}`

3. **`GET /api/analysis_info.php?tid={task_id}`**
   - 분석 결과 조회
   - Response: 점수, 설명, 태그, 메타데이터 등

4. **`GET /api/ai_search.php?vidid={video_id}`**
   - 캐시된 분석 결과 검색
   - Response: `{"found": true/false, ...}`

### API 서버 설정

백엔드 API 서버는 별도로 구축되어야 합니다. 자세한 내용은 [API Documentation](API_DOCUMENTATION.md)을 참조하세요.

## 🔧 개발 계획

- [x] 기본 AI 분석 기능
- [x] 적합성 점수 표시
- [x] 분석 결과 캐싱
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 사용자 피드백 기능
- [ ] 분석 히스토리 저장
- [ ] 자막 번역 및 요약
- [ ] 댓글 분석
- [ ] 재생목록 일괄 분석

## 🛠️ 기술 스택

### 프론트엔드 (확장 프로그램)
- **Manifest V3**: Chrome Extension API
- **Vanilla JavaScript**: 순수 자바스크립트 (프레임워크 없음)
- **CSS3**: 현대적인 스타일링 및 애니메이션
- **Chrome Storage API**: 설정 저장

### 백엔드 (API 서버)
- **PHP**: API 엔드포인트
- **Python**: 영상 분석 스크립트
- **MySQL/MariaDB**: 데이터베이스
- **yt-dlp**: YouTube 영상 다운로드
- **OpenCV**: 스틸컷 추출
- **Google Gemini AI**: 콘텐츠 분석

## 🐛 문제 해결

### 분석이 시작되지 않아요
1. API 서버 주소가 올바르게 설정되었는지 확인하세요.
2. 확장 프로그램이 활성화되어 있는지 확인하세요.
3. YouTube 동영상 페이지(`/watch`)인지 확인하세요.

### 분석이 너무 오래 걸려요
- 영상 길이에 따라 30초~5분 정도 소요될 수 있습니다.
- 긴 영상(15분 이상)은 분석이 제한될 수 있습니다.

### API 오류가 발생해요
1. 브라우저 콘솔(F12)을 열어 에러 메시지를 확인하세요.
2. API 서버가 정상적으로 작동하는지 확인하세요.
3. CORS 설정이 올바른지 확인하세요.

### 위젯이 표시되지 않아요
1. 페이지를 새로고침해보세요.
2. 확장 프로그램을 비활성화 후 다시 활성화해보세요.
3. Chrome 확장 프로그램 페이지에서 오류가 있는지 확인하세요.

## 🔐 개인정보 보호

- 이 확장 프로그램은 **사용자의 개인정보를 수집하지 않습니다**.
- 분석되는 데이터는 **YouTube 영상의 공개 정보**만 포함됩니다.
- API 서버 주소는 사용자의 Chrome Storage에 로컬로 저장됩니다.
- 분석 결과는 백엔드 서버에 캐싱되지만, 사용자 식별 정보는 포함되지 않습니다.

## 📝 라이센스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

### 기여 방법
1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

## 📧 문의

- **프로젝트 저장소**: [GitHub](https://github.com/yourusername/metheyou-extension-demo)
- **이슈 트래커**: [Issues](https://github.com/yourusername/metheyou-extension-demo/issues)

---

**Made with ❤️ for safer YouTube experience**
