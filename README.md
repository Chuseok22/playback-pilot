# Playback Pilot

모든 동영상 플레이어에서 배속 제한 없이 **0.5x ~ 16x** 재생 속도를 자유롭게 조절하는 Chrome 확장 프로그램입니다.

---

## 주요 기능

- **배속 우회** — Netflix, Wavve 등 배속을 제한하는 플레이어에서도 동작
- **세밀한 조절** — 0.1 단위, 0.5x ~ 16x 범위
- **플로팅 오버레이** — 동영상 위에 컨트롤러가 표시되어 즉시 조절 가능
- **팝업 UI** — 확장 아이콘 클릭으로 배속 입력 및 프리셋(1.0 / 1.5 / 2.0 / 3.0) 선택
- **사이트별 저장** — 도메인별로 배속 설정을 기억하여 재방문 시 자동 복원
- **동적 감지** — SPA 환경에서 페이지 이동 후 추가되는 영상에도 자동 적용

---

## 지원 환경

- Chrome 브라우저 (Manifest V3)

---

## 설치 방법 (개발 버전)

1. 이 레포지토리를 클론합니다.
2. `chrome://extensions/` 에서 **개발자 모드**를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다** → 프로젝트 루트 폴더 선택

---

## 빌드 (배포용 zip 생성)

```bash
bash build.sh
```

`dist/playback-pilot-v{version}.zip` 파일이 생성됩니다.

---

## 프로젝트 구조

```
playback-pilot/
├── manifest.json          # Manifest V3
├── content_script.js      # 페이지 주입 스크립트
├── injected.js            # page context prototype override
├── storage.js             # chrome.storage 래퍼 모듈
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── overlay/
│   └── overlay.css        # 플로팅 컨트롤러 스타일
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 아이콘 교체

`icons/` 폴더의 PNG 파일을 동일 파일명으로 교체하면 브랜딩 변경이 완료됩니다.

| 파일 | 용도 |
|------|------|
| `icon16.png` | 툴바 아이콘 |
| `icon48.png` | 확장 프로그램 관리 페이지 |
| `icon128.png` | Chrome Web Store |

---

## 개인정보처리방침

[privacy-policy.md](./privacy-policy.md) 참고

---

## 라이선스

MIT
