const STORAGE_KEY = 'ielts7-study-hub-v1';
const phases = [
  { start: 1, end: 28, title: '基础重建', goal: '恢复语感，建立核心词汇与语法', target: '目标 5.0–5.5' },
  { start: 29, end: 84, title: '单项突破', goal: '掌握四科题型和可复用方法', target: '目标 6.0' },
  { start: 85, end: 140, title: '能力提分', goal: '限时训练，强化写作与口语反馈', target: '目标 6.5' },
  { start: 141, end: 180, title: '套题冲刺', goal: '完整模考，稳定节奏与弱项', target: '目标 7.0' }
];
const templates = {
  0: [
    ['词汇与语法', '复习 30 个核心词组；完成 10 句语法改写', .24, 'vocabulary'],
    ['听力精听', '剑雅 Section 1：盲听 → 对答案 → 逐句跟读', .28, 'listening'],
    ['阅读精读', '精读 1 篇文章，标记定位词与同义替换', .28, 'reading'],
    ['口语唤醒', 'Part 1 录音 3 题；复听并重说一次', .20, 'speaking']
  ],
  1: [
    ['听力题型训练', '完成 1 个 Section，整理拼写与同义替换', .27, 'listening'],
    ['阅读题型训练', '完成 1 篇，逐题写下定位依据', .27, 'reading'],
    ['写作拆解', '分析 1 篇范文结构并仿写 1 段', .27, 'writing'],
    ['口语表达', 'Part 2 录音两遍，补充具体细节', .19, 'speaking']
  ],
  2: [
    ['限时听力', '完成两节限时训练，复盘失分原因', .27, 'listening'],
    ['限时阅读', '18 分钟完成一篇并复盘定位路径', .27, 'reading'],
    ['写作输出', 'Task 1 / Task 2 轮换，完成一篇限时写作', .30, 'writing'],
    ['口语反馈', '完整练习 Part 2 + Part 3，修正重复错误', .16, 'speaking']
  ],
  3: [
    ['套题训练', '按考试时间完成今日安排的完整科目', .50, 'mock'],
    ['错题复盘', '只记录错因、正确路径和下次提醒', .20, 'review'],
    ['写作精修', '重写最弱段落，检查回应题目与衔接', .18, 'writing'],
    ['口语保持', '随机题卡录音，控制停顿与语速', .12, 'speaking']
  ]
};

const defaultState = { startDate: new Date().toISOString().slice(0, 10), examDate: '', weakSkill: '', dailyMinutes: 150, completions: {}, scores: [], weeklyReviews: {}, lastStudyDate: null, streak: 0 };
let state = loadState();
let timer = { total: 1500, left: 1500, interval: null, running: false };

function loadState() { try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...defaultState }; } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function studyDay() { const start = new Date(`${state.startDate}T00:00:00`); const now = new Date(); now.setHours(0,0,0,0); return Math.min(180, Math.max(1, Math.floor((now - start) / 86400000) + 1)); }
function phaseIndex(day) { return phases.findIndex(p => day >= p.start && day <= p.end); }
function roundedMinutes(total, ratio) { return Math.round((total * ratio) / 5) * 5; }
function currentTasks() {
  const day = studyDay(), source = templates[phaseIndex(day)];
  let allocated = 0;
  return source.map((t, i) => {
    const minutes = i === source.length - 1 ? state.dailyMinutes - allocated : roundedMinutes(state.dailyMinutes, t[2]);
    allocated += minutes;
    return { id: `${todayKey()}-${i}`, title: t[0], detail: t[1], minutes, kind: t[3] };
  });
}
function iconFor(kind) { const paths = { vocabulary:'M4 5h6a3 3 0 013 3v11a3 3 0 00-3-3H4z M20 5h-6a3 3 0 00-3 3v11a3 3 0 013-3h6z', listening:'M4 13a8 8 0 0116 0v5a2 2 0 01-2 2h-2v-7h4 M4 13v7H2a2 2 0 01-2-2v-5h4', reading:'M3 5h7a3 3 0 013 3v12a3 3 0 00-3-3H3z M21 5h-7a3 3 0 00-3 3v12a3 3 0 013-3h7z', writing:'M4 20l4-1 11-11-3-3L5 16z M14 7l3 3', speaking:'M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z M5 11a7 7 0 0014 0 M12 18v4', mock:'M4 3h16v18H4z M8 8h8 M8 12h8 M8 16h5', review:'M4 12a8 8 0 108-8 M4 4v8h8' }; return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[kind]}"></path></svg>`; }

