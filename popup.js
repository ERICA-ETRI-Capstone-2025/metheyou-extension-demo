// MeTheYou Popup Script

const DEFAULT_API_BASE = 'https://metheyou-api.pdj.kr';

// DOM 요소
const elements = {
  loading: document.getElementById('loading'),
  videoInfo: document.getElementById('video-info'),
  notAnalyzed: document.getElementById('not-analyzed'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  
  thumbnail: document.getElementById('thumbnail'),
  thumbnailPreview: document.getElementById('thumbnail-preview'),
  score: document.getElementById('score'),
  scoreLevel: document.getElementById('score-level'),
  videoTitle: document.getElementById('video-title'),
  channelName: document.getElementById('channel-name'),
  publishedDate: document.getElementById('published-date'),
  description: document.getElementById('description'),
  tags: document.getElementById('tags'),
  tagsSection: document.getElementById('tags-section'),
  
  startAnalysisBtn: document.getElementById('start-analysis-btn'),
  analyzeBtn: document.getElementById('analyze-btn'),
  apiBaseUrl: document.getElementById('api-base-url'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  saveMessage: document.getElementById('save-message')
};

// API 베이스 URL 가져오기
async function getApiBase() {
  const result = await chrome.storage.sync.get(['apiBase']);
  return result.apiBase || DEFAULT_API_BASE;
}

// API 베이스 URL 저장
async function setApiBase(apiBase) {
  await chrome.storage.sync.set({ apiBase: apiBase });
}

// 점수에 따른 색상 반환
function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

// 점수에 따른 레벨 텍스트 반환
function getScoreLevel(score) {
  if (score >= 80) return '매우 적합';
  if (score >= 60) return '적합';
  if (score >= 40) return '보통';
  if (score >= 20) return '부적합';
  return '매우 부적합';
}

// UI 상태 변경
function showLoading() {
  elements.loading.style.display = 'flex';
  elements.videoInfo.style.display = 'none';
  elements.notAnalyzed.style.display = 'none';
  elements.error.style.display = 'none';
}

function showVideoInfo() {
  elements.loading.style.display = 'none';
  elements.videoInfo.style.display = 'block';
  elements.notAnalyzed.style.display = 'none';
  elements.error.style.display = 'none';
}

function showNotAnalyzed() {
  elements.loading.style.display = 'none';
  elements.videoInfo.style.display = 'none';
  elements.notAnalyzed.style.display = 'block';
  elements.error.style.display = 'none';
}

function showError(message) {
  elements.loading.style.display = 'none';
  elements.videoInfo.style.display = 'none';
  elements.notAnalyzed.style.display = 'none';
  elements.error.style.display = 'flex';
  elements.errorMessage.textContent = message;
}

// 분석 결과 표시
function displayResult(result, videoId) {
  // 썸네일
  if (videoId) {
    elements.thumbnail.src = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
  }
  
  // 점수
  const color = getScoreColor(result.score);
  const level = getScoreLevel(result.score);
  
  elements.score.textContent = result.score;
  elements.score.style.color = color;
  elements.scoreLevel.textContent = level;
  elements.scoreLevel.style.color = color;
  
  // 영상 정보
  elements.videoTitle.textContent = result.title || '제목 없음';
  elements.channelName.textContent = result.channel_name || '-';
  elements.publishedDate.textContent = result.published_at || '-';
  
  // 분석 의견
  elements.description.innerHTML = result.description || '분석 의견이 없습니다.';
  
  // 태그
  if (result.tags) {
    const tagList = result.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tagList.length > 0) {
      elements.tags.innerHTML = tagList
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
      elements.tagsSection.style.display = 'block';
    } else {
      elements.tagsSection.style.display = 'none';
    }
  } else {
    elements.tagsSection.style.display = 'none';
  }
  
  showVideoInfo();
}

// MeTheYou API 클라이언트
class MeTheYouAPI {
  static async searchAnalysis(videoId) {
    try {
      const apiBase = await getApiBase();
      const url = `${apiBase}/ai_search.php?vidid=${videoId}`;
      console.log('[MeTheYou API] searchAnalysis 요청:', url);
      
      const response = await fetch(url);
      console.log('[MeTheYou API] searchAnalysis 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MeTheYou API] searchAnalysis HTTP 오류:', response.status, errorText);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('[MeTheYou API] searchAnalysis Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[MeTheYou API] searchAnalysis 비-JSON 응답:', text.substring(0, 200));
        throw new Error('서버가 올바른 JSON 응답을 반환하지 않았습니다.');
      }
      
      const data = await response.json();
      console.log('[MeTheYou API] searchAnalysis 응답 데이터:', data);
      return data;
    } catch (error) {
      console.error('[MeTheYou API] searchAnalysis 오류:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('네트워크 연결을 확인해주세요. API 서버에 접근할 수 없습니다.');
      }
      throw error.message.startsWith('HTTP') || error.message.includes('JSON') ? error : new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    }
  }
  
  static async requestAnalysis(videoId) {
    try {
      const apiBase = await getApiBase();
      const response = await fetch(`${apiBase}/ai_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: videoId })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[MeTheYou API] requestAnalysis 오류:', error);
      throw new Error('분석 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }
  
  static async checkStatus(taskId) {
    try {
      const apiBase = await getApiBase();
      const response = await fetch(`${apiBase}/ai_status.php?tid=${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[MeTheYou API] checkStatus 오류:', error);
      throw new Error('상태 확인 중 오류가 발생했습니다.');
    }
  }
  
  static async getResult(taskId) {
    try {
      const apiBase = await getApiBase();
      const response = await fetch(`${apiBase}/analysis_info.php?tid=${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[MeTheYou API] getResult 오류:', error);
      throw new Error('결과 조회 중 오류가 발생했습니다.');
    }
  }
}

// 비디오 분석 시작
async function analyzeCurrentVideo(videoId) {
  try {
    showLoading();
    console.log('[MeTheYou Popup] 분석 요청 시작:', videoId);
    
    // 분석 요청
    const requestResult = await MeTheYouAPI.requestAnalysis(videoId);
    console.log('[MeTheYou Popup] 분석 요청 응답:', requestResult);
    
    if (!requestResult.taskid) {
      throw new Error('분석 요청에 실패했습니다.');
    }
    
    const taskId = requestResult.taskid;
    
    // 상태 확인 (최대 60초, 2초 간격)
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(async () => {
      try {
        attempts++;
        console.log(`[MeTheYou Popup] 상태 확인 (${attempts}/${maxAttempts})`);
        
        const status = await MeTheYouAPI.checkStatus(taskId);
        console.log('[MeTheYou Popup] 상태:', status);
        
        if (status.status === 'success') {
          clearInterval(checkInterval);
          
          // 결과 조회
          const result = await MeTheYouAPI.getResult(taskId);
          console.log('[MeTheYou Popup] 분석 결과:', result);
          
          displayResult(result, videoId);
        } else if (status.status === 'failed') {
          clearInterval(checkInterval);
          throw new Error('분석에 실패했습니다.');
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          throw new Error('분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error('[MeTheYou Popup] 상태 확인 오류:', error);
        showError(error.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('[MeTheYou Popup] 분석 오류:', error);
    showError(error.message);
  }
}

// 초기 로드 - 캐시만 확인
async function loadInitialData() {
  console.log('[MeTheYou Popup] loadInitialData 시작');
  try {
    showLoading();
    
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[MeTheYou Popup] 탭 정보:', tab?.url);
    
    if (!tab || !tab.url) {
      throw new Error('탭 정보를 가져올 수 없습니다.');
    }
    
    // 유튜브 URL인지 확인
    if (!tab.url.includes('youtube.com/watch')) {
      throw new Error('YouTube 동영상 페이지가 아닙니다.');
    }
    
    // 비디오 ID 추출
    const url = new URL(tab.url);
    const videoId = url.searchParams.get('v');
    
    if (!videoId) {
      throw new Error('비디오 ID를 찾을 수 없습니다.');
    }
    
    console.log('[MeTheYou Popup] 비디오 ID:', videoId);
    
    // 썸네일 미리보기 설정
    elements.thumbnailPreview.src = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;
    
    // 캐시 확인
    console.log('[MeTheYou Popup] searchAnalysis 호출 전...');
    const cached = await MeTheYouAPI.searchAnalysis(videoId);
    console.log('[MeTheYou Popup] searchAnalysis 응답:', cached);
    
    if (cached.found) {
      console.log('[MeTheYou Popup] 캐시된 결과 사용');
      displayResult(cached, videoId);
    } else {
      console.log('[MeTheYou Popup] 미분석 영상');
      showNotAnalyzed();
      
      // 분석 시작 버튼 이벤트
      elements.startAnalysisBtn.onclick = () => analyzeCurrentVideo(videoId);
    }
    
  } catch (error) {
    console.error('[MeTheYou Popup] 오류:', error);
    showError(error.message);
  }
}


// 설정 로드
async function loadSettings() {
  const apiBase = await getApiBase();
  elements.apiBaseUrl.value = apiBase;
}

// 설정 저장
async function saveSettings() {
  const apiBase = elements.apiBaseUrl.value.trim();
  
  if (!apiBase) {
    elements.saveMessage.textContent = 'API 주소를 입력해주세요.';
    elements.saveMessage.style.display = 'block';
    elements.saveMessage.style.color = '#ef4444';
    return;
  }
  
  try {
    await setApiBase(apiBase);
    elements.saveMessage.textContent = '저장되었습니다!';
    elements.saveMessage.style.display = 'block';
    elements.saveMessage.style.color = '#22c55e';
    
    setTimeout(() => {
      elements.saveMessage.style.display = 'none';
    }, 2000);
  } catch (error) {
    elements.saveMessage.textContent = '저장에 실패했습니다.';
    elements.saveMessage.style.display = 'block';
    elements.saveMessage.style.color = '#ef4444';
  }
}

elements.saveSettingsBtn.addEventListener('click', saveSettings);

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadInitialData();
});
