window.onerror = function (m, s, l, c) { document.title = "ERR " + m + " @" + l + ":" + c; return false; };
/* ---------- i18n ---------- */
function detectLang() {
  const l = (navigator.language || "pt").toLowerCase();
  if (l.startsWith("es")) return "es";
  if (l.startsWith("en")) return "en";
  return "pt";
}
let STR = null;
function t(k) {
  if (STR && STR[k] != null) return STR[k];
  return window.I18N.pt[k] != null ? window.I18N.pt[k] : k;
}

const PHASES = {
  focus: { color: "#ff6b6b" },
  short: { color: "#4dd4ac" },
  long:  { color: "#4d9bff" },
};
function phaseLabel(p) { return t(p === "focus" ? "phase_focus" : p === "short" ? "phase_short" : "phase_long"); }

const DEFAULTS = {
  focus: 25, short: 5, long: 15, cycles: 4,
  auto: true, idlePause: true,
  goal: 8,
  sound: true, alarmSound: "bip", volume: 40, ticking: false,
  noise: "off", noiseVol: 30,
  customSounds: [],
  lang: detectLang(),
};

const RING_LEN = 2 * Math.PI * 66; // 414.7

let cfg = load();
STR = window.I18N[cfg.lang] || window.I18N.pt;
let phase = "focus";
let remaining = cfg.focus * 60;
let total = remaining;
let running = false;
let tick = null;
let pomodoroCount = 0;
let lastSec = -1;

const $ = (id) => document.getElementById(id);
const el = {
  time: $("time"), cycle: $("cycleInfo"), tag: $("phaseTag"), activeTask: $("activeTask"),
  fg: document.querySelector("#ring .fg"), today: $("today"),
  start: $("startBtn"), reset: $("resetBtn"), skip: $("skipBtn"),
  set: $("setBtn"), pin: $("pinBtn"), min: $("minBtn"), close: $("closeBtn"),
  tasksBtn: $("tasksBtn"), statsBtn: $("statsBtn"),
  settings: $("settings"), tasks: $("tasks"), stats: $("stats"),
  cfgLang: $("cfgLang"),
  cfgFocus: $("cfgFocus"), cfgShort: $("cfgShort"), cfgLong: $("cfgLong"),
  cfgCycles: $("cfgCycles"), cfgGoal: $("cfgGoal"), cfgAuto: $("cfgAuto"),
  cfgIdle: $("cfgIdle"), cfgLogin: $("cfgLogin"), cfgSound: $("cfgSound"),
  cfgAlarmSound: $("cfgAlarmSound"), cfgVolume: $("cfgVolume"), cfgTicking: $("cfgTicking"),
  cfgNoise: $("cfgNoise"), cfgNoiseVol: $("cfgNoiseVol"),
  save: $("saveBtn"), cancel: $("cancelBtn"), testSound: $("testSoundBtn"),
  customSoundList: $("customSoundList"), addSound: $("addSoundBtn"),
};

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("pomodoro-cfg") || "{}") }; }
  catch { return { ...DEFAULTS }; }
}
function persist() { localStorage.setItem("pomodoro-cfg", JSON.stringify(cfg)); }

function phaseDuration(p) {
  return (p === "focus" ? cfg.focus : p === "short" ? cfg.short : cfg.long) * 60;
}
function fmt(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}
function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? (h + "h" + String(m).padStart(2, "0")) : (m + "min");
}

/* ---------- estatísticas ---------- */
function statsLoad() { try { return JSON.parse(localStorage.getItem("pomodoro-stats") || "{}"); } catch { return {}; } }
function statsSave(s) { localStorage.setItem("pomodoro-stats", JSON.stringify(s)); }
function dayKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function todayKey() { return dayKey(new Date()); }
function todayStats() { return statsLoad()[todayKey()] || { pomodoros: 0, focusSeconds: 0 }; }
function addFocusToStats(seconds) {
  const s = statsLoad(), k = todayKey();
  if (!s[k]) s[k] = { pomodoros: 0, focusSeconds: 0 };
  s[k].pomodoros++; s[k].focusSeconds += seconds;
  statsSave(s);
}
function last7() {
  const s = statsLoad(), out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const r = s[dayKey(d)] || { pomodoros: 0, focusSeconds: 0 };
    out.push({ d, pomodoros: r.pomodoros, focusSeconds: r.focusSeconds });
  }
  return out;
}
function streak() {
  const s = statsLoad(); let n = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const r = s[dayKey(d)];
    if (r && r.pomodoros > 0) n++;
    else if (i === 0) continue;
    else break;
  }
  return n;
}

