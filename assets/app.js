"use strict";

document.documentElement.classList.add("js");

const DATA_ROOT = "demo-data";
const DATA_VERSION = "20261004-demo-v2";
const AXES = ["P", "O", "S", "T", "N"];
const AXIS_META = {
  P: { name: "Speaker number", hint: "valid reference speakers" },
  O: { name: "Overlap ratio", hint: "recording-level concurrent speech" },
  S: { name: "Speaker similarity", hint: "maximum pairwise cosine similarity" },
  T: { name: "Speaker turn interval", hint: "q25; higher tier means shorter intervals" },
  N: { name: "Acoustic quality", hint: "d_N; higher tier means poorer quality" }
};
const CONDITION_RANGES = {
  P0: "2 speakers", P1: "3-4 speakers", P2: "5-8 speakers", P3: ">=9 speakers",
  O0: "0", O1: "(0, 0.10)", O2: "[0.10, 0.20)", O3: "[0.20, 0.40)", O4: "[0.40, 1.00]",
  S0: "[0, 0.32)", S1: "[0.32, 0.49)", S2: "[0.49, 0.65)", S3: "[0.65, 1]",
  T0: ">=0.45 s", T1: "[0.15, 0.45) s", T2: "[0.06, 0.15) s", T3: "[0, 0.06) s",
  N0: "[0, 0.27)", N1: "[0.27, 0.51)", N2: "[0.51, 0.74)", N3: "[0.74, 1]"
};
const CHART_COLORS = ["#58799b", "#668f84", "#9a8154", "#9a6e79", "#7c7398", "#6f8792", "#8a765f", "#687a92", "#8e7784"];
const SPEAKER_COLORS = ["#245f93", "#8a5b65", "#507c70", "#8a744a", "#655c86", "#5e7484", "#8b6750", "#526b92", "#6f7960", "#80627e", "#4e7c83", "#7c6c58", "#596d5e", "#77647f"];
const RESOURCE_COPY = {
  paper: ["Paper", "Manuscript link will be added after public release."],
  metadata: ["Recording metadata", "Canonical JSONL metadata for all 99 recordings."],
  audio_excerpts: ["Curated audio excerpts", "Eight local excerpts with corrected time-aligned references."],
  full_benchmark: ["Full benchmark", "Access instructions are not yet public."],
  evaluation_code: ["Evaluation code", "Scoring implementation and exact reproduction command are not yet public."],
  repository: ["Repository", "Static demo, metadata, and documentation source."]
};

