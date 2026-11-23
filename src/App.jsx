import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PROGRAMMES } from './data.js';
import {
  GRADE_SCALE,
  GPA_GRADES,
  gradePoints,
  round2,
  computeGpa,
  creditsEarned,
  classFor,
  CLASS_FLOORS,
  GRADUATION_CREDITS,
  GRADUATION_FGPA,
  requiredAverage,
} from './gpa.js';

const STORAGE_KEY = 'uovt-gpa-calculator-v1';

const YEAR_LABELS = {
  y1: 'Year 1',
  y2: 'Year 2',
  y3: 'Year 3',
};

function defaultState() {
  return {
    programme: 'multimedia',
    entries: {},
    custom: [],
    openSemesters: {},
    targetFloor: 3.7,
  };
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export default function App() {
  const [appState, setAppState] = useState(loadSavedState);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [statusMode, setStatusMode] = useState('saved');
  const [lastEditedCode, setLastEditedCode] = useState(null);
  const [gpaDelta, setGpaDelta] = useState(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevGpaRef = useRef(null);

  const { programme: progKey, entries, custom, openSemesters, targetFloor } = appState;

  // Persist state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      setStatusMode('saved');
    } catch (err) {
      console.warn('Storage error:', err);
    }
  }, [appState]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const programme = PROGRAMMES[progKey] || PROGRAMMES.multimedia;

  // Compute all modules (catalogue + custom)
  const allProgrammeModules = useMemo(() => {
    const base = programme.semesters.flatMap((s) =>
      s.modules.map((m) => ({ ...m, semesterId: s.id }))
    );
    const customMods = custom
      .filter((c) => c.programme === progKey)
      .map((c) => ({ ...c, semesterId: c.semesterId }));
    return [...base, ...customMods];
  }, [programme, custom, progKey]);

  // Overall results
  const overall = useMemo(() => computeGpa(allProgrammeModules, entries), [allProgrammeModules, entries]);
  const earned = useMemo(() => creditsEarned(allProgrammeModules, entries), [allProgrammeModules, entries]);
  const awardClass = useMemo(() => classFor(overall.gpa), [overall.gpa]);

  // Live FGPA change detection & visual pulse
  useEffect(() => {
    if (prevGpaRef.current !== null && overall.gpa !== null) {
      const diff = round2(overall.gpa - prevGpaRef.current);
      if (diff !== 0) {
        setGpaDelta(diff);
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 1400);
        return () => clearTimeout(timer);
      }
    } else if (prevGpaRef.current === null && overall.gpa !== null) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1400);
      return () => clearTimeout(timer);
    }
    prevGpaRef.current = overall.gpa;
  }, [overall.gpa]);

  // Progress stats
  const totalMods = allProgrammeModules.length;
  const gradedMods = useMemo(() => allProgrammeModules.filter((m) => entries[m.code]?.grade).length, [allProgrammeModules, entries]);
  const progressPct = totalMods > 0 ? Math.round((gradedMods / totalMods) * 100) : 0;

  // Group semesters by year
  const yearGroups = useMemo(() => {
    const groups = {};
    for (const sem of programme.semesters) {
      const year = sem.id.slice(0, 2);
      if (!groups[year]) groups[year] = [];
      groups[year].push(sem);
    }
    return groups;
  }, [programme]);

  // Planner calculations
  const plannerResultText = useMemo(() => {
    const { needed, remainingCredits } = requiredAverage(programme, entries, targetFloor);
    if (remainingCredits === 0) {
      return 'No compulsory GPA credits left — your FGPA is final.';
    }
    if (needed > 4.0) {
      return `Need ${needed.toFixed(2)} avg on ${remainingCredits} remaining credits — not achievable.`;
    }
    if (needed <= 0) {
      return `Already above this class on grades so far (${remainingCredits} credits still to go).`;
    }
    const row = GRADE_SCALE.find((r) => r.points >= needed);
    const approx = row ? `roughly a ${row.grade} (${row.points.toFixed(1)})` : '';
    return `Need avg ${needed.toFixed(2)} — ${approx} — on ${remainingCredits} remaining compulsory GPA credits.`;
  }, [programme, entries, targetFloor]);

  // Actions
  const handleProgrammeChange = useCallback((key) => {
    prevGpaRef.current = null;
    setGpaDelta(null);
    setIsPulsing(false);
    setAppState((prev) => ({ ...prev, programme: key }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleGradeChange = useCallback((code, grade) => {
    setStatusMode('saving');
    setLastEditedCode(code);
    setAppState((prev) => {
      const nextEntries = { ...prev.entries };
      if (!grade) {
        delete nextEntries[code];
      } else {
        nextEntries[code] = { ...nextEntries[code], grade };
      }
      return { ...prev, entries: nextEntries };
    });
  }, []);

  const handleToggleSemester = useCallback((semId) => {
    setAppState((prev) => {
      const current = prev.openSemesters?.[semId] !== false;
      return {
        ...prev,
        openSemesters: {
          ...prev.openSemesters,
          [semId]: !current,
        },
      };
    });
  }, []);

  const handleTargetFloorChange = useCallback((e) => {
    const val = Number(e.target.value);
    setAppState((prev) => ({ ...prev, targetFloor: val }));
  }, []);

  const handleAddCustomModule = useCallback((e, semesterId) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const code = String(data.get('code')).trim().toUpperCase();
    const title = String(data.get('title')).trim();
    const credits = Number(data.get('credits'));
    const gpa = data.get('gpa') === 'gpa';
    const type = data.get('type') === 'E' ? 'E' : 'C';

    if (!code || !title || !credits || credits < 1) return;
    const exists = allProgrammeModules.some((m) => m.code === code);
    if (exists) {
      alert(`A module with code ${code} already exists in this programme.`);
      return;
    }

    setAppState((prev) => ({
      ...prev,
      custom: [
        ...prev.custom,
        {
          id: `${progKey}-${semesterId}-${code}`,
          programme: progKey,
          semesterId,
          code,
          title,
          credits,
          gpa,
          type,
        },
      ],
    }));
    form.reset();
  }, [allProgrammeModules, progKey]);

  const handleRemoveCustomModule = useCallback((code) => {
    setAppState((prev) => {
      const nextCustom = prev.custom.filter(
        (c) => !(c.code === code && c.programme === prev.programme)
      );
      const nextEntries = { ...prev.entries };
      delete nextEntries[code];
      return { ...prev, custom: nextCustom, entries: nextEntries };
    });
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm(`Clear every grade and custom module for ${programme.short}?`)) return;
    prevGpaRef.current = null;
    setGpaDelta(null);
    setIsPulsing(false);
    setAppState((prev) => {
      const codes = new Set(allProgrammeModules.map((m) => m.code));
      const nextEntries = { ...prev.entries };
      for (const code of codes) delete nextEntries[code];
      const nextCustom = prev.custom.filter((c) => c.programme !== prev.programme);
      return { ...prev, entries: nextEntries, custom: nextCustom };
    });
  }, [programme, allProgrammeModules]);

  const handleDownloadResultSheet = useCallback(() => {
    // Open all semesters for printing
    setAppState((prev) => {
      const allOpen = {};
      programme.semesters.forEach((s) => { allOpen[s.id] = true; });
      return { ...prev, openSemesters: allOpen };
    });
    setTimeout(() => {
      window.print();
    }, 80);
  }, [programme]);

  return (
    <div className="layout-shell">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="sidebar" aria-label="Summary and navigation">
        <header className="page-head">
          <h1>UOVT GPA Calculator</h1>
          <p className="subtitle">B.Tech &mdash; Handbook 2023&ndash;24</p>
          <div
            className="storage-status"
            title="All entered grades, selections, and custom modules are saved automatically in your browser."
          >
            <span className={`status-dot ${isOnline ? statusMode : 'offline'}`} />
            <span className="status-text" id="status-text">
              {isOnline
                ? statusMode === 'saving'
                  ? 'Saving progress...'
                  : 'Auto-saved • Safe offline'
                : 'Offline • Saved locally'}
            </span>
          </div>
        </header>

        {/* Programme switcher */}
        <nav className="programme-tabs" aria-label="Degree programme">
          {Object.entries(PROGRAMMES).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className={`tab ${key === progKey ? 'active' : ''}`}
              onClick={() => handleProgrammeChange(key)}
            >
              {p.short}
            </button>
          ))}
        </nav>
        <p className="programme-name">{programme.label}</p>

        {/* FGPA hero stat */}
        <div className={`stat-hero card ${isPulsing ? 'is-pulsing' : ''}`}>
          <div className="stat-hero-top">
            <span className="label">Final GPA</span>
            <span className="live-indicator-badge">
              <span className="live-dot" /> LIVE
            </span>
          </div>
          <div className="stat-hero-val-row">
            <span className="fgpa-value" key={overall.gpa ?? 'empty'}>
              {overall.gpa === null ? '—' : overall.gpa.toFixed(2)}
            </span>
            {gpaDelta !== null && isPulsing && (
              <span className={`fgpa-delta-pill ${gpaDelta > 0 ? 'pos' : 'neg'}`}>
                {gpaDelta > 0 ? `+${gpaDelta.toFixed(2)}` : gpaDelta.toFixed(2)}
              </span>
            )}
          </div>
          <span className="fgpa-class">
            {awardClass || 'Enter grades to begin'}
          </span>
        </div>

        {/* Download Result Sheet Button */}
        <button
          type="button"
          id="download-result-btn"
          className="btn-download"
          title="Download official result sheet as PDF"
          onClick={handleDownloadResultSheet}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download Result Sheet</span>
        </button>

        {/* Secondary stats */}
        <div className="stat-grid">
          <div className="stat-cell">
            <span className="label">Grade points</span>
            <span className="stat-val">{overall.points.toFixed(1)}</span>
            <span className="stat-sub">{overall.credits} credits graded</span>
          </div>
          <div className="stat-cell">
            <span className="label">Credits earned</span>
            <span className="stat-val">
              {earned}
              <span className="stat-denom"> / {GRADUATION_CREDITS}</span>
            </span>
            <span className="stat-sub">
              Need {GRADUATION_FGPA.toFixed(2)} FGPA to graduate
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-wrap" aria-label="Grading progress">
          <div className="progress-label">
            <span>Modules graded</span>
            <span>{gradedMods} / {totalMods}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Target class planner */}
        <div className="planner-box" aria-label="Target class planner">
          <p className="planner-heading">What do I need for&hellip;</p>
          <div className="planner-row">
            <select
              id="target-class"
              value={targetFloor}
              onChange={handleTargetFloorChange}
            >
              {CLASS_FLOORS.map((c) => (
                <option key={c.floor} value={c.floor}>
                  {c.name} ({c.floor.toFixed(2)}+)
                </option>
              ))}
            </select>
          </div>
          <p id="planner-result" className="planner-result">
            {plannerResultText}
          </p>
        </div>

        {/* Semester jump nav */}
        <nav className="sem-nav" aria-label="Jump to semester">
          <p className="sem-nav-heading">Jump to semester</p>
          {Object.entries(yearGroups).map(([year, sems]) => (
            <div className="sem-nav-year" key={year}>
              <span className="sem-nav-year-label">{YEAR_LABELS[year] || year}</span>
              {sems.map((sem) => {
                const baseSemMods = sem.modules.map((m) => ({ ...m, semesterId: sem.id }));
                const customSemMods = custom
                  .filter((c) => c.programme === progKey && c.semesterId === sem.id)
                  .map((c) => ({ ...c, semesterId: sem.id }));
                const mods = [...baseSemMods, ...customSemMods];
                const sgpa = computeGpa(mods, entries);
                const short = sem.label.replace(/Year \d+ — /, '').replace('Semester ', 'Sem ');
                return (
                  <a className="sem-nav-link" href={`#sem-${sem.id}`} key={sem.id}>
                    <span className="sem-nav-label">{short}</span>
                    <span className="sem-nav-sgpa">
                      {sgpa.gpa === null ? '—' : sgpa.gpa.toFixed(2)}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Reset Button */}
        <div className="sidebar-footer">
          <button type="button" id="reset-btn" className="danger" onClick={handleReset}>
            Clear all grades
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className={`main-content ${gradedMods > 0 ? 'has-entered-grades' : ''}`} id="semesters">
        {/* Print-only official result sheet header */}
        <header className="print-only print-header">
          <div className="print-uni-title">UNIVERSITY OF VOCATIONAL TECHNOLOGY</div>
          <div className="print-faculty">
            Faculty of Information Technology &bull; B.Tech Degree Programme
          </div>
          <h1 className="print-doc-title">Official Student Result Sheet</h1>
          <div className="print-meta-grid">
            <div className="print-meta-item">
              <span className="print-meta-label">Programme:</span>
              <span className="print-meta-val">{programme.label}</span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Date Generated:</span>
              <span className="print-meta-val">
                {new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Final GPA (FGPA):</span>
              <span className="print-meta-val print-highlight">
                {overall.gpa === null ? 'N/A' : overall.gpa.toFixed(2)}
              </span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Academic Award:</span>
              <span className="print-meta-val print-highlight">
                {awardClass || 'In Progress'}
              </span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Credits Earned:</span>
              <span className="print-meta-val">
                {earned} / {GRADUATION_CREDITS}
              </span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Grade Points Total:</span>
              <span className="print-meta-val">
                {overall.points.toFixed(1)} ({overall.credits} GPA Credits Graded)
              </span>
            </div>
          </div>
        </header>

        {/* ── Prominent On-Screen Final GPA Hero Banner ───────────────────── */}
        <section className={`screen-fgpa-banner card ${isPulsing ? 'is-pulsing' : ''}`} aria-label="Final Cumulative GPA Overview">
          <div className="banner-left">
            <div className="banner-tag">
              <span className="live-dot" />
              <span>UOVT Degree Performance • Handbook 2023–24</span>
            </div>
            <h2 className="banner-title">{programme.label}</h2>
            <div className="banner-sub">
              <span><strong>{gradedMods}</strong> of {totalMods} modules graded</span> &bull;{' '}
              <span><strong>{earned}</strong> / {GRADUATION_CREDITS} credits earned</span>
            </div>
          </div>
          <div className={`fgpa-display-box ${isPulsing ? 'is-pulsing' : ''}`}>
            <span className="box-label">FINAL CUMULATIVE GPA</span>
            <div className="box-val-row">
              <span className="box-val" key={overall.gpa ?? 'empty'}>
                {overall.gpa === null ? '—' : overall.gpa.toFixed(2)}
              </span>
              {gpaDelta !== null && isPulsing && (
                <span className={`box-delta ${gpaDelta > 0 ? 'pos' : 'neg'}`}>
                  {gpaDelta > 0 ? `+${gpaDelta.toFixed(2)}` : gpaDelta.toFixed(2)}
                </span>
              )}
            </div>
            <div className="box-award">
              {awardClass || 'Enter grades to begin'}
            </div>
          </div>
        </section>

        {/* Semester Accordions grouped by year */}
        {Object.entries(yearGroups).map(([year, sems]) => (
          <div className="year-group" id={`year-${year}`} key={year}>
            <h2 className="year-label">{YEAR_LABELS[year] || year}</h2>

            {sems.map((sem) => {
              const baseSemMods = sem.modules.map((m) => ({ ...m, semesterId: sem.id }));
              const customSemMods = custom
                .filter((c) => c.programme === progKey && c.semesterId === sem.id)
                .map((c) => ({ ...c, semesterId: sem.id }));
              const mods = [...baseSemMods, ...customSemMods];
              const sgpa = computeGpa(mods, entries);
              const gradedCount = mods.filter((m) => entries[m.code]?.grade).length;
              const isOpen = openSemesters[sem.id] !== false;

              return (
                <section
                  key={sem.id}
                  className={`semester-accordion ${isOpen ? 'is-open' : ''} ${gradedCount > 0 ? 'has-entered-results' : 'no-results'}`}
                  id={`sem-${sem.id}`}
                  data-semester={sem.id}
                >
                  <button
                    type="button"
                    className="sem-toggle"
                    aria-expanded={isOpen}
                    onClick={() => handleToggleSemester(sem.id)}
                  >
                    <span className="sem-toggle-title">{sem.label}</span>
                    <span className="sem-toggle-meta">
                      <span className="sem-graded">
                        {gradedCount}/{mods.length} graded
                      </span>
                      <span className="sgpa-badge">
                        <span className="sgpa-badge-label">SGPA</span>{' '}
                        <strong>{sgpa.gpa === null ? '—' : sgpa.gpa.toFixed(2)}</strong>
                      </span>
                      <span className={`fgpa-badge ${isPulsing ? 'is-pulsing' : ''}`}>
                        <span className="fgpa-badge-label">FGPA</span>{' '}
                        <strong>{overall.gpa === null ? '—' : overall.gpa.toFixed(2)}</strong>
                      </span>
                      <svg
                        className="chevron"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div className="sem-body">
                    <table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Module</th>
                          <th className="col-credits">Cr.</th>
                          <th className="col-type">Type</th>
                          <th className="col-grade">Grade</th>
                          <th className="col-points">Pts</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {mods.map((mod) => {
                          const entry = entries[mod.code] || {};
                          const pts =
                            entry.grade && GPA_GRADES.has(entry.grade)
                              ? round2(mod.credits * gradePoints(entry.grade))
                              : null;
                          const isCustom = custom.some(
                            (c) => c.code === mod.code && c.programme === progKey
                          );
                          const isGraded = Boolean(entry.grade);
                          const gradeClass = entry.grade
                            ? `grade-${entry.grade.replace('+', '-plus').replace('-', '-minus').toLowerCase()}`
                            : 'grade-empty';

                          return (
                            <tr
                              key={mod.code}
                              data-code={mod.code}
                              className={`${mod.gpa ? '' : 'non-gpa'}${mod.type === 'E' ? ' elective' : ''}${isGraded ? ' is-graded' : ' is-ungraded'}${lastEditedCode === mod.code ? ' is-recently-edited' : ''}`}
                            >
                              <td className="code">{mod.code}</td>
                              <td className="title">{mod.title}</td>
                              <td className="credits col-credits">{mod.credits}</td>
                              <td className="type col-type">
                                {mod.gpa ? 'GPA' : 'Non-GPA'}
                                {mod.type === 'E' ? ' · Elective' : ''}
                              </td>
                              <td className="col-grade">
                                <div
                                  className={`grade-picker-wrap ${isGraded ? 'has-grade ' + gradeClass : 'is-empty'}`}
                                >
                                  <select
                                    className="grade"
                                    value={entry.grade || ''}
                                    onChange={(e) => handleGradeChange(mod.code, e.target.value)}
                                    aria-label={`Grade for ${mod.code}`}
                                  >
                                    <option value="">— Grade —</option>
                                    <optgroup label="Honors & Passing Grades (GPA)">
                                      <option value="A+">A+ (4.0)</option>
                                      <option value="A">A (4.0)</option>
                                      <option value="A-">A− (3.7)</option>
                                      <option value="B+">B+ (3.3)</option>
                                      <option value="B">B (3.0)</option>
                                      <option value="B-">B− (2.7)</option>
                                      <option value="C+">C+ (2.3)</option>
                                      <option value="C">C (2.0)</option>
                                      <option value="C-">C− (1.7)</option>
                                      <option value="D+">D+ (1.3)</option>
                                      <option value="D">D (1.0)</option>
                                    </optgroup>
                                    <optgroup label="Special & Excluded Grades">
                                      <option value="F">F (0.0 — Fail)</option>
                                      <option value="Pass">Pass (Credits)</option>
                                      <option value="I">I (Incomplete)</option>
                                    </optgroup>
                                  </select>
                                  <span className="picker-chevron" aria-hidden="true">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                      <path
                                        d="M1 1l4 4 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                </div>
                              </td>
                              <td className="points col-points">
                                {pts === null ? '—' : pts.toFixed(1)}
                              </td>
                              <td>
                                {isCustom && (
                                  <button
                                    type="button"
                                    className="remove-custom"
                                    onClick={() => handleRemoveCustomModule(mod.code)}
                                    title="Remove custom module"
                                  >
                                    &times;
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="semester-summary-row">
                          <td colSpan={2} className="sem-sum-title">
                            Semester Total
                          </td>
                          <td className="col-credits sem-sum-cr">{sgpa.credits} Cr</td>
                          <td className="col-type"></td>
                          <td className="col-grade sem-sum-sgpa-lbl">
                            <span className="sum-tag">SGPA</span>{' '}
                            <strong>{sgpa.gpa === null ? '—' : sgpa.gpa.toFixed(2)}</strong>
                          </td>
                          <td className="col-points sem-sum-fgpa-cell">
                            <span className="sum-tag">Cumulative FGPA</span>{' '}
                            <strong className={`sum-fgpa-val ${isPulsing ? 'is-pulsing' : ''}`}>
                              {overall.gpa === null ? '—' : overall.gpa.toFixed(2)}
                            </strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Add Custom Module Form */}
                    <details className="add-custom">
                      <summary>Add a module to this semester</summary>
                      <form
                        className="custom-form"
                        onSubmit={(e) => handleAddCustomModule(e, sem.id)}
                      >
                        <input
                          type="text"
                          name="code"
                          placeholder="Code (e.g. IT404999)"
                          required
                        />
                        <input
                          type="text"
                          name="title"
                          placeholder="Module title"
                          required
                        />
                        <input
                          type="number"
                          name="credits"
                          min="1"
                          max="20"
                          step="1"
                          placeholder="Credits"
                          required
                        />
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
                </section>
              );
            })}
          </div>
        ))}

        {/* Grade Reference Accordion */}
        <details className="reference-accordion">
          <summary className="reference-toggle">
            <span>Grade scale &mdash; Student Handbook 2023&ndash;24</span>
            <svg className="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="reference-body card">
            <table className="scale-table">
              <thead>
                <tr>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Grade points</th>
                </tr>
              </thead>
              <tbody>
                {GRADE_SCALE.map((r) => (
                  <tr key={r.grade}>
                    <td>{r.min}&ndash;{r.max}</td>
                    <td><strong>{r.grade}</strong></td>
                    <td>{r.points.toFixed(1)}</td>
                  </tr>
                ))}
                <tr>
                  <td>&mdash;</td>
                  <td><strong>I (Incomplete)</strong></td>
                  <td>No points &mdash; excluded from GPA</td>
                </tr>
                <tr>
                  <td>&mdash;</td>
                  <td><strong>Pass</strong></td>
                  <td>No points &mdash; excluded from GPA, earns credits</td>
                </tr>
              </tbody>
            </table>
            <ul className="notes">
              <li>
                SGPA = &Sigma;(credits &times; grade points) &divide; &Sigma;(credits) for the semester, rounded to 2 decimals. FGPA is the same over the whole degree.
              </li>
              <li>Only GPA (G) modules count. Non-GPA modules are shown but never enter the maths.</li>
              <li>Elective modules count only once you enter a grade for them &mdash; ungraded electives never enter the denominator.</li>
              <li>A grade of D or above earns the module's credits. F earns no credits and counts as 0.0 grade points over its credits.</li>
              <li>Graduation needs a minimum of 180 total credits and FGPA &ge; 2.00.</li>
              <li>Your entries are saved automatically in this browser (local storage).</li>
            </ul>
          </div>
        </details>

        <footer>
          <p>Built from the UOVT Student Handbook 2023&ndash;24. Check your numbers against your official transcript.</p>
        </footer>
      </main>

      {/* ── Persistent Floating Live FGPA HUD ──────────────────────────────── */}
      <aside
        className={`floating-fgpa-hud ${isPulsing ? 'is-pulsing' : ''} ${gradedMods > 0 ? 'is-visible' : 'is-idle'}`}
        aria-label="Live Final GPA Monitor"
      >
        <div className="hud-inner">
          <div className="hud-badge-tag">
            <span className="live-dot" />
            <span className="hud-badge-title">LIVE FGPA</span>
          </div>
          <div className="hud-value-group">
            <span className="hud-gpa-val" key={overall.gpa ?? 'empty'}>
              {overall.gpa === null ? '—' : overall.gpa.toFixed(2)}
            </span>
            {gpaDelta !== null && isPulsing && (
              <span className={`hud-delta ${gpaDelta > 0 ? 'pos' : 'neg'}`}>
                {gpaDelta > 0 ? `+${gpaDelta.toFixed(2)}` : gpaDelta.toFixed(2)}
              </span>
            )}
          </div>
          <div className="hud-meta-group">
            <span className="hud-award">{awardClass || 'Enter grades'}</span>
            <span className="hud-credits">{earned} / {GRADUATION_CREDITS} Cr</span>
          </div>
          <button
            type="button"
            className="hud-quick-btn"
            onClick={handleDownloadResultSheet}
            title="Download result sheet PDF"
          >
            PDF Sheet
          </button>
        </div>
      </aside>
    </div>
  );
}
