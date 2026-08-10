#!/usr/bin/env node
/**
 * chat-history — 读取 Claude Code (~/.claude) 与 Codex (~/.codex) 的历史会话记录。
 *
 * 零依赖（仅 Node.js 内置模块），跨平台（macOS / Linux / Windows）。
 *
 * 子命令:
 *   list    列出会话（可按来源/项目/时间过滤）
 *   show    读取某个会话的消息（支持 --head/--tail/--range/--role 局部读取）
 *   search  按关键词搜索历史会话（默认搜提问索引，--content 全文搜索）
 *   last    显示某项目最近一次（自动跳过疑似当前会话）的会话内容
 *
 * 示例:
 *   node chat_history.js list --cwd --limit 10
 *   node chat_history.js list --since 2026-06-01 --until "2026-06-10 18:00" --source codex
 *   node chat_history.js show 0ff7c0f9 --tail 10
 *   node chat_history.js show 019eb45d --range 3:8 --full
 *   node chat_history.js search "读写分离" --content
 *   node chat_history.js last --project new-api
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CC_PROJECTS = path.join(HOME, '.claude', 'projects');
const CC_HISTORY = path.join(HOME, '.claude', 'history.jsonl');
const CODEX_SESSIONS = path.join(HOME, '.codex', 'sessions');
const CODEX_INDEX = path.join(HOME, '.codex', 'session_index.jsonl');
const CODEX_HISTORY = path.join(HOME, '.codex', 'history.jsonl');

const CODEX_FN = /rollout-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-([0-9a-fA-F-]{8,})\.jsonl$/;

// Claude Code 会话里非真实对话的注入内容，读取时跳过
const SKIP_PREFIX = [
  '<command-name>', '<local-command', '<command-message', '<command-args',
  'Caveat:', '<system-reminder', '<task-notification', '<bash-input',
  '<bash-stdout', '<bash-stderr',
];

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function jparse(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function readLines(file) {
  let data;
  try { data = fs.readFileSync(file, 'utf8'); } catch { return []; }
  return data.split('\n');
}

function readFirstLine(file) {
  // 只读首行（codex 首行 session_meta 可能很大，限 2MB）
  let fd;
  try { fd = fs.openSync(file, 'r'); } catch { return ''; }
  try {
    const chunk = Buffer.alloc(65536);
    let acc = Buffer.alloc(0);
    let pos = 0;
    while (acc.length < 2 * 1024 * 1024) {
      const n = fs.readSync(fd, chunk, 0, chunk.length, pos);
      if (n <= 0) break;
      pos += n;
      acc = Buffer.concat([acc, chunk.subarray(0, n)]);
      const i = acc.indexOf(0x0a);
      if (i >= 0) return acc.subarray(0, i).toString('utf8');
    }
    return acc.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function parseWhen(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s.trim());
  if (!m) die(`无法解析时间: "${s}"（支持 YYYY-MM-DD [HH:MM[:SS]]）`);
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  return d.getTime() / 1000;
}

function fmtTs(epoch) {
  if (!epoch) return '?';
  const d = new Date(epoch * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function isoToEpoch(s) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t / 1000;
}

function shortPath(p) {
  if (p && p.startsWith(HOME)) return '~' + p.slice(HOME.length);
  return p || '';
}

// ---------------- 收集会话 ----------------

function ccCollect() {
  // Claude Code: ~/.claude/projects/<slug>/<sessionId>.jsonl + history.jsonl 索引
  const idx = {};
  for (const line of readLines(CC_HISTORY)) {
    const d = jparse(line);
    if (!d || !d.sessionId) continue;
    let e = idx[d.sessionId];
    if (!e) {
      e = idx[d.sessionId] = {
        prompt: d.display || '',
        project: d.project || '',
        start: (d.timestamp || 0) / 1000,
        prompts: 0,
      };
    }
    e.prompts++;
  }
  const out = [];
  let slugs;
  try { slugs = fs.readdirSync(CC_PROJECTS); } catch { return out; }
  for (const slug of slugs) {
    const pdir = path.join(CC_PROJECTS, slug);
    let st0;
    try { st0 = fs.statSync(pdir); } catch { continue; }
    if (!st0.isDirectory()) continue;
    let files;
    try { files = fs.readdirSync(pdir); } catch { continue; }
    for (const fn of files) {
      if (!fn.endsWith('.jsonl')) continue;
      const fp = path.join(pdir, fn);
      let st;
      try { st = fs.statSync(fp); } catch { continue; }
      const sid = fn.slice(0, -6);
      const e = idx[sid] || {};
      out.push({
        source: 'claude', id: sid, path: fp,
        project: e.project || slug,
        title: (e.prompt || '').replace(/\n/g, ' ').trim().slice(0, 80),
        start: e.start || st.mtimeMs / 1000,
        end: st.mtimeMs / 1000, size: st.size,
        prompts: e.prompts || 0,
      });
    }
  }
  return out;
}

function codexTitles() {
  const t = {};
  for (const line of readLines(CODEX_INDEX)) {
    const d = jparse(line);
    if (d && d.id) t[d.id] = d.thread_name || '';
  }
  return t;
}

function codexMetaCwd(file) {
  const d = jparse(readFirstLine(file));
  if (d && d.type === 'session_meta') return (d.payload || {}).cwd || '';
  return '';
}

function walkFiles(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function codexCollect() {
  // Codex: ~/.codex/sessions/YYYY/MM/DD/rollout-<时间>-<uuid>.jsonl
  const out = [];
  const titles = codexTitles();
  for (const fp of walkFiles(CODEX_SESSIONS)) {
    const m = CODEX_FN.exec(path.basename(fp));
    if (!m) continue;
    let st;
    try { st = fs.statSync(fp); } catch { continue; }
    const [, y, mo, dd, hh, mi, ss, sid] = m;
    const d = new Date(+y, +mo - 1, +dd, +hh, +mi, +ss);
    const start = Number.isNaN(d.getTime()) ? st.mtimeMs / 1000 : d.getTime() / 1000;
    out.push({
      source: 'codex', id: sid, path: fp,
      project: codexMetaCwd(fp),
      title: (titles[sid] || '').replace(/\n/g, ' ').trim().slice(0, 80),
      start, end: st.mtimeMs / 1000, size: st.size, prompts: 0,
    });
  }
  return out;
}

function collect(source) {
  let out = [];
  if (source === 'all' || source === 'claude') out = out.concat(ccCollect());
  if (source === 'all' || source === 'codex') out = out.concat(codexCollect());
  return out;
}

function filterSessions(sessions, since, until, project) {
  const out = sessions.filter((s) => {
    if (since && s.end < since) return false;
    if (until && s.start > until) return false;
    if (project && !(s.project || '').toLowerCase().includes(project.toLowerCase())) return false;
    return true;
  });
  out.sort((a, b) => b.end - a.end);
  return out;
}

function resolve(sidPrefix, source) {
  const matches = collect(source).filter((s) => s.id.startsWith(sidPrefix));
  if (matches.length === 0) die(`找不到 id 以 "${sidPrefix}" 开头的会话（来源: ${source}）`);
  if (matches.length > 1) {
    const ids = matches.slice(0, 10).map((m) => `${m.source}:${m.id.slice(0, 12)}`).join(', ');
    die(`id 前缀 "${sidPrefix}" 匹配到多个会话: ${ids}，请加长前缀或用 --source 限定`);
  }
  return matches[0];
}

// ---------------- 提取消息 ----------------

function ccMessages(file, withTools) {
  const msgs = [];
  for (const line of readLines(file)) {
    const d = jparse(line);
    if (!d || (d.type !== 'user' && d.type !== 'assistant')) continue;
    if (d.isSidechain) continue; // 子代理对话，跳过
    const m = d.message || {};
    const role = m.role || d.type;
    const ts = isoToEpoch(d.timestamp);
    const c = m.content;
    const parts = [];
    if (typeof c === 'string') {
      parts.push(c);
    } else if (Array.isArray(c)) {
      for (const item of c) {
        if (!item || typeof item !== 'object') continue;
        if (item.type === 'text') {
          parts.push(item.text || '');
        } else if (item.type === 'tool_use' && withTools) {
          let arg = '';
          try { arg = JSON.stringify(item.input || {}); } catch { /* ignore */ }
          parts.push(`[调用工具 ${item.name}] ${arg.slice(0, 200)}`);
        }
      }
    }
    const text = parts.filter(Boolean).join('\n').trim();
    if (!text || SKIP_PREFIX.some((p) => text.startsWith(p))) continue;
    msgs.push({ role, ts, text });
  }
  return msgs;
}

