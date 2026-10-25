import { INITIATIVE_LABEL, INITIATIVE_NOTE, type InitiativeLevel } from "../../types";
import { useRelationStore } from "../../stores/relationStore";

const LEVELS: InitiativeLevel[] = [0, 1, 2, 3];

export function InitiativeSlider() {
  const initiative = useRelationStore((s) => s.initiative);
  const setInitiative = useRelationStore((s) => s.setInitiative);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-[15px] text-paper/85">它可以先开口吗</p>
        <p className="text-[11px] tracking-[0.16em] text-muted/80">
          {INITIATIVE_LABEL[initiative]}
        </p>
      </div>

      {/* 四道刻度：长度递增表示"允许的程度"，选中的那道亮起来。 */}
      <div className="mt-5 space-y-3" role="radiogroup" aria-label="主动性档位">
        {LEVELS.map((level) => {
          const active = level === initiative;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setInitiative(level)}
              className="group flex w-full items-center gap-4 text-left"
            >
              <span className="flex flex-1 justify-start">
                <span
                  className="tick block rounded-full"
                  style={{
                    width: `${30 + level * 20}%`,
                    height: active ? 2 : 1,
                    backgroundColor: active
                      ? "rgb(var(--ambient) / 0.9)"
                      : "rgba(231,227,217,0.12)",
                  }}
                />
              </span>
              <span
                className={`w-10 shrink-0 text-[11px] tracking-[0.1em] transition-colors ${
                  active
                    ? "text-paper/85"
                    : "text-faint/70 group-hover:text-muted"
                }`}
              >
                {INITIATIVE_LABEL[level]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[12.5px] leading-[1.95] text-muted/75">
        {INITIATIVE_NOTE[initiative]}
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.9] text-faint/70">
        档位只决定"允不允许"。真正开口还要等它自己攒够理由，不是定时推送。
      </p>
    </div>
  );
}
