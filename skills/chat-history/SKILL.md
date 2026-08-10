---
name: chat-history
description: 读取 Claude Code 与 Codex 自己的历史聊天记录。当用户提到"上个会话/之前的对话聊了什么"、"继续上次的话题"、"列出历史会话"、"找某天/某段时间的会话"、"搜索以前聊过的内容"、"读取某个会话的部分内容"时使用。支持列出、按时间和项目筛选、关键词搜索、局部读取（head/tail/区间/按角色）。
---

# chat-history — 读取 CC / Codex 历史会话

Claude Code 与 Codex 的聊天记录都以 JSONL 落盘在本机，本技能通过自带脚本统一读取两者。

**统一入口**（零依赖，仅 Node.js 内置模块，跨平台 macOS / Linux / Windows）：

```bash
node {本技能目录}/scripts/chat_history.js <子命令> [选项]
```

> 下文以 `chat_history.js` 代指上面的完整命令。脚本路径相对于本 SKILL.md 所在目录。

## 何时用哪个子命令

| 用户意图 | 命令 |
|---|---|
| "上个会话聊了什么" | `chat_history.js last`（默认当前目录项目，显示最后 20 条） |
| 列出所有/某项目/某时间段的会话 | `chat_history.js list [--cwd] [--project X] [--since ... --until ...]` |
| 找以前聊过某话题的会话 | `chat_history.js search "关键词" [--content]` |
| 读某个会话（全部或部分） | `chat_history.js show <id前缀> [--head/--tail/--range/--role]` |

## 子命令速查

```bash
# 列出会话（默认两个来源都列，按最近活动倒序）
chat_history.js list --cwd --limit 10            # 当前项目最近 10 个
chat_history.js list --source codex --since 2026-06-01 --until "2026-06-10 18:00"
chat_history.js list --project new-api           # 项目路径子串匹配

# 读取会话内容（id 支持前缀匹配）
chat_history.js show 0ff7c0f9 --tail 10          # 最后 10 条消息
chat_history.js show 0ff7c0f9 --head 5           # 前 5 条
chat_history.js show 0ff7c0f9 --range 3:8        # 第 3~8 条（1 起始，闭区间）
chat_history.js show 0ff7c0f9 --role user        # 只看用户提问
chat_history.js show 0ff7c0f9 --range 3:3 --full # 某条消息全文（默认单条截断 800 字符）
chat_history.js show 0ff7c0f9 --tools            # 连工具调用一起显示

# 搜索（默认只搜"用户提问"索引，很快；--content 全文搜索，较慢）
chat_history.js search "读写分离"
chat_history.js search "billing" --content --project new-api --since 2026-05-01

# 上一个会话（自动跳过最近 120 秒内仍在写入的"当前会话"）
chat_history.js last                              # 当前目录项目的上一个会话
chat_history.js last -n 2 --tail 30               # 上上个会话，看最后 30 条
chat_history.js last --project VibeProxy --role user
```

## 使用建议（重要）

- 会话可能非常大（几 MB），**永远先 `list`/`search` 定位，再用 `show` 的 `--tail/--range/--role` 局部读取**，不要直接 `cat` 原始 JSONL。
- 默认单条消息截断到 800 字符；确认是目标内容后再 `--full` 看全文。
- `last` 的 `--grace`（默认 120 秒）用于跳过"正在进行中的当前会话"；如果刚结束的会话被误跳过，可加 `--grace 0`。
- 时间过滤接受 `YYYY-MM-DD`、`YYYY-MM-DD HH:MM`。
- 输出中的 `[claude]` / `[codex]` 标明来源，`--source claude|codex` 可只看一边。

## 底层存储格式（脚本不够用时，可直接用 jq/grep 做自定义查询）

### Claude Code（`~/.claude`）

- **会话文件**：`~/.claude/projects/<项目路径转横线slug>/<会话UUID>.jsonl`
  - 每行一个 JSON：`type` 为 `user` / `assistant` 时是对话消息，消息体在 `.message.content`（字符串或 `[{type:"text",text:...}, {type:"tool_use",...}]` 数组）；
  - 其他行类型（`system`、`attachment`、`file-history-snapshot`、`permission-mode` 等）是元数据；
  - 关键字段：`.timestamp`（ISO 时间）、`.cwd`、`.sessionId`、`.isSidechain`（true = 子代理对话）。
- **全局索引**：`~/.claude/history.jsonl` — 每条用户提问一行：`{display, timestamp(毫秒), project, sessionId}`。
- 当前会话 = 当前项目目录下 mtime 最新、仍在增长的那个 jsonl。

### Codex（`~/.codex`）

- **会话文件**：`~/.codex/sessions/YYYY/MM/DD/rollout-<ISO时间>-<UUID>.jsonl`（文件名自带开始时间）
  - 首行 `type:"session_meta"`，`payload.cwd` 是项目目录；
  - 对话内容优先看 `type:"event_msg"` 且 `payload.type` 为 `user_message` / `agent_message` 的行（`payload.message` 为纯文本）;
  - `type:"response_item"` 的 `message`/`reasoning`/`function_call` 行是底层模型流水（含注入的环境上下文，需过滤 `<environment_context>` 等）。
- **标题索引**：`~/.codex/session_index.jsonl` — `{id, thread_name, updated_at}`。
- **提问索引**：`~/.codex/history.jsonl` — `{session_id, ts(秒), text}`。

## 安装

把本目录整个拷贝到对应工具的 skills 目录即可：

```bash
# Claude Code
cp -r chat-history ~/.claude/skills/

# Codex（支持 SKILL.md 格式的版本）
cp -r chat-history ~/.codex/skills/
```
