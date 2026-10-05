"use client";

import { FamilyConnectionActions } from "@/components/FamilyConnectionActions";
import { FlowPage } from "@/components/FlowPage";
import { StatusBanner } from "@/components/StatusBanner";
import { BigButton, Field, LineButton, Screen, Status } from "@/components/ui";
import { useFamilyLink } from "@/hooks/use-family-link";
import { INVITE_CODE_LENGTH, isInviteCode, normalizeInviteCode } from "@/lib/domain/family";

export default function LinkPage() {
  const link = useFamilyLink();

  if (!link.ready || (link.user && link.checking)) {
    return (
      <Screen className="page-flow" title="계정연결" lead="로그인 상태를 확인하고 있어요." narrow busy>
        <Status>잠시만 기다려 주세요.</Status>
      </Screen>
    );
  }

  if (!link.user) {
    return (
      <FlowPage
        showBand={false}
        title="계정연결"
        lead="자녀가 알려 준 초대 코드를 넣으려면 먼저 로그인해 주세요."
        primary={<BigButton href="/login?next=/link">로그인하기</BigButton>}
      >
        <StatusBanner
          variant="waiting"
          title="연결 전"
          text={`부모(어르신) 계정으로 로그인한 뒤 ${INVITE_CODE_LENGTH}자리 코드를 입력하세요.`}
        />
        <LineButton href="/care">대시보드로</LineButton>
      </FlowPage>
    );
  }

  if (link.linkedFamilyId) {
    return (
      <FlowPage
        showBand={false}
        title="계정연결"
        lead="가족과 연결되어 있어요."
        primary={
          link.linkedRole === "guardian"
            ? <BigButton href="/care">대시보드 보기</BigButton>
            : <BigButton href="/">홈으로</BigButton>
        }
      >
        <StatusBanner
          variant="connected"
          title="연결됨"
          text={
            link.linkedRole === "senior"
              ? "이 계정은 부모(어르신)로 연결되어 있어요. 위험 검사·영상·뉴스 활동이 자녀 대시보드에 보입니다."
              : "이 계정은 자녀(보호자)로 연결되어 있어요. 초대 코드와 활동은 대시보드에서 확인하세요."
          }
        />
        {link.message ? <Status>{link.message}</Status> : null}
        <LineButton href="/care">대시보드로</LineButton>
        <FamilyConnectionActions
          role={link.linkedRole}
          busy={link.busy}
          onLeave={(confirm) => link.disconnect(confirm)}
          onReset={link.linkedRole === "guardian" ? (confirm) => link.resetConnections(confirm) : undefined}
        />
      </FlowPage>
    );
  }

  return (
    <FlowPage
      showBand={false}
      title="계정연결"
      lead={`대시보드에 나온 ${INVITE_CODE_LENGTH}자리 초대 코드를 입력하세요.`}
      primary={
        <BigButton
          disabled={link.busy || !isInviteCode(normalizeInviteCode(link.code))}
          onClick={() => void link.submitJoin()}
        >
          연결하기
        </BigButton>
      }
    >
      <StatusBanner
        variant="waiting"
        title="연결 전"
        text="코드를 넣으면 자녀가 오늘 활동을 볼 수 있어요."
      />
      <Field
        id="invite-code"
        label="초대 코드"
        autoCapitalize="characters"
        maxLength={INVITE_CODE_LENGTH}
        value={link.code}
        onChange={(event) => link.setCode(normalizeInviteCode(event.target.value).slice(0, INVITE_CODE_LENGTH))}
      />
      {link.message ? <Status>{link.message}</Status> : null}
      <LineButton href="/care">대시보드로</LineButton>
    </FlowPage>
  );
}
