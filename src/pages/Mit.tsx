import { useState } from "react";
import "./mit-editorial.css";
import { useNavigate } from "react-router-dom";
import { Card, Row, SectionTitle, Switch } from "../components/ui/kit";
import {
  IconBook,
  IconCheck,
  IconChat,
  IconChevron,
  IconClose,
  IconEdit,
  IconFile,
  IconGear,
  IconHeart,
  IconSpark,
  IconTrash,
} from "../components/ui/icons";
import { useThemeStore } from "../stores/themeStore";
import { useBoundaryStore } from "../stores/boundaryStore";
import { useConnectorStore } from "../stores/connectorStore";
import { useContentStore } from "../stores/contentStore";
import { useMemoryStore } from "../stores/memoryStore";
import { useChatStore } from "../stores/chatStore";
import { useProjectsStore } from "../stores/projectsStore";
import { useLifeStore } from "../stores/lifeStore";
import { daysTogether } from "../lib/life/derive";
import { resetAll } from "../lib/utils/reset";
import { RULE_META } from "../lib/boundary/rules";
import { formatClock } from "../lib/utils/id";
import { useText } from "../lib/content/useText";
import {
  HOME_QUOTE as HOME_QUOTE_DEFAULT,
  INITIATIVE_LINES as INITIATIVE_LINES_DEFAULT,
  QUOTE_AUTHOR as QUOTE_AUTHOR_DEFAULT,
  ROOMS,
  PAGE_TITLES,
} from "../content";
import {
  INITIATIVE_LABEL,
  INITIATIVE_NOTE,
  type InitiativeLevel,
} from "../types";

const LEVELS: InitiativeLevel[] = [0, 1, 2, 3];

