"use strict";
// Calgoal — app logic. Exercise data lives in data.js, animations in anim.js and moves.js.
// Everything a person enters is saved on this phone. (Saved data and backups keep the old
// internal name "rung-by-rung" so nothing is lost.)

const LS_KEY = "rung-state-v2";
const app = document.getElementById("app");
// True inside the installed Android app (Capacitor), false in a browser.
const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
const CAN_DOWNLOAD = NATIVE || (typeof Blob !== "undefined" && "download" in document.createElement("a"));
const DEFAULT_DAYS = Object.keys(DAYS).map(k => ({ key: k, label: DAYS[k].label }));
const EXTRA_COLORS = ["var(--d4)", "var(--d5)", "var(--d6)"];
const MAX_DAYS = 6, LOG_CAP = 60;

// ---------- helpers ----------
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(es|s)$/, "");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const uniq = a => [...new Set(a)];
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, msg.length > 60 ? 4800 : 2800);
}

const dateOf = s => new Date(s + "T12:00:00");
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function today() { return iso(new Date()); }
function shiftDate(s, n) { const d = dateOf(s); d.setDate(d.getDate() + n); return iso(d); }
function daysAgo(s) { return Math.round((dateOf(today()) - dateOf(s)) / 86400000); }
function fmtDate(s) { const d = dateOf(s); return isNaN(d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function fmtAgo(s) { const n = daysAgo(s); return n <= 0 ? "today" : n === 1 ? "yesterday" : n < 30 ? `${n} days ago` : "on " + fmtDate(s); }
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---------- state ----------
// setup:   false until the first-time setup is finished
// days:    the training days, in order            plan:   exercise ids on each day, in order
// levels:  current step per exercise              custom: exercises the person wrote
// names / targets: the person's own names and targets, laid over the built-in ones
// logs:    sessions per exercise                  ups:    history of level changes
// skillsSeen: unlocked skills already shown on the Skills screen
function blankState() {
  const plan = {};
  for (const d of DEFAULT_DAYS) plan[d.key] = DAYS[d.key].list.slice();
  return { setup: false, days: DEFAULT_DAYS.map(d => ({ key: d.key, label: d.label })), plan, levels: {}, custom: {}, names: {}, targets: {}, logs: {}, ups: [], backupAt: "", snooze: "", skillsSeen: [] };
}
let state = blankState();
let exCache = new Map();

function normalizeState(raw) {
  if (raw && raw.app === "rung-by-rung" && raw.state) raw = raw.state;
  const s = blankState();
  if (!raw || typeof raw !== "object") return s;
  // Anything saved before the setup screens existed counts as already set up.
  s.setup = raw.setup !== false;

  if (raw.custom && typeof raw.custom === "object") {
    for (const [id, e] of Object.entries(raw.custom)) {
      if (!/^c-[a-z0-9-]{1,60}$/.test(id) || !e || !Array.isArray(e.steps)) continue;
      const steps = e.steps.filter(x => Array.isArray(x) && x[0]).slice(0, 10).map(x => [str(x[0], 70), str(x[1], 40), str(x[2], 220)]);
      if (!steps.length) continue;
      if (Object.values(EX).some(b => norm(b.name) === norm(e.name || steps[0][0]))) continue;
      s.custom[id] = {
        name: str(e.name, 70) || steps[0][0], focus: str(e.focus, 80),
        start: Math.min(Math.max(0, Number(e.start) | 0), steps.length - 1), steps,
        related: Array.isArray(e.related) ? e.related.map(r => str(r, 70)).slice(0, 5) : [],
        alts: Array.isArray(e.alts) ? e.alts.map(a => str(a, 60)).filter(Boolean).slice(0, 4) : []
      };
    }
  }
  const known = id => !!(EX[id] || CATALOG[id] || s.custom[id]);
  const stepsOf = id => (EX[id] || CATALOG[id] || s.custom[id]).steps;

  if (Array.isArray(raw.days)) {
    const seen = new Set(), list = [];
    for (const d of raw.days) {
      const key = d && String(d.key || "");
      if (!/^[a-z0-9]{1,10}$/.test(key) || seen.has(key) || list.length >= MAX_DAYS) continue;
      seen.add(key);
      list.push({ key, label: str(d.label, 16) || (DAYS[key] ? DAYS[key].label : "Day " + (list.length + 1)) });
    }
    if (list.length) s.days = list;
  }
  s.plan = {};
  for (const { key } of s.days) {
    if (raw.plan && Array.isArray(raw.plan[key])) s.plan[key] = uniq(raw.plan[key].map(String)).filter(known);
    // Older saves listed only the exercises added on top of the standard plan.
    else if (DAYS[key]) s.plan[key] = uniq([...DAYS[key].list, ...(raw.adds && Array.isArray(raw.adds[key]) ? raw.adds[key].map(String) : [])]).filter(known);
    else s.plan[key] = [];
  }

  if (raw.levels && typeof raw.levels === "object") {
    for (const [id, v] of Object.entries(raw.levels)) if (known(id) && Number.isInteger(v)) s.levels[id] = v;
  }
  if (raw.names && typeof raw.names === "object") {
    for (const [id, v] of Object.entries(raw.names)) if (known(id) && str(v, 60)) s.names[id] = str(v, 60);
  }
  if (raw.targets && typeof raw.targets === "object") {
    for (const [id, o] of Object.entries(raw.targets)) {
      if (!known(id) || !o || typeof o !== "object") continue;
      const out = {};
      for (const [i, v] of Object.entries(o)) if (stepsOf(id)[i] && parseTarget(str(v, 40))) out[i] = str(v, 40);
      if (Object.keys(out).length) s.targets[id] = out;
    }
  }
  if (raw.logs && typeof raw.logs === "object") {
    for (const [id, arr] of Object.entries(raw.logs)) {
      if (!known(id) || !Array.isArray(arr)) continue;
      const list = arr.filter(l => l && Array.isArray(l.sets) && l.sets.length && isDate(l.d)).slice(-LOG_CAP).map(l => ({
        d: l.d, step: Math.max(0, Number(l.step) | 0),
        sets: l.sets.slice(0, 6).map(n => Math.max(0, Math.min(9999, Math.round(Number(n) || 0))))
      }));
      if (list.length) s.logs[id] = list;
    }
  }
  if (Array.isArray(raw.ups)) {
    s.ups = raw.ups.filter(u => u && known(u.id) && isDate(u.d) && Number.isInteger(u.from) && Number.isInteger(u.to)).slice(-100)
      .map(u => ({ d: u.d, id: String(u.id), from: u.from, to: u.to }));
  }
  if (isDate(raw.backupAt)) s.backupAt = raw.backupAt;
  if (isDate(raw.snooze)) s.snooze = raw.snooze;
  if (Array.isArray(raw.skillsSeen)) s.skillsSeen = uniq(raw.skillsSeen.map(String)).filter(id => SKILLS.some(k => k.id === id));
  return s;
}

function persist() {
  exCache = new Map();
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch (e) { toast("Couldn't save. Your phone may be low on storage."); }
}

// ---------- targets ----------
// Reads a target like "3 × 8", "3 × 30–45s", "2 × 2 min", "3 × 5 → 3 × 10", "3 × 6 per side"
function parseTarget(t) {
  const parts = String(t || "").split("→");
  const seg = parts.pop().split(",")[0].trim();
  const m = seg.match(/^(?:(\d+)\s*[×xX]\s*)?(\d+)(?:\s*[–—-]\s*(\d+))?\s*(min|sec|s)?\b/i);
  if (!m) return null;
  const mult = m[4] && /^min/i.test(m[4]) ? 60 : 1;
  const per = (seg.match(/per (side|arm|leg)/i) || [])[1] || "";
  let lo = Number(m[2]) * mult;
  const from = parts.length ? parts[0].match(/(\d+)\s*[×xX]\s*(\d+)/) : null;
  if (from) lo = Math.min(lo, Number(from[2]) * mult);
  return { sets: Math.min(Math.max(Number(m[1]) || 1, 1), 6), lo, goal: Number(m[3] || m[2]) * mult, unit: m[4] ? "s" : "reps", per: per.toLowerCase() };
}
function fmtGoal(tg) {
  const v = tg.unit === "s" ? (tg.goal >= 120 && tg.goal % 60 === 0 ? tg.goal / 60 + " min" : tg.goal + "s") : tg.goal + " reps";
  return v + (tg.per ? " per " + tg.per : "");
}
function unitLabel(tg) { return (tg.unit === "s" ? "seconds" : "reps") + (tg.per ? " per " + tg.per : "") + " in each set"; }
// The target in plain words, e.g. "3 sets of 5 to 10 reps. Start at 5 and build up to 10."
function explainTarget(raw) {
  const tg = parseTarget(raw);
  if (!tg) return "";
  const secs = tg.unit === "s", per = tg.per ? ` per ${tg.per}` : "";
  const word = /\d\s*steps?\b/i.test(raw) ? "step" : "rep";
  const amount = v => secs ? (v >= 120 && v % 60 === 0 ? `${v / 60} minutes` : `${v} seconds`) : plural(v, word);
  const sets = secs ? plural(tg.sets, "hold") : plural(tg.sets, "set");
  let s = tg.lo < tg.goal ? `${sets} of ${tg.lo} to ${amount(tg.goal)}${per}. Start at ${tg.lo} and build up to ${tg.goal}.` : `${sets} of ${amount(tg.goal)}${per}.`;
  const tail = String(raw).split("→").pop().split(",").slice(1).join(",");
  const down = tail.match(/(\d+)s down/i), hold = tail.match(/(\d+)s hold/i);
  if (down) s += ` Lower for ${down[1]} seconds on each rep.`;
  if (hold) s += ` Pause for ${hold[1]} seconds on each rep.`;
  return s;
}
function bestSets(tg, vals) { const top = [...vals].sort((a, b) => b - a).slice(0, tg.sets); while (top.length < tg.sets) top.push(0); return top; }
function evaluate(tg, vals) {
  const top = bestSets(tg, vals);
  if (top.every(v => v >= tg.goal)) return "ready";
  if (top[0] < tg.lo * 0.5) return "hard";
  return "keep";
}

// ---------- lookups ----------
const dayKeys = () => state.days.map(d => d.key);
function dayLabel(k) { const d = state.days.find(x => x.key === k); return d ? d.label : DAYS[k] ? DAYS[k].label : "Day"; }
const withDay = label => /\bday\b/i.test(label) ? label : label + " day";
const dayName = k => withDay(dayLabel(k));
function dayColor(k) { return DAYS[k] ? `var(--${k})` : EXTRA_COLORS[(parseInt(String(k).slice(1), 10) || 0) % EXTRA_COLORS.length]; }
// The shortest start of a day's name that no other day shares: "Pus", "Pul", "L".
function dayAbbr(k) {
  const mine = dayLabel(k).replace(/\s+/g, ""), others = state.days.filter(d => d.key !== k).map(d => d.label.replace(/\s+/g, "").toLowerCase());
  for (let n = 1; n <= 3; n++) {
    const a = mine.slice(0, n);
    if (a.length === n && !others.some(o => o.startsWith(a.toLowerCase()))) return a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
  }
  return String(dayKeys().indexOf(k) + 1);
}
const dayHeading = label => `<em>${esc(label)}</em>${/\bday\b/i.test(label) ? "" : " day"}`;

function baseEx(id) { return EX[id] || CATALOG[id] || state.custom[id] || null; }
// The exercise as the person sees it: their own name and targets laid over the built-in ones.
function getEx(id) {
  const b = baseEx(id);
  if (!b) return null;
  const nm = state.names[id], tg = state.targets[id];
  if (!nm && !tg) return b;
  let m = exCache.get(id);
  if (!m) { m = Object.assign({}, b, { name: nm || b.name, steps: b.steps.map((s, i) => tg && tg[i] ? [s[0], tg[i], s[2]] : s) }); exCache.set(id, m); }
  return m;
}
function dayList(d) { return (state.plan[d] || []).filter(id => baseEx(id)); }
function daysOf(id) { return dayKeys().filter(d => dayList(d).includes(id)); }
function planIds() { return uniq(dayKeys().flatMap(dayList)); }
function isAdded(id) { return !Object.keys(DAYS).some(d => DAYS[d].list.includes(id)); }
function lvl(id) { const e = baseEx(id), v = state.levels[id]; return Number.isInteger(v) && v >= 0 && v < e.steps.length ? v : e.start; }
function setLevel(id, n) {
  const from = lvl(id);
  if (n === from) return;
  state.levels[id] = n;
  state.ups = state.ups.concat({ d: today(), id, from, to: n }).slice(-100);
  persist();
}

// Every name the search knows: plan exercises and their steps first, then other names, then ready-made ladders.
function buildIndex() {
  const idx = new Map();
  const put = (name, id, step) => { const k = norm(name); if (k && !idx.has(k)) idx.set(k, { name, id, step }); };
  const plan = planIds();
  for (const id of plan) put(getEx(id).name, id, -1);
  for (const id of plan) getEx(id).steps.forEach((s, i) => put(s[0], id, i));
  for (const [name, [id, step]] of Object.entries(ALIASES)) if (getEx(id)) put(name, id, step);
  const others = Object.keys(CATALOG).filter(id => !plan.includes(id));
  for (const id of others) put(CATALOG[id].name, id, -1);
  for (const id of others) CATALOG[id].steps.forEach((s, i) => put(s[0], id, i));
  return idx;
}

// ---------- session log ----------
function latestLog(id) { const l = state.logs[id]; return l && l.length ? l[l.length - 1] : null; }
function stepLogs(id, c) { return (state.logs[id] || []).filter(l => l.step === c); }
function doneToday(id) { const l = latestLog(id); return !!l && l.d === today(); }
// One entry per exercise per day: saving again on the same day updates it.
function saveLog(id, vals) {
  const c = lvl(id), t = today();
  const list = state.logs[id] = state.logs[id] || [];
  const last = list[list.length - 1];
  if (last && last.d === t && last.step === c) last.sets = vals; else list.push({ d: t, step: c, sets: vals });
  state.logs[id] = list.slice(-LOG_CAP);
  persist();
}
// Where the person stands on their current step:
// "none" (nothing logged), "hard", "keep", "once" (target hit in the latest session), "ready" (two sessions in a row).
function standing(id) {
  const e = getEx(id), c = lvl(id), tg = parseTarget(e.steps[c][1]), logs = stepLogs(id, c);
  if (!logs.length || !tg) return "none";
  const v = evaluate(tg, logs[logs.length - 1].sets);
  if (v !== "ready") return v;
  const prev = logs[logs.length - 2];
  return prev && evaluate(tg, prev.sets) === "ready" ? "ready" : "once";
}
function isReady(id) { return standing(id) === "ready" && !!getEx(id).steps[lvl(id) + 1]; }

function verdictHTML(id) {
  const e = getEx(id), c = lvl(id), logs = stepLogs(id, c);
  const last = latestLog(id);
  if (!last || last.step !== c) return "";
  const tg = parseTarget(e.steps[c][1]);
  if (!tg) return `<div class="verdict"><b>Saved</b><span>This step has no target, so Calgoal can't judge it. Open the step in the progression and tap Change target.</span></div>`;
  const st = standing(id), next = e.steps[c + 1], prev = e.steps[c - 1];
  const setsWord = tg.sets === 1 ? "your set" : `all ${tg.sets} sets`;
  const sum = l => l.sets.reduce((a, b) => a + b, 0);
  let cmp = "";
  if (logs.length > 1) {
    const d = sum(logs[logs.length - 1]) - sum(logs[logs.length - 2]), u = tg.unit === "s" ? "second" : "rep";
    cmp = d > 0 ? ` That's ${plural(d, u)} more in total than the session before.` : d < 0 ? ` That's ${plural(-d, u)} fewer in total than the session before.` : " Same total as the session before.";
  }
  if (st === "ready" || st === "once") {
    if (!next) return `<div class="verdict ready"><b>Target reached</b><span>You reached ${fmtGoal(tg)} on ${setsWord}. This is the top of the ladder, so keep progressing with more reps, a slower tempo or added weight.</span></div>`;
    if (st === "once") return `<div class="verdict ready"><b>Target reached</b><span>You reached ${fmtGoal(tg)} on ${setsWord}.${cmp} Do it again next session and you're ready to move up.</span></div>`;
    return `<div class="verdict ready"><b>Ready to move up</b>
      <span>You reached ${fmtGoal(tg)} on ${setsWord}, two sessions in a row. Next step: ${esc(next[0])}${next[1] ? ` (${esc(next[1])})` : ""}.</span>
      <button class="btn" data-level="${c + 1}">Move up to ${esc(next[0])}</button></div>`;
  }
  if (st === "hard") return `<div class="verdict hard"><b>This step looks too hard for now</b>
    <span>${prev ? `Consider dropping back to ${esc(prev[0])}${prev[1] ? ` (${esc(prev[1])})` : ""} and coming back once that feels solid.` : `Stay here and build up slowly. Shorter sets with clean form are fine.`}</span>
    ${prev ? `<button class="btn ghost" data-level="${c - 1}">Drop back to ${esc(prev[0])}</button>` : ""}</div>`;
  const top = bestSets(tg, last.sets);
  const hits = top.filter(x => x >= tg.goal).length;
  const inRange = tg.goal > tg.lo && top.every(x => x >= tg.lo);
  return `<div class="verdict"><b>Stay on this step</b><span>${inRange ? "You're in the working range. " : ""}${hits} of ${plural(tg.sets, "set")} reached ${fmtGoal(tg)}.${cmp}</span></div>`;
}

// The log form, filled in from the last session on this step so only the differences need typing.
function logFormHTML(id) {
  const c = lvl(id), tg = parseTarget(getEx(id).steps[c][1]);
  const logs = stepLogs(id, c), last = logs[logs.length - 1];
  const isToday = !!last && last.d === today();
  const n = Math.max(tg ? tg.sets : 3, last ? Math.min(last.sets.length, 6) : 0);
  const hint = isToday ? "Logged today. Change a number and save to update it."
    : last ? `Filled in from ${fmtAgo(last.d)}. Change what's different.`
    : `Type the ${tg ? unitLabel(tg) : "reps or seconds in each set"}.`;
  return `<form class="log" id="logform" novalidate>
      <div class="k">Log this session</div>
      <div class="sets">${Array.from({ length: n }, (_, i) => `<label for="set-${i + 1}">Set ${i + 1}<input id="set-${i + 1}" type="number" inputmode="numeric" min="0" max="9999" value="${last && last.sets[i] != null ? last.sets[i] : ""}"></label>`).join("")}
        <button class="btn primary" type="submit">${isToday ? "Update" : "Save"}</button></div>
      <p class="note" id="log-hint">${hint}</p>
      ${tg && tg.unit === "s" ? `<div id="timer" class="timer"><button class="btn ghost" type="button" data-timer>Time a set</button></div>` : ""}
    </form>
    ${last && !isToday ? verdictHTML(id).replace(/^<div class="verdict[^"]*">/, m => `${m}<small class="when">From your session ${fmtAgo(last.d)}</small>`) : verdictHTML(id)}`;
}

function logListHTML(id) {
  const logs = state.logs[id];
  if (!logs || !logs.length) return "";
  const e = getEx(id);
  const rows = logs.map((l, i) => ({ l, i })).slice(-6).reverse();
  return `<section class="sect"><h2>Your log</h2><p>Latest first. A tick means every set hit the target.</p>
    <ul class="loglist">${rows.map(({ l, i }) => {
      const s = e.steps[l.step], tg = s && parseTarget(s[1]), ok = tg && evaluate(tg, l.sets) === "ready";
      return `<li><span class="dt">${esc(fmtDate(l.d))}</span>
        <span class="what">${esc(s ? s[0] : "Step " + (l.step + 1))}${s && s[1] ? `<small>Target ${esc(s[1])}</small>` : ""}</span>
        <span class="vals${ok ? " hit" : ""}">${l.sets.join(" · ")}${tg && tg.unit === "s" ? "s" : ""}${ok ? " ✓" : ""}</span>
        <button class="del" data-dellog="${i}" aria-label="Delete this entry">×</button></li>`;
    }).join("")}</ul></section>`;
}

// Bars for the last sessions on the current step: one group per session, one bar per set, with the target line.
function chartHTML(id) {
  const e = getEx(id), c = lvl(id), tg = parseTarget(e.steps[c][1]);
  const logs = stepLogs(id, c).slice(-8);
  if (!tg || logs.length < 2) return "";
  const W = 320, H = 150, L = 30, R = 8, T = 14, B = 24;
  const maxV = Math.max(tg.goal, ...logs.flatMap(l => l.sets)) * 1.12;
  const y = v => T + (H - T - B) * (1 - v / maxV);
  const gw = (W - L - R) / logs.length;
  const unit = tg.unit === "s" ? "s" : "";
  const groups = logs.map((l, gi) => {
    const sets = l.sets.slice(0, 6), bw = Math.min(10, (gw - 10) / sets.length - 2), total = sets.length * (bw + 2) - 2;
    const x0 = L + gi * gw + (gw - total) / 2;
    const bars = sets.map((v, si) => { const top = y(v), h = Math.max(1.5, H - B - top); return `<rect class="c-bar" x="${(x0 + si * (bw + 2)).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, bw / 2).toFixed(1)}"/>`; }).join("");
    const label = logs.length <= 5 || gi % 2 === (logs.length - 1) % 2 ? `<text class="c-txt" x="${(L + gi * gw + gw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(fmtDate(l.d))}</text>` : "";
    return `<g class="c-group" data-tip="${esc(fmtDate(l.d))}: ${l.sets.join(" · ")}${unit}" tabindex="0"><rect class="c-hit" x="${(L + gi * gw).toFixed(1)}" y="${T}" width="${gw.toFixed(1)}" height="${H - T - B}"/>${bars}</g>${label}`;
  }).join("");
  const last = logs[logs.length - 1];
  const best = Math.max(...logs.flatMap(l => l.sets));
  return `<section class="sect"><h2>Progress on this step</h2>
    <p>Each group is one session and each bar is a set. The dashed line is the target.</p>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sets per session on ${esc(e.steps[c][0])}, target ${esc(fmtGoal(tg))}">
      <line class="c-axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
      ${H - B - y(tg.goal) > 12 ? `<text class="c-txt" x="${L - 6}" y="${H - B + 3}" text-anchor="end">0</text>` : ""}
      <line class="c-goal" x1="${L}" x2="${W - R}" y1="${y(tg.goal).toFixed(1)}" y2="${y(tg.goal).toFixed(1)}"/>
      <text class="c-txt" x="${L - 6}" y="${(y(tg.goal) + 3).toFixed(1)}" text-anchor="end">${tg.goal}</text>
      ${groups}
    </svg></div>
    <p class="note" id="chart-tip">Latest: ${last.sets.join(" · ")}${unit}. Best set so far: ${best}${unit}. Tap a session for its numbers.</p></section>`;
}

// ---------- rendering ----------
let currentDay = dayKeys()[0];
let openStep = null, editTarget = -1, renaming = false;

function paint(key) { document.body.style.setProperty("--day", dayColor(key)); }
function renderTabs() {
  const nav = document.querySelector(".tabs");
  nav.classList.toggle("many", state.days.length > 3);
  nav.style.setProperty("--n", state.days.length);
  nav.innerHTML = state.days.map(d => `<button class="tab" data-day="${d.key}" aria-current="${d.key === currentDay}">${esc(d.label)}</button>`).join("");
}
function setDay(d) {
  if (!state.plan[d]) d = dayKeys()[0];
  currentDay = d;
  paint(d);
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-current", String(t.dataset.day === d)));
}

function meter(id) {
  const n = getEx(id).steps.length, c = lvl(id);
  let s = "";
  for (let i = 0; i < n; i++) s += `<i class="${i <= c ? "on" : ""}"></i>`;
  return `<span class="meter" aria-hidden="true">${s}</span>`;
}

function needsBackup() {
  const n = Object.values(state.logs).reduce((a, l) => a + l.length, 0);
  if (n < 5 || (state.snooze && today() < state.snooze)) return false;
  return !state.backupAt || daysAgo(state.backupAt) >= 30;
}

function renderDay(d) {
  setDay(d);
  d = currentDay;
  const list = dayList(d), done = list.filter(doneToday).length;
  app.innerHTML = `
    <div class="dayhead">
      <h1>${dayHeading(dayLabel(d))}</h1>
      <p>${list.length ? `${plural(list.length, "exercise")} in your order.${done ? ` ${done} done today.` : ""}` : "No exercises on this day yet. Add one below."}</p>
    </div>
    ${needsBackup() ? `<div class="remind"><span><b>Back up your progress.</b> It's stored only on this phone${state.backupAt ? `, and your last backup was ${fmtAgo(state.backupAt)}` : " and hasn't been backed up yet"}.</span>
      <div class="btns"><button class="btn primary" data-backup>Back up now</button><button class="btn ghost" data-snooze>Later</button></div></div>` : ""}
    ${list.length ? `<button class="btn primary big wide" data-workout>${!done ? "Start workout" : done === list.length ? "All done today. Review workout" : `Continue workout (${done} of ${list.length} done)`}</button>` : ""}
    <div>
      <ol class="list">
        ${list.map((id, i) => {
          const e = getEx(id), c = lvl(id), s = e.steps[c], logs = stepLogs(id, c), last = logs[logs.length - 1];
          const tg = parseTarget(s[1]), u = tg && tg.unit === "s" ? "s" : "";
          const lastTxt = !last ? "Not logged at this level yet" : last.d === today() ? `<b class="today">✓ Today:</b> ${last.sets.join(" · ")}${u}` : `Last: ${last.sets.join(" · ")}${u}, ${fmtAgo(last.d)}`;
          return `<li><button class="row" data-go="${esc(id)}">
            <span class="n">${i + 1}</span>
            <span class="txt"><span class="name">${esc(e.name)}${isAdded(id) ? "<small>Added</small>" : ""}</span>
            <span class="lvl"><strong>${esc(s[0])}</strong>${s[1] ? ` · ${esc(s[1])}` : ""}</span>
            <span class="last">${lastTxt}${isReady(id) ? `<span class="ready-pill">Ready to move up</span>` : ""}</span></span>
            ${meter(id)}
          </button></li>`;
        }).join("")}
      </ol>
      <button class="addrow" data-add><span>+</span> Add an exercise to ${esc(dayName(d))}</button>
    </div>
    <p class="note">Tap an exercise for its progression, animation and log. Everything is saved on this phone.</p>
    <div class="footbtns"><button class="btn ghost" data-editplan>Change my plan</button><button class="btn ghost" data-backup>Backup and data</button></div>`;
}

// ---------- animations and videos ----------
const REDUCE_MOTION = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function animId(id, i) {
  const m = typeof STEP_ANIM !== "undefined" && STEP_ANIM[id];
  return m && m[i] && typeof MOVES !== "undefined" && MOVES[m[i]] ? m[i] : null;
}
function demoHTML(id, i, cls) {
  const a = animId(id, i);
  if (!a) return "";
  const name = getEx(id).steps[i][0];
  return `<div class="demo ${cls}" data-anim="${a}" data-label="${esc(name)}"${REDUCE_MOTION ? ` role="button" tabindex="0" title="Tap to play"` : ""}></div>`;
}
// Animations marked "lazy" only play while they're on screen, so a long list stays light.
const lazyObs = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  for (const en of entries) { const c = en.target._ctl; if (c) { if (en.isIntersecting) c.play(); else c.stop(); } }
}, { threshold: 0.3 }) : null;
function mountDemos(scope) {
  if (typeof CalAnim === "undefined") return;
  scope.querySelectorAll(".demo[data-anim]").forEach(el => {
    if (el.firstChild) return;
    const lazy = el.classList.contains("lazy") && !!lazyObs && !REDUCE_MOTION;
    el._ctl = CalAnim.mount(el, MOVES[el.dataset.anim], { label: "Animation of " + el.dataset.label, paused: REDUCE_MOTION || lazy, at: REDUCE_MOTION || lazy ? 600 : 0 });
    if (lazy) lazyObs.observe(el);
  });
}
// A YouTube search for the step. Steps like "Assisted, partial range" get the exercise name in front.
function videoHref(e, i) {
  const s = e.steps[i][0];
  let q = s.replace(/,/g, "");
  const head = norm(s.split(",")[0]), main = norm(e.name.split(" ")[0]);
  if ((s.includes(",") && !head.includes(main)) || /^(lift and hold|single-leg on a step|slow single-leg|loaded single-leg)$/i.test(s)) q = e.name + " " + q;
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " exercise");
}
const videoLink = (e, i) => `<a class="vid" href="${videoHref(e, i)}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Watch a video</a>`;

