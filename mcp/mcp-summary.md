# MCP 服务器信息

## 已配置的 MCP 服务器

### 1. Figma
- **状态**: 已安装，待 OAuth 认证
- **缓存时间戳**: 2026-02（`mcp-needs-auth-cache.json`）
- **可用工具**:
  - `mcp__figma__authenticate` — 启动 OAuth 流程
  - `mcp__figma__complete_authentication` — 完成 OAuth 回调
- **用途**: Figma 设计文件读取和操作
- **认证方式**: OAuth 2.0（需要通过浏览器授权）

## 未配置的 MCP 类型

当前没有配置其他 MCP 服务器（如文件系统、数据库、GitHub API 等）。
所有 MCP 服务器定义内置于 Claude Code 平台中，不在 `settings.json` 中显式声明。

## 历史记录

备份文件（`.claude/backups/`）中记录过 `"mcpServers": {}` 的空配置，说明之前未启用自定义 MCP 服务器。
