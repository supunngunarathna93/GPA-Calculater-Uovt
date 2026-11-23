import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROGRAMMES } from './src/data.js';
import { computeGpa, creditsEarned, classFor, round2, gradePoints, GPA_GRADES } from './src/gpa.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const programme = PROGRAMMES.multimedia;

// Realistic grades entered across ALL 6 SEMESTERS of the degree programme
const entries = {
  // Year 1 — Semester 1 (24 GPA credits)
  'IT103011': { grade: 'A+' }, // Math 1 (3 cr)
  'IT104021': { grade: 'A' },  // Prog (4 cr)
  'IT104031': { grade: 'A' },  // Dev Pract (4 cr)
  'IT103041': { grade: 'A-' }, // Dig Elec (3 cr)
  'IT103051': { grade: 'B+' }, // Data Comm (3 cr)
  'IT103061': { grade: 'A' },  // DB Design (3 cr)
  'IT104071': { grade: 'A+' }, // Internet Tech (4 cr)
  'LS103101': { grade: 'Pass' },// English 1 (NG)

  // Year 1 — Semester 2 (31 GPA credits)
  'IT202011': { grade: 'A' },  // OS (2 cr)
  'IT203021': { grade: 'A-' }, // Math 2 (3 cr)
  'IT203031': { grade: 'B+' }, // Arch (3 cr)
  'IT204041': { grade: 'A' },  // DSA (4 cr)
  'IT206051': { grade: 'A' },  // DB Sys (6 cr)
  'IT204061': { grade: 'A+' }, // Visual Prog 1 (4 cr)
  'IT206071': { grade: 'A' },  // Web Prog (6 cr)
  'IT203081': { grade: 'A-' }, // Networks (3 cr)
  'LS203111': { grade: 'Pass' },// English 2 (NG)

  // Year 2 — Semester 1 (33 GPA credits)
  'IT304011': { grade: 'A' },  // Web Tech (4 cr)
  'IT304021': { grade: 'A' },  // Platform Ind Prog (4 cr)
  'IT304071': { grade: 'A-' }, // Mass Comm (4 cr)
  'IT303081': { grade: 'A' },  // Art & Design (3 cr)
  'IT306091': { grade: 'A+' }, // 2D/3D Graphics (6 cr)
  'IT304101': { grade: 'B+' }, // Video Prod (4 cr)
  'IT304111': { grade: 'A' },  // Animation (4 cr)
  'MS304121': { grade: 'A-' }, // Entrepreneurship (4 cr)
  'IT302160': { grade: 'Pass' },// Psychology (NG Elective)

  // Year 2 — Semester 2 (31 GPA credits)
  'IT404010': { grade: 'A' },  // Mobile Apps (4 cr)
  'IT404020': { grade: 'A' },  // Cloud Apps (4 cr)
  'IT402030': { grade: 'A+' }, // HCI (2 cr)
  'IT406081': { grade: 'A-' }, // DSP & Image Proc (6 cr)
  'IT402090': { grade: 'A' },  // Audio/Music (2 cr)
  'IT404101': { grade: 'B+' }, // Postproduction (4 cr)
  'IT406111': { grade: 'A' },  // Product Dev (6 cr)
  'MS403130': { grade: 'A' },  // Research Meth (3 cr)
  'IT402170': { grade: 'Pass' },// Meditation (NG Elective)

  // Year 3 — Semester 1 (Industrial Training: 14 GPA credits)
  'IT514011': { grade: 'A' },  // Industrial Training (14 cr)

  // Year 3 — Semester 2 (Final Year: 34 GPA credits)
  'IT604011': { grade: 'A' },  // Prof Issues (4 cr)
  'IT604021': { grade: 'A-' }, // Enterprise Sys (4 cr)
  'IT604121': { grade: 'A' },  // Project Mgmt (4 cr)
  'IT603130': { grade: 'A' },  // CMS (3 cr)
  'IT604141': { grade: 'B+' }, // Multimedia Data (4 cr)
  'IT603100': { grade: 'A-' }, // Digital Mktg (3 cr)
  'IT604090': { grade: 'A' },  // Game Dev (4 cr Elective)
  'IT612111': { grade: 'A+' }, // Final Year Project (12 cr)
  'IT602080': { grade: 'Pass' },// Photography (NG Elective)
};

const allMods = programme.semesters.flatMap(s => s.modules.map(m => ({ ...m, semesterId: s.id })));
const overall = computeGpa(allMods, entries);
const earned = creditsEarned(allMods, entries);
const cls = classFor(overall.gpa);

