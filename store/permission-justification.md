# 권한 사용 근거 (Chrome Web Store 제출용)

Chrome Web Store Developer Dashboard → 스토어 등록 정보 → 권한 정당성 항목에 입력할 내용입니다.

---

## scripting 권한

**입력 내용 (한국어):**
```
이 확장 프로그램은 사용자가 방문하는 웹 페이지에 동영상 배속 제어 스크립트를 주입하기 위해
scripting 권한이 필요합니다.

구체적으로, 일부 동영상 플레이어(Netflix, Wavve 등)는 자체 JavaScript로 playbackRate 속성을
감지하고 강제로 1.0으로 리셋하는 방어 로직을 가지고 있습니다. 이를 우회하려면
HTMLMediaElement.prototype.playbackRate의 setter를 페이지의 JavaScript 실행 컨텍스트(page context)
에서 재정의해야 합니다. Content Script는 격리된 실행 환경(isolated world)에서 동작하므로
페이지 컨텍스트에 직접 접근할 수 없어 scripting 권한을 통해 스크립트를 주입합니다.

주입되는 스크립트(injected.js)는 외부 서버에서 불러오는 것이 아니라 확장 프로그램
패키지 내에 번들된 로컬 파일입니다.
```

**입력 내용 (영어 — 영어 심사 시 사용):**
```
This extension requires the scripting permission to inject a playback speed control script
into web pages the user visits.

Specifically, some video players (e.g., Netflix, Wavve) use their own JavaScript to detect
changes to the playbackRate property and forcibly reset it to 1.0. To bypass this restriction,
the setter of HTMLMediaElement.prototype.playbackRate must be overridden within the page's
JavaScript execution context (page context). Since content scripts run in an isolated world
and cannot directly access the page context, the scripting permission is used to inject the
script into the page context.

The injected script (injected.js) is a local file bundled within the extension package,
not fetched from any external server.
```

---

## storage 권한

**입력 내용 (한국어):**
```
이 확장 프로그램은 사용자가 설정한 사이트별 동영상 재생 배속을 저장하고 복원하기 위해
storage 권한이 필요합니다.

사용자가 특정 사이트(예: youtube.com)에서 배속을 1.5x로 설정하면, chrome.storage.sync에
{ "youtube.com": 1.5 } 형태로 저장됩니다. 다음에 같은 사이트를 방문할 때 저장된 배속이
자동으로 복원되어 매번 다시 설정하는 불편함을 없앱니다.

저장되는 데이터는 사이트 도메인과 배속 수치뿐이며, 개인 식별 정보나 방문 기록은
일절 저장하지 않습니다.
```

**입력 내용 (영어):**
```
This extension requires the storage permission to save and restore per-site video playback
speed settings chosen by the user.

When a user sets the playback speed to 1.5x on a specific site (e.g., youtube.com), it is
stored in chrome.storage.sync as { "youtube.com": 1.5 }. The next time the user visits the
same site, the saved speed is automatically restored, eliminating the need to reconfigure
it every time.

Only the site domain and the speed value are stored. No personally identifiable information
or browsing history is collected or stored.
```

---

## activeTab 권한

**입력 내용 (한국어):**
```
이 확장 프로그램은 팝업 UI에서 현재 활성화된 탭의 content script와 통신하기 위해
activeTab 권한이 필요합니다.

사용자가 확장 프로그램 아이콘을 클릭하면 팝업이 열리고, 팝업에서 배속을 변경하거나
현재 배속을 조회할 때 현재 탭의 content script에 메시지를 전송합니다(chrome.tabs.sendMessage).
이 통신을 위해 현재 탭에 접근하는 activeTab 권한이 필요합니다.
```

**입력 내용 (영어):**
```
This extension requires the activeTab permission to communicate with the content script
running in the currently active tab from the popup UI.

When a user clicks the extension icon and opens the popup, the popup sends messages to the
content script in the current tab (via chrome.tabs.sendMessage) to either retrieve the
current playback speed or apply a new one. The activeTab permission is required to access
the current tab for this communication.
```

---

## 호스트 권한 (<all_urls>)

**입력 내용 (한국어):**
```
이 확장 프로그램은 사용자가 방문하는 모든 웹사이트에서 동영상 재생 배속을 제어하기 위해
<all_urls> 호스트 권한이 필요합니다.

동영상은 YouTube, Netflix, 네이버TV, 카카오TV, Wavve, Tving, 사내 LMS, 개인 블로그 등
사전에 알 수 없는 불특정 다수의 도메인에서 재생됩니다. 특정 도메인만 허용하면 해당 목록에
없는 사이트에서는 배속 기능이 동작하지 않아 사용자 경험이 크게 제한됩니다.

확장 프로그램은 방문한 페이지의 URL, 콘텐츠, 쿠키, 개인 정보 등을 읽거나 전송하지 않습니다.
오직 <video> 태그의 playbackRate 속성 제어와 사이트 도메인별 배속 저장에만 사용됩니다.
```

**입력 내용 (영어):**
```
This extension requires the <all_urls> host permission to control video playback speed
across all websites the user visits.

Videos are played on an unpredictable variety of domains — including YouTube, Netflix,
Naver TV, Kakao TV, Wavve, Tving, internal LMS platforms, and personal blogs — that cannot
be enumerated in advance. Restricting access to specific domains would prevent the extension
from functioning on any site not included in that list, severely limiting its usefulness.

The extension does not read, collect, or transmit any page content, URLs, cookies, or
personal information. The host permission is used solely to control the playbackRate property
of <video> elements and to store per-domain speed settings.
```

---

## 원격 코드 사용 근거

**⚠️ 이 확장 프로그램은 원격 코드를 사용하지 않습니다.**

심사 폼에서 "원격 코드를 사용합니까?" 질문에 **"아니오"** 를 선택하세요.

**근거 설명 (심사관에게 추가로 기재할 경우):**

**한국어:**
```
이 확장 프로그램은 외부 서버에서 코드를 동적으로 불러오지 않습니다.

content_script.js에서 <script> 태그를 생성하여 injected.js를 페이지에 삽입하는 방식을
사용하지만, injected.js는 외부 URL이 아니라 chrome.runtime.getURL('injected.js')를 통해
확장 프로그램 패키지 내에 번들된 로컬 파일을 참조합니다.

사용된 모든 JavaScript 파일(content_script.js, injected.js, storage.js, popup/popup.js)은
확장 프로그램 zip 패키지에 포함되어 있으며, eval(), new Function(), 외부 CDN 로딩 등
원격 코드 실행 방식은 일절 사용하지 않습니다.
```

**영어:**
```
This extension does not load or execute any code from external servers.

Although content_script.js creates a <script> tag to inject injected.js into the page,
the script source is resolved via chrome.runtime.getURL('injected.js'), which references
a local file bundled within the extension package — not an external URL.

All JavaScript files used by this extension (content_script.js, injected.js, storage.js,
popup/popup.js) are included in the extension zip package. No remote code execution
techniques such as eval(), new Function(), or external CDN loading are used.
```
