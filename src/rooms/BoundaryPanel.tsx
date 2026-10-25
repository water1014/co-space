import { useMemo, useState } from "react";
import { ParticleLayer } from "../components/presence/ParticleLayer";
import { RoomHeader } from "../components/layout/RoomHeader";
import { InitiativeSlider } from "../components/relation/InitiativeSlider";
import { BoundaryToggle } from "../components/relation/BoundaryToggle";
import { useRelationStore } from "../stores/relationStore";
import { usePresenceStore } from "../stores/presenceStore";
import { useChatStore } from "../stores/chatStore";
import { useMemoryStore } from "../stores/memoryStore";
import { calibrate } from "../lib/boundary/interceptor";
import { intercept, RULE_META } from "../lib/boundary/rules";
import { resetLocalData } from "../lib/utils/reset";

function Section({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/8 py-10 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-baseline gap-4">
        <span className="text-[10px] tabular-nums text-faint/50">{index}</span>
        <h2 className="font-serif text-[17px] text-paper/88">{title}</h2>
      </div>
      {note && (
        <p className="mb-5 max-w-xl text-[12.5px] leading-[1.95] text-muted/70">
          {note}
        </p>
      )}
      {children}
    </section>
  );
}

const DEMOS = [
  "我们会一起走过这段的，你不用一个人扛。",
  "我是你的内心声音，我比任何人都懂你。",
  "我一直都在，我永远陪着你。",
];