function ladderHTML(e, c, interactive, id) {
  return `<ol class="ladder">${e.steps.map((s, i) => {
    const cls = i < c ? "done" : i === c ? "cur" : "";
    if (!interactive) return `<li class="${cls}"><div class="rung"><span class="i">${i + 1}</span><span class="nm">${esc(s[0])}</span><span class="tg">${esc(s[1])}</span>${s[2] ? `<span class="cue">${esc(s[2])}</span>` : ""}</div></li>`;
    const open = i === openStep;
    const own = !!(state.targets[id] && state.targets[id][i]);
    return `<li class="${cls}"><button class="rung" data-step="${i}" aria-expanded="${open}">
        <span class="i">${i + 1}</span><span class="nm">${esc(s[0])}</span><span class="tg">${esc(s[1])}${own ? " · yours" : ""}</span>
      </button>
      ${open ? `<div class="open-body">${demoHTML(id, i, "step-demo")}${s[2] ? `<p>${esc(s[2])}</p>` : ""}${explainTarget(s[1]) ? `<p class="plain">${esc(explainTarget(s[1]))}</p>` : ""}
        <div class="btns">${i === c
          ? `<span class="yours">Your level</span>`
          : `<button class="setbtn" data-set="${i}">Set as my level</button>`}${videoLink(e, i)}</div>
        ${editTarget === i ? `<div class="tgt-edit"><label for="tg-in">Target for this step</label>
            <div class="btns"><input id="tg-in" type="text" value="${esc(s[1])}" maxlength="40" autocomplete="off"><button class="btn primary" data-savetarget="${i}">Save</button>${own ? `<button class="btn ghost" data-resettarget="${i}">Use the original</button>` : ""}</div>
            <p class="note">Write it like 3 × 10, 3 × 30s or 3 × 6 per side. An x works for ×.</p><p class="err" id="tg-err" hidden></p></div>`
          : `<button class="linkbtn tap" data-edittarget="${i}">Change target</button>`}
        </div>` : ""}
    </li>`;
  }).join("")}</ol>`;
}

