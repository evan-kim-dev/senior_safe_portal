"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "ssp.webapp-guide-dismissed";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 900px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const webkit = /WebKit/i.test(ua);
  const criOS = /CriOS|FxiOS|EdgiOS/i.test(ua);
  return iOS && webkit && !criOS;
}

/** 모바일에서 홈 화면 추가(웹앱) 안내. 이미 설치됐거나 닫으면 다시 안 띄운다. */
export function WebAppInstallGuide() {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }
    if (isStandaloneDisplay() || !isMobileViewport()) return;

    setIos(isIosSafari());
    setOpen(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // 챗봇이 열려 있으면 안내창을 가려 조작을 방해하지 않는다.
  useEffect(() => {
    const sync = () => {
      if (document.body.dataset.chatOpen === "1") setOpen(false);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-chat-open"] });
    return () => observer.disconnect();
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch {
      // ignore
    }
    setInstallEvent(null);
    dismiss();
  }

  if (!open) return null;

  return (
    <div className="webapp-guide" role="dialog" aria-labelledby="webapp-guide-title" aria-modal="false">
      <div className="webapp-guide-card">
        <p id="webapp-guide-title" className="webapp-guide-title">앱처럼 쓰려면</p>
        <p className="webapp-guide-text">
          {ios
            ? "Safari 아래 공유 버튼을 누른 뒤 「홈 화면에 추가」를 고르면 앱처럼 쓸 수 있어요."
            : "브라우저 메뉴에서 「홈 화면에 추가」또는 「앱 설치」를 누르면 바로가기가 생겨요."}
        </p>
        {ios ? (
          <ol className="webapp-guide-steps">
            <li>아래쪽 <strong>공유</strong> 누르기</li>
            <li><strong>홈 화면에 추가</strong> 고르기</li>
            <li><strong>추가</strong> 누르기</li>
          </ol>
        ) : (
          <ol className="webapp-guide-steps">
            <li>오른쪽 위 <strong>⋮</strong> 메뉴 누르기</li>
            <li><strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong></li>
            <li>확인 누르기</li>
          </ol>
        )}
        <div className="webapp-guide-actions">
          {installEvent ? (
            <button type="button" className="webapp-guide-primary" onClick={() => void install()}>
              앱으로 설치
            </button>
          ) : null}
          <button type="button" className="webapp-guide-secondary" onClick={dismiss}>
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
