import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; href?: string };

export function BigButton({ children, type = "button", href, ...props }: ButtonProps) {
  if (href) {
    return href.startsWith("/")
      ? <Link className="big-button" href={href}>{children}</Link>
      : <a className="big-button" href={href} rel="noopener noreferrer">{children}</a>;
  }
  return (
    <button type={type} className="big-button" {...props}>
      {children}
    </button>
  );
}

export function Screen({
  title,
  children,
  primary,
  secondary,
  center = false,
  live,
  busy = false,
}: {
  title?: string;
  children?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  center?: boolean;
  live?: "polite" | "assertive";
  busy?: boolean;
}) {
  return (
    <main className={center ? "screen screen-center" : "screen"} aria-live={live} aria-busy={busy || undefined}>
      {title ? <h1>{title}</h1> : null}
      <div className="screen-body">{children}</div>
      {secondary || primary ? (
        <div className="screen-actions">
          {secondary ? <div className="screen-secondary">{secondary}</div> : null}
          {primary ? <div className="screen-action">{primary}</div> : null}
        </div>
      ) : null}
    </main>
  );
}

export function Field({
  label,
  multiline = false,
  id,
  value,
  onChange,
  ...props
}: {
  label: string;
  multiline?: boolean;
  id: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {multiline
        ? <textarea id={id} value={value} placeholder={props.placeholder} maxLength={props.maxLength} onChange={onChange} />
        : <input id={id} value={value} onChange={onChange} {...props} />}
    </label>
  );
}

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
    <main className={tone === "plain" ? "result" : `result ${tone}`} role="alert">
      <h1 className="result-word">{word}</h1>
      <p className="result-reason">{reason}</p>
      <div className="screen-actions">
        {secondary ? <div className="screen-secondary">{secondary}</div> : null}
        <div className="screen-action">{primary}</div>
      </div>
    </main>
  );
}

export function Count({ value }: { value: number | null }) {
  return (
    <p className="count">
      오늘 위험한 영상
      <span className="count-num">{value === null ? "…" : `${value}개`}</span>
    </p>
  );
}

export function LineButton({ children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className="line-button" {...props}>
      {children}
    </button>
  );
}

export function Status({ children }: { children: ReactNode }) {
  return <p className="status" role="status">{children}</p>;
}

export function Group({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <section className="group" aria-label={label}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}

export function Row({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "safe" | "danger";
}) {
  return (
    <button type="button" className={tone ? `row ${tone}` : "row"} onClick={onClick} disabled={!onClick}>
      <span>{children}</span>
      {onClick ? <i aria-hidden="true">→</i> : null}
    </button>
  );
}

export function Info({ title, lines }: { title: string; lines: Array<string | null | undefined | false> }) {
  return (
    <article className="info">
      <strong>{title}</strong>
      {lines.filter((line): line is string => Boolean(line)).map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
    </article>
  );
}

export function Media({ title, image, onClick }: { title: string; image: string; onClick: () => void }) {
  return (
    <button type="button" className="media" onClick={onClick}>
      <img src={image} alt="" loading="lazy" decoding="async" />
      <strong>{title}</strong>
    </button>
  );
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
