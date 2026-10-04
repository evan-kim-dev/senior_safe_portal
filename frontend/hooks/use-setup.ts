"use client";

import { useEffect, useRef, useState } from "react";
import { applySetup } from "@/lib/client/guardian";
import { parseSetupHash, type SetupPayload } from "@/lib/domain/setup";

export type SetupState =
  | { name: "reading" }
  | { name: "invalid" }
  | { name: "confirm"; payload: SetupPayload }
  | { name: "done" };

/**
 * QR 로 받은 설정은 어르신이 확인을 누른 뒤에만 넣는다.
 * 남이 보낸 /setup 링크 하나로 보호자 번호가 몰래 바뀌는 일을 막는다.
 */
export function useSetup() {
  const [state, setState] = useState<SetupState>({ name: "reading" });
  const readRef = useRef(false);

  useEffect(() => {
    if (readRef.current) return;
    readRef.current = true;
    const payload = parseSetupHash(window.location.hash);
    window.history.replaceState(null, "", "/setup");
    setState(payload ? { name: "confirm", payload } : { name: "invalid" });
  }, []);

  function confirm() {
    if (state.name !== "confirm") return;
    applySetup(state.payload);
    setState({ name: "done" });
  }

  return { state, confirm };
}
