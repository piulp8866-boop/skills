# Claude Code 配置摘要

## API 后端
- **Base URL**: `https://api.deepseek.com/anthropic`（DeepSeek API，兼容 Anthropic 协议）
- **认证方式**: Bearer Token（已脱敏）
- **当前模型**: `deepseek-v4-pro[1m]`

## 模型映射
| Claude 模型名 | 实际映射 |
|--------------|---------|
| Opus | `deepseek-v4-pro[1m]` |
| Sonnet | `deepseek-v4-flash` |
| Haiku | `deepseek-v4-flash` |

## 已注册的 Hooks
| 事件 | 类型 | 命令 | 超时 |
|------|------|------|------|
| `UserPromptSubmit` | command (WSL) | `wsl.exe node penguin-vision-autohint.mjs` | 180s |

## 权限配置（settings.local.json）
- **约 490 条权限规则**，覆盖范围：
  - Bash: npm, node, python, pip, git, docker, curl, mysql, mvn, gradlew, java, pnpm, winget, choco
  - 项目路径: `D:\毕业设计代码\canteen-*`, `D:\桌面\zy\java-fitness-system\*`, `D:\集成测试\body-monitor-*`
  - 数据库: fitness_system, hx5759_canteen_supervision, springbootj8kskvkr
  - WebFetch: 多个域名（GitHub, Unsplash, 小红书, B站, V2EX 等）
  - Skills: penguin-vision 已授权
- **注意**: 此文件包含 Penguin Vision API 密钥，已从导出中排除

## 特殊配置
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`: `1`（禁用非必要网络流量）
- 非视觉模型通过 Penguin Vision 钩子自动回退视觉处理
