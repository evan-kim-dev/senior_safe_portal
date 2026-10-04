import { BigButton, Screen, Status } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen center title="없는 화면이에요" primary={<BigButton href="/">홈으로</BigButton>}>
      <Status>주소를 다시 확인해 주세요.</Status>
    </Screen>
  );
}
