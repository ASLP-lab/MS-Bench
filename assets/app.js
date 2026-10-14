"use strict";

document.documentElement.classList.add("js");

const DATA_ROOT = "demo-data";
const DATA_VERSION = "20261014-audio-follow";
const AXES = ["P", "O", "S", "T", "N"];
const AXIS_META = {
  P: { name: "Speaker number", icon: "users", hint: "How many people are speaking", definition: "Number of reference speakers in each recording, grouped into predefined ranges." },
  O: { name: "Overlap ratio", icon: "layers-intersect", hint: "How much speech happens at once", definition: "Total time with at least two simultaneously active reference speakers divided by the full recording duration, including silence. The UI displays this ratio as a percentage." },
  S: { name: "Speaker similarity", icon: "voice-similarity", hint: "How similar the closest voices are", definition: "For each speaker, CAM++ embeddings are extracted from 3–5 non-overlapping segments longer than 2 seconds. Pairwise cosine similarities are computed, and the maximum within each recording represents the most confusable speaker pair. Ranges are based on empirical quantiles." },
  T: { name: "Speaker turn interval", icon: "arrows-exchange", hint: "How quickly speakers take turns", definition: "Intervals between consecutive non-overlapping turns by different speakers. Each recording is represented by the 25th percentile to capture rapid transitions while reducing the influence of long pauses and extreme values. Ranges are based on empirical quantiles; higher tiers indicate shorter intervals." },
  N: { name: "Acoustic quality", icon: "volume", hint: "How degraded the recording sounds", definition: "DNSMOS P.835 and NISQA scores are converted to percentile ranks p_D and p_N, then combined as Q = (p_D + p_N) / 2. Acoustic degradation is d_N = 1 − Q: larger values indicate poorer quality. Ranges are based on empirical quantiles." }
};
const CONDITION_RANGES = {
  P0: "2 speakers", P1: "3-4 speakers", P2: "5-8 speakers", P3: ">=9 speakers",
  O0: "0", O1: "(0, 0.10)", O2: "[0.10, 0.20)", O3: "[0.20, 0.40)", O4: "[0.40, 1.00]",
  S0: "[0, 0.32)", S1: "[0.32, 0.49)", S2: "[0.49, 0.65)", S3: "[0.65, 1]",
  T0: ">=0.45 s", T1: "[0.15, 0.45) s", T2: "[0.06, 0.15) s", T3: "[0, 0.06) s",
  N0: "[0, 0.27)", N1: "[0.27, 0.51)", N2: "[0.51, 0.74)", N3: "[0.74, 1]"
};
const CONDITION_LABELS = {
  P0: "2 speakers", P1: "3-4 speakers", P2: "5-8 speakers", P3: "≥9 speakers",
  O0: "0%", O1: "(0%, 10%)", O2: "[10%, 20%)", O3: "[20%, 40%)", O4: "[40%, 100%]",
  S0: "[0.00, 0.32)", S1: "[0.32, 0.49)", S2: "[0.49, 0.65)", S3: "[0.65, 1.00]",
  T0: "≥450 ms", T1: "[150, 450) ms", T2: "[60, 150) ms", T3: "[0, 60) ms",
  N0: "[0.00, 0.27)", N1: "[0.27, 0.51)", N2: "[0.51, 0.74)", N3: "[0.74, 1.00]"
};
const ACOUSTIC_LABELS = {
  N0: "Least degraded", N1: "Less degraded", N2: "More degraded", N3: "Most degraded"
};
// Presentation groups only; canonical scenario labels and condition IDs remain stable.
const SCENARIO_GROUPS = [
  { name: "Meetings", sources: ["Meeting"], description: "Meeting discussions." },
  { name: "Conversational speech", sources: ["Conversation", "Dinner-party conversations", "In-vehicle interactions", "Smart-glasses interactions"], description: "Dinner-party conversations, in-vehicle exchanges, and other everyday dialogue." },
  { name: "Media content", sources: ["Films and television content", "Podcasts", "Live-streaming content"], description: "Podcasts, films and television, and live-streaming content." },
  { name: "Classroom interactions", sources: ["Educational content"], description: "Classroom teaching, tutoring, and teacher-student dialogue." }
];
const SPEAKER_COLORS = ["#245f93", "#8a5b65", "#507c70", "#8a744a", "#655c86", "#5e7484", "#8b6750", "#526b92", "#6f7960", "#80627e", "#4e7c83", "#7c6c58", "#596d5e", "#77647f"];
const state = {
  summary: null,
  leaderboard: null,
  diagnostics: null,
  examples: null,
  predictions: null,
  comparison: { left: "moss_pro", right: "moss", follow: true },
  metadata: null,
  metadataPromise: null,
  filters: { P: null, O: null, S: null, T: null, N: null },
  boardView: "overall",
  sort: { key: "cpwer", direction: "asc" },
  diagnostic: "overlap",
  diagnosticAnimation: null,
  matched: [],
  activeAudio: null,
  currentSampleSlug: null,
  loopSample: false,
  sampleObserver: null,
  sampleNavObserver: null,
  restoreFromHistory: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function formatDuration(seconds, precise = false) {
  const minutes = seconds / 60;
  if (minutes >= 60) return `${(minutes / 60).toFixed(precise ? 2 : 1)} h`;
  return `${minutes.toFixed(precise || minutes < 10 ? 1 : 0)} min`;
}

function formatTime(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function versioned(path) {
  return `${path}${path.includes("?") ? "&" : "?"}v=${encodeURIComponent(DATA_VERSION)}`;
}

async function fetchJSON(path) {
  const response = await fetch(versioned(path));
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (data == null || typeof data !== "object") throw new Error(`${path}: invalid JSON schema`);
  return data;
}

function moduleError(target, message, resource) {
  console.error(message);
  const localHint = location.protocol === "file:" ? " Serve this directory over HTTP instead of opening file://." : "";
  target.innerHTML = `<div class="module-error">This section could not load.${escapeHTML(localHint)}<button type="button" data-retry-resource="${escapeHTML(resource)}">Retry</button></div>`;
}

function axisIcon(axis) {
  return `<span class="condition-icon icon-${AXIS_META[axis].icon}" aria-hidden="true"></span>`;
}

function conditionLabel(tier) {
  return CONDITION_LABELS[tier] || tier;
}

function scenarioGroup(scenario) {
  return SCENARIO_GROUPS.find(group => group.sources.includes(scenario))?.name || scenario;
}

function setupConditionLabels() {
  $$("[data-filter-axis]").forEach(group => {
    const axis = group.dataset.filterAxis;
    group.classList.add(`axis-${axis.toLowerCase()}`);
    $("legend", group).innerHTML = `${axisIcon(axis)}${escapeHTML(AXIS_META[axis].name)}`;
    $$("[data-value]", group).forEach(button => { button.textContent = conditionLabel(button.dataset.value); });
  });
  const diagnosticAxes = { overlap: "O", similarity: "S", acoustic: "N", turn: "T", speaker: "P" };
  $$("[data-diagnostic]").forEach(tab => {
    const axis = diagnosticAxes[tab.dataset.diagnostic];
    tab.classList.add(`axis-${axis.toLowerCase()}`);
    tab.innerHTML = `${axisIcon(axis)}${escapeHTML(AXIS_META[axis].name)}`;
  });
}

function renderOverview(summary) {
  const total = summary.recordings;
  const language = $("[data-overview-language]");
  language.classList.remove("loading-block");
  language.innerHTML = `<p>Recordings are primarily in <strong>${escapeHTML(summary.primary_languages.join(" and "))}</strong>, with additional speech in ${escapeHTML(summary.additional_languages.slice(0, -1).join(", "))}, and ${escapeHTML(summary.additional_languages.at(-1))}.</p>`;

  const scenario = $("[data-overview-scenarios]");
  scenario.classList.remove("loading-block");
  scenario.innerHTML = `<p>Meetings; conversational speech, including dinner-party conversations, in-vehicle conversations, and other everyday dialogue; media content, including podcasts, films and television, and live streams; and classroom interactions, including teaching and teacher–student dialogue.</p>`;

  const duration = $("[data-overview-duration]");
  const durationEntries = Object.entries(summary.duration_distribution);
  const maxDurationCount = Math.max(...durationEntries.map(([, count]) => count));
  duration.classList.remove("loading-block");
  duration.innerHTML = `
    <div class="duration-stats">
      <div><strong>${summary.minimum_duration_minutes.toFixed(2)} min</strong><span>Minimum</span></div>
      <div><strong>${summary.median_duration_minutes.toFixed(1)} min</strong><span>Median</span></div>
      <div><strong>${summary.maximum_duration_minutes.toFixed(2)} min</strong><span>Maximum</span></div>
      <div><strong>${summary.total_hours.toFixed(2)} h</strong><span>Total</span></div>
    </div>
    <div class="duration-bars">${durationEntries.map(([label, count]) => `<div><span>${escapeHTML(label)}</span><i><b style="width:${count / maxDurationCount * 100}%"></b></i><strong>${count}</strong></div>`).join("")}</div>`;

  const coverage = $("[data-condition-coverage]");
  coverage.classList.remove("loading-block");
  coverage.innerHTML = AXES.map(axis => {
    const tiers = Object.entries(summary.condition_distribution[axis]);
    return `<section class="coverage-row axis-${axis.toLowerCase()}">
      <header class="axis-title">${axisIcon(axis)}<div><strong>${escapeHTML(AXIS_META[axis].name)}</strong><small>${escapeHTML(AXIS_META[axis].hint)}</small></div></header>
      <div class="tier-strip" style="--columns:${tiers.length}" aria-label="${escapeHTML(AXIS_META[axis].name)} distribution">
        ${tiers.map(([tier, count]) => {
          const percentage = count / total * 100;
          return `<button type="button" class="tier-button" data-coverage-axis="${axis}" data-coverage-tier="${tier}" aria-pressed="false" title="Filter by ${escapeHTML(AXIS_META[axis].name)}: ${escapeHTML(CONDITION_RANGES[tier])}"><b>${escapeHTML(conditionLabel(tier))}</b>${axis === "N" ? `<small>${escapeHTML(ACOUSTIC_LABELS[tier])}</small>` : ""}<em>${count} recordings · ${percentage.toFixed(1)}%</em></button>`;
        }).join("")}
      </div>
    </section>`;
  }).join("");
  $("[data-condition-definitions]").innerHTML = `<div class="definition-convention">Speaker number uses predefined ranges; overlap ranges are chosen for interpretability. Speaker similarity, speaker turn interval, and acoustic quality are partitioned by empirical quantiles.</div><dl class="condition-definitions">${AXES.map(axis => `<div><dt>${escapeHTML(AXIS_META[axis].name)} (${axis})</dt><dd><p>${escapeHTML(AXIS_META[axis].definition)}</p><ul class="source-tiers">${Object.keys(summary.condition_distribution[axis]).map(tier => `<li><code>${tier}</code><span>${escapeHTML(CONDITION_RANGES[tier])}</span></li>`).join("")}</ul></dd></div>`).join("")}</dl>`;
  syncCoverageSelection();
}

function rankedValues(rows, metric) {
  return [...new Set(rows.map(row => row[metric]).filter(value => Number.isFinite(value)).sort((a, b) => a - b))];
}

function tableCellClass(value, ranking) {
  if (value === ranking[0]) return "best";
  if (value === ranking[1]) return "second";
  return "";
}

function sortedLeaderboard(rows) {
  const { key, direction } = state.sort;
  return [...rows].sort((a, b) => {
    if (key === "system") return direction === "asc" ? a.system.localeCompare(b.system) : b.system.localeCompare(a.system);
    return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
  });
}

function sortHeader(label, key, descendingBetter = false) {
  const active = state.sort.key === key;
  const arrow = active ? (state.sort.direction === "asc" ? " ↑" : " ↓") : "";
  return `<th aria-sort="${active ? (state.sort.direction === "asc" ? "ascending" : "descending") : "none"}"><button type="button" class="sort-button" data-sort="${key}" data-default-direction="${descendingBetter ? "desc" : "asc"}">${escapeHTML(label)}${arrow}</button></th>`;
}

function leaderboardTable(rows) {
  const sorted = sortedLeaderboard(rows);
  if (state.boardView === "robustness") {
    const excludedRank = rankedValues(rows, "excluded");
    const softRank = rankedValues(rows, "soft_degradation");
    const policies = { moss_pro: "≤90 min", moss: "≤90 min", vibevoice: "≤60 min", soulx: "≤5 min" };
    return `<table class="results-table"><thead><tr>${sortHeader("System", "system")}${sortHeader("Excluded units", "excluded")}${sortHeader("Soft-degradation units", "soft_degradation")}<th>Input policy</th></tr></thead><tbody>${sorted.map(row => `<tr><th>${escapeHTML(row.system)}</th><td class="${tableCellClass(row.excluded, excludedRank)}">${row.excluded}</td><td class="${tableCellClass(row.soft_degradation, softRank)}">${row.soft_degradation}</td><td>${escapeHTML(policies[row.system_id] || "Complete recording")}</td></tr>`).join("")}</tbody></table>`;
  }
  const metrics = ["der", "cpwer", "tcpwer", "wer"];
  const ranking = Object.fromEntries(metrics.map(metric => [metric, rankedValues(rows, metric)]));
  return `<table class="results-table"><thead><tr>${sortHeader("System", "system")}${sortHeader("DER (%)", "der")}${sortHeader("cpWER (%)", "cpwer")}${sortHeader("tcpWER (%)", "tcpwer")}${sortHeader("WER (%)", "wer")}</tr></thead><tbody>${sorted.map(row => `<tr><th>${escapeHTML(row.system)}</th>${metrics.map(metric => `<td class="${tableCellClass(row[metric], ranking[metric])}">${row[metric].toFixed(2)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function renderLeaderboard() {
  if (!state.leaderboard) return;
  $("[data-leaderboard]").innerHTML = leaderboardTable(state.leaderboard);
  $("[data-leaderboard-note]").textContent = state.boardView === "overall"
    ? "Best values use a tinted cell; second-best values are underlined."
    : "Counts are inference-unit counts. Total unit denominators are unavailable, so no coverage percentage is shown.";
}

function scientificNotation(value) {
  return escapeHTML(value).replace(/\b(E|I|D|R|T|d|r)_(lex|seg|attr|time|hyp|ref|N|ov)\b|ρ_(lex|attr|time|sim)/g, (_, base, subscript, rhoSubscript) => `${rhoSubscript ? "ρ" : base}<sub>${rhoSubscript || subscript}</sub>`);
}

function diagnosticValue(value, unit) {
  if (value == null) return "Not evaluated";
  if (unit === "pp") return `${value > 0 ? "+" : ""}${value.toFixed(Math.abs(value) < 10 ? 2 : 1)} pp`;
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}

function animateDiagnosticValues(panel) {
  const values = $$("[data-diagnostic-value]", panel);
  const bars = $$("[data-diagnostic-bar]", panel);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const started = performance.now();
  function draw(now) {
    const progress = reducedMotion ? 1 : Math.min(1, (now - started) / 650);
    const eased = 1 - (1 - progress) ** 3;
    values.forEach(element => {
      const target = Number(element.dataset.target);
      const value = target * eased;
      const decimals = element.dataset.unit === "rho" ? 3 : Math.abs(target) < 10 ? 2 : 1;
      const sign = target < 0 ? "−" : "+";
      element.textContent = progress === 1 ? diagnosticValue(target, element.dataset.unit) : `${sign}${Math.abs(value).toFixed(decimals)}${element.dataset.unit === "pp" ? " pp" : ""}`;
    });
    bars.forEach(element => { element.style.width = `${Number(element.dataset.finalWidth) * eased}%`; });
    state.diagnosticAnimation = progress < 1 ? requestAnimationFrame(draw) : null;
  }
  draw(started);
}

function renderDiagnostics() {
  if (!state.diagnostics) return;
  if (state.diagnosticAnimation != null) cancelAnimationFrame(state.diagnosticAnimation);
  const data = state.diagnostics[state.diagnostic];
  const systems = state.diagnostics.systems;
  const selectedTab = $(`[data-diagnostic="${state.diagnostic}"]`);
  const tabStrip = selectedTab.parentElement;
  const tabBounds = selectedTab.getBoundingClientRect();
  const stripBounds = tabStrip.getBoundingClientRect();
  if (tabBounds.left < stripBounds.left) tabStrip.scrollLeft -= stripBounds.left - tabBounds.left + 14;
  else if (tabBounds.right > stripBounds.right) tabStrip.scrollLeft += tabBounds.right - stripBounds.right + 14;
  $("[data-diagnostic-panel]").setAttribute("aria-labelledby", selectedTab.id);
  $("[data-diagnostic-panel]").innerHTML = `
    <aside class="diagnostic-metrics" aria-labelledby="diagnostic-metrics-title">
      <h3 id="diagnostic-metrics-title">Note: Metrics for ${escapeHTML(data.title)}</h3>
      <dl class="diagnostic-metric-key">${data.metrics.map(metric => `<div><dt>${scientificNotation(metric.symbol)}</dt><dd>${scientificNotation(metric.definition)}</dd></div>`).join("")}</dl>
      <p data-diagnostic-note>${scientificNotation(data.note)} * indicates p &lt; 0.05 as reported in paper Table 2.</p>
    </aside>
    <div class="diagnostic-copy"><h3>Key finding</h3><p>${escapeHTML(data.description)}</p></div>
    <div class="diagnostic-chart">${data.series.map(series => {
      const domain = series.unit === "rho" ? 1 : Math.ceil(Math.max(...series.values.filter(value => value != null).map(Math.abs)) / 5) * 5;
      return `<section class="series-block"><div class="series-title"><span>${scientificNotation(series.label.replace(/^Delta /, "Δ").replace(/rho/g, "ρ"))}</span><small>${series.unit === "rho" ? "fixed domain [-1, 1]" : `percentage points, domain [-${domain}, ${domain}]`}</small></div><div class="series-axis"><span>−${domain}</span><span>+${domain}</span></div><div class="series-rows">${systems.map((system, index) => {
        const value = series.values[index];
        const width = value == null ? 0 : Math.min(50, Math.abs(value) / domain * 50);
        const significance = series.significant[index] === true ? `<span class="significance" aria-label="significant as reported in paper">*</span>` : "";
        return `<div class="series-row"><span>${escapeHTML(system.name)}</span><div class="diverging-track" aria-hidden="true">${value == null ? "" : `<i class="${value < 0 ? "negative" : "positive"}" data-diagnostic-bar data-final-width="${width}" style="width:0%"></i>`}</div><strong aria-label="${escapeHTML(diagnosticValue(value, series.unit))}${series.significant[index] === true ? "; significant" : ""}">${value == null ? "Not evaluated" : `<span aria-hidden="true" data-diagnostic-value data-target="${value}" data-unit="${series.unit}">${escapeHTML(diagnosticValue(0, series.unit))}</span>`}${significance}</strong></div>`;
      }).join("")}</div></section>`;
    }).join("")}</div>`;
  animateDiagnosticValues($("[data-diagnostic-panel]"));
}

function speakerColor(speaker, speakers) {
  return SPEAKER_COLORS[Math.max(0, speakers.indexOf(speaker)) % SPEAKER_COLORS.length];
}

function conditionDetails(conditions) {
  return `<dl class="condition-details" tabindex="0" aria-label="Recording condition values">${AXES.map(axis => `<div class="axis-${axis.toLowerCase()}"><dt>${axisIcon(axis)}${escapeHTML(AXIS_META[axis].name)}</dt><dd>${escapeHTML(conditionLabel(conditions[axis]))}<small>${axis === "N" ? escapeHTML(ACOUSTIC_LABELS[conditions[axis]]) : `Range: ${escapeHTML(CONDITION_RANGES[conditions[axis]])}`}</small></dd></div>`).join("")}</dl>`;
}

function timelineSVG(example, speakers) {
  const width = 900;
  const labelWidth = 120;
  const plotWidth = width - labelWidth - 12;
  const rowHeight = 30;
  const height = speakers.length * rowHeight + 28;
  const duration = example.clip_duration_seconds;
  const ticks = [0, .25, .5, .75, 1];
  const pair = example.speaker_similarity?.distinct_reference_pair?.speakers || [];
  const overlap = example.overlap_regions || [];
  return `<div class="timeline-svg-wrap"><svg class="timeline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Reference speaker timeline for ${escapeHTML(example.title)}">
    <g class="timeline-overlap-bands" aria-label="Reference overlap regions">${overlap.map(region => `<rect class="timeline-overlap-region" x="${labelWidth + region.start / duration * plotWidth}" y="0" width="${Math.max(.5, (region.end - region.start) / duration * plotWidth)}" height="${height - 20}"><title>Overlap: ${region.start.toFixed(2)}-${region.end.toFixed(2)} s; ${escapeHTML(region.speakers.join(', '))}</title></rect>`).join("")}</g>
    ${ticks.map(fraction => `<line x1="${labelWidth + fraction * plotWidth}" y1="0" x2="${labelWidth + fraction * plotWidth}" y2="${height - 20}" class="timeline-grid"></line><text x="${labelWidth + fraction * plotWidth}" y="${height - 4}" text-anchor="${fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}" class="timeline-tick">${formatTime(fraction * duration)}</text>`).join("")}
    ${speakers.map((speaker, row) => `<text x="${labelWidth - 10}" y="${row * rowHeight + 19}" text-anchor="end" class="timeline-label${pair.includes(speaker) ? ' timeline-similarity-label' : ''}">${escapeHTML(speaker)}</text>${example.timeline.filter(segment => segment.speaker === speaker).map(segment => {
      const x = labelWidth + segment.start / duration * plotWidth;
      const segmentWidth = Math.max(2, (segment.end - segment.start) / duration * plotWidth);
      return `<rect class="timeline-speech${pair.includes(speaker) ? ' timeline-similar-speaker' : ''}" x="${x}" y="${row * rowHeight + 6}" width="${segmentWidth}" height="18" rx="2" fill="${speakerColor(speaker, speakers)}" tabindex="0" role="button" data-timeline-start="${segment.start}" aria-label="${escapeHTML(speaker)}, ${formatTime(segment.start)} to ${formatTime(segment.end)}${pair.includes(speaker) ? ', highlighted similarity pair' : ''}"></rect>`;
    }).join("")}`).join("")}
    <line x1="${labelWidth}" y1="0" x2="${labelWidth}" y2="${height - 20}" class="timeline-playhead" data-timeline-cursor data-origin="${labelWidth}" data-width="${plotWidth}"></line>
  </svg></div>`;
}

function caseEvidence(example) {
  const clip = example.clip_stats;
  const similarity = example.speaker_similarity;
  if (!clip || !similarity) return "";
  const maximum = similarity.maximum;
  const pair = similarity.distinct_reference_pair;
  const names = pair ? pair.speakers.map(escapeHTML).join(" + ") : "No verified distinct-speaker mapping";
  const sourceNames = maximum.source_speakers.map(escapeHTML).join(" + ");
  const sameReference = maximum.mapping_status === "merged";
  const pairNote = sameReference
    ? `<p class="source-annotation-note"><b>Source annotation note:</b> ${sourceNames} align mainly with the same revised reference speaker, ${escapeHTML(maximum.reference_speakers[0])}. The source maximum is not a distinct-speaker pair in this reference.</p>`
    : maximum.mapping_status === "unmapped"
      ? `<p class="source-annotation-note">Source labels ${sourceNames} could not be mapped confidently to two revised reference speakers.</p>`
      : "";
  return `<div class="case-evidence">
    <section><h3>Overlap in this excerpt</h3><div class="evidence-value"><strong>${clip.overlap_seconds.toFixed(1)} s</strong><span>overlapping reference speech</span></div><p><b>${(clip.overlap_ratio * 100).toFixed(1)}%</b> of reference speech; up to <b>${clip.peak_concurrent_speakers}</b> concurrent speakers. Full-recording overlap: <b>${(example.stats.overlap_ratio * 100).toFixed(1)}%</b>.</p><p>${clip.overlap_seconds > 0 ? "Shaded timeline bands mark intervals with two or more reference speakers." : "No overlapping reference speech occurs in this excerpt."}</p></section>
    <section><h3>Maximum speaker similarity</h3><div class="evidence-value"><strong>${maximum.cosine_similarity.toFixed(4)}</strong><span>full-recording source cosine similarity</span></div>${pairNote}<p><b>${maximum.mapping_status === "distinct" ? "Reference speaker pair" : "Highest mapped distinct-speaker pair"}:</b> ${names}${pair && maximum.mapping_status !== "distinct" ? ` (source cosine: ${pair.cosine_similarity.toFixed(4)})` : ""}.</p><p>Outlined tracks identify this pair; use the speaker shortcuts above to compare their voices.</p><details class="source-pair-provenance"><summary>Source speaker labels</summary><p>Source maximum: ${sourceNames}.${pair ? `<br>Highlighted pair: ${pair.source_speakers.map(escapeHTML).join(' + ')} → ${names}.` : ""}<br>Source labels are mapped by interval alignment with the revised benchmark TextGrid. Similarities come from source recording embeddings, not this excerpt.</p></details></section>
  </div>`;
}

function caseDetail(example, index) {
  const speakers = [...new Set(example.timeline.map(segment => segment.speaker))];
  return `<article class="sample-panel" data-sample-panel="${escapeHTML(example.slug)}" aria-labelledby="sample-title-${escapeHTML(example.slug)}">
    <header class="sample-head"><div class="case-meta"><span>Sample ${index + 1}</span><span>${escapeHTML(scenarioGroup(example.scenario))}</span><span>${escapeHTML(example.language)}</span></div><h3 id="sample-title-${escapeHTML(example.slug)}">${escapeHTML(example.title)}</h3><p>${escapeHTML(example.description)}</p></header>
    ${conditionDetails(example.conditions)}
    <div class="sample-player"><div><strong>Reference audio</strong><span>${formatTime(example.clip_duration_seconds)} excerpt</span></div><audio controls preload="none" src="${escapeHTML(example.audio)}" data-case-audio="${escapeHTML(example.slug)}" aria-label="Play ${escapeHTML(example.title)}">Your browser does not support audio playback.</audio></div><p class="player-error" data-audio-error hidden></p>
    <div class="caption-heading"><div class="caption-controls"><label><input type="checkbox" data-follow-playback checked> Follow playback</label><button type="button" data-resume-follow hidden>Resume follow</button></div></div>
    <div class="live-transcript" data-transcript="${escapeHTML(example.slug)}" role="region" aria-label="${escapeHTML(example.title)} reference transcript" tabindex="0">${example.timeline.map((segment, i) => `<button type="button" class="caption-line" style="--speaker:${speakerColor(segment.speaker, speakers)}" data-caption-index="${i}" data-start="${segment.start}" data-end="${segment.end}"><time>${formatTime(segment.start)}</time><b>${escapeHTML(segment.speaker)}</b><span>${escapeHTML(segment.text.replace(/<sil>|<pause>|<\$>/g, " "))}</span></button>`).join("")}</div>

  </article>`;
}

function updateCasePlayback(audio) {
  if (audio.dataset.caseAudio !== state.currentSampleSlug) return;
  const playbackButton = $("[data-compare-play]");
  if (playbackButton) playbackButton.textContent = audio.paused ? "Play audio" : "Pause audio";
  const playbackTime = $("[data-compare-time]");
  if (playbackTime) playbackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(state.examples.find(example => example.slug === state.currentSampleSlug).clip_duration_seconds)}`;
  const seek = $("[data-compare-seek]");
  if (seek && !(document.activeElement === seek && seek.matches(":active"))) seek.value = audio.currentTime;
  updateComparisonPlayback(audio);
  const detail = audio.closest("[data-sample-panel]");
  const transcript = $(`[data-transcript="${audio.dataset.caseAudio}"]`, detail);
  if (!transcript) return;
  const lines = $$('[data-start]', transcript);
  const active = lines.filter(line => audio.currentTime >= Number(line.dataset.start) && audio.currentTime < Number(line.dataset.end));
  lines.forEach(line => line.classList.toggle("active", active.includes(line)));
  const cursor = $("[data-timeline-cursor]", $("[data-case-grid]"));
  if (cursor && Number.isFinite(audio.duration) && audio.duration > 0) {
    const origin = Number(cursor.dataset.origin);
    const width = Number(cursor.dataset.width);
    const x = origin + Math.min(1, audio.currentTime / audio.duration) * width;
    cursor.setAttribute("x1", x);
    cursor.setAttribute("x2", x);
  }
  const first = active[0] || lines.filter(line => Number(line.dataset.start) <= audio.currentTime).at(-1) || lines[0];
  const follow = $("[data-follow-playback]", detail);
  if (first && follow?.checked && transcript.dataset.activeIndex !== first.dataset.captionIndex) {
    transcript.dataset.activeIndex = first.dataset.captionIndex;
    transcript.scrollTo({ top: first.offsetTop - transcript.clientHeight / 2 + first.clientHeight / 2, behavior: "auto" });
  }
}

function pauseActiveAudio(except = null) {
  if (state.activeAudio && state.activeAudio !== except) state.activeAudio.pause();
  state.activeAudio = except;
}

function setCaseQuery(slug, mode = "push") {
  const url = new URL(location.href);
  if (slug) url.searchParams.set("case", slug); else url.searchParams.delete("case");
  history[`${mode}State`]({}, "", url);
}

function syncSampleNavigation() {
  const sidebar = $(".sample-sidebar");
  const selectedButton = $(`[data-select-sample="${state.currentSampleSlug}"]`, sidebar);
  if (!selectedButton) return;
  sidebar.scrollTo({
    left: selectedButton.offsetLeft - (sidebar.clientWidth - selectedButton.clientWidth) / 2,
    top: selectedButton.offsetTop - (sidebar.clientHeight - selectedButton.clientHeight) / 2,
    behavior: "instant"
  });
}

function comparisonColumn(title, segments, output = null) {
  const statusNames = { available: "Output available", partial: "Partial or incomplete output", invalid: "Output has timestamp or model-identity issues", missing: "No output available", unmapped: "Excerpt timing unavailable" };
  const status = output ? statusNames[output.status] || "Output unavailable" : "Reference transcript";
  const speakerKey = segment => `${segment.source_unit ?? "reference"}:${segment.speaker}`;
  const speakers = [...new Set(segments.map(speakerKey))];
  return `<article class="comparison-column"><h4>${escapeHTML(title)}</h4><p class="comparison-status">${escapeHTML(status)}</p>${output?.warnings?.length ? `<p class="comparison-warning">${output.warnings.map(escapeHTML).join(" ")}</p>` : ""}<div class="comparison-lines" data-comparison-transcript tabindex="0" role="region" aria-label="${escapeHTML(title)} transcript">${segments.length ? segments.map((segment, index) => {
    const body = `<time>${formatTime(segment.start)}–${formatTime(segment.end)}</time><b>${escapeHTML(segment.speaker)}</b><span>${escapeHTML(segment.text.replace(/<sil>|<pause>|<\$>/g, " "))}</span>`;
    const color = speakerColor(speakerKey(segment), speakers);
    return segment.valid_timing === false
      ? `<div class="comparison-line invalid" style="--speaker:${color}">${body}<em>Invalid interval</em></div>`
      : `<button type="button" class="comparison-line" style="--speaker:${color}" data-comparison-index="${index}" data-start="${Math.max(0, segment.start)}" data-end="${segment.end}">${body}</button>`;
  }).join("") : `<p class="comparison-empty">${output?.status === "unmapped" ? "This split output cannot be aligned to the excerpt with the available timing metadata." : output?.status === "missing" ? "No result was found for this recording." : "No transcribed utterances are available in this audio example."}</p>`}</div></article>`;
}

function updateComparisonPlayback(audio) {
  $$('[data-comparison-transcript]').forEach(transcript => {
    const lines = $$('[data-start][data-end]', transcript);
    const active = lines.filter(line => audio.currentTime >= Number(line.dataset.start) && audio.currentTime < Number(line.dataset.end));
    lines.forEach(line => line.classList.toggle("active", active.includes(line)));
    const anchor = active[0] || lines.filter(line => Number(line.dataset.start) <= audio.currentTime).at(-1) || lines[0];
    if (state.comparison.follow && anchor && transcript.dataset.activeIndex !== anchor.dataset.comparisonIndex) {
      transcript.dataset.activeIndex = anchor.dataset.comparisonIndex;
      transcript.scrollTo({ top: anchor.offsetTop - transcript.clientHeight / 2 + anchor.clientHeight / 2, behavior: "auto" });
    }
  });
}

function renderModelComparison() {
  const container = $("[data-model-comparison]");
  if (!container || !state.examples || !state.currentSampleSlug) return;
  if (!state.predictions) { container.innerHTML = '<p class="loading-block">Loading model outputs...</p>'; return; }
  const example = state.examples.find(item => item.slug === state.currentSampleSlug);
  const data = state.predictions.cases.find(item => item.recording_id === example.recording_id);
  if (!data || !state.predictions.systems) { container.innerHTML = '<p>No model outputs are available for this sample.</p>'; return; }
  const systems = state.predictions.systems;
  const options = selected => systems.map(system => `<option value="${escapeHTML(system.id)}"${system.id === selected ? " selected" : ""}>${escapeHTML(system.name)}</option>`).join("");
  const outputFor = id => data.outputs.find(output => output.system_id === id);
  const nameFor = id => systems.find(system => system.id === id).name;
  const audio = $("[data-case-audio]", $(`[data-sample-panel="${state.currentSampleSlug}"]`));
  container.innerHTML = `<header class="comparison-heading"><h3>Compare model outputs</h3><p role="status">${escapeHTML(example.title)} · ${formatTime(example.clip_duration_seconds)}</p></header><div class="comparison-controls"><label>Model A<select data-compare-model="left">${options(state.comparison.left)}</select></label><label>Model B<select data-compare-model="right">${options(state.comparison.right)}</select></label></div><div class="comparison-playback"><button type="button" class="button button-primary" data-compare-play>Play audio</button><input type="range" data-compare-seek min="0" max="${example.clip_duration_seconds}" step="0.1" value="${audio.currentTime}" aria-label="Seek within the complete audio example"><span data-compare-time role="timer">${formatTime(audio.currentTime)} / ${formatTime(example.clip_duration_seconds)}</span><label><input type="checkbox" data-compare-follow${state.comparison.follow ? " checked" : ""}> Follow subtitles</label></div><div class="comparison-grid">${comparisonColumn("Reference", example.timeline)}${comparisonColumn(nameFor(state.comparison.left), outputFor(state.comparison.left)?.segments || [], outputFor(state.comparison.left))}${comparisonColumn(nameFor(state.comparison.right), outputFor(state.comparison.right)?.segments || [], outputFor(state.comparison.right))}</div><p class="comparison-footnote">Speaker labels are local to each model input.</p>`;
  updateCasePlayback(audio);
}

function selectSample(slug, scroll = true, historyMode = "replace") {
  const panel = $(`[data-sample-panel="${slug}"]`);
  if (!panel || !state.examples) return;
  const changed = state.currentSampleSlug !== slug;
  if (changed) pauseActiveAudio();
  state.currentSampleSlug = slug;
  $$('[data-sample-panel]').forEach(item => { item.inert = item !== panel; });
  $$('[data-select-sample]').forEach(button => {
    const selected = button.dataset.selectSample === slug;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "true"); else button.removeAttribute("aria-current");
  });
  syncSampleNavigation();
  renderModelComparison();
  if (changed) {
    const example = state.examples.find(item => item.slug === slug);
    const full = state.metadata?.find(item => item.recording_id === example.recording_id);
    const speakers = [...new Set(example.timeline.map(segment => segment.speaker))];
    $("[data-sample-analysis-content]").innerHTML = `<dl class="sample-source"><div><dt>Recording device</dt><dd>${escapeHTML(example.recording_device)}</dd></div><div><dt>Full recording</dt><dd data-full-duration="${escapeHTML(example.slug)}">${full ? formatDuration(full.duration_seconds, true) : "Metadata loading"}</dd></div></dl>${example.focus_windows?.length ? `<div class="focus-windows">${example.focus_windows.map(window => `<button type="button" data-seek="${window.start}">${escapeHTML(window.label)} at ${formatTime(window.start)}</button>`).join("")}</div>` : ""}${caseEvidence(example)}<div class="timeline-head"><div><h3>Reference speaker timeline</h3><p>Select a block to seek.</p></div></div><div class="timeline-legend"><span><i class="overlap-swatch" aria-hidden="true"></i>Overlapping speech</span><span><i class="similarity-swatch" aria-hidden="true"></i>Similar speaker pair</span></div>${timelineSVG(example, speakers)}`;
  }
  const index = state.examples.findIndex(example => example.slug === slug);
  $("[data-sample-position]").textContent = `${index + 1} / ${state.examples.length}`;
  const audio = $("[data-case-audio]", panel);
  audio.loop = state.loopSample;
  if (audio.preload === "none") { audio.preload = "metadata"; audio.load(); }
  if (scroll) $("[data-sample-stage]").scrollTo({ top: panel.offsetTop, behavior: "instant" });
  if (changed && historyMode && !state.restoreFromHistory) setCaseQuery(slug, historyMode);
}

function openCase(slug, updateHistory = true) {
  selectSample(slug, true, updateHistory ? "push" : null);
  if (updateHistory) $("#cases").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function moveSample(step) {
  if (!state.examples?.length) return;
  const index = state.examples.findIndex(example => example.slug === state.currentSampleSlug);
  selectSample(state.examples[(index + step + state.examples.length) % state.examples.length].slug);
}

function setupSampleBrowser() {
  const browser = $("[data-case-grid]");
  browser.addEventListener("click", event => {
    const selection = event.target.closest("[data-select-sample]");
    if (selection) selectSample(selection.dataset.selectSample);
    const navigation = event.target.closest("[data-move-sample]");
    if (navigation) moveSample(Number(navigation.dataset.moveSample));
    const panel = event.target.closest("[data-sample-panel]") || $(`[data-sample-panel="${state.currentSampleSlug}"]`);
    if (!panel) return;
    const audio = $("[data-case-audio]", panel);
    if (event.target.closest("[data-compare-play]")) {
      if (audio.paused) audio.play().catch(() => { $("[data-audio-error]", panel).hidden = false; $("[data-audio-error]", panel).textContent = "Audio could not play. Try the sample player's play control."; });
      else audio.pause();
    }
    const seekTarget = event.target.closest("[data-start], [data-timeline-start], [data-seek]");
    if (seekTarget) {
      audio.currentTime = Number(seekTarget.dataset.start ?? seekTarget.dataset.timelineStart ?? seekTarget.dataset.seek);
      audio.play().catch(error => {
        if (error.name === "AbortError") return;
        const message = $("[data-audio-error]", panel);
        message.hidden = false;
        message.textContent = "Use the audio player's play control, then select the line again.";
      });
    }
    const resume = event.target.closest("[data-resume-follow]");
    if (resume) {
      $("[data-follow-playback]", panel).checked = true;
      resume.hidden = true;
      delete $("[data-transcript]", panel).dataset.activeIndex;
      updateCasePlayback(audio);
    }
  });
  browser.addEventListener("input", event => {
    if (event.target.matches("[data-compare-seek]")) {
      const audio = $("[data-case-audio]", $(`[data-sample-panel="${state.currentSampleSlug}"]`));
      audio.currentTime = Number(event.target.value);
      updateCasePlayback(audio);
    }
  });
  browser.addEventListener("change", event => {
    if (event.target.matches("[data-compare-model]")) {
      const side = event.target.dataset.compareModel;
      const previous = state.comparison[side];
      state.comparison[side] = event.target.value;
      const other = side === "left" ? "right" : "left";
      if (state.comparison[side] === state.comparison[other]) state.comparison[other] = previous;
      renderModelComparison();
      $(`[data-compare-model="${side}"]`, browser).focus();
    }
    if (event.target.matches("[data-compare-follow]")) {
      state.comparison.follow = event.target.checked;
      $$('[data-comparison-transcript]', browser).forEach(transcript => delete transcript.dataset.activeIndex);
      updateCasePlayback($("[data-case-audio]", $(`[data-sample-panel="${state.currentSampleSlug}"]`)));
    }
    if (event.target.matches("[data-loop-sample]")) {
      state.loopSample = event.target.checked;
      $$("[data-case-audio]", browser).forEach(audio => { audio.loop = state.loopSample; });
    }
    if (event.target.matches("[data-follow-playback]")) {
      const panel = event.target.closest("[data-sample-panel]");
      $("[data-resume-follow]", panel).hidden = event.target.checked;
      if (event.target.checked) {
        delete $("[data-transcript]", panel).dataset.activeIndex;
        updateCasePlayback($("[data-case-audio]", panel));
      }
    }
  });
  browser.addEventListener("keydown", event => {
    const timeline = event.target.closest("[data-timeline-start]");
    if (timeline && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      timeline.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    if (event.target.matches("[data-sample-stage]") && ["ArrowDown", "PageDown", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      moveSample(["ArrowDown", "PageDown"].includes(event.key) ? 1 : -1);
    }
    if (event.target.matches("[data-select-sample]") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") selectSample(state.examples[0].slug);
      else if (event.key === "End") selectSample(state.examples.at(-1).slug);
      else moveSample(event.key === "ArrowDown" ? 1 : -1);
      $(`[data-select-sample="${state.currentSampleSlug}"]`).focus();
    }
  });
}

function renderCases() {
  if (!state.examples) return;
  state.sampleObserver?.disconnect();
  state.sampleNavObserver?.disconnect();
  pauseActiveAudio();
  const browser = $("[data-case-grid]");
  browser.innerHTML = `<div class="sample-browser-toolbar"><div><strong>Listen & read</strong><span>Scroll between samples; scroll within the transcript to read.</span></div><div class="sample-browser-controls"><label><input type="checkbox" data-loop-sample ${state.loopSample ? "checked" : ""}> Loop audio</label><button type="button" data-move-sample="-1" aria-label="Previous sample">↑ Previous</button><span data-sample-position role="status" aria-live="polite"></span><button type="button" data-move-sample="1" aria-label="Next sample">Next ↓</button></div></div><div class="sample-browser-layout"><nav class="sample-sidebar" aria-label="Choose an audio sample">${state.examples.map((example, index) => `<button type="button" data-select-sample="${escapeHTML(example.slug)}"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHTML(example.title)}</strong><small>${escapeHTML(example.language)} · ${formatTime(example.clip_duration_seconds)}</small></div></button>`).join("")}</nav><div class="sample-stage" data-sample-stage role="region" aria-label="Audio samples; scroll up or down to change sample" tabindex="0">${state.examples.map(caseDetail).join("")}</div></div><details class="sample-browser-analysis"><summary>View overlap, speaker similarity, and timeline for this sample</summary><div data-sample-analysis-content></div></details><section class="sample-comparison" id="model-comparison" data-model-comparison><p class="loading-block">Loading model outputs...</p></section>`;
  const stage = $("[data-sample-stage]", browser);
  $$('[data-case-audio]', browser).forEach(audio => {
    const panel = audio.closest("[data-sample-panel]");
    const transcript = $("[data-transcript]", panel);
    audio.addEventListener("play", () => { pauseActiveAudio(audio); audio.loop = state.loopSample; delete transcript.dataset.activeIndex; updateCasePlayback(audio); });
    audio.addEventListener("pause", () => { if (state.activeAudio === audio) state.activeAudio = null; updateCasePlayback(audio); });
    audio.addEventListener("timeupdate", () => updateCasePlayback(audio));
    audio.addEventListener("seeked", () => updateCasePlayback(audio));
    audio.addEventListener("error", () => {
      const error = $("[data-audio-error]", panel);
      error.hidden = false;
      error.textContent = "This audio could not load. Try another sample or reload the page.";
    });
  });
  const requested = new URL(location.href).searchParams.get("case") || state.currentSampleSlug;
  const initial = state.examples.some(example => example.slug === requested) ? requested : state.examples[0].slug;
  state.currentSampleSlug = null;
  selectSample(initial, true, null);
  state.sampleObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= .6).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) selectSample(visible.target.dataset.samplePanel, false);
  }, { root: stage, threshold: [.6] });
  $$('[data-sample-panel]', browser).forEach(panel => state.sampleObserver.observe(panel));
  state.sampleNavObserver = new ResizeObserver(syncSampleNavigation);
  state.sampleNavObserver.observe($(".sample-sidebar", browser));
  renderExplorer();
}

function parseURLState() {
  const params = new URL(location.href).searchParams;
  AXES.forEach(axis => {
    const candidate = params.get(axis.toLowerCase());
    state.filters[axis] = candidate && Object.hasOwn(CONDITION_RANGES, candidate) && candidate.startsWith(axis) ? candidate : null;
  });
  const analysis = params.get("analysis");
  if (["overlap", "similarity", "acoustic", "turn", "speaker"].includes(analysis)) state.diagnostic = analysis;
  const sort = params.get("sort");
  if (["system", "der", "cpwer", "tcpwer", "wer"].includes(sort)) state.sort.key = sort;
}

function updateFilterURL() {
  if (state.restoreFromHistory) return;
  const url = new URL(location.href);
  AXES.forEach(axis => {
    if (state.filters[axis]) url.searchParams.set(axis.toLowerCase(), state.filters[axis]);
    else url.searchParams.delete(axis.toLowerCase());
  });
  url.searchParams.set("analysis", state.diagnostic);
  url.searchParams.set("sort", state.sort.key);
  history.replaceState({}, "", url);
}

function syncCoverageSelection() {
  $$('[data-coverage-tier]').forEach(tile => {
    const selected = state.filters[tile.dataset.coverageAxis] === tile.dataset.coverageTier;
    tile.classList.toggle("active", selected);
    tile.setAttribute("aria-pressed", String(selected));
  });
}

function renderActiveFilters() {
  const container = $("[data-active-filters]");
  const active = AXES.filter(axis => state.filters[axis]);
  container.innerHTML = active.length ? active.map(axis => `<button type="button" class="axis-${axis.toLowerCase()}" data-remove-axis="${axis}" aria-label="Remove ${escapeHTML(AXIS_META[axis].name)} filter" title="Remove ${escapeHTML(AXIS_META[axis].name)} filter">${axisIcon(axis)}${escapeHTML(AXIS_META[axis].name)}: ${escapeHTML(conditionLabel(state.filters[axis]))}<span aria-hidden="true">×</span></button>`).join("") : "<span>No active filters</span>";
}

function renderExplorer() {
  if (!state.metadata) return;
  const active = AXES.filter(axis => state.filters[axis]);
  const matched = state.metadata.filter(item => active.every(axis => item.conditions[axis] === state.filters[axis]));
  state.matched = matched;
  const matchedSeconds = matched.reduce((sum, item) => sum + item.duration_seconds, 0);
  $$('[data-axis]').forEach(button => {
    const { axis, value } = button.dataset;
    const candidate = { ...state.filters, [axis]: value };
    const count = state.metadata.filter(item => AXES.every(key => !candidate[key] || item.conditions[key] === candidate[key])).length;
    const selected = state.filters[axis] === value;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = count === 0 && !selected;
    button.title = count ? `${count} recordings with the other selected conditions` : "No recordings with the other selected conditions";
    button.innerHTML = `<span>${escapeHTML(conditionLabel(value))}</span><small>${count}</small>`;
    button.setAttribute("aria-label", `${AXIS_META[axis].name}: ${conditionLabel(value)}; ${count} matching recordings${button.disabled ? "; unavailable with other selected conditions" : ""}`);
  });
  renderActiveFilters();
  syncCoverageSelection();
  $("[data-explorer-status]").textContent = active.length ? "Filtered condition space" : "Complete condition space";
  $("[data-match-count]").textContent = matched.length;
  $("[data-total-duration]").textContent = matched.length ? formatDuration(matchedSeconds, true) : "-";
  $("[data-median-duration]").textContent = matched.length ? formatDuration(median(matched.map(item => item.duration_seconds)), true) : "-";
  // Use the paper-reported benchmark aggregate; weight filtered subsets by duration.
  const overlap = active.length
    ? (matchedSeconds ? matched.reduce((sum, item) => sum + item.overlap_ratio * item.duration_seconds, 0) / matchedSeconds : null)
    : 0.2187;
  $("[data-average-overlap]").textContent = overlap == null ? "-" : `${(overlap * 100).toFixed(2)}%`;
  $("[data-average-overlap]").title = active.length ? "Weighted by recording duration for the selected recordings" : "Benchmark value reported in the paper";
  $("[data-language-count]").textContent = new Set(matched.map(item => item.language)).size;
  $("[data-scenario-count]").textContent = new Set(matched.map(item => scenarioGroup(item.scenario))).size;

  updateFilterURL();
}

async function loadMetadata() {
  if (state.metadata) return state.metadata;
  if (state.metadataPromise) return state.metadataPromise;
  $("[data-explorer-status]").textContent = "Loading metadata...";
  state.metadataPromise = fetchJSON(`${DATA_ROOT}/sample_metadata.json`).then(data => {
    if (!Array.isArray(data) || data.length !== 99) throw new Error("sample_metadata.json must contain 99 recordings");
    state.metadata = data;
    renderExplorer();
    if (state.currentSampleSlug) {
      const example = state.examples.find(item => item.slug === state.currentSampleSlug);
      const full = data.find(item => item.recording_id === example.recording_id);
      const duration = $("[data-full-duration]");
      if (duration && full) duration.textContent = formatDuration(full.duration_seconds, true);
    }
    return data;
  }).catch(error => {
    state.metadataPromise = null;
    moduleError($("[data-explorer]"), error, "metadata");
    throw error;
  });
  return state.metadataPromise;
}

const loaders = {
  summary: async () => {
    try { state.summary = await fetchJSON(`${DATA_ROOT}/summary.json`); renderOverview(state.summary); }
    catch (error) { moduleError($("[data-condition-coverage]"), error, "summary"); moduleError($("[data-overview-language]"), error, "summary"); moduleError($("[data-overview-scenarios]"), error, "summary"); moduleError($("[data-overview-duration]"), error, "summary"); }
  },
  leaderboard: async () => {
    try {
      const data = await fetchJSON(`${DATA_ROOT}/leaderboard.json`);
      if (!Array.isArray(data) || data.length !== 7) throw new Error("leaderboard.json must contain seven paper systems");
      state.leaderboard = data; renderLeaderboard();
    } catch (error) { moduleError($("[data-leaderboard]"), error, "leaderboard"); }
  },
  diagnostics: async () => {
    try { state.diagnostics = await fetchJSON(`${DATA_ROOT}/condition_results.json`); renderDiagnostics(); }
    catch (error) { moduleError($("[data-diagnostic-panel]"), error, "diagnostics"); }
  },
  cases: async () => {
    try {
      const data = await fetchJSON(`${DATA_ROOT}/representative_examples.json`);
      if (!Array.isArray(data) || !data.length) throw new Error("representative_examples.json is empty");
      state.examples = data; renderCases();
    } catch (error) { moduleError($("[data-case-grid]"), error, "cases"); }
  },
  predictions: async () => {
    try { state.predictions = await fetchJSON(`${DATA_ROOT}/case_predictions.json`); renderModelComparison(); }
    catch (error) { console.warn("Prediction interface unavailable", error); const container = $("[data-model-comparison]"); if (container) container.innerHTML = "<p>Model outputs could not be loaded. Reload to try again.</p>"; }
  },
  metadata: async () => loadMetadata()
};

function activateDiagnostic(name, focus = false) {
  if (!["overlap", "similarity", "acoustic", "turn", "speaker"].includes(name)) return;
  state.diagnostic = name;
  $$('[data-diagnostic]').forEach(tab => {
    const selected = tab.dataset.diagnostic === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  renderDiagnostics();
  updateFilterURL();
}

function setupInteractions() {
  const menuButton = $("[data-menu-button]");
  const menu = $("[data-menu]");
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      menu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    }
  });
  $$('a[href^="#"]', menu).forEach(link => link.addEventListener("click", () => {
    menu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  document.addEventListener("click", async event => {
    const retry = event.target.closest("[data-retry-resource]");
    if (retry) await loaders[retry.dataset.retryResource]?.();
    const coverage = event.target.closest("[data-coverage-tier]");
    if (coverage) {
      await loadMetadata();
      AXES.forEach(axis => { state.filters[axis] = null; });
      state.filters[coverage.dataset.coverageAxis] = coverage.dataset.coverageTier;
      renderExplorer();
      $("#explore").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    const filter = event.target.closest("[data-axis]");
    if (filter) {
      await loadMetadata();
      const { axis, value } = filter.dataset;
      state.filters[axis] = state.filters[axis] === value ? null : value;
      renderExplorer();
    }
    const remove = event.target.closest("[data-remove-axis]");
    if (remove) { state.filters[remove.dataset.removeAxis] = null; renderExplorer(); }
  });

  $("[data-reset-filters]").addEventListener("click", async () => {
    await loadMetadata();
    AXES.forEach(axis => { state.filters[axis] = null; });
    renderExplorer();
  });

  $("[data-board-toggle]").addEventListener("click", event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    state.boardView = button.dataset.view;
    if (state.boardView === "robustness" && !["excluded", "soft_degradation", "system"].includes(state.sort.key)) state.sort = { key: "excluded", direction: "asc" };
    if (state.boardView === "overall" && !["der", "cpwer", "tcpwer", "wer", "system"].includes(state.sort.key)) state.sort = { key: "cpwer", direction: "asc" };
    $$('[data-view]', event.currentTarget).forEach(option => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    renderLeaderboard();
  });

  $("[data-leaderboard]").addEventListener("click", event => {
    const button = event.target.closest("[data-sort]");
    if (!button) return;
    const key = button.dataset.sort;
    state.sort = state.sort.key === key ? { key, direction: state.sort.direction === "asc" ? "desc" : "asc" } : { key, direction: button.dataset.defaultDirection };
    renderLeaderboard();
    updateFilterURL();
  });

  const tabs = $("[data-diagnostic-tabs]");
  tabs.addEventListener("click", event => {
    const tab = event.target.closest("[data-diagnostic]");
    if (tab) activateDiagnostic(tab.dataset.diagnostic);
  });
  tabs.addEventListener("keydown", event => {
    const items = $$('[data-diagnostic]', tabs);
    const current = items.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    activateDiagnostic(items[next].dataset.diagnostic, true);
  });
  $$('[data-analysis-link]').forEach(link => link.addEventListener("click", () => activateDiagnostic(link.dataset.analysisLink)));

}

function setupSectionObserver() {
  const navLinks = $$('.side-nav a[href^="#"]');
  const sections = navLinks.map(link => $(link.hash)).filter(Boolean);
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => link.classList.toggle("active", link.hash === `#${visible.target.id}`));
  }, { rootMargin: "-20% 0px -65%", threshold: [0, .2, .6] });
  sections.forEach(section => observer.observe(section));
}

function restoreHistoryState() {
  state.restoreFromHistory = true;
  parseURLState();
  activateDiagnostic(state.diagnostic);
  renderLeaderboard();
  renderExplorer();
  const slug = new URL(location.href).searchParams.get("case");
  if (slug) openCase(slug, false);
  else if (state.examples) selectSample(state.examples[0].slug, true, null);
  state.restoreFromHistory = false;
}

async function init() {
  parseURLState();
  setupConditionLabels();
  setupInteractions();
  setupSampleBrowser();
  setupSectionObserver();
  activateDiagnostic(state.diagnostic);
  window.addEventListener("popstate", restoreHistoryState);
  await Promise.allSettled(Object.values(loaders).map(loader => loader()));
}

init();