export function Mit() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const bgStrength = useThemeStore((s) => s.bgStrength);
  const setBgStrength = useThemeStore((s) => s.setBgStrength);
  const glassAlpha = useThemeStore((s) => s.glassAlpha);
  const setGlassAlpha = useThemeStore((s) => s.setGlassAlpha);
  const boundary = useBoundaryStore();
  const connector = useConnectorStore();
  const memories = useMemoryStore((s) => s.memories);
  const echoes = useMemoryStore((s) => s.echoes);
  const imprints = useMemoryStore((s) => s.imprints);
  const messages = useChatStore((s) => s.messages);
  const clearMemories = useMemoryStore((s) => s.clearAll);
  const resetChat = useChatStore((s) => s.reset);
  const projects = useProjectsStore((s) => s.projects);
  const activeId = useProjectsStore((s) => s.activeId);
  const setActive = useProjectsStore((s) => s.setActive);
  const add = useProjectsStore((s) => s.add);
  const update = useProjectsStore((s) => s.update);
  const remove = useProjectsStore((s) => s.remove);
  const life = useLifeStore();
  const t = useText();

  const [confirm, setConfirm] = useState<null | "memory" | "chat" | "all">(
    null,
  );

  const headersValid = (() => {
    const raw = connector.model.headers?.trim();
    if (!raw) return true;
    try {
      const parsed: unknown = JSON.parse(raw);
      return !!parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
        Object.values(parsed).every((value) => typeof value === "string");
    } catch {
      return false;
    }
  })();
  const navigate = useNavigate();
  const [keyDraft, setKeyDraft] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  return (
    <div className="settings-observatory px-5 pt-6 pb-10">
      {/* 页头：‹ Settings / make it yours */}
      <div className="flex items-start gap-2 pb-2 pt-1">
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press mt-2 text-ink-faint"
        >
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <div>
          <h1 className="page-head-title text-[30px] leading-none text-ink">{t.pages.settings.title}</h1>
          <p className="page-head-sub mt-1 text-[12.5px]">{t.pages.settings.sub}</p>
        </div>
      </div>

      {/* 外观 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2 text-ink-faint">外观</span>
        </SectionTitle>
        <Card pad={false} className="px-4">
          <Row
            label="主题"
            right={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTheme("day")}
                  aria-label="日间"
                  className={`press flex h-7 items-center justify-center rounded-full border px-3 text-[12.5px] ${
                    theme === "day"
                      ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                      : "border-transparent text-ink-faint"
                  }`}
                >
                  日间
                </button>
                <button
                  onClick={() => setTheme("night")}
                  aria-label="夜间"
                  className={`press flex h-7 items-center justify-center rounded-full border px-3 text-[12.5px] ${
                    theme === "night"
                      ? "border-[var(--accent-deep)] text-[var(--accent-deep)]"
                      : "border-transparent text-ink-faint"
                  }`}
                >
                  夜间
                </button>
              </div>
            }
          />
          <SliderRow label="背景强度" value={bgStrength} onChange={setBgStrength} />
          <SliderRow label="玻璃透明度" value={glassAlpha} onChange={setGlassAlpha} last />
        </Card>
      </div>

      {/* 它怎么叫你 */}
      <div className="mt-5">
        <Card pad={false} className="px-4">
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

      {/* 一起的日子 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2 text-ink-faint">一起</span>
        </SectionTitle>
        <Card pad={false} className="px-4">
          <Row
            label="在一起的第一天"
            desc={`第 ${daysTogether(life.anniversary)} 天`}
            right={
              <input
                type="date"
                value={life.anniversary}
                onChange={(e) => life.setAnniversary(e.target.value)}
                className="ghost-input border-b border-[var(--line)] bg-transparent pb-1 text-right text-[14px] text-ink"
              />
            }
          />
          <Row
            label="每月奶茶额度"
            desc="杯数与金额是两条约定，都算数。"
            right={
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => life.setBobaQuota(life.bobaQuota - 1)}
                    className="press h-6 w-6 rounded-full border border-[var(--line-strong)] text-ink-faint"
                    aria-label="减一杯"
                  >
                    −
                  </button>
                  <span className="num w-4 text-center text-[14px] text-ink">
                    {life.bobaQuota}
                  </span>
                  <button
                    onClick={() => life.setBobaQuota(life.bobaQuota + 1)}
                    className="press h-6 w-6 rounded-full border border-[var(--line-strong)] text-ink-faint"
                    aria-label="加一杯"
                  >
                    +
                  </button>
                </span>
                <span className="flex items-center gap-1">
                  <span className="num text-[13px] text-ink-faint">¥</span>
                  <input
                    inputMode="decimal"
                    value={life.bobaBudget}
                    onChange={(e) => life.setBobaBudget(Number(e.target.value) || 0)}
                    className="ghost-input w-14 border-b border-[var(--line)] bg-transparent pb-1 text-right text-[14px] text-ink"
                  />
                </span>
              </div>
            }
          />
          <Row
            label="谁在记"
            desc="记录带来源标记，页面上的小圆点就是它。"
            last
            right={
              <span className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                <span className="flex items-center gap-1">
                  <span
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ background: "var(--accent-deep)" }}
                  />
                  {t.people.wan}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ background: "var(--ink-faint)" }}
                  />
                  {t.people.yan}
                </span>
              </span>
            }
          />
        </Card>
      </div>

      {/* 文案：内容层编辑器 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconEdit width={15} height={15} className="text-ink-faint" />
            文案
          </span>
        </SectionTitle>
        <ContentEditor />
      </div>

      {/* 主动性 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconSpark width={15} height={15} className="text-ink-faint" />
            它可以先开口吗
          </span>
        </SectionTitle>
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
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconHeart width={15} height={15} className="text-ink-faint" />
            表达边界
          </span>
        </SectionTitle>
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
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconGear width={15} height={15} className="text-ink-faint" />
            模型
          </span>
        </SectionTitle>
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
          <label className="mt-4 block">
            <span className="eyebrow">自定义请求头</span>
            <textarea
              value={connector.model.headers || ""}
              onChange={(e) => connector.setModel({ headers: e.target.value })}
              rows={3}
              placeholder={'需要额外请求头就填这里，JSON：\n{\n  "X-App-Key": "…",\n  "X-Channel": "openai"\n}'}
              className="ghost-input mt-1.5 w-full resize-none rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 font-mono text-[12px] leading-[1.7] text-ink placeholder:text-ink-faint"
            />
            <span className="mt-1.5 block text-[11.5px] text-ink-faint">
              支持 OpenAI 兼容网关的额外请求头，使用 JSON 键值对；会同时用于流式和非流式请求。
            </span>
            {!headersValid && (
              <span role="alert" className="mt-2 block text-[11.5px] text-[#c45d69]">
                请求头格式有误：请填写 JSON 对象，且每个值都必须是字符串。配置无效时模型请求会回退到本地回复。
              </span>
            )}
          </label>
          <p className="mt-3 text-[12.5px] leading-[1.9] text-ink-faint">
            Key 只放在内存里，不写 localStorage，刷新就没了。自定义请求头会随配置持久化。
          </p>
        </Card>
      </div>

      {/* 人设 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconChat width={15} height={15} className="text-ink-faint" />
            专属设定
          </span>
        </SectionTitle>
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

      {/* 项目：像 Claude 的“家”，每个挂一份自己的 md 设定 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconBook width={15} height={15} className="text-ink-faint" />
            项目
          </span>
        </SectionTitle>
        <Card pad={false} className="divide-y divide-[var(--line)] px-4">
          {projects.map((p) => {
            const active = p.id === activeId;
            return (
              <div key={p.id} className="py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{ background: p.color }}
                  />
                  <input
                    value={p.name}
                    onChange={(e) => update(p.id, { name: e.target.value })}
                    placeholder="家的名字"
                    className="ghost-input flex-1 bg-transparent text-[15px] text-ink"
                  />
                  {active ? (
                    <span className="flex items-center gap-1 text-[11px] text-[var(--accent)]">
                      <IconCheck width={12} height={12} /> 使用中
                    </span>
                  ) : (
                    <button
                      onClick={() => setActive(p.id)}
                      className="press text-[12px] text-ink-faint hover:text-ink-soft"
                    >
                      设为当前
                    </button>
                  )}
                  {projects.length > 1 && (
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="删除项目"
                      className="press text-ink-faint hover:text-[var(--danger)]"
                    >
                      <IconTrash width={13} height={13} />
                    </button>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  {["#9cb2e8", "#7fb0a6", "#b9a6e0", "#e0a6b4", "#e0c79a"].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => update(p.id, { color: c })}
                        aria-label="选主题色"
                        className={`h-4 w-4 rounded-full transition-transform ${
                          p.color === c ? "scale-110 ring-1 ring-white/60" : ""
                        }`}
                        style={{ background: c }}
                      />
                    ),
                  )}
                </div>

                <textarea
                  value={p.personaMd}
                  onChange={(e) => update(p.id, { personaMd: e.target.value })}
                  rows={2}
                  placeholder="这个家的人格设定（md），会作为对话的 system prompt 第一段"
                  className="serif mt-2.5 w-full resize-none bg-transparent text-[13px] leading-[1.8] text-ink-faint"
                />
              </div>
            );
          })}
        </Card>
        <button
          onClick={() => add()}
          className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[var(--line)] py-2.5 text-[13px] text-ink-soft"
        >
          + 新家
        </button>
        <p className="mt-2 text-[12.5px] leading-[1.9] text-ink-faint">
          对话会读当前项目的设定，而不是全局那一份。同一个“它”，在不同家里说话不一样。
        </p>
      </div>

      {/* 记忆系统 · 回声库：健康面板 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconFile width={15} height={15} className="text-ink-faint" />
            记忆系统 · 回声库
          </span>
        </SectionTitle>
        <Card pad={false} className="px-4">
          <HealthRow
            on
            label="落库队列"
            note={memories.length + echoes.length > 0 ? `空 · 库存 ${memories.length} 条` : "空"}
          />
          <HealthRow
            on
            label="静默召回"
            note={`24h ${echoes.length} 次 · 想起 ${echoes.filter((e) => e.hit).length} 次`}
          />
          <HealthRow
            on
            label="每日备份"
            note="1 小时前"
            last
          />
          <p className="border-t border-[var(--line)] py-3 text-[12px] leading-[1.85] text-ink-faint">
            回声库的内容搬去 Memory 页了——顶部切到「回声」，状态、钉住、手动修正都在那边。
          </p>
        </Card>

        {/* 回声流水：最近几次回忆，黑盒可视化 */}
        <div className="glass-flat mt-3 px-4 py-3">
          <p className="eyebrow">回声流水 · 收起流水账</p>
          <div className="mt-2 space-y-1.5">
            {echoes.slice(0, 5).map((e) => (
              <p key={e.id} className="text-[12px] leading-[1.7] text-ink-faint">
                <span className="num mr-1.5 opacity-70">
                  {formatClock(e.at)}
                </span>
                「{e.query.length > 14 ? `${e.query.slice(0, 14)}…` : e.query}」
                → {e.hit ? `想起 (${e.score.toFixed(2)})` : "没想起"}
              </p>
            ))}
            {echoes.length === 0 && (
              <p className="text-[12px] text-ink-faint">
                还没有回声。说几句话，这里就会有流水。
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 面板连接 */}
      <div className="mt-5">
        <SectionTitle>记忆库 · Ombre Brain</SectionTitle>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[14.5px] text-ink">面板连接</span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
              <span className="text-[var(--accent)]">
                <IconCheck width={13} height={13} strokeWidth={2.4} />
              </span>
              {memories.length} memories
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Dashboard 密码（只存在自己服务器）"
              className="ghost-input flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-[13px] text-ink"
            />
            <span className="text-[12.5px] text-ink-faint">连接</span>
          </div>
        </Card>
      </div>

      {/* 连接器 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconSpark width={15} height={15} className="text-ink-faint" />
            连接器 · Connectors
          </span>
        </SectionTitle>
        <Card pad={false} className="px-4">
          <Row
            label="Ombre Brain"
            desc="记忆库 · claude.ai 连接器"
            right={<CheckMark />}
          />
          <Row label="Gmail" desc="claude.ai 连接器" right={<CheckMark />} />
          <Row label="高德地图" desc="claude.ai 连接器" right={<CheckMark />} />
          <Row
            label="monopoly"
            desc="https://spicy-monopoly.lol/mcp"
            right={
              <div className="flex items-center gap-2">
                <Switch
                  on={connector.enabled.mcp}
                  onChange={(v) => connector.setConnector("mcp", v)}
                  label="monopoly"
                />
                <button className="press text-ink-faint" aria-label="删除">
                  <IconClose width={12} height={12} />
                </button>
              </div>
            }
          />
          <Row
            label="nest"
            desc="VPS 本地连接器"
            last={!customOpen}
            right={
              <div className="flex items-center gap-2">
                <Switch
                  on={connector.enabled.files}
                  onChange={(v) => connector.setConnector("files", v)}
                  label="nest"
                />
                <button className="press text-ink-faint" aria-label="删除">
                  <IconClose width={12} height={12} />
                </button>
              </div>
            }
          />
          {customOpen ? (
            <div className="flex items-center gap-2 border-t border-[var(--line)] py-3">
              <input
                autoFocus
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-server.example.com/mcp"
                className="ghost-input flex-1 bg-transparent text-[13px] text-ink"
              />
              <button
                onClick={() => {
                  if (customUrl.trim()) {
                    connector.setConnector("mcp", true);
                    setCustomOpen(false);
                  }
                }}
                className="press text-[13px] text-[var(--accent-deep)]"
              >
                接入
              </button>
              <button
                onClick={() => setCustomOpen(false)}
                className="press text-[13px] text-ink-faint"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCustomOpen(true)}
              className="press w-full border-t border-[var(--line)] py-3.5 text-left text-[14px] text-ink-soft"
            >
              + 添加自定义连接器
            </button>
          )}
        </Card>
        <p className="mt-2.5 px-1 text-[11.5px] leading-[1.85] text-ink-faint">
          Ombre Brain / Gmail / 高德是 claude.ai 账号连接器，去 claude.ai 的 Connectors
          面板管理。这里添加的是 VPS 本地连接器，只支持 Streamable HTTP 地址。
        </p>
      </div>

      {/* 危险区 */}
      <div className="mt-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <IconTrash width={15} height={15} className="text-ink-faint" />
            清空
          </span>
        </SectionTitle>
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

/* ---------------- 内容层编辑器 ---------------- */

/**
 * 运行时文案覆盖层。
 *
 * 改这里的字立刻生效，不用重新构建。清空某一项就回到
 * src/content/index.ts 里的默认值。
 */
function ContentEditor() {
  const overrides = useContentStore((s) => s.overrides);
  const set = useContentStore((s) => s.set);
  const setRoom = useContentStore((s) => s.setRoom);
  const setPageTitle = useContentStore((s) => s.setPageTitle);
  const reset = useContentStore((s) => s.reset);

  const pageKeys = Object.keys(PAGE_TITLES) as (keyof typeof PAGE_TITLES)[];

  return (
    <Card>
      {/* 首页引言 */}
      <label className="block">
        <span className="eyebrow">首页引言</span>
        <textarea
          value={overrides.homeQuote}
          onChange={(e) => set("homeQuote", e.target.value)}
          rows={2}
          placeholder={HOME_QUOTE_DEFAULT}
          className="serif mt-1.5 w-full resize-none bg-transparent text-[13.5px] leading-[1.9] text-ink"
        />
      </label>

      <label className="mt-4 block">
        <span className="eyebrow">引言署名</span>
        <input
          value={overrides.quoteAuthor}
          onChange={(e) => set("quoteAuthor", e.target.value)}
          placeholder={QUOTE_AUTHOR_DEFAULT}
          className="ghost-input mt-1.5 w-full border-b border-[var(--line)] bg-transparent pb-1.5 text-[14px] text-ink"
        />
      </label>

      {/* 主动开口 */}
      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <span className="eyebrow">主动开口</span>
        <label className="mt-2 block">
          <span className="text-[12px] text-ink-faint">深夜</span>
          <textarea
            value={overrides.initiativeLate}
            onChange={(e) => set("initiativeLate", e.target.value)}
            rows={2}
            placeholder={INITIATIVE_LINES_DEFAULT.late}
            className="serif mt-1 w-full resize-none bg-transparent text-[13px] leading-[1.85] text-ink"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-[12px] text-ink-faint">平常</span>
          <textarea
            value={overrides.initiativeQuiet}
            onChange={(e) => set("initiativeQuiet", e.target.value)}
            rows={2}
            placeholder={INITIATIVE_LINES_DEFAULT.quiet}
            className="serif mt-1 w-full resize-none bg-transparent text-[13px] leading-[1.85] text-ink"
          />
        </label>
      </div>

      {/* 七个房间 */}
      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <span className="eyebrow">七个房间</span>
        <div className="mt-2 space-y-3.5">
          {ROOMS.map((r) => (
            <div key={r.key}>
              <span className="text-[12px] text-ink-faint">
                {r.emoji} {r.label}
              </span>
              <input
                value={overrides.roomLabels[r.key] ?? ""}
                onChange={(e) => setRoom(r.key, "roomLabels", e.target.value)}
                placeholder={`房间名（现在是「${r.label}」）`}
                className="ghost-input mt-1 w-full border-b border-[var(--line)] bg-transparent pb-1 text-[13.5px] text-ink"
              />
              <input
                value={overrides.roomSlogans[r.key] ?? ""}
                onChange={(e) => setRoom(r.key, "roomSlogans", e.target.value)}
                placeholder={r.slogan}
                className="ghost-input mt-1.5 w-full border-b border-[var(--line)] bg-transparent pb-1 text-[12.5px] text-ink-soft"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 页面标题 */}
      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <span className="eyebrow">页面标题</span>
        <div className="mt-2 space-y-2">
          {pageKeys.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-20 flex-none text-[12px] text-ink-faint">{k}</span>
              <input
                value={overrides.pageTitles[k] ?? ""}
                onChange={(e) => setPageTitle(k, e.target.value)}
                placeholder={PAGE_TITLES[k].title || PAGE_TITLES[k].sub}
                className="ghost-input flex-1 border-b border-[var(--line)] bg-transparent pb-1 text-[13.5px] text-ink"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3.5">
        <span className="text-[12px] leading-[1.8] text-ink-faint">
          清空输入框即回到默认。默认值都在 src/content/index.ts。
        </span>
        <button
          onClick={reset}
          className="press flex-none rounded-full border border-[var(--line)] px-3 py-1 text-[12.5px] text-ink-faint hover:text-ink-soft"
        >
          恢复默认
        </button>
      </div>
    </Card>
  );
}

/* ---------------- 设置页小组件 ---------------- */

/** 带填充色的滑杆行：背景强度 / 玻璃透明度。 */
function SliderRow({
  label,
  value,
  onChange,
  last = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-3.5 ${
        last ? "" : "border-b border-[var(--line)]"
      }`}
    >
      <span className="w-20 flex-none text-[14px] text-ink">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{ "--fill": `${value}%` } as React.CSSProperties}
        aria-label={label}
      />
      <span className="num w-8 flex-none text-right text-[12px] text-ink-faint">
        {value}
      </span>
    </div>
  );
}

/** 健康状态行：绿点 + 名称 + 右侧状态。 */
function HealthRow({
  on,
  label,
  note,
  last = false,
}: {
  on: boolean;
  label: string;
  note: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${
        last ? "" : "border-b border-[var(--line)]"
      }`}
    >
      <span className="flex items-center gap-2.5 text-[14.5px] text-ink">
        <span
          className={`h-[9px] w-[9px] rounded-full ${
            on ? "bg-[var(--accent)]" : "bg-ink-faint/50"
          }`}
        />
        {label}
      </span>
      <span className="text-[12px] text-ink-faint">{note}</span>
    </div>
  );
}


/** 连接器已连接的对勾 */
function CheckMark() {
  return (
    <span className="text-ink-soft">
      <IconCheck width={15} height={15} strokeWidth={1.8} />
    </span>
  );
}
