---
name: penguin-vision
description: Use when Claude Code or a text-only model such as DeepSeek needs to understand an uploaded/local image, screenshot, UI capture, chart, paper figure, scanned document, photo, OCR content, layout, or visual relationships. Reuses the existing Hermes Penguin API vision configuration without requiring another API key.
allowed-tools: Bash(python3 *), Bash(/home/user0286/hermes-agent/.venv/bin/python *)
---

# Penguin Vision for Claude Code

Use the bundled helper to analyze images through the existing Penguin API visual model configured in Hermes. The main Claude Code model may remain DeepSeek or another text-only model; this helper returns visual findings as text for the main model to use.

## Mandatory vision routing policy

Apply this order whenever the user uploads, pastes, references, or asks about an image:

1. If the active primary model is known to have native image understanding, use native vision first.
2. If the active primary model is text-only—including DeepSeek V4 Pro—do **not** claim that images are unsupported. Immediately use Penguin Vision as the second-stage visual model.
3. If native vision was attempted but failed, rejected the image, returned a connection error, or said images are unsupported, immediately fall back to Penguin Vision in the same turn.
4. Ask the user to re-upload or describe the image only after Penguin Vision itself fails, and report its concrete error.

For the current `deepseek-v4-pro[1m]` configuration, Penguin Vision is mandatory for every visual request.

## Invocation

For an explicit path or URL:

```bash
/home/user0286/hermes-agent/.venv/bin/python "$HOME/.claude/skills/penguin-vision/scripts/penguin_vision.py" "<image-path-or-url>" "<question>"
```

For the latest image uploaded in the current Claude Code project:

```bash
/home/user0286/hermes-agent/.venv/bin/python "$HOME/.claude/skills/penguin-vision/scripts/penguin_vision.py" --latest-claude-image "<question>"
```

Users may invoke it explicitly as:

```text
/penguin-vision <image-path-or-url> [question]
```

Quote paths and questions. Never let user text become shell syntax.

## Configuration source

The helper reads these existing Hermes values from `~/.hermes/config.yaml`:

- `auxiliary.vision.base_url`
- `auxiliary.vision.api_key`
- `auxiliary.vision.model`
- `auxiliary.vision.timeout`

It does not print the API key and does not require a separate Claude credential.

Optional per-process overrides:

- `PENGUIN_VISION_BASE_URL`
- `PENGUIN_VISION_API_KEY`
- `PENGUIN_VISION_MODEL`
- `PENGUIN_VISION_MAX_TOKENS`
- `PENGUIN_VISION_TIMEOUT`

## Workflow

1. Run this helper whenever image content matters to the answer or code change.
2. If the user uploaded an image without giving a path, use `--latest-claude-image` instead of searching unrelated directories.
3. Ask a task-specific question: OCR, error diagnosis, chart interpretation, UI layout, figure conclusions, object identification, or spatial relationships.
4. Treat the output as model-derived visual evidence. Preserve uncertainty and do not invent unreadable details.
5. If resolution is insufficient, request a clearer image.
6. After getting the visual result, continue the original task using that result; do not merely paste it unless that directly answers the user.

## Supported input

- Local `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`
- Remote HTTP/HTTPS image URLs
- Existing `data:image/...;base64,...` URLs
- Latest uploaded Claude Code image from the current project transcript

## Common pitfalls

- Do not use `sf-vision`; it requires a separate SiliconFlow key.
- Do not expose or print credentials from Hermes configuration.
- Do not assume DeepSeek directly saw the image; it only receives this helper's textual analysis.
- If the request fails after the Windows proxy is disabled, verify that the Penguin endpoint is reachable directly or re-enable the configured proxy.