/* ---------- render ---------- */
function render() {
  const meta = PHASES[phase];
  el.time.textContent = fmt(remaining);
  el.tag.textContent = phaseLabel(phase);
  el.tag.style.background = meta.color;
  el.fg.style.stroke = meta.color;
  document.documentElement.style.setProperty("--focus", meta.color);

  const frac = total > 0 ? remaining / total : 0;
  el.fg.style.strokeDashoffset = RING_LEN * (1 - frac);
  el.start.textContent = running ? "⏸" : "▶";

  if (phase === "focus") el.cycle.textContent = "Pomodoro " + (pomodoroCount + 1) + "/" + cfg.cycles;
  else el.cycle.textContent = t(phase === "long" ? "rest_long" : "rest_short");

  const at = activeTask();
  el.activeTask.innerHTML = at ? ("🎯 <b>" + escapeHtml(at.text) + "</b>" + (at.est ? " " + (at.pomos || 0) + "/" + at.est : "")) : "";

  const ts = todayStats();
  const hit = ts.pomodoros >= cfg.goal;
  el.today.innerHTML = escapeHtml(t("today_label")) + " <span class=" + (hit ? "goalhit" : "") + ">" + ts.pomodoros + "/" + cfg.goal + " 🍅</span> · " + fmtDur(ts.focusSeconds);

  document.title = fmt(remaining) + " · " + phaseLabel(phase);
  try { updateTray(); } catch (e) {}
}

/* ---------- bandeja ---------- */
let _trayKey = "";
function trayTip() { return fmt(remaining) + " · " + phaseLabel(phase) + (running ? "" : " " + t("tray_paused")); }
function sendTrayMenu() {
  if (window.win && window.win.setTrayMenu) {
    window.win.setTrayMenu({
      show: t("tray_show"), toggle: t("tray_toggle"), skip: t("tray_skip"),
      reset: t("tray_reset"), quit: t("tray_quit"),
    });
  }
}
function updateTray() {
  if (!window.win) return;
  const label = remaining >= 60 ? String(Math.ceil(remaining / 60)) : String(remaining);
  const key = label + phase + (running ? 1 : 0) + Math.round((remaining / (total || 1)) * 20);
  window.win.setTrayTooltip(trayTip());
  if (key === _trayKey) return;
  _trayKey = key;
  const c = document.createElement("canvas");
  c.width = 32; c.height = 32;
  const g = c.getContext("2d");
  const cx = 16, cy = 16, r = 13;
  g.lineWidth = 3.5;
  g.strokeStyle = "#3a3f4b";
  g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.stroke();
  g.strokeStyle = PHASES[phase].color;
  g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (total ? remaining / total : 0)); g.stroke();
  g.fillStyle = "#fff";
  g.font = "bold " + (label.length > 2 ? 11 : 14) + "px Segoe UI";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, cx, cy + 1);
  window.win.setTrayIcon(c.toDataURL("image/png"));
}

function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ---------- fases ---------- */
function setPhase(p, autoStart) {
  phase = p; total = phaseDuration(p); remaining = total;
  running = false; stopTick();
  applyNoise();
  render();
  if (autoStart) start();
}
function nextPhase() {
  if (phase === "focus") {
    pomodoroCount++;
    if (pomodoroCount >= cfg.cycles) { pomodoroCount = 0; setPhase("long", cfg.auto); }
    else setPhase("short", cfg.auto);
  } else setPhase("focus", cfg.auto);
}
function start() {
  if (running) return;
  if (phase === "focus") ensureActiveForFocus();
  running = true; lastSec = remaining;
  applyNoise();
  render();
  const startTs = Date.now();
  const startRemaining = remaining;
  tick = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    remaining = startRemaining - elapsed;
    if (remaining <= 0) {
      remaining = 0; render(); stopTick(); running = false;
      const ending = phase;
      if (ending === "focus") { addFocusToStats(total); creditActiveTask(); }
      applyNoise();
      alarm();
      notifyPhaseEnd(ending);
      nextPhase();
      return;
    }
    if (cfg.ticking && phase === "focus" && remaining !== lastSec) { lastSec = remaining; playTick(); }
    render();
  }, 250);
}
function pause() { running = false; stopTick(); applyNoise(); render(); }
function toggle() { running ? pause() : start(); }
function stopTick() { if (tick) { clearInterval(tick); tick = null; } }
function reset() { pomodoroCount = 0; setPhase("focus", false); }

