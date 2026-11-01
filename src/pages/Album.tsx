import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { BackButton } from "../components/ui/BackButton";
import { Portal } from "../components/ui/Portal";
import { useAlbumStore, type Photo } from "../stores/albumStore";
import { fileToDataUrl } from "../lib/img/resize";
import { IconImages, IconPlus, IconClose, IconChevron } from "../components/ui/icons";
import "./album-editorial.css";

const MON_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKeyOf = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const stamp = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

/**
 * 相册：参考「KEEPSAKES」的相册排版。
 *
 * 衬线月份 + 年份 + KEEPSAKES 小字；一条按日筛选的日期条；
 * 网格是两列瀑布流，列表是按天归档的索引。点开一张，浮出一张
 * 「想留下的」纸卡：编号、日期、一句说明（可直接写），下面是照片本身。
 */
export function Album() {
  const photos = useAlbumStore((s) => s.photos);
  const add = useAlbumStore((s) => s.add);
  const update = useAlbumStore((s) => s.update);
  const remove = useAlbumStore((s) => s.remove);
  const inputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const anchor = photos.length > 0 ? new Date(photos[0].at) : new Date();
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayMarks = useMemo(
    () => new Set(photos.map((p) => dayKeyOf(p.at))),
    [photos],
  );

  const visible = useMemo(
    () => (dayFilter ? photos.filter((p) => dayKeyOf(p.at) === dayFilter) : photos),
    [photos, dayFilter],
  );

  // 按天分组（列表视图 / 索引）
  const groups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of visible) {
      const k = dayKeyOf(p.at);
      const list = map.get(k);
      if (list) list.push(p);
      else map.set(k, [p]);
    }
    return [...map.entries()];
  }, [visible]);

  const open = photos.find((p) => p.id === openId) ?? null;

  // 日期条默认停在今天附近：翻到本月最后，不用从 1 号一路划过去。
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const now = new Date();
    if (now.getFullYear() === year && now.getMonth() === month) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [year, month, photos.length]);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files).slice(0, 12)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToDataUrl(f);
        add({ dataUrl, caption: "" });
      } catch {
        /* 忽略单张失败 */
      }
    }
  };

  return (
    <div className="album-page editorial-page relative flex h-full flex-col overflow-hidden">
      <header className="px-5 pt-5">
        <BackButton />
      </header>

      {/* 标题：September | 2026 · KEEPSAKES */}
      <div className="album-heading relative px-5 pt-4">
        <div className="album-edition-line"><span>THE KEEPSAKE JOURNAL</span><span>VOL. 01　/　PRIVATE COLLECTION</span></div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-2.5">
              <h1 className="album-title serif-display text-[29px] leading-none text-ink">
                {MON_FULL[month]}
              </h1>
              <span className="mt-1 h-[22px] w-px flex-none bg-[var(--line-strong)]" />
              <span className="serif-display mt-[3px] text-[23px] leading-none text-ink-soft">
                {year}
              </span>
            </div>
            <p className="mt-3 text-[9px] uppercase tracking-[0.24em] text-ink-ghost">
              Keepsakes · {photos.length} 瞬
            </p>
          </div>

          <div className="flex flex-none items-center gap-1.5 pb-1">
            <ViewButton
              active={view === "list"}
              label="按天看"
              onClick={() => setView("list")}
            >
              <IconList width={15} height={15} />
            </ViewButton>
            <ViewButton
              active={view === "grid"}
              label="网格看"
              onClick={() => setView("grid")}
            >
              <IconGrid width={15} height={15} />
            </ViewButton>
            <button
              onClick={() => inputRef.current?.click()}
              aria-label="添加照片"
              className="press ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_10px_22px_-12px_rgba(226,96,95,0.8)]"
            >
              <IconPlus width={16} height={16} />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />

      {/* 日期条 */}
      {photos.length > 0 && (
        <div ref={stripRef} className="scroll-x mt-4 flex gap-0.5 px-4">
          <button
            onClick={() => setDayFilter(null)}
            aria-pressed={!dayFilter}
            className="day-chip"
            data-on={!dayFilter}
            data-plain="true"
          >
            <span className="dd">ALL</span>
            <span className="dot off" />
          </button>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const k = `${year}-${pad(month + 1)}-${pad(d)}`;
            return (
              <button
                key={d}
                onClick={() => setDayFilter((v) => (v === k ? null : k))}
                aria-pressed={dayFilter === k}
                className="day-chip"
                data-on={dayFilter === k}
                data-plain="true"
              >
                <span className="dd">{d}</span>
                <span className={`dot${dayMarks.has(k) ? "" : " off"}`} />
              </button>
            );
          })}
        </div>
      )}

      {/* 照片 */}
      <div className="scroll-area mt-4 min-h-0 flex-1 px-4 pb-10">
        {dayFilter && (
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="num text-[11px] text-ink-faint">
              {dayFilter.replace(/-/g, ".")} · {visible.length} 张
            </span>
            <button
              onClick={() => setDayFilter(null)}
              className="press text-[11.5px] text-[var(--accent)]"
            >
              全部
            </button>
          </div>
        )}
        {photos.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-10 flex w-full flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--line-strong)] py-20 text-ink-faint"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)]">
              <IconImages width={25} height={25} />
            </span>
            <span className="album-empty-kicker">A COLLECTION BEGINS HERE</span>
            <strong className="album-empty-title">把值得记住的，留在这里。</strong>
            <span className="text-[12px]">添加第一张照片，开启你的私人珍藏。</span>
          </button>
        ) : visible.length === 0 ? (
          <div className="px-2 py-20 text-center">
            <p className="serif-display text-[16px] text-ink-soft">这天没有照片。</p>
            <button
              onClick={() => setDayFilter(null)}
              className="press mt-3 text-[12.5px] text-[var(--accent)]"
            >
              看全部 ›
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="columns-2 gap-2.5">
            {visible.map((p) => (
              <figure key={p.id} className="album-photo-card mb-2.5 break-inside-avoid">
                <button
                  onClick={() => setOpenId(p.id)}
                  className="album-thumb press block w-full overflow-hidden"
                >
                  <img
                    src={p.dataUrl}
                    alt={p.caption || "照片"}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </button>
                <figcaption className="album-photo-caption">
                  <span>{p.caption.trim() || "未题名的瞬间"}</span>
                  <time>{stamp(p.at).slice(0, 10)}</time>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div>
            {groups.map(([k, list]) => (
              <section key={k} className="mb-6">
                <div className="mb-2 flex items-baseline gap-2.5 px-1">
                  <span className="serif-display text-[19px] leading-none text-ink">
                    {k.slice(8)}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-ink-ghost">
                    {MON_FULL[Number(k.slice(5, 7)) - 1].slice(0, 3)}
                  </span>
                  <span className="flex-1" />
                  <span className="num text-[10px] text-ink-faint">{list.length} 张</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOpenId(p.id)}
                      className="press flex items-center gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-2 text-left"
                    >
                      <img
                        src={p.dataUrl}
                        alt={p.caption || "照片"}
                        className="h-14 w-14 flex-none rounded-[10px] object-cover"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">
                          {p.caption || "没有写说明"}
                        </span>
                        <span className="num mt-1 block text-[10.5px] text-ink-faint">
                          {stamp(p.at).slice(11)}
                        </span>
                      </span>
                      <IconChevron width={14} height={14} className="text-ink-ghost" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* 想留下的 */}
      {open && (
        <Keepsake
          photo={open}
          index={photos.findIndex((p) => p.id === open.id)}
          total={photos.length}
          onSave={(caption) => update(open.id, { caption })}
          onClose={() => setOpenId(null)}
          onDelete={() => {
            if (window.confirm("删掉这张照片？")) {
              remove(open.id);
              setOpenId(null);
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------------- 想留下的：纸卡 ---------------- */

function Keepsake({
  photo,
  index,
  total,
  onSave,
  onClose,
  onDelete,
}: {
  photo: Photo;
  index: number;
  total: number;
  onSave: (caption: string) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(photo.caption);
  const [zoom, setZoom] = useState(false);

  const close = () => {
    onSave(draft.trim());
    onClose();
  };

  return (
    <Portal>
      <div
        className="keepsake-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px]"
        onClick={close}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="keepsake keepsake-sheet-enter reader-sheet flex max-h-[92vh] w-full max-w-[600px] flex-col rounded-t-[24px] px-4 pb-5 pt-3.5"
        >
          {/* 元信息 */}
          <div className="flex items-center gap-2 px-0.5">
            <span className="text-[10px] tracking-[0.18em] text-[var(--accent)]">
              想留下的
            </span>
            <span className="num text-[9.5px] tracking-[0.1em] text-ink-ghost">
              NO. {total - index}
            </span>
            <span className="num text-[10px] text-ink-faint">{stamp(photo.at)}</span>
            <span className="flex-1" />
            <button
              onClick={() => setZoom(true)}
              className="press flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] text-ink-soft"
            >
              zoom in ↗
            </button>
          </div>

          <div className="scroll-area mt-4 min-h-0 flex-1">
            {/* 说明：无框，直接写 */}
            <div className="keepsake-body pl-3.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="写一句，留给以后。"
                className="serif-display w-full resize-none bg-transparent text-[16px] leading-[1.95] text-ink outline-none placeholder:text-ink-ghost"
              />
            </div>

            <button
              onClick={() => setZoom(true)}
              className="album-thumb press mt-3 block w-full"
            >
              <img
                src={photo.dataUrl}
                alt={photo.caption || "照片"}
                className="max-h-[52vh] w-full object-cover"
              />
            </button>

            <div className="mt-3 flex items-center gap-3 px-0.5">
              <button
                onClick={onDelete}
                className="press text-[11.5px] text-ink-faint"
              >
                删掉
              </button>
              <span className="flex-1" />
              <span className="text-[10px] text-ink-ghost">
                写完点卡片外面保存
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 放大看：黑底、整张、不再裁 */}
      {zoom && (
        <div
          className="keepsake-zoom fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-2"
          onClick={() => setZoom(false)}
        >
          <img
            src={photo.dataUrl}
            alt={photo.caption || "照片"}
            className="max-h-full max-w-full object-contain"
          />
          <button
            onClick={() => setZoom(false)}
            aria-label="关闭"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>
      )}
    </Portal>
  );
}

/* ---------------- 小件 ---------------- */

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`press flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors ${
        active
          ? "bg-[var(--ink)] text-[color:var(--bg)]"
          : "border border-[var(--line)] text-ink-faint"
      }`}
    >
      {children}
    </button>
  );
}

function IconGrid(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </svg>
  );
}

function IconList(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <rect x="4" y="5" width="16" height="5" rx="1.6" />
      <rect x="4" y="14" width="16" height="5" rx="1.6" />
    </svg>
  );
}
