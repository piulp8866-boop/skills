# skills — 好用的插件合集

> 本仓库汇总了 Claude Code 中安装的所有插件、技能、钩子和配置信息。
> 导出日期：2026-08-10

---

## 📊 总览

| 类别 | 数量 | 说明 |
|------|------|------|
| 本地自定义 Skills | 3 | 位于 `.claude/skills/`，用户安装 |
| 插件 Skills | 1 | 位于 `.agents/skills/`，含完整资源 |
| Hooks | 1 | `UserPromptSubmit` 事件钩子 |
| Commands | 1 | 自定义 slash 命令 |
| MCP 服务器 | 1 | Figma（待 OAuth 认证） |
| 内建 Skills | ~30 | 平台自带，symlink 管理，未导出 |
| 被阻止插件 | 2 | 测试标记，位于 `plugins/blocklist.json` |

---

## 🔧 本地自定义 Skills

### 1. agent-reach — 互联网调研路由器

- **路径**: `skills/agent-reach/`
- **功能**: 15 平台互联网内容调研，多后端路由
- **覆盖平台**:
  - 🔍 搜索: Exa AI
  - 📱 社交: 小红书、Twitter/X、B站、V2EX、Reddit、Facebook、Instagram
  - 💼 招聘: LinkedIn
  - 💻 开发: GitHub
  - 🌐 网页: Jina Reader、RSS
  - 📺 视频: YouTube、B站、播客（小宇宙）
- **路由方式**: OpenCLI / 各平台 CLI / API 自动切换
- **文件数**: 包含 6 个分类 reference 文档

### 2. chat-history — 聊天历史读取

- **路径**: `skills/chat-history/`
- **功能**: 读取 Claude Code 和 Codex 的历史聊天记录
- **支持操作**:
  - `list` — 按项目/时间/来源列出会话
  - `show` — 读取指定会话（head/tail/区间/按角色）
  - `search` — 关键词搜索
  - `last` — 读取最近会话
- **技术**: Node.js，零外部依赖
- **数据源**: `~/.claude/projects/`（CC）+ `~/.codex/sessions/`（Codex）

### 3. penguin-vision — 视觉理解回退

- **路径**: `skills/penguin-vision/`
- **功能**: 通过 Hermes Penguin Vision API 为纯文本模型提供图片识别能力
- **技术**: Python 脚本（httpx + yaml），约 215 行
- **配置来源**: `~/.hermes/config.yaml`（`auxiliary.vision.*`）
- **支持输入**: 本地图片、URL、Data URL、Claude transcript 中的图片

---

## 📦 插件 Skills

### 4. html-ppt — HTML 演示文稿生成器

- **路径**: `plugins/html-ppt/`
- **功能**: 从文本/Markdown 内容生成精美的 HTML 演示文稿
- **特性**:
  - 🎨 35+ 主题（赛博朋克、极简白、东京之夜、蒸汽波等）
  - ✨ 丰富的 CSS 动画效果
  - ⌨️ 键盘导航（方向键、空格、Esc 概览模式）
  - 📱 响应式设计
  - 📝 演讲者备注（按 N 切换）
  - 🖥️ 全屏模式
- **架构**: 单文件自包含 HTML（无外部依赖）
- **文件数**: 633+（主题 CSS、动画脚本、参考文档、示例）

---

## 🪝 Hooks

### penguin-vision-autohint

- **路径**: `hooks/penguin-vision-autohint.mjs`
- **触发事件**: `UserPromptSubmit`
- **功能**: 自动检测用户输入中的视觉关键词，智能路由视觉请求
- **逻辑**:
  1. 检测是否为视觉相关 prompt（图片/截图/OCR 等关键词）
  2. 非视觉 prompt → 注入路由策略提示
  3. 视觉 prompt + Claude 原生视觉模型 → 优先原生视觉，失败则回退 Penguin
  4. 视觉 prompt + 纯文本模型 → 自动预运行 Penguin Vision，结果直接注入上下文
- **运行环境**: WSL Node.js（`/home/user0286/.claude/hooks/`）

---

## ⌨️ Commands

### html-ppt

- **路径**: `commands/html-ppt.md`
- **类型**: 自定义 slash 命令
- **用途**: 快速生成 HTML 演示文稿

---

## 🌐 MCP 服务器

| 名称 | 状态 | 认证方式 | 用途 |
|------|------|---------|------|
| Figma | 已安装，待认证 | OAuth 2.0 | Figma 设计文件读写 |

详细 MCP 配置见 [`mcp/mcp-summary.md`](mcp/mcp-summary.md)

---

## ⚙️ 配置信息

### API 后端

```
Base URL: https://api.deepseek.com/anthropic (DeepSeek API)
模型映射:
  Opus   → deepseek-v4-pro[1m]
  Sonnet → deepseek-v4-flash
  Haiku  → deepseek-v4-flash
当前模型: haiku (实际使用 deepseek-v4-pro[1m])
```

详细配置见 [`config/settings-summary.md`](config/settings-summary.md)

---

## 🚫 被阻止的插件

| 插件 | 添加时间 | 原因 |
|------|---------|------|
| `code-review@claude-plugins-official` | 2026-02-11 | 测试标记 |
| `fizz@testmkt-marketplace` | 2026-02-12 | 安全测试 |

---

## 📁 目录结构

```
claude-plugins-export/
├── README.md                         # 本文件
├── skills/                           # 本地自定义 Skills
│   ├── agent-reach/                  # 互联网调研路由器
│   ├── chat-history/                 # 聊天历史读取
│   └── penguin-vision/               # 视觉理解回退
├── plugins/                          # 插件 Skills
│   └── html-ppt/                     # HTML PPT 生成器
├── hooks/                            # 事件钩子
│   └── penguin-vision-autohint.mjs   # 自动视觉路由
├── commands/                         # 自定义命令
│   └── html-ppt.md                   # HTML PPT 命令
├── config/                           # 配置信息
│   ├── settings.json                 # 主配置（已脱敏）
│   └── settings-summary.md           # 配置摘要
└── mcp/                              # MCP 服务器
    └── mcp-summary.md                # MCP 信息
```

---

## ⚠️ 安全说明

- 所有 API 密钥（`ANTHROPIC_AUTH_TOKEN`、Penguin Vision API Key）已脱敏处理
- `settings.local.json` 未导出（含约 490 条权限规则和 API 密钥）
- 旧备份文件 `settings.json.simpleai.bak` 未导出（含旧 API 密钥）
- 如需恢复完整配置，请手动填写脱敏字段