function notifyPhaseEnd(ending) {
  if (!window.win) return;
  if (ending === "focus") window.win.notify(t("notif_focus_title"), t("notif_focus_body"));
  else window.win.notify(t("notif_break_title"), t("notif_break_body"));
  window.win.attention();
}

/* ---------- áudio (Web Audio, sem arquivos) ---------- */
let audioCtx = null;
function ensureCtx() { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function beep(freq, t2, dur, vol, type) {
  const ctx = ensureCtx(), osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type || "sine"; osc.frequency.value = freq;
  osc.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, t2);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t2 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t2 + dur);
  osc.start(t2); osc.stop(t2 + dur + 0.03);
}
function alarm() {
  if (!cfg.sound) return;
  playSound(cfg.alarmSound, cfg.volume / 100);
}
function playSound(soundId, v) {
  try {
    if (soundId && soundId.indexOf("custom:") === 0) {
      const s = (cfg.customSounds || []).find((x) => "custom:" + x.id === soundId);
      if (s) { const a = new Audio(s.url); a.volume = Math.min(1, Math.max(0, v)); a.play(); return; }
    }
    const ctx = ensureCtx(), now = ctx.currentTime;
    const endingBase = phase === "focus" ? 880 : 660;
    if (soundId === "sino") { beep(endingBase, now, 0.7, v, "triangle"); beep(endingBase * 2, now, 0.7, v * 0.5, "sine"); }
    else if (soundId === "digital") [0, 0.12, 0.24, 0.36].forEach((o) => beep(endingBase, now + o, 0.08, v, "square"));
    else [0, 0.28, 0.56].forEach((o) => beep(endingBase, now + o, 0.2, v, "sine"));
  } catch (e) {}
}
function playTick() {
  try {
    const ctx = ensureCtx(), now = ctx.currentTime, v = (cfg.volume / 100) * 0.25;
    beep(1000, now, 0.03, v, "square");
  } catch (e) {}
}

/* ---------- ruído ambiente ---------- */
let noiseNode = null, noiseGain = null;
function makeNoiseBuffer(ctx, brown) {
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; data[i] = last * 3.5; }
    else data[i] = w;
  }
  return buf;
}
function applyNoise() {
  const wantOn = cfg.noise !== "off" && running && phase === "focus";
  if (wantOn && !noiseNode) {
    try {
      const ctx = ensureCtx();
      noiseNode = ctx.createBufferSource();
      noiseNode.buffer = makeNoiseBuffer(ctx, cfg.noise === "brown");
      noiseNode.loop = true;
      noiseGain = ctx.createGain();
      noiseGain.gain.value = cfg.noiseVol / 100 * 0.5;
      noiseNode.connect(noiseGain); noiseGain.connect(ctx.destination);
      noiseNode.start();
    } catch (e) {}
  } else if (!wantOn && noiseNode) {
    try { noiseNode.stop(); } catch (e) {}
    noiseNode = null; noiseGain = null;
  } else if (wantOn && noiseGain) {
    noiseGain.gain.value = cfg.noiseVol / 100 * 0.5;
  }
}

/* ---------- tarefas ---------- */
function tasksLoad() { try { return JSON.parse(localStorage.getItem("pomodoro-tasks") || "[]"); } catch { return []; } }
function tasksSave(t2) { localStorage.setItem("pomodoro-tasks", JSON.stringify(t2)); }
let TASKS = tasksLoad();
let activeTaskId = null;
let taskSeg = "todo";

