# 本地备份与恢复规范

> 状态：设计规范；当前项目 README 明确尚无完整备份能力。

## 1. 目标

用户应能在更换设备、清理浏览器或更新应用前，把自己的镜花水月数据完整导出；恢复时先验证，再写入，不覆盖现有数据而不提示。

## 2. 导出格式

建议使用 ZIP 容器，内部 UTF-8 JSON + 原始媒体二进制：

```
jinghua-backup/
  manifest.json
  data/
    identity.json
    relationships.json
    chat-sessions.json
    chat-messages.json
    memories.json
    memory-links.json
    journals.json
    moments.json
    activities.json
    life.json
    settings.json
  media/
    <asset-id>.<ext>
```

manifest 至少包括：
- product、backupFormatVersion、appVersion；
- exportedAt、timezone；
- 数据集合数量；
- 每个媒体文件的相对路径、MIME、字节数和 SHA-256；
- 导出是否包含敏感数据；
- 可选的加密参数元数据（不含密码）。

## 3. 隐私与加密

- 默认导出前显示包含哪些类别：聊天、记忆、日记、照片、健康、账本、设置。
- 支持用户选择导出类别。
- 建议支持客户端密码加密导出；使用 Web Crypto 的标准加密算法，密码不发送到网络。
- 不在备份里包含 API Key、sessionKey、认证令牌。
- 未加密备份应明确提示其中包含私密内容。

## 4. 恢复流程

1. 读取 ZIP 与 manifest。
2. 校验格式版本、文件列表、SHA-256、数据类型和必要字段。
3. 展示预览：各类记录数量、媒体数量、导出日期。
4. 让用户选择合并或覆盖；默认建议合并且按稳定 ID 去重。
5. 写入临时数据库或单一 Dexie transaction。
6. 检查关联完整性；失败则回滚。
7. 成功后更新应用数据版本，保留恢复报告。

## 5. 合并规则

- 同 ID 且内容一致：跳过。
- 同 ID 但内容不同：提供冲突报告，不能静默覆盖。
- 不同 ID 但可能重复：只提示，不自动合并。
- 关联对象缺失：标记为待修复，不能创建伪造数据。
- 删除状态和用户确认状态必须保留。

## 6. 本地优先的现实限制

浏览器存储可能因用户清理站点数据、设备空间不足、浏览器策略或隐私模式而丢失。IndexedDB 不是永久备份。应用可请求持久化存储权限，但不能保证浏览器一定批准；定期导出仍是必要措施。

## 7. 验收测试

- 空白浏览器环境恢复完整备份。
- 错误密码、损坏 ZIP、校验和不符时不写入数据库。
- 恢复中断时原数据仍完整。
- 不包含 API Key。
- 中文文件名、中文内容和大图片正常。
- 合并模式不会生成重复消息或照片。
