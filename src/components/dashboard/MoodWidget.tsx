import { Zap } from "lucide-react";
import type { Day, Mutation } from "../../types";
import { apiOperations } from "../../api-operations";

export function MoodWidget({
  day,
  date,
  mutate,
  busy,
}: {
  day: Day;
  date: string;
  mutate: Mutation;
  busy: boolean;
}) {
  return (
    <section className="panel mood-widget">
      <div className="section-heading small">
        <h3>Como está sua energia?</h3>
        <Zap size={16} />
      </div>
      <p>Uma pausa para perceber como você está.</p>
      <div className="mood-buttons">
        {[
          { v: 1, face: "😴", name: "Muito baixa" },
          { v: 2, face: "😕", name: "Baixa" },
          { v: 3, face: "😌", name: "Regular" },
          { v: 4, face: "🙂", name: "Boa" },
          { v: 5, face: "⚡", name: "Muito boa" },
        ].map((m) => (
          <button
            key={m.v}
            aria-label={`Energia ${m.name.toLowerCase()}`}
            aria-pressed={day.energy === m.v}
            title={m.name}
            disabled={busy}
            data-pending-disabled={busy || undefined}
            className={day.energy === m.v ? "selected" : ""}
            onClick={() =>
              mutate(
                apiOperations.day.update(date),
                { energy: day.energy === m.v ? null : m.v },
                "PATCH",
              )
            }
          >
            <span>{m.face}</span>
            <i>{m.v}</i>
          </button>
        ))}
      </div>
    </section>
  );
}

