# 镜花水月数据结构规范

> 目标决策：唯一 AI 伴侣、本地优先。  
> 规范草案：所有时间戳统一使用 Unix 毫秒（与现有数据兼容）；对外 JSON 导出可使用 ISO 8601 字符串。

## 1. 通用字段

新建的持久化记录建议具备：

```ts
interface BaseRecord {
  id: string;             // 稳定、不可复用
  createdAt: number;      // Unix milliseconds
  updatedAt: number;
  schemaVersion: number;  // 记录结构版本
}
```

可选字段按实际需要加入 `deletedAt`（软删除）、`sourceType/sourceId`（来源）和 `visibility`。不要为了统一而给每条旧记录强行补齐会改变语义的字段。

## 2. 核心表（目标）

| 表 | 主键 | 关键字段 | 索引建议 |
|---|---|---|---|
| owners | id | nickname, avatarAssetId, preferences | id |
| companions | id | name, avatarAssetId, currentPersonaRevisionId | id |
| personaRevisions | id | companionId, version, personality, speakingStyle, values, boundaries | companionId, version |
| relationships | id | ownerId, companionId, startAt, status | ownerId, companionId |
| relationshipMilestones | id | relationshipId, title, happenedAt, description | relationshipId, happenedAt |
| promises | id | relationshipId, content, status, dueAt | relationshipId, status |
| chatSessions | id | title, createdAt, updatedAt, archivedAt | updatedAt, archivedAt |
| chatMessages | id | sessionId, role, parts, createdAt, status, origin | sessionId, createdAt |
| memories | id | text, kind, tags, sourceType, sourceId, reviewStatus, importance, pinned, resolved | createdAt, reviewStatus, kind |
| memoryLinks | id | memoryId, targetType, targetId, relation | memoryId, targetType+targetId |
| memorySummaries | id | summaryType, content, updatedAt, sourceWatermark | summaryType, updatedAt |
| memoryRecallLogs | id | query, hit, score, nearMemoryId, createdAt | createdAt |
| journals | id | dateKey, title, content, mood, createdAt, updatedAt | dateKey, updatedAt |
| moments | id | content, authorType, createdAt | createdAt |
| mediaAssets | id | blob, mimeType, size, width, height, caption, createdAt | createdAt, mimeType |
| albums | id | title, description, coverAssetId | createdAt |
| albumItems | id | albumId, assetId, sortOrder | albumId, sortOrder, assetId |
| activities | id | type, title, status, startedAt, endedAt, description | type, startedAt |
| activityLinks | id | activityId, targetType, targetId | activityId, targetType+targetId |
| calendarEvents | id | title, startsAt, endsAt, eventType, sourceType, sourceId | startsAt, eventType |
| ledgerEntries | id | amount, currency, category, note, happenedAt | happenedAt, category |
| settings | key | value, updatedAt | key |
| apiUsage | id | provider, model, inputTokens, outputTokens, estimatedCost, createdAt | createdAt, provider |

## 3. 固定身份约束

- 唯一 companion 的固定主键：`companion:primary`。
- 唯一 relationship 的固定主键：`relationship:primary`。
- 不以名字关联；名字可以随时修改。
- persona 修改写入新 revision，保留历史版本。
- model provider / model id 不属于 companion identity；更换模型不更换伴侣。
- 当前 projectsStore 的多个 persona 项目应迁移为 contextProfiles（语境模板），不能转化为多伴侣。

## 4. 记忆状态与来源

```ts
type MemoryKind =
  | "personal_fact"
  | "personal_preference"
  | "shared_event"
  | "relationship"
  | "promise"
  | "milestone";

type MemoryReviewStatus =
  | "suggested"
  | "confirmed"
  | "rejected";

type MemorySourceType =
  | "conversation"
  | "journal"
  | "activity"
  | "manual"
  | "reflection";
```

一条长期记忆至少要区分：
- 内容是什么；
- 谁/什么来源产生；
- 来源记录的 ID（如果存在）；
- 是否由用户确认；
- 重要程度和是否固定；
- 创建/更新日期。

模型推测不得直接写成 confirmed。普通消息留在聊天历史；记忆建议需要用户确认。拒绝的建议应记录状态，避免反复提示同一内容。

## 5. 消息模型

保留现有 ChatMessage 的 parts 结构，逐步迁移为 chatMessages：

```ts
type ChatRole = "user" | "assistant" | "system" | "tool";
interface ChatMessageRecord extends BaseRecord {
  sessionId: string;
  role: ChatRole;
  parts: MessagePart[];
  status: "streaming" | "complete" | "cancelled";
  origin: "user" | "initiative" | "reply" | "tool";
}
```

会话和消息分表，避免每次流式增量都重写 localStorage 里的完整消息数组。迁移需保持旧消息 ID、parts、createdAt、role、status、origin 和 boundary 数据。

## 6. 媒体模型

图片文件本体保存为 IndexedDB Blob；mediaAssets 保存 MIME、大小、尺寸、说明和时间。相册、日记、旅行和记忆只引用 asset ID。不要把 dataURL 当长期媒体存储格式。

## 7. 现有生活数据映射（仅作为候选）

| 现有字段 | 目标位置 |
|---|---|
| life.anniversary | relationships.startAt |
| life.meals / mealNotes / mealBy | lifeLogs（需保留 dateKey 与 by） |
| life.sleep | healthLogs |
| life.ledger | ledgerEntries |
| life.bobas / bobaBudget / bobaQuota | agreements + quotaLogs（不是一般消费重复入账） |
| life.todos / rewards | tasks / relationship commitments（逐项判断语义） |
| life.words / wordBook / wrongWords | learning records |
| life.currentSong / listeningTime | music activity state |
| diary.entries | journals |
| diary.annotations / books | reading annotations / reading resources |
| album.photos.dataUrl | mediaAssets Blob + albumItems |
| memoryStore.memories | memories |
| memoryStore.echoes | memoryRecallLogs |
| memoryStore.imprints | mediaAssets + keepsake metadata（迁移前核对真实数据形状） |
| projectsStore.projects | contextProfiles（保留原始数据和内容） |

## 8. 删除与关联规则

- 删除相册条目不自动删除被日记/旅行引用的 mediaAsset。
- 删除来源记录时，先检查 memoryLinks/activityLinks；由用户决定解除引用还是连同记忆删除。
- 删除聊天消息不自动删除已确认的独立长期记忆。
- 删除长期记忆不删除原始聊天。
- 删除账户/清空全部数据必须经过二次确认并提供导出入口。

## 9. 不应做的事

- 不把 API 调用费用混入真实账本。
- 不把 API key 写入 settings 表。
- 不将模型生成的推断当作个人事实。
- 不复制照片文件到多个模块。
- 不在迁移时重写用户已有 ID 或时间戳。
