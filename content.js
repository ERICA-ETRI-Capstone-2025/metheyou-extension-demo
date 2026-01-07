// MeTheYou Content Script - YouTube 플레이어에 pill 버튼 표시

let currentVideoId = null;
let pillButton = null;
let retryCount = 0;
let pillCheckInterval = null;
let currentVideoData = null;

// Pill 버튼 생성
function createPillButton() {
  const button = document.createElement('button');
  button.className = 'metheyou-pill-button loading';
  button.id = 'metheyou-pill';
  button.innerHTML = `
    <span class="metheyou-pill-text">조회 중...</span>
  `;
  return button;
}

// Pill 버튼 상태 업데이트
function updatePillButton(state, data = {}) {
  if (!pillButton) return;
  
  const text = pillButton.querySelector('.metheyou-pill-text');
  
  pillButton.className = 'metheyou-pill-button';
  
  switch (state) {
    case 'loading':
      pillButton.classList.add('loading');
      text.textContent = '조회 중...';
      pillButton.onclick = null;
      break;
      
    case 'analyze':
      pillButton.classList.add('analyze');
      text.textContent = '분석 필요';
      pillButton.onclick = () => {
        alert('확장 메뉴를 열어 영상을 분석해 주세요.');
      };
      break;
      
    case 'score':
      const score = data.score || 0;
      let level = '';
      
      if (score >= 80) {
        pillButton.classList.add('score', 'score-high');
        level = '매우 안전';
      } else if (score >= 60) {
        pillButton.classList.add('score', 'score-medium');
        level = '안전';
      } else if (score >= 40) {
        pillButton.classList.add('score', 'score-medium');
        level = '보통';
      } else {
        pillButton.classList.add('score', 'score-low');
        level = '주의';
      }
      
      text.textContent = `점수: ${score} (${level})`;
      pillButton.onclick = () => {
        if (data.task_id) {
          window.open(`https://metheyou.pdj.kr/done/${data.task_id}`, '_blank');
        } else {
          alert('분석 결과 페이지를 열 수 없습니다.');
        }
      };
      break;
  }
}

// YouTube 컨트롤 영역에 버튼 추가
function attachPillButton() {
  const existing = document.getElementById('metheyou-pill');
  if (existing) {
    // 이미 pill이 존재하고 올바른 상태면 그냥 반환
    return true;
  }
  
  // 여러 선택자 시도
  const selectors = [
    'ytd-menu-renderer.ytd-watch-metadata #top-level-buttons-computed',
    '#top-level-buttons-computed',
    '#top-level-buttons',
    'ytd-menu-renderer #top-level-buttons-computed',
    '#owner #top-row',
    'ytd-video-primary-info-renderer #menu-container'
  ];
  
  let targetContainer = null;
  for (const selector of selectors) {
    const elem = document.querySelector(selector);
    if (elem) {
      targetContainer = elem;
      console.log('[MeTheYou]  버튼 컨테이너 발견:', selector);
      break;
    }
  }
  
  if (!targetContainer) {
    console.warn('[MeTheYou]  컨테이너를 아직 찾을 수 없음');
    return false;
  }
  
  pillButton = createPillButton();
  targetContainer.appendChild(pillButton);
  console.log('[MeTheYou]  Pill 버튼 추가 완료!');
  
  // 현재 저장된 데이터가 있으면 적용
  if (currentVideoData) {
    if (currentVideoData.found === true) {
      updatePillButton('score', currentVideoData);
    } else {
      updatePillButton('analyze');
    }
  } else {
    updatePillButton('loading');
  }
  
  return true;
}

// Pill 버튼이 DOM에 존재하는지 주기적으로 확인하고 없으면 추가
function startPillMonitoring() {
  // 기존 interval 정리
  if (pillCheckInterval) {
    clearInterval(pillCheckInterval);
  }
  
  console.log('[MeTheYou] Pill 모니터링 시작');
  
  // 500ms마다 pill 존재 확인 (더 빠르게)
  pillCheckInterval = setInterval(() => {
    if (window.location.pathname !== '/watch') {
      return;
    }
    
    const existing = document.getElementById('metheyou-pill');
    if (!existing) {
      console.log('[MeTheYou] Pill 버튼이 사라짐 - 재추가 시도');
      const success = attachPillButton();
      if (success) {
        console.log('[MeTheYou] Pill 버튼 재추가 성공');
      }
    }
  }, 500);
  
  // DOM 변경 감지로도 체크
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== '/watch') {
      return;
    }
    
    const existing = document.getElementById('metheyou-pill');
    if (!existing) {
      setTimeout(() => {
        const stillMissing = !document.getElementById('metheyou-pill');
        if (stillMissing) {
          console.log('[MeTheYou] DOM 변경으로 pill 사라짐 감지');
          attachPillButton();
        }
      }, 100);
    }
  });
  
  // YouTube 플레이어 영역 감시
  const ytdWatch = document.querySelector('ytd-watch-flexy') || document.querySelector('#content');
  if (ytdWatch) {
    observer.observe(ytdWatch, { childList: true, subtree: true });
  }
}

