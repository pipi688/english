const assert = require('node:assert/strict');
const engine = require('../learning-engine.js');

const parts = engine.compare('The whether is fine', 'The weather is fine today');
assert.deepEqual(parts.map(part => part.type), ['correct', 'spelling', 'correct', 'correct', 'missing']);
assert.equal(engine.score(parts), 3 / 5);
assert.deepEqual(engine.errorTags(parts), [
  { type: 'spelling', label: '拼写', count: 1 },
  { type: 'missing', label: '漏词', count: 1 },
]);

const state = {};
const first = engine.recordAttempt(state, {
  id: 'attempt-1', sentenceId: 'sentence-1', actualText: 'A complete sentence', expectedText: 'A complete sentence', reviewedAt: '2026-09-04T08:00:00.000Z',
});
assert.equal(first.accuracy, 1);
assert.equal(state.reviewSchedules['sentence-1'].dueAt, '2026-09-05T08:00:00.000Z');
assert.deepEqual(engine.dueSentenceIds(state, '2026-09-05T07:59:59.000Z'), []);
assert.deepEqual(engine.dueSentenceIds(state, '2026-09-05T08:00:00.000Z'), ['sentence-1']);

engine.recordAttempt(state, {
  id: 'attempt-2', sentenceId: 'sentence-2', actualText: '', expectedText: 'Hard sentence', reviewedAt: '2026-09-04T08:00:00.000Z',
});
assert.equal(state.reviewSchedules['sentence-2'].dueAt, '2026-09-04T08:10:00.000Z');
assert.equal(engine.errorSummary(state).find(item => item.type === 'missing').count, 2);

const hinted = engine.recordAttempt(state, {
  id: 'attempt-3', sentenceId: 'sentence-3', actualText: 'A complete sentence', expectedText: 'A complete sentence', hintLevel: 2, reviewedAt: '2026-09-04T08:00:00.000Z',
});
assert.equal(hinted.accuracy, 1);
assert.equal(hinted.masteryScore, 0.75);
assert.equal(state.reviewSchedules['sentence-3'].dueAt, '2026-09-05T08:00:00.000Z');

const interleavedState = {
  reviewSchedules: Object.fromEntries(['s1', 's2', 's3', 's4'].map(sentenceId => [sentenceId, { dueAt: '2026-09-04T07:00:00.000Z' }])),
  attempts: [
    { sentenceId: 's1', errorTags: [{ type: 'missing' }] },
    { sentenceId: 's2', errorTags: [{ type: 'missing' }] },
    { sentenceId: 's3', errorTags: [{ type: 'missing' }] },
    { sentenceId: 's4', errorTags: [{ type: 'spelling' }] },
  ],
};
const meta = [
  { sentenceId: 's1', materialId: 'm1' }, { sentenceId: 's2', materialId: 'm1' },
  { sentenceId: 's3', materialId: 'm2' }, { sentenceId: 's4', materialId: 'm2' },
];
assert.deepEqual(engine.buildInterleavedQueue(interleavedState, meta, '2026-09-04T08:00:00.000Z'), ['s1', 's4', 's2', 's3']);

const reviewState = { attempts: [
  { sentenceId: 's1', practiceContext: 'review', createdAt: '2026-09-04T08:00:00.000Z' },
  { sentenceId: 's1', practiceContext: 'review', createdAt: '2026-09-04T09:00:00.000Z' },
  { sentenceId: 's2', practiceContext: 'study', createdAt: '2026-09-04T10:00:00.000Z' },
] };
assert.equal(engine.completedReviewsToday(reviewState, '2026-09-04T12:00:00.000Z'), 1);

assert.deepEqual(
  engine.keywordCues('Researchers have linked access to parks with lower levels of stress and healthier communities.'),
  ['researchers', 'access', 'lower', 'stress', 'communities'],
);
const transfer = engine.createAttempt({
  id: 'transfer-1', sentenceId: 's5', mode: 'keyword_recall', practiceContext: 'transfer', cueWords: ['urban', 'health'], actualText: 'Urban spaces improve health', expectedText: 'Urban spaces improve health',
});
assert.equal(transfer.mode, 'keyword_recall');
assert.equal(transfer.practiceContext, 'transfer');
assert.deepEqual(transfer.cueWords, ['urban', 'health']);

const confidenceAttempt = engine.createAttempt({
  id: 'confidence-1', sentenceId: 's6', actualText: 'Partial answer', expectedText: 'A complete answer', predictedRecall: 0.9,
});
assert.equal(confidenceAttempt.predictedRecall, 0.9);
assert.equal(engine.createAttempt({ id: 'confidence-none', sentenceId: 's7', actualText: '', expectedText: 'Anything' }).predictedRecall, null);

const profile = engine.learningProfile({ attempts: [
  { id: 'p1', sentenceId: 'a', mode: 'dictation', practiceContext: 'study', masteryScore: 0.8, hintLevel: 0, errorTags: [{ type: 'missing', label: '漏词', count: 2 }], createdAt: '2026-09-01T08:00:00Z' },
  { id: 'p2', sentenceId: 'b', mode: 'dictation', practiceContext: 'review', masteryScore: 0.6, hintLevel: 0, errorTags: [{ type: 'missing', label: '漏词', count: 1 }], createdAt: '2026-09-02T08:00:00Z' },
  { id: 'p3', sentenceId: 'c', mode: 'keyword_recall', practiceContext: 'transfer', masteryScore: 0.5, hintLevel: 0, errorTags: [{ type: 'spelling', label: '拼写', count: 1 }], createdAt: '2026-09-03T08:00:00Z' },
] });
assert.equal(profile.totalAttempts, 3);
assert.equal(profile.uniqueSentences, 3);
assert.equal(profile.metrics.noHintRecall, 0.7);
assert.equal(profile.metrics.transferMastery, 0.5);
assert.equal(profile.metrics.reviewRetention, 0.6);
assert.equal(profile.errorDistribution[0].type, 'missing');
assert.equal(profile.recommendation.action, 'review');

const emptyProfile = engine.learningProfile({ attempts: [] });
assert.equal(emptyProfile.confidence, 'early');
assert.equal(emptyProfile.metrics.noHintRecall, null);
assert.equal(emptyProfile.recommendation.title, '先建立基线');

const spellingProfile = engine.learningProfile({ attempts: [1, 2, 3].map(index => ({
  id: `spell-${index}`, sentenceId: `spell-s${index}`, mode: 'dictation', practiceContext: 'study', masteryScore: 0.8, hintLevel: 0, errorTags: [{ type: 'spelling', label: '拼写', count: 1 }], createdAt: `2026-09-0${index}T08:00:00Z`,
})) });
assert.equal(spellingProfile.recommendation.title, '集中修复拼写提取');

const overconfidentProfile = engine.learningProfile({ attempts: [1, 2, 3].map(index => ({
  id: `cal-${index}`, sentenceId: `cal-s${index}`, mode: 'dictation', practiceContext: 'study', masteryScore: 0.5, predictedRecall: 0.9, hintLevel: 0, errorTags: [{ type: 'spelling', label: '拼写', count: 1 }], createdAt: `2026-09-0${index}T08:00:00Z`,
})) });
assert.ok(Math.abs(overconfidentProfile.metrics.calibrationError - 0.4) < 1e-9);
assert.ok(Math.abs(overconfidentProfile.calibration.bias - 0.4) < 1e-9);
assert.equal(overconfidentProfile.calibration.evidenceCount, 3);
assert.equal(overconfidentProfile.recommendation.title, '校准“感觉会了”');

console.log('learning engine tests passed');
