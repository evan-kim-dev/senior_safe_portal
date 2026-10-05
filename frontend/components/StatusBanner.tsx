import type { ReactNode } from "react";

type Props = {
  variant: "waiting" | "connected";
  title: string;
  text: string;
  children?: ReactNode;
};

/** 연결 전·후 등 상태를 care/link/account에서 같은 모양으로 표시. */
export function StatusBanner({ variant, title, text, children }: Props) {
  return (
    <div className={`state-banner state-banner-${variant}`} role="status">
      <p className="state-banner-title">{title}</p>
      {text.trim() ? <p className="state-banner-text">{text}</p> : null}
      {children}
    </div>
  );
}
