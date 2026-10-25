# 我的 Agent Skills 工具箱

用于备份、迁移和安装 Codex / Claude Code 技能。更新日期：2026-10-26。

本仓库共 **29 个技能**：14 个独立技能，以及 Superpowers 套件中的 15 个技能。不统计 Codex 自带及其他插件提供的技能。

## 独立技能：名称与作用

| 名称 | 作用 | 来源 |
|---|---|---|
| [agent-reach](skills/agent-reach) | 多平台搜索、内容读取和后端路由 | [Agent Reach](https://github.com/Panniantong/Agent-Reach) |
| [chat-history](skills/chat-history) | 搜索、读取本机 Codex / Claude Code 历史聊天记录 | 原有备份 |
| [html-ppt](plugins/html-ppt) | 用主题、模板和动画生成 HTML 演示文稿 | [HTML PPT](https://github.com/lewislulu/html-ppt-skill) |
| [find-skills](skills/find-skills) | 根据任务搜索并发现更多技能 | [Vercel](https://github.com/vercel-labs/skills) |
| [frontend-design](skills/frontend-design) | 网页布局、字体、配色和视觉设计 | [Anthropic](https://github.com/anthropics/skills) |
| [web-design-guidelines](skills/web-design-guidelines) | 检查网页体验、可访问性和界面规范 | [Vercel](https://github.com/vercel-labs/agent-skills) |
| [gh-fix-ci](skills/gh-fix-ci) | 排查 GitHub Actions 中失败的 PR 检查 | [OpenAI](https://github.com/openai/skills) |
| [prompt-optimizer](skills/prompt-optimizer) | 将草稿或任务描述改写成可直接发送的提示词 | [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/main/skills/prompt-optimizer)；main |
| [deep-interview](skills/deep-interview) | 通过逐轮提问澄清目标、范围和验收标准 | [yeachan-heo/oh-my-codex](https://github.com/yeachan-heo/oh-my-codex/tree/v0.20.0/skills/deep-interview)；v0.20.0 |
| [ultrawork](skills/ultrawork) | 组织独立任务并行执行与轻量验证 | [yeachan-heo/oh-my-codex](https://github.com/yeachan-heo/oh-my-codex/tree/v0.20.0/skills/ultrawork)；v0.20.0 |
| [verify](skills/verify) | 用测试、构建与直接检查证明变更有效 | [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode/tree/main/skills/verify)；main |
| [simplify](skills/simplify) | 保持行为不变，简化代码并检查复用、质量和效率 | [dkstm95/codex-simplify-skill](https://github.com/dkstm95/codex-simplify-skill/tree/main/skills/simplify)；main |
| [ai-slop-cleaner](skills/ai-slop-cleaner) | 在回归验证保护下清理冗余代码、重复与过度抽象 | [yeachan-heo/oh-my-codex](https://github.com/yeachan-heo/oh-my-codex/tree/v0.20.0/skills/ai-slop-cleaner)；v0.20.0 |
| [remember](skills/remember) | 把可复用项目知识整理到适当的笔记或持久文档 | [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode/tree/main/skills/remember)；main |

拼写对应：deep-intervier → deep-interview；remermber → remember。安装及调用使用正式名称。

## Superpowers：15 个技能

[上游 obra/superpowers](https://github.com/obra/superpowers) · 版本 **7.0.1** · [备份目录](plugins/superpowers)。
上游快照：2ce8aa15d05bd57213e6f746f953aafb7ded7a8b。

| 名称 | 作用 |
|---|---|
| brainstorming | 梳理需求、范围和设计方案 |
| writing-plans | 将明确需求拆分成可执行计划 |
| executing-plans | 按计划实施并验证 |
| dispatching-parallel-agents | 分配独立的并行任务 |
| subagent-driven-development | 通过实施与审查分工推进开发 |
| test-driven-development | 按失败测试、实现、重构的顺序开发 |
| systematic-debugging | 定位根因后修复和验证 |
| verification-before-completion | 在宣称完成前收集验证证据 |
| requesting-code-review | 组织代码审查 |
| receiving-code-review | 核实和处理审查反馈 |
| using-git-worktrees | 建立隔离的 Git 工作区 |
| finishing-a-development-branch | 验证后处理分支与集成 |
| writing-skills | 创建、修改和检验技能 |
| using-superpowers | 查找适用技能并组织调用 |
| diagnosing-superpowers | 排查未触发、重复工作等会话问题 |

## 安装与使用

完整步骤见 [INSTALL.md](INSTALL.md)。

- Codex 独立技能位置：~/.codex/skills/<技能名>/。
- Claude Code 独立技能位置：~/.claude/skills/<技能名>/。
- 整体复制技能目录，保留 SKILL.md、references、scripts、LICENSE 和 SOURCE.json。
- html-ppt 的源目录是 plugins/html-ppt。
- Superpowers 推荐通过 Codex 官方插件目录安装，已安装插件时不要再重复复制其技能。
- 在任务中直接点名，例如“使用 simplify 检查最近改动”。

## 依赖和兼容性

| 项目 | 条件与边界 |
|---|---|
| chat-history | Node.js；只能读取本机存在的历史文件 |
| find-skills | npx 命令需要 Node.js/npm 和网络 |
| agent-reach | 需单独配置 CLI 与平台后端，部分渠道需要登录或 API Key |
| gh-fix-ci | Python、GitHub CLI 和有效登录态 |
| html-ppt | 模板可直接用于 HTML；部分 shell / Chrome 渲染脚本需适配 Windows |
| web-design-guidelines | 检查时联网读取最新规范 |
| prompt-optimizer / verify / simplify / remember | 主要为说明型技能，具体操作使用宿主提供的工具；remember 不自动创建全局记忆服务 |
| deep-interview | OMX v0.20.0；完整状态持久化与交接依赖 omx 及相关工作流 |
| ultrawork | 固定 OMX v0.20.0；新版本已移除并迁移到 team。状态命令依赖 omx，代理角色与模型需适配宿主能力 |
| ai-slop-cleaner | 需要项目测试/构建工具；复杂架构问题的 ralplan 升级路径需另装对应工作流 |
| Superpowers | 并行技能依赖宿主的多代理能力；工具名可能因平台不同而变化 |

**技能文件已安装，不代表所有后端已配置或已通过实际任务验证。**
本次仅安装指定技能，不安装完整 OMX/OMC 框架，不修改 Codex 全局配置。
当前电脑未检测到 omx；涉及 OMX 状态和交接的功能仍需相应运行环境。

## 维护、来源与许可证

- 新增技能目录的 SOURCE.json 记录来源、版本和日期；LICENSE 保留上游授权。
- 快照不会自动更新，升级前应检查上游行为变化。
- 功能重叠时按任务选择技能，用户要求优先，避免叠加多个完整工作流。
- config/、mcp/ 是历史参考资料，不应直接覆盖当前账号、权限或 Codex 配置。
- penguin-vision 及其识图钩子已从当前版本移除，Git 历史未重写。
- Ponytail（马尾辫）按用户要求跳过，不包含在本次安装和备份中。
