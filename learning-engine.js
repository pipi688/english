(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IeltsLearningEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const DAY_MS = 86400000;
  const STRONG_INTERVALS = [1, 3, 7, 14, 30, 60];
  const DEVELOPING_INTERVALS = [1, 2, 4, 7, 14, 30];
  const HINT_FACTORS = [1, 0.9, 0.75];
  const CUE_STOP_WORDS = new Set(['about','after','again','also','because','before','being','been','could','does','done','each','from','have','into','many','more','most','much','only','other','should','some','such','than','that','their','them','then','there','these','they','this','those','through','used','very','were','what','when','where','which','while','will','with','would','your']);

  function normalizeTokens(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9']+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function editDistance(left, right) {
    const a = String(left || '');
    const b = String(right || '');
    const row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let diagonal = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const previous = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
        diagonal = previous;
      }
    }
    return row[b.length];
  }

  function compare(actualText, expectedText) {
    const actual = normalizeTokens(actualText);
    const expected = normalizeTokens(expectedText);
    const dp = Array.from({ length: expected.length + 1 }, () => Array(actual.length + 1).fill(0));
    for (let i = expected.length - 1; i >= 0; i -= 1) {
      for (let j = actual.length - 1; j >= 0; j -= 1) {
        dp[i][j] = expected[i] === actual[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const raw = [];
    let i = 0;
    let j = 0;
    while (i < expected.length || j < actual.length) {
      if (i < expected.length && j < actual.length && expected[i] === actual[j]) raw.push({ type: 'correct', expected: expected[i++], actual: actual[j++] });
      else if (i < expected.length && (j >= actual.length || dp[i + 1][j] >= dp[i][j + 1])) raw.push({ type: 'missing', expected: expected[i++] });
      else raw.push({ type: 'extra', actual: actual[j++] });
    }
    const parts = [];
    for (let index = 0; index < raw.length; index += 1) {
      const here = raw[index];
      const next = raw[index + 1];
      if (next && here.type === 'missing' && next.type === 'extra') {
        parts.push(classifyDifference(here.expected, next.actual));
        index += 1;
      } else if (next && here.type === 'extra' && next.type === 'missing') {
        parts.push(classifyDifference(next.expected, here.actual));
        index += 1;
      } else parts.push(here);
    }
    return parts;
  }

  function classifyDifference(expected, actual) {
    const distance = editDistance(expected, actual);
    const threshold = Math.max(expected.length, actual.length) <= 4 ? 1 : 2;
    return { type: distance <= threshold ? 'spelling' : 'substitution', expected, actual };
  }

  function score(parts) {
    const expectedCount = parts.filter(part => part.type !== 'extra').length;
    const correctCount = parts.filter(part => part.type === 'correct').length;
    return expectedCount ? correctCount / expectedCount : 0;
  }

  function errorTags(parts) {
    const names = { missing: '漏词', extra: '多词', spelling: '拼写', substitution: '替换' };
    const counts = {};
    parts.forEach(part => {
      if (!names[part.type]) return;
      counts[part.type] = (counts[part.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, label: names[type], count }));
  }

  function keywordCues(text, limit = 5) {
    const unique = [];
    normalizeTokens(text).forEach(word => {
      if (word.length < 4 || CUE_STOP_WORDS.has(word) || unique.includes(word)) return;
      unique.push(word);
    });
    if (unique.length <= limit) return unique;
    return Array.from({ length: limit }, (_, index) => unique[Math.round(index * (unique.length - 1) / (limit - 1))]);
  }

  function schedule(previous, accuracy, reviewedAt) {
    const now = new Date(reviewedAt || Date.now());
    const prior = previous || { level: 0, lapses: 0 };
    let level = Number(prior.level) || 0;
    let lapses = Number(prior.lapses) || 0;
    let intervalDays;
    let dueAt;
    if (accuracy >= 0.9) {
      level = Math.min(level + 1, STRONG_INTERVALS.length);
      intervalDays = STRONG_INTERVALS[level - 1];
      dueAt = new Date(now.getTime() + intervalDays * DAY_MS);
    } else if (accuracy >= 0.7) {
      level = Math.max(1, Math.min(level, DEVELOPING_INTERVALS.length));
      intervalDays = DEVELOPING_INTERVALS[level - 1];
      dueAt = new Date(now.getTime() + intervalDays * DAY_MS);
    } else {
      level = 0;
      lapses += 1;
      intervalDays = 0;
      dueAt = new Date(now.getTime() + 10 * 60 * 1000);
    }
    return { level, lapses, intervalDays, lastReviewedAt: now.toISOString(), dueAt: dueAt.toISOString() };
  }

  function createAttempt({ id, sentenceId, actualText, expectedText, skipped = false, hintLevel = 0, practiceContext = 'study', mode = 'dictation', cueWords = [], predictedRecall = null, reviewedAt }) {
    const createdAt = new Date(reviewedAt || Date.now()).toISOString();
    const parts = skipped ? [{ type: 'skipped' }] : compare(actualText, expectedText);
    const accuracy = skipped ? 0 : score(parts);
    const normalizedHintLevel = Math.max(0, Math.min(2, Number(hintLevel) || 0));
    const masteryScore = accuracy * HINT_FACTORS[normalizedHintLevel];
    const prediction = predictedRecall !== null && predictedRecall !== '' && Number.isFinite(Number(predictedRecall)) ? Math.max(0, Math.min(1, Number(predictedRecall))) : null;
    return { id, sentenceId, mode, practiceContext, cueWords, predictedRecall: prediction, createdAt, actualText: String(actualText || ''), accuracy, masteryScore, hintLevel: normalizedHintLevel, skipped, parts, errorTags: skipped ? [{ type: 'skipped', label: '跳过', count: 1 }] : errorTags(parts) };
  }

  function recordAttempt(state, input) {
    state.attempts = Array.isArray(state.attempts) ? state.attempts : [];
    state.reviewSchedules = state.reviewSchedules && typeof state.reviewSchedules === 'object' ? state.reviewSchedules : {};
    const attempt = createAttempt(input);
    state.attempts.push(attempt);
    state.reviewSchedules[input.sentenceId] = schedule(state.reviewSchedules[input.sentenceId], attempt.masteryScore, attempt.createdAt);
    return attempt;
  }

  function dueSentenceIds(state, now) {
    const timestamp = new Date(now || Date.now()).getTime();
    return Object.entries(state.reviewSchedules || {})
      .filter(([, item]) => new Date(item.dueAt).getTime() <= timestamp)
      .sort((a, b) => new Date(a[1].dueAt) - new Date(b[1].dueAt))
      .map(([sentenceId]) => sentenceId);
  }

  function buildInterleavedQueue(state, sentenceMeta, now, limit = 20) {
    const metaById = new Map((sentenceMeta || []).map(item => [item.sentenceId, item]));
    const latestBySentence = new Map();
    [...(state.attempts || [])].reverse().forEach(attempt => {
      if (!latestBySentence.has(attempt.sentenceId)) latestBySentence.set(attempt.sentenceId, attempt);
    });
    const remaining = dueSentenceIds(state, now).map(sentenceId => {
      const latest = latestBySentence.get(sentenceId);
      return { sentenceId, materialId: metaById.get(sentenceId)?.materialId || '', errorType: latest?.errorTags?.[0]?.type || 'none' };
    });
    const result = [];
    let lastMaterial = '';
    let lastError = '';
    while (remaining.length && result.length < limit) {
      let index = remaining.findIndex(item => item.materialId !== lastMaterial && item.errorType !== lastError);
      if (index < 0) index = remaining.findIndex(item => item.materialId !== lastMaterial || item.errorType !== lastError);
      if (index < 0) index = 0;
      const [chosen] = remaining.splice(index, 1);
      result.push(chosen.sentenceId);
      lastMaterial = chosen.materialId;
      lastError = chosen.errorType;
    }
    return result;
  }

  function completedReviewsToday(state, now) {
    const target = new Date(now || Date.now());
    const sameLocalDay = value => {
      const date = new Date(value);
      return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate();
    };
    return new Set((state.attempts || []).filter(item => item.practiceContext === 'review' && sameLocalDay(item.createdAt)).map(item => item.sentenceId)).size;
  }

  function errorSummary(state) {
    const counts = {};
    (state.attempts || []).forEach(attempt => (attempt.errorTags || []).forEach(tag => {
      counts[tag.type] = counts[tag.type] || { type: tag.type, label: tag.label, count: 0 };
      counts[tag.type].count += tag.count;
    }));
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }

  function averageMastery(attempts) {
    return attempts.length ? attempts.reduce((sum, item) => sum + (item.masteryScore ?? item.accuracy ?? 0), 0) / attempts.length : null;
  }

  function learningProfile(state) {
    const attempts = (state.attempts || []).filter(item => !item.skipped);
    const noHint = attempts.filter(item => item.mode === 'dictation' && !item.hintLevel);
    const transfer = attempts.filter(item => item.mode === 'keyword_recall');
    const reviews = attempts.filter(item => item.practiceContext === 'review');
    const calibrated = attempts.filter(item => Number.isFinite(item.predictedRecall));
    const recent = attempts.slice(-10).map(item => ({
      id: item.id,
      mode: item.mode,
      practiceContext: item.practiceContext,
      hintLevel: item.hintLevel || 0,
      mastery: item.masteryScore ?? item.accuracy ?? 0,
      predictedRecall: Number.isFinite(item.predictedRecall) ? item.predictedRecall : null,
      createdAt: item.createdAt,
    }));
    const latestFive = attempts.slice(-5);
    const previousFive = attempts.slice(-10, -5);
    const latestAverage = averageMastery(latestFive);
    const previousAverage = averageMastery(previousFive);
    const errors = errorSummary({ attempts });
    const errorTotal = errors.reduce((sum, item) => sum + item.count, 0);
    const errorDistribution = errors.map(item => ({ ...item, share: errorTotal ? item.count / errorTotal : 0 }));
    const metrics = {
      noHintRecall: averageMastery(noHint),
      transferMastery: averageMastery(transfer),
      reviewRetention: averageMastery(reviews),
      calibrationError: calibrated.length ? calibrated.reduce((sum, item) => sum + Math.abs(item.predictedRecall - (item.masteryScore ?? item.accuracy ?? 0)), 0) / calibrated.length : null,
    };
    const calibrationBias = calibrated.length ? calibrated.reduce((sum, item) => sum + item.predictedRecall - (item.masteryScore ?? item.accuracy ?? 0), 0) / calibrated.length : null;
    let recommendation = { title: '先建立基线', detail: '再完成 3 次不同句子的无提示听写，系统才能形成更可靠的学习画像。', action: 'study' };
    if (attempts.length >= 3) {
      const topError = errorDistribution[0]?.type;
      const transferGap = metrics.noHintRecall != null && metrics.transferMastery != null ? metrics.noHintRecall - metrics.transferMastery : 0;
      if (metrics.reviewRetention != null && metrics.reviewRetention < 0.7) recommendation = { title: '先巩固到期内容', detail: '复习保持低于 70%，优先完成今日队列，并尽量不用提示。', action: 'review' };
      else if (transferGap > 0.15) recommendation = { title: '加强线索迁移', detail: '关键词迁移明显低于普通听写；核对原文后，再做一次关键词回忆。', action: 'study' };
      else if (calibrated.length >= 3 && calibrationBias > 0.2) recommendation = { title: '校准“感觉会了”', detail: '提交前的确信度持续高于实际表现。看到答案前先完整写出，再用差异反馈修正判断。', action: 'review' };
      else if (topError === 'spelling') recommendation = { title: '集中修复拼写提取', detail: '拼写是当前最常见错误。听完后先口头拼读，再无提示写出整词。', action: 'review' };
      else if (topError === 'substitution') recommendation = { title: '加强词义与搭配辨析', detail: '替换错误最多。复习时对比原词与误写词在当前语境中的搭配差异。', action: 'review' };
      else if (topError === 'extra') recommendation = { title: '校准语流边界', detail: '多词错误较多。降低一次语速，标记弱读和连读边界后重新听写。', action: 'review' };
      else recommendation = { title: '优先修复漏听片段', detail: '漏词是当前主要问题。按意群重听，先复述节奏，再进行完整听写。', action: 'review' };
    }
    return {
      totalAttempts: attempts.length,
      uniqueSentences: new Set(attempts.map(item => item.sentenceId)).size,
      confidence: attempts.length < 5 ? 'early' : attempts.length < 15 ? 'developing' : 'stable',
      metrics,
      calibration: { evidenceCount: calibrated.length, bias: calibrationBias },
      trendDelta: latestAverage != null && previousAverage != null ? latestAverage - previousAverage : null,
      recent,
      errorDistribution,
      recommendation,
    };
  }

  return { normalizeTokens, compare, score, errorTags, keywordCues, schedule, createAttempt, recordAttempt, dueSentenceIds, buildInterleavedQueue, completedReviewsToday, errorSummary, learningProfile };
});
