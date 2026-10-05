"use client";

import Link from "next/link";
import { LineButton, Status } from "@/components/ui";
import { INVITE_CODE_LENGTH } from "@/lib/domain/family";

type Props = {
  inviteCode: string;
  busy: boolean;
  onCopy: () => void;
  onRefresh: () => void;
};

export function CareInviteBlock({ inviteCode, busy, onCopy, onRefresh }: Props) {
  return (
    <div className="group">
      <h2 className="group-title">초대 코드</h2>
      {inviteCode ? (
        <>
          <p className="invite-code" aria-label="초대 코드">{inviteCode}</p>
          <LineButton onClick={onCopy}>코드 복사</LineButton>
          <Status>
            부모님이 <Link href="/link">계정연결</Link>에서 이 {INVITE_CODE_LENGTH}자리 코드를 넣으면 연결돼요.
            유효 시간은 24시간입니다.
          </Status>
        </>
      ) : (
        <Status>초대 코드가 없거나 만료됐어요. 새 코드를 받아 주세요.</Status>
      )}
      <LineButton disabled={busy} onClick={onRefresh}>
        새 초대 코드 받기
      </LineButton>
    </div>
  );
}
