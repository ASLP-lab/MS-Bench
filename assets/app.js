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

initNavigation();
initReveal();
renderTable();
initMetricExplorer();
initConditionLab();
initTranscriptDemo();
