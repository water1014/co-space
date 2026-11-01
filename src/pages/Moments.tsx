import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevron, IconHeart, IconImages } from "../components/ui/icons";
import { useText } from "../lib/content/useText";
import "./moments-editorial.css";

type Post = {
  id: string;
  text: string;
  who: "wan" | "yan";
  at: number;
};

const KEY = "co-space::moments";

function load(): Post[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Post[];
  } catch {
    /* ignore */
  }
  return [
    { id: "s1", who: "yan", text: "今天也觉得，遇见你是一件很幸运的事。", at: Date.now() - 3600_000 },
    { id: "s2", who: "wan", text: "周末去的那家小馆子，下次还要去。", at: Date.now() - 7200_000 },
  ];
}

function ago(at: number): string {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}

export function Moments() {
  const t = useText();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(load);
  const [who, setWho] = useState<"wan" | "yan">("wan");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(posts));
  }, [posts]);

  const publish = () => {
    const text = draft.trim();
    if (!text) return;
    setPosts((p) => [{ id: `m${Date.now()}`, text, who, at: Date.now() }, ...p]);
    setDraft("");
  };

  return (
    <div className="moments-page px-5 pt-6 pb-10">
      <div className="moments-heading flex items-start gap-2 pb-2 pt-1">
        <button onClick={() => navigate(-1)} aria-label="返回" className="press mt-2 text-ink-faint">
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="moments-title page-head-title text-[30px] leading-none text-ink">朋友圈</h1>
          <p className="moments-subtitle page-head-sub mt-1 text-[12.5px]">情侣动态广场 · 记录日常</p>
        </div>
      </div>

      {/* 发布器 */}
      <div className="moments-composer mt-5 p-4">
        <div className="flex gap-2">
          {(["wan", "yan"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWho(w)}
              className={`moments-person tap px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                who === w
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-2)] text-ink-soft"
              }`}
            >
              {w === "wan" ? t.people.wan : t.people.yan}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="分享此刻的一点小事…"
          rows={2}
          className="moments-draft ghost-input mt-3 w-full resize-none bg-transparent text-[14.5px] leading-[1.7] text-ink"
        />
        <div className="moments-compose-foot mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2.5">
          <span className="text-[12px] text-ink-ghost">
            <IconImages width={15} height={15} className="mr-1 inline" />
            图片（即将支持）
          </span>
          <button
            onClick={publish}
            disabled={!draft.trim()}
            className="tap rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
          >
            发布
          </button>
        </div>
      </div>

      {/* 动态流 */}
      <div className="moments-feed mt-6">
        {posts.map((p) => (
          <article key={p.id} className="moments-post">
            <div className="moments-post-head flex items-center gap-2.5">
              <span
                className={`moments-avatar flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold ${
                  p.who === "yan"
                    ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white"
                    : "bg-gradient-to-br from-[#f3ddd3] to-[#e7c4b6] text-[#9c6b52]"
                }`}
              >
                {(p.who === "yan" ? t.people.yan : t.people.wan)[0]}
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-ink">
                  {p.who === "yan" ? t.people.yan : t.people.wan}
                </p>
                <p className="text-[11px] text-ink-faint">{ago(p.at)}</p>
              </div>
            </div>
            <p className="moments-post-text mt-2.5 text-[14.5px] leading-[1.8] text-ink">{p.text}</p>
            <div className="moments-post-actions mt-2.5 flex items-center gap-1.5 text-ink-faint">
              <IconHeart width={14} height={14} />
              <span className="text-[12px]">赞</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
