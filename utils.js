// MeTheYou API Client
// API 베이스 URL (설정에서 변경 가능)
const DEFAULT_API_BASE = 'https://metheyou-api.pdj.kr';

// API 베이스 URL 가져오기
async function getApiBase() {
  const result = await chrome.storage.sync.get(['apiBase']);
  return result.apiBase || DEFAULT_API_BASE;
}

// 유튜브 비디오 ID 추출 함수
function getYouTubeVideoId(url) {
  const urlObj = new URL(url);
  
  // watch?v= 형식
  if (urlObj.pathname === '/watch') {
    return urlObj.searchParams.get('v');
  }
  
  // shorts/ 형식
  if (urlObj.pathname.startsWith('/shorts/')) {
    return urlObj.pathname.split('/shorts/')[1];
  }
  
  // embed/ 형식
  if (urlObj.pathname.startsWith('/embed/')) {
    return urlObj.pathname.split('/embed/')[1];
  }
  
  return null;
}

// MeTheYou API 클라이언트
class MeTheYouAPI {
  /**
   * 캐시된 분석 결과 검색
   * @param {string} videoId - YouTube 비디오 ID
   * @returns {Promise<Object>} - {found: boolean, ...}
   */
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
      throw error.message.startsWith('HTTP') || error.message.includes('JSON') ? error : new Error('네트워크 오류가 발생했습니다.');
    }
  }
  
  /**
   * AI 분석 요청
   * @param {string} videoId - YouTube 비디오 ID
   * @returns {Promise<Object>} - {taskid: string}
   */
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
      throw new Error('분석 요청 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 분석 상태 확인
   * @param {string} taskId - 작업 ID
   * @returns {Promise<Object>} - {status: string}
   */
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
  
  /**
   * 분석 결과 조회
   * @param {string} taskId - 작업 ID
   * @returns {Promise<Object>} - 분석 결과 객체
   */
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

// 점수에 따른 색상 반환
function getScoreColor(score) {
  if (score >= 80) return '#22c55e';  // 녹색
  if (score >= 60) return '#eab308';  // 노란색
  if (score >= 40) return '#f97316';  // 주황색
  return '#ef4444';                    // 빨간색
}

// 점수에 따른 레벨 텍스트 반환
function getScoreLevel(score) {
  if (score >= 80) return '매우 적합';
  if (score >= 60) return '적합';
  if (score >= 40) return '보통';
  if (score >= 20) return '부적합';
  return '매우 부적합';
}
