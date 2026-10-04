"use client";

import { Row, Section, Status } from "@/components/ui";
import type { Note, RecentCheck } from "@/lib/domain/types";
import { headlineFor } from "@/lib/domain/verdict";

export function HomeRecords({
  recent,
  notes,
  onOpenNote,
}: {
  recent: readonly RecentCheck[];
  notes: readonly Note[];
  onOpenNote: (note: Note) => void;
}) {
  return (
    <Section id="mine" title="내 검사 기록" desc="이 기기에서 검사한 주소와 적어 둔 말이에요." className="section-rank">
      <span className="watermark" aria-hidden="true">안심 기록</span>
      <div className="mine-grid">
        <section className="mine-col" aria-labelledby="recent-title">
          <h3 id="recent-title">최근 검사</h3>
          {recent.length === 0 ? (
            <Status>아직 검사한 주소가 없습니다.</Status>
          ) : (
            <ol className="rank">
              {recent.map((item, index) => (
                <li key={item.url} className="rank-item">
                  <span className="rank-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`badge badge-${item.verdict}`}>{headlineFor(item.verdict)}</span>
                  <span className="rank-title">{item.title}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="mine-col" aria-labelledby="notes-title">
          <h3 id="notes-title">적어 둔 것</h3>
          {notes.length === 0 ? (
            <Status>주소가 아닌 말은 여기에 남습니다.</Status>
          ) : (
            <div className="list">
              {notes.map((note) => (
                <Row key={note.id} onClick={() => onOpenNote(note)}>{note.text}</Row>
              ))}
            </div>
          )}
        </section>
      </div>
    </Section>
  );
}