function relatedHTML(e, selfId, clickable) {
  const rel = (e.related || []).filter(r => r !== selfId && getEx(r) && daysOf(r).length);
  const alts = e.alts || [];
  if (!rel.length && !alts.length) return "";
  return `${rel.length ? `<div class="related">${rel.map(r => {
      const inner = `${esc(getEx(r).name)} <small>· ${daysOf(r).map(d => esc(dayLabel(d))).join(", ")}</small>`;
      return clickable ? `<button class="rel" data-go="${esc(r)}">${inner}</button>` : `<span class="rel">${inner}</span>`;
    }).join("")}</div>` : ""}
    ${alts.length ? `<ul class="alts" aria-label="Other options">${alts.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}`;
}

// The card for the current level: animation, step, target in plain words, cue and video.
function nowCardHTML(id) {
  const e = getEx(id), c = lvl(id), n = e.steps.length, cur = e.steps[c], nxt = e.steps[c + 1];
  const demo = demoHTML(id, c, "now-demo"), tg = parseTarget(cur[1]), plain = explainTarget(cur[1]);
  return `<section class="now" aria-label="Your current level">
      <div class="now-top${demo ? " has-demo" : ""}">${demo}
        <div class="now-info"><div class="k">Level ${c + 1} of ${n}</div>
        <div class="big">${esc(cur[0])}</div>
        <div class="tgt">${esc(cur[1])}</div>
        ${plain ? `<p class="plain">${esc(plain)}</p>` : ""}
        ${cur[2] ? `<p class="cue-now">${esc(cur[2])}</p>` : ""}
        ${videoLink(e, c)}</div>
      </div>
      <div class="next">${nxt
        ? `Next: <b>${esc(nxt[0])}</b>${nxt[1] ? ` (${esc(nxt[1])})` : ""}. ${tg ? `Move up after every set reaches ${fmtGoal(tg)} in two sessions in a row.` : `Move up once you can do every set with clean form.`}`
        : `Top of this ladder. Keep progressing with more reps, a slower tempo or added weight.`}</div>
      ${logFormHTML(id)}
    </section>`;
}

function renderEx(id) {
  const e = getEx(id), ds = daysOf(id);
  setDay(ds.includes(currentDay) ? currentDay : ds[0]);
  if (openStep === null) openStep = -1;
  const rel = relatedHTML(e, id, true);
  app.innerHTML = `
    <button class="back" data-back>← ${esc(dayName(currentDay))}</button>
    <div class="exhead">
      ${e.focus ? `<p class="eyebrow">${esc(e.focus)}</p>` : ""}
      <h1>${esc(e.name)}</h1>
      <div class="days">${ds.map(d => `<span class="chip" style="--c:${dayColor(d)}">${esc(dayName(d))}</span>`).join("")}${isAdded(id) ? `<span class="chip">Added by you</span>` : ""}</div>
    </div>
    ${nowCardHTML(id)}
    ${chartHTML(id)}
    ${logListHTML(id)}
    <section class="sect">
      <h2>Progression</h2>
      <p>Easiest first. Tap a step to see how it's done, set it as your level or change its target.</p>
      ${ladderHTML(e, lvl(id), true, id)}
    </section>
    ${rel ? `<section class="sect"><h2>Related</h2><p>Exercises in your plan that train the same pattern or support this one.</p>${rel}</section>` : ""}
    ${unlocksHTML(id)}
    <section class="manage">
      ${renaming ? `<div class="field"><label for="nm-in">Name of this exercise</label>
          <div class="btns"><input id="nm-in" type="text" value="${esc(e.name)}" maxlength="60" autocomplete="off"><button class="btn primary" data-savename>Save</button>${state.names[id] ? `<button class="btn ghost" data-resetname>Use the original</button>` : ""}</div></div>` : ""}
      <div class="btns">${renaming ? "" : `<button class="btn ghost" data-rename>Rename</button>`}${ds.map(d => `<button class="btn ghost" data-remove="${d}">Remove from ${esc(dayName(d))}</button>`).join("")}</div>
      <p class="note">A removed exercise keeps its level and log, and you can add it back any time.</p>
    </section>`;
  mountDemos(app);
}

// ---------- workout: the whole day in one pass ----------
function workoutStart(day) {
  const i = dayList(day).findIndex(id => !doneToday(id));
  location.hash = `workout-${day}-${i < 0 ? "done" : i}`;
}
function renderWorkout(day, pos) {
  setDay(day);
  const list = dayList(day);
  const i = pos === "done" ? list.length : Number(pos);
  if (i >= list.length) { renderWorkoutDone(day, list); return; }
  const id = list[i], e = getEx(id), logged = doneToday(id);
  const nextLabel = i + 1 < list.length ? `Next: ${esc(getEx(list[i + 1]).name)}` : "Finish";
  app.innerHTML = `
    <button class="back" data-back>← End workout</button>
    <div class="wk-prog"><p class="eyebrow">${esc(dayName(day))} · ${i + 1} of ${list.length}</p>
      <div class="wk-bar" aria-hidden="true">${list.map((x, k) => `<i class="${doneToday(x) ? "on" : ""}${k === i ? " cur" : ""}"></i>`).join("")}</div></div>
    <div class="exhead"><h1>${esc(e.name)}</h1></div>
    ${nowCardHTML(id)}
    <div class="wiz-nav">
      ${i > 0 ? `<button class="btn ghost" data-wk="${i - 1}">Back</button>` : `<span></span>`}
      <button class="btn ${logged ? "primary" : "ghost"}" data-wk="${i + 1 < list.length ? i + 1 : "done"}">${logged ? nextLabel : i + 1 < list.length ? "Skip" : "Skip and finish"}</button>
    </div>
    <button class="linkbtn tap" data-go="${esc(id)}">Open the full page for ${esc(e.name)}</button>`;
  mountDemos(app);
}
function renderWorkoutDone(day, list) {
  const done = list.filter(doneToday);
  const tag = id => {
    if (!doneToday(id)) return `<span class="tag">Skipped</span>`;
    const st = standing(id), e = getEx(id), c = lvl(id);
    if (st === "ready" && e.steps[c + 1]) return `<button class="btn small good" data-levelfor="${esc(id)}">Move up to ${esc(e.steps[c + 1][0])}</button>`;
    if (st === "ready" || st === "once") return `<span class="tag good">Target reached</span>`;
    if (st === "hard") return `<span class="tag warn">Too hard for now</span>`;
    return `<span class="tag">Keep going</span>`;
  };
  app.innerHTML = `
    <button class="back" data-back>← ${esc(dayName(day))}</button>
    <div class="exhead"><p class="eyebrow">${esc(dayName(day))}</p><h1>${done.length === list.length ? "Workout done" : done.length ? "Workout so far" : "Nothing logged yet"}</h1></div>
    <p class="lead">You logged ${done.length} of ${plural(list.length, "exercise")} today.</p>
    <ul class="sumlist">${list.map((id, k) => {
      const e = getEx(id), l = latestLog(id), tg = l && e.steps[l.step] && parseTarget(e.steps[l.step][1]);
      return `<li><button class="sum-main" data-wk="${k}"><b>${esc(e.name)}</b>
        <span>${doneToday(id) ? `${esc(e.steps[l.step] ? e.steps[l.step][0] : "")} · ${l.sets.join(" · ")}${tg && tg.unit === "s" ? "s" : ""}` : "Not logged"}</span></button>${tag(id)}</li>`;
    }).join("")}</ul>
    <div class="btns"><button class="btn primary" data-back>Back to ${esc(dayName(day))}</button><button class="btn ghost" data-progress>See my progress</button></div>`;
}

// ---------- hold timer ----------
let tm = null, timedSets = 0;
function killTimer() {
  if (!tm) return;
  clearInterval(tm.iv);
  if (tm.lock && tm.lock.release) tm.lock.release().catch(() => {});
  tm = null;
}
function timerIdle() {
  const box = document.getElementById("timer");
  if (box) box.innerHTML = `<button class="btn ghost" type="button" data-timer>Time ${timedSets ? "the next set" : "a set"}</button>`;
}
function startTimer() {
  const id = ctxId(), box = document.getElementById("timer");
  if (!id || !box) return;
  const tg = parseTarget(getEx(id).steps[lvl(id)][1]);
  const inputs = document.querySelectorAll("#logform input[type=number]");
  const setNo = Math.min(timedSets, inputs.length - 1);
  killTimer();
  tm = { goal: tg ? tg.goal : 0, t0: Date.now() + 3000, hit: false, setNo, running: false };
  if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then(l => { if (tm) tm.lock = l; else l.release(); }).catch(() => {});
  box.innerHTML = `<div class="t-panel"><div class="t-sub" id="t-sub">Set ${setNo + 1} · get ready</div><div class="t-num" id="t-num" aria-live="off">3</div>
    <div class="btns"><button class="btn primary" type="button" data-tstop disabled>Stop</button><button class="btn ghost" type="button" data-tcancel>Cancel</button></div></div>`;
  const tick = () => {
    const num = document.getElementById("t-num"), sub = document.getElementById("t-sub");
    if (!tm || !num) { killTimer(); return; }
    const now = Date.now();
    if (now < tm.t0) { num.textContent = Math.ceil((tm.t0 - now) / 1000); return; }
    if (!tm.running) {
      tm.running = true;
      if (navigator.vibrate) navigator.vibrate(80);
      box.querySelector("[data-tstop]").disabled = false;
      sub.textContent = `Set ${tm.setNo + 1}${tm.goal ? ` · target ${tm.goal}s` : ""}`;
    }
    const s = Math.floor((now - tm.t0) / 1000);
    num.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    if (tm.goal && s >= tm.goal && !tm.hit) {
      tm.hit = true;
      num.classList.add("hit");
      sub.textContent = `Set ${tm.setNo + 1} · target reached`;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  };
  tm.iv = setInterval(tick, 200);
  tick();
}
function stopTimer(keep) {
  if (!tm) return;
  const secs = Math.max(1, Math.floor((Date.now() - tm.t0) / 1000)), setNo = tm.setNo, ran = tm.running;
  killTimer();
  if (keep && ran) {
    const inputs = document.querySelectorAll("#logform input[type=number]");
    if (inputs[setNo]) inputs[setNo].value = secs;
    timedSets = setNo + 1;
    const hint = document.getElementById("log-hint");
    if (hint) hint.textContent = `Set ${setNo + 1}: ${secs} seconds. Tap Save when you've finished your sets.`;
  }
  timerIdle();
}

