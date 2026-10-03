"use strict";

document.documentElement.classList.add("js");

const DATA_ROOT = "demo-data";
const DATA_VERSION = "2026100302";
const AXES = ["P", "O", "S", "T", "N"];
const AXIS_NAMES = { P: "Speaker Number", O: "Overlap Ratio", S: "Speaker Similarity", T: "Speaker Turn Interval", N: "Acoustic Quality" };
const AXIS_COLORS = {
  P: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6"],
  O: ["#eff6ff", "#dbeafe", "#bfdbfe", "#60a5fa", "#2563eb"],
  S: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6"],
  T: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6"],
  N: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6"]
};

const state = {
  core: null,
  metadata: null,
  filters: { P: null, O: null, S: null, T: null, N: null },
  boardView: "overall",
  diagnostic: "overlap"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatDuration(seconds) {
  const minutes = seconds / 60;
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)} h` : `${minutes.toFixed(minutes < 10 ? 1 : 0)} min`;
}

function formatTime(seconds) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function counts(items, key) {
  return items.reduce((result, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function topEntries(object, limit = 4) {
  return Object.entries(object).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function listSummary(object, limit = 4) {
  const entries = topEntries(object, limit);
  if (!entries.length) return "No matches";
  const remaining = Object.keys(object).length - entries.length;
  return entries.map(([name, count]) => `${titleCase(name)} ${count}`).join(" · ") + (remaining > 0 ? ` · +${remaining} more` : "");
}

async function fetchJSON(path) {
  const response = await fetch(`${path}${path.includes("?") ? "&" : "?"}v=${DATA_VERSION}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function dataError(error) {
  console.error(error);
  const hint = location.protocol === "file:"
    ? "Data cannot be fetched from a file:// URL. Run “python -m http.server” in the repository and open the local HTTP address."
    : "The data file could not be loaded. Please refresh or view the repository metadata.";
  $$(".loading-block").forEach(element => {
    element.classList.add("error-block");
    element.textContent = hint;
  });
}

function profilePills(conditions, compact = false) {
  return `<div class="profile-pills${compact ? " compact" : ""}">${AXES.map(axis =>
    `<span class="axis-${axis.toLowerCase()}" title="${AXIS_NAMES[axis]}">${escapeHTML(conditions[axis])}</span>`
  ).join("")}</div>`;
}

