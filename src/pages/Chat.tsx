import { useMemo, useState } from "react";
import "./chat-editorial.css";
import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatStore } from "../stores/chatStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useMemoryStore } from "../stores/memoryStore";
import { useProjectsStore } from "../stores/projectsStore";
import { cancelTurn, regenerateLast, sendTurn } from "../lib/chat/turn";
import { calibrate } from "../lib/boundary/interceptor";
import { BoundaryTraceCard } from "../components/chat/OutputInterceptor";
import {
  FileCard,
  ImageBubble,
  ThoughtCard,
  VoiceBubble,
} from "../components/chat/parts";
import { Sheet } from "../components/ui/kit";
import { Portal } from "../components/ui/Portal";
import {
  IconChevron,
  IconCheck,
  IconClose,
  IconEdit,
  IconFile,
  IconFolder,
  IconMic,
  IconDots,
  IconPlus,
  IconSend,
  IconSpark,
} from "../components/ui/icons";
import { useThemeStore } from "../stores/themeStore";
import { useBack } from "../lib/nav/useBack";
import { formatClock } from "../lib/utils/id";
import { EMPTY_STATES } from "../content";
import { useText } from "../lib/content/useText";
import type { BoundaryHit, ChatMessage, MessagePart } from "../types";

/**
 * 对话。
 *
 * 每一段（思考、工具、语音、文件、印记、边界痕迹）在 convertMessage 里被转成
 * 独立的 data part，再由 MessagePrimitive.Parts 逐个分发到组件。
 * runtime 持有渲染所需的一切，UI 只是分发器——消息因此可以原样导出、回放。
 */

