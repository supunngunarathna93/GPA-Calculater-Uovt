// GPA maths, straight from the UOVT Student Handbook 2023-24.
//
// Grade scale (marks -> grade -> grade points):
//   A+  85+    4.0     A   75-84   4.0     A-  70-74   3.7
//   B+  65-69   3.3     B   60-64   3.0     B-  55-59   2.7
//   C+  50-54   2.3     C   45-49   2.0     C-  40-44   1.7
//   D+  35-39   1.3     D   30-34   1.0     F   29 or below (handbook: "-")
//   I   incomplete, Pass, N/A: no grade points, excluded from GPA.
//
// SGPA = sum(credits x grade points) / sum(credits) over the GPA modules
//        in that semester, rounded to the nearest second decimal place.
// FGPA = same formula over all GPA modules in the degree programme.
//
// Only GPA (G) modules count. Non-GPA (NG) modules are excluded.
// A grade of D or above earns the module's credits; F earns none.
// Elective modules count only when the student actually enters a grade
// for them — ungraded electives never enter the denominator.
//
// Award classes by FGPA:
//   >= 3.70 First Class
//   3.30-3.69 Second Class (Upper Division)
//   2.70-3.29 Second Class (Lower Division)
//   2.00-2.69 Ordinary Pass
//   < 2.00  Incomplete
// Graduation: minimum 180 total credits and minimum FGPA 2.00.

export const GRADE_SCALE = [
  { grade: "A+", min: 85, max: 100, points: 4.0 },
  { grade: "A", min: 75, max: 84, points: 4.0 },
  { grade: "A-", min: 70, max: 74, points: 3.7 },
  { grade: "B+", min: 65, max: 69, points: 3.3 },
  { grade: "B", min: 60, max: 64, points: 3.0 },
  { grade: "B-", min: 55, max: 59, points: 2.7 },
  { grade: "C+", min: 50, max: 54, points: 2.3 },
  { grade: "C", min: 45, max: 49, points: 2.0 },
  { grade: "C-", min: 40, max: 44, points: 1.7 },
  { grade: "D+", min: 35, max: 39, points: 1.3 },
  { grade: "D", min: 30, max: 34, points: 1.0 },
  { grade: "F", min: 0, max: 29, points: 0.0 },
];

export const GRADE_OPTIONS = ["", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "I", "Pass"];

// Grades that carry grade points and enter the GPA denominator.
// "I" (incomplete) and "Pass" earn no points and are excluded.
export const GPA_GRADES = new Set(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"]);

// F is counted as 0.0 grade points over its credits. The handbook prints
// "-" for F grade points; 0.0 is the standard reading of that, and the
// UI states it plainly instead of presenting 0.0 as a printed value.
export function gradePoints(grade) {
  const row = GRADE_SCALE.find((r) => r.grade === grade);
  return row ? row.points : null;
}

export function marksToGrade(marks) {
  if (marks === "" || marks === null || marks === undefined) return "";
  const m = Number(marks);
  if (Number.isNaN(m)) return "";
  const row = GRADE_SCALE.find((r) => m >= r.min && m <= r.max);
  return row ? row.grade : "";
}

export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// entries: { [moduleCode]: { grade, marks } }
// modules: catalogue rows for one semester (or the whole programme).
// Returns { points, credits, gpa } — gpa is null when nothing graded yet.
export function computeGpa(modules, entries) {
  let points = 0;
  let credits = 0;
  for (const mod of modules) {
    if (!mod.gpa) continue; // non-GPA modules never count
    const entry = entries[mod.code];
    if (!entry || !entry.grade) continue; // ungraded: not counted
    if (!GPA_GRADES.has(entry.grade)) continue; // I / Pass: excluded
    points += mod.credits * gradePoints(entry.grade);
    credits += mod.credits;
  }
  return {
    points: round2(points),
    credits,
    gpa: credits > 0 ? round2(points / credits) : null,
  };
}

// Credits earned toward the 180 needed for graduation: any module with a
// grade of D or above, or a Pass (NG modules included). F earns no credits.
export function creditsEarned(modules, entries) {
  let earned = 0;
  for (const mod of modules) {
    const entry = entries[mod.code];
    if (!entry || !entry.grade) continue;
    if (entry.grade === "Pass") {
      earned += mod.credits;
      continue;
    }
    const pts = gradePoints(entry.grade);
    if (pts !== null && pts >= 1.0) earned += mod.credits;
  }
  return earned;
}

export function classFor(fgpa) {
  if (fgpa === null || fgpa === undefined) return null;
  if (fgpa >= 3.7) return "First Class";
  if (fgpa >= 3.3) return "Second Class (Upper Division)";
  if (fgpa >= 2.7) return "Second Class (Lower Division)";
  if (fgpa >= 2.0) return "Ordinary Pass";
  return "Incomplete";
}

export const CLASS_FLOORS = [
  { name: "First Class", floor: 3.7 },
  { name: "Second Class (Upper Division)", floor: 3.3 },
  { name: "Second Class (Lower Division)", floor: 2.7 },
  { name: "Ordinary Pass", floor: 2.0 },
];

export const GRADUATION_CREDITS = 180;
export const GRADUATION_FGPA = 2.0;

// Compulsory GPA credits in a programme (electives excluded — they only
// count if the student actually takes them).
export function compulsoryGpaCredits(programme) {
  let total = 0;
  for (const sem of programme.semesters) {
    for (const mod of sem.modules) {
      if (mod.gpa && mod.type === "C") total += mod.credits;
    }
  }
  return total;
}

// Average grade points the student still needs on their remaining
// compulsory GPA credits to finish on the target class floor.
// Returns null when there are no remaining credits or the target is
// already impossible/achieved in a way that needs no average.
export function requiredAverage(programme, entries, targetFloor) {
  const all = programme.semesters.flatMap((s) => s.modules);
  const done = computeGpa(all, entries);
  let remainingCredits = 0;
  for (const sem of programme.semesters) {
    for (const mod of sem.modules) {
      if (!mod.gpa || mod.type !== "C") continue;
      const entry = entries[mod.code];
      if (entry && entry.grade && GPA_GRADES.has(entry.grade)) continue;
      remainingCredits += mod.credits;
    }
  }
  if (remainingCredits === 0) return { needed: null, remainingCredits: 0 };
  const neededPoints = targetFloor * (done.credits + remainingCredits) - done.points;
  const needed = round2(neededPoints / remainingCredits);
  return { needed, remainingCredits };
}