function pendingTasks() { return TASKS.filter((t2) => !t2.completed); }
function activeTask() { const t2 = TASKS.find((x) => x.id === activeTaskId); return t2 && !t2.completed ? t2 : null; }
function ensureActiveForFocus() { if (!activeTask()) { const p = pendingTasks()[0]; activeTaskId = p ? p.id : null; } }
function startTask(id) { activeTaskId = id; closePanels(); setPhase("focus", false); start(); }
function creditActiveTask() {
  const t2 = activeTask(); if (!t2) return;
  t2.pomos = (t2.pomos || 0) + 1;
  const target = t2.est && t2.est > 0 ? t2.est : 1;
  if (t2.pomos >= target) { t2.completed = true; t2.completedAt = Date.now(); }
  tasksSave(TASKS);
}
function renderTasks() {
  const list = $("taskList"); list.innerHTML = "";
  const pend = pendingTasks();
  if (!pend.length) {
    const empty = document.createElement("div");
    empty.style.cssText = "font-size:12px;color:var(--muted);text-align:center;padding:16px 0";
    empty.textContent = t("tasks_empty");
    list.appendChild(empty); return;
  }
  pend.forEach((t2) => {
    const row = document.createElement("div");
    row.className = "taskrow";
    if (t2.id === activeTaskId) row.style.background = "rgba(255,107,107,.10)";
    const play = document.createElement("button");
    play.className = "smallbtn"; play.style.cssText = "flex:0 0 auto;padding:3px 9px";
    play.textContent = (t2.id === activeTaskId && running) ? "⏸" : "▶";
    play.title = t("task_start_title");
    play.onclick = (e) => { e.stopPropagation(); if (t2.id === activeTaskId && running) pause(); else startTask(t2.id); };
    const name = document.createElement("span");
    name.className = "tname"; name.textContent = t2.text;
    if (t2.id === activeTaskId) name.style.cssText = "color:var(--text);font-weight:600";
    name.title = t("task_start_title");
    name.onclick = () => startTask(t2.id);
    const meta = document.createElement("span");
    meta.className = "tmeta";
    meta.textContent = (t2.pomos || 0) + (t2.est ? "/" + t2.est : "") + "🍅";
    const check = document.createElement("button");
    check.className = "smallbtn"; check.style.cssText = "flex:0 0 auto;padding:2px 8px"; check.textContent = "✓";
    check.title = t("task_done_title");
    check.onclick = (e) => { e.stopPropagation(); t2.completed = true; t2.completedAt = Date.now(); if (activeTaskId === t2.id) activeTaskId = null; tasksSave(TASKS); renderTasks(); render(); };
    const del = document.createElement("button");
    del.className = "smallbtn tdel"; del.textContent = "✕";
    del.onclick = (e) => { e.stopPropagation(); TASKS = TASKS.filter((x) => x.id !== t2.id); if (activeTaskId === t2.id) activeTaskId = null; tasksSave(TASKS); renderTasks(); render(); };
    row.append(play, name, meta, check, del);
    list.appendChild(row);
  });
}

function dayLabel(d) {
  const today = new Date(), y = new Date(); y.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return t("day_today");
  if (dayKey(d) === dayKey(y)) return t("day_yesterday");
  const loc = { pt: "pt-BR", en: "en-US", es: "es-ES" }[cfg.lang] || "pt-BR";
  return d.toLocaleDateString(loc, { day: "2-digit", month: "2-digit" });
}
function renderHistory() {
  const box = $("historyList"); box.innerHTML = "";
  const done = TASKS.filter((t2) => t2.completed && t2.completedAt).sort((a, b) => b.completedAt - a.completedAt);
  if (!done.length) {
    const empty = document.createElement("div");
    empty.style.cssText = "font-size:12px;color:var(--muted);text-align:center;padding:16px 0";
    empty.textContent = t("hist_empty");
    box.appendChild(empty); return;
  }
  let lastDay = "";
  done.forEach((t2) => {
    const d = new Date(t2.completedAt);
    if (dayKey(d) !== lastDay) {
      lastDay = dayKey(d);
      const h = document.createElement("div");
      h.className = "dayhdr"; h.textContent = dayLabel(d);
      box.appendChild(h);
    }
    const row = document.createElement("div");
    row.className = "donerow";
    const tk = document.createElement("span"); tk.textContent = "✓"; tk.style.cssText = "flex:0 0 auto;color:var(--short)";
    const name = document.createElement("span"); name.className = "dname"; name.textContent = t2.text;
    const meta = document.createElement("span"); meta.className = "dmeta";
    const hh = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    meta.textContent = (t2.pomos || 0) + "🍅 · " + hh;
    row.append(tk, name, meta);
    box.appendChild(row);
  });
}
function showTaskSeg(seg) {
  taskSeg = seg;
  $("segTodo").classList.toggle("active", seg === "todo");
  $("segDone").classList.toggle("active", seg === "done");
  $("todoView").style.display = seg === "todo" ? "flex" : "none";
  $("doneView").style.display = seg === "done" ? "flex" : "none";
  if (seg === "todo") renderTasks(); else renderHistory();
}
function addTask() {
  const input = $("taskInput"), est = $("taskEst");
  const text = input.value.trim(); if (!text) return;
  const e = parseInt(est.value, 10);
  TASKS.push({ id: Date.now(), text, est: isNaN(e) ? 0 : e, pomos: 0, completed: false });
  input.value = ""; est.value = "";
  tasksSave(TASKS); renderTasks();
}

