"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";

const DISMISS_KEY = "ssp.webapp-guide-dismissed-v2";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Step = {
  icon: IconName;
  title: string;
  text: string;
};

const IOS_STEPS: Step[] = [
  { icon: "share", title: "공유", text: "화면 아래 공유 버튼을 눌러 주세요." },
  { icon: "home", title: "홈 화면에 추가", text: "목록에서 「홈 화면에 추가」를 고르세요." },
  { icon: "check", title: "추가", text: "오른쪽 위 「추가」를 누르면 끝나요." },
];

const ANDROID_STEPS: Step[] = [
  { icon: "more", title: "메뉴", text: "오른쪽 위 ⋮ 메뉴를 눌러 주세요." },
  { icon: "download", title: "앱 설치", text: "「앱 설치」또는 「홈 화면에 추가」를 고르세요." },
  { icon: "check", title: "확인", text: "확인을 누르면 바로가기가 생겨요." },
];

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

  const steps = ios ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div className="webapp-guide" role="dialog" aria-labelledby="webapp-guide-title" aria-modal="false">
      <div className="webapp-guide-card">
        <div className="webapp-guide-brand">
          <span className="webapp-guide-appicon" aria-hidden="true">
            <img src="/apple-touch-icon.png" alt="" width={48} height={48} />
          </span>
          <div>
            <p id="webapp-guide-title" className="webapp-guide-title">앱처럼 쓰려면</p>
            <p className="webapp-guide-text">
              {ios
                ? "아래 아이콘 순서대로 누르면 홈 화면에 생겨요."
                : "아래 아이콘 순서대로 누르면 앱처럼 쓸 수 있어요."}
            </p>
          </div>
        </div>

        <ol className="webapp-guide-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="webapp-guide-step">
              <span className="webapp-guide-step-num" aria-hidden="true">{index + 1}</span>
              <span className="webapp-guide-step-icon" aria-hidden="true">
                <Icon name={step.icon} />
              </span>
              <span className="webapp-guide-step-copy">
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="webapp-guide-actions">
          {installEvent ? (
            <button type="button" className="webapp-guide-primary" onClick={() => void install()}>
              <Icon name="download" />
              <span>앱으로 설치</span>
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