function render() {
  const day = studyDay(), pi = phaseIndex(day), phase = phases[pi], tasks = currentTasks(), completed = state.completions[todayKey()] || [];
  document.getElementById('dateLabel').textContent = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
  document.getElementById('dayNumber').textContent = day;
  document.getElementById('phasePill').textContent = `第 ${pi + 1} 阶段 · ${phase.title}`;
  document.getElementById('phaseMessage').textContent = phase.goal + '。准确，比速度更重要。';
  document.getElementById('overallProgress').value = day;
  document.getElementById('overallPercent').textContent = `${Math.round(day / 180 * 100)}%`;
  document.getElementById('dailyMinutes').value = String(state.dailyMinutes);
  const doneMinutes = tasks.filter(t => completed.includes(t.id)).reduce((sum, t) => sum + t.minutes, 0);
  document.getElementById('doneMinutes').textContent = doneMinutes;
  document.getElementById('totalMinutes').textContent = state.dailyMinutes;
  document.getElementById('streakDays').textContent = state.streak;
  document.getElementById('taskCount').textContent = `${completed.length} / ${tasks.length} 完成`;
  document.getElementById('taskList').innerHTML = tasks.map(t => `<label class="task ${completed.includes(t.id) ? 'done' : ''}"><input type="checkbox" data-task="${t.id}" ${completed.includes(t.id) ? 'checked' : ''}><span><span class="task-title">${iconFor(t.kind)} ${t.title}</span><span class="task-detail">${t.detail}</span></span><span class="task-time">${t.minutes} 分钟</span></label>`).join('');
  document.getElementById('phaseList').innerHTML = phases.map((p, i) => `<article class="phase ${i === pi ? 'current' : ''}"><span class="phase-number">${i+1}</span><h3>${p.title}</h3><p>第 ${p.start}–${p.end} 天<br>${p.goal}</p><small>${p.target}</small></article>`).join('');
  renderScores();
  renderSetup();
  renderWeek();
}
function renderScores() { const box = document.getElementById('scoreHistory'); if (!state.scores.length) { box.innerHTML = '<p class="empty">还没有模考记录。建议完成首次诊断后录入成绩。</p>'; document.getElementById('latestScore').textContent = '尚未记录'; return; } const scores = [...state.scores].reverse(); document.getElementById('latestScore').textContent = `${scores[0].overall.toFixed(1)} 分`; box.innerHTML = scores.slice(0,5).map(s => `<div class="score-row"><time>${s.date}</time><span>听 ${s.l}</span><span>读 ${s.r}</span><span>写 ${s.w}</span><span>说 ${s.s}</span><strong>${s.overall.toFixed(1)}</strong></div>`).join(''); }
function updateStreak() { const today = todayKey(); if (state.lastStudyDate === today) return; const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1); const y = yesterday.toISOString().slice(0,10); state.streak = state.lastStudyDate === y ? state.streak + 1 : 1; state.lastStudyDate = today; }
function showToast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(showToast.timeout); showToast.timeout = setTimeout(() => el.classList.remove('show'), 3000); }
function dateKey(date) { return date.toISOString().slice(0, 10); }
function weekKey() { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dateKey(d); }
function renderSetup() {
  document.getElementById('startDate').value = state.startDate;
  document.getElementById('examDate').value = state.examDate || '';
  document.querySelectorAll('[name="weakSkill"]').forEach(input => input.checked = input.value === state.weakSkill);
  const names = { listening:'听力', reading:'阅读', writing:'写作', speaking:'口语' };
  document.getElementById('planAdvice').textContent = state.weakSkill ? `当前优先弱项：${names[state.weakSkill]}。每天完成常规任务后，用剩余 10–15 分钟复盘该单项。` : '完成一次基线模考后，选择最弱项；系统会在每日计划中提醒你优先投入。';
  const countdown = document.getElementById('examCountdown');
  if (!state.examDate) { countdown.textContent = '设置考试日期后显示倒计时'; return; }
  const days = Math.ceil((new Date(`${state.examDate}T00:00:00`) - new Date()) / 86400000);
  countdown.textContent = days >= 0 ? `距离考试还有 ${days} 天` : '考试日期已过，请更新计划';
}
function renderWeek() {
  const days = [], now = new Date();
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); const key = dateKey(d), count = (state.completions[key] || []).length; days.push({ key, count, date:d }); }
  const done = days.reduce((sum, d) => sum + d.count, 0), total = days.length * 4;
  document.getElementById('weekRate').textContent = `最近 7 天完成率 ${Math.round(done / total * 100)}%`;
  document.getElementById('weekStrip').innerHTML = days.map(d => `<div class="week-day ${d.count === 4 ? 'complete' : ''} ${d.key === todayKey() ? 'today' : ''}"><span>${['日','一','二','三','四','五','六'][d.date.getDay()]}</span><strong>${d.date.getMonth()+1}/${d.date.getDate()}</strong><span>${d.count}/4 项</span></div>`).join('');
  const review = state.weeklyReviews[weekKey()] || {};
  document.getElementById('weeklyWin').value = review.win || '';
  document.getElementById('weeklyBlock').value = review.block || '';
  document.getElementById('nextFocus').value = review.focus || '';
}

