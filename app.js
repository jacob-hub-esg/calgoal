"use strict";
// Calgoal — app logic. (Backups and saved data keep the old internal name "rung-by-rung" so nothing is lost.) Data lives in data.js; everything is saved on this phone.

const DAY_KEYS = ["push", "pull", "legs"];
const LS_KEY = "rung-state-v2";
const app = document.getElementById("app");
const CAN_DOWNLOAD = typeof Blob !== "undefined" && "download" in document.createElement("a");

// ---------- helpers ----------
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(es|s)$/, "");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function toast(msg) {
  let el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}

// ---------- state ----------
function blankState() { return { levels: {}, custom: {}, adds: { push: [], pull: [], legs: [] }, logs: {} }; }
let state = blankState();

function normalizeState(raw) {
  if (raw && raw.app === "rung-by-rung" && raw.state) raw = raw.state;
  const s = blankState();
  if (!raw || typeof raw !== "object") return s;
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
  if (raw.adds && typeof raw.adds === "object") {
    for (const d of DAY_KEYS) if (Array.isArray(raw.adds[d])) s.adds[d] = [...new Set(raw.adds[d].map(String))].filter(known);
  }
  if (raw.levels && typeof raw.levels === "object") {
    for (const [id, v] of Object.entries(raw.levels)) if (known(id) && Number.isInteger(v)) s.levels[id] = v;
  }
  if (raw.logs && typeof raw.logs === "object") {
    for (const [id, arr] of Object.entries(raw.logs)) {
      if (!known(id) || !Array.isArray(arr)) continue;
      const list = arr.filter(l => l && Array.isArray(l.sets) && l.sets.length).slice(-20).map(l => ({
        d: str(l.d, 10), step: Math.max(0, Number(l.step) | 0),
        sets: l.sets.slice(0, 6).map(n => Math.max(0, Math.min(9999, Math.round(Number(n) || 0))))
      }));
      if (list.length) s.logs[id] = list;
    }
  }
  return s;
}

try { const saved = localStorage.getItem(LS_KEY); if (saved) state = normalizeState(JSON.parse(saved)); } catch (e) {}
function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch (e) { toast("Couldn't save. Your phone may be low on storage."); }
}

// ---------- lookups ----------
function getEx(id) { return EX[id] || CATALOG[id] || state.custom[id] || null; }
function dayList(d) { const base = DAYS[d].list; return [...base, ...state.adds[d].filter(id => getEx(id) && !base.includes(id))]; }
function daysOf(id) { return DAY_KEYS.filter(d => dayList(d).includes(id)); }
function planIds() { return [...new Set(DAY_KEYS.flatMap(dayList))]; }
function isAdded(id) { return !DAY_KEYS.some(d => DAYS[d].list.includes(id)); }
function lvl(id) { const e = getEx(id), v = state.levels[id]; return Number.isInteger(v) && v >= 0 && v < e.steps.length ? v : e.start; }

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

