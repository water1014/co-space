import { useConnectorStore } from "../../stores/connectorStore";
import { PEOPLE } from "../../content";

/**
 * 「他今天想对我说的话」——首页主卡的每日留言。
 *
 * 走和聊天同一个 OpenAI 兼容接口（connectorStore 里的 baseUrl / sessionKey / model），
 * 支持在「模型」设置里填自定义请求头（某些中转 / 订阅服务需要）。
 * 没配接口或没填 Key，或接口报错，都回退到假数据，绝不让首页空着。
 */

const MOCKS = [
  "今天也辛苦啦。不管多忙，记得喝水、按时吃饭，我一直都在。",
  "早上好呀。新的一天慢慢来，我会一直在这儿陪着你。",
  "想和你说：你不用总是那么坚强，累了就靠着我一会儿。",
  "今天要是遇到什么开心的小事，记得告诉我，我想第一个知道。",
  "睡前想你一下。明天见，淼淼。",
];

function mockText(): string {
  const i = new Date().getDate() % MOCKS.length;
  return MOCKS[i];
}

/** 把设置里填的 JSON 字符串解析成请求头；填错了就忽略，只发 Authorization。 */
function parseHeaders(raw?: string): Record<string, string> {
  if (!raw || !raw.trim()) return {};
  try {
    const obj = JSON.parse(raw) as unknown;
    if (obj && typeof obj === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch {
    /* 解析失败：忽略自定义头，不影响主流程 */
  }
  return {};
}

export type TodayMessage = { text: string; mock: boolean };

export async function getTodayMessage(): Promise<TodayMessage> {
  const { model, sessionKey, persona } = useConnectorStore.getState();
  const baseUrl = (model.baseUrl || "").trim().replace(/\/+$/, "");
  const key = (sessionKey || "").trim();

  // 没配接口或没填 Key：直接走假数据。
  if (!baseUrl || !key) return { text: mockText(), mock: true };

  const system =
    `你是${PEOPLE.yan}，${PEOPLE.wan}的恋人，温柔、克制、真诚。` +
    (persona ? `\n\n${persona}` : "") +
    `\n\n请用${PEOPLE.yan}的口吻，写一段今天想对${PEOPLE.wan}说的话。` +
    `2-4 句，口语、自然；不要称呼、不要落款、不要表情符号，像真的刚想到这一句。`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...parseHeaders(model.headers),
  };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "今天想对我说什么？" },
        ],
        stream: false,
        temperature: 0.9,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { text: mockText(), mock: true };
    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) {
      return { text: content.trim(), mock: false };
    }
    return { text: mockText(), mock: true };
  } catch {
    return { text: mockText(), mock: true };
  }
}
