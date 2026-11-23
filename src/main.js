import "./style.css";
import { PROGRAMMES } from "./data.js";
import {
  GRADE_OPTIONS,
  GRADE_SCALE,
  GPA_GRADES,
  gradePoints,
  marksToGrade,
  round2,
  computeGpa,
  creditsEarned,
  classFor,
  CLASS_FLOORS,
  GRADUATION_CREDITS,
  GRADUATION_FGPA,
  compulsoryGpaCredits,
  requiredAverage,
} from "./gpa.js";

const STORAGE_KEY = "uovt-gpa-calculator-v1";

const defaultState = () => ({
  programme: "multimedia",
  entries: {}, // { [moduleCode]: { grade, marks } }
  custom: [], // { id, programme, semesterId, code, title, credits, gpa, type }
  openSemesters: {}, // { [semesterId]: boolean } — default true if missing
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function allModules(programmeKey) {
  const programme = PROGRAMMES[programmeKey];
  const base = programme.semesters.flatMap((s) =>
    s.modules.map((m) => ({ ...m, semesterId: s.id }))
  );
  const custom = state.custom
    .filter((c) => c.programme === programmeKey)
    .map((c) => ({ ...c, semesterId: c.semesterId }));
  return [...base, ...custom];
}

function semesterModules(programmeKey, semesterId) {
  const programme = PROGRAMMES[programmeKey];
  const sem = programme.semesters.find((s) => s.id === semesterId);
  const base = sem.modules.map((m) => ({ ...m, semesterId }));
  const custom = state.custom
    .filter((c) => c.programme === programmeKey && c.semesterId === semesterId)
    .map((c) => ({ ...c, semesterId }));
  return [...base, ...custom];
}

function nearestGradeLabel(needed) {
  if (needed === null) return "";
  if (needed > 4.0) return "not possible on the credits left";
  if (needed <= 0) return "already there";
  const row = GRADE_SCALE.find((r) => r.points >= needed);
  if (!row) return "";
  return `roughly a ${row.grade} (${row.points.toFixed(1)})`;
}

// Group semesters by year
const YEAR_LABELS = {
  y1: "Year 1",
  y2: "Year 2",
  y3: "Year 3",
};

function groupByYear(semesters) {
  const groups = {};
  for (const sem of semesters) {
    const year = sem.id.slice(0, 2); // "y1", "y2", "y3"
    if (!groups[year]) groups[year] = [];
    groups[year].push(sem);
  }
  return groups;
}

function gradedCount(mods, entries) {
  return mods.filter((m) => entries[m.code]?.grade).length;
}

function render() {
  const programme = PROGRAMMES[state.programme];
  const modules = allModules(state.programme);
  const overall = computeGpa(modules, state.entries);
  const earned = creditsEarned(modules, state.entries);
  const cls = classFor(overall.gpa);
  const totalCompulsory = compulsoryGpaCredits(programme);
  const yearGroups = groupByYear(programme.semesters);

  // Progress: how many modules have a grade
  const totalMods = modules.length;
  const gradedMods = gradedCount(modules, state.entries);
  const progressPct = totalMods > 0 ? Math.round((gradedMods / totalMods) * 100) : 0;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="layout-shell">

      <!-- ── Sidebar ─────────────────────────────────────────────────── -->
      <aside class="sidebar" aria-label="Summary and navigation">

        <header class="page-head">
          <h1>UOVT GPA Calculator</h1>
          <p class="subtitle">B.Tech &mdash; Handbook 2023&ndash;24</p>
        </header>

        <!-- Programme switcher -->
        <nav class="programme-tabs" aria-label="Degree programme">
          ${Object.entries(PROGRAMMES)
            .map(
              ([key, p]) =>
                `<button type="button" class="tab${key === state.programme ? " active" : ""}" data-programme="${key}">${esc(p.short)}</button>`
            )
            .join("")}
        </nav>
        <p class="programme-name">${esc(programme.label)}</p>

        <!-- FGPA hero -->
        <div class="stat-hero card">
          <span class="label">Final GPA</span>
          <span class="fgpa-value">${overall.gpa === null ? "—" : overall.gpa.toFixed(2)}</span>
          <span class="fgpa-class">${cls ? esc(cls) : "Enter grades to begin"}</span>
        </div>

        <!-- Download Result Sheet Button -->
        <button type="button" id="download-result-btn" class="btn-download" title="Download official result sheet as PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download Result Sheet</span>
        </button>

        <!-- Secondary stats -->
        <div class="stat-grid">
          <div class="stat-cell">
            <span class="label">Grade points</span>
            <span class="stat-val">${overall.points.toFixed(1)}</span>
            <span class="stat-sub">${overall.credits} credits graded</span>
          </div>
          <div class="stat-cell">
            <span class="label">Credits earned</span>
            <span class="stat-val">${earned}<span class="stat-denom"> / ${GRADUATION_CREDITS}</span></span>
            <span class="stat-sub">Need ${GRADUATION_FGPA.toFixed(2)} FGPA to graduate</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-wrap" aria-label="Grading progress">
          <div class="progress-label">
            <span>Modules graded</span>
            <span>${gradedMods} / ${totalMods}</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" style="width:${progressPct}%"></div>
          </div>
        </div>

        <!-- Target class planner -->
        <div class="planner-box" aria-label="Target class planner">
          <p class="planner-heading">What do I need for&hellip;</p>
          <div class="planner-row">
            <select id="target-class">
              ${CLASS_FLOORS.map((c) => `<option value="${c.floor}">${esc(c.name)} (${c.floor.toFixed(2)}+)</option>`).join("")}
            </select>
          </div>
          <p id="planner-result" class="planner-result"></p>
        </div>

        <!-- Semester jump nav -->
        <nav class="sem-nav" aria-label="Jump to semester">
          <p class="sem-nav-heading">Jump to semester</p>
          ${Object.entries(yearGroups).map(([year, sems]) => `
            <div class="sem-nav-year">
              <span class="sem-nav-year-label">${YEAR_LABELS[year] || year}</span>
              ${sems.map((sem) => {
                const mods = semesterModules(state.programme, sem.id);
                const sgpa = computeGpa(mods, state.entries);
                const short = sem.label.replace(/Year \d+ — /, "").replace("Semester ", "Sem ");
                return `<a class="sem-nav-link" href="#sem-${sem.id}">
                  <span class="sem-nav-label">${esc(short)}</span>
                  <span class="sem-nav-sgpa">${sgpa.gpa === null ? "—" : sgpa.gpa.toFixed(2)}</span>
                </a>`;
              }).join("")}
            </div>
          `).join("")}
        </nav>

        <!-- Reset -->
        <div class="sidebar-footer">
          <button type="button" id="reset-btn" class="danger">Clear all grades</button>
        </div>

      </aside>

      <!-- ── Main content ─────────────────────────────────────────────── -->
      <main class="main-content ${gradedMods > 0 ? "has-entered-grades" : ""}" id="semesters">

        <!-- Print-only official result sheet header -->
        <header class="print-only print-header">
          <div class="print-uni-title">UNIVERSITY OF VOCATIONAL TECHNOLOGY</div>
          <div class="print-faculty">Faculty of Information Technology &bull; B.Tech Degree Programme</div>
          <h1 class="print-doc-title">Official Student Result Sheet</h1>
          <div class="print-meta-grid">
            <div class="print-meta-item">
              <span class="print-meta-label">Programme:</span>
              <span class="print-meta-val">${esc(programme.label)}</span>
            </div>
            <div class="print-meta-item">
              <span class="print-meta-label">Date Generated:</span>
              <span class="print-meta-val">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div class="print-meta-item">
              <span class="print-meta-label">Final GPA (FGPA):</span>
              <span class="print-meta-val print-highlight">${overall.gpa === null ? "N/A" : overall.gpa.toFixed(2)}</span>
            </div>
            <div class="print-meta-item">
              <span class="print-meta-label">Academic Award:</span>
              <span class="print-meta-val print-highlight">${cls ? esc(cls) : "In Progress"}</span>
            </div>
            <div class="print-meta-item">
              <span class="print-meta-label">Credits Earned:</span>
              <span class="print-meta-val">${earned} / ${GRADUATION_CREDITS}</span>
            </div>
            <div class="print-meta-item">
              <span class="print-meta-label">Grade Points Total:</span>
              <span class="print-meta-val">${overall.points.toFixed(1)} (${overall.credits} GPA Credits Graded)</span>
            </div>
          </div>
        </header>

        ${Object.entries(yearGroups).map(([year, sems]) => `
          <div class="year-group" id="year-${year}">
            <h2 class="year-label">${YEAR_LABELS[year] || year}</h2>

            ${sems.map((sem) => {
              const mods = semesterModules(state.programme, sem.id);
              const sgpa = computeGpa(mods, state.entries);
              const graded = gradedCount(mods, state.entries);
              const isOpen = state.openSemesters?.[sem.id] !== false; // default open

              return `
              <section class="semester-accordion ${isOpen ? "is-open" : ""} ${graded > 0 ? "has-entered-results" : "no-results"}" id="sem-${sem.id}" data-semester="${sem.id}">
                <button type="button" class="sem-toggle" aria-expanded="${isOpen}" data-sem-toggle="${sem.id}">
                  <span class="sem-toggle-title">${esc(sem.label)}</span>
                  <span class="sem-toggle-meta">
                    <span class="sem-graded">${graded}/${mods.length} graded</span>
                    <span class="sgpa-badge"><span class="sgpa-badge-label">SGPA</span> <strong>${sgpa.gpa === null ? "—" : sgpa.gpa.toFixed(2)}</strong></span>
                    <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </button>

                <div class="sem-body">
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Module</th>
                        <th class="col-credits">Cr.</th>
                        <th class="col-type">Type</th>
                        <th class="col-grade">Grade</th>
                        <th class="col-points">Pts</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${mods.map((mod) => {
                        const entry = state.entries[mod.code] || {};
                        const pts = entry.grade && GPA_GRADES.has(entry.grade)
                          ? round2(mod.credits * gradePoints(entry.grade))
                          : null;
                        const isCustom = state.custom.some((c) => c.code === mod.code && c.programme === state.programme);
                        const isGraded = Boolean(entry.grade);
                        return `
                        <tr data-code="${esc(mod.code)}" class="${mod.gpa ? "" : "non-gpa"}${mod.type === "E" ? " elective" : ""}${isGraded ? " is-graded" : " is-ungraded"}">
                          <td class="code">${esc(mod.code)}</td>
                          <td class="title">${esc(mod.title)}</td>
                          <td class="credits col-credits">${mod.credits}</td>
                          <td class="type col-type">${mod.gpa ? "GPA" : "Non-GPA"}${mod.type === "E" ? " &middot; Elective" : ""}</td>
                          <td class="col-grade">
                            <select class="grade" data-code="${esc(mod.code)}" aria-label="Grade for ${esc(mod.code)}">
                              ${GRADE_OPTIONS.map(
                                (g) => `<option value="${g}" ${entry.grade === g ? "selected" : ""}>${g === "" ? "—" : g}</option>`
                              ).join("")}
                            </select>
                          </td>
                          <td class="points col-points">${pts === null ? "—" : pts.toFixed(1)}</td>
                          <td>${isCustom ? `<button type="button" class="remove-custom" data-code="${esc(mod.code)}" title="Remove custom module">&times;</button>` : ""}</td>
                        </tr>`;
                      }).join("")}
                    </tbody>
                    <tfoot>
                      <tr class="semester-summary-row">
                        <td colspan="2" class="sem-sum-title">Semester Total</td>
                        <td class="col-credits sem-sum-cr">${sgpa.credits} Cr</td>
                        <td class="col-type"></td>
                        <td class="col-grade sem-sum-sgpa-lbl">SGPA:</td>
                        <td class="col-points sem-sum-sgpa-val">${sgpa.gpa === null ? "—" : sgpa.gpa.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>

                  <details class="add-custom">
                    <summary>Add a module to this semester</summary>
                    <form class="custom-form" data-semester="${sem.id}">
                      <input type="text" name="code" placeholder="Code (e.g. IT404999)" required>
                      <input type="text" name="title" placeholder="Module title" required>
                      <input type="number" name="credits" min="1" max="20" step="1" placeholder="Credits" required>
                      <select name="gpa">
                        <option value="gpa">GPA module</option>
                        <option value="ng">Non-GPA module</option>
                      </select>
                      <select name="type">
                        <option value="C">Compulsory</option>
                        <option value="E">Elective</option>
                      </select>
                      <button type="submit">Add</button>
                    </form>
                  </details>
                </div>
              </section>`;
            }).join("")}
          </div>
        `).join("")}

        <!-- Grade reference — collapsed by default -->
        <details class="reference-accordion">
          <summary class="reference-toggle">
            <span>Grade scale &mdash; Student Handbook 2023&ndash;24</span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </summary>
          <div class="reference-body card">
            <table class="scale-table">
              <thead><tr><th>Marks</th><th>Grade</th><th>Grade points</th></tr></thead>
              <tbody>
                ${GRADE_SCALE.map(
                  (r) => `<tr><td>${r.min}&ndash;${r.max}</td><td>${r.grade}</td><td>${r.points.toFixed(1)}</td></tr>`
                ).join("")}
                <tr><td>—</td><td>I (Incomplete)</td><td>No points &mdash; excluded from GPA</td></tr>
                <tr><td>—</td><td>Pass</td><td>No points &mdash; excluded from GPA, earns credits</td></tr>
              </tbody>
            </table>
            <ul class="notes">
              <li>SGPA = &Sigma;(credits &times; grade points) &divide; &Sigma;(credits) for the semester, rounded to 2 decimals. FGPA is the same over the whole degree.</li>
              <li>Only GPA (G) modules count. Non-GPA modules are shown but never enter the maths.</li>
              <li>Elective modules count only once you enter a grade for them &mdash; ungraded electives never enter the denominator.</li>
              <li>A grade of D or above earns the module's credits. F earns no credits and counts as 0.0 grade points over its credits.</li>
              <li>Graduation needs a minimum of 180 total credits and FGPA &ge; 2.00.</li>
              <li>Your entries are saved in this browser (local storage).</li>
            </ul>
          </div>
        </details>

        <footer>
          <p>Built from the UOVT Student Handbook 2023&ndash;24. Check your numbers against your official transcript.</p>
        </footer>

      </main>
    </div>
  `;

  updatePlanner();
  bindEvents();
}

function updatePlanner() {
  const select = document.getElementById("target-class");
  const result = document.getElementById("planner-result");
  if (!select || !result) return;
  const floor = Number(select.value);
  const programme = PROGRAMMES[state.programme];
  const { needed, remainingCredits } = requiredAverage(programme, state.entries, floor);
  if (remainingCredits === 0) {
    result.textContent = "No compulsory GPA credits left — your FGPA is final.";
    return;
  }
  if (needed > 4.0) {
    result.textContent = `Need ${needed.toFixed(2)} avg on ${remainingCredits} remaining credits — not achievable.`;
  } else if (needed <= 0) {
    result.textContent = `Already above this class on grades so far (${remainingCredits} credits still to go).`;
  } else {
    result.textContent = `Need avg ${needed.toFixed(2)} — ${nearestGradeLabel(needed)} — on ${remainingCredits} remaining compulsory GPA credits.`;
  }
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.programme = btn.dataset.programme;
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll("select.grade").forEach((sel) => {
    sel.addEventListener("change", () => {
      const code = sel.dataset.code;
      const entry = state.entries[code] || {};
      entry.grade = sel.value;
      state.entries[code] = entry;
      saveState();
      render();
    });
  });

  document.querySelectorAll(".remove-custom").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      state.custom = state.custom.filter(
        (c) => !(c.code === code && c.programme === state.programme)
      );
      delete state.entries[code];
      saveState();
      render();
    });
  });

  document.querySelectorAll(".custom-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const code = String(data.get("code")).trim().toUpperCase();
      const title = String(data.get("title")).trim();
      const credits = Number(data.get("credits"));
      const gpa = data.get("gpa") === "gpa";
      const type = data.get("type") === "E" ? "E" : "C";
      const semesterId = form.dataset.semester;
      if (!code || !title || !credits || credits < 1) return;
      const exists = allModules(state.programme).some((m) => m.code === code);
      if (exists) {
        alert(`A module with code ${code} already exists in this programme.`);
        return;
      }
      state.custom.push({
        id: `${state.programme}-${semesterId}-${code}`,
        programme: state.programme,
        semesterId,
        code,
        title,
        credits,
        gpa,
        type,
      });
      saveState();
      render();
    });
  });

  // Semester accordion toggles
  document.querySelectorAll("[data-sem-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const semId = btn.dataset.semToggle;
      const isOpen = state.openSemesters?.[semId] !== false;
      state.openSemesters = state.openSemesters || {};
      state.openSemesters[semId] = !isOpen;
      saveState();
      render();
    });
  });

  const downloadBtn = document.getElementById("download-result-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      // Temporarily expand all semester accordions so full transcript is printed
      document.querySelectorAll(".semester-accordion").forEach((el) => {
        el.classList.add("is-open");
      });
      window.print();
    });
  }

  const target = document.getElementById("target-class");
  if (target) target.addEventListener("change", updatePlanner);

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const programme = PROGRAMMES[state.programme];
      if (!confirm(`Clear every grade and custom module for ${programme.short}?`)) return;
      const codes = new Set(allModules(state.programme).map((m) => m.code));
      for (const code of codes) delete state.entries[code];
      state.custom = state.custom.filter((c) => c.programme !== state.programme);
      saveState();
      render();
    });
  }
}

render();
