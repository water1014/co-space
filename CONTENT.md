# 改内容指南

这个项目现在是**框架**。所有"看得见的字"都从 `src/content/index.ts` 一个文件出来，
你改文案不用碰任何逻辑代码。

---

## 一、改文案：只动 `src/content/index.ts`

这个文件按 11 节组织，每节都写了"它出现在哪"：

| 节 | 内容 | 出现在 |
|---|---|---|
| 1 `PEOPLE` | 两个人的名字 | 记录的小圆点旁、署名、AI 的称呼 |
| 1 `HOME_*` | 首页眉题、引言、页脚 | 首页顶部 |
| 2 `NAV_LABELS` / `MORE_LABELS` | 底部导航文字 | 底部 Tab 栏、More 抽屉 |
| 3 `PAGE_TITLES` | 各页页头 | 六个页面的页头 |
| 4 `ROOMS` | **七个房间**：emoji、名称、口号 | Together 页顶部 pill + 猫旁边那句 |
| 5 `ROOM_COPY` | 房间内的栏目名、占位符、空态 | Together 各房间内部 |
| 5 `MEAL_LABEL` | 早饭/午饭/晚饭 | 三餐房、首页打卡按钮 |
| 5 `LEDGER_CATEGORIES` | 记账分类 | 记账房 |
| 6 `WORD_BOOK` | **词表** | 单词房、每日一词 |
| 6 `DAILY_WORD_PROMPT` / `QUIZ_PROMPT` | 考单词时的措辞 | 聊天里"考我单词"、每日主动提问 |
| 7 `PERSONA_DEFAULT` | **它的人设**（system prompt） | 每次对话前读它 |
| 7 `INITIATIVE_LINES` | 主动开口的两句话 | 它主动找你说话时 |
| 8 `REPLY_TEMPLATES` | 对话回应模板 | 本地回应层的所有回复 |
| 9 `EMPTY_STATES` | 空态文案 | 聊天、记忆、日记的空页面 |
| 10 `BOUNDARY_COPY` | 边界规则说明 | 设置页的关系设定区 |
| 11 各种 `*Seed` | **首屏示例数据** | 第一次打开时的记录/对话/日记/词书 |

### 模板里的占位符

回应模板用 `{xxx}` 占位，改的时候别删：

```
REPLY_TEMPLATES.sleepShort     → {hours}
REPLY_TEMPLATES.bobaOver       → {you}
REPLY_TEMPLATES.generic        → {input}
REPLY_TEMPLATES.recorded       → {what}
REPLY_TEMPLATES.showRecords    → {meals} {boba} {sleep} {spend} {count} {summary}
DAILY_WORD_PROMPT              → {word} {phonetic}
QUIZ_PROMPT                    → {word} {phonetic}
```

---

## 二、改数据：改 `src/content/` 里的 Seed

想把初始状态改成你自己的：

- `chatSeed` —— 首屏那段示例对话。想清空就设成 `[]`。
- `diarySeed` —— 初始日记。`daysAgo: 0` 是今天。
- `bookSeed` —— 日记页那本内置书，`paragraphs` 是段落，划线批注按段落定位。
- `todoSeed` —— 初始待办。
- `rewardSeed` —— 初始奖惩卡。
- `wrongWordSeed` —— 初始错词。

> 注意：这些只在**第一次打开**时生效（写入 localStorage）。
> 想看新效果，在设置页最下面清空数据，或浏览器里清掉 `co-space::*` 这几个键。

---

## 二之二、运行时改：设置页的「文案」区

不想重新构建的话，直接改**设置页 → 文案**那一段，改完立刻生效：

| 能改的东西 | 对应默认值 |
|---|---|
| 首页引言 | `HOME_QUOTE` |
| 引言署名 | `QUOTE_AUTHOR` |
| 主动开口 · 深夜 / 平常 | `INITIATIVE_LINES.late` / `.quiet` |
| 七个房间的**名字**与**口号** | `ROOMS[].label` / `.slogan` |
| 六个页面的**标题** | `PAGE_TITLES` |

规则：

- **输入框里是空的** = 用默认值。输入框里的灰色字就是默认值的样子。
- 改动存在浏览器 localStorage 的 `co-space::content` 键里，换设备不会同步。
- 底部有「恢复默认」按钮，一键清空所有覆盖。

> 覆盖层只包含上面这几类。想改更细的文案（对话模板、词表、空态、边界说明），
> 还是去 `src/content/index.ts` 改，那里才是全部文案的出处。

**优先级**：`src/content/index.ts` 的默认值 < 设置页的运行时覆盖。

---

## 三、改逻辑：才动这些地方

| 目录 | 管什么 |
|---|---|
| `src/pages/` | 六个页面的布局与交互 |
| `src/stores/` | 数据与持久化（localStorage / IndexedDB） |
| `src/lib/` | 对话流程、边界拦截、生活数据推导 |
| `src/components/` | 视觉组件 |
| `src/styles.css` | 主题变量、配色、字体 |

---

## 四、几个容易踩的点

**1. 改了文案但页面没变？**
两种可能：
- 改的是 `src/content/index.ts` → 刷新页面（`npm run dev` 时是热更新，不用重启）。
- 改的是设置页的「文案」区 → 已经即时生效了，但如果页面文字没变，
  检查一下是不是被 `co-space::content` 里存的旧覆盖挡住了，点「恢复默认」再试。

**2. 换名字后它还是叫旧名字？**
`PEOPLE.yan` 是 AI 本身。`connectorStore` 里存的 `persona` 会覆盖 `PERSONA_DEFAULT`，
去设置页改，或者清 localStorage 重新初始化。

**3. 加了新字段？**
store 加了字段就要在 `persist` 的 `version` 上加一，并在 `migrate` 里补默认值，
否则老用户的数据会缺字段（app 会崩）。

**4. 词表怎么分组？**
每 8 个词一组（`Math.floor(i / 8) + 1`）。想改分组大小，改
`src/lib/life/derive.ts` 里的 `dueWords`。

**5. 模板里的 `\n`**
在 TS 字符串里换行写 `\n`，界面才会换行。写在 JSON 里要用 `\\n`。

---

## 五、开发

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建到 dist/
npm run preview  # 预览构建结果
```

改完 `src/content/index.ts` 后刷新页面即可，不需要重启 dev server。
