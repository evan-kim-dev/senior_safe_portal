"use client";

import { useEffect } from "react";
import { BigButton, Screen, Status } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("screen_error", error.digest ?? error.message);
  }, [error]);

  return (
    <Screen center title="문제가 생겼어요" primary={<BigButton onClick={() => retry()}>다시 열기</BigButton>}>
      <Status>잠시 후 다시 눌러 주세요.</Status>
    </Screen>
  );
}
