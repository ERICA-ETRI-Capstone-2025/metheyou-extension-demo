// MeTheYou Content Script - YouTube 플레이어에 pill 버튼 표시

let currentVideoId = null;
let pillButton = null;
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
        const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
        window.open(`https://metheyou.pdj.kr#${videoUrl}`, '_blank');
      };
      break;
      
    case 'score':
      const score = data.score || 0;
      let level = '';
      
      if (score >= 80) {
        pillButton.classList.add('score', 'score-high');
        level = '안전';
      } else if (score >= 60) {
        pillButton.classList.add('score', 'score-medium');
        level = '보통';
      } else if (score >= 40) {
        pillButton.classList.add('score', 'score-medium');
        level = '주의';
      } else {
        pillButton.classList.add('score', 'score-low');
        level = '위험';
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

// 버튼 컨테이너를 찾는 함수
function findButtonContainer() {
  const selectors = [
    'ytd-menu-renderer.ytd-watch-metadata #top-level-buttons-computed',
    '#top-level-buttons-computed',
    '#top-level-buttons',
    'ytd-menu-renderer #top-level-buttons-computed',
    '#owner #top-row',
    'ytd-video-primary-info-renderer #menu-container'
  ];
  
  for (const selector of selectors) {
    const elems = document.querySelectorAll(selector);
    
    // 여러 개가 있을 수 있으므로 visible한 것만 찾기
    for (const elem of elems) {
      if (elem && elem.offsetParent !== null && elem.offsetWidth > 0 && elem.offsetHeight > 0) {
        // watch 페이지의 메인 컨텐츠 영역 안에 있는지 확인
        const watchFlexy = elem.closest('ytd-watch-flexy');
        if (watchFlexy) {
          return { container: elem, selector };
        }
      }
    }
  }
  return null;
}

// YouTube 컨트롤 영역에 버튼 추가 (동기 함수)
function attachPillButton() {
  // 이미 pill이 존재하면 성공
  const existing = document.getElementById('metheyou-pill');
  if (existing) {
    return true;
  }
  
  // 버튼 컨테이너 찾기
  const result = findButtonContainer();
  if (!result) {
    return false;
  }
  
  // Pill 생성 및 추가
  pillButton = createPillButton();
  result.container.appendChild(pillButton);
  
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
  // 이미 실행 중이면 리턴
  if (pillCheckInterval) {
    return;
  }
  
  // 1초마다 pill 확인 및 추가 시도
  pillCheckInterval = setInterval(() => {
    // watch 페이지가 아니면 패스
    if (window.location.pathname !== '/watch') {
      return;
    }
    
    // pill이 없으면 추가 시도
    const existing = document.getElementById('metheyou-pill');
    if (!existing) {
      attachPillButton();
    }
  }, 1000);
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
    return;
  }
  
  if (currentVideoId === videoId) {
    return;
  }
  
  currentVideoId = videoId;
  
  // 데이터 초기화
  currentVideoData = null;
  
  // Pill 모니터링 시작 (주기적으로 pill 추가 시도)
  startPillMonitoring();
  
  // 즉시 한 번 시도
  attachPillButton();
  
  // API 호출
  try {
    const cached = await MeTheYouAPI.searchAnalysis(videoId);
    
    // 데이터 저장
    if (cached.found === true || cached.found === 'true' || cached.found === 1) {
      currentVideoData = { found: true, ...cached };
      updatePillButton('score', cached);
    } else {
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
    // 짧은 지연을 주어 DOM이 준비되도록 함
    setTimeout(() => {
      onUrlChange();
    }, 100);
  });
  
  // 추가 보험으로 URL 변경 감지
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        onUrlChange();
      }, 100);
    }
  }).observe(document, { subtree: true, childList: true });
}

// URL 변경 시 처리
function onUrlChange() {
  const videoId = getYouTubeVideoId(window.location.href);
  
  if (!videoId || window.location.pathname !== '/watch') {
    stopPillMonitoring();
    if (pillButton && pillButton.parentNode) {
      pillButton.remove();
      pillButton = null;
    }
    currentVideoId = null;
    currentVideoData = null;
  } else {
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
  console.log('[MeTheYou] 초기화 시작');
  
  // URL 변경 감지 시작
  observeUrlChange();
  
  // 전역 모니터링 시작 (watch 페이지에서만 작동)
  startPillMonitoring();
  
  // 현재 페이지가 watch 페이지인 경우 즉시 시도
  if (window.location.pathname === '/watch') {
    // 짧은 지연 후 시도 (DOM 준비 대기)
    setTimeout(() => {
      checkCacheOnLoad();
    }, 500);
  }
}

// 페이지 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
