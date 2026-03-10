(function () {
  'use strict';

  const MIN_SPEED = 0.5;
  const MAX_SPEED = 16.0;
  const STORAGE_KEY_PREFIX = 'speed_';

  // ── 1. injected.js를 page context에 삽입 ─────────────────────────────────
  // content_script는 isolated world → prototype override 불가
  // <script> 태그로 직접 삽입하면 페이지 JS와 동일한 realm에서 실행됨
  function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => script.remove(); // 로드 후 DOM에서 제거
    (document.head || document.documentElement).appendChild(script);
  }

  injectScript();

  // ── 2. 배속 값 유효성 검사 ────────────────────────────────────────────────
  function clampSpeed(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 1.0;
    // 0.1 단위로 반올림 후 범위 클램핑
    const rounded = Math.round(num * 10) / 10;
    return Math.min(MAX_SPEED, Math.max(MIN_SPEED, rounded));
  }

  // ── 3. injected.js(page context)로 배속 명령 전달 ────────────────────────
  // isolated world → page context 직접 접근 불가이므로 CustomEvent 사용
  function sendSpeedToPageContext(speed) {
    window.dispatchEvent(
      new CustomEvent('__playbackPilot_setSpeed', { detail: { speed } })
    );
  }

  // ── 4. 배속 설정 공개 함수 ────────────────────────────────────────────────
  function setSpeed(rawValue) {
    const speed = clampSpeed(rawValue);
    sendSpeedToPageContext(speed);
    saveSpeedForCurrentSite(speed);
    return speed;
  }

  function getSpeed() {
    // injected.js가 window.__playbackPilot 를 노출해두었지만
    // isolated world에서는 page context의 window에 직접 접근 불가
    // → storage에 저장된 값을 정보 소스로 사용
    return loadSpeedForCurrentSite();
  }

  // ── 5. 사이트별 배속 저장/불러오기 (Issue #6에서 storage 로직 이관 예정) ──
  function getSiteKey() {
    return STORAGE_KEY_PREFIX + location.hostname;
  }

  function saveSpeedForCurrentSite(speed) {
    chrome.storage.sync.set({ [getSiteKey()]: speed });
  }

  function loadSpeedForCurrentSite() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(getSiteKey(), (result) => {
        resolve(result[getSiteKey()] ?? 1.0);
      });
    });
  }

  // ── 6. 페이지 로드 시 저장된 배속 복원 ───────────────────────────────────
  // injected.js가 로드된 직후 적용되어야 하므로 약간의 딜레이 후 실행
  window.addEventListener('load', () => {
    loadSpeedForCurrentSite().then((savedSpeed) => {
      if (savedSpeed !== 1.0) {
        sendSpeedToPageContext(savedSpeed);
      }
    });
  });

  // ── 7. MutationObserver — 동적 video 요소 감지 ───────────────────────────
  // YouTube, Netflix 등 SPA는 페이지 이동 시 video 요소를 동적으로 추가/교체
  // MutationObserver로 DOM 변화를 감시하여 새 video에 자동으로 배속 적용

  // 이미 처리한 video 요소를 추적하여 중복 적용 방지
  const processedVideos = new WeakSet();

  function applySpeedToVideo(video) {
    if (processedVideos.has(video)) return;
    processedVideos.add(video);

    // 저장된 배속을 불러와 해당 video에 즉시 적용
    loadSpeedForCurrentSite().then((savedSpeed) => {
      if (savedSpeed !== 1.0) {
        sendSpeedToPageContext(savedSpeed);
      }
    });
  }

  // 노드 및 하위 트리에서 video 요소를 찾아 처리
  function findAndApplyToVideos(root) {
    if (root.nodeName === 'VIDEO') {
      applySpeedToVideo(root);
    }
    root.querySelectorAll?.('video').forEach(applySpeedToVideo);
  }

  const videoObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        findAndApplyToVideos(node);
      }
    }
  });

  videoObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // 페이지 언로드 시 Observer 정리 (메모리 누수 방지)
  window.addEventListener('unload', () => {
    videoObserver.disconnect();
  });

  // 이미 존재하는 video 요소에 즉시 적용 (Observer 등록 이전에 렌더링된 video 커버)
  document.querySelectorAll('video').forEach(applySpeedToVideo);

  // ── 8. popup / overlay에서 오는 메시지 수신 ──────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SET_SPEED') {
      const applied = setSpeed(message.speed);
      // 새로 감지된 video 포함 전체 재적용을 위해 processedVideos 초기화
      document.querySelectorAll('video').forEach((video) => {
        processedVideos.delete(video);
        applySpeedToVideo(video);
      });
      sendResponse({ success: true, speed: applied });
    }

    if (message.type === 'GET_SPEED') {
      getSpeed().then((speed) => sendResponse({ success: true, speed }));
      return true; // 비동기 응답 허용
    }
  });
})();