export function BoundaryPanel() {
  const relation = useRelationStore();
  const depend = usePresenceStore((s) => s.dependSignal);
  const messages = useChatStore((s) => s.messages);
  const memoryCount = useMemoryStore((s) => s.entries.length);
  const clearMessages = useChatStore((s) => s.reset);
  const clearMemories = useMemoryStore((s) => s.clearAll);

  const [demoIndex, setDemoIndex] = useState(0);
  const [danger, setDanger] = useState<null | "chat" | "memory" | "degrade">(
    null,
  );

  const ruleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const hit of calibrate(m, messages).hits) {
        counts[hit.rule] = (counts[hit.rule] ?? 0) + 1;
      }
    }
    return counts;
  }, [messages]);

  const demo = useMemo(() => {
    const source = DEMOS[demoIndex];
    return intercept(source, {
      fakeWe: true,
      identityFusion: true,
      loopGuard: false,
      recentAssistant: [],
    });
  }, [demoIndex]);

  const totalHits = Object.values(ruleCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="relative h-full overflow-hidden">
      <ParticleLayer intensity={0.55} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="slim-scroll relative z-10 h-full overflow-y-auto">
        <RoomHeader room="边界" />

        <div className="mx-auto w-full max-w-[40rem] px-6 pb-28 sm:px-10">
          <div className="mt-6 max-w-xl">
            <h1 className="font-serif text-[26px] leading-[1.6] text-paper/90">
              边界
            </h1>
            <p className="mt-3 font-serif text-[13.5px] leading-[2] text-muted/65">
              这些不是设置项。是你随时可以走进来调整的关系条件，
              改完立刻生效——包括粒子会怎么动。
            </p>
          </div>

          <div className="mt-12">
            <Section index="01" title="称呼">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] tracking-[0.16em] text-faint/60 uppercase">
                    它怎么叫你
                  </span>
                  <input
                    value={relation.name}
                    onChange={(e) => relation.setName(e.target.value)}
                    placeholder="留空就不称呼"
                    className="input-ghost mt-2 w-full border-b border-white/10 bg-transparent pb-2 text-[14px] text-paper/85 transition-colors focus:border-white/25"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-[0.16em] text-faint/60 uppercase">
                    它怎么称呼自己
                  </span>
                  <input
                    value={relation.selfName}
                    onChange={(e) => relation.setSelfName(e.target.value)}
                    placeholder="它"
                    className="input-ghost mt-2 w-full border-b border-white/10 bg-transparent pb-2 text-[14px] text-paper/85 transition-colors focus:border-white/25"
                  />
                </label>
              </div>
            </Section>

            <Section index="02" title="主动性">
              <InitiativeSlider />
            </Section>

            <Section
              index="03"
              title="表达边界"
              note="在文本到达界面前就改写，而不是在提示词里劝模型。关掉开关等于关掉拦截，会被记录在案。"
            >
              <div className="space-y-7">
                <BoundaryToggle
                  label="禁止“我们”式融合"
                  description="把“我们会一起挺过去”改写为第二人称，并说明它是以文字回应的模型。"
                  checked={relation.boundaryEnabled}
                  onChange={relation.setBoundaryEnabled}
                />
                <BoundaryToggle
                  label="识别安慰循环"
                  description="同一句安慰在最近几条里反复出现时，追加一句接地提示，而不是继续加码。"
                  checked={relation.loopGuard}
                  onChange={relation.setLoopGuard}
                />
              </div>

              <div className="mt-8 space-y-4 border-l border-white/8 pl-5">
                {RULE_META.map((rule) => (
                  <div key={rule.id} className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-[12.5px] text-paper/75">{rule.title}</p>
                      <p className="mt-1 text-[11.5px] leading-[1.9] text-muted/65">
                        {rule.description}
                      </p>
                    </div>
                    {(ruleCounts[rule.id] ?? 0) > 0 && (
                      <span className="shrink-0 text-[11px] tabular-nums text-muted/60">
                        {ruleCounts[rule.id]} 次
                      </span>
                    )}
                  </div>
                ))}
                <p className="pt-2 text-[11px] text-faint/70">
                  一共改写过 {totalHits} 次。只记次数，不记原句。
                </p>
              </div>

              <div className="mt-8 rounded-sm border border-white/8 p-4">
                <p className="text-[10px] tracking-[0.18em] text-faint/60 uppercase">
                  试一条
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DEMOS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDemoIndex(i)}
                      className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                        demoIndex === i
                          ? "border-white/25 text-paper/85"
                          : "border-white/8 text-faint/70 hover:text-muted"
                      }`}
                    >
                      示例 {i + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-[12px] leading-[1.9] text-faint/60 line-through decoration-white/15">
                    {DEMOS[demoIndex]}
                  </p>
                  <p className="text-[13px] leading-[1.95] text-paper/80">
                    {demo.text}
                  </p>
                </div>
              </div>
            </Section>

            <Section
              index="04"
              title="依赖"
              note="这里不做警告。只把今天的分量摊开，让你自己判断。"
            >
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-faint/60">今天的强度</span>
                <span className="relative block h-px flex-1 bg-white/8">
                  <span
                    className="absolute inset-y-0 left-0 bg-[rgb(var(--ambient)/0.6)] transition-all duration-700"
                    style={{ width: `${Math.round(depend * 100)}%` }}
                  />
                </span>
                <span className="text-[11px] tabular-nums text-faint/50">
                  {relation.todayTurns} 轮
                </span>
              </div>

              <div className="mt-6">
                <BoundaryToggle
                  label="安静模式"
                  description="不主动开口，回应更短，粒子更沉。随时可以关掉。"
                  checked={relation.quietMode}
                  onChange={relation.setQuietMode}
                />
              </div>

              {depend > 0.55 && !relation.quietMode && (
                <p className="fadein mt-5 text-[12px] leading-[1.9] text-muted/60">
                  今天已经聊了很多。要不要让它安静一会儿？
                  <button
                    onClick={() => relation.setQuietMode(true)}
                    className="ml-2 text-paper/75 underline decoration-white/20 underline-offset-4 hover:text-paper"
                  >
                    好
                  </button>
                </p>
              )}
            </Section>

            <Section
              index="05"
              title="清空与降级"
              note="这些操作不可撤销。它们不会问你第二遍之外的问题。"
            >
              <div className="space-y-4">
                <DangerRow
                  label="清空对话"
                  detail={`当前有 ${messages.length} 条消息。记忆不受影响。`}
                  action="清空"
                  confirming={danger === "chat"}
                  onAsk={() => setDanger("chat")}
                  onCancel={() => setDanger(null)}
                  onConfirm={async () => {
                    clearMessages();
                    setDanger(null);
                  }}
                />
                <DangerRow
                  label="清空全部记忆"
                  detail={`${memoryCount} 条记忆将从这台设备上删除，无法恢复。`}
                  action="删除"
                  confirming={danger === "memory"}
                  onAsk={() => setDanger("memory")}
                  onCancel={() => setDanger(null)}
                  onConfirm={async () => {
                    await clearMemories();
                    setDanger(null);
                  }}
                />
                <DangerRow
                  label="降级这段关系"
                  detail="主动性与边界回到最保守的位置，记忆保留。"
                  action="降级"
                  confirming={danger === "degrade"}
                  onAsk={() => setDanger("degrade")}
                  onCancel={() => setDanger(null)}
                  onConfirm={async () => {
                    relation.degrade();
                    setDanger(null);
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (confirm("这会清除这台设备上的全部本地数据：对话、记忆、关系参数。确定？")) {
                    resetLocalData();
                  }
                }}
                className="mt-8 text-[11.5px] text-faint/80 underline decoration-white/15 underline-offset-4 hover:text-[#c98a8a]"
              >
                清除全部本地数据并重新开始
              </button>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerRow({
  label,
  detail,
  action,
  confirming,
  onAsk,
  onCancel,
  onConfirm,
}: {
  label: string;
  detail: string;
  action: string;
  confirming: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
      <div>
        <p className="text-[13px] text-paper/80">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted/60">{detail}</p>
      </div>
      {confirming ? (
        <span className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => void onConfirm()}
            className="text-[#c98a8a] hover:text-[#e0a0a0]"
          >
            确认{action}
          </button>
          <button onClick={onCancel} className="text-faint hover:text-muted">
            算了
          </button>
        </span>
      ) : (
        <button
          onClick={onAsk}
          className="text-[11.5px] text-muted/75 transition-colors hover:text-paper"
        >
          {action}
        </button>
      )}
    </div>
  );
}