function codexMessages(file, withTools) {
  const msgs = [];
  const fallback = [];
  for (const line of readLines(file)) {
    const d = jparse(line);
    if (!d) continue;
    const ts = isoToEpoch(d.timestamp);
    const t = d.type;
    const p = d.payload || {};
    const pt = p.type;
    if (t === 'event_msg' && pt === 'user_message') {
      msgs.push({ role: 'user', ts, text: (p.message || '').trim() });
    } else if (t === 'event_msg' && pt === 'agent_message') {
      msgs.push({ role: 'assistant', ts, text: (p.message || '').trim() });
    } else if (t === 'response_item' && pt === 'function_call' && withTools) {
      msgs.push({ role: 'tool', ts, text: `[调用工具 ${p.name}] ${(p.arguments || '').slice(0, 200)}` });
    } else if (t === 'response_item' && pt === 'message') {
      // 旧版/兜底路径：从 response_item 提取，过滤注入的环境上下文
      const texts = (p.content || [])
        .filter((c) => c && (c.type === 'input_text' || c.type === 'output_text'))
        .map((c) => c.text || '');
      const text = texts.filter(Boolean).join('\n').trim();
      if (text && !text.startsWith('<')) {
        fallback.push({ role: p.role || '?', ts, text });
      }
    }
  }
  const hasReal = msgs.some((m) => (m.role === 'user' || m.role === 'assistant') && m.text);
  if (hasReal) return msgs.filter((m) => m.text);
  return fallback;
}

