/** 초·분 단위 시청 시간을 화면용 한국어로 표시한다. */
export function formatWatchDuration(sec: number): string {
  if (sec <= 0) return "0분";
  if (sec < 60) return `${sec}초`;
  const minutes = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest ? `${minutes}분 ${rest}초` : `${minutes}분`;
}
