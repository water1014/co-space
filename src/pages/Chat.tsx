import { useState } from "react";
import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatStore } from "../stores/chatStore";
import { usePresenceStore } from "../stores/presenceStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useMemoryStore } from "../stores/memoryStore";
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
import {
  IconClose,
  IconFile,
  IconMic,
  IconPlus,
  IconSend,
  IconSpark,
} from "../components/ui/icons";
import { formatClock } from "../lib/utils/id";
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
      <div className="flex h-full flex-col overflow-hidden">
        <ChatHeader />
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport
            className="scroll-area flex-1 px-4 pt-2"
            autoScroll
          >
            <div className="flex min-h-full flex-col justify-end pb-4">
              {messages.length === 0 && <EmptyChat />}
              <ThreadPrimitive.Messages>
                {({ message }) => <MessageRow id={message.id} />}
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

function ChatHeader() {
  const status = usePresenceStore((s) => s.statusLine);
  const quiet = useBoundaryStore((s) => s.quietMode);
  const reset = useChatStore((s) => s.reset);
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <h1 className="serif text-[19px] text-ink">对话</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span
            className={`h-[5px] w-[5px] rounded-full ${
              quiet ? "bg-ink-faint" : "bg-[var(--accent)]"
            }`}
          />
          {status}
        </p>
      </div>
      {confirming ? (
        <span className="flex items-center gap-3 text-[11.5px]">
          <button
            onClick={() => {
              reset();
              setConfirming(false);
            }}
            className="text-[var(--danger)]"
          >
            确认清空
          </button>
          <button onClick={() => setConfirming(false)} className="text-ink-faint">
            算了
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="tap text-[11.5px] text-ink-faint hover:text-ink-soft"
        >
          清空
        </button>
      )}
    </header>
  );
}

function EmptyChat() {
  const setDraft = useChatStore((s) => s.setDraft);
  const chips = ["今天很累", "帮我记一件事", "我今天辞职了"];
  return (
    <div className="fadein flex flex-1 flex-col justify-center py-16">
      <p className="serif text-[17px] leading-[2] text-ink-soft">
        还没有说过话。
      </p>
      <p className="mt-2 text-[12.5px] leading-[1.9] text-ink-faint">
        它在等第一句。也可以先告诉它今天吃了什么——
        它会去翻你的记录，而不是假装知道。
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
    </div>
  );
}

/* ---------------- 消息 ---------------- */

function MessageRow({ id }: { id: string }) {
  const meta = useChatStore((s) => s.messages.find((m) => m.id === id));
  if (!meta) return null;
  return meta.role === "user" ? (
    <UserRow meta={meta} />
  ) : (
    <AssistantRow meta={meta} />
  );
}

function UserRow({ meta }: { meta: ChatMessage }) {
  return (
    <div className="rise mt-5 flex justify-end first:mt-0">
      <div className="max-w-[86%]">
        <MessagePrimitive.Root className="glass rounded-[20px] rounded-br-[7px] px-4 py-2.5">
          <MessagePrimitive.Parts>
            {({ part }) => <PartView part={part} side="user" />}
          </MessagePrimitive.Parts>
        </MessagePrimitive.Root>
        <p className="mt-1 pr-1 text-right text-[10px] text-ink-faint">
          {formatClock(meta.createdAt)}
        </p>
      </div>
    </div>
  );
}

function AssistantRow({ meta }: { meta: ChatMessage }) {
  const streaming = meta.status === "streaming";
  const initiative = meta.origin === "initiative";

  return (
    <div className="rise mt-7 first:mt-0">
      <MessagePrimitive.Root>
        <MessagePrimitive.Parts>
          {({ part }) => (
            <PartView part={part} side="assistant" initiative={initiative} />
          )}
        </MessagePrimitive.Parts>
      </MessagePrimitive.Root>

      {!streaming && (
        <div className="mt-1 flex items-center gap-4 pl-4 text-[10px] text-ink-faint">
          <span>{formatClock(meta.createdAt)}</span>
          <button
            onClick={() => void regenerateLast()}
            className="transition-colors hover:text-ink-soft"
          >
            重新回应
          </button>
        </div>
      )}
    </div>
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
        <p className="whitespace-pre-wrap break-words text-[14.5px] leading-[1.85] text-ink">
          {text}
        </p>
      );
    }

    return (
      <div className="border-l border-[var(--line-strong)] pl-4">
        {initiative && (
          <p className="mb-1.5 text-[10px] tracking-[0.2em] text-[var(--accent)] uppercase">
            它先开口的
          </p>
        )}
        <div className="serif whitespace-pre-wrap break-words text-[15.5px] leading-[1.98] text-ink">
          {text.split(/\n{2,}/).map((para, i) => {
            const aside = para.trimStart().startsWith("（");
            return (
              <p
                key={i}
                className={
                  aside
                    ? "mt-3 text-[13.5px] leading-[1.9] text-ink-faint"
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
      <div className={side === "assistant" ? "mt-3 pl-4" : "mt-2"}>
        <VoiceBubble
          part={part.data as Extract<MessagePart, { type: "voice" }>}
        />
      </div>
    );
  }

  if (part.type === "data" && part.name === "file") {
    return (
      <div className={side === "assistant" ? "mt-3 pl-4" : "mt-2"}>
        <FileCard part={part.data as Extract<MessagePart, { type: "file" }>} />
      </div>
    );
  }

  if (part.type === "data" && part.name === "imprint") {
    const data = part.data as Extract<MessagePart, { type: "image" }>;
    return (
      <div className={side === "assistant" ? "mt-3 pl-4" : "mt-2"}>
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
      <div className="pl-4">
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
    <div className="relative px-4 pb-3">
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

      <div className="glass edge flex items-end gap-2 p-2">
        <button
          onClick={() => setSheet(true)}
          aria-label="添加附件"
          className="press flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink-soft hover:text-ink"
        >
          <IconPlus width={18} height={18} />
        </button>

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
          placeholder={quiet ? "它今天不太说话。你仍然可以写。" : "说点什么"}
          className="ghost-input max-h-28 flex-1 resize-none bg-transparent py-2 text-[14.5px] leading-[1.6] text-ink"
        />

        <button
          onClick={record}
          aria-label="语音输入"
          className="press flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink-soft hover:text-ink"
        >
          <IconMic width={17} height={17} />
        </button>

        {isRunning ? (
          <button
            onClick={() => cancelTurn()}
            className="press flex h-9 flex-none items-center justify-center rounded-full bg-[var(--glass-hi)] px-3 text-[12px] text-ink"
          >
            停下
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label="发送"
            className="press flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-30"
          >
            <IconSend width={17} height={17} />
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