function sessionMessages(s, withTools) {
  return s.source === 'claude' ? ccMessages(s.path, withTools) : codexMessages(s.path, withTools);
}

// ---------------- 输出 ----------------

function printSessionHeader(s, total, lo, hi) {
  console.log(`会话: [${s.source}] ${s.id}`);
  console.log(`项目: ${shortPath(s.project)}`);
  console.log(`时间: ${fmtTs(s.start)} → ${fmtTs(s.end)}   文件: ${shortPath(s.path)}`);
  if (s.title) console.log(`标题: ${s.title}`);
  console.log(`共 ${total} 条消息，显示第 ${lo}–${hi} 条`);
  console.log('-'.repeat(60));
}

function printMessages(msgs, startNo, maxChars) {
  let no = startNo;
  for (const m of msgs) {
    let text = m.text;
    let suffix = '';
    if (maxChars && text.length > maxChars) {
      suffix = `\n  …(已截断，全文 ${text.length} 字符，用 --full 或调大 --max-chars 查看)`;
      text = text.slice(0, maxChars);
    }
    const body = text.split('\n').map((ln) => '  ' + ln).join('\n');
    console.log(`\n#${no} [${m.role}] ${fmtTs(m.ts)}`);
    console.log(body + suffix);
    no++;
  }
}

function showSession(s, opts) {
  let msgs = sessionMessages(s, opts.tools);
  if (opts.role) msgs = msgs.filter((m) => m.role === opts.role);
  const total = msgs.length;
  let lo = 1;
  let hi = total;
  let sel;
  if (opts.range) {
    const mm = /^(\d+):(\d+)$/.exec(opts.range);
    if (!mm) die(`--range 格式应为 A:B（1 起始，闭区间），收到: "${opts.range}"`);
    lo = +mm[1];
    hi = Math.min(+mm[2], total);
    sel = msgs.slice(lo - 1, hi);
  } else if (opts.head) {
    hi = Math.min(opts.head, total);
    sel = msgs.slice(0, opts.head);
  } else if (opts.tail) {
    lo = Math.max(1, total - opts.tail + 1);
    sel = msgs.slice(lo - 1);
  } else {
    sel = msgs;
  }
  printSessionHeader(s, total, sel.length ? lo : 0, sel.length ? hi : 0);
  if (!sel.length) {
    console.log('(没有可显示的消息)');
    return;
  }
  printMessages(sel, lo, opts.full ? null : opts.maxChars);
}

// ---------------- 子命令 ----------------

