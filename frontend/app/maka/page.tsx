import type { Metadata } from "next";
import Link from "next/link";
import { MakaMeetButton } from "@/components/MakaMeetButton";

export const metadata: Metadata = {
  title: "마스코트 마카",
  description:
    "강원도 청정 정을 나누는 반달곰, 디지털 보안관 마카를 소개합니다. '모두'를 뜻하는 강원 방언에서 온 이름이에요.",
};

const VISUALS = [
  {
    title: "강원도의 상징, 반달가슴곰",
    text: "설악산과 태백산맥을 누비는 강원 대표 동물이에요. 가슴의 하얀 반달무늬는 청정 강원도의 맑은 밤하늘을 닮았어요.",
  },
  {
    title: "무지갯빛 전통 조각보 보따리",
    text: "등 뒤 알록달록한 보따리는 선물 가득한 복주머니예요. 한국 전통 조각보 색으로 다채롭고 정답게 보여요.",
  },
  {
    title: "보따리 속 강원 명물",
    text: "틈새로 살짝 보이는 감자와 옥수수는 강원도의 풍성한 먹거리를 위트 있게 보여 주는 포인트예요.",
  },
  {
    title: "따뜻한 미소, 몽글한 3D 질감",
    text: "싱글벙글한 표정은 강원 사람들의 정을 담았어요. 부드러운 털 질감의 애니메이션 스타일로 굿즈·홍보에도 잘 어울려요.",
  },
] as const;

export default function MakaPage() {
  return (
    <main className="page maka-page">
      <section className="maka-hero" aria-labelledby="maka-title">
        <div className="wrap maka-hero-inner">
          <div className="maka-hero-copy">
            <p className="maka-kicker">디지털 보안관 마스코트</p>
            <h1 id="maka-title">마카</h1>
            <p className="maka-subtitle">강원도 청정 정을 나누는 반달곰</p>
            <p className="maka-tagline">
              &ldquo;강원도의 맛과 정을 마카(모두) 담아 전해드려요!&rdquo;
            </p>
            <div className="maka-hero-actions">
              <MakaMeetButton />
              <Link href="/" className="btn btn-line">
                홈으로
              </Link>
            </div>
          </div>
          <div className="maka-hero-figure">
            <img
              src="/mascot.png"
              alt="보자기 보따리를 메고 웃는 반달곰 마카"
              width={512}
              height={512}
              className="maka-hero-img"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <div className="wrap maka-body">
        <section className="maka-section" aria-labelledby="maka-name">
          <h2 id="maka-name">이름의 유래와 콘셉트</h2>
          <dl className="maka-facts">
            <div>
              <dt>이름</dt>
              <dd>
                마카 <span lang="en">(Maka)</span>
              </dd>
            </div>
            <div>
              <dt>의미</dt>
              <dd>&lsquo;모두&rsquo;, &lsquo;전부&rsquo;, &lsquo;다&rsquo;를 뜻하는 강원도 방언에서 따왔어요.</dd>
            </div>
            <div>
              <dt>핵심 가치</dt>
              <dd>
                강원 청정 자연에서 자란 명물과 따뜻한 인심을{" "}
                <strong>하나도 빠짐없이 모두(마카) 나누어 준다</strong>는 넉넉한 정을
                상징해요.
              </dd>
            </div>
          </dl>
        </section>

        <section className="maka-section" aria-labelledby="maka-visual">
          <h2 id="maka-visual">비주얼 스토리텔링</h2>
          <p className="maka-section-lead">
            보이는 하나하나에 강원도의 자연·먹거리·정을 담았어요.
          </p>
          <ol className="maka-visual-list">
            {VISUALS.map((item, index) => (
              <li key={item.title}>
                <span className="maka-visual-num" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="maka-section maka-story" aria-labelledby="maka-character">
          <h2 id="maka-character">마카의 성격과 스토리</h2>
          <div className="maka-story-grid">
            <div>
              <h3>성격</h3>
              <p>
                엄청난 대식가이자 욕심쟁이처럼 보이지만, 사실은 모은 맛있는 농산물을
                남에게 나눠 줄 때 가장 행복한 <strong>정 많은 이타주의자</strong>예요.
              </p>
            </div>
            <div>
              <h3>특기</h3>
              <p>
                강원도 구석구석을 누비며 제일 맛있는 감자와 옥수수 찾아내기, 보는
                사람까지 기분 좋게 만드는 활짝 웃기.
              </p>
            </div>
          </div>
          <blockquote className="maka-speech">
            <p>마카 다 가져가드래요~!</p>
            <footer>마카의 말버릇</footer>
          </blockquote>
        </section>

        <section className="maka-section maka-closing" aria-labelledby="maka-role">
          <h2 id="maka-role">시니어 안심에서의 역할</h2>
          <p>
            마카는 이 서비스의 디지털 보안관이에요. 의심스러운 문자·링크·전화가
            걱정될 때, 화면 오른쪽 아래 버튼을 눌러 편하게 물어보세요. 강원도의
            정처럼, 필요한 안내를 <strong>마카(모두)</strong> 친절히 나눠 드려요.
          </p>
          <div className="maka-hero-actions">
            <MakaMeetButton />
            <Link href="/" className="btn btn-line">
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
