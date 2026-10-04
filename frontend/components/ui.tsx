import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type ButtonTone = "kakao" | "naver" | "google";
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
  children,
  primary,
  secondary,
  center = false,
  narrow = false,
  live,
  busy = false,
}: {
  title?: string;
  lead?: string;
  children?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  center?: boolean;
  narrow?: boolean;
  live?: "polite" | "assertive";
  busy?: boolean;
}) {
  return (
    <main className={center ? "page page-center" : "page"} aria-live={live} aria-busy={busy || undefined}>
      {title ? (
        <header className="page-head">
          <div className="wrap">
            <h1>{title}</h1>
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
  className,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  more?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={classes("section", className)} aria-labelledby={headingId}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2 id={headingId}>{title}</h2>
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
  id,
  value,
  onChange,
  ...props
}: {
  label: string;
  multiline?: boolean;
  hideLabel?: boolean;
  id: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  return (
    <label className="field" htmlFor={id}>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      {multiline
        ? <textarea id={id} value={value} placeholder={props.placeholder} maxLength={props.maxLength} onChange={onChange} />
        : <input id={id} value={value} onChange={onChange} {...props} />}
    </label>
  );
}

const RESULT_ICON: Record<"safe" | "danger" | "plain", IconName> = { safe: "check", danger: "alert", plain: "info" };

export function Result({
  tone,
  word,
  reason,
  primary,
  secondary,
}: {
  tone: "safe" | "danger" | "plain";
  word: string;
  reason: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className={`result result-${tone}`} role="alertdialog" aria-modal="true" aria-labelledby="result-word">
      <div className="result-card">
        <span className="result-icon"><Icon name={RESULT_ICON[tone]} /></span>
        <h2 id="result-word" className="result-word">{word}</h2>
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
  return (
    <div className="result result-plain" role="dialog" aria-modal="true" aria-labelledby="checking-word" aria-busy="true">
      <div className="result-card">
        <span className="spinner" aria-hidden="true" />
        <h2 id="checking-word" className="result-word">{word}</h2>
        {hint ? <p className="result-reason">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Count({ value }: { value: number | null }) {
  return (
    <p className="count">
      <span className="count-label">오늘 위험한 영상</span>
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

export function Info({
  title,
  lines,
  tag,
  tone,
  href,
  more,
  image,
}: {
  title: string;
  lines: Array<string | null | undefined | false>;
  tag?: string;
  tone?: "purple" | "green";
  href?: string;
  more?: string;
  image?: string;
}) {
  const body = (
    <>
      {tag ? <span className="tag">{tag}</span> : null}
      {image ? (
        <span className="info-photo">
          <img src={image} alt="" loading="lazy" decoding="async" />
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
  return href ? <a className={cls} href={href} rel="noopener noreferrer">{body}</a> : <article className={cls}>{body}</article>;
}

export function Media({
  title,
  image,
  meta,
  href,
  onClick,
}: {
  title: string;
  image: string;
  meta?: string;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="thumb">
        <img src={image} alt="" loading="lazy" decoding="async" />
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