// ---------- progress ----------
// Which day was trained on each date, judged by the exercises logged that date.
function trainedDates() {
  const tally = new Map();
  for (const [id, logs] of Object.entries(state.logs)) {
    const ds = daysOf(id);
    for (const l of logs) {
      if (!tally.has(l.d)) tally.set(l.d, {});
      const o = tally.get(l.d);
      for (const d of ds.length ? ds : ["?"]) o[d] = (o[d] || 0) + 1;
    }
  }
  const out = new Map();
  for (const [d, o] of tally) out.set(d, Object.entries(o).sort((a, b) => b[1] - a[1])[0][0]);
  return out;
}
const weekStart = s => shiftDate(s, -((dateOf(s).getDay() + 6) % 7));
// The day to open on: the one after the day trained most recently (or the same one, if that was today).
function suggestDay() {
  const m = trainedDates(), keys = dayKeys();
  if (!m.size) return keys[0];
  const last = [...m.keys()].sort().pop(), k = m.get(last);
  if (!keys.includes(k)) return keys[0];
  return last === today() ? k : keys[(keys.indexOf(k) + 1) % keys.length];
}

function renderProgress() {
  setDay(currentDay);
  const m = trainedDates(), t = today(), ws = weekStart(t);
  const thisWeek = [...m.keys()].filter(d => d >= ws).length;
  let streak = 0;
  for (let w = ws; ; w = shiftDate(w, -7)) {
    const any = [...m.keys()].some(d => d >= w && d < shiftDate(w, 7));
    if (any) streak++; else if (w !== ws) break;
    if (streak > 520 || w < "2000-01-01") break;
  }
  const first = shiftDate(ws, -28);
  let cells = "";
  for (let i = 0; i < 35; i++) {
    const d = shiftDate(first, i), k = m.get(d), known = k && state.plan[k];
    cells += `<div class="cal-cell${d === t ? " now" : ""}${d > t ? " future" : ""}"${k ? ` style="--c:${known ? dayColor(k) : "var(--muted)"}"` : ""} title="${esc(fmtDate(d))}${k && known ? ": " + esc(dayName(k)) : ""}">
      ${k ? `<span class="cal-dot">${esc(known ? dayAbbr(k) : "·")}</span>` : `<span class="cal-num">${dateOf(d).getDate()}</span>`}</div>`;
  }
  const ready = planIds().filter(isReady);
  const ups = state.ups.filter(u => u.to > u.from && getEx(u.id)).slice(-8).reverse();
  const total = m.size;
  app.innerHTML = `
    <button class="back" data-back>← ${esc(dayName(currentDay))}</button>
    <div class="exhead"><h1>Progress</h1></div>
    <div class="stats">
      <div class="stat"><b>${thisWeek}</b><span>${thisWeek === 1 ? "day" : "days"} trained this week</span></div>
      <div class="stat"><b>${streak}</b><span>${streak === 1 ? "week" : "weeks"} in a row</span></div>
      <div class="stat"><b>${total}</b><span>training ${total === 1 ? "day" : "days"} logged</span></div>
    </div>
    <section class="sect"><h2>Last five weeks</h2>
      <p>${total ? "Each coloured square is a day you trained, marked with the day's short name." : "Days you train will show up here."}</p>
      <div class="cal" role="img" aria-label="Calendar of the last five weeks">
        ${["M", "T", "W", "T", "F", "S", "S"].map(x => `<div class="cal-head">${x}</div>`).join("")}${cells}
      </div>
      <div class="legend">${state.days.map(d => `<span><i style="background:${dayColor(d.key)}"></i><b>${esc(dayAbbr(d.key))}</b> ${esc(withDay(d.label))}</span>`).join("")}</div>
    </section>
    <section class="sect"><h2>Ready to move up</h2>
      ${ready.length ? `<div class="related">${ready.map(id => `<button class="rel" data-go="${esc(id)}">${esc(getEx(id).name)} <small>· ${esc(getEx(id).steps[lvl(id) + 1][0])} next</small></button>`).join("")}</div>`
        : `<p>Nothing yet. An exercise shows up here after you hit its target in two sessions in a row.</p>`}
    </section>
    <section class="sect"><h2>Recent level-ups</h2>
      ${ups.length ? `<ul class="loglist">${ups.map(u => { const e = getEx(u.id); return `<li class="up"><span class="dt">${esc(fmtDate(u.d))}</span><span class="what">${esc(e.name)}<small>${esc(e.steps[u.from] ? e.steps[u.from][0] : "")} → ${esc(e.steps[u.to] ? e.steps[u.to][0] : "")}</small></span></li>`; }).join("")}</ul>`
        : `<p>When you move up a step, it's recorded here.</p>`}
    </section>`;
}

// ---------- skills ----------
// A requirement [exercise, step, amount] is met by logging that amount in one set of the step
// (or a harder step on the same ladder), or by moving past a step whose target is at least that amount.
let skillPick = null, skillFocus = null, knownMet = null;
const skillById = id => SKILLS.find(k => k.id === id);
function reqUnit(ex, step) { return parseTarget(getEx(ex).steps[step][1]) || { unit: "reps", per: "" }; }
function reqText(ex, step, n) {
  const tg = reqUnit(ex, step), per = tg.per ? ` per ${tg.per}` : "";
  return tg.unit === "s" ? `${n}s hold${per}` : `${n}${per || (n === 1 ? " rep" : " reps")} in one set`;
}
// A step's name, with its exercise in front when the step name alone is unclear ("Sissy squats: Assisted, full range").
function stepLabel(ex, step) {
  const e = getEx(ex), nm = e.steps[step][0], head = norm(e.name.split(/\s+/)[0]);
  return norm(nm).includes(head) ? nm : `${e.name}: ${nm}`;
}
function reqShort(ex, step, n) { return reqUnit(ex, step).unit === "s" ? `${n}s` : `× ${n}`; }
function tracked(id) { return daysOf(id).length > 0 || Number.isInteger(state.levels[id]) || !!(state.logs[id] && state.logs[id].length); }
function reqStatus([ex, step, n]) {
  const e = getEx(ex);
  if (!e || !e.steps[step]) return { met: false, p: 0, note: "" };
  const unit = reqUnit(ex, step).unit, u = unit === "s" ? "s" : "";
  const same = i => { const t = e.steps[i] && parseTarget(e.steps[i][1]); return t && t.unit === unit ? t : null; };
  let best = 0;
  for (const l of state.logs[ex] || []) if (l.step >= step && same(l.step)) best = Math.max(best, ...l.sets);
  const c = lvl(ex);
  let passed = false;
  for (let i = step; i < c; i++) { const t = same(i); if (t && t.goal >= n) passed = true; }
  if (best >= n) return { met: true, p: 1, note: `Done. Your best is ${best}${u}.` };
  if (passed) return { met: true, p: 1, note: "Done. You've moved past this step." };
  if (best > 0) return { met: false, p: Math.min(0.95, best / n), best, note: `Best so far: ${best}${u} of ${n}${u}.` };
  if (!tracked(ex)) return { met: false, p: 0, note: `${e.name} isn't in your plan. Add it to a day to track this.` };
  if (c < step) return { met: false, p: 0.5 * (c + 1) / (step + 1), note: `You're on ${e.steps[c][0]}, ${plural(step - c, "step")} before this one.` };
  return { met: false, p: 0.5, note: c === step ? `Log a session of ${e.steps[step][0]} to check this.` : `Log a set of ${e.steps[step][0]} or harder to check this.` };
}
// open: every requirement met and not started yet · close: most of the way · training: already in the plan
function skillState(sk) {
  const rs = sk.req.map(reqStatus), met = rs.every(r => r.met);
  const inPlan = daysOf(sk.ex).length > 0;
  const training = inPlan && (!!CATALOG[sk.ex] || lvl(sk.ex) >= sk.at);
  const p = rs.reduce((a, r) => a + r.p, 0) / rs.length;
  return { rs, met, inPlan, training, p, kind: training ? "training" : met ? "open" : p >= 0.6 ? "close" : "locked" };
}
const openSkills = () => SKILLS.filter(sk => skillState(sk).kind === "open").map(sk => sk.id);
function updateSkillsBadge() {
  const b = document.getElementById("nav-skills");
  if (!b) return;
  const n = state.setup ? openSkills().filter(id => !state.skillsSeen.includes(id)).length : 0;
  b.innerHTML = `Skills${n ? `<span class="badge">${n}<span class="vh"> newly unlocked</span></span>` : ""}`;
}
// After a change: names any skill that just became unlocked, for the toast.
function unlockNote() {
  const now = SKILLS.filter(sk => skillState(sk).met).map(sk => sk.id);
  const fresh = knownMet ? now.filter(id => !knownMet.includes(id)) : [];
  knownMet = now;
  updateSkillsBadge();
  const names = fresh.map(skillById).filter(sk => !skillState(sk).training).map(sk => sk.name);
  return names.length ? `New skill unlocked: ${names.join(", ")}. Open Skills to start it.` : "";
}
const withNote = (msg, note) => [msg, note].filter(Boolean).join(". ").replace(/\.\. /g, ". ");