document.getElementById('taskList').addEventListener('change', e => { if (!e.target.matches('[data-task]')) return; const key = todayKey(), set = new Set(state.completions[key] || []); e.target.checked ? set.add(e.target.dataset.task) : set.delete(e.target.dataset.task); state.completions[key] = [...set]; if (e.target.checked) updateStreak(); saveState(); render(); showToast(e.target.checked ? '已完成一项，继续保持。' : '已取消完成状态。'); });
document.getElementById('dailyMinutes').addEventListener('change', e => { state.dailyMinutes = Number(e.target.value); saveState(); render(); showToast('今日计划已按新时长调整。'); });
document.getElementById('resetButton').addEventListener('click', () => { if (!confirm('要清空今天的任务完成状态吗？')) return; delete state.completions[todayKey()]; saveState(); render(); showToast('今日任务已重置。'); });
document.getElementById('scoreDate').value = todayKey();
document.getElementById('scoreForm').addEventListener('submit', e => { e.preventDefault(); const vals = ['listeningScore','readingScore','writingScore','speakingScore'].map(id => Number(document.getElementById(id).value)); const overall = Math.round((vals.reduce((a,b)=>a+b,0)/4)*2)/2; state.scores.push({ date: document.getElementById('scoreDate').value, l:vals[0], r:vals[1], w:vals[2], s:vals[3], overall }); saveState(); renderScores(); showToast(`模考成绩已保存：总分 ${overall.toFixed(1)}`); });
document.getElementById('setupForm').addEventListener('submit', e => { e.preventDefault(); const weak = document.querySelector('[name="weakSkill"]:checked'); state.startDate = document.getElementById('startDate').value; state.examDate = document.getElementById('examDate').value; state.weakSkill = weak ? weak.value : ''; saveState(); render(); showToast('备考设置已保存，计划已重新计算。'); });
function saveReviewDraft() { state.weeklyReviews[weekKey()] = { win:document.getElementById('weeklyWin').value, block:document.getElementById('weeklyBlock').value, focus:document.getElementById('nextFocus').value, savedAt:new Date().toISOString() }; saveState(); }
document.getElementById('reviewForm').addEventListener('input', saveReviewDraft);
document.getElementById('reviewForm').addEventListener('submit', e => { e.preventDefault(); saveReviewDraft(); showToast('本周复盘已保存。下周只盯住一个改进点。'); });
document.getElementById('exportData').addEventListener('click', () => { const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), data:state }, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `ielts7-backup-${todayKey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast('学习数据已导出。'); });
document.getElementById('importData').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; try { const parsed = JSON.parse(await file.text()), incoming = parsed.data; if (!incoming || typeof incoming !== 'object' || !incoming.completions || !Array.isArray(incoming.scores)) throw new Error('invalid'); state = { ...defaultState, ...incoming, weeklyReviews:incoming.weeklyReviews || {} }; saveState(); render(); showToast('学习数据已恢复。'); } catch { showToast('导入失败：请选择由本工作台导出的 JSON 文件。'); } finally { e.target.value = ''; } });

function updateTimer() { const m = Math.floor(timer.left/60), s = timer.left%60; document.getElementById('timerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; document.getElementById('timerRing').style.setProperty('--p', ((timer.total-timer.left)/timer.total)*100); document.getElementById('timerStatus').textContent = timer.running ? '专注中' : timer.left === 0 ? '本轮完成' : '准备开始'; }
function stopTimer() { clearInterval(timer.interval); timer.running = false; document.getElementById('timerToggle').textContent = timer.left === 0 ? '再来一轮' : '继续专注'; updateTimer(); }
document.getElementById('timerToggle').addEventListener('click', () => { if (timer.left === 0) timer.left = timer.total; if (timer.running) { stopTimer(); return; } timer.running = true; document.getElementById('timerToggle').textContent = '暂停'; updateTimer(); timer.interval = setInterval(() => { timer.left--; updateTimer(); if (timer.left <= 0) { stopTimer(); showToast('专注完成，休息一下吧。'); } }, 1000); });
document.querySelector('.timer-presets').addEventListener('click', e => { const btn = e.target.closest('[data-time]'); if (!btn) return; clearInterval(timer.interval); timer.running = false; timer.total = Number(btn.dataset.time)*60; timer.left = timer.total; document.querySelectorAll('[data-time]').forEach(b => b.classList.toggle('active', b === btn)); document.getElementById('timerToggle').textContent = '开始专注'; updateTimer(); });
render(); updateTimer();
