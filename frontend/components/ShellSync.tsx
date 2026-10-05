"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isFlowRoute, isStandaloneRoute } from "@/lib/domain/shell";

const WEB_MQ = "(min-width: 1024px)";

/** body data-shell / data-standalone — CSS에서 웹·앱·단독 레이아웃을 나눈다. */
export function ShellSync() {
  const pathname = usePathname();

  useEffect(() => {
    const standalone = isStandaloneRoute(pathname);
    document.body.dataset.standalone = standalone ? "1" : "";
    document.body.dataset.flow = !standalone && isFlowRoute(pathname) ? "1" : "";

    const mq = window.matchMedia(WEB_MQ);
    const applyShell = () => {
      document.body.dataset.shell = mq.matches ? "web" : "app";
    };
    applyShell();
    mq.addEventListener("change", applyShell);
    return () => mq.removeEventListener("change", applyShell);
  }, [pathname]);

  return null;
}