/* ---------- stats panel ---------- */
function renderStatsPanel() {
  const ts = todayStats(), days = last7();
  $("statStreak").textContent = streak() + " " + t("stat_streak_days") + " 🔥";
  $("statToday").textContent = ts.pomodoros + " 🍅 · " + fmtDur(ts.focusSeconds);
  $("statWeek").textContent = days.reduce((a, d) => a + d.pomodoros, 0) + " 🍅";
  const max = Math.max(1, ...days.map((d) => d.pomodoros));
  const names = t("days_abbr");
  const chart = $("chart"); chart.innerHTML = "";
  days.forEach((d) => {
    const col = document.createElement("div");
    col.style.cssText = "flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;justify-content:flex-end";
    const bar = document.createElement("div");
    const h = Math.round((d.pomodoros / max) * 64);
    const isToday = dayKey(d.d) === todayKey();
    bar.style.cssText = "width:100%;border-radius:4px;height:" + Math.max(3, h) + "px;background:" + (isToday ? "var(--focus)" : "#3a3f4b");
    bar.title = d.pomodoros + " 🍅";
    const lbl = document.createElement("span");
    lbl.style.cssText = "font-size:10px;color:var(--muted)";
    lbl.textContent = names[d.d.getDay()];
    col.append(bar, lbl);
    chart.appendChild(col);
  });
}

/* ---------- painéis ---------- */
function closePanels() { [el.settings, el.tasks, el.stats].forEach((p) => p.classList.remove("open")); }
function togglePanel(p, onOpen) {
  const wasOpen = p.classList.contains("open");
  closePanels();
  if (!wasOpen) { if (onOpen) onOpen(); p.classList.add("open"); }
}

function rebuildAlarmSelect() {
  const sel = el.cfgAlarmSound;
  sel.innerHTML =
    '<option value="bip">' + t("alarm_beep") + '</option><option value="sino">' + t("alarm_bell") + '</option><option value="digital">' + t("alarm_digital") + "</option>" +
    (cfg.customSounds || []).map((s) => '<option value="custom:' + s.id + '">' + escapeHtml(s.name) + "</option>").join("");
  sel.value = cfg.alarmSound;
  if (!sel.value) sel.value = "bip";
}
function renderCustomSounds() {
  const box = el.customSoundList; box.innerHTML = "";
  (cfg.customSounds || []).forEach((s) => {
    const row = document.createElement("div");
    row.className = "soundrow";
    const dot = document.createElement("span"); dot.textContent = "🎵"; dot.style.flex = "0 0 auto";
    const name = document.createElement("span"); name.className = "sname"; name.textContent = s.name;
    const play = document.createElement("button"); play.className = "smallbtn splay"; play.textContent = "▶";
    play.onclick = () => playSound("custom:" + s.id, (parseInt(el.cfgVolume.value, 10) || 0) / 100);
    const del = document.createElement("button"); del.className = "smallbtn sdel"; del.textContent = "✕";
    del.onclick = () => {
      cfg.customSounds = cfg.customSounds.filter((x) => x.id !== s.id);
      if (cfg.alarmSound === "custom:" + s.id) cfg.alarmSound = "bip";
      persist(); rebuildAlarmSelect(); renderCustomSounds();
    };
    row.append(dot, name, play, del);
    box.appendChild(row);
  });
}
function openSettings() {
  el.cfgLang.value = cfg.lang;
  el.cfgFocus.value = cfg.focus; el.cfgShort.value = cfg.short; el.cfgLong.value = cfg.long;
  el.cfgCycles.value = cfg.cycles; el.cfgGoal.value = cfg.goal;
  el.cfgAuto.checked = cfg.auto; el.cfgIdle.checked = cfg.idlePause;
  el.cfgSound.checked = cfg.sound;
  rebuildAlarmSelect(); renderCustomSounds();
  el.cfgVolume.value = cfg.volume; el.cfgTicking.checked = cfg.ticking;
  el.cfgNoise.value = cfg.noise; el.cfgNoiseVol.value = cfg.noiseVol;
  if (window.win) window.win.getLoginItem().then((v) => { el.cfgLogin.checked = !!v; });
}
function saveSettings() {
  const clamp = (v, min, max, def) => { v = parseInt(v, 10); return isNaN(v) ? def : Math.min(max, Math.max(min, v)); };
  cfg.focus = clamp(el.cfgFocus.value, 1, 180, DEFAULTS.focus);
  cfg.short = clamp(el.cfgShort.value, 1, 60, DEFAULTS.short);
  cfg.long = clamp(el.cfgLong.value, 1, 120, DEFAULTS.long);
  cfg.cycles = clamp(el.cfgCycles.value, 1, 12, DEFAULTS.cycles);
  cfg.goal = clamp(el.cfgGoal.value, 1, 50, DEFAULTS.goal);
  cfg.auto = el.cfgAuto.checked; cfg.idlePause = el.cfgIdle.checked;
  cfg.sound = el.cfgSound.checked; cfg.alarmSound = el.cfgAlarmSound.value;
  cfg.volume = clamp(el.cfgVolume.value, 0, 100, DEFAULTS.volume);
  cfg.ticking = el.cfgTicking.checked;
  cfg.noise = el.cfgNoise.value; cfg.noiseVol = clamp(el.cfgNoiseVol.value, 0, 100, DEFAULTS.noiseVol);
  persist();
  if (window.win) window.win.setLoginItem(el.cfgLogin.checked);
  closePanels();
  if (!running) { total = phaseDuration(phase); remaining = total; }
  applyNoise();
  render();
}