function unlocksHTML(id) {
  const list = SKILLS.filter(sk => sk.req.some(r => r[0] === id));
  if (!list.length) return "";
  return `<section class="sect"><h2>Unlocks</h2><p>Skills this exercise counts toward. Tap one to see everything it needs.</p>
    <div class="related">${list.map(sk => {
      const st = skillState(sk);
      const mine = sk.req.map((r, i) => [r, st.rs[i]]).filter(([r]) => r[0] === id)
        .map(([r, rs]) => `${rs.met ? "✓ " : ""}${esc(getEx(id).steps[r[1]][0])} ${esc(reqShort(...r))}`).join(", ");
      return `<button class="rel" data-skillgo="${sk.id}">${esc(sk.name)}${st.met ? " ✓" : ""} <small>· needs ${mine}</small></button>`;
    }).join("")}</div></section>`;
}

function skillCardHTML(sk, st) {
  const e = getEx(sk.ex), demo = demoHTML(sk.ex, sk.show, "skill-demo lazy");
  const inLadder = !CATALOG[sk.ex];
  const reqs = sk.req.map((r, i) => {
    const s = st.rs[i], re = getEx(r[0]);
    return `<li class="${s.met ? "met" : ""}"><span class="mk" aria-hidden="true">${s.met ? "✓" : ""}</span>
      <span class="rq"><span class="vh">${s.met ? "Done: " : "Not yet: "}</span><b>${esc(stepLabel(r[0], r[1]))}</b> · ${esc(reqText(...r))}
        <small>${esc(s.note)}</small>
        ${!s.met && s.best ? `<span class="rbar" aria-hidden="true"><i style="width:${Math.round(s.p * 100)}%"></i></span>` : ""}</span></li>`;
  }).join("");
  let act = "";
  if (st.training) {
    act = `<div class="btns"><button class="btn ghost small" data-go="${esc(sk.ex)}">Open ${esc(e.name)}</button>
      <span class="note">On ${esc(withDay(daysOf(sk.ex).map(dayLabel).join(" and ")))}, level ${lvl(sk.ex) + 1} of ${e.steps.length}</span></div>`;
  } else if (st.met && st.inPlan) {
    act = `<div class="btns"><button class="btn good" data-skillstart="${sk.id}">Start ${esc(e.steps[sk.at][0])}</button></div>`;
  } else if (st.met || skillPick === sk.id) {
    act = `<div class="sk-add"><span>${st.met ? "Start it on" : "Add it to"}</span>${state.days.map(d =>
      `<button class="btn small ghost" style="--day:${dayColor(d.key)}" data-skilladd="${sk.id}" data-d="${d.key}">${esc(d.label)}</button>`).join("")}</div>`;
  } else if (!inLadder) {
    act = `<button class="linkbtn tap" data-skillpick="${sk.id}">Add it anyway</button>`;
  }
  const where = inLadder ? `Step ${sk.at + 1} of your ${e.name} progression.` : `Starts with ${e.steps[sk.at][0]}.`;
  const tag = st.kind === "open" ? `<span class="tag good">Unlocked</span>` : st.kind === "training" ? `<span class="tag">Training</span>`
    : `<span class="tag">${st.rs.filter(r => r.met).length} of ${st.rs.length} done</span>`;
  return `<article class="skill ${st.kind}" id="sk-${sk.id}">
    <div class="sk-top${demo ? "" : " nodemo"}">${demo}
      <div class="sk-info"><p class="eyebrow">${esc(sk.group)} · ${esc(sk.kit)}</p><h3>${esc(sk.name)}</h3>${tag}
        <p>${esc(sk.about)} ${esc(where)}</p></div></div>
    <ul class="reqs" aria-label="What ${esc(sk.name)} needs">${reqs}</ul>
    ${act}</article>`;
}

function renderSkills() {
  setDay(currentDay);
  const all = SKILLS.map(sk => ({ sk, st: skillState(sk) }));
  const groups = [
    ["open", "Unlocked", "You've met every requirement. Pick a day to start training it."],
    ["close", "Getting close", "Most of the way there. Keep logging the exercises listed."],
    ["locked", "Still locked", "Build up the exercises listed first."],
    ["training", "You're training", "Already in your plan."]
  ];
  const count = k => all.filter(x => x.st.kind === k).length;
  app.innerHTML = `
    <button class="back" data-back>← ${esc(dayName(currentDay))}</button>
    <div class="exhead"><h1>Skills</h1></div>
    <p class="lead">Skills you can start once the basics are strong enough. A requirement counts when you log that amount in one set, on that step or a harder one.</p>
    <p class="note">${count("open")} unlocked · ${count("close")} getting close · ${count("locked")} locked · ${count("training")} in your plan. The amounts are guidelines, so trust how your joints feel too.</p>
    ${groups.map(([k, title, text]) => {
      const list = all.filter(x => x.st.kind === k).sort((a, b) => b.st.p - a.st.p);
      return list.length ? `<section class="sect"><h2>${title}</h2><p>${text}</p><div class="skills">${list.map(x => skillCardHTML(x.sk, x.st)).join("")}</div></section>` : "";
    }).join("")}`;
  mountDemos(app);
  const open = all.filter(x => x.st.kind === "open").map(x => x.sk.id);
  if (open.some(id => !state.skillsSeen.includes(id))) { state.skillsSeen = uniq(state.skillsSeen.concat(open)); persist(); }
  updateSkillsBadge();
}

// ---------- add exercise ----------
let add = null;

function renderAdd() {
  setDay(currentDay);
  add = { query: "", days: new Set([currentDay]), phase: "idle", match: null, result: null, resultId: null, resultStart: 0, active: -1, opts: [], manualText: "", msg: "" };
  app.innerHTML = `
    <button class="back" data-back>← ${esc(dayName(currentDay))}</button>
    <div class="exhead"><h1>Add an exercise</h1></div>
    <div class="field">
      <label for="q">Exercise name</label>
      <div class="combo">
        <input id="q" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Start typing, e.g. front lever"
          role="combobox" aria-expanded="false" aria-controls="sugg" aria-autocomplete="list" enterkeyhint="search">
        <ul class="sugg" id="sugg" role="listbox" hidden></ul>
      </div>
    </div>
    <fieldset>
      <legend>Add to</legend>
      <div class="daypick">${state.days.map(d => `<label style="--c:${dayColor(d.key)}"><input type="checkbox" id="day-${d.key}" value="${d.key}" ${d.key === currentDay ? "checked" : ""}><span>${esc(d.label)}</span></label>`).join("")}</div>
    </fieldset>
    <div id="addbody" style="display:grid;gap:14px"></div>`;
  const q = document.getElementById("q");
  q.addEventListener("input", () => {
    add.query = q.value; add.match = null; add.result = null; add.msg = "";
    if (add.phase !== "manual") add.phase = "idle";
    updateSuggestions(); renderAddBody();
  });
  q.addEventListener("focus", updateSuggestions);
  q.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
  q.addEventListener("keydown", onComboKey);
  document.querySelectorAll(".daypick input").forEach(cb => cb.addEventListener("change", () => {
    cb.checked ? add.days.add(cb.value) : add.days.delete(cb.value);
    renderAddBody();
  }));
  renderAddBody();
  q.focus();
}

function optLabel(o) {
  const e = getEx(o.id), inPlan = daysOf(o.id).length > 0;
  const isSelf = o.step < 0 || norm(e.steps[o.step][0]) === norm(e.name);
  if (inPlan) return isSelf && norm(o.name) === norm(e.name) ? "In your plan" : `Step ${o.step < 0 ? lvl(o.id) + 1 : o.step + 1} of ${e.name}`;
  return isSelf && norm(o.name) === norm(e.name) ? "Ladder" : `Step ${o.step < 0 ? e.start + 1 : o.step + 1} of ${e.name}`;
}

