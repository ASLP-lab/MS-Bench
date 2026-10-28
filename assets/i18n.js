"use strict";

// UI copy only. Source transcripts, speaker IDs, scores, and model names stay intact.
(()=>{
const ZH = {
  "Skip to content": "跳转到正文",
  "MS-Bench home": "MS-Bench 首页",
  "Sections": "章节",
  "Section navigation": "章节导航",
  "Overview": "概览",
  "Composition": "数据概况",
  "Explorer": "录音筛选",
  "Results": "评测结果",
  "Diagnostics": "条件分析",
  "Cases": "音频示例",
  "A Condition-Stratified Multi-Speaker ASR Benchmark": "面向多说话人语音识别的条件分层基准",
  "MS-Bench: A Condition-Stratified Multi-Speaker ASR Benchmark": "MS-Bench：面向多说话人语音识别的条件分层基准",
  "Listen to examples": "听音频示例",
  "Explore conditions": "按条件筛选",
  "Benchmark headline statistics": "数据概况",
  "Total duration": "总时长",
  "Condition dimensions": "录音条件",
  "Speakers": "说话人数",
  "Duration-weighted overlap": "时长加权重叠率",
  "Evaluated systems": "参评系统",
  "Abstract": "摘要",
  "Construction pipeline": "构建流程",
  "View the construction pipeline at full size": "查看完整构建流程图",
  "MS-Bench construction pipeline from data sourcing through characterization, condition space, candidate pool, and subset selection.": "MS-Bench 构建流程：数据来源、条件表征、条件空间、候选池与子集选择。",
  "MS-Bench construction pipeline.": "MS-Bench 构建流程。",
  "Benchmark composition": "数据概况",
  "Condition distributions": "录音条件分布",
  "Note:": "说明：",
  "Each range shows its recording count and percentage of the benchmark. Click a range to filter recordings in the Condition Explorer.": "每一档显示录音数量和占比。点击即可筛选符合条件的录音。",
  "Condition definitions and ranges": "条件说明与分档标准",
  "Scenarios": "场景",
  "Languages": "语言",
  "Recording duration": "录音时长",
  "Count-based distribution over complete recordings.": "按完整录音的时长统计数量。",
  "Condition explorer": "按录音条件筛选",
  "Select one range per condition. Recordings must match all selected ranges. Counts show matches with your current filters; unavailable ranges are disabled. Use Reset to clear the filters.": "每个维度可选一档，结果需同时满足所有已选条件。按钮上的数量会随筛选更新，没有匹配录音的选项会置灰。点击“重置”可恢复全部录音。",
  "Condition filters": "条件筛选",
  "No active filters": "未设置筛选条件",
  "Reset": "重置",
  "Preparing metadata...": "正在加载录音信息…",
  "Median duration": "时长中位数",
  "Settings": "场景类别",
  "Overall performance": "总体表现",
  "Seven systems from the paper. Lower is better for every error metric. DER uses a 0.5-second collar; tcpWER uses a 5-second collar.": "以下为论文中七个系统的评测结果，各项错误率均越低越好。DER 的容差窗为 0.5 秒，tcpWER 为 5 秒。",
  "Accuracy across tasks.": "识别与归属。",
  "Accuracy and robustness.": "准确率之外，还要看输出是否可靠。",
  "MOSS-Transcribe-Diarize-Pro has the lowest error on all four metrics. Similar diarization scores can still hide large transcription differences: Qwen3.8-Omni-Flash and pyannote+Qwen3-ASR have DERs of 17.97% and 17.35%, but cpWERs of 29.43% and 43.25%.": "MOSS-Transcribe-Diarize-Pro 在四项指标上均取得最低错误率。说话人分离的表现相近，并不意味着转写也一样准确。例如，Qwen3.8-Omni-Flash 和 pyannote+Qwen3-ASR 的 DER 分别为 17.97% 和 17.35%，而 cpWER 分别为 29.43% 和 43.25%。",
  "MOSS-Transcribe-Diarize and the cascaded system have no excluded inference units. MOSS-Transcribe-Diarize-Pro has 15 excluded units despite its lower error rates, so accuracy and output robustness should be read together.": "MOSS-Transcribe-Diarize 和级联系统的输出均可纳入评分。MOSS-Transcribe-Diarize-Pro 虽然错误率更低，但仍有 15 个推理单元因输出问题被排除。因此，比较系统时还应结合输出可靠性，而不只看错误率。",
  "Results view": "结果视图",
  "Error metrics": "错误率指标",
  "Output robustness": "输出可靠性",
  "Best and second-best values are marked by column.": "各列标记最优值和次优值。",
  "Best values use a tinted cell; second-best values are underlined.": "浅色底纹标出最优值，下划线标出次优值。",
  "Counts are inference-unit counts. Total unit denominators are unavailable, so no coverage percentage is shown.": "这里统计的是推理单元数。由于缺少完整的单元总数，暂不计算覆盖比例。",
  "Compare model transcripts and timing on the same audio": "对照参考文本，比较不同模型的转写结果",
  "Listen to an example and follow the reference alongside two model outputs.": "播放音频，对照参考文本和两个模型的转写结果。",
  "Listen & compare": "播放并对比",
  "Metric and scoring protocol": "指标与评分方式",
  ": diarization error with a 0.5-second collar.": "：说话人分离错误率，容差窗为 0.5 秒。",
  ": speaker-attributed transcription error under optimal speaker permutation.": "：在最优说话人匹配下计算转写错误，同时考虑内容和说话人归属。",
  ": time-constrained cpWER with a 5-second collar.": "：在 cpWER 基础上加入时间约束，容差窗为 5 秒。",
  ": speaker-agnostic lexical error.": "：只衡量识别内容，不区分说话人。",
  "Metrics use each system's scoreable inference units, so valid subsets may differ. Excluded units cannot be scored reliably. Soft-degradation units remain parseable and are retained.": "各系统仅对能够可靠评分的推理单元计算指标，因此实际参与评分的数据可能不同。无法评分的输出会被排除；存在轻度异常但仍可解析的输出会保留。",
  "Condition-wise analysis": "不同录音条件下的表现",
  "Diagnostic dimension": "分析维度",
  "Key finding": "分析结论",
  "Audio examples": "音频示例",
  "Choose a sample from the list or scroll between samples. Play the audio to follow the reference and compare two models.": "从列表选择示例，或上下滚动切换。播放音频时，参考文本与两个模型的字幕会同步跟随，便于对照。",
  "Condition-stratified evaluation for multi-speaker ASR.": "面向多说话人语音识别的条件分层评测。",
  "GitHub repository": "GitHub 仓库",
  "ASLP Lab, Northwestern Polytechnical University": "西北工业大学 ASLP 实验室",
  "Interactive charts require JavaScript. You can still download the": "交互图表需要启用 JavaScript。你仍可下载",
  "benchmark metadata": "基准元数据",
  "and read the": "并查看",
  "evaluation protocol": "评测规则",
  "Speaker number": "说话人数",
  "Overlap ratio": "重叠率",
  "Speaker similarity": "说话人相似度",
  "Speaker turn interval": "说话人切换间隔",
  "Acoustic quality": "声学质量",
  "How many people are speaking": "录音中有几位说话人",
  "How much speech happens at once": "有多少时间在同时说话",
  "How similar the closest voices are": "最相似的两人声音有多接近",
  "How quickly speakers take turns": "不同说话人之间切换有多快",
  "How degraded the recording sounds": "录音有多清晰",
  "Least degraded": "退化最轻",
  "Less degraded": "退化较轻",
  "More degraded": "退化较重",
  "Most degraded": "退化最重",
  "Speaker number uses predefined ranges; overlap ranges are chosen for interpretability. Speaker similarity, speaker turn interval, and acoustic quality are partitioned by empirical quantiles.": "说话人数采用预设人数段，重叠率按便于理解的区间分档。说话人相似度、切换间隔和声学质量则依据数据的经验分位数划分。",
  "Recordings are primarily in": "录音以",
  "Chinese and English": "中文和英文",
  "Chinese": "中文",
  "English": "英文",
  "German": "德语",
  "French": "法语",
  "Spanish": "西班牙语",
  "Italian": "意大利语",
  "Japanese": "日语",
  "Korean": "韩语",
  "Portuguese": "葡萄牙语",
  "Russian": "俄语",
  "Meetings": "会议",
  "Conversational speech": "自然对话",
  "Media content": "媒体内容",
  "Classroom interactions": "课堂互动",
  "Meetings; conversational speech, including dinner-party conversations, in-vehicle conversations, and other everyday dialogue; media content, including podcasts, films and television, and live streams; and classroom interactions, including teaching and teacher–student dialogue.": "会议；自然对话，包括聚餐交流、车内交流及其他日常对话；媒体内容，包括播客、影视和直播；课堂互动，包括教学及师生对话。",
  ", with additional speech in Portuguese, Japanese, Thai, Italian, and Spanish.": "为主，另包含葡萄牙语、日语、泰语、意大利语和西班牙语。",
  ">= 60 min": "≥60 分钟",
  "Thai": "泰语",
  "Minimum": "最短",
  "Median": "中位数",
  "Maximum": "最长",
  "Total": "合计",
  "System": "系统",
  "Excluded units": "排除单元数",
  "Soft-degradation units": "轻度异常单元数",
  "Input policy": "输入方式",
  "Complete recording": "完整录音",
  "Not evaluated": "未参与评测",
  "fixed domain [-1, 1]": "固定范围 [-1, 1]",
  "Spearman ρ": "Spearman ρ",
  "significant as reported in paper": "论文报告为显著",
  "significant": "显著",
  "Recording condition values": "录音条件测量值",
  "Reference audio": "参考音频",
  "Full recording": "完整录音",
  "Excerpt": "片段",
  "Follow playback": "自动跟随",
  "Resume follow": "恢复自动跟随",
  "Your browser does not support audio playback.": "你的浏览器不支持音频播放。",
  "Maximum speaker similarity": "最相似的说话人对",
  "full-recording source cosine similarity": "整段录音的最大余弦相似度",
  "Reference speaker pair:": "对应的参考说话人：",
  "Speaker-pair labels are unavailable for this recording.": "这条录音没有可用的说话人对标签。",
  "Outlined tracks identify this pair; use the speaker shortcuts to compare their voices.": "描边轨道标出了这两位说话人，点击快捷按钮即可对比声音。",
  "Play audio": "播放音频",
  "Pause audio": "暂停音频",
  "Seek within the complete audio example": "在当前完整示例中跳转",
  "Follow subtitles": "自动跟随字幕",
  "Compare model outputs": "模型输出对比",
  "Model A": "模型 A",
  "Model B": "模型 B",
  "Reference": "参考文本",
  "Reference transcript": "参考文本",
  "Speaker labels are local to each model input.": "各模型的说话人编号独立，不代表跨模型的同一个人。",
  "Output available": "有转写结果",
  "Partial or incomplete output": "转写结果不完整",
  "Output has timestamp or model-identity issues": "时间戳或模型信息存在异常",
  "No output available": "暂无转写结果",
  "Inference failed": "推理失败",
  "Inference failed: audio upload timed out.": "音频上传超时，推理失败。",
  "Inference failed; no transcription was returned.": "推理失败，未返回转写结果。",
  "The model did not return a transcript for this recording.": "该模型未返回这条录音的转写结果。",
  "Excerpt timing unavailable": "暂时无法与音频对齐",
  "Invalid interval": "无效时间区间",
  "This split output cannot be aligned to the excerpt with the available timing metadata.": "现有时间信息不足，暂时无法把这份分段结果与音频对齐。",
  "No result was found for this recording.": "暂未找到这条录音的转写结果。",
  "No transcribed utterances are available in this audio example.": "这段音频暂时没有可显示的转写。",
  "No model outputs are available for this sample.": "此示例没有可用的模型输出。",
  "Model outputs could not be loaded. Reload to try again.": "模型输出加载失败，请刷新重试。",
  "Audio could not play. Try the sample player's play control.": "音频无法播放，请尝试示例播放器中的播放按钮。",
  "Use the audio player's play control, then select the line again.": "请先点击播放器的播放按钮，再选择文本行。",
  "This audio could not load. Try another sample or reload the page.": "音频加载失败，请选择其他示例或刷新页面。",
  "Listen & read": "边听边看",
  "Loop audio": "循环播放",
  "↑ Previous": "↑ 上一个",
  "Next ↓": "下一个 ↓",
  "Previous sample": "上一个示例",
  "Next sample": "下一个示例",
  "Choose an audio sample": "选择音频",
  "Audio samples; scroll up or down to change sample": "音频示例，上下滚动可切换",
  "Speaker similarity and timeline": "声音对比与说话人时间轴",
  "Metadata loading": "正在加载元数据",
  "Reference speaker timeline": "说话人时间轴",
  "Select a block to seek.": "点击语音块，从对应位置开始播放。",
  "Overlapping speech": "同时说话",
  "Similar speaker pair": "声音相似的说话人",
  "Reference overlap regions": "参考语音重叠区间",
  "No recordings with the other selected conditions": "没有同时满足其他已选条件的录音",
  "Filtered condition space": "当前筛选结果",
  "Complete condition space": "全部录音",
  "Weighted by recording duration for the selected recordings": "按已选录音的时长加权",
  "Benchmark value reported in the paper": "论文报告的基准统计值",
  "Data could not be loaded": "数据加载失败",
  "Retry": "重试",
  "Meeting": "会议",
  "Tutoring dialogue": "课堂对话",
  "Podcast": "播客",
  "Film Chinese": "中文影视",
  "Dinner-party conversation": "聚餐交谈",
  "In-vehicle conversation": "车内交谈",
  "Multi-character film dialogue": "多人影视对白",
  "Group meeting": "会议",
  "Live-stream dialogue": "直播对话",
  "Workplace meeting": "会议",
  "Science-fiction dialogue": "科幻影视对白",
  "Natural conversation": "自然交谈",
  "Loading condition distributions...": "正在加载条件分布…",
  "Loading scenario description...": "正在加载场景说明…",
  "Loading language description...": "正在加载语言说明…",
  "Loading duration distribution...": "正在加载时长分布…",
  "Loading system results...": "正在加载系统结果…",
  "Loading diagnostic findings...": "正在加载分析结论…",
  "Loading representative cases...": "正在加载音频示例…",
  "Loading model outputs...": "正在加载模型输出…",
  "Loading metadata...": "正在加载录音信息…",
  "Multi-speaker automatic speech recognition (MSASR) has advanced rapidly with end-to-end speech large language models. However, existing benchmarks cover limited ranges of specific multi-speaker conditions and scenarios, making it difficult to reveal system limitations under diverse conditions and scenarios. We introduce MS-Bench, a condition-stratified benchmark for fine-grained MSASR evaluation. MS-Bench integrates both public and internal benchmarks and characterizes each recording along five dimensions: speaker number, overlap ratio, speaker similarity, speaker turn interval, and acoustic quality. We stratify these dimensions into condition ranges and construct MS-Bench with broad coverage of conditions, scenarios, languages, and recording devices. Evaluating representative commercial, open-source, and cascaded systems, we find that overlap affects both lexical recognition and speaker attribution, while other factors exhibit more task-specific effects on recognition, attribution, or temporal prediction. These results demonstrate that aggregate metrics alone obscure important MSASR failure modes and highlight the value of condition-stratified evaluation. MS-Bench aims to reveal condition-specific limitations of current MSASR systems and guide future improvements.": "多说话人语音识别不仅要识别“说了什么”，还要判断“谁在何时说话”。近年来，端到端语音大语言模型推动了这一任务的发展，但现有基准对不同录音条件和场景的覆盖仍不充分。为此，我们提出 MS-Bench：整合公开与内部数据，围绕说话人数、重叠率、说话人相似度、说话人切换间隔和声学质量五个维度选取录音，兼顾条件、场景、语言和设备的多样性。对商业、开源和级联系统的评测表明，严重重叠会同时影响内容识别和说话人归属，其他因素对识别、归属及时间预测的影响则各有侧重。因此，整体错误率并不足以说明系统的全部表现。MS-Bench 通过分条件分析，帮助研究者找出系统在哪些情况下容易出错，为后续改进提供依据。",
  "Recordings from public and internal benchmarks are characterized along five condition dimensions and grouped into ranges. A candidate pool is built from these condition profiles to limit over-representation and preserve source diversity. The final subset is selected for condition coverage, multi-factor co-occurrence, condition-profile diversity, and source diversity.": "先汇集公开与内部数据，再从五个维度描述每条录音并划分档位。随后建立候选池，避免少数条件或数据来源占比过高。最后综合考虑条件覆盖、多种条件同时出现的情况，以及条件组合和数据来源的多样性，选出基准子集。",
  "Number of reference speakers in each recording, grouped into predefined ranges.": "整条录音中共有多少位参考说话人，按预设人数段分档。",
  "Total time with at least two simultaneously active reference speakers divided by the full recording duration, including silence. The UI displays this ratio as a percentage.": "至少两位参考说话人同时发声的总时长，占完整录音时长的比例。完整时长包含静音，页面以百分比显示。",
  "For each speaker, CAM++ embeddings are extracted from 3–5 non-overlapping segments longer than 2 seconds. Pairwise cosine similarities are computed, and the maximum within each recording represents the most confusable speaker pair. Ranges are based on empirical quantiles.": "每位说话人选取 3–5 段超过 2 秒、没有语音重叠的片段，提取 CAM++ 声纹特征。再计算说话人两两之间的余弦相似度，取最大值作为这条录音的说话人相似度，表示声音最接近的一对。各档位按经验分位数划分。",
  "Intervals between consecutive non-overlapping turns by different speakers. Each recording is represented by the 25th percentile to capture rapid transitions while reducing the influence of long pauses and extreme values. Ranges are based on empirical quantiles; higher tiers indicate shorter intervals.": "不同说话人的相邻、无重叠发言之间相隔多久。每条录音取第 25 百分位数，突出较快的切换，同时减少长停顿和极端值的影响。按经验分位数分档，档位越高，间隔越短。",
  "DNSMOS P.835 and NISQA scores are converted to percentile ranks p_D and p_N, then combined as Q = (p_D + p_N) / 2. Acoustic degradation is d_N = 1 − Q: larger values indicate poorer quality. Ranges are based on empirical quantiles.": "综合 DNSMOS P.835 和 NISQA 评估录音质量。先将两项得分转为百分位 p_D 和 p_N，取平均得到 Q = (p_D + p_N) / 2，再定义声学退化值 d_N = 1 − Q。d_N 越大，表示音质越差。档位按经验分位数划分。",
  "A Chinese team discussion recorded with a far-field microphone array.": "中文团队讨论，使用远场麦克风阵列录制。",
  "A Chinese tutoring interaction with teacher-student dialogue.": "中文课堂辅导，包含教师讲解和师生问答。",
  "Two speakers discuss a film and its characters in a Chinese podcast.": "两位嘉宾用中文讨论电影和角色。",
  "Chinese film dialogue with multiple characters and degraded acoustic quality.": "包含多位角色的中文影视对白，背景声音较复杂。",
  "Four speakers converse in English around a dinner table, with overlapping speech.": "四人围桌用英语交谈，偶有插话和重叠。",
  "A two-speaker Chinese conversation recorded inside a vehicle.": "两位说话人在车内用中文交谈。",
  "Chinese film dialogue with nine reference speakers and frequent turn changes.": "包含九位参考说话人、轮换频繁的中文影视对白。",
  "A four-speaker Chinese meeting with 63.64% recording-level overlap.": "四人中文会议，抢话和插话较多，整段录音的重叠率为 63.64%。",
  "A two-speaker Chinese live-stream interaction with no overlapping speech.": "双人中文直播对话，语音没有重叠。",
  "Seven speakers discuss amusement-park complaints in English, with 61.81% recording-level overlap.": "七人用英语讨论游乐园的投诉处理，发言交叠较多。",
  "English science-fiction film dialogue with fourteen reference speakers.": "英文科幻影视对白，参考标注中共有十四位说话人。",
  "Two speakers discuss films and television in English, with no overlap and high acoustic quality.": "两位说话人用英语聊电影和电视剧，录音清晰，没有语音重叠。",
  "Change in lexical recognition error, in percentage points.": "内容识别错误率相差多少，单位为百分点。",
  "Change in speaker-attribution error, in percentage points.": "说话人归属错误率相差多少，单位为百分点。",
  "Spearman correlation between pairwise speaker similarity and directional speaker confusion.": "说话人对相似度与定向说话人混淆率之间的 Spearman 相关系数。",
  "Correlation of acoustic degradation with lexical recognition error.": "声学退化值与词级识别错误率的相关系数。",
  "Correlation of acoustic degradation with speaker-attribution error.": "声学退化值与说话人归属错误率的相关系数。",
  "Correlation of acoustic degradation with the predicted-to-reference speech duration ratio R_time.": "声学退化值与预测及参考语音时长比 R_time 的相关系数。",
  "Change in speaker-attribution error near speaker switches, in percentage points.": "说话人切换附近的归属错误率差异，单位为百分点。",
  "Correlation of speaker number with speaker-attribution error after controlling for dataset and overlap.": "控制数据集与重叠因素后，说话人数与归属错误率的相关系数。",
  "Heavy overlap (at least 50% of an utterance) is compared with no overlap within the same inference unit. Only units containing both conditions are retained. * indicates p < 0.05 as reported in paper Table 2.": "在同一次推理中，对比严重重叠的话语和完全无重叠的话语。严重重叠指话语至少一半的时长与他人重叠；只保留同时包含两类话语的推理单元。* 表示论文表 2 中 p < 0.05。",
  "Heavy overlap increases lexical recognition error by 27.2–38.6 percentage points and speaker-attribution error by 4.2–19.1 points across all seven systems.": "在全部七个系统中，重叠严重时，内容识别错误率高出 27.2–38.6 个百分点，说话人归属错误率高出 4.2–19.1 个百分点。",
  "Analysis uses completely non-overlapping utterances. Directional confusion is the fraction of aligned tokens from one speaker attributed to the other. * indicates p < 0.05 as reported in paper Table 2.": "这里只分析完全没有重叠的话语，观察声音相似度与说话人混淆的关系。定向混淆率指某位说话人的词元中，被错分给另一位说话人的比例。* 表示论文表 2 中 p < 0.05。",
  "Similar voices increase speaker confusion even without overlap. The association is significant for all seven systems (Spearman ρ = 0.248–0.323).": "即使没有语音重叠，声音相似的说话人仍更容易被混淆。七个系统均呈显著相关，Spearman ρ 为 0.248–0.323。",
  "Analysis uses non-overlapping utterances away from speaker switches. R_time = T_hyp / T_ref measures predicted-to-reference speech duration, rather than timestamp-boundary displacement. * indicates p < 0.05 as reported in paper Table 2.": "选取没有重叠、且远离说话人切换位置的话语。R_time = T_hyp / T_ref 表示预测语音时长与参考时长之比，衡量的是时长缩短，而非时间戳边界偏移。* 表示论文表 2 中 p < 0.05。",
  "Acoustic degradation primarily increases lexical recognition errors. It is also associated with shorter predicted speech timelines in six of seven systems; its association with attribution error is weak.": "音质变差时，最明显的变化是内容识别更容易出错。七个系统中有六个还会预测出更短的语音时长，而说话人归属错误与音质的关系较弱。",
  "Within each inference unit, compare utterances near non-overlapping speaker switches (±0.5 seconds) with those far from all switches. * indicates p < 0.05 as reported in paper Table 2.": "在同一次推理中，对比说话人切换点前后 0.5 秒内的话语与远离切换点的话语，切换本身不包含语音重叠。* 表示论文表 2 中 p < 0.05。",
  "Near speaker switches, attribution error rises by 1.51–4.17 percentage points across all systems. Lexical recognition and segmentation errors show no significant change.": "在说话人切换附近，所有系统的归属错误率均上升，增幅为 1.51–4.17 个百分点。内容识别和语音分段错误没有显著变化。",
  "Center both variables by dataset and remove overlap effects. Exclude P3 (≥9 speakers) and SoulX-Transcriber’s 5-minute inputs. Association does not imply causation. * indicates p < 0.05 as reported in paper Table 2.": "先按数据集分别中心化，再扣除重叠因素的影响。排除 P3（≥9 人）和 SoulX-Transcriber 的五分钟输入。相关关系不代表因果关系。* 表示论文表 2 中 p < 0.05。",
  "More speakers are associated with greater attribution difficulty after controlling for dataset and overlap. The association is positive in all six evaluated systems and significant in four.": "排除数据集差异和重叠因素的影响后，说话人数越多，模型越容易分错说话人。六个参评系统均呈正相关，其中四个达到显著水平。",
  "Choose a sample and compare the reference with two models. Click any transcript line to play from that point. Scroll within a transcript to browse freely; click a line or enable following to resume automatic scrolling.": "选择一段音频，边听边对照参考文本和模型转写。点击任意一句字幕，就能从对应位置开始播放。手动滚动可自由浏览；点击句子或恢复“自动跟随”后，字幕会继续随音频滚动。",
  "Film": "影视剧",
  "A four-speaker English meeting with modest overlap and longer intervals between turns.": "四人英文会议，语音重叠较少，发言之间的间隔相对较长。",
  "A two-speaker Chinese live-streaming interaction with no overlap and low speaker similarity.": "双人中文直播对话，两人的声音差异较大，语音没有重叠。"
};
const textSources = new WeakMap();
const attributeSources = new WeakMap();
const scientificSources = new WeakMap();
const skip = 'script,style,noscript,[data-i18n-ignore],.timeline-label,.timeline-speech';
const transcriptRows = '.caption-line,.comparison-line';
const prefKey = 'ms-bench-language';
const description = document.querySelector('meta[name="description"]');
const englishDescription = description?.content;
let preferred = 'en';
try { preferred = localStorage.getItem(prefKey) || 'en'; } catch {}
const initial = new URL(location.href).searchParams.get('lang');
let language = ['en','zh'].includes(initial) ? initial : preferred === 'zh' ? 'zh' : 'en';

function chinese(source) {
  const key = source.trim();
  if (Object.hasOwn(ZH, key)) return ZH[key];
  const rules = [
    [/^(\d+) recordings · ([\d.]+)%$/, (_,n,p) => `${n} 条录音 · ${p}%`],
    [/^(\d+) speakers$/, (_,n) => `${n} 人`],
    [/^(\d+)-(\d+) speakers$/, (_,a,b) => `${a}–${b} 人`],
    [/^(≥|>=)(\d+) speakers$/, (_,s,n) => `≥${n} 人`],
    [/^Sample (\d+)$/, (_,n) => `示例 ${n}`],
    [/^\/ (\d+) recordings$/, (_,n) => `/ ${n} 条录音`],
    [/^Range: (.+)$/, (_,value) => `范围：${chinese(value)}`],
    [/^Note: Metrics for (.+)$/, (_,title) => `说明：${chinese(title)}分析指标`],
    [/^(.+) distribution$/, (_,name) => `${chinese(name)}分布`],
    [/^Filter by (.+?): (.+)$/, (_,name,value) => `按${chinese(name)}筛选：${chinese(value)}`],
    [/^Remove (.+) filter$/, (_,name) => `移除${chinese(name)}筛选条件`],
    [/^(\d+) recordings with the other selected conditions$/, (_,n) => `${n} 条录音同时满足其他已选条件`],
    [/^(.+?): (.+); (\d+) matching recordings(.*)$/, (_,name,value,n,extra) => `${chinese(name)}：${chinese(value)}；${n} 条匹配录音${extra ? '；与其他已选条件无匹配' : ''}`],
    [/^(Speaker number|Overlap ratio|Speaker similarity|Speaker turn interval|Acoustic quality)(.*)$/, (_,name,tail) => chinese(name) + tail],
    [/^percentage points, domain \[(-?\d+), (\d+)\]$/, (_,a,b) => `百分点，范围 [${a}, ${b}]`],
    [/^([−+\d.]+)( pp)?; significant$/, (_,n,unit) => `${n}${unit ? ' 个百分点' : ''}；显著`],
    [/^([−+\d.]+) pp$/, (_,n) => `${n} 个百分点`],
    [/^([≤≥<>\d.\s–-]+) min$/, (_,n) => `${n} 分钟`],
    [/^([\d.]+) h$/, (_,n) => `${n} 小时`],
    [/^([\d.]+)–([\d.]+) min$/, (_,a,b) => `${a}–${b} 分钟`],
    [/^(.+?) (↑|↓)$/, (_,value,arrow) => `${chinese(value)} ${arrow}`],
    [/^Play from (.+)$/, (_,time) => `从 ${time} 开始播放`],
    [/^Play (.+)$/, (_,title) => `播放${chinese(title)}`],
    [/^Reference speaker timeline for (.+)$/, (_,title) => `${chinese(title)}的参考说话人时间轴`],
    [/^(.+) reference transcript$/, (_,title) => `${chinese(title)}的参考文本`],
    [/^(.+) transcript$/, (_,title) => `${chinese(title)}转写`],
    [/^(.+) · (\d+:\d\d)$/, (_,title,time) => `${chinese(title)} · ${time}`],
    [/^Overlap \((\d+) speakers\) at (.+)$/, (_,n,time) => `重叠（${n} 人）· ${time}`],
    [/^Listen: (.+) at (.+)$/, (_,speaker,time) => `聆听 ${speaker} · ${time}`],
    [/^Overlap: (.+) s; (.+)$/, (_,time,speakers) => `重叠：${time} 秒；${speakers}`],
    [/^(.+), (\d+:\d\d) to (\d+:\d\d)(, highlighted similarity pair)?$/, (_,speaker,a,b,pair) => `${speaker}，${a} 至 ${b}${pair ? '，高亮相似说话人对' : ''}`],
    [/^(.+) \(source cosine: ([\d.]+)\)\.$/, (_,speakers,value) => `${speakers}（源余弦相似度：${value}）。`],
    [/^\(source cosine: (.+)\)\.$/, (_,value) => `（源余弦相似度：${value}）。`],
    [/^Source offsets for split inputs are unavailable\.$/, () => '分段输入缺少可验证的源时间偏移。'],
  ];
  for (const [pattern, render] of rules) if (pattern.test(key)) return key.replace(pattern,render);
  return key;
}
function message(source) { return language === 'zh' ? chinese(source) : source; }
function rememberAndTranslate(node, current, records, write) {
  let record = records.get(node);
  if (!record || current !== record.last) record = { source: current, last: current };
  const source = record.source;
  const value = language === 'zh' ? source.replace(/\S[\s\S]*\S|\S/, core => chinese(core)) : source;
  record.last = value;
  records.set(node,record);
  if (current !== value) write(value);
}
function escape(value) { return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function scientific(value) {
  return escape(message(value)).replace(/\b(E|I|D|R|T|d|r)_(lex|seg|attr|time|hyp|ref|N|ov)\b|ρ_(lex|attr|time|sim)/g, (_,base,sub,rho)=>`${rho ? 'ρ' : base}<sub>${rho || sub}</sub>`);
}
function translate(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.parentElement?.closest(`${skip},${transcriptRows}`)) rememberAndTranslate(node,node.nodeValue,textSources,value=>{node.nodeValue=value;});
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE || node.matches(skip)) return;
  for (const attr of ['aria-label','title','alt','placeholder']) {
    if (!node.hasAttribute(attr)) continue;
    let records = attributeSources.get(node);
    if (!records) { records = new Map(); attributeSources.set(node,records); }
    let record = records.get(attr);const current=node.getAttribute(attr);
    if (!record || current !== record.last) record={source:current,last:current};
    const value=message(record.source);record.last=value;records.set(attr,record);
    if (current!==value) node.setAttribute(attr,value);
  }
  if (node.matches(transcriptRows)) return;
  if (node.hasAttribute('data-i18n-scientific')) {
    const source=node.getAttribute('data-i18n-scientific');const record=scientificSources.get(node);
    if (!record || record.language!==language || record.source!==source) {
      scientificSources.set(node,{language,source});node.innerHTML=scientific(source);
    }
    return;
  }
  for (const child of [...node.childNodes]) translate(child);
}
function updateControl() {
  const button=document.querySelector('[data-language-toggle]');
  if (button) { button.textContent=language==='en'?'中文':'English';button.lang=language==='en'?'zh-CN':'en';button.setAttribute('aria-label',language==='en'?'Switch to Chinese':'切换为英文'); }
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  if (description) description.content=language==='zh'?'MS-Bench 是用于细粒度多说话人语音识别评测的条件分层基准。':englishDescription;
}
function setLanguage(next,updateURL=true) {
  language=next==='zh'?'zh':'en';
  try { localStorage.setItem(prefKey,language); } catch {}
  if (updateURL) { const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(history.state,'',url); }
  updateControl();translate(document.documentElement);
  window.dispatchEvent(new CustomEvent('msbench:languagechange',{detail:{language}}));
}
const pending=new Set();let scheduled=false;
const observer=new MutationObserver(records=>{
  for (const record of records) {
    if (record.type==='childList') for (const added of record.addedNodes) pending.add(added);
    else pending.add(record.target);
  }
  if (!scheduled && pending.size) { scheduled=true;queueMicrotask(()=>{scheduled=false;const nodes=[...pending];pending.clear();for(const node of nodes)if(node.isConnected)translate(node);}); }
});
setLanguage(language,false);
observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','placeholder']});
document.querySelector('[data-language-toggle]')?.addEventListener('click',()=>setLanguage(language==='en'?'zh':'en'));
window.addEventListener('popstate',()=>{const lang=new URL(location.href).searchParams.get('lang');if(['en','zh'].includes(lang)&&lang!==language)setLanguage(lang,false);});
window.MSBenchI18n={message,setLanguage,refresh:()=>translate(document.documentElement),get language(){return language;}};

})();
