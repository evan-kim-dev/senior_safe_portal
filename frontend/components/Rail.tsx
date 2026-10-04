"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/** 가로로 넘기는 카드 줄. 휴대폰은 손가락으로, 컴퓨터는 양옆 화살표로 넘긴다. */
export function Rail({ label, kind, children }: { label: string; kind: "poster" | "media"; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, children]);

  function move(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="rail-wrap">
      <button type="button" className="rail-btn rail-prev" aria-label={`${label} 이전`} disabled={edge.start} onClick={() => move(-1)}>
        <Icon name="prev" />
      </button>
      <div ref={ref} className={`rail rail-${kind}`} role="region" aria-label={label} tabIndex={0} onScroll={measure}>
        {children}
      </div>
      <button type="button" className="rail-btn rail-next" aria-label={`${label} 다음`} disabled={edge.end} onClick={() => move(1)}>
        <Icon name="next" />
      </button>
    </div>
  );
}
