"use client";

import { useMemo, useState } from "react";
import { CareInviteBlock } from "@/components/CareInviteBlock";
import { CareRefreshBar } from "@/components/CareRefreshBar";
import { CareSeniorChart } from "@/components/CareSeniorChart";
import { CareSeniorDetail, CareSeniorRoster } from "@/components/CareSeniorRoster";
import { FamilyConnectionActions } from "@/components/FamilyConnectionActions";
import { FlowPage } from "@/components/FlowPage";
import { StatusBanner } from "@/components/StatusBanner";
import { BigButton, LineButton, Screen, Status } from "@/components/ui";
import { useCare } from "@/hooks/use-care";
import { INVITE_CODE_LENGTH, type FamilySeniorStatus } from "@/lib/domain/family";
import { filterActivityBySenior } from "@/lib/domain/senior-roster";

export default function CarePage() {
  const care = useCare();
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [rosterFilter, setRosterFilter] = useState<"all" | FamilySeniorStatus>("all");
  const [rosterQuery, setRosterQuery] = useState("");

  const selectedSenior = useMemo(
    () => care.seniors.find((item) => item.userId === selectedSeniorId) ?? null,
    [care.seniors, selectedSeniorId],
  );
  const visibleItems = useMemo(
    () => filterActivityBySenior(care.todayItems, selectedSeniorId),
    [care.todayItems, selectedSeniorId],
  );
  const attentionCount = care.seniors.filter((item) => item.status === "attention").length;

  if (!care.ready || (!care.user && care.familyLoading)) {
    return (
      <FlowPage title="대시보드" lead="연결된 어르신 활동을 한눈에 확인해요." busy>
        <Status>로그인 상태를 확인하고 있어요. 잠시만 기다려 주세요.</Status>
      </FlowPage>
    );
  }

  if (!care.user) {
    return (
      <FlowPage
        title="대시보드"
        lead="관리자 계정으로 로그인한 뒤 그룹을 만들고 초대 코드를 알려 주세요."
        bandActions={(
          <>
            <BigButton href="/login?next=/care" icon="users">로그인하기</BigButton>
            <LineButton href="/link">계정연결</LineButton>
          </>
        )}
      >
        <Status>요양원·복지관·가족 담당자가 여러 어르신을 목록으로 관리할 수 있어요.</Status>
      </FlowPage>
    );
  }

  if (care.familyLoading) {
    return (
      <FlowPage title="대시보드" lead="연결 정보를 불러오고 있어요." busy>
        <Status>잠시만 기다려 주세요.</Status>
      </FlowPage>
    );
  }

  if (care.needsFamily) {
    return (
      <FlowPage
        title="대시보드"
        lead={`관리 그룹을 만든 뒤 어르신께 ${INVITE_CODE_LENGTH}자리 초대 코드를 알려 주세요.`}
        bandActions={(
          <>
            <BigButton disabled={care.familyBusy} onClick={() => void care.createFamilyGroup()} icon="users">
              관리 그룹 만들기
            </BigButton>
            <LineButton href="/link">계정연결 화면</LineButton>
          </>
        )}
      >
        {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
      </FlowPage>
    );
  }

  if (care.role === "senior") {
    return (
      <Screen
        className="page-flow"
        title="계정 연결됨"
        lead="이 계정의 위험 검사·영상·뉴스 활동이 관리자 대시보드에 보여요."
        narrow
        primary={<BigButton href="/">홈으로</BigButton>}
      >
        <StatusBanner
          variant="connected"
          title="관리자와 연결되어 있어요"
          text="링크 검사, 영상 시청, 기사 열람이 담당자에게 전달됩니다."
        />
        <Status>대시보드 설정과 활동 확인은 관리자 계정에서 해 주세요.</Status>
        <LineButton href="/link">연결 상태 보기</LineButton>
        <FamilyConnectionActions
          role="senior"
          busy={care.familyBusy}
          onLeave={(confirm) => care.leaveConnection(confirm)}
        />
        {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
      </Screen>
    );
  }

  if (!care.connected) {
    return (
      <FlowPage
        title="대시보드"
        lead="아직 연결된 어르신이 없어요. 초대 코드를 알려 연결을 완료하세요."
      >
        <StatusBanner
          variant="waiting"
          title="연결 대기 중"
          text="연결되면 어르신별 위험·시청·기사 활동이 목록으로 나타납니다."
        />

        <CareInviteBlock
          inviteCode={care.inviteCode}
          busy={care.familyBusy}
          onCopy={() => void care.copyInvite()}
          onRefresh={() => void care.refreshInvite()}
        />

        <div className="group">
          <h2 className="group-title">연결 후 보이는 것</h2>
          <ul className="care-preview-list">
            <li>어르신별 오늘 위험·시청·기사 요약</li>
            <li>주의가 필요한 분 우선 정렬</li>
            <li>선택한 분의 활동만 따로 보기</li>
          </ul>
        </div>

        <FamilyConnectionActions
          role="guardian"
          busy={care.familyBusy}
          onLeave={(confirm) => care.leaveConnection(confirm)}
          onReset={(confirm) => care.resetConnection(confirm)}
        />

        {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
      </FlowPage>
    );
  }

  return (
    <FlowPage
      title="대시보드"
      lead={
        selectedSenior
          ? `${selectedSenior.displayName} 님의 오늘 활동을 확인해요.`
          : "어르신 박스를 눌러 상세 활동을 확인하세요."
      }
      bandActions={
        selectedSenior ? (
          <LineButton onClick={() => setSelectedSeniorId(null)}>목록으로</LineButton>
        ) : (
          <LineButton href="/link">계정연결 안내</LineButton>
        )
      }
      primary={
        selectedSenior ? undefined : <BigButton href="/link" icon="users">초대·연결 안내</BigButton>
      }
    >
      {selectedSenior ? (
        <CareSeniorDetail
          senior={selectedSenior}
          items={visibleItems}
          onBack={() => setSelectedSeniorId(null)}
          onRefresh={() => void care.refreshMe({ quiet: true })}
        />
      ) : (
        <>
          <StatusBanner
            variant="connected"
            title={`관리 중 · ${care.seniorCount}명`}
            text={
              attentionCount > 0
                ? `오늘 주의 ${attentionCount}명 · 위험 감지 ${care.dangerCount ?? 0}건`
                : `오늘 위험 감지 ${care.dangerCount ?? 0}건`
            }
          />

          <CareRefreshBar
            lastRefreshedAt={care.lastRefreshedAt}
            autoRefresh={care.autoRefresh}
            refreshing={care.refreshing}
            busy={care.familyBusy}
            onAutoRefreshChange={care.setAutoRefresh}
            onRefresh={() => void care.refreshMe({ quiet: true })}
          />

          <CareSeniorChart seniors={care.seniors} onOpen={setSelectedSeniorId} />

          <CareSeniorRoster
            seniors={care.seniors}
            filter={rosterFilter}
            query={rosterQuery}
            busy={care.familyBusy}
            onFilterChange={setRosterFilter}
            onQueryChange={setRosterQuery}
            onOpen={setSelectedSeniorId}
            onUpdate={(input) => care.updateSenior(input)}
            onRemove={(userId, confirm) => care.removeSenior(userId, confirm)}
          />

          <CareInviteBlock
            inviteCode={care.inviteCode}
            busy={care.familyBusy}
            onCopy={() => void care.copyInvite()}
            onRefresh={() => void care.refreshInvite()}
          />

          <p className="care-profile-hint">
            글자 크기·관심 영상은 어르신 계정 메뉴와 프로필에서 맞추면 피드에 바로 반영돼요.
          </p>

          {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}

          <FamilyConnectionActions
            role="guardian"
            busy={care.familyBusy}
            onLeave={(confirm) => care.leaveConnection(confirm)}
            onReset={(confirm) => care.resetConnection(confirm)}
          />
        </>
      )}
    </FlowPage>
  );
}