/* ---------- aplica idioma ---------- */
function applyI18n() {
  STR = window.I18N[cfg.lang] || window.I18N.pt;
  document.documentElement.lang = cfg.lang;
  document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-title]").forEach((e) => { e.title = t(e.getAttribute("data-i18n-title")); });
  document.querySelectorAll("[data-i18n-ph]").forEach((e) => { e.placeholder = t(e.getAttribute("data-i18n-ph")); });
  sendTrayMenu();
  render();
  if (el.tasks.classList.contains("open")) showTaskSeg(taskSeg);
  if (el.stats.classList.contains("open")) renderStatsPanel();
  if (el.settings.classList.contains("open")) rebuildAlarmSelect();
}

/* ---------- eventos ---------- */
el.start.onclick = toggle;
el.reset.onclick = reset;
el.skip.onclick = () => { stopTick(); running = false; nextPhase(); };
el.set.onclick = () => togglePanel(el.settings, openSettings);
el.tasksBtn.onclick = () => togglePanel(el.tasks, () => showTaskSeg("todo"));
el.statsBtn.onclick = () => togglePanel(el.stats, renderStatsPanel);
el.save.onclick = saveSettings;
el.cancel.onclick = closePanels;
el.testSound.onclick = () => playSound(el.cfgAlarmSound.value, (parseInt(el.cfgVolume.value, 10) || 0) / 100);
el.addSound.onclick = async () => {
  if (!window.win) return;
  const s = await window.win.pickSound();
  if (!s) return;
  cfg.customSounds = cfg.customSounds || [];
  cfg.customSounds.push(s);
  cfg.alarmSound = "custom:" + s.id;
  persist();
  rebuildAlarmSelect(); renderCustomSounds();
};
el.cfgLang.onchange = () => { cfg.lang = el.cfgLang.value; persist(); applyI18n(); };
el.min.onclick = () => window.win && window.win.minimize();
el.close.onclick = () => window.win && window.win.close();
$("helpBtn").onclick = () => window.win && window.win.openManual(cfg.lang);

$("taskAdd").onclick = addTask;
$("taskInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
$("tasksClose").onclick = closePanels;
$("segTodo").onclick = () => showTaskSeg("todo");
$("segDone").onclick = () => showTaskSeg("done");
$("taskClearDone").onclick = () => { TASKS = TASKS.filter((t2) => !t2.completed); tasksSave(TASKS); renderHistory(); render(); };
$("statsClose").onclick = closePanels;
$("statsReset").onclick = () => { localStorage.removeItem("pomodoro-stats"); renderStatsPanel(); render(); };

let pinned = true;
el.pin.onclick = () => {
  pinned = !pinned;
  el.pin.classList.toggle("active", pinned);
  el.pin.style.opacity = pinned ? "1" : ".45";
  window.win && window.win.togglePin(pinned);
};

if (window.win) window.win.onCommand((cmd) => {
  if (cmd === "toggle") toggle();
  else if (cmd === "skip") { stopTick(); running = false; nextPhase(); }
  else if (cmd === "reset") reset();
  else if (cmd === "idle-pause") { if (running && cfg.idlePause) pause(); }
});

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  if (e.key === "r" || e.key === "R") reset();
});

// popula o seletor de idioma
window.I18N_LANGS.forEach((l) => {
  const o = document.createElement("option"); o.value = l.code; o.textContent = l.name;
  el.cfgLang.appendChild(o);
});

applyI18n();