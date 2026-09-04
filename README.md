# IELTS Sentence Lab · MVP v1.3

本地优先的 IELTS Listening / Academic Reading 逐句学习平台。第一版只实现：

`Library → Material → 原声听写 → 英文对照 → Vocabulary → Vocabulary Book`

## 运行

```bash
python3 -m http.server 8080
```

打开 <http://localhost:8080>。无需账号、会员、API 或云服务。

macOS 也可以双击项目根目录的 `打开雅思学习工作台.command`，它会启动本地服务器并打开资料库。不要直接用 `file://` 运行应用；页面检测到这种打开方式时会自动转到 `http://localhost:8080`。

## 技术架构

- UI：原生 HTML / CSS / JavaScript，无构建步骤、无第三方运行时依赖。
- 持久化：浏览器 `localStorage`，键为 `ielts-sentence-lab-mvp-v1.1.1`。
- 学习续接：保存最后学习材料、当前句号、已访问句数和听写草稿；资料库与顶部按钮均可继续上次学习。
- Listening：测试材料为每个 Sentence 关联一段完整句子音频；播放时不会截断句首或句尾。
- Reading：每句调用浏览器 Web Speech API 英语 TTS。
- 第一遍听写：当前句临时 UI 状态；支持草稿、空白提交、逐词差异和提前查看确认，不保存评分或听写历史。
- 词典：Longman 基础 URL 只在 `mvp.js` 的 `LONGMAN_BASE_URL` 配置一次，新标签打开，不抓取词典内容。
- 扩展接口：`materials` 与 `sentences` 是独立集合；以后导入 Cambridge 资料只需生成相同数据结构。
- 资料库：递归索引 `data/IELTS` 中的 498 个 MP3。根目录包含 158 组 MP3 + LRC，分为 6 个系列，可依据 LRC 时间轴按完整英文句子学习；`电台节目`包含 Cambridge IELTS 4–20 的 340 个音频（272 个 Part/Section + 68 个完整 Test），340 个 AI 英文 transcript 均已生成并可进入逐句学习。AI 转写仍需人工校对；Cambridge 21 因没有本地源文件而保持 Waiting 状态。
- 导入清单：`data/library/` 保存 v1.2 提供的 308 个材料元数据；Authentic Listening 只接受用户合法拥有的原始音频。

`data/IELTS/` 是本地资料目录，不纳入 Git。`meta/` 中的 504 张封面图片不计入听力材料。Cambridge 12 的本地文件名使用 Test 5–8，资料库中按顺序对应 Test 1–4；Cambridge 20 的源文件沿用 `Text1`–`Text4` 文件名。

### 重新连接本地资料

如果项目里的 `data` 文件夹被删除，可先从云端把资料下载到电脑，再在“资料库 → 本地资料文件夹”点击“导入 / 重新连接 data 文件夹”。可以选择完整的 `data` 文件夹，也可以直接选择其中的 `IELTS` 文件夹。

- 导入不会复制或上传文件，浏览器会直接读取所选目录中的 LRC、transcript JSON 和 MP3。
- 文件夹授权保存在当前浏览器配置中；浏览器收回权限后，资料库会提示重新授权。
- 持久文件夹授权使用 File System Access API，请通过 `http://localhost:8080` 在 Chrome、Edge 或 Codex 内置浏览器中运行。

## 本地英文转写

`scripts/transcribe_ielts.py` 使用本机 `whisper.cpp` 为 `电台节目`中的340个MP3生成带时间戳英文原文。脚本支持断点续跑，结果保存在本地 `data/IELTS/transcripts/`。这些内容属于 AI 自动转写，进入学习页时会标记“待校对”，不能视为官方 audioscript。

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

DictationState（当前句临时状态）
  sentenceId, draftText, firstAttemptText, submitted, skipped, comparing
```

VocabularyItem 刻意不包含中文词义、Added Date、熟练度、SRS 或 Active/Passive/Mastered 状态。
听写刻意不包含分数、正确率、等级、排行榜或历史 Attempts 表。