export function Chat() {
  const messages = useChatStore((s) => s.messages);
  const isRunning = useChatStore((s) => s.isRunning);

  /* 每天的第一条消息前放一个居中日期胶囊（参考图） */
  const dayDividers = useMemo(() => {
    const map: Record<string, string> = {};
    let lastKey = "";
    const now = new Date();
    for (const m of messages) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastKey) {
        map[m.id] =
          d.toDateString() === now.toDateString()
            ? "今天"
            : `${d.getMonth() + 1}月${d.getDate()}日`;
        lastKey = key;
      }
    }
    return map;
  }, [messages]);

  const runtime = useExternalStoreRuntime<ChatMessage>({
    messages,
    isRunning,
    convertMessage: (m): ThreadMessageLike => toThreadMessage(m, messages),
    onNew: async (append: AppendMessage) => {
      const text = append.content
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      await sendTurn(text);
    },
    onCancel: async () => cancelTurn(),
    onReload: async () => regenerateLast(),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="chat-page relative flex h-full flex-col overflow-hidden">
        <ChatHeader />
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport
            className="scroll-area flex-1 px-4 pt-4"
            autoScroll
          >
            <div className="flex min-h-full flex-col justify-end pb-4">
              {messages.length === 0 && <EmptyChat />}
              <ThreadPrimitive.Messages>
                {({ message }) => (
                  <MessageRow id={message.id} divider={dayDividers[message.id]} />
                )}
              </ThreadPrimitive.Messages>
            </div>
          </ThreadPrimitive.Viewport>
          <Composer />
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

/* ---------------- 消息 → data parts ---------------- */

const toDataPart = (part: MessagePart) => {
  switch (part.type) {
    case "thought":
      return { type: "data-thought" as const, data: part };
    case "voice":
      return { type: "data-voice" as const, data: part };
    case "file":
      return { type: "data-file" as const, data: part };
    case "image":
      return { type: "data-imprint" as const, data: part };
    default:
      return { type: "data-unknown" as const, data: part };
  }
};

function toThreadMessage(
  m: ChatMessage,
  all: readonly ChatMessage[],
): ThreadMessageLike {
  if (m.role === "user") {
    return {
      id: m.id,
      role: "user",
      createdAt: new Date(m.createdAt),
      content: m.parts.map((p) =>
        p.type === "text"
          ? { type: "text" as const, text: p.text }
          : toDataPart(p),
      ),
    };
  }

  const { text, hits } = calibrate(m, all);
  const thoughts = m.parts.filter((p) => p.type === "thought").map(toDataPart);
  const extras = m.parts
    .filter((p) => p.type !== "thought" && p.type !== "text")
    .map(toDataPart);

  return {
    id: m.id,
    role: "assistant",
    createdAt: new Date(m.createdAt),
    content: [
      ...thoughts,
      {
        type: "text" as const,
        text,
        ...(m.status === "streaming"
          ? { status: { type: "running" as const } }
          : {}),
      },
      ...extras,
      ...(hits.length
        ? [{ type: "data-boundary" as const, data: { hits } }]
        : []),
    ],
    status:
      m.status === "streaming"
        ? { type: "running" }
        : { type: "complete", reason: "stop" },
  };
}

/* ---------------- 头部 ---------------- */

/** 月相：按公历日粗略走 8 相，够用且好看。 */
function moonPhase(date = new Date()): { icon: string; label: string } {
  const d = date.getDate();
  const phase = Math.round((d / 30) * 8) % 8;
  const icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const labels = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"];
  return { icon: icons[phase], label: labels[phase] };
}

function ChatHeader() {
  const quiet = useBoundaryStore((s) => s.quietMode);
  const reset = useChatStore((s) => s.reset);
  const messages = useChatStore((s) => s.messages);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const projects = useProjectsStore((s) => s.projects);
  const activeId = useProjectsStore((s) => s.activeId);
  const setActive = useProjectsStore((s) => s.setActive);
  const [confirming, setConfirming] = useState(false);
  const [drawer, setDrawer] = useState<null | "history" | "projects" | "model" | "menu">(
    null,
  );
  const phase = moonPhase();
  const activeProject = projects.find((p) => p.id === activeId);
  const t = useText();
  const back = useBack();

  // 会话历史：把用户消息按天分组，当作「之前的对话」入口
  const historyDays = (() => {
    const map = new Map<string, { count: number; snippet: string; at: number }>();
    messages
      .filter((m) => m.role === "user")
      .forEach((m) => {
        const k = new Date(m.createdAt).toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
        });
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");
        const prev = map.get(k);
        map.set(k, {
          count: (prev?.count ?? 0) + 1,
          snippet: prev?.snippet ?? text,
          at: m.createdAt,
        });
      });
    return [...map.entries()].reverse().slice(0, 8);
  })();

  return (
    <header className="chat-header relative flex items-center gap-2 px-4 pt-4 pb-2">
      <button onClick={back} aria-label="返回" className="chat-round press">
        <IconChevron width={18} height={18} className="rotate-180" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center">
        <h1 className="max-w-full truncate text-[16.5px] font-semibold leading-tight text-ink">
          {activeProject?.name ?? t.people.yan}
        </h1>
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-ghost">
          <span
            className={`h-[5px] w-[5px] rounded-full ${
              quiet ? "bg-[var(--line-strong)]" : "bg-emerald-500"
            }`}
          />
          {quiet ? "安静着" : "在"}
        </span>
      </div>

      <button
        onClick={() => setDrawer("menu")}
        aria-label="更多"
        className="chat-round press"
      >
        <IconDots width={18} height={18} />
      </button>

      {/* 更多菜单：历史 / 主题 / 模型 / 清空 */}
      {drawer === "menu" && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDrawer(null)} />
          <div
            className="chat-menu absolute right-4 top-[62px] z-50 w-[180px] overflow-hidden rounded-[20px] p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: "我们说过的话", onClick: () => setDrawer("history") },
              { label: "换个主题", onClick: () => { toggleTheme(); setDrawer(null); } },
              { label: "模型 · Opus 4.6", onClick: () => setDrawer("model") },
              { label: "清空这段对话", onClick: () => { setConfirming(true); setDrawer(null); }, danger: true },
            ].map((it) => (
              <button
                key={it.label}
                onClick={it.onClick}
                className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-[var(--glass-hi)] ${
                  it.danger ? "text-[var(--danger)]" : "text-ink"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {confirming && (
        <Portal>
          <div className="fixed inset-0 z-40" onClick={() => setConfirming(false)} />
          <div
            className="glass fixed bottom-24 left-1/2 z-50 w-[86%] max-w-sm -translate-x-1/2 rounded-3xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="serif text-[15px] text-ink">清空这段对话？</p>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              记忆不受影响，只清掉消息。
            </p>
            <div className="mt-3 flex items-center justify-end gap-4 text-[13.5px]">
              <button onClick={() => setConfirming(false)} className="text-ink-faint">
                算了
              </button>
              <button
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
                className="text-[var(--danger)]"
              >
                确认清空
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 会话历史抽屉：从右侧滑出，参考图「我们说过的话」 */}
      {drawer === "history" && (
        <Portal>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setDrawer(null)} />
          <div
            className="glass-solid fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col border-l border-[var(--line)] bg-[var(--glass-solid)] px-4 pb-6 pt-6 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawer(null)}
                className="press text-ink-faint"
                aria-label="收起"
              >
                <IconChevron width={16} height={16} className="rotate-180" />
              </button>
              <h2 className="flex-1 text-[17px] font-semibold text-ink">我们说过的话</h2>
              <button
                onClick={() => setDrawer("projects")}
                aria-label="项目"
                className="press flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-ink-soft"
              >
                <IconFolder width={15} height={15} />
              </button>
              <button
                onClick={() => {
                  reset();
                  setDrawer(null);
                }}
                className="press rounded-full border border-[var(--line-strong)] px-3 py-1 text-[12px] text-ink-soft"
              >
                + 新对话
              </button>
            </div>

            <div className="scroll-area mt-4 min-h-0 flex-1">
              {historyDays.length === 0 ? (
                <p className="py-2 text-[13px] text-ink-faint">
                  还没有说过话。第一句最难。
                </p>
              ) : (
                <>
                  <p className="mb-1 text-[11px] text-ink-faint">今天</p>
                  {historyDays.map(([day, info], i) => (
                    <div
                      key={day}
                      className={`rounded-2xl px-3 py-2.5 ${
                        i === 0 ? "bg-[var(--glass-hi)]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] text-ink">
                          {activeProject?.name ?? "home"}
                        </span>
                        <span className="flex items-center gap-0.5 rounded bg-[var(--glass-hi)] px-1.5 text-[10px] text-ink-faint">
                          <IconFolder width={9} height={9} /> home
                        </span>
                        <span className="ml-auto flex items-center gap-2 text-ink-faint">
                          <IconEdit width={11} height={11} />
                          <button
                            onClick={() => setConfirming(true)}
                            aria-label="删除"
                            className="press"
                          >
                            <IconClose width={11} height={11} />
                          </button>
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[12px] text-ink-faint">
                        {info.snippet || day} · {info.count} 条
                      </p>
                    </div>
                  ))}
                  {phase.label && (
                    <p className="mt-3 text-[10.5px] text-ink-faint">
                      月相 {phase.label} · 它聊天前会读今天的概况和本月总结
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* 模型面板：底部居中弹出（原来 fixed 被页面转场困住，会飘到屏幕右上） */}
      {drawer === "model" && (
        <Portal>
          <div
            className="fixed inset-0 z-40 bg-black/15"
            onClick={() => setDrawer(null)}
          />
          <div
            className="sheet-panel fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[520px] rounded-t-[26px] px-5 pb-8 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line-strong)]" />
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-ink">模型</h2>
              <span className="text-[11px] text-ink-faint">本版走本地回应层</span>
            </div>
            <div className="mt-3 space-y-1">
              {["Opus 4.6", "Sonnet 4.6", "本地回应层"].map((m, i) => (
                <div
                  key={m}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 ${
                    i === 0 ? "bg-[var(--accent-soft)]" : ""
                  }`}
                >
                  <span className="flex-1 text-[14px] text-ink">{m}</span>
                  {i === 0 && (
                    <span className="text-[var(--accent)]">
                      <IconCheck width={15} height={15} strokeWidth={2.2} />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 px-1 text-[11.5px] leading-[1.8] text-ink-faint">
              接真实模型：设置页填接口地址与 Key。
            </p>
          </div>
        </Portal>
      )}

      {/* 项目抽屉：切换「家」 */}
      {drawer === "projects" && (
        <Portal>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setDrawer(null)} />
          <div
            className="glass-solid fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[600px] rounded-t-3xl border-t border-[var(--line)] bg-[var(--glass-solid)] px-5 pb-8 pt-4 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--line-strong)]" />
            <h2 className="flex items-center justify-center gap-2 text-[17px] font-semibold text-ink">
              <IconFolder width={16} height={16} /> Projects
            </h2>

            {/* 全局地基 */}
            <div className="mt-4 rounded-2xl bg-[var(--glass-hi)] px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[15px]">🌐</span>
                <span className="text-[14.5px] text-ink">全局地基</span>
                <span className="text-[11.5px] text-ink-faint">所有会话共用</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[11px] text-ink-soft">
                  CLAUDE.md
                </span>
              </div>
            </div>

            {/* 当前项目 */}
            <div className="mt-2.5 rounded-2xl bg-[var(--glass-hi)] px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[14.5px] text-ink">
                  {activeProject?.name ?? "home"}
                </span>
                <span className="text-[11.5px] text-ink-faint">
                  {projects.length} 个会话
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["CLAUDE.md", "about wanying.md", "memory-manual.md", "monopoly.md", "nest.md"].map(
                  (d) => (
                    <span
                      key={d}
                      className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[11px] text-ink-soft"
                    >
                      {d}
                    </span>
                  ),
                )}
                <span className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[11px] text-ink-faint">
                  + 文档
                </span>
              </div>
            </div>

            <button
              className="mt-3 w-full rounded-xl border border-[var(--accent-deep)] py-2 text-[13px] text-[var(--accent-deep)]"
              onClick={() => setDrawer(null)}
            >
              ✓ 当前会话在这里 · 点击移出
            </button>

            {/* 其他项目 */}
            <div className="mt-3 space-y-1">
              {projects
                .filter((p) => p.id !== activeId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActive(p.id);
                      setDrawer(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-[var(--glass-hi)]"
                  >
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="flex-1 truncate text-[13.5px] text-ink">{p.name}</span>
                  </button>
                ))}
            </div>

            <button className="mt-3 w-full text-left text-[13.5px] text-ink-soft">
              + 新建 project
            </button>
          </div>
        </Portal>
      )}
    </header>
  );
}

function EmptyChat() {
  const setDraft = useChatStore((s) => s.setDraft);
  const chips = [...EMPTY_STATES.chatChips];
  const records = [...EMPTY_STATES.chatRecordChips];
  return (
    <div className="chat-empty fadein flex flex-1 flex-col justify-center py-16">
      <p className="text-[17px] leading-[2] text-ink-soft">
        {EMPTY_STATES.chatTitle}
      </p>
      <p className="mt-2 whitespace-pre-line text-[12.5px] leading-[1.9] text-ink-faint">
        {EMPTY_STATES.chatHint}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setDraft(c)}
            className="press glass-flat px-3 py-1.5 text-[12px] text-ink-soft"
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-ink-faint">说这些话，它会自己记进对应的房间：</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {records.map((c) => (
          <button
            key={c}
            onClick={() => setDraft(c)}
            className="press rounded-full border border-[var(--line)] px-3 py-1 text-[11.5px] text-ink-faint"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 消息 ---------------- */

function MessageRow({ id, divider }: { id: string; divider?: string }) {
  const meta = useChatStore((s) => s.messages.find((m) => m.id === id));
  if (!meta) return null;
  return (
    <>
      {divider && (
        <div className="chat-date-divider my-5 flex justify-center">
          <span className="rounded-full bg-white/55 px-3 py-[3px] text-[10px] tracking-[0.04em] text-ink-faint backdrop-blur">
            {divider}
          </span>
        </div>
      )}
      {meta.role === "user" ? <UserRow meta={meta} /> : <AssistantRow meta={meta} />}
    </>
  );
}

function UserRow({ meta }: { meta: ChatMessage }) {
  return (
    <div className="chat-user-row rise mt-2 flex flex-col items-end first:mt-0">
      <div className="max-w-[80%]">
        <MessagePrimitive.Root className="bubble user-bubble">
          <MessagePrimitive.Parts>
            {({ part }) => <PartView part={part} side="user" />}
          </MessagePrimitive.Parts>
        </MessagePrimitive.Root>
      </div>
      <span className="chat-message-time mt-[5px] pr-1.5 text-[10px] tracking-[0.02em] text-ink-faint">
        {formatClock(meta.createdAt)}
      </span>
    </div>
  );
}

function AssistantRow({ meta }: { meta: ChatMessage }) {
  const t = useText();
  const streaming = meta.status === "streaming";
  const initiative = meta.origin === "initiative";

  return (
    <div className="chat-assistant-row rise mt-3 flex items-start gap-2 first:mt-0">
      <ChatAvatar initial={t.people.yan[0]} />
      <div className="flex min-w-0 max-w-[80%] flex-col items-start">
        <span className="chat-assistant-label mb-[5px] pl-2 text-[10px] tracking-[0.02em] text-ink-faint">
          {t.people.yan}
        </span>
        <MessagePrimitive.Root className="bubble assistant-bubble">
          <MessagePrimitive.Parts>
            {({ part }) => (
              <PartView part={part} side="assistant" initiative={initiative} />
            )}
          </MessagePrimitive.Parts>
        </MessagePrimitive.Root>
        <div className="mt-[5px] flex items-center gap-3 pl-2 text-[10px] text-ink-faint">
          <span>{formatClock(meta.createdAt)}</span>
          {!streaming && (
            <button
              onClick={() => void regenerateLast()}
              className="opacity-0 transition-opacity hover:opacity-100 hover:text-ink-soft"
            >
              重新回应
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 聊天头像：参考图里那颗带白环的圆头像 */
function ChatAvatar({ initial }: { initial: string; warm?: boolean }) {
  return (
    <span className="chat-avatar mt-[13px] flex h-8 w-8 flex-none items-center justify-center rounded-full text-[12px] font-semibold">
      {initial}
    </span>
  );
}

/** assistant-ui 会把 `data-thought` 解析成 `{ type: "data", name: "thought" }`。 */
type AnyPart = {
  type: string;
  name?: string;
  text?: string;
  status?: { type: string };
  data?: unknown;
};

function PartView({
  part,
  side,
  initiative,
}: {
  part: AnyPart;
  side: "user" | "assistant";
  initiative?: boolean;
}) {
  const createImprint = useMemoryStore((s) => s.createImprint);

  if (part.type === "text") {
    const text = part.text ?? "";
    const running = part.status?.type === "running";

    if (side === "user") {
      return (
        // 颜色交给 .user-bubble（黑底白字），这里不再另设 text-ink。
        <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.7]">
          {text}
        </p>
      );
    }

    return (
      <div>
        {initiative && (
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            它先开口的
          </p>
        )}
        <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.75] text-ink">
          {text.split(/\n{2,}/).map((para, i) => {
            const aside = para.trimStart().startsWith("（");
            return (
              <p
                key={i}
                className={
                  aside
                    ? "mt-3 text-[13px] leading-[1.9] text-ink-faint"
                    : i > 0
                      ? "mt-3"
                      : undefined
                }
              >
                {para}
              </p>
            );
          })}
          {running && (
            <span className="blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-ink align-middle" />
          )}
        </div>
      </div>
    );
  }

  if (part.type === "data" && part.name === "thought") {
    return (
      <ThoughtCard
        part={part.data as Extract<MessagePart, { type: "thought" }>}
      />
    );
  }

  if (part.type === "data" && part.name === "voice") {
    return (
      <div className={side === "assistant" ? "mt-2" : "mt-2"}>
        <VoiceBubble
          part={part.data as Extract<MessagePart, { type: "voice" }>}
        />
      </div>
    );
  }

  if (part.type === "data" && part.name === "file") {
    return (
      <div className={side === "assistant" ? "mt-2" : "mt-2"}>
        <FileCard part={part.data as Extract<MessagePart, { type: "file" }>} />
      </div>
    );
  }

  if (part.type === "data" && part.name === "imprint") {
    const data = part.data as Extract<MessagePart, { type: "image" }>;
    return (
      <div className={side === "assistant" ? "mt-2" : "mt-2"}>
        <ImageBubble
          part={data}
          compact={side === "user"}
          onClick={() =>
            void createImprint({
              title: `${new Date().getMonth() + 1}.${new Date().getDate()} 的印记`,
              prompt: data.caption ?? "未命名",
            })
          }
        />
      </div>
    );
  }

  if (part.type === "data" && part.name === "boundary") {
    const data = part.data as { hits: BoundaryHit[] };
    return (
      <div className="mt-2">
        <BoundaryTraceCard hits={data.hits} />
      </div>
    );
  }

  return null;
}

/* ---------------- 输入区 ---------------- */

function Composer() {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const isRunning = useChatStore((s) => s.isRunning);
  const quiet = useBoundaryStore((s) => s.quietMode);
  const [pending, setPending] = useState<MessagePart[]>([]);
  const [sheet, setSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const canSend = draft.trim().length > 0 || pending.length > 0;

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2200);
  };

  const submit = () => {
    if (!canSend || isRunning) return;
    void sendTurn(draft, pending);
    setPending([]);
  };

  const attach = (part: MessagePart) => {
    setPending((p) => [...p, part]);
    setSheet(false);
  };

  const record = () => {
    type SR = {
      lang: string;
      interimResults: boolean;
      start: () => void;
      onresult:
        | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
        | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      flash("这个浏览器不支持语音输入");
      return;
    }
    const rec = new Ctor();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t) setDraft((draft ? `${draft} ` : "") + t);
    };
    rec.onerror = () => flash("没听清，再试一次");
    rec.onend = () => flash("语音输入结束");
    rec.start();
    flash("在听…");
  };

  return (
    <div
      className="chat-composer-shell relative px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <Sheet open={sheet} onClose={() => setSheet(false)} title="附上点什么">
        <div className="grid grid-cols-3 gap-3 pt-2">
          <AttachTile
            icon={<IconSpark width={18} height={18} />}
            label="一张图"
            onClick={() =>
              attach({
                type: "image",
                seed: Math.floor(Math.random() * 9999),
                caption: "刚拍的",
              })
            }
          />
          <AttachTile
            icon={<IconFile width={18} height={18} />}
            label="一个文件"
            onClick={() =>
              attach({
                type: "file",
                name: "会议记录.docx",
                size: 183_400,
                mime: "application/vnd.openxmlformats",
              })
            }
          />
          <AttachTile
            icon={<IconMic width={18} height={18} />}
            label="一段语音"
            onClick={() =>
              attach({
                type: "voice",
                duration: 4.2,
                peaks: Array.from({ length: 26 }, (_, i) =>
                  0.2 + Math.abs(Math.sin(i * 0.9)) * 0.7,
                ),
                transcript: "这一段是我自己录的。",
              })
            }
          />
        </div>
        <p className="mt-4 text-[11.5px] leading-[1.9] text-ink-faint">
          这些附件目前是本地占位：图片会存成印记，文件没有真正的字节，
          语音用系统 TTS 读转写文本。接上后端之后形状不变。
        </p>
      </Sheet>

      {pending.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pending.map((p, i) => (
            <span
              key={i}
              className="glass-flat flex items-center gap-2 px-2.5 py-1 text-[11.5px] text-ink-soft"
            >
              {p.type === "image" ? "图片" : p.type === "file" ? p.name : "语音"}
              <button
                onClick={() => setPending((x) => x.filter((_, j) => j !== i))}
                aria-label="移除"
                className="text-ink-faint"
              >
                <IconClose width={11} height={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {notice && <p className="mb-2 px-1 text-[11px] text-ink-faint">{notice}</p>}

      {/* 参考图底部：两颗圆钮夹一条输入胶囊 */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setSheet(true)}
          aria-label="添加附件"
          className="chat-round press h-11 w-11"
        >
          <IconPlus width={20} height={20} />
        </button>

        <div className="composer-pill flex min-h-[44px] flex-1 items-center rounded-[22px] px-4 py-1.5">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={quiet ? "它今天不太说话。你仍然可以写。" : "Message..."}
            className="ghost-input max-h-28 w-full resize-none bg-transparent py-[9px] text-[15px] leading-[1.5] text-ink"
          />
        </div>

        {isRunning ? (
          <button
            onClick={() => cancelTurn()}
            aria-label="停下"
            className="chat-round press h-11 w-11 text-[var(--accent-deep)]"
          >
            <span className="h-[10px] w-[10px] rounded-[2px] bg-current" />
          </button>
        ) : canSend ? (
          <button
            onClick={submit}
            aria-label="发送"
            className="chat-send press flex h-11 w-11 flex-none items-center justify-center rounded-full text-white"
          >
            <IconSend width={18} height={18} />
          </button>
        ) : (
          <button onClick={record} aria-label="语音" className="chat-round press h-11 w-11">
            <IconMic width={19} height={19} />
          </button>
        )}
      </div>
    </div>
  );
}

function AttachTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="press glass-flat flex flex-col items-center gap-2 py-4 text-ink-soft"
    >
      {icon}
      <span className="text-[11.5px]">{label}</span>
    </button>
  );
}
