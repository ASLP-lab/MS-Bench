const systems = [
  { name: "MOSS-Transcribe-Diarize-Pro", short: "MOSS-Pro", der: 10.96, cpwer: 21.95, tcpwer: 22.81, wer: 22.49 },
  { name: "MOSS-Transcribe-Diarize", short: "MOSS", der: 12.74, cpwer: 24.94, tcpwer: 26.22, wer: 25.02 },
  { name: "DiaScriber", short: "DiaScriber", der: 19.79, cpwer: 30.36, tcpwer: 33.20, wer: 26.42 },
  { name: "Qwen3.8-Omni-Flash", short: "Qwen-Omni", der: 17.97, cpwer: 29.43, tcpwer: 32.59, wer: 27.86 },
  { name: "VibeVoice-ASR", short: "VibeVoice", der: 20.19, cpwer: 43.41, tcpwer: 44.76, wer: 33.11 },
  { name: "pyannote + Qwen3-ASR", short: "pyannote+Qwen", der: 17.35, cpwer: 43.25, tcpwer: 46.54, wer: 34.96 },
  { name: "Doubao-ASR 2.0", short: "Doubao", der: 39.52, cpwer: 55.37, tcpwer: 62.07, wer: 38.20 },
  { name: "SoulX-Transcriber", short: "SoulX", der: 19.42, cpwer: 49.16, tcpwer: 52.60, wer: 39.96 }
];

const conditions = {
  overlap: {
    title: "Concurrent speech breaks two things at once.",
    description: "Within-unit comparison of utterances with no overlap versus at least 50% overlap exposure.",
    takeaway: "Overlap consistently harms content recognition and speaker attribution.",
    measures: [
      { title: "Lexical penalty", note: "percentage points", values: [27.3, 27.3, 24.2, 28.7, 34.3, 38.6, 27.2, 35.2], prefix: "+" },
      { title: "Attribution penalty", note: "percentage points", values: [10.6, 10.9, 3.5, 10.5, 4.2, 19.1, 6.3, 8.7], prefix: "+" }
    ]
  },
  similarity: {
    title: "Similar voices invite speaker exchange.",
    description: "Spearman correlation between pairwise voice similarity and directional speaker confusion, restricted to non-overlapping utterances.",
    takeaway: "All eight systems show a significant positive relationship (p < 0.05).",
    measures: [
      { title: "Similarity ↔ confusion", note: "Spearman ρ", values: [.311, .312, .369, .323, .297, .248, .268, .319], digits: 3 },
      { title: "Observed range", note: "all systems significant", range: ".25 — .37", caption: "Acoustic similarity is an intrinsic source of attribution error." }
    ]
  },
  acoustic: {
    title: "Degraded audio primarily stresses words.",
    description: "Correlation is measured on utterances that are neither overlapped nor adjacent to a speaker switch.",
    takeaway: "Noise behaves as a lexical stressor, not a general speaker-partition failure.",
    measures: [
      { title: "Degradation ↔ lexical error", note: "Spearman ρ", values: [.392, .480, .503, .364, .569, .392, .304, .181], digits: 3 },
      { title: "Degradation ↔ AttrWrong", note: "Spearman ρ", values: [-.060, -.121, .072, -.063, .081, .030, -.057, -.174], digits: 3, signed: true }
    ]
  },
  turn: {
    title: "Fast turns disrupt ‘who,’ not ‘what.’",
    description: "Within-unit comparison around non-overlapping reference speaker switches, using a ±0.5 s tolerance.",
    takeaway: "Wrong-speaker attribution rises around switches in every evaluated system.",
    measures: [
      { title: "Attribution penalty", note: "percentage points", values: [2.49, 2.48, 2.63, 2.74, 3.07, 3.43, 4.17, 1.51], prefix: "+" },
      { title: "Lexical penalty", note: "not consistently significant", values: [1.04, 1.17, 1.25, -.34, .48, 1.11, .87, -8.69], signed: true }
    ]
  }
};

const metricDefinitions = {
  der: "Diarization Error Rate measures the speaker activity timeline with a 0.5 s collar.",
  cpwer: "Concatenated minimum-permutation WER scores content and speaker attribution after the best global speaker mapping.",
  tcpwer: "Time-constrained minimum-permutation WER adds temporal constraints to speaker–transcript matching with a 5 s collar.",
  wer: "Speaker-agnostic WER measures transcript content after disregarding speaker labels."
};