// Calculate SGPA for each semester
const semesterData = programme.semesters.map(sem => {
  const sGpa = computeGpa(sem.modules, entries);
  const gradedCount = sem.modules.filter(m => entries[m.code]?.grade).length;
  return {
    ...sem,
    sGpa,
    gradedCount,
  };
}).filter(s => s.gradedCount > 0); // All entered semesters!

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UOVT Official Academic Result Sheet</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Source Sans 3', system-ui, sans-serif;
      font-size: 9pt;
      line-height: 1.35;
      color: #111114;
      background: #ffffff;
      padding: 16px 20px;
      max-width: 860px;
      margin: 0 auto;
    }
    .sheet-header {
      text-align: center;
      border-bottom: 2px solid #0b0b0d;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .uni-emblem {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 16pt;
      letter-spacing: 0.04em;
      color: #0b0b0d;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .faculty-line {
      font-size: 9.5pt;
      color: #4a4a50;
      font-weight: 500;
    }
    .doc-badge {
      display: inline-block;
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8c6e2c;
      margin-top: 6px;
    }
    .meta-panel {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 18px;
      background: #faf9f6;
      border: 1px solid #e5e1d8;
      border-radius: 4px;
      padding: 8px 14px;
      margin-bottom: 14px;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
    }
    .meta-label { color: #555; font-weight: 500; }
    .meta-val { font-weight: 600; color: #111; }
    .meta-val.award { color: #8c6e2c; font-weight: 700; font-size: 9.5pt; }
    .meta-val.fgpa { font-family: 'DM Serif Display', serif; color: #8c6e2c; font-size: 11.5pt; }

    .sem-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sem-card {
      border: 1px solid #dcd7ce;
      border-radius: 4px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .sem-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f4f2ed;
      padding: 5px 10px;
      border-bottom: 1px solid #dcd7ce;
    }
    .sem-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 9.5pt;
      color: #0b0b0d;
    }
    .sem-sgpa-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      color: #8c6e2c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
    }
    thead th {
      background: #faf9f7;
      border-bottom: 1px solid #d0cbc2;
      padding: 3.5px 6px;
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #555;
    }
    tbody td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #ece8e1;
      vertical-align: middle;
    }
    tbody tr:last-child td { border-bottom: none; }
    td.col-code {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      font-size: 7.2pt;
      color: #222;
      white-space: nowrap;
    }
    td.col-num {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }
    td.col-grade {
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 8pt;
      color: #0b0b0d;
    }
    td.col-type {
      font-size: 7.2pt;
      color: #666;
    }
    .doc-footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #dcd7ce;
      font-size: 7pt;
      color: #777;
      text-align: center;
      font-style: italic;
    }
  </style>
</head>
<body>

  <header class="sheet-header">
    <h1 class="uni-emblem">UNIVERSITY OF VOCATIONAL TECHNOLOGY</h1>
    <div class="faculty-line">Faculty of Information Technology &bull; B.Tech Degree Programme</div>
    <div class="doc-badge">Official Student Academic Result Sheet</div>
  </header>

  <div class="meta-panel">
    <div class="meta-item">
      <span class="meta-label">Degree Programme:</span>
      <span class="meta-val">${programme.label}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Date Generated:</span>
      <span class="meta-val">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Final GPA (FGPA):</span>
      <span class="meta-val fgpa">${overall.gpa.toFixed(2)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Academic Award:</span>
      <span class="meta-val award">${cls}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Credits Earned:</span>
      <span class="meta-val">${earned} / 180 Credits Completed</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Grade Points:</span>
      <span class="meta-val">${overall.points.toFixed(1)} (${overall.credits} GPA Credits Graded)</span>
    </div>
  </div>

  <div class="sem-grid">
    ${semesterData.map(sem => `
    <div class="sem-card">
      <div class="sem-card-head">
        <span class="sem-title">${sem.label}</span>
        <span class="sem-sgpa-tag">SGPA: ${sem.sGpa.gpa ? sem.sGpa.gpa.toFixed(2) : '—'}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Module Code</th>
            <th>Module Title</th>
            <th style="text-align:right;">Credits</th>
            <th>Type</th>
            <th style="text-align:center;">Grade</th>
            <th style="text-align:right;">Points</th>
          </tr>
        </thead>
        <tbody>
          ${sem.modules.filter(m => entries[m.code]?.grade || m.type === 'C').map(m => {
            const e = entries[m.code] || {};
            const pts = e.grade && GPA_GRADES.has(e.grade) ? round2(m.credits * gradePoints(e.grade)) : '—';
            return `
            <tr>
              <td class="col-code">${m.code}</td>
              <td>${m.title}</td>
              <td class="col-num">${m.credits}</td>
              <td class="col-type">${m.gpa ? 'GPA' : 'Non-GPA'}${m.type === 'E' ? ' &bull; Elective' : ''}</td>
              <td class="col-grade">${e.grade || '—'}</td>
              <td class="col-num">${pts === '—' ? '—' : Number(pts).toFixed(1)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`).join('')}
  </div>

  <footer class="doc-footer">
    This complete academic transcript is computed in accordance with the UOVT Student Handbook 2023–24 examination regulations.
  </footer>

</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'result_sheet_sample.html'), html, 'utf8');
console.log('Comprehensive All-Semesters Result sheet written to result_sheet_sample.html');
