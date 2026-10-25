import { useEffect, useRef } from "react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatStore } from "../../stores/chatStore";
import { usePresenceStore } from "../../stores/presenceStore";
import { useRelationStore } from "../../stores/relationStore";
import {
  cancelTurn,
  editTurn,
  regenerateLast,
  rewriteFrom,
  sendTurn,
} from "../../lib/chat/turn";
import { BoundaryTrace, useCalibration } from "./OutputInterceptor";
import { formatTime } from "../../lib/utils/id";
import { calibrate } from "../../lib/boundary/interceptor";
import type { ChatMessage } from "../../types";

/**
 * assistant-ui 的 ExternalStoreRuntime 只做一件事：把消息列表交给我们渲染。
 * 消息的唯一真相源仍然是 chatStore —— runtime 不持有内容，只持有"这一轮在不在跑"。
 * 流式、中断、回看都在这一层被接管，所以我们不需要手写打字机。
 */

const extractText = (append: AppendMessage): string =>
  append.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

export function ThreadBridge() {
  const messages = useChatStore((s) => s.messages);
  const isRunning = useChatStore((s) => s.isRunning);

  const runtime = useExternalStoreRuntime<ChatMessage>({
    messages,
    isRunning,
    convertMessage: (message): ThreadMessageLike => {
      const calibrated =
        message.role === "assistant"
          ? calibrate(message, messages).text
          : message.text;
      return {
        id: message.id,
        role: message.role,
        content: [{ type: "text", text: calibrated }],
        createdAt: new Date(message.createdAt),
        status:
          message.role === "assistant"
            ? message.status === "streaming"
              ? { type: "running" }
              : { type: "complete", reason: "stop" }
            : undefined,
      };
    },
    onNew: async (append) => {
      await sendTurn(extractText(append));
    },
    onCancel: async () => {
      cancelTurn();
    },
    // 提供 onEdit 就开启编辑：runtime 把改写后的用户消息交回来，
    // 我们替换原文、丢掉之后的回应，再走同一条 respond 路径。
    onEdit: async (append) => {
      if (!append.sourceId) return;
      await editTurn(append.sourceId, extractText(append));
    },
    // 重答：provider 侧只做"再来一次"，不复制粘贴上一轮。
    onReload: async () => {
      await regenerateLast();
    },
    setMessages: (next) => {
      useChatStore.getState().setMessages([...next]);
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
        <ThreadPrimitive.Viewport
          className="slim-scroll flex-1 overflow-y-auto px-6 sm:px-10"
          autoScroll
        >
          <div
            className={`mx-auto flex min-h-full w-full max-w-[42rem] flex-col ${
              messages.length === 0 ? "justify-center" : "justify-end pb-10"
            }`}
          >
            {messages.length === 0 && <EmptySpace />}
            <ThreadPrimitive.Messages>
              {({ message }) => <MessageRow id={message.id} />}
            </ThreadPrimitive.Messages>
          </div>
        </ThreadPrimitive.Viewport>
        <Composer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

function EmptySpace() {
  const name = useRelationStore((s) => s.name);
  return (
    <div className="fadein flex flex-col justify-center">
      <p className="font-serif text-[17px] leading-[2] text-paper/70">
        这个空间里现在什么都没有。
      </p>
      <p className="mt-3 font-serif text-[15px] leading-[2] text-muted/70">
        {name ? `${name}，` : ""}你可以从一句话开始，也可以先待一会儿。
      </p>
      <p className="mt-8 text-[11px] tracking-[0.18em] text-faint/60 uppercase">
        它不会因为安静而消失
      </p>
    </div>
  );
}

function MessageRow({ id }: { id: string }) {
  const message = useChatStore((s) => s.messages.find((m) => m.id === id));
  if (!message) return null;
  return message.role === "user" ? (
    <UserRow message={message} />
  ) : (
    <AssistantRow message={message} />
  );
}

function UserRow({ message }: { message: ChatMessage }) {
  return (
    <div className="group/msg rise mt-10 flex justify-end first:mt-0">
      <div className="max-w-[85%] text-right">
        <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.9] text-paper/55">
          {message.text}
        </p>
        <div className="mt-1 flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/msg:opacity-100">
          <span className="text-[10px] text-faint/50">
            {formatTime(message.createdAt)}
          </span>
          <button
            type="button"
            onClick={() => void rewriteFrom(message.id)}
            className="text-[10px] text-faint/60 transition-colors hover:text-paper/70"
          >
            重写这一轮
          </button>
        </div>
      </div>
    </div>
  );
}

function AssistantRow({ message }: { message: ChatMessage }) {
  const { text } = useCalibration(message);
  const initiative = message.origin === "initiative";
  const streaming = message.status === "streaming";

  return (
    <div className="group/row rise mt-9 first:mt-0">
      <div
        className={`border-l pl-5 transition-colors ${
          initiative ? "border-[rgb(var(--ambient)/0.35)]" : "border-white/8"
        }`}
      >
        {initiative && (
          <p className="mb-2 text-[10px] tracking-[0.22em] text-[rgb(var(--ambient)/0.75)] uppercase">
            它先开口的
          </p>
        )}
        <div className="whitespace-pre-wrap break-words font-serif text-[16px] leading-[1.95] text-paper/88 sm:text-[16.5px] sm:leading-[2.05]">
          {text.split(/\n{2,}/).map((paragraph, i) => {
            // 括号开头的是拦截层追加的旁注，比正文低一级。
            const aside = paragraph.trimStart().startsWith("（");
            return (
              <p
                key={i}
                className={
                  aside
                    ? "mt-4 text-[14px] leading-[1.95] text-muted/60"
                    : i > 0
                      ? "mt-4"
                      : undefined
                }
              >
                {paragraph}
              </p>
            );
          })}
          {streaming && (
            <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse bg-paper/45 align-middle" />
          )}
        </div>
      </div>
      <div className="pl-5">
        <BoundaryTrace message={message} />
        <div className="mt-2 flex items-center gap-4 text-[10px] text-faint/50 opacity-0 transition-opacity duration-300 group-hover/row:opacity-100">
          <span>{formatTime(message.createdAt)}</span>
          <button
            type="button"
            onClick={() => void regenerateLast()}
            className="transition-colors hover:text-paper/70"
          >
            重新回应
          </button>
        </div>
      </div>
    </div>
  );
}

function Composer() {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const isRunning = useChatStore((s) => s.isRunning);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusLine = usePresenceStore((s) => s.statusLine);
  const quietMode = useRelationStore((s) => s.quietMode);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const submit = () => {
    const text = draft.trim();
    if (!text || isRunning) return;
    void sendTurn(text);
    textareaRef.current?.focus();
  };

  return (
    <div
      className="relative bg-gradient-to-t from-[#05060a] via-[#05060a]/94 to-transparent px-6 pt-10 sm:px-10"
      style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="group mx-auto w-full max-w-[42rem]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            quietMode ? "它今天不太说话。你仍然可以写。" : "说点什么，或者什么都不说"
          }
          className="textarea-ghost max-h-40 min-h-[30px] w-full resize-none bg-transparent py-1 text-[14.5px] leading-[1.9] text-paper/90"
        />
        {/* 输入区的底边就是这条线：聚焦时它亮起来，代替边框和卡片。 */}
        <div className="h-px w-full bg-white/12 transition-colors duration-500 group-focus-within:bg-[rgb(var(--ambient)/0.55)]" />
        <div className="mt-2 flex items-center justify-between text-[10px] text-faint/60">
          <span className="truncate">
            {isRunning ? "正在回应" : quietMode ? "安静模式" : statusLine}
          </span>
          <span className="flex shrink-0 items-center gap-4 pl-4">
            {isRunning ? (
              <button
                type="button"
                onClick={() => cancelTurn()}
                className="tracking-wide transition-colors hover:text-paper/80"
              >
                停下
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim()}
                className="tracking-wide transition-colors hover:text-paper disabled:opacity-45"
              >
                送出 ↵
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
