(function () {
  'use strict';

  const MIN_SPEED = 0.5;
  const MAX_SPEED = 16.0;

  // ── DOM 참조 ──────────────────────────────────────────────────────────────
  const elEmpty    = document.getElementById('pp-empty');
  const elContent  = document.getElementById('pp-content');
  const elSiteLabel = document.getElementById('pp-site-label');
  const elInput    = document.getElementById('pp-speed-input');
  const elBtnMinus = document.getElementById('pp-btn-minus');
  const elBtnPlus  = document.getElementById('pp-btn-plus');
  const elPresets  = document.querySelectorAll('.pp-preset-btn');

  // ── 유틸 ──────────────────────────────────────────────────────────────────
  function clampSpeed(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 1.0;
    const rounded = Math.round(num * 10) / 10;
    return Math.min(MAX_SPEED, Math.max(MIN_SPEED, rounded));
  }

  function formatSpeed(speed) {
    return speed.toFixed(1);
  }

  // ── UI 상태 업데이트 ───────────────────────────────────────────────────────
  function renderSpeed(speed) {
    elInput.value = formatSpeed(speed);
    updatePresetHighlight(speed);
  }

  function updatePresetHighlight(speed) {
    const rounded = formatSpeed(clampSpeed(speed));
    elPresets.forEach((btn) => {
      const isActive = parseFloat(btn.dataset.speed).toFixed(1) === rounded;
      btn.classList.toggle('pp-preset-btn--active', isActive);
    });
  }

  function showContent(hostname) {
    elEmpty.style.display = 'none';
    elContent.style.display = 'flex';
    elSiteLabel.textContent = hostname || '';
  }

  function showEmpty() {
    elEmpty.style.display = 'block';
    elContent.style.display = 'none';
    elSiteLabel.textContent = '';
  }

  // ── content_script와 통신 ─────────────────────────────────────────────────
  function sendToContentScript(type, payload, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, { type, ...payload }, (response) => {
        if (chrome.runtime.lastError) {
          // content_script 미주입 페이지 (chrome:// 등) — 동영상 없음 처리
          showEmpty();
          return;
        }
        callback?.(response);
      });
    });
  }

  function applySpeed(rawValue) {
    const speed = clampSpeed(rawValue);
    renderSpeed(speed);
    sendToContentScript('SET_SPEED', { speed }, (response) => {
      if (response?.speed !== undefined) {
        renderSpeed(response.speed);
      }
    });
  }

  // ── 초기화: 현재 탭의 배속 조회 ──────────────────────────────────────────
  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        showEmpty();
        return;
      }

      // 사이트 도메인 표시
      try {
        const url = new URL(tab.url);
        elSiteLabel.textContent = url.hostname;
      } catch (_) {
        elSiteLabel.textContent = '';
      }

      // 현재 배속 조회
      chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          showEmpty();
          return;
        }
        showContent(elSiteLabel.textContent);
        renderSpeed(response.speed ?? 1.0);
      });
    });
  }

  // ── 이벤트 바인딩 ────────────────────────────────────────────────────────
  elBtnMinus.addEventListener('click', () => {
    const current = clampSpeed(elInput.value);
    applySpeed(current - 0.1);
  });

  elBtnPlus.addEventListener('click', () => {
    const current = clampSpeed(elInput.value);
    applySpeed(current + 0.1);
  });

  elInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applySpeed(elInput.value);
      elInput.blur();
    }
  });

  elInput.addEventListener('blur', () => {
    applySpeed(elInput.value);
  });

  elPresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      applySpeed(parseFloat(btn.dataset.speed));
    });
  });

  // ── 팝업 열릴 때 실행 ────────────────────────────────────────────────────
  init();
})();
