# skills — 实用技能合集

适用于 Codex / Claude Code 的技能备份。更新日期：2026-10-26。

安装方法见 [INSTALL.md](INSTALL.md)。技能说明与依赖程序分开管理，复制技能目录不会自动安装 CLI 或配置账号。

## 技能清单

| 技能 | 功能 | 仓库路径 | 来源 |
|---|---|---|---|
| agent-reach | 多平台互联网调研与工具路由 | skills/agent-reach | [Agent Reach](https://github.com/Panniantong/Agent-Reach) |
| chat-history | 读取、搜索本地 Claude Code / Codex 聊天记录 | skills/chat-history | 本仓库原有技能 |
| html-ppt | 基于主题和模板创建 HTML 演示文稿 | plugins/html-ppt | [HTML PPT](https://github.com/lewislulu/html-ppt-skill) |
| find-skills | 搜索和发现更多 Agent Skills | skills/find-skills | [Vercel](https://github.com/vercel-labs/skills/tree/main/skills/find-skills) |
| frontend-design | 网页布局、配色、字体与视觉设计 | skills/frontend-design | [Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) |
| web-design-guidelines | 检查网页体验与可访问性 | skills/web-design-guidelines | [Vercel](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) |
| gh-fix-ci | 分析 GitHub Actions 中失败的 PR 检查 | skills/gh-fix-ci | [OpenAI](https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci) |

共 7 个技能。第三方技能保留原有许可证及随附资源；具体授权以各目录文件和上游仓库为准。

## 依赖与使用限制

- chat-history：需要 Node.js，读取本地历史记录。
- agent-reach：需要单独安装其 CLI 和所用平台的后端；部分渠道需要登录或 API Key。
- html-ppt：HTML/CSS/JS 模板可直接使用；随附的部分 shell / 渲染脚本面向 macOS，Windows 使用前需适配。
- find-skills：使用 Skills CLI 时需要 Node.js / npm 和网络。
- frontend-design：主要提供设计流程与指导。
- web-design-guidelines：检查时需要联网获取最新规范。
- gh-fix-ci：需要 Python、GitHub CLI（gh）和 GitHub 登录态；仅覆盖 GitHub Actions，修改前按技能流程确认方案。

技能文件已备份不代表上述依赖在每台电脑上都已就绪。远程操作仍受用户授权与运行环境权限约束。

## 其他文件

- commands/html-ppt.md：Claude Code 的可选快捷命令。
- config/：历史 Claude Code 配置示例，认证信息已脱敏；不用于 Codex，不要直接覆盖现有配置。
- mcp/：历史 MCP 说明，安装技能不会自动启用服务。

## 维护说明

识图技能及其自动钩子已从当前版本移除，安装指南和配置示例已同步清理。此变更不重写既有 Git 历史。

新增技能来自上游快照，不会自动更新。更新时应核对来源、许可证和变更，并保留本地定制。