const distributions = {
  language: {
    title: "Language coverage",
    description: "Chinese and English form the core, complemented by five additional languages.",
    total: "7 languages",
    note: "65 Chinese · 25 English · 9 other",
    values: [["Chinese", 65], ["English", 25], ["Portuguese", 3], ["Japanese", 2], ["Thai", 2], ["Italian", 1], ["Spanish", 1]]
  },
  duration: {
    title: "Recording duration",
    description: "Long-form recordings dominate the benchmark; one dinner-party session reaches 159 minutes.",
    total: "32.72 hours",
    note: "Median 16.50 min · range 1.38–159.07 min",
    values: [["< 5 min", 6], ["5–10 min", 30], ["10–20 min", 16], ["20–30 min", 22], ["30–60 min", 24], ["≥ 60 min", 1]]
  },
  capture: {
    title: "Benchmark input setup",
    description: "Input channel configurations reflect media audio, microphone arrays, in-cabin capture, duplex calls, and smart-glasses recordings.",
    total: "5 input setups",
    note: "Physical capture devices vary within the mono-input group",
    values: [["Mono / mixed", 78], ["8-ch array", 15], ["Stereo / duplex", 3], ["4-ch wearable", 2], ["3-ch duplex", 1]]
  },
  scenario: {
    title: "Scenario coverage",
    description: "Source metadata and media provenance organize the benchmark into nine conversational settings.",
    total: "9 scenarios",
    note: "Meetings are the largest group; every scenario remains represented",
    values: [["Meetings", 51], ["Spontaneous conversation", 18], ["Film & television", 12], ["In-vehicle", 7], ["Dinner party", 4], ["Podcasts", 2], ["Educational", 2], ["Smart glasses", 2], ["Live / news media", 1]]
  }
};

const dimensionProfiles = {
  speaker: {
    title: "Speaker count",
    symbol: "P",
    description: "The number of reference speakers tests how systems scale from dyadic dialogue to crowded conversations.",
    formula: "Recording statistic · number of valid reference speaker tiers",
    tiers: [["P0", "≤ 2 speakers", 27], ["P1", "3–4 speakers", 29], ["P2", "5–8 speakers", 33], ["P3", "≥ 9 speakers", 10]]
  },
  overlap: {
    title: "Overlap ratio",
    symbol: "O",
    description: "Overlap ratio is paired with the maximum number of concurrent speakers to preserve interaction severity.",
    formula: "OR = concurrent-speech duration / total reference speech duration",
    tiers: [["O0", "No overlap", 23], ["O1", "< 10% · max 2", 22], ["O2", "10–20% · max 2–3", 10], ["O3", "20–40% · max ≥ 3", 26], ["O4", "≥ 40% · max ≥ 3", 18]]
  },
  similarity: {
    title: "Speaker similarity",
    symbol: "S",
    description: "The maximum pairwise cosine similarity captures the most confusable speaker pair in each recording.",
    formula: "maxᵢⱼ cosine(CAM++ speaker embeddingᵢ, embeddingⱼ)",
    tiers: [["S0", "< 0.32", 9], ["S1", "0.32–0.49", 12], ["S2", "0.49–0.65", 31], ["S3", "≥ 0.65", 47]]
  },
  switch: {
    title: "Speaker turn interval",
    symbol: "T",
    description: "The 25th percentile of non-overlapping turn gaps represents frequent rapid transitions while limiting outlier influence.",
    formula: "q25 gap · smaller values indicate faster speaker switching",
    tiers: [["T0", "> 0.45 s", 10], ["T1", "0.15–0.45 s", 14], ["T2", "0.06–0.15 s", 42], ["T3", "≤ 0.06 s", 33]]
  },
  noise: {
    title: "Acoustic quality",
    symbol: "N",
    description: "DNSMOS and NISQA percentile ranks are combined so that larger difficulty values indicate poorer acoustic quality.",
    formula: "Q = (percentile(DNSMOS) + percentile(NISQA)) / 2 · dN = 1 − Q",
    tiers: [["N0", "Cleanest range", 7], ["N1", "Lower difficulty", 5], ["N2", "Higher difficulty", 25], ["N3", "Most degraded", 62]]
  }
};

