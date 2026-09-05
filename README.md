# IELTS Sentence Lab · MVP v1.5

本地优先的 IELTS Listening / Academic Reading 逐句学习平台。第一版只实现：

`Library → Material → 原声听写 → 英文对照 → Vocabulary → Vocabulary Book`

第一阶段学习科学能力：

- 每次首次听写保存为一条 `LearningAttempt` 学习证据，而不是只记录“访问过”。
- 自动区分漏词、多词、拼写与替换错误，并汇总到“错因账本”。
- 根据无提示回忆准确率自动安排复习：困难句 10 分钟后重试，稳定句逐步扩展到 1、3、7、14、30、60 天。
- “今日复习”只呈现已学习且到期的句子，不把整个资料库一次性塞进队列。
- 听写卡住时可按需开启两级提示：先显示词数，再显示各词首字母与长度线索。
- 提示不会伪装成独立完成：系统同时保留原始准确率和提示校准后的掌握度，并用掌握度安排复习。
- 每轮复习最多 20 句，队列会尽量交错材料与主要错因，降低连续同类练习造成的熟悉感错觉。
- 复习尝试与普通学习分开标记，页面显示当天已完成的去重复复习句数和明确的返回队列动作。
- 完成听写并核对原文后，可进入“关键词迁移回忆”：原文隐藏，仅保留最多 5 个分散关键词，要求重新生成整句。
- 迁移结果以 `keyword_recall` 独立记录，同时更新错因与复习计划，用来区分重复识别和改变线索后的提取能力。
- “学习画像”分别统计无提示听写、关键词迁移和到期复习表现，并显示最近证据趋势与错因占比。
- 下一步建议由实际证据触发：优先处理低复习保持、迁移落差或占比最高的错误，不用笼统总分代替诊断。
- 每次听写提交前先记录确信度，并与真实掌握度计算“判断偏差”；连续高估时，画像会优先提醒校准“感觉会了”的熟悉感错觉。

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
- 第一遍听写：草稿仍是当前句临时 UI 状态；正式提交会保存原始准确率、提示校准掌握度、提交前确信度、逐词差异和错因，提前查看则明确记录为跳过。
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

LearningAttempt
  id, sentenceId, mode, createdAt, actualText,
  accuracy, masteryScore, predictedRecall, hintLevel, practiceContext,
  skipped, parts, errorTags

ReviewSchedule
  sentenceId, level, lapses, intervalDays,
  lastReviewedAt, dueAt

Settings
  playbackRate, repeatCount, pauseSeconds, autoContinue,
  showEnglish, showChinese, highlightVocabulary

DictationState（当前句临时状态）
  sentenceId, draftText, firstAttemptText, submitted, skipped, comparing
```

VocabularyItem 刻意不包含中文词义、Added Date、熟练度、SRS 或 Active/Passive/Mastered 状态。
界面刻意不提供等级、排行榜或笼统总分；学习证据只用于安排复习和给出可操作诊断。
