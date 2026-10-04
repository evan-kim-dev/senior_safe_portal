"use client";

import { BigButton, Count, Field, Screen, Status } from "@/components/ui";
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

  return (
    <Screen title="자녀 대시보드" primary={<BigButton type="submit" form="care-form">저장</BigButton>}>
      <Count value={care.dangerCount} />
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
      {care.saved ? <Status>저장했어요</Status> : null}
      {care.qr ? <img className="qr" src={care.qr} alt="어르신 폰에 넣을 설정" /> : null}
    </Screen>
  );
}
