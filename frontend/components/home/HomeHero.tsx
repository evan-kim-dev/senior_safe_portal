"use client";

import { Icon } from "@/components/icons";
import { BigButton, LineButton } from "@/components/ui";
import { MAX_URL_LENGTH } from "@/lib/domain/url";

export function HomeHero({
  url,
  message,
  onUrl,
  onSubmit,
  onPaste,
}: {
  url: string;
  message: string;
  onUrl: (value: string) => void;
  onSubmit: () => void;
  onPaste: () => void;
}) {
  return (
    <section className="hero" aria-labelledby="check-title">
      <div className="wrap">
        <div className="hero-main" id="check">
          <span className="eyebrow"><Icon name="sparkle" />AI 링크 검사</span>
          <h1 id="check-title">이 링크, 괜찮나요?</h1>
          <form
            className="check-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="sr-only" htmlFor="url">주소</label>
            <span className="check-input">
              <Icon name="link" />
              <input
                id="url"
                value={url}
                placeholder="주소를 붙여 넣으세요"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                enterKeyHint="go"
                maxLength={MAX_URL_LENGTH}
                onChange={(event) => onUrl(event.target.value)}
              />
            </span>
            <div className="check-buttons">
              <LineButton icon="clipboard" onClick={onPaste}>붙여넣기</LineButton>
              <BigButton type="submit" icon="search">검사하기</BigButton>
            </div>
          </form>
          <p className="hero-status" role="status">{message}</p>
          <p className="hero-lead">문자·카톡으로 받은 주소를 붙여 넣으면 누르기 전에 위험한지 바로 알려 드려요.</p>
          <span className="hero-art" aria-hidden="true"><Icon name="shield" /></span>
        </div>
      </div>
    </section>
  );
}
