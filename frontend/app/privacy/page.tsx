import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "시니어 디지털 보안관 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="개인정보 처리방침"
      lead="「개인정보 보호법」 등 관련 법령에 따라 이용자 개인정보를 보호하고, 관련 고충을 신속히 처리하기 위해 다음과 같이 개인정보 처리방침을 공개합니다."
      effective="2026년 6월 21일"
    >
      <h2>제1조 (개인정보의 처리 목적)</h2>
      <p>서비스는 다음 목적 외로 개인정보를 이용하지 않으며, 목적이 변경되면 「개인정보 보호법」 제18조에 따라 별도 동의를 받습니다.</p>
      <ul>
        <li>회원 식별·로그인(카카오·네이버·구글 OAuth), 부정 이용 방지</li>
        <li>링크·영상 검사, 뉴스·복지 안내, AI 상담, 게시판 운영</li>
        <li>가족 계정 연동(초대 코드) 및 위험 영상 활동 알림(시각만 기록)</li>
        <li>오류 대응·보안·서비스 개선(비식별·집계 형태)</li>
      </ul>

      <h2>제2조 (처리하는 개인정보 항목)</h2>
      <ul>
        <li><strong>회원(로그인):</strong> OAuth 제공자가 전달하는 고유 식별값, 이메일·표시명(제공 범위에 따름), 인증 세션</li>
        <li><strong>게시판:</strong> 작성자 이름, 제목·내용, 작성 시각, 회원 식별값</li>
        <li><strong>가족 연동:</strong> 가족 그룹 소속·역할(자녀 guardian / 부모 senior), 8자리 초대 코드 발급·사용 기록</li>
        <li><strong>위험 영상 활동:</strong> 검사 시각(주소·제목 등 내용은 저장하지 않음)</li>
        <li><strong>링크·상담 입력:</strong> 검사 URL, 챗봇 대화 내용(서비스 제공 목적 범위에서 처리)</li>
        <li><strong>자동 수집:</strong> 접속 IP, 브라우저·OS, 접속 일시, 오류 로그, 기기 설정(글자 크기·채널 등 localStorage)</li>
      </ul>

      <h2>제3조 (보유 및 이용 기간)</h2>
      <ul>
        <li>회원 정보: 탈퇴 시까지(법령상 보존 의무가 있으면 해당 기간)</li>
        <li>게시글: 작성자 삭제 또는 운영 정책에 따른 삭제 시까지</li>
        <li>검색·상담·검사 입력값: 목적 달성 후 지체 없이 파기(서버 로그는 원칙적으로 최대 90일)</li>
        <li>기기 저장 데이터: 브라우저·앱 저장소 삭제 시</li>
      </ul>

      <h2>제4조 (제3자 제공)</h2>
      <p>원칙적으로 제3자에게 제공하지 않습니다. 다만 이용자 사전 동의, 또는 법령에 따른 수사·조사 요구가 있는 경우는 예외입니다.</p>

      <h2>제5조 (처리 위탁)</h2>
      <ul>
        <li>Supabase Inc. — 회원 인증, DB·서버 호스팅, 게시판·가족 연동 데이터 저장</li>
        <li>Google LLC — YouTube·Gemini API를 통한 영상·AI 분석·상담 처리</li>
        <li>카카오·네이버·구글 — OAuth 로그인 인증</li>
        <li>공공데이터포털 등 — 복지 정보 조회</li>
      </ul>
      <p>위탁 시 「개인정보 보호법」 제26조에 따른 안전조치·관리·감독을 합니다.</p>

      <h2>제6조 (파기)</h2>
      <p>보유 기간 경과·목적 달성 시 지체 없이 파기합니다. 전자 파일은 복구되지 않도록 삭제하고, 이용자는 본인 게시글을 직접 삭제할 수 있습니다.</p>

      <h2>제7조 (정보주체의 권리)</h2>
      <p>이용자는 열람·정정·삭제·처리 정지를 요청할 수 있습니다. 요청은 서비스 내 기능 또는 아래 문의 채널로 하시면 지체 없이 조치합니다. 만 14세 미만 아동의 개인정보는 법정대리인 동의 없이 수집하지 않습니다.</p>

      <h2>제8조 (안전성 확보 조치)</h2>
      <ul>
        <li>접근 권한 최소화, HTTPS, API 키 서버 측 보관</li>
        <li>입력값 검증 및 화면 출력 시 이스케이프 처리</li>
        <li>클라우드 수탁사의 물리적·기술적 보호조치</li>
      </ul>

      <h2>제9조 (쿠키·저장소)</h2>
      <p>로그인 유지 등을 위해 쿠키·localStorage 등을 사용할 수 있습니다. 브라우저에서 저장을 거부할 수 있으나 로그인 등 일부 기능이 제한될 수 있습니다.</p>

      <h2>제10조 (개인정보 보호책임자)</h2>
      <ul>
        <li>운영 주체: 시니어 디지털 보안관 운영팀</li>
        <li>문의: <a href="https://github.com/rlarlgns-evan/senior_safe_portal/issues" target="_blank" rel="noopener noreferrer">GitHub 이슈</a></li>
      </ul>

      <h2>제11조 (권익침해 구제)</h2>
      <ul>
        <li>개인정보침해신고센터 118 · <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer">privacy.kisa.or.kr</a></li>
        <li>개인정보분쟁조정위원회 1833-6972 · <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer">www.kopico.go.kr</a></li>
        <li>대검찰청 사이버수사과 1301 · <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer">www.spo.go.kr</a></li>
        <li>경찰청 사이버수사국 182 · <a href="https://ecrm.police.go.kr" target="_blank" rel="noopener noreferrer">ecrm.police.go.kr</a></li>
      </ul>

      <h2>제12조 (방침 변경)</h2>
      <p>내용 변경 시 시행 7일 전부터 공지합니다. 이용자 권리에 중대한 변경은 최소 30일 전에 공지합니다.</p>
    </LegalDoc>
  );
}