const audioSamples = {
  meeting: {
    title: "A six-speaker meeting",
    kicker: "Meeting · Mandarin Chinese",
    badge: "5-minute preview",
    description: "A natural far-field meeting from AISHELL-4. Six participants are captured by an eight-channel circular microphone array, with very rapid speaker transitions.",
    source: "AISHELL-4 · M_R003S01C01",
    file: "assets/audio/meeting-aishell4.mp3",
    meta: [["Preview", "05:00"], ["Original", "38:02"], ["Speakers", "6"], ["Capture", "8-ch array"]],
    profile: [["Speakers", "P2", 75], ["Overlap", "O1", 25], ["Similarity", "S2", 70], ["Turns", "T3", 100], ["Acoustics", "N3", 100]]
  },
  education: {
    title: "A full-duplex tutoring dialogue",
    kicker: "Education · Mandarin Chinese",
    badge: "Full recording",
    description: "A tutoring conversation from SmoothConv, recorded in a duplex setup. This sample provides a comparatively clean and low-overlap condition profile.",
    source: "SmoothConv · 1765590910…active",
    file: "assets/audio/education-smoothconv.mp3",
    meta: [["Preview", "01:31"], ["Original", "01:31"], ["Speakers", "3"], ["Capture", "2-ch duplex"]],
    profile: [["Speakers", "P1", 50], ["Overlap", "O0", 5], ["Similarity", "S0", 15], ["Turns", "T0", 15], ["Acoustics", "N0", 15]]
  },
  podcast: {
    title: "A two-speaker podcast",
    kicker: "Podcast / commentary · Mandarin Chinese",
    badge: "5-minute preview",
    description: "A long-form spoken-media excerpt from the Bench-ZH subset. The voices are highly similar and the rapid-turn statistic falls in the most difficult range.",
    source: "Bench-ZH · part004_e12074b4",
    file: "assets/audio/podcast-benchzh.mp3",
    meta: [["Preview", "05:00"], ["Original", "06:13"], ["Speakers", "2"], ["Capture", "Media audio"]],
    profile: [["Speakers", "P0", 25], ["Overlap", "O1", 25], ["Similarity", "S3", 100], ["Turns", "T3", 100], ["Acoustics", "N0", 15]]
  },
  film: {
    title: "A multi-character film scene",
    kicker: "Film · Mandarin Chinese",
    badge: "Full recording",
    description: "A multi-character film excerpt from BenchFilms. Eight reference speakers and high pairwise voice similarity make attribution difficult even with little overlap.",
    source: "BenchFilms_ZH · 000049_part018",
    file: "assets/audio/film-benchfilms.mp3",
    meta: [["Preview", "04:57"], ["Original", "04:57"], ["Speakers", "8"], ["Capture", "Media audio"]],
    profile: [["Speakers", "P2", 75], ["Overlap", "O1", 25], ["Similarity", "S3", 100], ["Turns", "T2", 75], ["Acoustics", "N3", 100]]
  },
  dinner: {
    title: "A four-speaker dinner party",
    kicker: "Dinner party · English",
    badge: "5-minute preview",
    description: "A distant-microphone excerpt from DiPCo. The sample combines heavy overlap, highly similar voices, rapid turns, and degraded acoustic quality.",
    source: "DiPCo · S06 · U01.CH1",
    file: "assets/audio/dinner-party-dipco.mp3",
    meta: [["Preview", "05:00"], ["Original", "20:05"], ["Speakers", "4"], ["Capture", "Distant mic"]],
    profile: [["Speakers", "P1", 50], ["Overlap", "O3", 75], ["Similarity", "S3", 100], ["Turns", "T2", 75], ["Acoustics", "N3", 100]]
  }
};

function initNavigation() {
  const header = document.querySelector("[data-header]");
  const button = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  if (header) window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 10), { passive: true });
  if (!button || !menu) return;
  button.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { menu.classList.remove("open"); button.setAttribute("aria-expanded", "false"); }));
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { nodes.forEach(node => node.classList.add("visible")); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  }), { threshold: .09 });
  nodes.forEach(node => observer.observe(node));
}

