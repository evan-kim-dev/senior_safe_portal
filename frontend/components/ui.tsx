"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type RefObject } from "react";
import { Icon, type IconName } from "./icons";

type ButtonTone = "kakao" | "naver" | "google" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  icon?: IconName;
  tone?: ButtonTone;
};

function classes(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function ButtonBase({ base, children, type = "button", href, icon, className, ...props }: ButtonProps & { base: string }) {
  const cls = classes("btn", base, className);
  const content = (
    <>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </>
  );
  if (href) {
    return href.startsWith("/")
      ? <Link className={cls} href={href}>{content}</Link>
      : <a className={cls} href={href} rel="noopener noreferrer">{content}</a>;
  }
  return (
    <button type={type} className={cls} {...props}>
      {content}
    </button>
  );
}

export function BigButton({ tone, ...props }: ButtonProps) {
  return <ButtonBase base={tone ? `btn-${tone}` : "btn-primary"} {...props} />;
}

export function LineButton(props: ButtonProps) {
  return <ButtonBase base="btn-line" {...props} />;
}

export function Screen({
  title,
  lead,
  meta,
  children,
  primary,
  secondary,
  center = false,
  narrow = false,
  live,
  busy = false,
  className,
}: {
  title?: string;
  lead?: string;
  /** 제목 옆 희미한 보조 정보(저장 시각 등) */
  meta?: ReactNode;
  children?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  center?: boolean;
  narrow?: boolean;
  live?: "polite" | "assertive";
  busy?: boolean;
  className?: string;
}) {
  return (
    <main
      className={classes(center ? "page page-center" : "page", className)}
      aria-live={live}
      aria-busy={busy || undefined}
    >
      {title ? (
        <header className="page-head">
          <div className="wrap">
            <div className="page-title-row">
              <h1>{title}</h1>
              {meta}
            </div>
            {lead ? <p className="lead">{lead}</p> : null}
          </div>
        </header>
      ) : null}
      <div className={narrow || center ? "wrap page-main narrow" : "wrap page-main"}>
        {children ? <div className="page-body">{children}</div> : null}
        {secondary || primary ? (
          <div className="page-actions">
            {secondary ? <div className="page-secondary">{secondary}</div> : null}
            {primary ? <div className="page-primary">{primary}</div> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export function Section({
  id,
  title,
  desc,
  more,
  meta,
  className,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  more?: { href: string; label: string };
  /** 제목 옆 희미한 보조 정보(저장 시각 등) */
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={classes("section", className)} aria-labelledby={headingId}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-title-row">
              <h2 id={headingId}>{title}</h2>
              {meta}
            </div>
            {desc ? <p>{desc}</p> : null}
          </div>
          {more ? (
            <Link className="more" href={more.href}>
              {more.label}
              <Icon name="next" />
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Grid({ kind, children }: { kind: "media" | "info"; children: ReactNode }) {
  return <div className={`grid grid-${kind}`}>{children}</div>;
}

export function Field({
  label,
  multiline = false,
  hideLabel = false,
  required = false,
  id,
  value,
  onChange,
  ...props
}: {
  label: string;
  multiline?: boolean;
  hideLabel?: boolean;
  required?: boolean;
  id: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "required">) {
  return (
    <label className="field" htmlFor={id}>
      <span className={hideLabel ? "sr-only" : undefined}>
        {label}
        {required ? (
          <abbr className="field-required" title="필수">*</abbr>
        ) : null}
      </span>
      {multiline
        ? <textarea id={id} value={value} placeholder={props.placeholder} maxLength={props.maxLength} required={required || undefined} onChange={onChange} />
        : <input id={id} value={value} required={required || undefined} onChange={onChange} {...props} />}
    </label>
  );
}

const RESULT_ICON: Record<"safe" | "danger" | "plain", IconName> = { safe: "check", danger: "alert", plain: "info" };

function useModalChrome(options: {
  active: boolean;
  onDismiss?: () => void;
  allowEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { active, onDismiss, allowEscape = true, initialFocusRef } = options;

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTarget = initialFocusRef?.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusTarget?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && allowEscape) {
        event.preventDefault();
        onDismiss?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [active, allowEscape, initialFocusRef, onDismiss]);
}

export function Result({
  tone,
  word,
  reason,
  primary,
  secondary,
  onDismiss,
}: {
  tone: "safe" | "danger" | "plain";
  word: string;
  reason: string;
  primary: ReactNode;
  secondary?: ReactNode;
  onDismiss?: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const allowBackdrop = Boolean(onDismiss) && tone !== "danger";
  useModalChrome({
    active: true,
    onDismiss,
    allowEscape: Boolean(onDismiss),
    initialFocusRef: closeRef,
  });

  return (
    <div
      className={`result result-${tone}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (allowBackdrop && event.target === event.currentTarget) onDismiss?.();
      }}
    >
      <div className="result-card" role="document">
        {onDismiss ? (
          <button ref={closeRef} type="button" className="result-close" onClick={onDismiss}>
            <Icon name="close" />
            <span>닫기</span>
          </button>
        ) : null}
        <span className="result-icon"><Icon name={RESULT_ICON[tone]} /></span>
        <h2 id={titleId} className="result-word">{word}</h2>
        <p className="result-reason">{reason}</p>
        <div className="result-actions">
          {secondary}
          {primary}
        </div>
      </div>
    </div>
  );
}

export function Checking({ word, hint }: { word: string; hint?: string }) {
  const titleId = useId();
  useModalChrome({ active: true, allowEscape: false });

  return (
    <div className="result result-plain" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy="true">
      <div className="result-card" role="document">
        <span className="spinner" aria-hidden="true" />
        <h2 id={titleId} className="result-word">{word}</h2>
        {hint ? <p className="result-reason">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Count({
  value,
  label = "오늘 위험한 검사",
}: {
  value: number | null;
  label?: string;
}) {
  return (
    <p className="count">
      <span className="count-label">{label}</span>
      <span className="count-num">{value === null ? "…" : `${value}개`}</span>
    </p>
  );
}

export function Status({ children }: { children: ReactNode }) {
  return <p className="status" role="status">{children}</p>;
}

export function Group({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <section className="group" aria-label={label}>
      {title ? <h2 className="group-title">{title}</h2> : null}
      <div className="list">{children}</div>
    </section>
  );
}

export function Row({
  children,
  meta,
  onClick,
  tone,
}: {
  children: ReactNode;
  meta?: string;
  onClick?: () => void;
  tone?: "safe" | "danger";
}) {
  return (
    <button type="button" className={tone ? `row row-${tone}` : "row"} onClick={onClick} disabled={!onClick}>
      <span className="row-text">{children}</span>
      {meta ? <span className="row-meta">{meta}</span> : null}
      {onClick ? <Icon name="next" className="row-arrow" /> : null}
    </button>
  );
}

function hideBrokenPhoto(event: { currentTarget: HTMLImageElement }) {
  const box = event.currentTarget.closest(".info-photo, .mosaic-photo");
  if (box instanceof HTMLElement) box.hidden = true;
}

/** 피드에 올라온 영상·기사에 붙이는 확인 표시. */
export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="verified-badge">
      <Icon name="check" />
      {label}
    </span>
  );
}

export function Info({
  title,
  lines,
  tag,
  tone,
  href,
  more,
  image,
  verified,
  onOpen,
}: {
  title: string;
  lines: Array<string | null | undefined | false>;
  tag?: string;
  tone?: "purple" | "green";
  href?: string;
  more?: string;
  image?: string;
  verified?: string;
  onOpen?: () => void;
}) {
  const body = (
    <>
      {!image && verified ? <VerifiedBadge label={verified} /> : null}
      {!verified && tag ? <span className="tag">{tag}</span> : null}
      {image ? (
        <span className="info-photo">
          <img src={image} alt="" loading="lazy" decoding="async" onError={hideBrokenPhoto} />
          {verified ? <VerifiedBadge label={verified} /> : null}
        </span>
      ) : null}
      <strong className="info-title">{title}</strong>
      {lines.filter((line): line is string => Boolean(line)).map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
      {href && more ? (
        <span className="info-more">
          {more}
          <Icon name="arrow" />
        </span>
      ) : null}
    </>
  );
  const cls = classes("info", tone && `info-${tone}`, href && "info-link", image && "info-has-photo");
  return href ? (
    <a className={cls} href={href} rel="noopener noreferrer" onClick={onOpen}>{body}</a>
  ) : (
    <article className={cls}>{body}</article>
  );
}

export function Media({
  title,
  image,
  meta,
  href,
  onClick,
  verified = "확인된 영상",
}: {
  title: string;
  image: string;
  meta?: string;
  href?: string;
  onClick?: () => void;
  verified?: string | false;
}) {
  const body = (
    <>
      <span className="thumb">
        <img src={image} alt="" loading="lazy" decoding="async" />
        {verified ? <VerifiedBadge label={verified} /> : null}
        <span className="thumb-play" aria-hidden="true" />
      </span>
      <strong className="media-title">{title}</strong>
      {meta ? <span className="media-meta">{meta}</span> : null}
    </>
  );
  return href
    ? <Link className="media" href={href}>{body}</Link>
    : <button type="button" className="media" onClick={onClick}>{body}</button>;
}

export function Player({ title, src }: { title: string; src: string }) {
  return (
    <iframe
      className="player"
      title={title}
      src={src}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
