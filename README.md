# IELTS Sentence Lab · MVP v1.1

本地优先的 IELTS Listening / Academic Reading 逐句学习平台。第一版只实现：

`Library → Material → Sentence Learning → Vocabulary → Vocabulary Book`

## 运行

```bash
python3 -m http.server 8080
```

打开 <http://localhost:8080>。无需账号、会员、API 或云服务。

## 技术架构

- UI：原生 HTML / CSS / JavaScript，无构建步骤、无第三方运行时依赖。
- 持久化：浏览器 `localStorage`，键为 `ielts-sentence-lab-mvp-v1.1.1`。
- Listening：测试材料为每个 Sentence 关联一段完整句子音频；播放时不会截断句首或句尾。
- Reading：每句调用浏览器 Web Speech API 英语 TTS。
- 词典：Longman 基础 URL 只在 `mvp.js` 的 `LONGMAN_BASE_URL` 配置一次，新标签打开，不抓取词典内容。
- 扩展接口：`materials` 与 `sentences` 是独立集合；以后导入 Cambridge 资料只需生成相同数据结构。

## 数据模型

```text
Material
  id, collection, title, testNo, skill, sectionNo,
  audioKind(original|tts), audioPath

SentenceUnit
  id, materialId, orderIndex, textEn, textZh, audioKind, audioPath

VocabularyItem
  id, normalizedText, displayText, englishDefinition,
  sourceSentenceId

VocabularyOccurrence
  id, vocabularyItemId, sentenceId, tokenStart, tokenEnd

Progress
  materialId, currentSentenceIndex, completedSentenceCount

Settings
  playbackRate, repeatCount, pauseSeconds, autoContinue,
  showEnglish, showChinese, highlightVocabulary
```

VocabularyItem 刻意不包含中文词义、Added Date、熟练度、SRS 或 Active/Passive/Mastered 状态。

## 测试数据

- Listening：`Riverside Visitor Centre`，12 句，每句均有完整独立音频。
- Academic Reading：`Green Spaces in Modern Cities`，15 句，逐句英语 TTS。

测试文本与音频均为本项目自制测试内容，不包含 Cambridge IELTS 受版权保护材料。
