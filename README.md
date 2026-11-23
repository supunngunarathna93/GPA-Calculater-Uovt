# UOVT GPA Calculator

A GPA calculator for the University of Vocational Technology (UOVT) B.Tech
degrees, built from the **Student Handbook 2023–24** (Faculty of Information
Technology). Plain HTML + CSS + JavaScript, built with **Vite** and **npm**.
No accounts, no server, no database — your grades are saved in your own
browser (local storage).

## Programmes included

- B.Tech in Multimedia & Web Technology (default)
- B.Tech in Software Technology
- B.Tech in Network Technology

Every module, code and credit for all six semesters is pre-loaded from the
handbook tables.

## How to launch it

You need **Node.js 18 or newer** installed
(https://nodejs.org — the LTS version is fine).

```bash
# 1. Unzip this folder and open a terminal inside it
cd gpa-calculator-vite

# 2. Install the one dependency (Vite) — only needed the first time
npm install

# 3. Start it
npm run dev
```

Then open the address it prints, usually **http://localhost:5173**.

To stop it, press `Ctrl+C` in the terminal.

## Build a static version instead

```bash
npm run build    # creates a dist/ folder
npm run preview  # serves the built version at http://localhost:4173
```

## How it works

- Pick a grade for each module, or type your **marks** and it converts them
  using the handbook table (A+/A = 4.0, A− = 3.7, B+ = 3.3, B = 3.0,
  B− = 2.7, C+ = 2.3, C = 2.0, C− = 1.7, D+ = 1.3, D = 1.0, F = below 30).
- **SGPA** per semester and **FGPA** for the whole degree, credit-weighted
  and rounded to 2 decimals, exactly as the handbook defines them.
- Class shown live: First Class ≥ 3.70, Second Upper 3.30–3.69,
  Second Lower 2.70–3.29, Ordinary Pass 2.00–2.69.
- Non-GPA modules are shown but never counted. Elective modules count only
  once you enter a grade for them.
- A grade of D or above earns the module's credits. F earns no credits and
  counts as 0.0 grade points over its credits (the handbook prints "–" for
  F grade points; 0.0 is the standard reading, and the app says so on the
  page). "I" (Incomplete) and "Pass" are excluded from GPA.
- Graduation needs 180 total credits and FGPA ≥ 2.00.
- The "What do I need for…" planner shows the average you still need on
  your remaining compulsory GPA credits to reach a target class.
- Add a module that isn't in the list, or clear a programme and start over.

## Files

- `index.html` — page shell
- `src/main.js` — the app (rendering, saving, events)
- `src/data.js` — module catalogue from the handbook
- `src/gpa.js` — the GPA maths (grade scale, SGPA/FGPA, classes)
- `src/style.css` — styling
- `vite.config.js` — Vite settings
