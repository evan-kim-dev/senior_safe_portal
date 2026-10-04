"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/** 가로로 넘기는 카드 줄. 휴대폰은 손가락으로, 컴퓨터는 양옆 화살표로 넘긴다. */
export function Rail({
  label,
  kind,
  children,
}: {
  label: string;
  kind: "poster" | "media" | "info";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft <= 4;
    const end = max <= 4 || el.scrollLeft >= max - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth + 4) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    if (typeof ResizeObserver === "undefined") return () => el.removeEventListener("wheel", onWheel);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, [measure, children]);

  function move(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = Math.max(el.clientWidth * 0.8, 240);
    el.scrollBy({ left: direction * step, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className={`rail-wrap rail-wrap-${kind}`}>
      <button type="button" className="rail-btn rail-prev" aria-label={`${label} 이전`} disabled={edge.start} onClick={() => move(-1)}>
        <Icon name="prev" />
      </button>
      <div
        ref={ref}
        className={`rail rail-${kind}`}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
      >
        {children}
      </div>
      <button type="button" className="rail-btn rail-next" aria-label={`${label} 다음`} disabled={edge.end} onClick={() => move(1)}>
        <Icon name="next" />
      </button>
    </div>
  );
}