const state = {
  summary: null,
  leaderboard: null,
  diagnostics: null,
  examples: null,
  predictions: null,
  release: null,
  metadata: null,
  metadataPromise: null,
  filters: { P: null, O: null, S: null, T: null, N: null },
  boardView: "overall",
  sort: { key: "cpwer", direction: "asc" },
  diagnostic: "overlap",
  matched: [],
  activeAudio: null,
  dialogOpener: null,
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

function profilePills(conditions) {
  return `<div class="profile-pills">${AXES.map(axis => `<span class="axis-${axis.toLowerCase()}" title="${escapeHTML(AXIS_META[axis].name)}">${escapeHTML(conditions[axis])}</span>`).join("")}</div>`;
}

function renderOverview(summary) {
  const total = summary.recordings;
  const languageEntries = Object.entries(summary.language_distribution);
  const language = $("[data-overview-language]");
  language.classList.remove("loading-block");
  language.innerHTML = `
    <div class="stacked-bar" aria-label="Language distribution across ${total} recordings">${languageEntries.map(([name, count], index) => `<i style="width:${count / total * 100}%;--bar:${CHART_COLORS[index]}" title="${escapeHTML(name)}: ${count} recordings"></i>`).join("")}</div>
    <ul class="legend-list">${languageEntries.map(([name, count], index) => `<li><i style="--dot:${CHART_COLORS[index]}"></i><span>${escapeHTML(name)}</span><b>${count} (${(count / total * 100).toFixed(1)}%)</b></li>`).join("")}</ul>`;

  const scenario = $("[data-overview-scenarios]");
  const scenarioEntries = Object.entries(summary.scenario_distribution);
  const maxScenario = Math.max(...scenarioEntries.map(([, count]) => count));
  scenario.classList.remove("loading-block");
  scenario.innerHTML = `<div class="rank-bars">${scenarioEntries.map(([name, count], index) => `<div><span>${escapeHTML(name)}</span><i><b style="width:${count / maxScenario * 100}%;--bar:${CHART_COLORS[index % CHART_COLORS.length]}"></b></i><strong>${count}</strong></div>`).join("")}</div>`;

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
      <header class="axis-title"><b>${axis}</b><div><strong>${escapeHTML(AXIS_META[axis].name)}</strong><small>${escapeHTML(AXIS_META[axis].hint)}</small></div></header>
      <div class="tier-strip" style="--columns:${tiers.length}" aria-label="${escapeHTML(AXIS_META[axis].name)} distribution">
        ${tiers.map(([tier, count]) => {
          const percentage = count / total * 100;
          return `<button type="button" class="tier-button" style="--share:${percentage}%" data-coverage-axis="${axis}" data-coverage-tier="${tier}" aria-pressed="false"><span><b>${tier}</b><em>${count} / ${percentage.toFixed(1)}%</em></span><small>${escapeHTML(CONDITION_RANGES[tier])}</small></button>`;
        }).join("")}
      </div>
    </section>`;
  }).join("");
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
    const policies = { moss_pro: "<=90 min", vibevoice: "<=60 min", soulx: "<=5 min segments" };
    return `<table class="results-table"><thead><tr>${sortHeader("System", "system")}${sortHeader("Excluded units", "excluded")}${sortHeader("Soft-degradation units", "soft_degradation")}<th>Input policy</th></tr></thead><tbody>${sorted.map(row => `<tr><th>${escapeHTML(row.system)}</th><td class="${tableCellClass(row.excluded, excludedRank)}">${row.excluded}</td><td class="${tableCellClass(row.soft_degradation, softRank)}">${row.soft_degradation}</td><td>${escapeHTML(policies[row.system_id] || "Complete recording")}</td></tr>`).join("")}</tbody></table>`;
  }
  const metrics = ["der", "cpwer", "tcpwer", "wer"];
  const ranking = Object.fromEntries(metrics.map(metric => [metric, rankedValues(rows, metric)]));
  return `<table class="results-table"><thead><tr>${sortHeader("System", "system")}${sortHeader("DER (%)", "der")}${sortHeader("cpWER (%)", "cpwer")}${sortHeader("tcpWER (%)", "tcpwer")}${sortHeader("WER (%)", "wer")}${sortHeader("Excluded", "excluded")}${sortHeader("Soft Deg.", "soft_degradation")}</tr></thead><tbody>${sorted.map(row => `<tr><th>${escapeHTML(row.system)}</th>${metrics.map(metric => `<td class="${tableCellClass(row[metric], ranking[metric])}">${row[metric].toFixed(2)}</td>`).join("")}<td>${row.excluded}</td><td>${row.soft_degradation}</td></tr>`).join("")}</tbody></table>`;
}

function renderLeaderboard() {
  if (!state.leaderboard) return;
  $("[data-leaderboard]").innerHTML = leaderboardTable(state.leaderboard);
  $("[data-leaderboard-note]").textContent = state.boardView === "overall"
    ? "Best values use a tinted cell; second-best values are underlined."
    : "Counts are inference-unit counts. Total unit denominators are unavailable, so no coverage percentage is shown.";
}

function diagnosticValue(value, unit) {
  if (value == null) return "Not evaluated";
  if (unit === "pp") return `${value > 0 ? "+" : ""}${value.toFixed(Math.abs(value) < 10 ? 2 : 1)} pp`;
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}

function diagnosticTable(data, systems) {
  return `<div class="table-wrap"><table class="results-table"><thead><tr><th>System</th>${data.series.map(series => `<th>${escapeHTML(series.label)}</th>`).join("")}</tr></thead><tbody>${systems.map((system, index) => `<tr><th>${escapeHTML(system.name)}</th>${data.series.map(series => `<td>${escapeHTML(diagnosticValue(series.values[index], series.unit))}${series.significant[index] === true ? "*" : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderDiagnostics() {
  if (!state.diagnostics) return;
  const data = state.diagnostics[state.diagnostic];
  const systems = state.diagnostics.systems;
  const selectedTab = $(`[data-diagnostic="${state.diagnostic}"]`);
  $("[data-diagnostic-panel]").setAttribute("aria-labelledby", selectedTab.id);
  $("[data-diagnostic-panel]").innerHTML = `
    <div class="diagnostic-copy"><h3>${escapeHTML(data.title)}</h3><p>${escapeHTML(data.description)}</p></div>
    <div class="diagnostic-chart">${data.series.map(series => {
      const domain = series.unit === "rho" ? 1 : Math.ceil(Math.max(...series.values.filter(value => value != null).map(Math.abs)) / 5) * 5;
      return `<section class="series-block"><div class="series-title"><span>${escapeHTML(series.label)}</span><small>${series.unit === "rho" ? "fixed domain [-1, 1]" : `percentage points, domain [-${domain}, ${domain}]`}</small></div><div class="series-axis"><span>−${domain}</span><span>+${domain}</span></div><div class="series-rows">${systems.map((system, index) => {
        const value = series.values[index];
        const width = value == null ? 0 : Math.min(50, Math.abs(value) / domain * 50);
        const significance = series.significant[index] === true ? `<span class="significance" aria-label="significant as reported in paper">*</span>` : "";
        return `<div class="series-row"><span>${escapeHTML(system.name)}</span><div class="diverging-track" aria-hidden="true">${value == null ? "" : `<i class="${value < 0 ? "negative" : "positive"}" style="width:${width}%"></i>`}</div><strong>${escapeHTML(diagnosticValue(value, series.unit))}${significance}</strong></div>`;
      }).join("")}</div></section>`;
    }).join("")}</div>
    <aside class="diagnostic-note"><strong>Control and limitation</strong><p>${escapeHTML(data.control)} Asterisk: significant as reported in paper Table 2. No confidence intervals are available.</p></aside>
    <details class="numeric-table"><summary>View exact values</summary>${diagnosticTable(data, systems)}</details>`;
}

function speakerColor(speaker, speakers) {
  return SPEAKER_COLORS[Math.max(0, speakers.indexOf(speaker)) % SPEAKER_COLORS.length];
}

function conditionDetails(conditions) {
  return `<div class="condition-details">${AXES.map(axis => `<div class="axis-${axis.toLowerCase()}"><span>${axis}</span><p>${escapeHTML(AXIS_META[axis].name)}</p><strong>${escapeHTML(conditions[axis])}</strong></div>`).join("")}</div>`;
}

function caseGalleryCard(example) {
  return `<article class="case-card" id="case-${escapeHTML(example.slug)}">
    <div class="case-meta"><span>${escapeHTML(example.scenario)}</span><span>${escapeHTML(example.language)}</span><span>${formatTime(example.clip_duration_seconds)} excerpt</span></div>
    <h3>${escapeHTML(example.title)}</h3>
    <p><b>What to listen for:</b> ${escapeHTML(example.description)}</p>
    ${profilePills(example.conditions)}
    <div class="case-card-foot"><span>${escapeHTML(example.recording_device)}</span><button type="button" data-open-case="${escapeHTML(example.slug)}">Open example</button></div>
  </article>`;
}

function timelineSVG(example, speakers) {
  const width = 900;
  const labelWidth = 120;
  const plotWidth = width - labelWidth - 12;
  const rowHeight = 30;
  const height = speakers.length * rowHeight + 28;
  const duration = example.clip_duration_seconds;
  const ticks = [0, .25, .5, .75, 1];
  return `<div class="timeline-svg-wrap"><svg class="timeline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Reference speaker timeline for ${escapeHTML(example.title)}">
    ${ticks.map(fraction => `<line x1="${labelWidth + fraction * plotWidth}" y1="0" x2="${labelWidth + fraction * plotWidth}" y2="${height - 20}" class="timeline-grid"></line><text x="${labelWidth + fraction * plotWidth}" y="${height - 4}" text-anchor="${fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"}" class="timeline-tick">${formatTime(fraction * duration)}</text>`).join("")}
    ${speakers.map((speaker, row) => `<text x="${labelWidth - 10}" y="${row * rowHeight + 19}" text-anchor="end" class="timeline-label">${escapeHTML(speaker)}</text>${example.timeline.filter(segment => segment.speaker === speaker).map(segment => {
      const x = labelWidth + segment.start / duration * plotWidth;
      const segmentWidth = Math.max(2, (segment.end - segment.start) / duration * plotWidth);
      return `<rect x="${x}" y="${row * rowHeight + 6}" width="${segmentWidth}" height="18" rx="2" fill="${speakerColor(speaker, speakers)}" tabindex="0" role="button" data-timeline-start="${segment.start}" aria-label="${escapeHTML(speaker)}, ${formatTime(segment.start)} to ${formatTime(segment.end)}"></rect>`;
    }).join("")}`).join("")}
    <line x1="${labelWidth}" y1="0" x2="${labelWidth}" y2="${height - 20}" class="timeline-playhead" data-timeline-cursor data-origin="${labelWidth}" data-width="${plotWidth}"></line>
  </svg></div>`;
}

function caseDetail(example) {
  const speakers = [...new Set(example.timeline.map(segment => segment.speaker))];
  const full = state.metadata?.find(item => item.recording_id === example.recording_id);
  const focusWindows = example.focus_windows || [];
  return `<article>
    <header class="case-detail-head"><div class="case-meta"><span>${escapeHTML(example.scenario)}</span><span>${escapeHTML(example.language)}</span></div><h2 id="case-dialog-title">${escapeHTML(example.title)}</h2><p><b>What to listen for:</b> ${escapeHTML(example.description)}</p><dl><div><dt>Recording device</dt><dd>${escapeHTML(example.recording_device)}</dd></div><div><dt>Excerpt</dt><dd>${formatTime(example.clip_duration_seconds)}</dd></div><div><dt>Full recording</dt><dd>${full ? formatDuration(full.duration_seconds, true) : "Metadata loading"}</dd></div></dl></header>
    ${conditionDetails(example.conditions)}
    <div class="sample-player"><div><strong>Reference audio excerpt</strong><span>At most five minutes; no model prediction is shown</span></div><audio controls preload="metadata" src="${escapeHTML(example.audio)}" data-case-audio="${escapeHTML(example.slug)}">Your browser does not support audio playback.</audio></div><p class="player-error" data-audio-error hidden></p>
    ${focusWindows.length ? `<div class="focus-windows">${focusWindows.map(window => `<button type="button" data-seek="${window.start}">${escapeHTML(window.label)} at ${formatTime(window.start)}</button>`).join("")}</div>` : ""}
    <div class="timeline-head"><div><h3>Reference speaker timeline</h3><p>Concurrent blocks across tracks indicate overlap. Select a block to seek.</p></div></div>
    ${timelineSVG(example, speakers)}
    <div class="caption-heading"><div><strong>Time-aligned reference</strong><span>${example.timeline.length} utterances; overlapping active segments remain highlighted</span></div><div class="caption-controls"><label><input type="checkbox" data-follow-playback checked> Follow playback</label><button type="button" data-resume-follow hidden>Resume follow</button><a href="${escapeHTML(example.textgrid)}" download>Download TextGrid</a></div></div>
    <div class="live-transcript" data-transcript="${escapeHTML(example.slug)}">${example.timeline.map((segment, index) => `<button type="button" class="caption-line" data-caption-index="${index}" data-start="${segment.start}" data-end="${segment.end}"><time>${formatTime(segment.start)}</time><b style="--speaker:${speakerColor(segment.speaker, speakers)}">${escapeHTML(segment.speaker)}</b><span>${escapeHTML(segment.text.replace(/<sil>|<pause>|<\$>/g, " "))}</span></button>`).join("")}</div>
  </article>`;
}

function updateCasePlayback(audio) {
  const detail = $("[data-case-detail]");
  const transcript = $(`[data-transcript="${audio.dataset.caseAudio}"]`, detail);
  if (!transcript) return;
  const lines = $$('[data-start]', transcript);
  const active = lines.filter(line => audio.currentTime >= Number(line.dataset.start) && audio.currentTime < Number(line.dataset.end));
  lines.forEach(line => line.classList.toggle("active", active.includes(line)));
  const cursor = $("[data-timeline-cursor]", detail);
  if (cursor && Number.isFinite(audio.duration) && audio.duration > 0) {
    const origin = Number(cursor.dataset.origin);
    const width = Number(cursor.dataset.width);
    const x = origin + Math.min(1, audio.currentTime / audio.duration) * width;
    cursor.setAttribute("x1", x);
    cursor.setAttribute("x2", x);
  }
  const first = active[0];
  const follow = $("[data-follow-playback]", detail);
  if (first && follow?.checked && transcript.dataset.activeIndex !== first.dataset.captionIndex) {
    transcript.dataset.activeIndex = first.dataset.captionIndex;
    first.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
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

function openCase(slug, updateHistory = true, opener = null) {
  if (!state.examples) return;
  const example = state.examples.find(item => item.slug === slug);
  if (!example) return;
  const dialog = $("[data-case-dialog]");
  const detail = $("[data-case-detail]", dialog);
  pauseActiveAudio();
  state.dialogOpener = opener || document.activeElement;
  detail.innerHTML = caseDetail(example);
  const audio = $("[data-case-audio]", detail);
  const transcript = $("[data-transcript]", detail);
  audio.addEventListener("play", () => pauseActiveAudio(audio));
  audio.addEventListener("timeupdate", () => updateCasePlayback(audio));
  audio.addEventListener("seeked", () => updateCasePlayback(audio));
  audio.addEventListener("error", () => {
    const error = $("[data-audio-error]", detail);
    error.hidden = false;
    error.textContent = "The audio excerpt could not be loaded. Check the connection or retry with the native player.";
  });
  transcript.addEventListener("wheel", () => {
    const follow = $("[data-follow-playback]", detail);
    if (follow?.checked) {
      follow.checked = false;
      $("[data-resume-follow]", detail).hidden = false;
    }
  }, { passive: true, once: true });
  if (!dialog.open) dialog.showModal();
  if (updateHistory) setCaseQuery(slug, "push");
}

function closeCase(updateHistory = true) {
  const dialog = $("[data-case-dialog]");
  if (!dialog.open) return;
  if (updateHistory) setCaseQuery(null, "push");
  dialog.close();
}

function setupCaseDialog() {
  const dialog = $("[data-case-dialog]");
  const detail = $("[data-case-detail]", dialog);
  document.addEventListener("click", event => {
    const opener = event.target.closest("[data-open-case]");
    if (opener) openCase(opener.dataset.openCase, true, opener);
  });
  detail.addEventListener("click", event => {
    const seekTarget = event.target.closest("[data-start], [data-timeline-start], [data-seek]");
    if (seekTarget) {
      const audio = $("[data-case-audio]", detail);
      audio.currentTime = Number(seekTarget.dataset.start ?? seekTarget.dataset.timelineStart ?? seekTarget.dataset.seek);
      audio.play().catch(error => {
        console.error(error);
        const message = $("[data-audio-error]", detail);
        message.hidden = false;
        message.textContent = "Playback was blocked. Use the native play control, then select the segment again.";
      });
    }
    if (event.target.closest("[data-resume-follow]")) {
      $("[data-follow-playback]", detail).checked = true;
      event.target.closest("[data-resume-follow]").hidden = true;
      const audio = $("[data-case-audio]", detail);
      updateCasePlayback(audio);
    }
  });
  detail.addEventListener("keydown", event => {
    const target = event.target.closest("[data-timeline-start]");
    if (target && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  $("[data-close-case]", dialog).addEventListener("click", () => closeCase());
  dialog.addEventListener("click", event => { if (event.target === dialog) closeCase(); });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeCase();
  });
  dialog.addEventListener("close", () => {
    pauseActiveAudio();
    detail.innerHTML = "";
    state.dialogOpener?.focus?.();
    state.dialogOpener = null;
  });
}

function renderCases() {
  if (!state.examples) return;
  $("[data-case-grid]").innerHTML = state.examples.map(caseGalleryCard).join("");
  renderExplorer();
  const slug = new URL(location.href).searchParams.get("case");
  if (slug && state.examples.some(example => example.slug === slug) && !$("[data-case-dialog]").open) openCase(slug, false);
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
  if (["system", "der", "cpwer", "tcpwer", "wer", "excluded", "soft_degradation"].includes(sort)) state.sort.key = sort;
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
  container.innerHTML = active.length ? active.map(axis => `<button type="button" data-remove-axis="${axis}" title="Remove ${escapeHTML(AXIS_META[axis].name)} filter">${state.filters[axis]}: ${escapeHTML(CONDITION_RANGES[state.filters[axis]])} x</button>`).join("") : "<span>No active filters</span>";
}

function recordingTable(items) {
  if (!items.length) return `<p class="empty-state">No recordings match this profile.</p>`;
  const curatedIDs = new Set((state.examples || []).map(example => example.recording_id));
  return `<table><thead><tr><th>Recording ID</th><th>Source dataset</th><th>Language</th><th>Scenario</th><th>Duration</th><th>Profile</th><th>Reference excerpt</th></tr></thead><tbody>${items.map(item => `<tr><td>${escapeHTML(item.recording_id)}</td><td>${escapeHTML(item.source_dataset)}</td><td>${escapeHTML(item.language)}</td><td>${escapeHTML(item.scenario)}</td><td>${formatDuration(item.duration_seconds, true)}</td><td>${AXES.map(axis => item.conditions[axis]).join(" ")}</td><td>${curatedIDs.has(item.recording_id) ? "Available" : "Not curated"}</td></tr>`).join("")}</tbody></table>`;
}

function renderExplorer() {
  if (!state.metadata) return;
  const active = AXES.filter(axis => state.filters[axis]);
  const matched = state.metadata.filter(item => active.every(axis => item.conditions[axis] === state.filters[axis]));
  state.matched = matched;
  $$('[data-axis]').forEach(button => {
    const { axis, value } = button.dataset;
    const candidate = { ...state.filters, [axis]: value };
    const count = state.metadata.filter(item => AXES.every(key => !candidate[key] || item.conditions[key] === candidate[key])).length;
    const selected = state.filters[axis] === value;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = count === 0 && !selected;
    button.title = count ? `${count} recordings with the other selected conditions` : "No recordings with the other selected conditions";
    button.innerHTML = `<span>${escapeHTML(value)}</span><small>${count}</small>`;
  });
  renderActiveFilters();
  syncCoverageSelection();
  $("[data-explorer-status]").textContent = active.length ? "Filtered condition space" : "Complete condition space";
  $("[data-match-count]").textContent = matched.length;
  $("[data-total-duration]").textContent = matched.length ? formatDuration(matched.reduce((sum, item) => sum + item.duration_seconds, 0), true) : "-";
  $("[data-median-duration]").textContent = matched.length ? formatDuration(median(matched.map(item => item.duration_seconds)), true) : "-";
  $("[data-average-overlap]").textContent = matched.length ? `${(matched.reduce((sum, item) => sum + item.overlap_ratio, 0) / matched.length * 100).toFixed(1)}%` : "-";
  $("[data-language-count]").textContent = new Set(matched.map(item => item.language)).size;
  $("[data-scenario-count]").textContent = new Set(matched.map(item => item.scenario)).size;
  $("[data-recording-list]").innerHTML = recordingTable(matched);

  const matchedIDs = new Set(matched.map(item => item.recording_id));
  const curated = (state.examples || []).filter(example => matchedIDs.has(example.recording_id));
  const representative = $("[data-representatives]");
  representative.innerHTML = curated.length ? curated.map(example => `<article><div><span>${escapeHTML(example.scenario)}, ${escapeHTML(example.language)}</span><h4>${escapeHTML(example.title)}</h4></div><button class="case-link" type="button" data-open-case="${escapeHTML(example.slug)}">Open example</button></article>`).join("") : `<div class="no-curated"><b>${matched.length} recordings match</b>, but no curated excerpt is available for this selection. The complete recording list remains available above.</div>`;
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
    if ($("[data-case-dialog]").open) {
      const slug = new URL(location.href).searchParams.get("case");
      if (slug) openCase(slug, false);
    }
    return data;
  }).catch(error => {
    state.metadataPromise = null;
    moduleError($("[data-explorer]"), error, "metadata");
    throw error;
  });
  return state.metadataPromise;
}

function renderResources(release) {
  const resources = $("[data-resources]");
  resources.innerHTML = Object.entries(release.availability).map(([key, item]) => {
    const [name, description] = RESOURCE_COPY[key] || [key, ""];
    const status = item.status === "available" ? "Available" : "Coming soon";
    const nameHTML = item.status === "available" && item.url ? `<a href="${escapeHTML(item.url)}">${escapeHTML(name)}</a>` : escapeHTML(name);
    return `<div class="resource-row"><strong>${nameHTML}</strong><p>${escapeHTML(description)}</p><span class="resource-status ${item.status === "available" ? "available" : ""}">${status}</span></div>`;
  }).join("");
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
    try { state.predictions = await fetchJSON(`${DATA_ROOT}/case_predictions.json`); }
    catch (error) { console.warn("Prediction interface unavailable", error); }
  },
  release: async () => {
    try { state.release = await fetchJSON(`${DATA_ROOT}/release.json`); renderResources(state.release); }
    catch (error) { moduleError($("[data-resources]"), error, "release"); }
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
    if (state.boardView === "overall" && !["der", "cpwer", "tcpwer", "wer", "excluded", "soft_degradation", "system"].includes(state.sort.key)) state.sort = { key: "cpwer", direction: "asc" };
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

  $("[data-toggle-recordings]").addEventListener("click", event => {
    const list = $("[data-recording-list]");
    list.hidden = !list.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!list.hidden));
    event.currentTarget.textContent = list.hidden ? "Show matching recordings" : "Hide matching recordings";
  });
  $("[data-export-recordings]").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.matched, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "ms-bench-filtered-recordings.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
  });
  $("[data-copy-link]").addEventListener("click", async () => {
    const status = $("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(location.href);
      status.textContent = "Link copied";
    } catch (error) {
      console.warn(error);
      status.textContent = location.href;
    }
    setTimeout(() => { status.textContent = ""; }, 3000);
  });
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
  else closeCase(false);
  state.restoreFromHistory = false;
}

async function init() {
  parseURLState();
  setupInteractions();
  setupCaseDialog();
  setupSectionObserver();
  activateDiagnostic(state.diagnostic);
  window.addEventListener("popstate", restoreHistoryState);
  await Promise.allSettled(Object.values(loaders).map(loader => loader()));
}

init();
