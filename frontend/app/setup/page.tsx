"use client";

import { useRouter } from "next/navigation";
import { BigButton, Info, LineButton, Screen } from "@/components/ui";
import { useSetup } from "@/hooks/use-setup";
import { textSizeLabel } from "@/lib/domain/setup";

export default function SetupPage() {
  const router = useRouter();
  const { state, confirm } = useSetup();

  if (state.name === "reading") return <Screen />;

  if (state.name === "confirm") {
    const { payload } = state;
    return (
      <Screen
        title="이 설정을 넣을까요?"
        lead="가족이 보낸 설정이 맞는지 확인해 주세요."
        narrow
        secondary={<LineButton onClick={() => router.replace("/")}>홈으로</LineButton>}
        primary={<BigButton onClick={confirm}>넣기</BigButton>}
      >
        <Info
          title="보호자 설정"
          lines={[
            payload.name ? `받을 사람 ${payload.name}` : null,
            payload.phone ? `받을 전화번호 ${payload.phone}` : null,
            `글자 크기 ${textSizeLabel(payload.textSize)}`,
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen
      center
      title={state.name === "done" ? "이 폰에 넣었습니다" : "설정을 읽지 못했습니다"}
      primary={<BigButton href="/">홈으로</BigButton>}
    />
  );
}
