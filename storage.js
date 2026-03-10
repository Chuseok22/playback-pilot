// storage.js
// chrome.storage.sync 기반 사이트별 배속 저장 모듈
// content_script.js보다 먼저 로드되어 SpeedStorage 전역 객체를 제공

const SpeedStorage = (() => {
  'use strict';

  const DEFAULT_SPEED = 1.0;

  // 스토리지 키: 도메인명 그대로 사용 (예: "youtube.com")
  function siteKey(hostname) {
    return hostname || location.hostname;
  }

  // 현재 탭의 도메인에 대한 배속 저장
  function save(speed, hostname) {
    const key = siteKey(hostname);
    chrome.storage.sync.set({ [key]: speed });
  }

  // 현재 탭의 도메인에 대한 배속 불러오기 (없으면 DEFAULT_SPEED)
  function load(hostname) {
    const key = siteKey(hostname);
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key] ?? DEFAULT_SPEED);
      });
    });
  }

  // 특정 도메인의 저장된 배속 초기화
  function clear(hostname) {
    const key = siteKey(hostname);
    chrome.storage.sync.remove(key);
  }

  // 저장된 모든 사이트 배속 조회 (디버깅/향후 설정 페이지용)
  function loadAll() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        resolve(result);
      });
    });
  }

  return { save, load, clear, loadAll, DEFAULT_SPEED };
})();
