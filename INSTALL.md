# 安装指南

## 获取仓库

下载 ZIP，或运行 git clone https://github.com/piulp8866-boop/skills.git。

## 安装独立技能

Codex 目标目录为 ~/.codex/skills/，Claude Code 为 ~/.claude/skills/。

将 skills/ 下的 14 个目录整体复制到目标目录；再将 plugins/html-ppt 复制为目标目录中的 html-ppt，共 15 个独立技能。保留 SKILL.md、引用、脚本、许可证及来源文件。目标已存在时先比较并备份本地定制，再决定是否覆盖。

## Superpowers

在 Codex 官方插件目录搜索 Superpowers 并完成安装。plugins/superpowers 是官方 7.0.1 的文件快照，其他宿主按其中 README 安装。已安装插件时不要再次复制其 15 个技能。

## 配置依赖

- Node.js：chat-history，以及 find-skills 使用的 npx。
- Python、GitHub CLI 和登录态：gh-fix-ci；用 gh auth status 检查。
- Agent Reach CLI 和平台后端：另行安装，完成后执行 agent-reach doctor --json。
- deep-interview / ultrawork：固定 OMX v0.20.0。完整状态、恢复、交接依赖 omx 和配套工作流。这里只安装技能文件，不安装整个框架。
- ai-slop-cleaner：项目测试工具；复杂升级路径需要另装 ralplan。
- html-ppt 的 shell / 渲染脚本在 Windows 可能需要适配。

详细限制见 README。未实测的功能不能因文件存在就视为已就绪。

## 加载与验证

下一轮对话检查技能是否可见；必要时重新打开会话。先用小范围任务验证，检查实际工具输出和依赖状态。

本批新增技能附 SOURCE.json 和 LICENSE。deep-intervier / remermber 使用正式名称 deep-interview / remember。Ponytail 已安装为独立技能，复制 skills/ponytail 即可；其插件生命周期钩子未安装。

## 历史资料

commands/html-ppt.md 是 Claude Code 的可选快捷命令。config/、mcp/ 仅供参考，不应直接覆盖新电脑配置。不要恢复已删除的识图钩子。
