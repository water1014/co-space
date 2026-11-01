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
    <main className="moments-page moments-journal">
      <header className="moments-masthead">
        <button onClick={() => navigate(-1)} aria-label="返回" className="moments-back"><IconChevron width={17} height={17} className="rotate-180" /></button>
        <span>JINGHUA · TWO PERSONS JOURNAL</span><span>VOL. 01</span>
      </header>
      <section className="moments-cover">
        <div className="moments-cover-copy">
          <p className="moments-overline">A CHRONICLE OF LITTLE THINGS</p>
          <h1>日常<span>絮语</span><i>。</i></h1>
          <p>生活没有宏大的章节，只有一些想与你分享的微小片刻。</p>
        </div>
        <div className="moments-cover-mark" aria-hidden="true"><span>双</span><i>✧</i></div>
        <div className="moments-cover-foot"><span>SHARED NOTES</span><span>{String(posts.length).padStart(2,"0")} ENTRIES</span></div>
      </section>

      <section className="moments-compose-section">
        <div className="moments-section-title"><div><span>01 / WRITE</span><h2>此刻，想说的话</h2></div><p>把平凡的一天<br/>折成一封小小的信</p></div>
        <div className="moments-composer">
          <div className="moments-person-switch">{(["wan", "yan"] as const).map((w) => <button key={w} onClick={() => setWho(w)} className={who === w ? "is-active" : ""}>{w === "wan" ? t.people.wan : t.people.yan}</button>)}</div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="今天有一件小事，想要认真地记下来……" rows={3} />
          <div className="moments-compose-foot"><span><IconImages width={15} height={15} /> 图片 · 即将支持</span><button onClick={publish} disabled={!draft.trim()}>发布这条记录　↗</button></div>
        </div>
      </section>

      <section className="moments-feed-section">
        <div className="moments-section-title"><div><span>02 / THE JOURNAL</span><h2>共同生活切片</h2></div><span className="moments-feed-count">{posts.length} NOTES</span></div>
        <div className="moments-feed">
          {posts.length ? posts.map((p, index) => (
            <article key={p.id} className="moments-post">
              <div className="moments-post-index">{String(posts.length-index).padStart(2,"0")}</div>
              <div className="moments-post-main">
                <div className="moments-post-head">
                  <span className={`moments-avatar ${p.who === "yan" ? "is-yan" : "is-wan"}`}>{(p.who === "yan" ? t.people.yan : t.people.wan)[0]}</span>
                  <div><strong>{p.who === "yan" ? t.people.yan : t.people.wan}</strong><time>{ago(p.at)}</time></div>
                </div>
                <p className="moments-post-text">{p.text}</p>
                <div className="moments-post-actions"><IconHeart width={14} height={14}/><span>留下一点喜欢</span></div>
              </div>
            </article>
          )) : <div className="moments-empty"><span>✧</span><p>这里还很安静。</p><small>写下第一条记录，让共同生活开始有迹可循。</small></div>}
        </div>
      </section>
      <footer className="moments-footer"><span>JING HUA SHUI YUE</span><i>✧</i><span>把日子过成值得收藏的篇章。</span></footer>
    </main>
  );
}
