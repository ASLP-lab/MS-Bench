# MS-Bench 项目交接说明

MS-Bench 是一个面向多说话人自动语音识别（Multi-Speaker ASR）的条件分层评测基准。

## 分支说明

- `main`：当前 GitHub Pages 使用的正式分支，保存旧版 Demo 页面。
- `improve/msbench-demo-v2`：新版 Demo 页面分支，包含新的页面布局、与论文一致的实验结果、条件诊断分析、Condition Explorer、参考音频案例、数据校验脚本和相关文档。

V2 页面使用 **Taste-Skill** 重新设计，对应安装后的 Skill 名称为 `design-taste-frontend`。设计方向是简洁、清晰的学术项目页面，重点改善字体层级、颜色对比、响应式布局和信息密度，并减少不必要的动画。

## 重要数据路径

- 完整且权威的 metadata：[`benchmark/metadata.jsonl`](benchmark/metadata.jsonl)
- 从完整 metadata 派生的前端数据：[`demo-data/sample_metadata.json`](demo-data/sample_metadata.json)
- Benchmark 汇总统计：[`demo-data/summary.json`](demo-data/summary.json)
- Demo 使用的 TextGrid：[`assets/textgrids/`](assets/textgrids/)
- 8 个 Demo 案例的音频、TextGrid 和字幕映射：[`demo-data/representative_examples.json`](demo-data/representative_examples.json)
- Demo 使用的音频片段：[`assets/audio/`](assets/audio/)

`benchmark/metadata.jsonl` 中每一行对应一条录音，主要包含：

- 录音 ID 和来源数据集
- 语言、场景和录音设备
- 录音时长
- 五个条件维度的档位：`P`、`O`、`S`、`T`、`N`
- 说话人数、重叠率、说话人相似度、说话人切换间隔和声学质量等统计信息

## 本地运行 V2 页面

```bash
git switch improve/msbench-demo-v2
python -m http.server 8765
```

浏览器打开：

```text
http://127.0.0.1:8765/demo.html?v=20261007-demo-v2
```

## 校验数据

运行下面的命令，检查 99 条录音、论文结果、条件分档、案例映射和本地资源：

```bash
python scripts/validate_demo_data.py
```

如果修改了 `benchmark/metadata.jsonl`，可以重新生成前端 metadata 和汇总数据：

```bash
python scripts/build_demo_data.py --write
```

更详细的评测协议和数据结构说明位于：

- [`docs/evaluation-protocol.md`](docs/evaluation-protocol.md)
- [`docs/data-schema.md`](docs/data-schema.md)