function renderTable() {
  const body = document.querySelector("[data-results-table]");
  if (!body) return;
  body.innerHTML = systems.map((system, index) => `<tr><td><span class="rank">${String(index + 1).padStart(2, "0")}</span>${system.name}</td><td>${index < 2 ? `<strong>${system.der.toFixed(2)}</strong>` : system.der.toFixed(2)}</td><td>${index < 2 ? `<strong>${system.cpwer.toFixed(2)}</strong>` : system.cpwer.toFixed(2)}</td><td>${index < 2 ? `<strong>${system.tcpwer.toFixed(2)}</strong>` : system.tcpwer.toFixed(2)}</td><td>${index < 2 ? `<strong>${system.wer.toFixed(2)}</strong>` : system.wer.toFixed(2)}</td></tr>`).join("");
}

function initMetricExplorer() {
  const chart = document.querySelector("[data-bar-chart]");
  const tabs = document.querySelector("[data-metric-tabs]");
  if (!chart || !tabs) return;
  const definition = document.querySelector("[data-metric-definition]");
  const bestScore = document.querySelector("[data-best-score]");
  const bestModel = document.querySelector("[data-best-model]");
  const medianScore = document.querySelector("[data-median-score]");
  const scoreGap = document.querySelector("[data-score-gap]");

  function render(metric) {
    const sorted = [...systems].sort((a, b) => a[metric] - b[metric]);
    const max = Math.max(...sorted.map(item => item[metric])) * 1.08;
    chart.innerHTML = sorted.map(item => `<div class="bar-row"><span class="bar-name" title="${item.name}">${item.name}</span><div class="bar-track"><div class="bar-fill" style="--width:${(item[metric] / max * 100).toFixed(1)}%"></div></div><span class="bar-value">${item[metric].toFixed(2)}</span></div>`).join("");
    const middle = (sorted[3][metric] + sorted[4][metric]) / 2;
    definition.textContent = metricDefinitions[metric];
    bestScore.textContent = sorted[0][metric].toFixed(2) + "%";
    bestModel.textContent = sorted[0].name;
    medianScore.textContent = middle.toFixed(2) + "%";
    scoreGap.textContent = (sorted.at(-1)[metric] - sorted[0][metric]).toFixed(2);
  }
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-metric]");
    if (!button) return;
    tabs.querySelectorAll("button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
    render(button.dataset.metric);
  });
  render("der");
}

function dotPlot(measure) {
  if (measure.range) return `<div class="condition-measure"><div><h4>${measure.title}</h4><small>${measure.note}</small></div><div class="range-display">${measure.range}</div><p>${measure.caption}</p></div>`;
  const abs = measure.values.map(Math.abs);
  const max = Math.max(...abs) || 1;
  const digits = measure.digits ?? 2;
  const rows = measure.values.map((value, index) => {
    const formatted = `${measure.prefix && value >= 0 ? measure.prefix : (measure.signed && value >= 0 ? "+" : "")}${value.toFixed(digits)}`;
    return `<div class="dot-row"><span title="${systems[index].name}">${systems[index].short}</span><div class="dot-line"><i style="--width:${Math.max(2, Math.abs(value) / max * 100).toFixed(1)}%"></i></div><b class="dot-value">${formatted}</b></div>`;
  }).join("");
  return `<div class="condition-measure"><div><h4>${measure.title}</h4><small>${measure.note}</small></div><div class="dot-plot">${rows}</div></div>`;
}

function initConditionLab() {
  const tabs = document.querySelector("[data-condition-tabs]");
  const panel = document.querySelector("[data-condition-panel]");
  if (!tabs || !panel) return;
  function render(key) {
    const condition = conditions[key];
    panel.innerHTML = `<div class="condition-panel-head"><h3>${condition.title}</h3><p>${condition.description}</p></div><div class="condition-measures">${condition.measures.map(dotPlot).join("")}</div><div class="condition-takeaway"><span>Finding</span><br>${condition.takeaway}</div>`;
  }
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-condition]");
    if (!button) return;
    tabs.querySelectorAll("button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
    render(button.dataset.condition);
  });
  render("overlap");
}