function renderOverview(summary) {
  const language = $("[data-overview-language]");
  const languages = Object.entries(summary.language_distribution);
  const total = summary.recordings;
  language.classList.remove("loading-block");
  language.innerHTML = `
    <div class="language-total"><strong>${summary.primary_languages.join(" + ")}</strong><span>dominant</span></div>
    <div class="stacked-bar" aria-label="Language distribution">${languages.map(([name, count], index) =>
      `<i style="width:${count / total * 100}%;--bar:${index === 0 ? "#2563eb" : index === 1 ? "#7aa7f8" : "#cbd5e1"}" title="${escapeHTML(name)}: ${count}"></i>`
    ).join("")}</div>
    <ul class="legend-list">${languages.map(([name, count], index) =>
      `<li><i style="--dot:${index === 0 ? "#2563eb" : index === 1 ? "#7aa7f8" : "#cbd5e1"}"></i><span>${escapeHTML(name)}</span><b>${count}</b></li>`
    ).join("")}</ul>`;

  const scenarios = $("[data-overview-scenarios]");
  const maxScenario = Math.max(...Object.values(summary.scenario_distribution));
  scenarios.classList.remove("loading-block");
  scenarios.innerHTML = `<div class="rank-bars">${Object.entries(summary.scenario_distribution).map(([name, count]) => `
    <div><span>${escapeHTML(name)}</span><i><b style="width:${count / maxScenario * 100}%"></b></i><strong>${count}</strong></div>`).join("")}</div>`;

  const duration = $("[data-overview-duration]");
  const durationBins = Object.entries(summary.duration_distribution);
  const maxDurationBin = Math.max(...durationBins.map(([, count]) => count));
  duration.classList.remove("loading-block");
  duration.innerHTML = `
    <div class="duration-summary"><strong>${summary.median_duration_minutes.toFixed(1)} min</strong><span>median recording duration</span></div>
    <div class="duration-chart" aria-label="Recording duration distribution">${durationBins.map(([label, count]) => `
      <div class="duration-column" title="${escapeHTML(label)}: ${count} recordings"><strong>${count}</strong><div><i style="height:${count / maxDurationBin * 100}%"></i></div><span>${escapeHTML(label)}</span></div>`).join("")}</div>`;

  const coverage = $("[data-condition-coverage]");
  coverage.classList.remove("loading-block");
  coverage.innerHTML = AXES.map(axis => {
    const tiers = Object.entries(summary.condition_distribution[axis]);
    return `<div class="coverage-row">
      <div class="coverage-label"><b>${axis}</b><span>${AXIS_NAMES[axis]}</span></div>
      <div class="coverage-bars" aria-label="${AXIS_NAMES[axis]} distribution">${tiers.map(([tier, count], index) =>
        `<span style="width:${count / total * 100}%;--tier:${AXIS_COLORS[axis][index]}" title="${tier}: ${count} recordings"><b>${tier}</b><small>${count}</small></span>`
      ).join("")}</div>
    </div>`;
  }).join("");
}

function leaderboardTable(systems) {
  if (state.boardView === "robustness") {
    const rows = systems.map(system => ({ ...system, scoreable: 99 - system.excluded })).sort((a, b) => b.scoreable - a.scoreable || a.soft_degradation - b.soft_degradation);
    const bestExcluded = Math.min(...rows.map(row => row.excluded));
    const bestSoft = Math.min(...rows.map(row => row.soft_degradation));
    return `<table class="results-table"><thead><tr><th>System</th><th>Scoreable</th><th>Coverage</th><th>Excluded ↓</th><th>Soft degradation ↓</th></tr></thead><tbody>${rows.map(row => `
      <tr><th><span>${escapeHTML(row.system)}</span><small>${escapeHTML(row.short)}</small></th><td>${row.scoreable} / 99</td><td><div class="coverage-meter"><i style="width:${row.scoreable / 99 * 100}%"></i></div><span>${(row.scoreable / 99 * 100).toFixed(1)}%</span></td><td class="${row.excluded === bestExcluded ? "best" : ""}">${row.excluded}</td><td class="${row.soft_degradation === bestSoft ? "best" : ""}">${row.soft_degradation}</td></tr>`).join("")}</tbody></table>`;
  }

  const metrics = ["der", "cpwer", "tcpwer", "wer"];
  const best = Object.fromEntries(metrics.map(metric => [metric, Math.min(...systems.map(system => system[metric]))]));
  return `<table class="results-table"><thead><tr><th>System</th><th>DER ↓</th><th>cpWER ↓</th><th>tcpWER ↓</th><th>WER ↓</th></tr></thead><tbody>${systems.map((system, index) => `
    <tr><th><span>${escapeHTML(system.system)}</span><small>${index === 0 ? "best tcpWER" : escapeHTML(system.short)}</small></th>${metrics.map(metric => `<td class="${system[metric] === best[metric] ? "best" : ""}">${system[metric].toFixed(2)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function renderLeaderboard() {
  if (!state.core) return;
  $("[data-leaderboard]").innerHTML = leaderboardTable(state.core.leaderboard);
  $("[data-leaderboard-note]").textContent = state.boardView === "overall"
    ? "Lower error is better. Best result in each column is highlighted."
    : "Coverage is the share of recordings with structurally scoreable output.";
}

function diagnosticValue(value, unit) {
  if (value == null) return "n/a";
  if (unit === "pp") return `${value > 0 ? "+" : ""}${value.toFixed(value < 10 ? 2 : 1)} pp`;
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}

function renderDiagnostics() {
  if (!state.core) return;
  const data = state.core.diagnostics[state.diagnostic];
  const systems = state.core.diagnostics.systems;
  const allValues = data.series.flatMap(series => series.values.filter(value => value != null));
  const maxAbsolute = Math.max(...allValues.map(Math.abs), 0.01);
  $("[data-diagnostic-panel]").innerHTML = `
    <div class="diagnostic-copy"><span class="diagnostic-tag">Controlled analysis</span><h3>${escapeHTML(data.title)}</h3><p>${escapeHTML(data.description)}</p><blockquote>${escapeHTML(data.note)}</blockquote></div>
    <div class="diagnostic-chart">${data.series.map((series, seriesIndex) => `
      <section class="series-block"><div class="series-title"><span>${escapeHTML(series.label)}</span><small>${escapeHTML(series.unit)}</small></div>
      <div class="series-rows">${systems.map((system, index) => {
        const value = series.values[index];
        const width = value == null ? 0 : Math.abs(value) / maxAbsolute * 100;
        return `<div class="series-row"><span>${escapeHTML(system)}</span><div class="bar-track ${value < 0 ? "negative" : ""}"><i style="width:${width}%;--series:${seriesIndex}"></i></div><strong>${diagnosticValue(value, series.unit)}</strong></div>`;
      }).join("")}</div></section>`).join("")}</div>`;
}

function speakerColor(speaker, speakers) {
  const index = speakers.indexOf(speaker);
  return ["#2563eb", "#60a5fa", "#1e40af", "#94a3b8", "#64748b", "#38bdf8"][index % 6];
}

function conditionDetails(conditions) {
  return `<div class="condition-details">${AXES.map(axis => `<div><span>${axis}</span><p>${AXIS_NAMES[axis]}</p><strong>${escapeHTML(conditions[axis])}</strong></div>`).join("")}</div>`;
}

function caseCard(example, index) {
  const speakers = [...new Set(example.timeline.map(segment => segment.speaker))];
  return `<article class="sample-card reveal" id="case-${escapeHTML(example.slug)}">
    <header class="sample-head"><span class="sample-index">${String(index + 1).padStart(2, "0")}</span><div><div class="sample-tags"><span>Scenario · ${escapeHTML(titleCase(example.scenario))}</span><span>Language · ${escapeHTML(example.language)}</span></div><h3>${escapeHTML(example.title)}</h3><p>${escapeHTML(example.description)}</p></div></header>
    ${conditionDetails(example.conditions)}
    <div class="sample-player"><div><strong>Audio excerpt</strong><span>${formatTime(example.clip_duration_seconds)} · ${escapeHTML(example.recording_device)}</span></div><audio controls preload="none" src="${escapeHTML(example.audio)}" data-case-audio="${escapeHTML(example.slug)}">Your browser does not support audio playback.</audio></div>
    <div class="caption-heading"><strong>Time-aligned reference</strong><span>Subtitles follow playback</span></div>
    <div class="live-transcript" data-transcript="${escapeHTML(example.slug)}">${example.timeline.map((segment, segmentIndex) => `
      <button type="button" class="caption-line" data-caption-index="${segmentIndex}" data-start="${segment.start}" data-end="${segment.end}"><time>${formatTime(segment.start)}</time><b style="--speaker:${speakerColor(segment.speaker, speakers)}">${escapeHTML(segment.speaker)}</b><span>${escapeHTML(segment.text.replace(/<sil>|<pause>|<\$>/g, " "))}</span></button>`).join("")}</div>
  </article>`;
}

function updateTranscript(audio) {
  const transcript = $(`[data-transcript="${audio.dataset.caseAudio}"]`);
  if (!transcript) return;
  const lines = $$("[data-start]", transcript);
  const active = lines.filter(line => audio.currentTime >= Number(line.dataset.start) && audio.currentTime < Number(line.dataset.end));
  lines.forEach(line => line.classList.toggle("active", active.includes(line)));
  const first = active[0];
  if (first && transcript.dataset.activeIndex !== first.dataset.captionIndex) {
    transcript.dataset.activeIndex = first.dataset.captionIndex;
    const top = first.offsetTop - transcript.offsetTop - transcript.clientHeight / 2 + first.offsetHeight / 2;
    transcript.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  if (!first) delete transcript.dataset.activeIndex;
}

function setupCasePlayers() {
  const audios = $$('[data-case-audio]');
  audios.forEach(audio => {
    audio.addEventListener("play", () => audios.forEach(other => { if (other !== audio) other.pause(); }));
    audio.addEventListener("timeupdate", () => updateTranscript(audio));
    audio.addEventListener("seeked", () => updateTranscript(audio));
  });
  $("[data-case-grid]").addEventListener("click", event => {
    const line = event.target.closest("[data-start]");
    if (!line) return;
    const card = line.closest(".sample-card");
    const audio = $("[data-case-audio]", card);
    audio.currentTime = Number(line.dataset.start);
    audio.play();
  });
}

function renderCases() {
  $("[data-case-grid]").innerHTML = state.core.examples.map(caseCard).join("");
  $("[data-case-grid]").querySelectorAll(".reveal").forEach(element => element.classList.add("visible"));
  setupCasePlayers();
}

async function loadMetadata() {
  if (state.metadata) return state.metadata;
  $("[data-explorer-status]").textContent = "Loading 99 metadata records…";
  try {
    state.metadata = await fetchJSON(`${DATA_ROOT}/sample_metadata.json`);
    renderExplorer();
    return state.metadata;
  } catch (error) {
    dataError(error);
    $("[data-explorer-status]").textContent = "Metadata unavailable";
    throw error;
  }
}

function renderExplorer() {
  if (!state.metadata || !state.core) return;
  const active = Object.entries(state.filters).filter(([, tier]) => tier);
  const matched = state.metadata.filter(item => active.every(([axis, tier]) => item.conditions[axis] === tier));
  $("[data-explorer-status]").textContent = active.length ? "Filtered condition space" : "Complete condition space";
  $("[data-match-count]").textContent = matched.length;
  $("[data-active-profile]").textContent = active.length ? AXES.map(axis => state.filters[axis] || `${axis}*`).join(" · ") : "Any profile";
  $("[data-median-duration]").textContent = matched.length ? formatDuration(median(matched.map(item => item.duration_seconds))) : "—";
  $("[data-average-overlap]").textContent = matched.length ? `${(matched.reduce((sum, item) => sum + item.overlap_ratio, 0) / matched.length * 100).toFixed(1)}%` : "—";
  const languageCounts = counts(matched, "language");
  const scenarioCounts = counts(matched, "scenario");
  $("[data-language-count]").textContent = Object.keys(languageCounts).length;
  $("[data-scenario-count]").textContent = Object.keys(scenarioCounts).length;
  $("[data-language-summary]").textContent = listSummary(languageCounts);
  $("[data-scenario-summary]").textContent = listSummary(scenarioCounts);

  const curatedIDs = new Set(matched.map(item => item.recording_id));
  const curated = state.core.examples.filter(example => curatedIDs.has(example.recording_id)).slice(0, 2);
  const representative = $("[data-representatives]");
  if (curated.length) {
    representative.innerHTML = curated.map(example => `<article><div><span>${escapeHTML(titleCase(example.scenario))} · ${escapeHTML(example.language)}</span><h4>${escapeHTML(example.title)}</h4>${profilePills(example.conditions, true)}</div><a href="#case-${escapeHTML(example.slug)}">View sample <span aria-hidden="true">→</span></a></article>`).join("");
  } else if (matched.length) {
    const sample = matched[0];
    representative.innerHTML = `<article class="metadata-only"><div><span>Metadata-only match</span><h4>${escapeHTML(sample.recording_id)}</h4>${profilePills(sample.conditions, true)}</div><small>No curated audio for this profile</small></article>`;
  } else {
    representative.innerHTML = `<p class="empty-state">No recording matches this exact combination. Remove one tier to broaden the profile.</p>`;
  }
}

function setupExplorer() {
  const explorer = $("[data-explorer]");
  if (!explorer) return;
  $$("[data-axis]", explorer).forEach(button => button.addEventListener("click", async () => {
    await loadMetadata();
    const { axis, value } = button.dataset;
    state.filters[axis] = state.filters[axis] === value ? null : value;
    $$(`[data-axis="${axis}"]`, explorer).forEach(option => {
      const selected = state.filters[axis] === option.dataset.value;
      option.classList.toggle("active", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    renderExplorer();
  }));
  $("[data-reset-filters]").addEventListener("click", async () => {
    await loadMetadata();
    AXES.forEach(axis => { state.filters[axis] = null; });
    $$("[data-axis]", explorer).forEach(button => {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    });
    renderExplorer();
  });
  loadMetadata();
}

function setupInteractions() {
  const menuButton = $("[data-menu-button]");
  const menu = $("[data-menu]");
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  $$('a[href^="#"]', menu).forEach(link => link.addEventListener("click", () => {
    menu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  $("[data-board-toggle]").addEventListener("click", event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    state.boardView = button.dataset.view;
    $$("[data-view]", event.currentTarget).forEach(option => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    renderLeaderboard();
  });

  $("[data-diagnostic-tabs]").addEventListener("click", event => {
    const button = event.target.closest("[data-diagnostic]");
    if (!button) return;
    state.diagnostic = button.dataset.diagnostic;
    $$("[data-diagnostic]", event.currentTarget).forEach(option => option.setAttribute("aria-selected", String(option === button)));
    renderDiagnostics();
  });

}

function setupViewportEffects() {
  const header = $("[data-header]");
  const updateHeader = () => header.classList.toggle("scrolled", scrollY > 10);
  updateHeader();
  addEventListener("scroll", updateHeader, { passive: true });

  const reveal = $$(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) reveal.forEach(element => element.classList.add("visible"));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: .08, rootMargin: "0px 0px -30px" });
    reveal.forEach(element => observer.observe(element));
  }

  const sections = $$('main section[id]:not(#top)');
  const navLinks = $$('.site-nav a[href^="#"]');
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
    }), { rootMargin: "-35% 0px -55%" });
    sections.forEach(section => observer.observe(section));
  }
}

async function init() {
  setupInteractions();
  setupExplorer();
  setupViewportEffects();
  try {
    const [summary, leaderboard, diagnostics, examples] = await Promise.all([
      fetchJSON(`${DATA_ROOT}/summary.json`), fetchJSON(`${DATA_ROOT}/leaderboard.json`),
      fetchJSON(`${DATA_ROOT}/condition_results.json`), fetchJSON(`${DATA_ROOT}/representative_examples.json`)
    ]);
    state.core = { summary, leaderboard, diagnostics, examples };
    renderOverview(summary);
    renderLeaderboard();
    renderDiagnostics();
    renderCases();
    if (state.metadata) renderExplorer();
  } catch (error) { dataError(error); }
}

init();
