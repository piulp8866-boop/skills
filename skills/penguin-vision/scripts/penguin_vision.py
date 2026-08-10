#!/usr/bin/env python3
"""Vision helper for Claude Code using Hermes' configured Penguin endpoint."""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
from pathlib import Path
import sys
from typing import Any

import httpx
import yaml

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
DEFAULT_PROMPT = "请完整描述这张图片，并提取所有对当前任务有帮助的信息。"


def claude_project_dir_name(cwd: Path) -> str:
    return str(cwd.resolve()).replace("/", "-")


def collect_images(content: Any, images: list[str]) -> None:
    if not isinstance(content, list):
        return
    for part in content:
        if not isinstance(part, dict) or part.get("type") != "image":
            continue
        source = part.get("source")
        if not isinstance(source, dict):
            continue
        if source.get("type") == "base64" and source.get("media_type") and source.get("data"):
            images.append(f"data:{source['media_type']};base64,{source['data']}")


def latest_claude_image(cwd: Path | None = None) -> str:
    cwd = cwd or Path.cwd()
    project_dir = Path.home() / ".claude" / "projects" / claude_project_dir_name(cwd)
    if not project_dir.is_dir():
        raise RuntimeError(f"Claude project transcript directory not found: {project_dir}")

    files = sorted(project_dir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    for transcript in files:
        lines = transcript.read_text(encoding="utf-8", errors="replace").splitlines()
        for line in reversed(lines):
            try:
                record = json.loads(line)
            except Exception:
                continue
            images: list[str] = []
            message = record.get("message") if isinstance(record, dict) else None
            tool_result = record.get("toolUseResult") if isinstance(record, dict) else None
            if isinstance(message, dict):
                collect_images(message.get("content"), images)
            if isinstance(tool_result, dict):
                collect_images(tool_result.get("content"), images)
            if images:
                return images[-1]
    raise RuntimeError(f"No image attachment found in Claude project transcripts: {project_dir}")


def latest_image_from_transcript(transcript_path: str) -> str:
    """Read the latest image from an exact Claude transcript path.

    This supports Windows-native Claude Code invoking the helper through WSL,
    where Path.home() points to the WSL home while the live transcript is under
    the Windows user's .claude/projects directory.
    """
    transcript = Path(transcript_path).expanduser().resolve()
    if not transcript.is_file():
        raise RuntimeError(f"Claude transcript not found: {transcript}")
    lines = transcript.read_text(encoding="utf-8", errors="replace").splitlines()
    for line in reversed(lines):
        try:
            record = json.loads(line)
        except Exception:
            continue
        images: list[str] = []
        message = record.get("message") if isinstance(record, dict) else None
        tool_result = record.get("toolUseResult") if isinstance(record, dict) else None
        if isinstance(message, dict):
            collect_images(message.get("content"), images)
        if isinstance(tool_result, dict):
            collect_images(tool_result.get("content"), images)
        if images:
            return images[-1]
    raise RuntimeError(f"No image attachment found in Claude transcript: {transcript}")


def image_url(image_ref: str) -> str:
    if image_ref.startswith(("http://", "https://", "data:image/")):
        return image_ref
    path = Path(image_ref).expanduser().resolve()
    if not path.is_file():
        raise RuntimeError(f"Image file not found: {path}")
    if path.suffix.lower() not in SUPPORTED:
        raise RuntimeError(f"Unsupported image extension: {path.suffix or '(none)'}")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def load_vision_config() -> dict[str, Any]:
    config_path = Path(os.getenv("HERMES_CONFIG_PATH", Path.home() / ".hermes" / "config.yaml"))
    try:
        config = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    except Exception as exc:
        raise RuntimeError(f"Unable to read Hermes config {config_path}: {exc}") from exc
    vision = ((config.get("auxiliary") or {}).get("vision") or {})
    base_url = os.getenv("PENGUIN_VISION_BASE_URL") or vision.get("base_url") or ""
    api_key = os.getenv("PENGUIN_VISION_API_KEY") or vision.get("api_key") or ""
    model = os.getenv("PENGUIN_VISION_MODEL") or vision.get("model") or "gpt-5.4"
    timeout = float(os.getenv("PENGUIN_VISION_TIMEOUT") or vision.get("timeout") or 120)
    if not base_url or not api_key:
        raise RuntimeError(
            "Hermes auxiliary.vision is missing base_url or api_key. Configure the Penguin vision route first."
        )
    return {"base_url": str(base_url).rstrip("/"), "api_key": str(api_key), "model": str(model), "timeout": timeout}


def prompt(question: str) -> str:
    question = question.strip() or DEFAULT_PROMPT
    return f"""你是给无法直接看图的代码与研究助手使用的视觉理解工具。请使用中文 Markdown，准确回答，不要臆测不可读内容。

请根据任务需要包含：
- 一句话概览
- 关键可见元素
- OCR/可读文字
- 布局、位置、颜色和视觉关系
- 与用户问题直接相关的结论
- 不确定或需要更高分辨率确认的内容

用户问题：{question}"""


def normalize_proxy_environment() -> None:
    """Repair malformed lowercase proxy variables inherited by Claude/WSL."""
    for lower, upper in (("http_proxy", "HTTP_PROXY"), ("https_proxy", "HTTPS_PROXY"), ("all_proxy", "ALL_PROXY")):
        value = os.getenv(lower, "")
        if value and "://:" in value:
            replacement = os.getenv(upper, "")
            if replacement:
                os.environ[lower] = replacement
            else:
                os.environ.pop(lower, None)


def analyze(ref: str, question: str, raw_json: bool = False) -> str:
    normalize_proxy_environment()
    cfg = load_vision_config()
    max_tokens = int(os.getenv("PENGUIN_VISION_MAX_TOKENS", "1800"))
    payload = {
        "model": cfg["model"],
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url(ref), "detail": "high"}},
                {"type": "text", "text": prompt(question)},
            ],
        }],
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    try:
        response = httpx.post(
            f"{cfg['base_url']}/chat/completions",
            headers={"Authorization": f"Bearer {cfg['api_key']}", "Content-Type": "application/json"},
            json=payload,
            timeout=cfg["timeout"],
        )
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Penguin vision connection failed: {exc}") from exc
    if response.status_code >= 400:
        try:
            body = response.json()
            message = ((body.get("error") or {}).get("message") if isinstance(body, dict) else None) or response.text
        except Exception:
            message = response.text
        raise RuntimeError(f"Penguin vision API error {response.status_code}: {message[:800]}")
    data = response.json()
    if raw_json:
        return json.dumps(data, ensure_ascii=False, indent=2)
    content = (((data.get("choices") or [{}])[0].get("message") or {}).get("content"))
    if isinstance(content, str) and content.strip():
        return content.strip()
    return json.dumps(data, ensure_ascii=False, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze images using Hermes' Penguin vision configuration.")
    parser.add_argument("image", nargs="?", help="Local path, URL, or data URL")
    parser.add_argument("question", nargs="*", help="Question about the image")
    parser.add_argument("--latest-claude-image", action="store_true")
    parser.add_argument("--claude-transcript", help="Exact Claude JSONL transcript path")
    parser.add_argument("--raw-json", action="store_true")
    args = parser.parse_args()
    try:
        if args.claude_transcript:
            ref = latest_image_from_transcript(args.claude_transcript)
        else:
            ref = latest_claude_image() if args.latest_claude_image else (args.image or "")
        if not ref:
            parser.error("provide an image path/URL or --latest-claude-image")
        print(analyze(ref, " ".join(args.question), args.raw_json))
        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