function cmdList(o) {
  const since = parseWhen(o.since);
  const until = parseWhen(o.until);
  const project = o.cwd ? process.cwd() : o.project;
  const all = filterSessions(collect(o.source), since, until, project);
  const rows = all.slice(0, o.limit);
  if (!rows.length) {
    console.log('没有匹配的会话。');
    return;
  }
  for (const s of rows) {
    let line2 = `   ${fmtTs(s.start)} → ${fmtTs(s.end)}   ${Math.floor(s.size / 1024)}KB`;
    if (s.prompts) line2 += `   提问 ${s.prompts} 次`;
    console.log(`[${s.source}] ${s.id}`);
    console.log(line2);
    console.log(`   项目: ${shortPath(s.project)}`);
    if (s.title) console.log(`   标题: ${s.title}`);
    console.log('');
  }
  console.log(`共 ${all.length} 个会话，已显示 ${rows.length} 个。用 \`show <id前缀>\` 查看内容。`);
}

function cmdShow(o) {
  const s = resolve(o.session, o.source);
  showSession(s, o);
}

function cmdSearch(o) {
  const kw = o.keyword.toLowerCase();
  const since = parseWhen(o.since);
  const until = parseWhen(o.until);
  const hits = new Map(); // "source:sid" -> {source, sid, ts, project, excerpts}

  const add = (source, sid, ts, proj, text) => {
    const key = `${source}:${sid}`;
    let h = hits.get(key);
    if (!h) {
      h = { source, sid, ts: ts || 0, project: proj || '', excerpts: [] };
      hits.set(key, h);
    }
    h.ts = Math.max(h.ts, ts || 0);
    if (proj && !h.project) h.project = proj;
    if (h.excerpts.length < 2) {
      const pos = text.toLowerCase().indexOf(kw);
      const a = Math.max(0, pos - 40);
      h.excerpts.push(text.slice(a, pos + kw.length + 60).replace(/\n/g, ' '));
    }
  };

  if (o.content) {
    const sessions = filterSessions(collect(o.source), since, until, o.project);
    for (const s of sessions) {
      for (const m of sessionMessages(s, false)) {
        if (m.text.toLowerCase().includes(kw)) {
          add(s.source, s.id, m.ts || s.end, s.project, m.text);
        }
      }
    }
  } else {
    if (o.source === 'all' || o.source === 'claude') {
      for (const line of readLines(CC_HISTORY)) {
        const d = jparse(line);
        if (!d) continue;
        const text = d.display || '';
        if (text.toLowerCase().includes(kw)) {
          add('claude', d.sessionId || '?', (d.timestamp || 0) / 1000, d.project, text);
        }
      }
    }
    if (o.source === 'all' || o.source === 'codex') {
      for (const line of readLines(CODEX_HISTORY)) {
        const d = jparse(line);
        if (!d) continue;
        const text = d.text || '';
        if (text.toLowerCase().includes(kw)) {
          add('codex', d.session_id || '?', d.ts, '', text);
        }
      }
    }
    // 索引模式下也应用时间/项目过滤
    for (const [key, h] of [...hits]) {
      if (since && h.ts < since) { hits.delete(key); continue; }
      if (until && h.ts > until) { hits.delete(key); continue; }
      if (o.project && !h.project.toLowerCase().includes(o.project.toLowerCase())) hits.delete(key);
    }
  }

  const rows = [...hits.values()].sort((a, b) => b.ts - a.ts).slice(0, o.limit);
  if (!rows.length) {
    console.log(`没有找到包含 "${o.keyword}" 的会话。` +
      (o.content ? '' : '（默认只搜用户提问索引，加 --content 可全文搜索）'));
    return;
  }
  for (const h of rows) {
    console.log(`[${h.source}] ${h.sid}   ${fmtTs(h.ts)}   ${shortPath(h.project)}`);
    for (const ex of h.excerpts) console.log(`   …${ex}…`);
    console.log('');
  }
  console.log(`共命中 ${hits.size} 个会话，已显示 ${rows.length} 个。用 \`show <id前缀>\` 查看内容。`);
}

function cmdLast(o) {
  const project = o.project || process.cwd();
  const rows = filterSessions(collect(o.source), null, null, project);
  if (!rows.length) die(`项目 "${project}" 下没有找到任何会话。`);
  const now = Date.now() / 1000;
  // 跳过疑似仍在进行中的当前会话（最近 grace 秒内有写入）
  let candidates = rows.filter((s) => now - s.end > o.grace);
  if (!candidates.length) candidates = rows;
  const n = Math.min(o.n, candidates.length);
  showSession(candidates[n - 1], o);
}