function initTranscriptDemo() {
  const toggle = document.querySelector("[data-view-toggle]");
  const demo = document.querySelector(".transcript-demo");
  const note = document.querySelector("[data-diagnostic-note]");
  if (!toggle || !demo) return;
  toggle.addEventListener("click", event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    const diagnostic = button.dataset.view === "diagnostic";
    toggle.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    demo.classList.toggle("diagnostic", diagnostic);
    note.textContent = diagnostic ? "The striped span marks overlap; gold marks lexical error; plum marks content attributed to the wrong speaker." : "Switch to diagnostic view to reveal where different error families occur.";
  });
}

function initLandscape() {
  const tabs = document.querySelector("[data-landscape-tabs]");
  const panel = document.querySelector("[data-landscape-panel]");
  if (!tabs || !panel) return;
  function render(key) {
    const data = distributions[key];
    const max = Math.max(...data.values.map(item => item[1]));
    const rows = data.values.map(([label, count]) => `<div class="distribution-row"><span class="distribution-label" title="${label}">${label}</span><div class="distribution-track"><div class="distribution-fill" style="--width:${(count / max * 100).toFixed(1)}%"></div></div><strong class="distribution-count">${count}</strong></div>`).join("");
    panel.innerHTML = `<div class="landscape-title"><h3>${data.title}</h3><p>${data.description}</p></div><div class="distribution-grid">${rows}</div><div class="distribution-total"><strong>${data.total}</strong><span>${data.note}</span></div>`;
  }
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-distribution]");
    if (!button) return;
    tabs.querySelectorAll("button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
    render(button.dataset.distribution);
  });
  render("language");
}

function initDimensionExplorer() {
  const tabs = document.querySelector("[data-dimension-tabs]");
  const panel = document.querySelector("[data-dimension-panel]");
  if (!tabs || !panel) return;
  function render(key) {
    const data = dimensionProfiles[key];
    const max = Math.max(...data.tiers.map(tier => tier[2]));
    const tiers = data.tiers.map(([code, label, count]) => `<div class="tier-item"><strong>${code}</strong><span>${label}</span><b>${count}</b><small>recordings</small><div class="tier-bar"><i style="--width:${(count / max * 100).toFixed(1)}%"></i></div></div>`).join("");
    panel.innerHTML = `<div class="dimension-detail-head"><div><h3>${data.title}</h3><p>${data.description}</p></div><div class="dimension-symbol">${data.symbol}</div></div><div class="tier-list">${tiers}</div><div class="dimension-formula">${data.formula}</div>`;
  }
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-dimension]");
    if (!button) return;
    tabs.querySelectorAll("button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
    render(button.dataset.dimension);
  });
  render("speaker");
}

function waveformBars(seed) {
  return Array.from({ length: 44 }, (_, index) => {
    const value = 18 + ((index * 37 + seed * 19 + (index % 5) * seed) % 72);
    return `<i style="--h:${value}%"></i>`;
  }).join("");
}

function initAudioGallery() {
  const tabs = document.querySelector("[data-sample-tabs]");
  const panel = document.querySelector("[data-sample-panel]");
  if (!tabs || !panel) return;
  function render(key) {
    const data = audioSamples[key];
    const seed = Object.keys(audioSamples).indexOf(key) + 3;
    const meta = data.meta.map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join("");
    const profile = data.profile.map(([label, grade, width]) => `<div class="profile-axis"><span>${label}<b>${grade}</b></span><div class="profile-track"><i style="--width:${width}%"></i></div></div>`).join("");
    panel.innerHTML = `<div class="sample-stage-head"><div><div class="sample-kicker">${data.kicker}</div><h3>${data.title}</h3></div><span>${data.badge}</span></div><p class="sample-description">${data.description}</p><div class="audio-player-shell"><div class="audio-wave" aria-hidden="true">${waveformBars(seed)}</div><audio controls preload="metadata" aria-label="Play ${data.title}"><source src="${data.file}" type="audio/mpeg">Your browser does not support HTML audio.</audio></div><div class="sample-meta">${meta}</div><div class="sample-profile">${profile}</div><div class="sample-source"><strong>Source:</strong> ${data.source}</div>`;
  }
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-sample]");
    if (!button) return;
    tabs.querySelectorAll("button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
    render(button.dataset.sample);
  });
  render("meeting");
}

initNavigation();
initReveal();
renderTable();
initMetricExplorer();
initConditionLab();
initTranscriptDemo();
initLandscape();
initDimensionExplorer();
initAudioGallery();