// ---------- session log & recommendations ----------
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
function bestSets(tg, vals) { const top = [...vals].sort((a, b) => b - a).slice(0, tg.sets); while (top.length < tg.sets) top.push(0); return top; }
function evaluate(tg, vals) {
  const top = bestSets(tg, vals);
  if (top.every(v => v >= tg.goal)) return "ready";
  if (top[0] < tg.lo * 0.5) return "hard";
  return "keep";
}
function latestLog(id) { const l = state.logs[id]; return l && l.length ? l[l.length - 1] : null; }
function isReady(id) {
  const e = getEx(id), c = lvl(id), l = latestLog(id);
  if (!l || l.step !== c || !e.steps[c + 1]) return false;
  const tg = parseTarget(e.steps[c][1]);
  return !!tg && evaluate(tg, l.sets) === "ready";
}
function today() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function fmtDate(s) { const d = new Date(s + "T12:00:00"); return isNaN(d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

function verdictHTML(id, c, log) {
  const e = getEx(id), tg = parseTarget(e.steps[c][1]);
  if (!tg) return `<div class="verdict"><b>Saved</b><span>This step has no target, so the app can't judge it. Targets look like "3 × 10" or "3 × 30s".</span></div>`;
  const v = evaluate(tg, log.sets), next = e.steps[c + 1], prev = e.steps[c - 1];
  const setsWord = tg.sets === 1 ? "your set" : `all ${tg.sets} sets`;
  if (v === "ready") return `<div class="verdict ready"><b>Ready to move up</b>
    <span>You reached ${fmtGoal(tg)} on ${setsWord}.${next ? ` Next step: ${esc(next[0])}${next[1] ? ` (${esc(next[1])})` : ""}.` : " That's the top of this ladder. Keep progressing with more reps, a slower tempo or added weight."}</span>
    ${next ? `<button class="btn" data-level="${c + 1}">Move up to ${esc(next[0])}</button>` : ""}</div>`;
  if (v === "hard") return `<div class="verdict hard"><b>This step looks too hard for now</b>
    <span>${prev ? `Consider dropping back to ${esc(prev[0])}${prev[1] ? ` (${esc(prev[1])})` : ""} and coming back once that feels solid.` : `Stay here and build up slowly. Shorter sets with clean form are fine.`}</span>
    ${prev ? `<button class="btn ghost" data-level="${c - 1}">Drop back to ${esc(prev[0])}</button>` : ""}</div>`;
  const top = bestSets(tg, log.sets);
  const hits = top.filter(x => x >= tg.goal).length;
  const inRange = tg.goal > tg.lo && top.every(x => x >= tg.lo);
  return `<div class="verdict"><b>Stay on this step</b><span>${inRange ? "You're in the working range. " : ""}${hits} of ${tg.sets} ${tg.sets === 1 ? "set" : "sets"} reached ${fmtGoal(tg)}. Move up once every set does.</span></div>`;
}

function logFormHTML(id, c) {
  const tg = parseTarget(getEx(id).steps[c][1]);
  const n = tg ? tg.sets : 3;
  const l = latestLog(id);
  return `<form class="log" id="logform" novalidate>
      <div class="k">Log a session · ${tg ? unitLabel(tg) : "reps or seconds in each set"}</div>
      <div class="sets">${Array.from({ length: n }, (_, i) => `<label for="set-${i + 1}">Set ${i + 1}<input id="set-${i + 1}" type="number" inputmode="numeric" min="0" max="9999"></label>`).join("")}
        <button class="btn primary" type="submit">Save</button></div>
    </form>
    ${l && l.step === c ? verdictHTML(id, c, l) : ""}`;
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

// ---------- rendering ----------
let currentDay = "pull";
let openStep = null;

function setDay(d) {
  currentDay = d;
  document.body.dataset.day = d;
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-current", String(t.dataset.day === d)));
}

function meter(id) {
  const n = getEx(id).steps.length, c = lvl(id);
  let s = "";
  for (let i = 0; i < n; i++) s += `<i class="${i <= c ? "on" : ""}"></i>`;
  return `<span class="meter" aria-hidden="true">${s}</span>`;
}

function renderDay(d) {
  setDay(d);
  const list = dayList(d);
  app.innerHTML = `
    <div class="dayhead">
      <h1><em>${DAYS[d].label}</em> day</h1>
      <p>${list.length} exercises in your order. Tap one to see its progression or log a session.</p>
    </div>
    <div>
      <ol class="list">
        ${list.map((id, i) => {
          const e = getEx(id), c = lvl(id);
          return `<li><button class="row" data-go="${esc(id)}">
            <span class="n">${i + 1}</span>
            <span class="txt"><span class="name">${esc(e.name)}${isAdded(id) ? "<small>Added</small>" : ""}</span>
            <span class="lvl">Level ${c + 1}/${e.steps.length} · <strong>${esc(e.steps[c][0])}</strong>${isReady(id) ? `<span class="ready-pill">Ready to move up</span>` : ""}</span></span>
            ${meter(id)}
          </button></li>`;
        }).join("")}
      </ol>
      <button class="addrow" data-add><span>+</span> Add an exercise to ${DAYS[d].label} day</button>
    </div>
    <p class="note">Starting levels are a best guess. Open an exercise and tap the step you can do now to set your level. Everything is saved on this phone.</p>
    <div class="footlinks note"><button class="linkbtn" data-backup>Backup and restore</button><button class="linkbtn" id="reset">Reset all levels</button></div>`;
}

function ladderHTML(e, c, interactive) {
  return `<ol class="ladder">${e.steps.map((s, i) => {
    const cls = i < c ? "done" : i === c ? "cur" : "";
    if (!interactive) return `<li class="${cls}"><div class="rung"><span class="i">${i + 1}</span><span class="nm">${esc(s[0])}</span><span class="tg">${esc(s[1])}</span>${s[2] ? `<span class="cue">${esc(s[2])}</span>` : ""}</div></li>`;
    const open = i === openStep;
    return `<li class="${cls}"><button class="rung" data-step="${i}" aria-expanded="${open}">
        <span class="i">${i + 1}</span><span class="nm">${esc(s[0])}</span><span class="tg">${esc(s[1])}</span>
      </button>
      ${open ? `<div class="open-body">${s[2] ? `<p>${esc(s[2])}</p>` : ""}${i === c
        ? `<span class="yours">Your level</span>`
        : `<button class="setbtn" data-set="${i}">Set as my level</button>`}</div>` : ""}
    </li>`;
  }).join("")}</ol>`;
}

function relatedHTML(e, selfId, clickable) {
  const rel = (e.related || []).filter(r => r !== selfId && getEx(r) && daysOf(r).length);
  const alts = e.alts || [];
  if (!rel.length && !alts.length) return "";
  return `${rel.length ? `<div class="related">${rel.map(r => {
      const inner = `${esc(getEx(r).name)} <small>· ${daysOf(r).map(d => DAYS[d].label).join(", ")}</small>`;
      return clickable ? `<button class="rel" data-go="${esc(r)}">${inner}</button>` : `<span class="rel">${inner}</span>`;
    }).join("")}</div>` : ""}
    ${alts.length ? `<ul class="alts" aria-label="Other options">${alts.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}`;
}

function renderEx(id) {
  const e = getEx(id);
  const ds = daysOf(id);
  setDay(ds.includes(currentDay) ? currentDay : ds[0]);
  const c = lvl(id), n = e.steps.length;
  if (openStep === null) openStep = c;
  const cur = e.steps[c], nxt = e.steps[c + 1];
  const tg = parseTarget(cur[1]);
  const removable = DAY_KEYS.filter(d => state.adds[d].includes(id) && !DAYS[d].list.includes(id));
  const rel = relatedHTML(e, id, true);
  app.innerHTML = `
    <button class="back" data-back>← ${DAYS[currentDay].label} day</button>
    <div class="exhead">
      ${e.focus ? `<p class="eyebrow">${esc(e.focus)}</p>` : ""}
      <h1>${esc(e.name)}</h1>
      <div class="days">${ds.map(d => `<span class="chip ${d}">${DAYS[d].label} day</span>`).join("")}${isAdded(id) ? `<span class="chip">Added by you</span>` : ""}</div>
    </div>
    <section class="now" aria-label="Your current level">
      <div><div class="k">You're on · level ${c + 1} of ${n}</div>
      <div class="big">${esc(cur[0])}</div>
      <div class="tgt">${esc(cur[1])}</div></div>
      <div class="next">${nxt
        ? `Next: <b>${esc(nxt[0])}</b>${nxt[1] ? ` (${esc(nxt[1])})` : ""}. ${tg ? `Move up once every set reaches ${fmtGoal(tg)} with clean form.` : `Move up once you can do every set with clean form.`}`
        : `Top of this ladder. Keep progressing with more reps, a slower tempo or added weight.`}</div>
      ${logFormHTML(id, c)}
    </section>
    ${logListHTML(id)}
    <section class="sect">
      <h2>Progression</h2>
      <p>Easiest first. Tap a step for form cues or to set it as your level.</p>
      ${ladderHTML(e, c, true)}
    </section>
    ${rel ? `<section class="sect"><h2>Related</h2><p>Exercises in your plan that train the same pattern or support this one.</p>${rel}</section>` : ""}
    ${removable.length ? `<section class="manage"><p class="note">You added this exercise.</p><div class="btns">${removable.map(d => `<button class="btn ghost" data-remove="${d}">Remove from ${DAYS[d].label} day</button>`).join("")}</div></section>` : ""}`;
}

// ---------- add exercise ----------
let add = null;

function renderAdd() {
  setDay(currentDay);
  add = { query: "", days: new Set([currentDay]), phase: "idle", match: null, result: null, resultId: null, resultStart: 0, active: -1, opts: [], manualText: "", msg: "" };
  app.innerHTML = `
    <button class="back" data-back>← ${DAYS[currentDay].label} day</button>
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
      <div class="daypick">${DAY_KEYS.map(d => `<label class="${d}"><input type="checkbox" id="day-${d}" value="${d}" ${d === currentDay ? "checked" : ""}><span>${DAYS[d].label}</span></label>`).join("")}</div>
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
  add.msg = `There's no ready-made ladder for “${name}”. Write the steps below, easiest first.`;
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

function chosenDaysLabel() {
  const ds = DAY_KEYS.filter(d => add.days.has(d));
  return ds.map(d => DAYS[d].label).join(" and ") + (ds.length ? " day" : "");
}

function renderAddBody() {
  const box = document.getElementById("addbody"); if (!box) return;
  const name = add.query.trim();
  const noDays = !add.days.size;
  let html = "";
  if (add.phase === "existing" && add.match) {
    const m = add.match, e = getEx(m.id), inDays = daysOf(m.id);
    const newDays = DAY_KEYS.filter(d => add.days.has(d) && !inDays.includes(d));
    const isStep = m.step >= 0 && norm(e.steps[m.step][0]) !== norm(e.name);
    const where = inDays.map(d => DAYS[d].label).join(" and ") + " day";
    html = `<p class="note">${isStep
        ? `<b>${esc(e.steps[m.step][0])}</b> is step ${m.step + 1} of your <b>${esc(e.name)}</b> ladder (${where}).`
        : `<b>${esc(e.name)}</b> is already in your plan on ${where}.`}</p>
      <div class="btns">
        ${isStep && m.step !== lvl(m.id) ? `<button class="btn primary" data-jumpto="${m.step}">Make it my ${esc(e.name)} level</button>` : ""}
        ${newDays.length ? `<button class="btn ${isStep && m.step !== lvl(m.id) ? "ghost" : "primary"}" data-addexisting>Also add to ${newDays.map(d => DAYS[d].label).join(" and ")} day</button>` : ""}
        <button class="btn ghost" data-go="${esc(m.id)}">Open ${esc(e.name)}</button></div>`;
  } else if (add.phase === "result" && add.result) {
    const r = add.result;
    html = `<div class="card">
        <div>${r.focus ? `<p class="eyebrow">${esc(r.focus)}</p>` : ""}<h2>${esc(r.name)}</h2></div>
        ${ladderHTML(r, add.resultStart, false)}
        ${relatedHTML(r, null, false) ? `<div><p class="eyebrow" style="margin-bottom:8px">Related</p>${relatedHTML(r, null, false)}</div>` : ""}
        <div class="field"><label for="startlvl">Your level</label>
          <select id="startlvl">${r.steps.map((s, i) => `<option value="${i}" ${i === add.resultStart ? "selected" : ""}>${i + 1}. ${esc(s[0])}</option>`).join("")}</select></div>
      </div>
      <div class="btns"><button class="btn primary" data-save ${noDays ? "disabled" : ""}>${noDays ? "Choose a day" : `Add to ${chosenDaysLabel()}`}</button></div>`;
  } else if (add.phase === "manual") {
    html = `${add.msg ? `<p class="note">${esc(add.msg)}</p>` : ""}
      <div class="field"><label for="manual">Steps, easiest first. One per line, with an optional target after a dash.</label>
        <textarea id="manual" rows="6" placeholder="Knee push-up - 3 × 12&#10;Push-up - 3 × 10&#10;Archer push-up - 3 × 6 per side">${esc(add.manualText)}</textarea></div>
      <div class="btns"><button class="btn primary" data-savemanual ${noDays || !name ? "disabled" : ""}>${!name ? "Type a name first" : noDays ? "Choose a day" : `Add to ${chosenDaysLabel()}`}</button></div>
      <p class="note">Add a target to each step, like "3 × 10" or "3 × 30s", so the app can tell you when to move up.</p>`;
  } else {
    html = `<div class="btns"><button class="btn primary" data-find ${!name ? "disabled" : ""}>Find ladder</button>
      <button class="linkbtn" data-manual>Write the steps myself</button></div>
      <p class="note">Pick a suggestion as you type. The app has ready-made ladders for ${Object.keys(CATALOG).length + Object.keys(EX).length} exercises, and you can search for any step inside them.</p>`;
  }
  box.innerHTML = html;
  const ta = document.getElementById("manual");
  if (ta) ta.addEventListener("input", () => { add.manualText = ta.value; });
}

function addToDays(id, start) {
  for (const d of add.days) if (!dayList(d).includes(id)) state.adds[d].push(id);
  state.levels[id] = start;
  persist();
  currentDay = DAY_KEYS.find(d => add.days.has(d)) || currentDay;
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

// ---------- backup ----------
let pendingRestore = null;
function backupText() { return JSON.stringify({ app: "rung-by-rung", version: 1, exported: today(), state }); }

function renderBackup() {
  setDay(currentDay);
  pendingRestore = null;
  app.innerHTML = `
    <button class="back" data-back>← ${DAYS[currentDay].label} day</button>
    <div class="exhead"><h1>Backup and restore</h1></div>
    <section class="sect">
      <h2>Save a backup</h2>
      <p>Your levels, added exercises and log are stored on this phone only. Save a backup now and then, and always before uninstalling the app or clearing Chrome's data.</p>
      <div class="btns">${CAN_DOWNLOAD ? `<button class="btn primary" data-dl>Save backup file</button>` : ""}<button class="btn ${CAN_DOWNLOAD ? "ghost" : "primary"}" data-copy>Copy backup text</button></div>
    </section>
    <section class="sect">
      <h2>Restore</h2>
      <p>Paste backup text, or choose a backup file. This replaces what's on this phone now.</p>
      <div style="display:grid;gap:10px">
        <textarea id="bk-in" class="mono" rows="4" placeholder="Paste backup text here"></textarea>
        <div class="btns"><label class="btn ghost filebtn" for="bk-file">Choose file</label><input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden>
          <button class="btn primary" data-restore>Restore</button></div>
        <div id="bk-msg"></div>
      </div>
    </section>`;
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
  const s = normalizeState(raw);
  const nLevels = Object.keys(s.levels).length, nAdded = new Set(DAY_KEYS.flatMap(d => s.adds[d])).size;
  const nLogs = Object.values(s.logs).reduce((a, l) => a + l.length, 0);
  if (!nLevels && !nAdded && !nLogs) { msg.innerHTML = `<p class="err">This backup is empty, so there's nothing to restore.</p>`; return; }
  pendingRestore = s;
  msg.innerHTML = `<div class="confirm"><span>Found levels for ${nLevels} exercises, ${nAdded} added exercises and ${nLogs} logged sessions. Replace what's on this phone?</span>
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

// ---------- routing & events ----------
function route(fromNav = true) {
  const h = location.hash.slice(1);
  if (h === "add") { if (fromNav || !add) renderAdd(); }
  else {
    add = null;
    if (h === "backup") renderBackup();
    else if (h.startsWith("ex-") && getEx(h.slice(3)) && daysOf(h.slice(3)).length) renderEx(h.slice(3));
    else renderDay(DAYS[h] ? h : currentDay);
  }
  if (fromNav) window.scrollTo(0, 0);
}

document.querySelector(".tabs").addEventListener("click", ev => {
  const t = ev.target.closest(".tab"); if (!t) return;
  currentDay = t.dataset.day;
  if (location.hash === "#" + t.dataset.day) route(); else location.hash = t.dataset.day;
});

app.addEventListener("mousedown", ev => { if (ev.target.closest("[data-opt]")) ev.preventDefault(); });
app.addEventListener("click", async ev => {
  const t = ev.target;
  const exId = () => location.hash.slice(4);
  const opt = t.closest("[data-opt]");
  if (opt) { pickOption(Number(opt.dataset.opt)); return; }
  const lv = t.closest("[data-level]");
  if (lv) { const id = exId(); state.levels[id] = Number(lv.dataset.level); persist(); openStep = state.levels[id]; renderEx(id); return; }
  const dl = t.closest("[data-dellog]");
  if (dl) {
    const id = exId();
    if (state.logs[id]) { state.logs[id].splice(Number(dl.dataset.dellog), 1); if (!state.logs[id].length) delete state.logs[id]; persist(); }
    renderEx(id); return;
  }
  const set = t.closest("[data-set]");
  if (set) { const id = exId(); state.levels[id] = Number(set.dataset.set); persist(); openStep = state.levels[id]; renderEx(id); return; }
  const go = t.closest("[data-go]");
  if (go) { openStep = null; location.hash = "ex-" + go.dataset.go; return; }
  const step = t.closest("[data-step]");
  if (step) { const i = Number(step.dataset.step); openStep = openStep === i ? -1 : i; renderEx(exId()); return; }
  if (t.closest("[data-back]")) { location.hash = currentDay; return; }
  if (t.closest("[data-add]")) { location.hash = "add"; return; }
  if (t.closest("[data-backup]")) { location.hash = "backup"; return; }
  if (t.closest("[data-find]")) { findLadder(); return; }
  if (t.closest("[data-manual]")) { add.phase = "manual"; add.msg = ""; renderAddBody(); return; }
  if (t.closest("[data-save]") && add && add.result && add.days.size) { addToDays(add.resultId, Number(document.getElementById("startlvl").value) || 0); return; }
  if (t.closest("[data-savemanual]") && add && add.days.size) {
    const steps = parseManual(add.manualText), name = add.query.trim();
    if (!name || !steps.length) { const ta = document.getElementById("manual"); ta && ta.focus(); return; }
    const id = newId(name);
    state.custom[id] = { name, focus: "", start: 0, steps, related: [], alts: [] };
    addToDays(id, 0); return;
  }
  const jump = t.closest("[data-jumpto]");
  if (jump && add && add.match) {
    const id = add.match.id;
    state.levels[id] = Number(jump.dataset.jumpto);
    persist(); openStep = null; currentDay = daysOf(id).includes(currentDay) ? currentDay : daysOf(id)[0];
    location.hash = "ex-" + id; return;
  }
  if (t.closest("[data-addexisting]") && add && add.match) {
    const id = add.match.id;
    for (const d of add.days) if (!dayList(d).includes(id)) state.adds[d].push(id);
    persist(); openStep = null; currentDay = DAY_KEYS.find(d => add.days.has(d)) || currentDay;
    location.hash = "ex-" + id; return;
  }
  const rm = t.closest("[data-remove]");
  if (rm) {
    const id = exId(), d = rm.dataset.remove;
    state.adds[d] = state.adds[d].filter(x => x !== id);
    if (isAdded(id) && !daysOf(id).length) { delete state.custom[id]; delete state.levels[id]; delete state.logs[id]; }
    persist();
    if (daysOf(id).length) renderEx(id); else location.hash = d;
    return;
  }
  if (t.id === "reset") { state.levels = {}; persist(); renderDay(currentDay); toast("Levels reset to the starting guesses"); return; }
  if (t.closest("[data-dl]")) {
    const blob = new Blob([backupText()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `calgoal-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Backup file saved to Downloads"); return;
  }
  if (t.closest("[data-copy]")) { toast(await copyText(backupText()) ? "Backup copied. Paste it somewhere safe." : "Couldn't copy. Use Save backup file instead."); return; }
  if (t.closest("[data-restore]")) { checkRestore(); return; }
  if (t.closest("[data-cancelrestore]")) { pendingRestore = null; document.getElementById("bk-msg").innerHTML = ""; return; }
  if (t.closest("[data-confirmrestore]") && pendingRestore) {
    state = pendingRestore; pendingRestore = null; persist();
    toast("Backup restored"); location.hash = currentDay; return;
  }
});

app.addEventListener("submit", ev => {
  if (ev.target.id !== "logform") return;
  ev.preventDefault();
  const id = location.hash.slice(4);
  if (!getEx(id)) return;
  const vals = [...ev.target.querySelectorAll("input[type=number]")]
    .filter(i => i.value.trim() !== "")
    .map(i => Math.max(0, Math.min(9999, Math.round(Number(i.value) || 0))));
  if (!vals.length) { ev.target.querySelector("input").focus(); return; }
  (state.logs[id] = state.logs[id] || []).push({ d: today(), step: lvl(id), sets: vals });
  state.logs[id] = state.logs[id].slice(-20);
  persist();
  renderEx(id);
  if (document.activeElement) document.activeElement.blur();
});

window.addEventListener("hashchange", () => route(true));
const startHash = location.hash.slice(1);
if (DAYS[startHash]) currentDay = startHash;
route(true);

// ---------- offline support ----------
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
