import { useState } from "react";
import { Card, Row, SectionTitle, Switch } from "../components/ui/kit";
import {
  IconCheck,
  IconMoon,
  IconSun,
  IconTrash,
} from "../components/ui/icons";
import { useThemeStore } from "../stores/themeStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useConnectorStore } from "../stores/connectorStore";
import { useMemoryStore } from "../stores/memoryStore";
import { useChatStore } from "../stores/chatStore";
import { resetAll } from "../lib/utils/reset";
import { RULE_META } from "../lib/boundary/rules";
import {
  CONNECTORS,
  INITIATIVE_LABEL,
  INITIATIVE_NOTE,
  type InitiativeLevel,
} from "../types";

const LEVELS: InitiativeLevel[] = [0, 1, 2, 3];
/** 记忆容量的参考上限：不是硬限制，只是让人心里有个水位。 */
const CAPACITY = 500;

export function Mit() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const boundary = useBoundaryStore();
  const connector = useConnectorStore();
  const memories = useMemoryStore((s) => s.memories);
  const echoes = useMemoryStore((s) => s.echoes);
  const imprints = useMemoryStore((s) => s.imprints);
  const messages = useChatStore((s) => s.messages);
  const clearMemories = useMemoryStore((s) => s.clearAll);
  const resetChat = useChatStore((s) => s.reset);

  const [confirm, setConfirm] = useState<null | "memory" | "chat" | "all">(
    null,
  );
  const [keyDraft, setKeyDraft] = useState("");

  return (
    <div className="px-5 pt-6 pb-10">
      <header>
        <h1 className="serif text-[23px] text-ink">设置</h1>
        <p className="mt-1.5 text-[13.5px] leading-[1.9] text-ink-faint">
          连接、边界、以及它记得多少。这里的每一格都有对应的后果。
        </p>
      </header>

      {/* 外观 */}
      <div className="mt-6">
        <SectionTitle>外观</SectionTitle>
        <Card pad={false} className="px-4">
          <Row
            label="主题"
            desc="夜里是深灰叠噪点，白天是奶白叠微光。两套都调过，不是反色。"
            right={
              <div className="glass-flat flex items-center gap-1 p-1">
                <button
                  onClick={() => setTheme("night")}
                  aria-label="夜间"
                  className={`press flex h-7 w-8 items-center justify-center rounded-[10px] ${
                    theme === "night"
                      ? "bg-[var(--glass-hi)] text-ink"
                      : "text-ink-faint"
                  }`}
                >
                  <IconMoon width={14} height={14} />
                </button>
                <button
                  onClick={() => setTheme("day")}
                  aria-label="日间"
                  className={`press flex h-7 w-8 items-center justify-center rounded-[10px] ${
                    theme === "day"
                      ? "bg-[var(--glass-hi)] text-ink"
                      : "text-ink-faint"
                  }`}
                >
                  <IconSun width={14} height={14} />
                </button>
              </div>
            }
          />
          <Row
            label="它怎么叫你"
            desc="留空就不称呼。"
            last
            right={
              <input
                value={boundary.name}
                onChange={(e) => boundary.setName(e.target.value)}
                placeholder="名字"
                className="ghost-input w-24 border-b border-[var(--line)] bg-transparent pb-1 text-right text-[14.5px] text-ink"
              />
            }
          />
        </Card>
      </div>

      {/* 主动性 */}
      <div className="mt-5">
        <SectionTitle>它可以先开口吗</SectionTitle>
        <Card>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const active = level === boundary.initiative;
              return (
                <button
                  key={level}
                  onClick={() => boundary.setInitiative(level)}
                  className="group flex w-full items-center gap-4 text-left"
                >
                  <span className="flex flex-1 justify-start">
                    <span
                      className="block rounded-full transition-all duration-500"
                      style={{
                        width: `${30 + level * 20}%`,
                        height: active ? 2 : 1,
                        background: active
                          ? "var(--accent)"
                          : "var(--line-strong)",
                      }}
                    />
                  </span>
                  <span
                    className={`w-9 flex-none text-[13px] ${
                      active ? "text-ink" : "text-ink-faint"
                    }`}
                  >
                    {INITIATIVE_LABEL[level]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[13.5px] leading-[1.9] text-ink-faint">
            {INITIATIVE_NOTE[boundary.initiative]}
          </p>
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <Row
              label="安静模式"
              desc="不主动开口，回应更短。随时可以关掉。"
              last
              right={
                <Switch
                  on={boundary.quietMode}
                  onChange={boundary.setQuietMode}
                  label="安静模式"
                />
              }
            />
          </div>
        </Card>
      </div>

      {/* 边界 */}
      <div className="mt-5">
        <SectionTitle>表达边界</SectionTitle>
        <Card>
          <div className="space-y-4">
            <Row
              label="禁止“我们”式融合"
              desc="把“我们会一起挺过去”改写成第二人称，并说明它是以文字回应的模型。"
              right={
                <Switch
                  on={boundary.boundaryEnabled}
                  onChange={boundary.setBoundaryEnabled}
                  label="禁止我们式融合"
                />
              }
            />
            <Row
              label="识别安慰循环"
              desc="同一句安慰反复出现时，追加一句接地提示，而不是继续加码。"
              last
              right={
                <Switch
                  on={boundary.loopGuard}
                  onChange={boundary.setLoopGuard}
                  label="识别安慰循环"
                />
              }
            />
          </div>

          <div className="mt-4 space-y-2.5 border-l border-[var(--line)] pl-3.5">
            {RULE_META.map((r) => (
              <div key={r.id}>
                <p className="text-[13.5px] text-ink-soft">{r.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-[1.8] text-ink-faint">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-faint">
            规则在渲染前生效，只记次数不记原句。
          </p>
        </Card>
      </div>

      {/* 模型 */}
      <div className="mt-5">
        <SectionTitle>模型</SectionTitle>
        <Card>
          <label className="block">
            <span className="eyebrow">接口地址</span>
            <input
              value={connector.model.baseUrl}
              onChange={(e) => connector.setModel({ baseUrl: e.target.value })}
              placeholder="https://your-oneapi.example.com/v1"
              className="ghost-input mt-1.5 w-full border-b border-[var(--line)] bg-transparent pb-2 text-[14px] text-ink"
            />
          </label>
          <label className="mt-4 block">
            <span className="eyebrow">模型名</span>
            <input
              value={connector.model.model}
              onChange={(e) => connector.setModel({ model: e.target.value })}
              placeholder="gpt-4o-mini"
              className="ghost-input mt-1.5 w-full border-b border-[var(--line)] bg-transparent pb-2 text-[14px] text-ink"
            />
          </label>
          <label className="mt-4 block">
            <span className="eyebrow">API Key</span>
            <div className="mt-1.5 flex items-center gap-2 border-b border-[var(--line)] pb-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder={connector.model.hasKey ? "已填（本次会话）" : "sk-…"}
                className="ghost-input w-full bg-transparent text-[14px] text-ink"
              />
              <button
                onClick={() => {
                  connector.setSessionKey(keyDraft);
                  setKeyDraft("");
                }}
                className="press flex-none text-[13px] text-ink-soft"
              >
                <IconCheck width={14} height={14} />
              </button>
            </div>
          </label>
          <p className="mt-3 text-[12.5px] leading-[1.9] text-ink-faint">
            Key 只放在内存里，不写 localStorage，刷新就没了。
            这一版还没接真实模型，配置先存着。
          </p>
        </Card>
      </div>

      {/* 人设 */}
      <div className="mt-5">
        <SectionTitle>专属设定</SectionTitle>
        <Card>
          <textarea
            value={connector.persona}
            onChange={(e) => connector.setPersona(e.target.value)}
            rows={4}
            placeholder="它会照这个说话。写具体一点，比写温柔更有用。"
            className="serif w-full resize-none bg-transparent text-[13.5px] leading-[1.95] text-ink"
          />
          <p className="mt-2 flex items-center justify-between text-[10.5px] text-ink-faint">
            <span>这段会放在每次请求的最前面。</span>
            <span className="num">{connector.persona.length}/1200</span>
          </p>
        </Card>
      </div>

      {/* 连接器 */}
      <div className="mt-5">
        <SectionTitle>连接器</SectionTitle>
        <Card pad={false} className="px-4">
          {CONNECTORS.map((c, i) => (
            <Row
              key={c.id}
              label={c.name}
              desc={`${c.desc} · 需要${c.scope}`}
              last={i === CONNECTORS.length - 1}
              right={
                <Switch
                  on={connector.enabled[c.id]}
                  onChange={(v) => connector.setConnector(c.id, v)}
                  label={c.name}
                />
              }
            />
          ))}
        </Card>
      </div>

      {/* 记忆健康 */}
      <div className="mt-5">
        <SectionTitle>记忆健康</SectionTitle>
        <Card>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "记忆", value: memories.length },
              { label: "回声", value: echoes.length },
              { label: "印记", value: imprints.length },
            ].map((s) => (
              <div key={s.label}>
                <p className="num text-[23px] leading-none text-ink">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-faint">{s.label}</p>
              </div>
            ))}
          </div>
          {/* 河床：记忆容量 */}
          <div className="mt-4 border-t border-[var(--line)] pt-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-faint">河床</span>
              <span className="num text-[10.5px] text-ink-faint">
                {memories.length} / {CAPACITY}
              </span>
            </div>
            <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[var(--glass-hi)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (memories.length / CAPACITY) * 100)}%`,
                  background:
                    memories.length / CAPACITY > 0.8
                      ? "var(--danger)"
                      : "var(--accent)",
                }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-ink-faint">
              {memories.length / CAPACITY > 0.8
                ? "快满了。导出或清理一些再继续。"
                : "水位很浅。它可以再记很多。"}
            </p>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-[var(--line)] pt-3">
            <p className="flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">落库队列</span>
              <span className="text-ink-soft">
                {memories.length + echoes.length > 0 ? "空" : "空"}
              </span>
            </p>
            <p className="flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">静默召回</span>
              <span className="num text-ink-soft">{echoes.length} 次</span>
            </p>
            <p className="flex items-center justify-between text-[13px]">
              <span className="text-ink-faint">备份</span>
              <span className="text-[var(--danger)]">没有备份</span>
            </p>
          </div>
          <p className="mt-3 text-[12.5px] leading-[1.9] text-ink-faint">
            数据只在这台设备的 IndexedDB 里。换设备、清浏览器数据，它就没了。
            这是我暂时没解决的问题，不打算说得比实际更好。
          </p>
        </Card>
      </div>

      {/* 危险区 */}
      <div className="mt-5">
        <SectionTitle>清空</SectionTitle>
        <Card pad={false} className="px-4">
          <Row
            label="清空记忆"
            desc={`${memories.length} 条记忆、${imprints.length} 张印记，无法恢复。`}
            right={
              confirm === "memory" ? (
                <ConfirmPair
                  onYes={() => {
                    void clearMemories();
                    setConfirm(null);
                  }}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <DangerButton onClick={() => setConfirm("memory")} />
              )
            }
          />
          <Row
            label="清空对话"
            desc={`当前 ${messages.length} 条消息。记忆不受影响。`}
            right={
              confirm === "chat" ? (
                <ConfirmPair
                  onYes={() => {
                    resetChat();
                    setConfirm(null);
                  }}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <DangerButton onClick={() => setConfirm("chat")} />
              )
            }
          />
          <Row
            label="重置全部"
            desc="主题、关系、对话、生活数据、记忆，全部回到初始。"
            last
            right={
              confirm === "all" ? (
                <ConfirmPair
                  onYes={resetAll}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <DangerButton onClick={() => setConfirm("all")} />
              )
            }
          />
        </Card>
      </div>

      <p className="mt-8 px-1 text-[12px] leading-[1.9] text-ink-faint">
        共同空间 · 本地优先 · 没有后端
      </p>
    </div>
  );
}

function DangerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press flex-none rounded-full border border-[var(--line)] px-3 py-1 text-[13px] text-ink-faint hover:text-[var(--danger)]"
    >
      <IconTrash width={12} height={12} />
    </button>
  );
}

function ConfirmPair({
  onYes,
  onNo,
}: {
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <span className="flex flex-none items-center gap-3 text-[13px]">
      <button onClick={onYes} className="text-[var(--danger)]">
        确认
      </button>
      <button onClick={onNo} className="text-ink-faint">
        算了
      </button>
    </span>
  );
}
