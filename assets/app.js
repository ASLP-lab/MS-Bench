"use strict";

document.documentElement.classList.add("js");

const DATA_ROOT = "demo-data";
const AXES = ["P", "O", "S", "T", "N"];
const AXIS_NAMES = { P: "Speaker count", O: "Overlap ratio", S: "Speaker similarity", T: "Turn interval", N: "Acoustic difficulty" };
const AXIS_COLORS = {
  P: ["#dbe7de", "#a9c8b4", "#5f9680", "#235143"],
  O: ["#f3dfd3", "#edba9f", "#df8f69", "#cf5f3a", "#963b28"],
  S: ["#e8e2d4", "#d6c49d", "#b89b63", "#856b39"],
  T: ["#dce5e7", "#a9c3c7", "#6b9aa0", "#336c73"],
  N: ["#e4e0e8", "#c3b7ce", "#9786aa", "#645373"]
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
  const response = await fetch(path);
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
      `<i style="width:${count / total * 100}%;--bar:${index < 2 ? (index ? "#df7049" : "#235143") : "#c5a15a"}" title="${escapeHTML(name)}: ${count}"></i>`
    ).join("")}</div>
    <ul class="legend-list">${languages.map(([name, count], index) =>
      `<li><i style="--dot:${index < 2 ? (index ? "#df7049" : "#235143") : "#c5a15a"}"></i><span>${escapeHTML(name)}</span><b>${count}</b></li>`
    ).join("")}</ul>`;

  const scenarios = $("[data-overview-scenarios]");
  const maxScenario = Math.max(...Object.values(summary.scenario_distribution));
  scenarios.classList.remove("loading-block");
  scenarios.innerHTML = `<div class="rank-bars">${Object.entries(summary.scenario_distribution).map(([name, count]) => `
    <div><span>${escapeHTML(name)}</span><i><b style="width:${count / maxScenario * 100}%"></b></i><strong>${count}</strong></div>`).join("")}</div>`;

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

function caseCard(example, index) {
  const accent = ["overlap", "similarity", "acoustics", "turn-taking"][index % 4];
  return `<article class="case-card reveal">
    <div class="case-number">0${index + 1}</div>
    <div class="case-art case-art-${index + 1}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="case-body"><span>${escapeHTML(example.eyebrow)}</span><h3>${escapeHTML(example.title)}</h3><p>${escapeHTML(example.description)}</p>${profilePills(example.conditions, true)}
      <button type="button" class="case-open" data-open-case="${escapeHTML(example.slug)}"><span>Open case</span><small>${escapeHTML(example.clip_duration)} · ${accent}</small><b aria-hidden="true">↗</b></button>
    </div>
  </article>`;
}

function renderCases() {
  const preferred = ["dinner", "podcast", "film", "meeting"];
  const examples = preferred.map(slug => state.core.examples.find(example => example.slug === slug)).filter(Boolean);
  $("[data-case-grid]").innerHTML = examples.map(caseCard).join("");
  $("[data-case-grid]").querySelectorAll(".reveal").forEach(element => element.classList.add("visible"));
}

function speakerColor(speaker, speakers) {
  const index = speakers.indexOf(speaker);
  return ["#df7049", "#235143", "#c5a15a", "#6b9aa0", "#856b79", "#79885c"][index % 6];
}

function openCase(slug) {
  const example = state.core.examples.find(item => item.slug === slug);
  if (!example) return;
  const speakers = [...new Set(example.timeline.map(segment => segment.speaker))];
  const timelineEnd = Math.max(...example.timeline.map(segment => segment.end), 60);
  const timelineRows = speakers.map(speaker => {
    const segments = example.timeline.filter(segment => segment.speaker === speaker);
    return `<div class="timeline-row"><span>${escapeHTML(speaker)}</span><div>${segments.map(segment => `
      <i style="left:${segment.start / timelineEnd * 100}%;width:${Math.max((segment.end - segment.start) / timelineEnd * 100, .8)}%;--speaker:${speakerColor(speaker, speakers)}" title="${segment.start.toFixed(1)}–${segment.end.toFixed(1)} s"></i>`).join("")}</div></div>`;
  }).join("");

  $("[data-dialog-content]").innerHTML = `
    <div class="dialog-head"><span>${escapeHTML(example.eyebrow)}</span><h2 id="case-dialog-title">${escapeHTML(example.title)}</h2><p>${escapeHTML(example.description)}</p>${profilePills(example.conditions)}</div>
    <div class="case-facts"><div><span>Speakers</span><strong>${example.stats.num_speakers}</strong></div><div><span>Overlap</span><strong>${(example.stats.overlap_ratio * 100).toFixed(1)}%</strong></div><div><span>Voice similarity</span><strong>${example.stats.speaker_similarity_max.toFixed(2)}</strong></div><div><span>Turn q25</span><strong>${Math.round(example.stats.speaker_switch_q25 * 1000)} ms</strong></div></div>
    <div class="audio-panel"><div><span>Curated excerpt</span><small>${escapeHTML(example.recording_device)}</small></div><audio controls preload="none" src="${escapeHTML(example.audio)}">Your browser does not support audio playback.</audio></div>
    <div class="timeline-panel"><div class="timeline-head"><span>Reference speaker timeline</span><small>First minute shown</small></div>${timelineRows}<div class="timeline-axis"><span>0 s</span><span>15</span><span>30</span><span>45</span><span>60 s</span></div></div>
    <div class="transcript-panel"><div class="timeline-head"><span>Reference excerpt</span><small>Scroll to inspect</small></div><div class="transcript-scroll">${example.timeline.map(segment => `
      <div class="transcript-line"><time>${segment.start.toFixed(1)}–${segment.end.toFixed(1)}</time><b style="--speaker:${speakerColor(segment.speaker, speakers)}">${escapeHTML(segment.speaker)}</b><p>${escapeHTML(segment.text.replace(/<sil>|<pause>|<\$>/g, " "))}</p></div>`).join("")}</div></div>`;

  const dialog = $("[data-case-dialog]");
  dialog.showModal();
  document.body.classList.add("dialog-open");
}

function closeCase() {
  const dialog = $("[data-case-dialog]");
  const audio = $("audio", dialog);
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  dialog.close();
  $("[data-dialog-content]").replaceChildren();
  document.body.classList.remove("dialog-open");
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
  const sourceCounts = counts(matched, "source_dataset");
  $("[data-source-count]").textContent = Object.keys(sourceCounts).length;
  $("[data-source-summary]").textContent = listSummary(sourceCounts);
  $("[data-language-summary]").textContent = listSummary(counts(matched, "language"));
  $("[data-scenario-summary]").textContent = listSummary(counts(matched, "scenario"));

  const curatedIDs = new Set(matched.map(item => item.recording_id));
  const curated = state.core.examples.filter(example => curatedIDs.has(example.recording_id)).slice(0, 2);
  const representative = $("[data-representatives]");
  if (curated.length) {
    representative.innerHTML = curated.map(example => `<article><div><span>${escapeHTML(example.eyebrow)}</span><h4>${escapeHTML(example.title)}</h4>${profilePills(example.conditions, true)}</div><button type="button" data-open-case="${escapeHTML(example.slug)}">Listen <span aria-hidden="true">→</span></button></article>`).join("");
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
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadMetadata();
        observer.disconnect();
      }
    }, { rootMargin: "250px" });
    observer.observe(explorer);
  } else loadMetadata();
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

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-open-case]");
    if (trigger) openCase(trigger.dataset.openCase);
  });
  $("[data-dialog-close]").addEventListener("click", closeCase);
  $("[data-case-dialog]").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeCase();
  });
  $("[data-case-dialog]").addEventListener("cancel", event => {
    event.preventDefault();
    closeCase();
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
