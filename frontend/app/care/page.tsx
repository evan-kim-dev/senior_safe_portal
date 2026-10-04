"use client";

import Link from "next/link";
import { FamilyBand } from "@/components/FamilyBand";
import { BigButton, Count, Field, LineButton, Screen, Status } from "@/components/ui";
import { useCare } from "@/hooks/use-care";
import { MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from "@/lib/domain/setup";
import type { TextSize } from "@/lib/domain/types";

const SIZES: { id: TextSize; label: string }[] = [
  { id: "normal", label: "보통" },
  { id: "large", label: "크게" },
  { id: "xlarge", label: "더 크게" },
];

export default function CarePage() {
  const care = useCare();

  if (!care.user) {
    return (
      <main className="care">
        <FamilyBand
          actions={(
            <>
              <BigButton href="/login?next=/care" icon="users">로그인하기</BigButton>
              <LineButton href="/link">부모 계정 연결</LineButton>
            </>
          )}
        />
        <div className="wrap care-follow">
          <Status>자녀 계정으로 로그인한 뒤 가족을 만들고, 부모님께 초대 코드를 알려 주세요.</Status>
        </div>
      </main>
    );
  }

  if (care.familyLoading) {
    return (
      <main className="care">
        <FamilyBand />
        <div className="wrap care-follow">
          <Status>가족 정보를 불러오고 있어요. 잠시만 기다려 주세요.</Status>
        </div>
      </main>
    );
  }

  if (care.needsFamily) {
    return (
      <main className="care">
        <FamilyBand
          actions={(
            <>
              <BigButton disabled={care.familyBusy} onClick={() => void care.createFamilyGroup()} icon="users">
                가족 만들기
              </BigButton>
              <LineButton href="/link">부모님이 코드 입력하는 화면</LineButton>
            </>
          )}
        />
        <div className="wrap care-follow">
          <Status>자녀 계정으로 가족을 만든 뒤, 부모님께 6자리 초대 코드를 알려 주세요.</Status>
          {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
        </div>
      </main>
    );
  }

  return (
    <>
      <FamilyBand
        actions={care.role === "guardian" ? <LineButton href="/link">부모 계정 연결 안내</LineButton> : undefined}
      />
      <Screen
        title="자녀 대시보드"
        lead="부모 계정 활동을 보고, 설정 QR로 부모님 폰 글자·채널도 맞출 수 있어요."
        narrow
        primary={care.role === "guardian" ? <BigButton type="submit" form="care-form" icon="qr">설정 저장</BigButton> : undefined}
      >
        <Count value={care.dangerCount} />

        {care.role === "guardian" && care.inviteCode ? (
          <div className="group">
            <h2 className="group-title">부모 초대 코드</h2>
            <p className="invite-code" aria-label="초대 코드">{care.inviteCode}</p>
            <LineButton onClick={() => void care.copyInvite()}>코드 복사</LineButton>
            <Status>부모님이 <Link href="/link">부모 연결</Link>에서 로그인한 뒤 이 코드를 넣으면 연결돼요.</Status>
          </div>
        ) : null}

        {care.role === "senior" ? (
          <Status>이 계정은 부모(어르신)로 연결되어 있어요. 자녀 대시보드 설정은 자녀 계정에서 해 주세요.</Status>
        ) : null}

        {care.todayItems.length ? (
          <div className="group">
            <h2 className="group-title">오늘 위험 영상</h2>
            <ul className="list">
              {care.todayItems.map((item) => (
                <li key={item.id} className="row">
                  <span className="row-text">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Status>오늘 기록된 위험한 영상은 아직 없어요.</Status>
        )}

        {care.role === "guardian" ? (
          <form
            id="care-form"
            onSubmit={(event) => {
              event.preventDefault();
              void care.save();
            }}
          >
            <Field id="care-name" label="받을 사람 이름" maxLength={MAX_NAME_LENGTH} value={care.name} onChange={(event) => care.setName(event.target.value)} />
            <Field id="care-phone" label="받을 전화번호" inputMode="tel" maxLength={MAX_PHONE_LENGTH} value={care.phone} onChange={(event) => care.setPhone(event.target.value)} />
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
                  <input type="checkbox" checked={care.channels.includes(channel)} onChange={() => care.toggleChannel(channel)} />
                  {channel}
                </label>
              ))}
            </fieldset>
          </form>
        ) : null}

        {care.familyMessage ? <Status>{care.familyMessage}</Status> : null}
        {care.saved ? <Status>저장했어요</Status> : null}
        {care.qr ? <img className="qr" src={care.qr} alt="어르신 폰에 넣을 설정" /> : null}
      </Screen>
    </>
  );
}
