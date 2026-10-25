# 新电脑安装指南

## 安装到 Codex 或 Claude Code

1. 下载或克隆本仓库：`git clone https://github.com/piulp8866-boop/skills.git`。
2. 选择目标目录：Codex 使用 `~/.codex/skills/`；Claude Code 使用 `~/.claude/skills/`。
3. 将下列目录整体复制到目标目录，保持每个技能的 SKILL.md、脚本、许可证和资源在同一目录中。

| 来源目录 | 目标子目录 |
|---|---|
| skills/agent-reach | agent-reach |
| skills/chat-history | chat-history |
| plugins/html-ppt | html-ppt |
| skills/find-skills | find-skills |
| skills/frontend-design | frontend-design |
| skills/web-design-guidelines | web-design-guidelines |
| skills/gh-fix-ci | gh-fix-ci |

若目标目录已存在，请先比较内容并备份定制文件，不要直接覆盖。

## 环境依赖

- Node.js：chat-history；find-skills 使用的 npm / npx。
- Python、GitHub CLI 和登录态：gh-fix-ci。使用前执行 `gh auth status`。
- Agent Reach CLI / 各平台后端：另行安装；安装后用 `agent-reach doctor --json` 检查渠道。
- html-ppt 的模板可直接用于 HTML；附带 shell 和渲染脚本可能需要按 Windows 环境适配。
- web-design-guidelines 在检查时需联网读取最新规范。

这些依赖不会随技能目录自动安装。需要账号或 API Key 的渠道应单独配置。

## 可选的 Claude Code 文件

- 可将 commands/html-ppt.md 复制到 `~/.claude/commands/`。
- config/ 仅为历史脱敏示例，不是 Codex 配置，也不是必要安装步骤；请保留当前账号和设置。
- 当前版本不包含识图技能或自动视觉钩子，无需注册任何相关 hook。

## 验证

确认各技能目录存在 SKILL.md，并在下一轮对话检查技能是否已加载；必要时重新打开会话。
对命令行依赖分别检查版本和认证状态。文件安装成功不代表平台登录、网络或 API 额度已配置。
