# IELTS 7 半年学习工作台

面向英语四级刚过线、长期未使用英语、每天可学习 2–3 小时的学习者。工作台包含 180 天四阶段路线、每日动态任务、专注计时、连续学习天数、模考成绩、每周复盘和数据备份。

## 每日课程菜单

左侧菜单按真实学习顺序排列。进入每门课程时，会先看到个人进度、今日状态和学习目标；点击“开始进入学习”后，再进入当天练习：

1. 今日概览
2. 词汇与语法（可展开单词释义、例句与浏览器朗读）
3. 听力精听（盲听、文本、题目与答案反馈）
4. 阅读精读（文章、判断题与原文证据）
5. 写作训练（题目、段落结构、草稿自动保存）
6. 口语跟练（Part 1/2 题目与准备计时）
7. 当日复盘

“完成并进入下一项”会记录课程完成状态并自动打开下一课。URL 中的 `#course-*` 也可以直接定位课程。

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

## 第一阶段核心词库

- 内置 1,000 个 IELTS / TOEFL 高频学术词，覆盖 78 个学术主题。这是第一阶段学术核心词，不代表 IELTS 的全部词汇。
- 每天按学习天数轮换 20 个词，50 天完成第一轮。
- 支持全库搜索、主题筛选、难度筛选、英文朗读和“已掌握”状态。
- 每条词汇包含词性、难度、主题、同义词、英文定义和语境例句。
- 数据来自 [WordLevel TOEFL & IELTS Academic Vocabulary Dataset](https://github.com/gungorkaya-eng/toefl-essential-vocabulary-dataset)，采用 MIT License。详情见 [ATTRIBUTION.md](ATTRIBUTION.md)。

## 发布到 GitHub Pages

项目已经配置 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 会自动上传整个静态站点并部署到 Pages。

首次发布需要在仓库网页执行一次：

1. 打开 **Settings → Pages**。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 打开 **Actions**，等待 `Deploy IELTS Study Hub to GitHub Pages` 工作流完成。
4. 访问 `https://pipi688.github.io/english/`。

所有应用资源都使用相对路径，因此支持 GitHub Pages 的 `/english/` 项目子路径。
