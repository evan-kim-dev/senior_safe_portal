"use client";

import { useEffect, useRef, type RefObject } from "react";

/** 화면이 닫힌 뒤 도착한 응답으로 상태를 바꾸지 않게 한다. */
export function useAliveRef(): RefObject<boolean> {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive;
}
