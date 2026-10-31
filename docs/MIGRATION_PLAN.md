# 旧数据兼容与迁移计划

> 本文依据 main 当前源码只读审计形成。本文不执行迁移，也不修改浏览器数据。

## 1. 已确认的存储清单

### IndexedDB
数据库：`co-space::v1`（Dexie）。

Dexie schema：
- v1：`memories`
- v2：`memories`、`echoes`、`imprints`

Worker 通道：`src/lib/db/client.ts` → `src/lib/db/worker.ts` → `src/lib/db/repo.ts`。Worker 不可用时回退主线程直连。

### localStorage
已确认 Zustand persist 键：
- `co-space::chat`：聊天消息数组；仅持久化 messages。
- `co-space::life`：生活状态（周年日期、饮食、睡眠、账目、奶茶、词库、待办、奖励、播放状态等）。
- `co-space::diary`：entries、annotations、activeBookId；books 不在 partialize 中。
- `co-space::album`：照片数组，Photo.dataUrl。
- `co-space::theme`：主题和外观偏好。
- `co-space::connector`：连接器开关、persona、model 配置；sessionKey 不持久化，model.hasKey 持久化为 false。
- `co-space::presence`：energy、mood、lastInteractionAt。
- `co-space::content`：界面文案覆盖。
- `co-space::projects`：多个项目/语境及 personaMd。
- `co-space::seeded`：IndexedDB 示例数据初始化标记。

注意：localStorage 实际容量有限。相册 dataURL 会放大体积，需先统计现存数据量，不能直接批量搬迁后再删除旧键。

## 2. 已识别风险

1. **种子数据误作真实数据**：lifeStore 初始化包含预置账目、睡眠、奶茶、待办等样例；diaryStore 首次 load 也生成示例日记/批注；memory seed 包含示例记忆和印记。迁移需为演示记录增加来源标记，或由用户确认处理方式，不能自动当成真实生活事实。
2. **seed 标记时序**：seedIfEmpty 在写入前设置 `co-space::seeded`。若中途写入失败，后续启动可能跳过剩余种子。修复时需在全部事务成功后才提交完成标记。
3. **相册体积**：dataURL 保存在 localStorage，存在配额和性能风险。目标迁移至 Blob，但需校验每张照片数量、字节、MIME 和可解码性。
4. **聊天数组重写**：当前 chatStore 在 Zustand localStorage 中保存整组 messages；未来改为 session/message 分表，但迁移必须保留流式状态的恢复规则和原消息 ID。
5. **身份语义冲突**：projectsStore 预置多个 persona 项目；用户已经决定固定一位 AI 伴侣。迁移期把项目视为语境模板，原始数据不删除，先选择默认人格合并策略。
6. **日记 Books**：partialize 未持久化 books，当前内置书籍资源由代码 seed 提供；批注仍需保持 bookId 和 paraIndex 关联。
7. **API Key**：connectorStore 当前 sessionKey 仅在内存，刷新失效。迁移不能把它写进 localStorage 或 IndexedDB。
8. **ID 与时间单位**：现有数据混用 string ID 与毫秒时间戳；保留原值，不做无意义重编号或秒/毫秒转换。
9. **清空范围**：dbClient.clearAll 仅清 IndexedDB 三张表，不代表清理所有 localStorage。未来“清空全部”必须明确展示实际清理范围。

## 3. 安全迁移原则

- 先导出备份，备份文件可读且校验通过后才允许迁移。
- 迁移采用新增表/新增字段，不原地破坏旧表。
- 每条迁移记录保留 legacyKey、legacyId 或来源引用。
- 迁移脚本必须幂等：同一批数据重复执行不会生成重复记录。
- 使用迁移批次 ID 和状态记录；失败可继续或回滚。
- 完成后比对每个 store 的数量、ID 集合、抽样正文、图片 Blob 可读性和关联完整性。
- 至少保留一个版本的旧数据副本，直到用户确认新版本无误。
- 不自动清理 localStorage 旧键；单独提供“确认清理旧副本”步骤。

## 4. 建议迁移顺序

1. 只读审计工具：列出键名、字节估算、记录数量；不输出聊天/日记正文到日志。
2. 完整导出：IndexedDB + 所有 co-space localStorage 键 + 媒体数据。
3. 建立 Dexie v3（仅新增 stores）：identity、relationships、chatSessions、chatMessages、memoryLinks、journals、mediaAssets 等。
4. 迁移唯一 owner/companion/relationship：先保存一份未合并的原始 persona 项目快照。
5. 迁移聊天：保留旧消息 ID，全部进入默认会话。
6. 迁移相册：dataURL 解码为 Blob；验证后才允许将来清理旧 dataURL。
7. 迁移日记与批注。
8. 迁移生活记录，并区分用户数据与演示种子。
9. 迁移主题、文案、连接器非敏感设置。
10. 新旧读取结果对照；通过后逐模块切换读写。

## 5. 验收条件

- 迁移前后每个数据集合数量一致（演示数据的明确过滤需单独列出差异）。
- 聊天消息顺序、角色、parts 和时间一致。
- 日记按 dateKey 保留，批注引用的 bookId / paraIndex 有效。
- 每张照片均可解码并可显示；文件大小与 MIME 合理。
- 记忆 pinned / resolved / kind / tags / sourceRef 等状态不丢失。
- 关系日期、饮食、睡眠、账目、待办和额度记录均可读取。
- 导出包可以在空白测试数据库恢复。
- 旧 localStorage 键在用户确认之前仍可读取。