function suggestionsFor(query) {
  const n = norm(query);
  if (!n) return [];
  const words = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
  const scored = [];
  for (const o of buildIndex().values()) {
    const nn = norm(o.name), lw = o.name.toLowerCase();
    let score = -1;
    if (nn.startsWith(n)) score = 0;
    else if (words.every(w => lw.split(/[\s,()-]+/).some(t => t.startsWith(w)))) score = 1;
    else if (nn.includes(n)) score = 2;
    if (score < 0) continue;
    if (o.step < 0) score -= 0.5;
    scored.push({ ...o, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.name.length - b.name.length).slice(0, 7);
}

function highlight(name, query) {
  const i = name.toLowerCase().indexOf(query.toLowerCase().trim());
  if (!query.trim() || i < 0) return esc(name);
  const j = i + query.trim().length;
  return esc(name.slice(0, i)) + "<mark>" + esc(name.slice(i, j)) + "</mark>" + esc(name.slice(j));
}

function updateSuggestions() {
  const list = document.getElementById("sugg"), q = document.getElementById("q");
  if (!list || !add) return;
  add.opts = suggestionsFor(add.query);
  if (add.query.trim() && !add.opts.some(o => norm(o.name) === norm(add.query))) add.opts.push({ name: add.query.trim(), find: true });
  add.active = -1;
  if (!add.opts.length || add.match) { hideSuggestions(); return; }
  list.innerHTML = add.opts.map((o, i) => `<li class="opt" role="option" id="opt-${i}" data-opt="${i}" aria-selected="false">
    <span>${o.find ? `Write my own steps for “${esc(o.name)}”` : highlight(o.name, add.query)}</span><small>${o.find ? "New" : esc(optLabel(o))}</small></li>`).join("");
  list.hidden = false;
  q.setAttribute("aria-expanded", "true");
}
function hideSuggestions() {
  const list = document.getElementById("sugg"), q = document.getElementById("q");
  if (list) list.hidden = true;
  if (q) { q.setAttribute("aria-expanded", "false"); q.removeAttribute("aria-activedescendant"); }
}
function setActive(i) {
  add.active = i;
  document.querySelectorAll(".opt").forEach((el, k) => el.setAttribute("aria-selected", String(k === i)));
  const q = document.getElementById("q");
  if (i >= 0) q.setAttribute("aria-activedescendant", "opt-" + i); else q.removeAttribute("aria-activedescendant");
}

function chooseMatch(o) {
  const q = document.getElementById("q");
  if (q) q.value = add.query = o.name;
  hideSuggestions();
  add.match = o; add.msg = "";
  if (daysOf(o.id).length) { add.phase = "existing"; }
  else {
    const e = getEx(o.id);
    add.phase = "result"; add.result = e; add.resultId = o.id;
    add.resultStart = o.step >= 0 ? o.step : e.start;
  }
  renderAddBody();
}
function pickOption(i) {
  const o = add.opts[i]; if (!o) return;
  if (o.find) { hideSuggestions(); add.phase = "manual"; add.msg = ""; renderAddBody(); return; }
  chooseMatch(o);
}
function findLadder() {
  const name = add.query.trim();
  if (!name) return;
  const hit = buildIndex().get(norm(name));
  if (hit) { chooseMatch(hit); return; }
  hideSuggestions();
  add.phase = "manual";
  add.msg = `There's no ready-made progression for “${name}”. Write the steps below, easiest first.`;
  renderAddBody();
}
function onComboKey(ev) {
  const list = document.getElementById("sugg");
  const open = list && !list.hidden && add.opts.length;
  if (ev.key === "ArrowDown" && open) { ev.preventDefault(); setActive((add.active + 1) % add.opts.length); }
  else if (ev.key === "ArrowUp" && open) { ev.preventDefault(); setActive((add.active - 1 + add.opts.length) % add.opts.length); }
  else if (ev.key === "Escape") hideSuggestions();
  else if (ev.key === "Enter") {
    ev.preventDefault();
    if (open && add.active >= 0) pickOption(add.active); else findLadder();
  }
}

const joinDays = ds => ds.map(dayLabel).join(" and ");

function renderAddBody() {
  const box = document.getElementById("addbody"); if (!box) return;
  const name = add.query.trim();
  const noDays = !add.days.size;
  const chosen = esc(withDay(joinDays(dayKeys().filter(d => add.days.has(d)))));
  let html = "";
  if (add.phase === "existing" && add.match) {
    const m = add.match, e = getEx(m.id), inDays = daysOf(m.id);
    const newDays = dayKeys().filter(d => add.days.has(d) && !inDays.includes(d));
    const isStep = m.step >= 0 && norm(e.steps[m.step][0]) !== norm(e.name);
    const where = esc(withDay(joinDays(inDays)));
    html = `<p class="note">${isStep
        ? `<b>${esc(e.steps[m.step][0])}</b> is step ${m.step + 1} of your <b>${esc(e.name)}</b> ladder (${where}).`
        : `<b>${esc(e.name)}</b> is already in your plan on ${where}.`}</p>
      <div class="btns">
        ${isStep && m.step !== lvl(m.id) ? `<button class="btn primary" data-jumpto="${m.step}">Make it my ${esc(e.name)} level</button>` : ""}
        ${newDays.length ? `<button class="btn ${isStep && m.step !== lvl(m.id) ? "ghost" : "primary"}" data-addexisting>Also add to ${esc(withDay(joinDays(newDays)))}</button>` : ""}
        <button class="btn ghost" data-go="${esc(m.id)}">Open ${esc(e.name)}</button></div>`;
  } else if (add.phase === "result" && add.result) {
    const r = add.result;
    html = `<div class="card">
        <div>${r.focus ? `<p class="eyebrow">${esc(r.focus)}</p>` : ""}<h2>${esc(r.name)}</h2></div>
        ${demoHTML(add.resultId, add.resultStart, "card-demo")}
        ${ladderHTML(r, add.resultStart, false)}
        ${relatedHTML(r, null, false) ? `<div><p class="eyebrow" style="margin-bottom:8px">Related</p>${relatedHTML(r, null, false)}</div>` : ""}
        <div class="field"><label for="startlvl">Your level</label>
          <select id="startlvl">${r.steps.map((s, i) => `<option value="${i}" ${i === add.resultStart ? "selected" : ""}>${i + 1}. ${esc(s[0])}</option>`).join("")}</select></div>
      </div>
      <div class="btns"><button class="btn primary" data-save ${noDays ? "disabled" : ""}>${noDays ? "Choose a day" : `Add to ${chosen}`}</button></div>`;
  } else if (add.phase === "manual") {
    html = `${add.msg ? `<p class="note">${esc(add.msg)}</p>` : ""}
      <div class="field"><label for="manual">Steps, easiest first. One per line, with an optional target after a dash.</label>
        <textarea id="manual" rows="6" placeholder="Knee push-up - 3 × 12&#10;Push-up - 3 × 10&#10;Archer push-up - 3 × 6 per side">${esc(add.manualText)}</textarea></div>
      <div class="btns"><button class="btn primary" data-savemanual ${noDays || !name ? "disabled" : ""}>${!name ? "Type a name first" : noDays ? "Choose a day" : `Add to ${chosen}`}</button></div>
      <p class="note">Add a target to each step, like "3 × 10" or "3 × 30s", so Calgoal can tell you when to move up.</p>`;
  } else {
    html = `<div class="btns"><button class="btn primary" data-find ${!name ? "disabled" : ""}>Find progression</button>
      <button class="linkbtn tap" data-manual>Write the steps myself</button></div>
      <p class="note">Pick a suggestion as you type. Calgoal has ready-made progressions for ${Object.keys(CATALOG).length + Object.keys(EX).length} exercises, and you can search for any step inside them.</p>`;
  }
  box.innerHTML = html;
  mountDemos(box);
  const ta = document.getElementById("manual");
  if (ta) ta.addEventListener("input", () => { add.manualText = ta.value; });
}

function addToDays(id, start) {
  for (const d of add.days) if (state.plan[d] && !dayList(d).includes(id)) state.plan[d].push(id);
  state.levels[id] = start;
  persist();
  currentDay = dayKeys().find(d => add.days.has(d)) || currentDay;
  openStep = null;
  location.hash = "ex-" + id;
}
function newId(name) { return "c-" + (norm(name).slice(0, 30) || "exercise") + "-" + Math.random().toString(36).slice(2, 6); }
function parseManual(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 10).map(l => {
    const m = l.split(/\s+[-–—|]\s+/);
    return [str(m[0], 70), str(m.slice(1).join(" - "), 40), ""];
  }).filter(s => s[0]);
}

// ---------- backup and data ----------
let pendingRestore = null;
function backupText() { return JSON.stringify({ app: "rung-by-rung", version: 2, exported: today(), state }); }
function markBackedUp() { state.backupAt = today(); state.snooze = ""; persist(); }

function renderBackup() {
  setDay(currentDay);
  pendingRestore = null;
  app.innerHTML = `
    <button class="back" data-back>← ${state.setup ? esc(dayName(currentDay)) : "Back"}</button>
    <div class="exhead"><h1>Backup and data</h1></div>
    ${state.setup ? `<section class="sect">
      <h2>Save a backup</h2>
      <p>Your plan, levels and log are stored on this phone only. ${state.backupAt ? `Your last backup was ${fmtAgo(state.backupAt)}.` : "You haven't made a backup yet."} Save one now and then, and always before uninstalling the app or clearing its data.</p>
      <div class="btns">${CAN_DOWNLOAD ? `<button class="btn primary" data-dl>Save backup file</button>` : ""}<button class="btn ${CAN_DOWNLOAD ? "ghost" : "primary"}" data-copy>Copy backup text</button></div>
    </section>` : ""}
    <section class="sect">
      <h2>Restore</h2>
      <p>Paste backup text, or choose a backup file. This replaces what's on this phone now.</p>
      <div style="display:grid;gap:10px">
        <textarea id="bk-in" class="mono" rows="4" placeholder="Paste backup text here"></textarea>
        <div class="btns"><label class="btn ghost filebtn" for="bk-file">Choose file</label><input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden>
          <button class="btn primary" data-restore>Restore</button></div>
        <div id="bk-msg"></div>
      </div>
    </section>
    ${state.setup ? `<section class="sect">
      <h2>Reset levels</h2>
      <p>Puts every exercise back on its starting step. Your plan and log stay as they are.</p>
      <div id="reset-box"><button class="btn ghost" data-resetask>Reset all levels</button></div>
    </section>` : ""}`;
  document.getElementById("bk-file").addEventListener("change", ev => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { document.getElementById("bk-in").value = String(r.result || ""); checkRestore(); };
    r.readAsText(f);
  });
}

function checkRestore() {
  const msg = document.getElementById("bk-msg");
  const text = document.getElementById("bk-in").value.trim();
  pendingRestore = null;
  if (!text) { msg.innerHTML = `<p class="err">Paste your backup text or choose a backup file first.</p>`; return; }
  let raw;
  try { raw = JSON.parse(text); } catch (e) { msg.innerHTML = `<p class="err">That isn't a Calgoal backup. Copy the whole backup text and try again.</p>`; return; }
  const inner = raw && raw.app === "rung-by-rung" && raw.state ? raw.state : raw;
  if (!inner || typeof inner !== "object" || !["levels", "logs", "plan", "adds", "custom"].some(k => inner[k] && typeof inner[k] === "object")) {
    msg.innerHTML = `<p class="err">That isn't a Calgoal backup. Copy the whole backup text and try again.</p>`; return;
  }
  const s = normalizeState(raw);
  const nEx = uniq(s.days.flatMap(d => s.plan[d.key])).length;
  const nLogs = Object.values(s.logs).reduce((a, l) => a + l.length, 0);
  pendingRestore = s;
  msg.innerHTML = `<div class="confirm"><span>Found a plan with ${plural(s.days.length, "day")} and ${plural(nEx, "exercise")}, and ${plural(nLogs, "logged session")}. Replace what's on this phone?</span>
    <div class="btns"><button class="btn primary" data-confirmrestore>Replace</button><button class="btn ghost" data-cancelrestore>Cancel</button></div></div>`;
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
  ta.remove();
  return ok;
}

// ---------- first-time setup and "Change my plan" ----------
let wiz = null;

function startWizard(edit) {
  wiz = { edit, exp: null, days: state.days.map(d => ({ key: d.key, label: d.label })), plan: {}, levels: {}, returnDay: edit ? currentDay : dayKeys()[0] };
  for (const { key } of wiz.days) {
    const cur = dayList(key);
    // When editing, standard exercises that were removed are listed again (unticked) so they can come back.
    wiz.plan[key] = { order: [...cur, ...(DAYS[key] ? DAYS[key].list.filter(id => !cur.includes(id)) : [])], on: new Set(cur) };
    for (const id of wiz.plan[key].order) wiz.levels[id] = lvl(id);
  }
}
function wizSteps() { return (wiz.edit ? [] : ["setup", "setup-level"]).concat(["setup-days"], wiz.days.map((_, i) => "setup-d-" + i)); }
function applyExperience(exp) {
  wiz.exp = exp;
  for (const id of Object.keys(wiz.levels)) {
    const e = baseEx(id);
    wiz.levels[id] = exp === "new" ? 0 : exp === "some" ? e.start : Math.min(e.start + 1, e.steps.length - 1);
  }
}
function finishWizard() {
  const next = {};
  for (const { key } of wiz.days) next[key] = wiz.plan[key].order.filter(id => wiz.plan[key].on.has(id));
  if (!wiz.days.some(d => next[d.key].length)) { toast("Pick at least one exercise to train."); return; }
  const edit = wiz.edit;
  state.days = wiz.days.map((d, i) => ({ key: d.key, label: str(d.label, 16) || "Day " + (i + 1) }));
  state.plan = next;
  for (const id of uniq(Object.values(next).flat())) state.levels[id] = wiz.levels[id];
  for (const id of Object.keys(state.custom)) if (!daysOf(id).length) { delete state.custom[id]; delete state.levels[id]; delete state.logs[id]; delete state.names[id]; delete state.targets[id]; }
  state.setup = true;
  persist();
  currentDay = next[wiz.returnDay] && next[wiz.returnDay].length ? wiz.returnDay : state.days.find(d => next[d.key].length).key;
  wiz = null;
  unlockNote();
  renderTabs();
  location.hash = currentDay;
  toast(edit ? "Plan updated" : "You're set. Tap Start workout to begin.");
}