// Pill 모니터링 중지
function stopPillMonitoring() {
  if (pillCheckInterval) {
    clearInterval(pillCheckInterval);
    pillCheckInterval = null;
  }
}

// 페이지 로드 시 캐시 확인
async function checkCacheOnLoad() {
  const videoId = getYouTubeVideoId(window.location.href);
  
  if (!videoId || window.location.pathname !== '/watch') {
    console.log('[MeTheYou] watch 페이지 아님');
    return;
  }
  
  if (currentVideoId === videoId) {
    return;
  }
  
  currentVideoId = videoId;
  console.log('[MeTheYou]  비디오 ID:', videoId);
  
  // Pill 모니터링 시작
  startPillMonitoring();
  
  // Pill 버튼 추가 (초기 시도 - 여러 번)
  currentVideoData = null;
  
  // 즉시 시도
  let success = attachPillButton();
  
  // 성공할 때까지 재시도 (최대 10번, 300ms 간격)
  let attempts = 0;
  const retryInterval = setInterval(() => {
    if (success || attempts >= 10) {
      clearInterval(retryInterval);
      return;
    }
    
    attempts++;
    console.log(`[MeTheYou] Pill 추가 재시도 (${attempts}/10)`);
    success = attachPillButton();
  }, 300);
  
  try {
    const cached = await MeTheYouAPI.searchAnalysis(videoId);
    console.log('[MeTheYou] API 응답:', cached);
    console.log('[MeTheYou] found 값:', cached.found, '타입:', typeof cached.found);
    console.log('[MeTheYou] 전체 키:', Object.keys(cached));
    
    // 데이터 저장
    if (cached.found === true || cached.found === 'true' || cached.found === 1) {
      console.log('[MeTheYou] 캐시된 결과 - 점수:', cached.score);
      currentVideoData = { found: true, ...cached };
      updatePillButton('score', cached);
    } else {
      console.log('[MeTheYou] 미분석 영상 (found:', cached.found, ')');
      currentVideoData = { found: false };
      updatePillButton('analyze');
    }
  } catch (error) {
    console.error('[MeTheYou] 오류:', error);
    currentVideoData = { found: false };
    updatePillButton('analyze');
  }
}

// URL 변경 감지 - YouTube SPA 네비게이션 이벤트 사용
function observeUrlChange() {
  // YouTube의 네비게이션 이벤트 리스닝
  document.addEventListener('yt-navigate-finish', () => {
    console.log('[MeTheYou] YouTube 네비게이션 감지');
    onUrlChange();
  });
  
  // 추가 보험으로 URL 변경 감지
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('[MeTheYou] URL 변경 감지:', url);
      onUrlChange();
    }
  }).observe(document, { subtree: true, childList: true });
}

// URL 변경 시 처리
function onUrlChange() {
  const videoId = getYouTubeVideoId(window.location.href);
  
  if (!videoId || window.location.pathname !== '/watch') {
    console.log('[MeTheYou] ❌ watch 페이지 아님 - pill 제거 및 모니터링 중지');
    stopPillMonitoring();
    if (pillButton && pillButton.parentNode) {
      pillButton.remove();
      pillButton = null;
    }
    currentVideoId = null;
    currentVideoData = null;
  } else {
    console.log('[MeTheYou] ✅ 새 비디오 감지:', videoId);
    checkCacheOnLoad();
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoId') {
    const videoId = getYouTubeVideoId(window.location.href);
    sendResponse({ videoId: videoId });
  }
  return true;
});

// 초기화
function init() {
  console.log('[MeTheYou]  초기화 시작');
  observeUrlChange();
  
  // 2초 지연 후 버튼 추가 시도
  setTimeout(() => {
    checkCacheOnLoad();
  }, 2000);
}

// 페이지 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
