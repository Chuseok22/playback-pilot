(function () {
  'use strict';

  const MIN_SPEED = 0.5;
  const MAX_SPEED = 16.0;
  const POLL_INTERVAL_MS = 500;

  // content_script와 공유하는 전역 목표 배속
  // content_script에서 window.__targetPlaybackRate 를 설정하면 이쪽에서 읽음
  // 이미 주입된 경우 재실행 방지 (all_frames:true 환경에서 iframe마다 주입될 수 있음)
  if (window.__playbackPilotInjected) return;
  window.__playbackPilotInjected = true;

  window.__targetPlaybackRate = window.__targetPlaybackRate ?? 1.0;

  // ── 1. HTMLMediaElement.prototype.playbackRate setter 재정의 ──────────────
  // 페이지 JS(플레이어)가 playbackRate를 강제로 리셋하려 할 때 차단한다.
  const nativeDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'playbackRate'
  );

  if (nativeDescriptor && nativeDescriptor.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      get() {
        return nativeDescriptor.get.call(this);
      },
      set(value) {
        // 플레이어가 리셋을 시도해도 목표 배속으로 덮어씀
        nativeDescriptor.set.call(this, window.__targetPlaybackRate);
      },
      configurable: true,
      enumerable: true,
    });
  }

  // ── 2. 실제 배속 적용 함수 ────────────────────────────────────────────────
  // nativeDescriptor.set을 직접 호출해야 prototype override를 우회할 수 있음
  function applySpeedToElement(video, speed) {
    if (!nativeDescriptor || !nativeDescriptor.set) return;
    nativeDescriptor.set.call(video, speed);
  }

  function applySpeedToAllVideos(speed) {
    document.querySelectorAll('video').forEach((video) => {
      applySpeedToElement(video, speed);
    });
  }

  // ── 3. content_script → injected.js 명령 수신 ────────────────────────────
  // content_script는 isolated world에서 window 전역을 직접 쓸 수 없으므로
  // CustomEvent를 통해 메시지를 전달받는다.
  window.addEventListener('__playbackPilot_setSpeed', (event) => {
    const speed = parseFloat(event.detail?.speed);
    if (!isValidSpeed(speed)) return;

    window.__targetPlaybackRate = speed;
    applySpeedToAllVideos(speed);
  });

  // ── 4. 폴링 보조 — prototype override를 우회하는 플레이어 대응 ───────────
  // 일부 플레이어는 playbackRate setter 자체를 재정의하기 때문에
  // 주기적으로 실제 값을 검사하고 강제 복원한다.
  setInterval(() => {
    const target = window.__targetPlaybackRate;
    if (target === 1.0) return; // 1.0배속은 기본값이므로 스킵

    document.querySelectorAll('video').forEach((video) => {
      const current = nativeDescriptor.get.call(video);
      if (Math.abs(current - target) > 0.01) {
        applySpeedToElement(video, target);
      }
    });
  }, POLL_INTERVAL_MS);

  // ── 유틸 ─────────────────────────────────────────────────────────────────
  function isValidSpeed(speed) {
    return typeof speed === 'number' && !isNaN(speed)
      && speed >= MIN_SPEED && speed <= MAX_SPEED;
  }

  // 외부(content_script)에서 현재 배속 조회 가능하도록 노출
  window.__playbackPilot = {
    getSpeed: () => window.__targetPlaybackRate,
    isValidSpeed,
  };
})();