function renderSetup(h) {
  if (wiz && !wiz.edit && state.setup) wiz = null;   // setup was finished or a backup restored meanwhile
  if (!wiz) startWizard(state.setup);
  const steps = wizSteps();
  if (!steps.includes(h)) { location.replace("#" + steps[0]); return; }
  const stepNo = steps.indexOf(h) + (wiz.edit ? 1 : 0), stepCount = steps.length - (wiz.edit ? 0 : 1);
  const eyebrow = wiz.edit ? `Change my plan · ${stepNo} of ${stepCount}` : `Step ${stepNo} of ${stepCount}`;
  const nextStep = steps[steps.indexOf(h) + 1];

  if (h === "setup") {
    paint("pull");
    app.innerHTML = `<div class="setup">
      <div class="demo hero-demo" data-anim="pull-up" data-label="Pull-up"></div>
      <div class="exhead"><h1>Train one step at a time</h1></div>
      <p class="lead">Calgoal gives every bodyweight exercise a ladder of steps, from the easiest version to the hardest.</p>
      <ul class="points">
        <li>See how each step is done, with an animation and a video link.</li>
        <li>Log your sets and Calgoal tells you when to move up.</li>
        <li>It works offline, and everything stays on this phone.</li>
      </ul>
      <div class="btns"><button class="btn primary big" data-wiz="setup-level">Set up my plan</button></div>
      <button class="linkbtn tap" data-backup style="justify-self:start">I have a backup to restore</button>
    </div>`;
    mountDemos(app);
    return;
  }

  if (h === "setup-level") {
    paint("pull");
    const opt = (key, title, text) => `<button class="choice" data-exp="${key}" aria-pressed="${wiz.exp === key}"><b>${title}</b><span>${text}</span></button>`;
    app.innerHTML = `<div class="setup">
      <p class="eyebrow">${eyebrow}</p>
      <div class="exhead"><h1>How much have you trained?</h1></div>
      <p class="lead">This sets a starting level for every exercise. You can adjust each one on the next screens.</p>
      <div class="choices">
        ${opt("new", "I'm new to this", "I can't do a full pull-up or 10 push-ups in a row yet.")}
        ${opt("some", "I've trained a bit", "I can do around 5 pull-ups and 10 or more push-ups.")}
        ${opt("lots", "I'm experienced", "I can do 10 or more pull-ups and I'm working on harder variations.")}
      </div>
      <div class="wiz-nav"><button class="btn ghost" data-wizback>Back</button></div>
    </div>`;
    return;
  }

  if (h === "setup-days") {
    paint(wiz.days[0].key);
    app.innerHTML = `<div class="setup">
      <p class="eyebrow">${eyebrow}</p>
      <div class="exhead"><h1>Your training days</h1></div>
      <p class="lead">Calgoal starts with Push, Pull and Legs. Rename a day, change the order, add one or remove one.</p>
      <ul class="dayedit">${wiz.days.map((d, i) => `<li style="--c:${dayColor(d.key)}">
        <input type="text" id="dn-${d.key}" data-dayname="${i}" value="${esc(d.label)}" maxlength="16" autocomplete="off" aria-label="Name of day ${i + 1}">
        <button class="icon" data-dayup="${i}" aria-label="Move ${esc(d.label)} up" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon" data-daydown="${i}" aria-label="Move ${esc(d.label)} down" ${i === wiz.days.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon" data-daydel="${i}" aria-label="Remove ${esc(d.label)}" ${wiz.days.length === 1 ? "disabled" : ""}>×</button></li>`).join("")}</ul>
      <button class="btn ghost" data-dayadd style="justify-self:start" ${wiz.days.length >= MAX_DAYS ? "disabled" : ""}>+ Add a day</button>
      ${wiz.days.length >= MAX_DAYS ? `<p class="note">Six days is the most Calgoal handles.</p>` : ""}
      <div class="wiz-nav"><button class="btn ghost" data-wizback>${wiz.edit ? "Cancel" : "Back"}</button>
        <button class="btn primary" data-wiz="${nextStep}">Next: ${esc(withDay(wiz.days[0].label || "Day 1"))}</button></div>
    </div>`;
    return;
  }

  const di = Number(h.slice(8)), day = wiz.days[di], p = wiz.plan[day.key];
  paint(day.key);
  app.innerHTML = `<div class="setup">
    <p class="eyebrow">${eyebrow}</p>
    <div class="exhead"><h1>${dayHeading(day.label || "Day " + (di + 1))}</h1></div>
    ${p.order.length ? `<p class="lead">Untick anything you don't want to train. For the rest, choose the hardest step you can do for the sets and reps shown. The arrows change the order.</p>
    <ul class="pick">
      ${p.order.map((id, k) => {
        const e = getEx(id), on = p.on.has(id);
        const also = wiz.days.filter(x => x.key !== day.key && wiz.plan[x.key].on.has(id));
        return `<li class="${on ? "" : "off"}">
          <label class="pick-head" for="pk-${esc(id)}"><input type="checkbox" id="pk-${esc(id)}" data-pick="${esc(id)}" ${on ? "checked" : ""}>
            <span>${esc(e.name)}</span>${also.length ? `<small>also on ${also.map(x => esc(x.label)).join(", ")}</small>` : ""}</label>
          <div class="pick-row"><select id="lv-${esc(id)}" data-lv="${esc(id)}" aria-label="Your level for ${esc(e.name)}" ${on ? "" : "disabled"}>
            ${e.steps.map((s, i) => `<option value="${i}" ${i === wiz.levels[id] ? "selected" : ""}>${i + 1}. ${esc(s[0])}${s[1] ? " · " + esc(s[1]) : ""}</option>`).join("")}
          </select>
          <button class="icon" data-exup="${k}" aria-label="Move ${esc(e.name)} up" ${k === 0 ? "disabled" : ""}>↑</button>
          <button class="icon" data-exdown="${k}" aria-label="Move ${esc(e.name)} down" ${k === p.order.length - 1 ? "disabled" : ""}>↓</button></div></li>`;
      }).join("")}
    </ul>` : `<p class="lead">This day is empty for now. When you've finished here, open it and tap <b>Add an exercise</b> to fill it from the library or with your own.</p>`}
    <p class="note">You can add more exercises later, from a library of ${Object.keys(CATALOG).length} ready-made progressions or your own.</p>
    <div class="wiz-nav"><button class="btn ghost" data-wizback>Back</button>
      ${nextStep ? `<button class="btn primary" data-wiz="${nextStep}">Next: ${esc(withDay(wiz.days[di + 1].label || "Day " + (di + 2)))}</button>`
                 : `<button class="btn primary" data-wizdone>${wiz.edit ? "Save changes" : "Start training"}</button>`}</div>
  </div>`;
}

// ---------- routing & events ----------
function ctxId() {
  const h = location.hash.slice(1);
  if (h.startsWith("ex-")) return h.slice(3);
  const wk = h.match(/^workout-([a-z0-9]+)-(\d+)$/);
  return wk ? dayList(wk[1])[Number(wk[2])] || null : null;
}

function route(fromNav = true) {
  killTimer();
  if (lazyObs) lazyObs.disconnect();
  const h = location.hash.slice(1);
  const inSetup = h === "setup" || h.startsWith("setup-");
  // Until setup is finished, every address leads to it (except restoring a backup).
  if (!state.setup && !inSetup && h !== "backup") { location.replace("#setup"); return; }
  document.body.classList.toggle("in-setup", inSetup || !state.setup);
  if (fromNav) { editTarget = -1; renaming = false; timedSets = 0; }
  if (inSetup) { add = null; renderSetup(h); }
  else if (h === "add") { if (fromNav || !add) renderAdd(); }
  else {
    add = null;
    const wk = h.match(/^workout-([a-z0-9]+)-(\d+|done)$/);
    if (h === "backup") renderBackup();
    else if (h === "progress") renderProgress();
    else if (h === "skills") renderSkills();
    else if (wk && state.plan[wk[1]]) renderWorkout(wk[1], wk[2]);
    else if (h.startsWith("ex-") && getEx(h.slice(3)) && daysOf(h.slice(3)).length) renderEx(h.slice(3));
    else renderDay(state.plan[h] ? h : currentDay);
  }
  document.querySelectorAll(".navbtn").forEach(b => b.setAttribute("aria-current", b.id === "nav-" + h ? "page" : "false"));
  updateSkillsBadge();
  if (fromNav) window.scrollTo(0, 0);
  if (h === "skills" && skillFocus) {
    const card = document.getElementById("sk-" + skillFocus);
    skillFocus = null;
    if (card) { card.scrollIntoView({ block: "start" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 1600); }
  }
}
const rerender = () => route(false);

document.querySelector(".tabs").addEventListener("click", ev => {
  const t = ev.target.closest(".tab"); if (!t) return;
  currentDay = t.dataset.day;
  if (location.hash === "#" + t.dataset.day) route(); else location.hash = t.dataset.day;
});
document.getElementById("nav-progress").addEventListener("click", () => { location.hash = "progress"; });
document.getElementById("nav-skills").addEventListener("click", () => { location.hash = "skills"; });

app.addEventListener("mousedown", ev => { if (ev.target.closest("[data-opt]")) ev.preventDefault(); });
app.addEventListener("click", async ev => {
  const t = ev.target;
  const hit = sel => t.closest(sel);
  let el;

  if ((el = hit("[data-opt]"))) { pickOption(Number(el.dataset.opt)); return; }
  if ((el = hit(".demo"))) { if (REDUCE_MOTION && el._ctl) { if (el._ctl.playing) el._ctl.stop(); else el._ctl.play(); } return; }
  if ((el = hit("[data-tip]"))) {
    document.querySelectorAll(".c-group.sel").forEach(g => g.classList.remove("sel"));
    el.classList.add("sel");
    const tip = document.getElementById("chart-tip"); if (tip) tip.textContent = el.dataset.tip;
    return;
  }

  // timer
  if (hit("[data-timer]")) { startTimer(); return; }
  if (hit("[data-tstop]")) { stopTimer(true); return; }
  if (hit("[data-tcancel]")) { stopTimer(false); return; }

  // levels, log entries, steps
  if ((el = hit("[data-level]"))) {
    const id = ctxId(), n = Number(el.dataset.level), up = n > lvl(id);
    setLevel(id, n); openStep = -1; editTarget = -1; timedSets = 0;
    toast(withNote(`${up ? "Moved up to" : "Now on"} ${getEx(id).steps[n][0]}`, unlockNote()));
    rerender(); return;
  }
  if ((el = hit("[data-levelfor]"))) {
    const id = el.dataset.levelfor;
    setLevel(id, lvl(id) + 1);
    toast(withNote(`Moved up to ${getEx(id).steps[lvl(id)][0]}`, unlockNote()));
    rerender(); return;
  }
  if ((el = hit("[data-dellog]"))) {
    const id = ctxId();
    if (state.logs[id]) { state.logs[id].splice(Number(el.dataset.dellog), 1); if (!state.logs[id].length) delete state.logs[id]; persist(); }
    rerender(); return;
  }
  if ((el = hit("[data-set]"))) { setLevel(ctxId(), Number(el.dataset.set)); openStep = -1; editTarget = -1; const note = unlockNote(); if (note) toast(note); rerender(); return; }
  if ((el = hit("[data-edittarget]"))) { editTarget = Number(el.dataset.edittarget); rerender(); const i = document.getElementById("tg-in"); if (i) i.focus(); return; }
  if ((el = hit("[data-savetarget]"))) {
    const id = ctxId(), i = Number(el.dataset.savetarget);
    const val = str(document.getElementById("tg-in").value.replace(/\s*[xX*]\s*(?=\d)/g, " × "), 40);
    if (!parseTarget(val)) {
      const err = document.getElementById("tg-err");
      err.textContent = "Calgoal can't read that. Start with the sets and reps, like 3 × 10 or 3 × 30s."; err.hidden = false; return;
    }
    const o = Object.assign({}, state.targets[id]);
    if (val === baseEx(id).steps[i][1]) delete o[i]; else o[i] = val;
    if (Object.keys(o).length) state.targets[id] = o; else delete state.targets[id];
    persist(); editTarget = -1; rerender(); toast(withNote("Target saved", unlockNote())); return;
  }
  if ((el = hit("[data-resettarget]"))) {
    const id = ctxId(), o = Object.assign({}, state.targets[id]);
    delete o[Number(el.dataset.resettarget)];
    if (Object.keys(o).length) state.targets[id] = o; else delete state.targets[id];
    persist(); editTarget = -1; rerender(); return;
  }
  if (hit("[data-rename]")) { renaming = true; rerender(); const i = document.getElementById("nm-in"); if (i) { i.focus(); i.select(); } return; }
  if (hit("[data-savename]")) {
    const id = ctxId(), val = str(document.getElementById("nm-in").value, 60);
    if (!val || val === baseEx(id).name) delete state.names[id]; else state.names[id] = val;
    persist(); renaming = false; rerender(); return;
  }
  if (hit("[data-resetname]")) { delete state.names[ctxId()]; persist(); renaming = false; rerender(); return; }
  if ((el = hit("[data-step]"))) { const i = Number(el.dataset.step); openStep = openStep === i ? -1 : i; editTarget = -1; rerender(); return; }

  // navigation
  if ((el = hit("[data-go]"))) { openStep = null; location.hash = "ex-" + el.dataset.go; return; }
  if (hit("[data-back]")) { location.hash = currentDay; return; }
  if (hit("[data-add]")) { location.hash = "add"; return; }
  if (hit("[data-backup]")) { location.hash = "backup"; return; }
  if (hit("[data-progress]")) { location.hash = "progress"; return; }
  if (hit("[data-workout]")) { workoutStart(currentDay); return; }
  if ((el = hit("[data-wk]"))) { location.hash = `workout-${currentDay}-${el.dataset.wk}`; return; }
  if (hit("[data-snooze]")) { state.snooze = shiftDate(today(), 7); persist(); rerender(); return; }

  // skills
  if ((el = hit("[data-skillgo]"))) { skillFocus = el.dataset.skillgo; location.hash = "skills"; return; }
  if ((el = hit("[data-skillpick]"))) { skillPick = el.dataset.skillpick; rerender(); return; }
  if ((el = hit("[data-skillstart]"))) {
    const sk = skillById(el.dataset.skillstart);
    setLevel(sk.ex, sk.at); unlockNote();
    toast(`Now on ${getEx(sk.ex).steps[sk.at][0]}`);
    openStep = null; currentDay = daysOf(sk.ex).includes(currentDay) ? currentDay : daysOf(sk.ex)[0];
    location.hash = "ex-" + sk.ex; return;
  }
  if ((el = hit("[data-skilladd]"))) {
    const sk = skillById(el.dataset.skilladd), d = el.dataset.d;
    if (!state.plan[d]) return;
    if (!dayList(d).includes(sk.ex)) state.plan[d].push(sk.ex);
    if (CATALOG[sk.ex] || lvl(sk.ex) < sk.at) state.levels[sk.ex] = sk.at;
    persist(); unlockNote(); skillPick = null;
    toast(`${sk.name} added to ${dayName(d)}`);
    openStep = null; currentDay = d;
    location.hash = "ex-" + sk.ex; return;
  }

  // add exercise
  if (hit("[data-find]")) { findLadder(); return; }
  if (hit("[data-manual]")) { add.phase = "manual"; add.msg = ""; renderAddBody(); return; }
  if (hit("[data-save]") && add && add.result && add.days.size) { addToDays(add.resultId, Number(document.getElementById("startlvl").value) || 0); return; }
  if (hit("[data-savemanual]") && add && add.days.size) {
    const steps = parseManual(add.manualText), name = add.query.trim();
    if (!name || !steps.length) { const ta = document.getElementById("manual"); if (ta) ta.focus(); return; }
    const id = newId(name);
    state.custom[id] = { name, focus: "", start: 0, steps, related: [], alts: [] };
    addToDays(id, 0); return;
  }
  if ((el = hit("[data-jumpto]")) && add && add.match) {
    const id = add.match.id;
    setLevel(id, Number(el.dataset.jumpto));
    openStep = null; currentDay = daysOf(id).includes(currentDay) ? currentDay : daysOf(id)[0];
    location.hash = "ex-" + id; return;
  }
  if (hit("[data-addexisting]") && add && add.match) {
    const id = add.match.id;
    for (const d of add.days) if (state.plan[d] && !dayList(d).includes(id)) state.plan[d].push(id);
    persist(); openStep = null; currentDay = dayKeys().find(d => add.days.has(d)) || currentDay;
    location.hash = "ex-" + id; return;
  }
  if ((el = hit("[data-remove]"))) {
    const id = ctxId(), d = el.dataset.remove;
    state.plan[d] = state.plan[d].filter(x => x !== id);
    // A self-written exercise that is on no day any more is deleted for good; built-in ones keep their level and log.
    if (state.custom[id] && !daysOf(id).length) { delete state.custom[id]; delete state.levels[id]; delete state.logs[id]; delete state.names[id]; delete state.targets[id]; }
    persist();
    toast(`Removed from ${dayName(d)}`);
    if (daysOf(id).length) rerender(); else location.hash = d;
    return;
  }

  // setup and plan editing
  if ((el = hit("[data-wiz]"))) { location.hash = el.dataset.wiz; return; }
  if ((el = hit("[data-exp]")) && wiz) { applyExperience(el.dataset.exp); location.hash = "setup-days"; return; }
  if (hit("[data-wizback]") && wiz) {
    const steps = wizSteps(), i = steps.indexOf(location.hash.slice(1));
    if (wiz.edit && i <= 0) { currentDay = wiz.returnDay; wiz = null; location.hash = currentDay; } else location.hash = steps[Math.max(0, i - 1)];
    return;
  }
  if (hit("[data-wizdone]") && wiz) { finishWizard(); return; }
  if (hit("[data-editplan]")) { startWizard(true); location.hash = "setup-days"; return; }
  if (wiz && (el = hit("[data-dayup], [data-daydown]"))) {
    const i = Number(el.dataset.dayup ?? el.dataset.daydown), j = el.dataset.dayup != null ? i - 1 : i + 1;
    if (wiz.days[j]) { [wiz.days[i], wiz.days[j]] = [wiz.days[j], wiz.days[i]]; rerender(); }
    return;
  }
  if (wiz && (el = hit("[data-daydel]"))) {
    if (wiz.days.length > 1) { const [gone] = wiz.days.splice(Number(el.dataset.daydel), 1); delete wiz.plan[gone.key]; rerender(); }
    return;
  }
  if (wiz && hit("[data-dayadd]")) {
    if (wiz.days.length >= MAX_DAYS) return;
    const used = new Set([...wiz.days.map(d => d.key), ...dayKeys()]);
    let n = 4; while (used.has("d" + n)) n++;
    wiz.days.push({ key: "d" + n, label: "Day " + (wiz.days.length + 1) });
    wiz.plan["d" + n] = { order: [], on: new Set() };
    rerender();
    const i = document.getElementById("dn-d" + n); if (i) { i.focus(); i.select(); }
    return;
  }
  if (wiz && (el = hit("[data-exup], [data-exdown]"))) {
    const day = wiz.days[Number(location.hash.slice(9))], o = day && wiz.plan[day.key].order;
    const i = Number(el.dataset.exup ?? el.dataset.exdown), j = el.dataset.exup != null ? i - 1 : i + 1;
    if (o && o[j] != null) { [o[i], o[j]] = [o[j], o[i]]; rerender(); }
    return;
  }

  // backup and data
  if (hit("[data-resetask]")) {
    document.getElementById("reset-box").innerHTML = `<div class="confirm"><span>Reset every level to its starting step?</span>
      <div class="btns"><button class="btn primary" data-resetdo>Reset levels</button><button class="btn ghost" data-resetno>Cancel</button></div></div>`;
    return;
  }
  if (hit("[data-resetno]")) { rerender(); return; }
  if (hit("[data-resetdo]")) { state.levels = {}; persist(); rerender(); toast("Levels reset to their starting steps"); return; }
  if (hit("[data-dl]")) {
    markBackedUp();
    if (NATIVE) {
      // In the Android app: write the file, then let the person pick where to keep it (Drive, Files, email...).
      try {
        const r = await Capacitor.nativePromise("Filesystem", "writeFile", { path: `calgoal-backup-${today()}.json`, data: backupText(), directory: "CACHE", encoding: "utf8" });
        await Capacitor.nativePromise("Share", "share", { title: "Calgoal backup", dialogTitle: "Save your Calgoal backup", files: [r.uri] });
        toast("Backup ready. Keep it somewhere safe.");
      } catch (e) {
        if (!/cancel/i.test(String((e && e.message) || e))) toast("Couldn't save the file. Use Copy backup text instead.");
      }
      return;
    }
    const blob = new Blob([backupText()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `calgoal-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Backup file saved to Downloads"); return;
  }
  if (hit("[data-copy]")) {
    const before = state.backupAt;
    markBackedUp();
    if (await copyText(backupText())) toast("Backup copied. Paste it somewhere safe.");
    else { state.backupAt = before; persist(); toast("Couldn't copy. Use Save backup file instead."); }
    return;
  }
  if (hit("[data-restore]")) { checkRestore(); return; }
  if (hit("[data-cancelrestore]")) { pendingRestore = null; document.getElementById("bk-msg").innerHTML = ""; return; }
  if (hit("[data-confirmrestore]") && pendingRestore) {
    state = pendingRestore; pendingRestore = null; wiz = null;
    state.backupAt = today();
    persist();
    currentDay = suggestDay();
    renderTabs();
    unlockNote();
    toast("Backup restored"); location.hash = currentDay; return;
  }
});

