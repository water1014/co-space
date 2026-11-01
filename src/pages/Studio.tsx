import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevron, IconStudio, IconSpark } from "../components/ui/icons";
import "./studio-editorial.css";

export function Studio() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult(null);
    window.setTimeout(() => {
      setBusy(false);
      setResult(prompt.trim());
    }, 1400);
  };

  return (
    <main className="studio-page studio-atelier">
      <header className="atelier-topline">
        <button onClick={() => navigate(-1)} aria-label="返回" className="atelier-back"><IconChevron width={17} height={17} className="rotate-180" /></button>
        <span>JINGHUA / IMAGE ATELIER</span>
        <span className="atelier-issue">NO. 01</span>
      </header>

      <section className="atelier-hero">
        <div className="atelier-hero-copy">
          <p className="atelier-kicker">A SMALL WORLD, MADE OF LIGHT</p>
          <h1>把想象<br/><em>留成一幅画。</em></h1>
          <p className="atelier-intro">为某个瞬间、一个梦，或你们共同想象的世界，留下专属的视觉注脚。</p>
        </div>
        <div className="atelier-orbit" aria-hidden="true"><span>月</span><i/><b/></div>
        <div className="atelier-hero-index"><span>01</span><span>THE ART OF MEMORY</span></div>
      </section>

      <section className="atelier-workspace">
        <div className="atelier-section-heading">
          <div><span className="atelier-number">01 / PROMPT</span><h2>描述灵感</h2></div>
          <p>从一句话开始<br/>让画面慢慢浮现</p>
        </div>
        <div className="atelier-writing">
          <label htmlFor="studio-prompt">YOUR IMAGINATION</label>
          <textarea id="studio-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="黄昏的海边，两个人并肩看潮汐。风吹起衣角，远处有一轮将落未落的月……" rows={5} />
          <div className="atelier-writing-foot"><span>{prompt.length.toString().padStart(3,"0")} CHARACTERS</span><span>写下你想收藏的画面</span></div>
          <button onClick={generate} disabled={!prompt.trim() || busy} className="atelier-create"><span>{busy ? "正在描绘…" : "开始创作"}</span><IconSpark width={17} height={17} className={busy ? "animate-spin" : ""}/></button>
        </div>
      </section>

      <section className="atelier-canvas-section">
        <div className="atelier-section-heading">
          <div><span className="atelier-number">02 / CANVAS</span><h2>你的画布</h2></div>
          <span className="atelier-canvas-note">A PLACE FOR YOUR DREAMS</span>
        </div>
        <div className={`atelier-canvas ${result ? "has-result" : ""}`}>
          <div className="atelier-canvas-frame">
            {result ? <><IconStudio width={38} height={38}/><p>{result}</p></> : <><div className="atelier-canvas-moon">月</div><span>THE FIRST IMAGE IS WAITING</span><p>每一幅画，都从一个念头开始。</p></>}
          </div>
          <span className="atelier-canvas-caption">FIG. 01　·　MOONLIGHT STUDY</span>
        </div>
      </section>
      <footer className="atelier-footer"><span>JING HUA SHUI YUE</span><i>✧</i><span>让想象有迹可循。</span></footer>
    </main>
  );
}
