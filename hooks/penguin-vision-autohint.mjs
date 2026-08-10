#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  input = {};
}

const userPrompt = String(input.prompt || "").trim();
const visualPrompt = /图片|截图|图中|图里|这张图|这个图|照片|界面|报错截图|图表|识图|看图|figure|image|screenshot|ocr/i.test(userPrompt);
const python = "/home/user0286/hermes-agent/.venv/bin/python";
const helper = "/home/user0286/.claude/skills/penguin-vision/scripts/penguin_vision.py";

function emit(additionalContext) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext,
    },
  }));
}

function windowsToWslPath(value) {
  const text = String(value || "");
  const match = text.match(/^([A-Za-z]):[\\/](.*)$/);
  if (!match) return text;
  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll("\\", "/")}`;
}

if (!visualPrompt) {
  emit("Vision routing policy: native-vision primary models may inspect images directly; text-only models must use Penguin Vision. Never claim an image is unsupported before the applicable route has been attempted.");
  process.exit(0);
}

const configuredModel = String(
  process.env.ANTHROPIC_MODEL ||
  process.env.ANTHROPIC_DEFAULT_OPUS_MODEL ||
  process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ||
  "",
).toLowerCase();

// Prefer native vision only for a real Claude vision model. Custom text-only
// routes such as DeepSeek must always use Penguin Vision first.
const nativeVisionModel = /(?:claude-(?:3|4)|sonnet|opus|haiku)/.test(configuredModel) &&
  !/(?:deepseek|text-only)/.test(configuredModel);

if (nativeVisionModel) {
  emit(`The configured primary model appears to support native vision (${configuredModel}). Analyze the uploaded image natively first. If native analysis fails, reports a connection error, or says images are unsupported, immediately fall back to Penguin Vision in the same turn. Do not ask the user to describe or re-upload the image before that fallback.`);
  process.exit(0);
}

const transcriptPath = windowsToWslPath(input.transcript_path || "");
const args = transcriptPath
  ? [helper, "--claude-transcript", transcriptPath, userPrompt || "请识别这张图片的内容"]
  : [helper, "--latest-claude-image", userPrompt || "请识别这张图片的内容"];

// Text-only primary model: run Penguin Vision in the hook itself so the model
// cannot ignore the fallback requirement.
const run = spawnSync(python, args, {
  cwd: windowsToWslPath(input.cwd || process.cwd()),
  encoding: "utf8",
  timeout: 150000,
  env: process.env,
  maxBuffer: 4 * 1024 * 1024,
});

if (run.status === 0 && String(run.stdout || "").trim()) {
  const analysis = String(run.stdout).trim();
  emit(`MANDATORY VISUAL EVIDENCE: The active primary model is text-only, so Penguin Vision was used automatically through the existing Hermes auxiliary.vision configuration. Answer the user's original question from the result below. Do not say that the image is unsupported and do not ask the user to describe it.\n\n--- PENGUIN VISION RESULT ---\n${analysis}\n--- END RESULT ---`);
  process.exit(0);
}

const error = String(run.stderr || run.error?.message || "No image was found in the Claude transcript").trim();
emit(`MANDATORY FALLBACK FAILED: A visual request was detected on a text-only primary model. Penguin Vision was attempted but failed. Do not claim only that the primary model lacks vision. Report this concrete Penguin fallback error and use an explicit image path if available.\nPenguin error: ${error.slice(0, 1600)}\nExact helper: ${python} \"${helper}\" \"<image-path>\" \"${userPrompt || "识别图片内容"}\"`);
