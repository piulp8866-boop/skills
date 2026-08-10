# 🖥️ 新电脑安装指南

> 本文档供 **Claude Code（AI）在新电脑上自助安装** 使用，也可供人阅读。
> 目标：把本仓库备份的插件/skill/hook 恢复到新电脑，并补齐无法备份的环境依赖。

---

## 0. 快速开始（三步）

1. **下载**：在 GitHub 仓库页点 `Code → Download ZIP`，或 `git clone https://github.com/piulp8866-boop/skills.git`
2. **解压**：解压到一个临时目录，如 `C:\Users\<新用户名>\claude-plugins\`
3. **让 AI 阅读本文件**：对 Claude Code 说「请阅读 `claude-plugins/INSTALL.md`，按照它帮我把所有插件安装到本机」——AI 会按下面的步骤逐项执行

---

## 1. 前置准备（必做，否则 Claude Code 无法启动）

备份里的 `config/settings.json` 中 `ANTHROPIC_AUTH_TOKEN` 是脱敏的 `***REDACTED***`，**必须重新填入你的 API Key**。

### 1.1 配置主设置 `settings.json`

把以下内容写入 `C:\Users\<新用户名>\.claude\settings.json`（`ANTHROPIC_AUTH_TOKEN` 填你的真实 key）：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "<你的 DeepSeek API Key>",
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "model": "haiku",
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [
        { "type": "command",
          "command": "wsl.exe node /home/<WSL用户名>/.claude/hooks/penguin-vision-autohint.mjs",
          "timeout": 180 }
      ]}
    ]
  }
}
```

> ⚠️ `wsl.exe` 路径中的 `<WSL用户名>` 需改成新电脑 WSL 里的实际用户名。
> 如果新电脑**不想用** penguin-vision 自动钩子，可暂时删掉 `hooks` 段，不影响其他功能。

### 1.2 验证

运行 `claude` 能正常进入对话即成功。若报认证错误，检查 API Key 是否正确。

---

## 2. 安装 Skills（3 个本地自定义）

把以下目录整体复制到 `C:\Users\<新用户名>\.claude\skills\`：

| 源目录（备份中） | 目标位置 |
|------------------|----------|
| `skills/agent-reach/` | `~/.claude/skills/agent-reach/` |
| `skills/chat-history/` | `~/.claude/skills/chat-history/` |
| `skills/penguin-vision/` | `~/.claude/skills/penguin-vision/` |

复制完成后在 `claude` 里输入 `/` 应能看到这 3 个 skill。

---

## 3. 安装插件 Skill html-ppt

`plugins/html-ppt/` 是完整插件目录，两种方式任选：

- **方式 A（推荐）**：整体复制到 `C:\Users\<新用户名>\.claude\skills\html-ppt\`
  （它本身就是 skill 格式，放 skills 目录即可被 Claude Code 识别）
- **方式 B**：如果本机已装插件管理器，用插件安装命令安装

---

## 4. 安装 Hook

1. 把 `hooks/penguin-vision-autohint.mjs` 复制到：
   - Windows 侧：`C:\Users\<新用户名>\.claude\hooks\penguin-vision-autohint.mjs`
   - WSL 侧：`/home/<WSL用户名>/.claude/hooks/penguin-vision-autohint.mjs`（如用 WSL 运行）
2. 确保已在 `settings.json` 的 `hooks.UserPromptSubmit` 中注册（见第 1.1 节）
3. **注意**：此文件内硬编码了 WSL 路径 `/home/user0286/hermes-agent/.venv/bin/python` 和
   `/home/user0286/.claude/skills/penguin-vision/scripts/penguin_vision.py`，
   新电脑若用户名或目录不同，**必须修改这两个路径**

---

## 5. 安装 Command

把 `commands/html-ppt.md` 复制到 `C:\Users\<新用户名>\.claude\commands\html-ppt.md`。
在 claude 里输入 `/html-ppt` 即可使用。

---

## 6. 无法从备份恢复的环境依赖（需要手动搭建）

以下内容**不在备份里**，换电脑必须重新配置，否则对应功能不可用：

### 6.1 penguin-vision（图片识别）

备份只包含 skill 脚本，它依赖：

| 依赖 | 说明 | 如何搭 |
|------|------|--------|
| WSL + Python 环境 | Windows 上需装 WSL，并在 WSL 里建 Python venv | `wsl` 进入 Linux，创建 `/home/<用户>/hermes-agent/.venv/`，`pip install httpx pyyaml` |
| Hermes 视觉配置 | `~/.hermes/config.yaml` 需包含 `auxiliary.vision.*`（base_url / api_key / model / timeout） | 把原电脑的 Hermes 配置同步过来，或重新填写视觉 API 配置 |
| 视觉 API 凭据 | 提供视觉能力的第三方 API key | 重新申请/填写 |

> 没有这些依赖时，penguin-vision skill 会报错，但**不影响**其他插件使用。

### 6.2 agent-reach（15 平台调研）

skill 本体是路由脚本，但各平台依赖本机 CLI 工具：

| 平台 | 依赖 | 未安装时的表现 |
|------|------|---------------|
| GitHub | `gh`（GitHub CLI） | GitHub 相关功能不可用 |
| 小红书 / 微博 / B站等 | OpenCLI / 对应平台 CLI / API | 对应平台不可用 |
| YouTube / B站 | `yt-dlp`、Whisper | 视频转录不可用 |
| 搜索 / 网页 / RSS | Exa API、Jina Reader（多为远程 API，零配置） | 通常可用 |

**安装后体检**：在 claude 中让 AI 运行 `agent-reach doctor --json`，它会列出每个平台当前可用的后端，据此判断哪些平台能用、哪些需要补装 CLI。

---

## 7. 安装后验证清单

1. ✅ `claude` 能正常启动对话
2. ✅ 输入 `/` 能看到 `agent-reach`、`chat-history`、`penguin-vision`、`html-ppt`
3. ✅ `/html-ppt` 能生成演示文稿
4. ✅ `/chat-history list` 能列出历史会话
5. ✅ 上传一张图片，能触发 penguin-vision 自动识别（若已配置视觉依赖）
6. ✅ `agent-reach doctor --json` 显示主要平台后端可用

---

## 8. 常见问题

| 问题 | 解决 |
|------|------|
| 启动报认证错误 | `settings.json` 里 `ANTHROPIC_AUTH_TOKEN` 未填或填错，重新填写 |
| 图片无法识别 | 检查 WSL Python venv 和 `~/.hermes/config.yaml` 视觉配置 |
| 小红书/B站等平台不可用 | 用 `agent-reach doctor --json` 查看缺哪个 CLI，补装 |
| hook 报路径错误 | 修改 `penguin-vision-autohint.mjs` 里硬编码的 `/home/...` 路径为当前用户 |
| 某个 skill 不生效 | 确认目录名/位置正确，重启 claude 会话 |