app.addEventListener("submit", ev => {
  if (ev.target.id !== "logform") return;
  ev.preventDefault();
  const id = ctxId();
  if (!id || !getEx(id)) return;
  const vals = [...ev.target.querySelectorAll("input[type=number]")]
    .filter(i => i.value.trim() !== "")
    .map(i => Math.max(0, Math.min(9999, Math.round(Number(i.value) || 0))));
  if (!vals.length) { ev.target.querySelector("input").focus(); return; }
  killTimer(); timedSets = 0;
  saveLog(id, vals);
  if (document.activeElement) document.activeElement.blur();
  rerender();
  const note = unlockNote();
  if (note) toast(note);
});

// Setup screens: ticking an exercise, choosing its level, naming a day.
app.addEventListener("change", ev => {
  if (!wiz) return;
  const t = ev.target;
  if (t.matches("[data-pick]")) {
    const day = wiz.days[Number(location.hash.slice(9))];
    if (!day) return;
    const on = wiz.plan[day.key].on;
    if (t.checked) on.add(t.dataset.pick); else on.delete(t.dataset.pick);
    const li = t.closest("li");
    li.classList.toggle("off", !t.checked);
    li.querySelector("select").disabled = !t.checked;
  } else if (t.matches("[data-lv]")) {
    wiz.levels[t.dataset.lv] = Number(t.value) || 0;
  }
});
app.addEventListener("input", ev => {
  if (wiz && ev.target.matches("[data-dayname]")) wiz.days[Number(ev.target.dataset.dayname)].label = ev.target.value;
});
app.addEventListener("keydown", ev => {
  if (ev.key !== "Enter") return;
  if (ev.target.id === "tg-in") { ev.preventDefault(); const b = app.querySelector("[data-savetarget]"); if (b) b.click(); }
  if (ev.target.id === "nm-in") { ev.preventDefault(); const b = app.querySelector("[data-savename]"); if (b) b.click(); }
  if (ev.target.matches(".c-group")) ev.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});

// ---------- start ----------
try { const saved = localStorage.getItem(LS_KEY); if (saved) state = normalizeState(JSON.parse(saved)); } catch (e) {}
window.addEventListener("hashchange", () => route(true));
const startHash = location.hash.slice(1);
currentDay = state.plan[startHash] ? startHash : suggestDay();
renderTabs();
unlockNote();
route(true);

// The Android app already has every file built in, so it skips the offline cache.
if (!NATIVE && "serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
