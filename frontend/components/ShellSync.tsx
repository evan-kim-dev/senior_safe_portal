"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyViewMode, WEB_MQ } from "@/lib/client/view-mode";
import { isFlowRoute, isStandaloneRoute } from "@/lib/domain/shell";

/** body data-shell / data-standalone — CSS에서 웹·앱·단독 레이아웃을 나눈다. */
export function ShellSync() {
  const pathname = usePathname();

  useEffect(() => {
    const standalone = isStandaloneRoute(pathname);
    document.body.dataset.standalone = standalone ? "1" : "";
    document.body.dataset.flow = !standalone && isFlowRoute(pathname) ? "1" : "";

    applyViewMode();
    const mq = window.matchMedia(WEB_MQ);
    const onChange = () => applyViewMode();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pathname]);

  return null;
}
