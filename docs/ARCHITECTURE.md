# 镜花水月技术架构

> 版本：1.0-draft  
> 决策：固定一位 AI 伴侣；本地优先；GitHub Pages 继续承担静态前端托管。  
> 状态：基于当前 main 只读审计形成的目标架构，尚未改变运行时代码。

## 1. 产品边界

镜花水月是一个主人与唯一 AI 伴侣共同生活的私人居所。应用不提供现实用户之间的好友、邀请、多租户或多人协作模型。

- 一个本地主人档案（owner）。
- 一个稳定的伴侣身份（companion），身份 ID 固定；姓名、头像、人格设定可版本化修改。
- 一条持续关系档案（relationship）。
- 多个空间模块共享同一套数据与关系上下文。
- 可更换模型服务商，但不能因此重建伴侣身份或清空关系记忆。

## 2. 部署与信任边界

当前项目为 React 18 + TypeScript + Vite 静态前端，发布到 GitHub Pages。它没有可托管秘密的服务端。

### 本地可信数据
- IndexedDB：结构化记录和较大的二进制 Blob。
- localStorage：少量偏好、UI 状态、兼容期的旧 Zustand 持久化数据。
- API 凭据：当前设计为仅存在运行时内存，不持久化；刷新后需要重新输入。

### 外部数据流
- 在线模型请求：只有构造请求所需的最小上下文离开设备。
- 未来图片生成、MCP 或其他连接器：逐项授权，明确展示会发送的数据和权限。
- 静态 Pages 不提供安全的 API Key 代理。不能把密钥写进 Vite 环境变量、前端 bundle、公开仓库或 localStorage。若需要隐藏服务商密钥，应增加独立受控代理；本地优先不等于请求内容永远不离开设备。

## 3. 目标分层

```
Pages UI / React routes
        |
Feature modules (chat, memories, journals, media, activities, life)
        |
Application services (use cases, validation, relationship context)
        |
Repositories (typed interfaces; no UI access to raw storage)
        |
Storage adapters
  - IndexedDB / Dexie: durable structured records + Blob
  - localStorage: small settings and migration compatibility
        |
External adapters (model provider, image provider, connectors)
```

规则：
1. 页面和 Zustand UI store 不直接拼装 IndexedDB 查询。
2. 新功能通过 repository / service 读写。
3. Dexie 是本地结构化数据的首选；当前项目已经依赖 Dexie 4，不另换数据库库。
4. 迁移必须有版本号、可重复执行保护、备份前置和完整性校验。
5. 不在第一阶段把所有旧 store 一次性搬迁。

## 4. 目标模块

- identity：owner、companion、persona revisions、preferences、boundaries。
- relationship：唯一关系档案、里程碑、约定。
- conversations：会话、消息、消息 parts、附件引用。
- memories：记忆条目、来源链接、确认状态、摘要、召回记录。
- collections：日记、动态、收藏。
- media：资产元数据、Blob、相册与资产关联。
- activities：旅行、音乐、共读观影及其关联。
- life：日历、睡眠/健康（明确为用户自行记录）、真实账目。
- system：外观、模型非敏感配置、连接器授权、备份元数据、用量统计。

## 5. 单一伴侣模型

companion 使用稳定固定 ID（例如 `companion:primary`），不提供 companion 列表或切换功能。persona 的每次修改新增 revision，当前版本通过 currentRevision 指向。

现有 projects 里的多个人设属于历史功能。迁移期不删除、不覆盖；后续应将其解释为对话语境/提示词模板，不能再把它们表现成不同的 AI 伴侣。默认语境合并到唯一伴侣人格前，先让用户确认冲突内容。

## 6. 当前代码审计结论

- React 18、TypeScript、Vite；Zustand 5；Dexie 4.2 已安装。
- IndexedDB 数据库为 `co-space::v1`，目前只有 memories、echoes、imprints 三张表，Dexie schema version 2。
- IndexedDB 通过 `src/lib/db/client.ts` + `worker.ts` 在 Web Worker 读写，Worker 不可用时回退主线程。
- chat、life、diary、album、theme、connector、presence、content、projects 等 Zustand store 使用 localStorage。
- 相册图片当前以 dataURL 存在 `co-space::album` localStorage，需迁移到 Blob 存储，迁移前必须保留旧数据。
- chat 当前把消息数组保存在 `co-space::chat` localStorage，尚无独立 sessions/messages 表。
- diary 以 `co-space::diary` 保存日记、批注和 activeBookId；Books 当前不是在 partialize 中持久化。
- API Key 当前只保存在 connector store 内存，持久化时被 partialize 排除；`hasKey` 持久化为 false。
- 当前 README 声明没有真实模型接入、没有备份；聊天回应由本地 mock 层生成。
- `projectsStore` 预置多个不同人格项目，与“固定一位 AI 伴侣”新决策存在产品语义冲突，迁移时保留数据并改为语境模板。
- `seedIfEmpty` 以 localStorage 标记控制示例数据初始化，标记先于全部写入；初始化中途失败可能造成种子不完整，需要后续修复为事务/完成标记策略。
- life store 的初始化包含示例账目、睡眠、待办等内容。需要区分演示种子与用户真实记录，不能把演示数据当成真实用户生活事实。

## 7. 非目标（第一阶段不做）

- 多个 AI 伴侣、真实用户社交、好友/邀请系统。
- 云端账号系统和自动多设备同步。
- 一开始就引入向量数据库。
- 将所有旧 localStorage store 一次性删除。
- 把 API Key 写进静态前端长期保存。

## 8. 实施顺序

1. 备份与审计工具（只读检查、导出、存储计数）。
2. 统一 repository 接口和 Dexie schema v3（新增表，不改旧表语义）。
3. 单一 owner / companion / relationship 档案初始化。
4. 新聊天存储与旧 chat localStorage 双读/迁移。
5. memory 来源关系与用户确认机制。
6. 媒体 Blob 存储迁移。
7. 日记、生活数据逐模块迁移。
8. 备份恢复和可选加密导出。

每一步独立 PR、构建检查、数据兼容测试；未经备份和验证不得清理旧键。
