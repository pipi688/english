# 海外发展英语工作台

面向英语四级刚过线、长期未使用英语、每天可学习 2–3 小时的学习者。第一阶段用 180 天达到 IELTS Overall 7.0，长期则服务于海外留学、英文求职、海外工作生活与长期发展。

推荐第一阶段单项目标：Listening 7.5、Reading 7.5、Writing 6.5、Speaking 6.5。

## 每日课程菜单

左侧菜单按真实学习顺序排列。进入每门课程时，会先看到个人进度、今日状态和学习目标；点击“开始进入学习”后，再进入当天练习：

1. 今日概览
2. 词汇与语法（可展开单词释义、例句与浏览器朗读）
3. 听力精听（盲听、文本、题目与答案反馈）
4. 阅读精读（文章、判断题与原文证据）
5. 写作训练（题目、段落结构、草稿自动保存）
6. 口语跟练（Part 1/2 题目与准备计时）
7. 应用英语（海外生活、留学与职场场景按天轮换）
8. 当日复盘

“完成并进入下一项”会记录课程完成状态并自动打开下一课。URL 中的 `#course-*` 也可以直接定位课程。

## 长期能力路线

系统采用“IELTS 主线 + 真实应用不断线”的任务结构。默认训练比例为 IELTS 70%、海外生活 10%、海外学习 10%、海外职场 10%；随着考试临近，IELTS 比例自动提高到 82% 或 90%。

应用英语覆盖租房、银行、医疗、交通、日常社交、Lecture、Academic Paper、Seminar、Presentation、Essay、Email Professor、Group Project、CV、Cover Letter、LinkedIn、Behavioral Interview、Meeting、Email 和职场沟通等场景。

## 使用

直接双击 `index.html`，或在目录中运行：

```bash
python3 -m http.server 8080
```

然后打开 <http://localhost:8080>。学习数据通过 `localStorage` 保存在当前浏览器。

## 半年节奏

1. 第 1–28 天：基础重建，目标 5.0–5.5
2. 第 29–84 天：单项突破，目标 6.0
3. 第 85–140 天：能力提分，目标 6.5
4. 第 141–180 天：套题冲刺，目标 7.0

建议第 1 天完成一次不计成绩压力的基线诊断，此后每 4 周复盘、每 8 周完成一次全真模考。

## 数据与个性化

- 在“备考设置”填写计划开始日期、考试日期和当前最弱项。
- 每周填写一次复盘；输入内容会自动保存。
- 使用“导出学习数据”定期备份。恢复时选择此前导出的 JSON 文件即可。
- 升级前创建的任务与模考数据会自动兼容，不需要重新录入。

## 分层词汇体系

- 学术精学层：1,000 个 IELTS / TOEFL 高频学术词，覆盖 78 个学术主题，包含定义、同义词和语境例句。
- CEFR 识别层：合并A1–B2基础词表与C1/C2补充词表，去重后共8,827个独立词条。
- 每天深度学习20个学术词，50天完成第一轮；每天快速识别50个CEFR词，约177天覆盖完整识别词库。
- 支持词库切换、搜索、主题筛选、难度/CEFR筛选、英文朗读和“已掌握”状态。
- 学术精学词包含词性、难度、主题、同义词、英文定义和语境例句；CEFR识别词包含等级与词性。
- 数据来自 [WordLevel学术词库](https://github.com/gungorkaya-eng/toefl-essential-vocabulary-dataset)、[Words CEFR Dataset](https://github.com/Maximax67/Words-CEFR-Dataset)与[Octanove C1/C2 Profile](https://github.com/openlanguageprofiles/olp-en-cefrj/blob/master/octanove-vocabulary-profile-c1c2-1.0.csv)。详情与许可证见 [ATTRIBUTION.md](ATTRIBUTION.md)。

## 发布到 GitHub Pages

项目已经配置 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 会自动上传整个静态站点并部署到 Pages。

首次发布需要在仓库网页执行一次：

1. 打开 **Settings → Pages**。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 打开 **Actions**，等待 `Deploy IELTS Study Hub to GitHub Pages` 工作流完成。
4. 访问 `https://pipi688.github.io/english/`。

所有应用资源都使用相对路径，因此支持 GitHub Pages 的 `/english/` 项目子路径。
