(function () {
  'use strict';

  const MIN_SPEED = 0.5;
  const MAX_SPEED = 16.0;
  const STORAGE_KEY_PREFIX = 'speed_';
  const OVERLAY_MARGIN = 8; // 동영상 우상단 모서리로부터의 여백(px)

  // ── 1. injected.js를 page context에 삽입 ─────────────────────────────────
  function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  injectScript();

  // ── 2. 배속 값 유효성 검사 ────────────────────────────────────────────────
  function clampSpeed(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 1.0;
    const rounded = Math.round(num * 10) / 10;
    return Math.min(MAX_SPEED, Math.max(MIN_SPEED, rounded));
  }

  // ── 3. injected.js(page context)로 배속 명령 전달 ────────────────────────
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
    updateAllOverlays(speed);
    return speed;
  }

  function getSpeed() {
    return loadSpeedForCurrentSite();
  }

  // ── 5. 사이트별 배속 저장/불러오기 ──────────────────────────────────────
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
  window.addEventListener('load', () => {
    loadSpeedForCurrentSite().then((savedSpeed) => {
      if (savedSpeed !== 1.0) {
        sendSpeedToPageContext(savedSpeed);
        updateAllOverlays(savedSpeed);
      }
    });
  });

  // ── 7. 플로팅 오버레이 UI ────────────────────────────────────────────────
  // video 요소마다 하나의 오버레이를 생성하고 WeakMap으로 연결
  const videoOverlayMap = new WeakMap();

  function createOverlay(video) {
    const overlay = document.createElement('div');
    overlay.className = 'pp-overlay';
    overlay.setAttribute('data-pp-overlay', '');

    const btnMinus = document.createElement('button');
    btnMinus.className = 'pp-btn pp-btn-minus';
    btnMinus.textContent = '−';
    btnMinus.title = '배속 감소 (−0.1)';

    const input = document.createElement('input');
    input.className = 'pp-speed-input';
    input.type = 'number';
    input.min = String(MIN_SPEED);
    input.max = String(MAX_SPEED);
    input.step = '0.1';
    input.value = '1.0';

    const unit = document.createElement('span');
    unit.className = 'pp-unit';
    unit.textContent = 'x';

    const btnPlus = document.createElement('button');
    btnPlus.className = 'pp-btn pp-btn-plus';
    btnPlus.textContent = '+';
    btnPlus.title = '배속 증가 (+0.1)';

    overlay.append(btnMinus, input, unit, btnPlus);
    document.body.appendChild(overlay);

    // 버튼 이벤트 — 오버레이 클릭이 플레이어에 전달되지 않도록 전파 차단
    btnMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = clampSpeed(input.value);
      const next = clampSpeed(current - 0.1);
      setSpeed(next);
    });

    btnPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = clampSpeed(input.value);
      const next = clampSpeed(current + 0.1);
      setSpeed(next);
    });

    // 직접 입력: Enter 또는 포커스 아웃 시 적용
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        setSpeed(input.value);
        input.blur();
      }
      e.stopPropagation(); // 키 이벤트가 플레이어에 전달되지 않도록 차단
    });

    input.addEventListener('blur', () => {
      setSpeed(input.value);
    });

    input.addEventListener('click', (e) => e.stopPropagation());

    // 위치 설정 및 추적
    positionOverlay(video, overlay);
    watchVideoPosition(video, overlay);

    return overlay;
  }

  // 오버레이를 video의 우상단에 fixed 위치로 배치
  function positionOverlay(video, overlay) {
    const rect = video.getBoundingClientRect();

    // 동영상이 화면 밖이거나 숨겨진 경우 오버레이 숨김
    if (rect.width === 0 || rect.height === 0) {
      overlay.classList.add('pp-overlay--hidden');
      return;
    }

    overlay.classList.remove('pp-overlay--hidden');
    overlay.style.top = `${rect.top + OVERLAY_MARGIN}px`;
    overlay.style.right = `${window.innerWidth - rect.right + OVERLAY_MARGIN}px`;
    overlay.style.left = 'auto';
  }

  // ResizeObserver + scroll 이벤트로 오버레이 위치를 동영상에 고정
  function watchVideoPosition(video, overlay) {
    const resizeObserver = new ResizeObserver(() => {
      positionOverlay(video, overlay);
    });
    resizeObserver.observe(video);

    const onScroll = () => positionOverlay(video, overlay);
    window.addEventListener('scroll', onScroll, { passive: true });

    // 전체화면 전환 시 재배치
    document.addEventListener('fullscreenchange', () => {
      // 전체화면 진입/종료 후 레이아웃이 안정되면 재계산
      setTimeout(() => positionOverlay(video, overlay), 150);
    });

    // video가 DOM에서 제거되면 오버레이도 제거
    const removalObserver = new MutationObserver(() => {
      if (!document.contains(video)) {
        overlay.remove();
        resizeObserver.disconnect();
        removalObserver.disconnect();
        window.removeEventListener('scroll', onScroll);
      }
    });
    removalObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // 모든 오버레이의 속도 표시 업데이트
  function updateAllOverlays(speed) {
    document.querySelectorAll('[data-pp-overlay] .pp-speed-input').forEach((input) => {
      if (document.activeElement !== input) {
        input.value = speed.toFixed(1);
      }
    });
  }

  // ── 8. MutationObserver — 동적 video 요소 감지 ───────────────────────────
  const processedVideos = new WeakSet();

  function applySpeedToVideo(video) {
    if (processedVideos.has(video)) return;
    processedVideos.add(video);

    loadSpeedForCurrentSite().then((savedSpeed) => {
      if (savedSpeed !== 1.0) {
        sendSpeedToPageContext(savedSpeed);
      }

      // 오버레이 생성 (video당 1개)
      if (!videoOverlayMap.has(video)) {
        const overlay = createOverlay(video);
        videoOverlayMap.set(video, overlay);
        const input = overlay.querySelector('.pp-speed-input');
        if (input) input.value = savedSpeed.toFixed(1);
      }
    });
  }

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

  window.addEventListener('unload', () => {
    videoObserver.disconnect();
    document.querySelectorAll('[data-pp-overlay]').forEach((el) => el.remove());
  });

  document.querySelectorAll('video').forEach(applySpeedToVideo);

  // ── 9. popup에서 오는 메시지 수신 ────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SET_SPEED') {
      const applied = setSpeed(message.speed);
      document.querySelectorAll('video').forEach((video) => {
        processedVideos.delete(video);
        applySpeedToVideo(video);
      });
      sendResponse({ success: true, speed: applied });
    }

    if (message.type === 'GET_SPEED') {
      getSpeed().then((speed) => sendResponse({ success: true, speed }));
      return true;
    }
  });
})();
