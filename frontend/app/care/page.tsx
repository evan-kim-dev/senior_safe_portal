"use client";

import { useMemo, useState } from "react";
import { CareInviteBlock } from "@/components/CareInviteBlock";
import { CareSeniorDetail, CareSeniorRoster } from "@/components/CareSeniorRoster";
import { FamilyConnectionActions } from "@/components/FamilyConnectionActions";
import { FlowPage } from "@/components/FlowPage";
import { StatusBanner } from "@/components/StatusBanner";
import { BigButton, Count, Field, LineButton, Screen, Status } from "@/components/ui";
import { useCare } from "@/hooks/use-care";
import { formatWatchDuration } from "@/lib/domain/duration";
import { INVITE_CODE_LENGTH, type FamilySeniorStatus } from "@/lib/domain/family";
import { filterActivityBySenior } from "@/lib/domain/senior-roster";
import { MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from "@/lib/domain/setup";
import type { TextSize } from "@/lib/domain/types";

const SIZES: { id: TextSize; label: string }[] = [
  { id: "normal", label: "보통" },
  { id: "large", label: "크게" },
  { id: "xlarge", label: "더 크게" },
];

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
        selectedSenior ? undefined : <BigButton type="submit" form="care-form" icon="qr">설정 저장</BigButton>
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

          <div className="care-stats care-stats-overview">
            <Count value={care.dangerCount} label="오늘 위험 감지" />
            <p className="care-stat">
              <span className="care-stat-label">영상 시청</span>
              <span className="care-stat-value">{formatWatchDuration(care.watchSec)}</span>
            </p>
            <p className="care-stat">
              <span className="care-stat-label">기사 열람</span>
              <span className="care-stat-value">{care.newsCount}건</span>
            </p>
          </div>

          <CareSeniorRoster
            seniors={care.seniors}
            filter={rosterFilter}
            query={rosterQuery}
            onFilterChange={setRosterFilter}
            onQueryChange={setRosterQuery}
            onOpen={setSelectedSeniorId}
          />

          <CareInviteBlock
            inviteCode={care.inviteCode}
            busy={care.familyBusy}
            onCopy={() => void care.copyInvite()}
            onRefresh={() => void care.refreshInvite()}
          />

          <form
            id="care-form"
            onSubmit={(event) => {
              event.preventDefault();
              void care.save();
            }}
          >
            <h2 className="group-title">어르신 폰 설정 QR</h2>
            <Field
              id="care-name"
              label="받을 사람 이름"
              maxLength={MAX_NAME_LENGTH}
              value={care.name}
              onChange={(event) => care.setName(event.target.value)}
            />
            <Field
              id="care-phone"
              label="받을 전화번호"
              inputMode="tel"
              maxLength={MAX_PHONE_LENGTH}
              value={care.phone}
              onChange={(event) => care.setPhone(event.target.value)}
            />
            <fieldset>
              <legend>글자 크기</legend>
              {SIZES.map((item) => (
                <label key={item.id}>
                  <input
                    type="radio"
                    name="text-size"
                    checked={care.textSize === item.id}
                    onChange={() => care.setTextSize(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>영상 채널</legend>
              {care.choices.length === 0 ? <p>저장된 영상이 없어 채널을 고를 수 없습니다.</p> : null}
              {care.choices.map((channel) => (
                <label key={channel}>
                  <input
                    type="checkbox"
                    checked={care.channels.includes(channel)}
                    onChange={() => care.toggleChannel(channel)}
                  />
                  {channel}
                </label>
              ))}
            </fieldset>
          </form>

          {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
          {care.saved ? <Status>저장했어요</Status> : null}
          {care.qr ? <img className="qr" src={care.qr} alt="어르신 폰에 넣을 설정" /> : null}

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