// ---------------- 参数解析 ----------------

const USAGE = `用法: node chat_history.js <子命令> [选项]

子命令:
  list    列出会话
          --source all|claude|codex  --project <子串>  --cwd
          --since <时间>  --until <时间>  --limit <N=20>
  show    读取某个会话（支持局部读取）
          <id前缀>  --head N | --tail N | --range A:B  --role user|assistant
          --max-chars <N=800>  --full  --tools  --source ...
  search  按关键词搜索会话
          <关键词>  --content（全文搜索，较慢）  --project <子串>
          --since/--until  --limit <N=20>  --source ...
  last    显示项目最近一次（非当前）会话
          --project <子串，默认当前目录>  -n <倒数第n个=1>  --tail <N=20>
          --role  --max-chars  --full  --tools  --grace <秒=120>  --source ...

时间格式: YYYY-MM-DD 或 "YYYY-MM-DD HH:MM[:SS]"`;

const SPECS = {
  list: {
    vals: ['source', 'project', 'since', 'until', 'limit'],
    bools: ['cwd'],
    ints: ['limit'],
    pos: [],
    defaults: { source: 'all', limit: 20 },
    fn: cmdList,
  },
  show: {
    vals: ['source', 'head', 'tail', 'range', 'role', 'max-chars'],
    bools: ['full', 'tools'],
    ints: ['head', 'tail', 'max-chars'],
    pos: ['session'],
    defaults: { source: 'all', 'max-chars': 800 },
    fn: cmdShow,
  },
  search: {
    vals: ['source', 'project', 'since', 'until', 'limit'],
    bools: ['content'],
    ints: ['limit'],
    pos: ['keyword'],
    defaults: { source: 'all', limit: 20 },
    fn: cmdSearch,
  },
  last: {
    vals: ['source', 'project', 'n', 'tail', 'role', 'max-chars', 'grace'],
    bools: ['full', 'tools'],
    ints: ['n', 'tail', 'max-chars', 'grace'],
    pos: [],
    defaults: { source: 'all', n: 1, tail: 20, 'max-chars': 800, grace: 120 },
    fn: cmdLast,
  },
};

function parseArgv(argv, spec, cmd) {
  const o = { ...spec.defaults };
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(USAGE);
      process.exit(0);
    }
    if (a.startsWith('-') && a !== '-') {
      let name = a.replace(/^--?/, '');
      let val = null;
      const eq = name.indexOf('=');
      if (eq >= 0) {
        val = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      if (spec.bools.includes(name)) {
        o[name] = true;
      } else if (spec.vals.includes(name)) {
        if (val === null) {
          val = argv[++i];
          if (val === undefined) die(`选项 --${name} 缺少值`);
        }
        o[name] = val;
      } else {
        die(`未知选项: ${a}（子命令 ${cmd}）\n\n${USAGE}`);
      }
    } else {
      positionals.push(a);
    }
  }
  for (let j = 0; j < spec.pos.length; j++) {
    if (positionals[j] === undefined) die(`缺少参数 <${spec.pos[j]}>（子命令 ${cmd}）\n\n${USAGE}`);
    o[spec.pos[j]] = positionals[j];
  }
  if (positionals.length > spec.pos.length) {
    die(`多余的参数: ${positionals.slice(spec.pos.length).join(' ')}`);
  }
  for (const k of spec.ints) {
    if (o[k] !== undefined && o[k] !== null) {
      const v = parseInt(o[k], 10);
      if (Number.isNaN(v)) die(`选项 --${k} 需要整数，收到: "${o[k]}"`);
      o[k] = v;
    }
  }
  if (o.source && !['all', 'claude', 'codex'].includes(o.source)) {
    die(`--source 只能是 all|claude|codex，收到: "${o.source}"`);
  }
  if (o.role && !['user', 'assistant'].includes(o.role)) {
    die(`--role 只能是 user|assistant，收到: "${o.role}"`);
  }
  o.maxChars = o['max-chars'];
  return o;
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(USAGE);
    process.exit(cmd ? 0 : 1);
  }
  const spec = SPECS[cmd];
  if (!spec) die(`未知子命令: ${cmd}\n\n${USAGE}`);
  const o = parseArgv(argv.slice(1), spec, cmd);
  spec.fn(o);
}

main();
