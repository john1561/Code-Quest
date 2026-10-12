# 🤖 Code Quest: Java Adventure

<div align="center">

[![Interactive Java Learning Game](https://img.shields.io/badge/Interactive-Java%20Learning-8b5cf6.svg?style=for-the-badge)](#)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-00d4ff.svg?style=for-the-badge)](#)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-34d399.svg?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-8b5cf6.svg?style=for-the-badge)](LICENSE)

**"Solve the puzzle. Learn Java. Claim your glory!"**

*An interactive visual puzzle game that makes learning Java programming concepts intuitive, engaging, and fun!*

[Features](#-features) • [Quick Start](#-quick-start-local-development) • [Supabase Setup](#-supabase-setup-for-persistent-leaderboard) • [Event Guide](#-event-setup-guide) • [Curriculum](#-java-concepts-taught) • [Solutions](#-level-solutions-spoilers)

---

</div>

## 📖 1. Title & Description

**Code Quest: Java Adventure** is a lightweight, zero-install browser puzzle game built to make Java programming concepts approachable through hands-on play. 

Players guide **Boti the Robot** across grid-based maze puzzles by arranging visual action cards (like `MOVE`, `TURN_RIGHT`, and `REPEAT`). As players assemble their solutions, the game dynamically translates their visual logic into real, syntactically correct Java code in real-time with beginner-friendly explanations.

### 🎯 Target Audience
- **Students & New Programmers:** Introduces foundational logic with zero intimidation.
- **First-Time Programmers:** Visual blocks eliminate syntax anxiety and typing hurdles.
- **IT Students & Enthusiasts:** Compete on speed, algorithmic efficiency, and maximum star collection!

---

## 📂 File Structure

The project is intentionally structured with pure vanilla web standards (no bundlers, frameworks, or transpilers required), making it simple for students and educators to maintain, inspect, and host:

```text
codequest/
├── index.html            # Main game page (all screens: Home, Mode Select, Game Grid, Results, Leaderboard)
├── style.css             # Game styling (dark navy palette, neon accents, robot animations, responsive UI)
├── script.js             # Core game engine (grid renderer, robot physics, 12 levels, audio synth, scoring)
├── supabase.js           # Supabase client wrapper & database API (with automatic localStorage demo fallback)
├── admin.html            # Tournament organizer control panel
├── admin.css             # Admin dashboard styling
├── admin.js              # Admin logic (auth, live scoreboard, player inspections, CSV export, config)
├── supabase-schema.sql   # PostgreSQL database schema, indexes, and Row Level Security (RLS) policies
└── README.md             # Complete documentation and setup manual
```

---

## ✨ 2. Features

- 🧩 **12 Progressive Levels across 5 Worlds:** Seamless difficulty curve teaching sequencing, method calls, loops, conditionals, and debugging.
- 🎴 **Visual Action Cards:** Drag/click cards into an instruction queue — zero typing required!
- ☕ **Real-Time Java Code Preview:** Live conversion of cards into valid Java code with keyword syntax highlighting.
- 🎮 **Dual Game Modes:**
  - **Practice Mode:** Untimed, relaxed exploration with hints and unlimited retries.
  - **Competition Mode:** High-stakes official tournament run with a countdown timer and leaderboard submission.
- 🏆 **Persistent Online Leaderboard:** Real-time ranking backed by Supabase PostgreSQL (filters for Overall, Fastest, Most Stars, and Efficiency).
- 🏅 **Achievement System (8 Badges):** Unlockable badges with fanfare animations (e.g., *First Mission*, *Loop Master*, *Speedster*).
- 🛡️ **Organizer Admin Dashboard:** Verify scores, inspect step-by-step player moves, flag suspicious runs, export CSV, and control tournament status.
- 🔊 **Web Audio Synthesizer:** Built-in retro sound effects (movement blips, star chimes, victory fanfares) with instant mute toggle.
- 💻 **Responsive Layout:** Tailored to display crisp visuals on standard 1366×768 laptops and 1080p external monitors.

---

## ⚡ 3. Quick Start (Local Development)

The game requires **zero build steps** and runs out of the box in **Local Demo Mode** without needing an internet connection or database setup.

1. **Clone or Download** the repository to your local computer:
   ```bash
   git clone https://github.com/your-repo/codequest.git
   ```
2. **Open the Project Folder** in [Visual Studio Code](https://code.visualstudio.com/).
3. **Install the Live Server Extension:**
   - Press `Ctrl + Shift + X` (or `Cmd + Shift + X` on macOS).
   - Search for **Live Server** (by *Ritwick Dey*) and click **Install**.
4. **Launch the Game:**
   - Right-click on `index.html` in the VS Code file explorer.
   - Select **Open with Live Server** (or click *Go Live* in the bottom status bar).
5. **Play!** The game will open in your default browser at `http://127.0.0.1:5500`. All scores and achievements will automatically persist locally in your browser's `localStorage`.

---

## 🗄️ 4. Supabase Setup (For Persistent Leaderboard)

To enable a shared, cross-device online leaderboard for your classroom or coding event, connect a free [Supabase](https://supabase.com) project:

1. **Create an Account & Project:**
   - Sign up or log in at [supabase.com](https://supabase.com).
   - Click **New Project**, choose an organization, name your project (e.g., `code-quest`), and set a secure database password.
2. **Execute Database Schema:**
   - Navigate to the **SQL Editor** tab (terminal icon) in the left sidebar.
   - Click **New Query**.
   - Copy the entire contents of [`supabase-schema.sql`](file:///c:/personalvs/codequest/supabase-schema.sql) and paste it into the query window.
   - Click **Run**. This will create the `leaderboard` and `competition_config` tables, performance indexes, and Row Level Security (RLS) policies.
3. **Configure Authentication:**
   - In Supabase, go to **Authentication** → **Providers** → ensure **Email** is enabled.
   - Under **Authentication** → **Users**, click **Add User** / **Create User**.
   - Enter an email and password for your event organizers (e.g., `admin@example.com`). This user will be your tournament administrator.
4. **Obtain API Keys:**
   - In the left sidebar, click **Project Settings** (gear icon) → **API**.
   - Copy the **Project URL** (e.g., `https://xyzproject.supabase.co`).
   - Copy the **`anon` / `public`** key (do **NOT** use `service_role`).
5. **Link the Game:**
   - Open [`supabase.js`](file:///c:/personalvs/codequest/supabase.js) in VS Code.
   - Update the top configuration constants:
     ```javascript
     const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
     const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';
     ```
6. **Save & Refresh:** Reload `index.html` in your browser. The game is now fully connected to the cloud leaderboard!

---

## 🚀 5. Deployment (Static Web Host)

Because **Code Quest** consists strictly of static HTML, CSS, and JS files, it can be deployed for free in under two minutes:

### Option A: Netlify Drop (Easiest & Fastest)
1. Visit [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `codequest` folder directly into the browser window.
3. Your game is instantly live on a custom `.netlify.app` URL!

### Option B: GitHub Pages
1. Push your project files to a GitHub repository.
2. Navigate to **Repository Settings** → **Pages**.
3. Under *Branch*, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
4. Your site will be published at `https://<username>.github.io/<repo-name>/`.

### Option C: Vercel
1. Install the Vercel CLI (`npm i -g vercel`) or sign in at [vercel.com](https://vercel.com).
2. Import your GitHub repository, leave the build settings empty/default, and click **Deploy**.

> [!NOTE]
> **No build step required:** There is no Webpack, Vite, or npm install needed. Any static web server (Apache, Nginx, Python `http.server`, or GitHub Pages) works immediately.

---

## 🎮 6. Game Controls

| Control | Action | Function |
| :--- | :--- | :--- |
| **Action Cards** | Click card (`MOVE`, `TURN`, etc.) | Adds the command to your program queue |
| **Remove (×)** | Click `×` on instruction pill | Deletes that individual step from your sequence |
| **▶ Run** | Primary button | Executes your instruction list step-by-step |
| **↺ Reset** | Button | Resets Boti back to the starting tile without clearing instructions |
| **🗑 Clear** | Button | Removes all instructions from the queue |
| **↩ Undo** | Button | Removes the most recently added instruction |
| **💡 Hint** | Button | Reveals a hint for the current puzzle (*deducts 20 pts in competition*) |
| **🔊 Mute** | Header toggle | Toggles audio effects on and off |

---

## 📚 7. Java Concepts Taught

The curriculum is structured across 5 distinct worlds that mirror introductory computer science syllabi:

| World | Levels | Concept | Java Syntax | What Players Learn |
| :--- | :---: | :--- | :--- | :--- |
| **World 1: First Steps** | 1–2 | **Sequential Execution** | `move();` | Programs execute one instruction at a time from top to bottom. |
| **World 2: Turn & Explore** | 3–5 | **Method Calls & State** | `turnLeft();`<br>`turnRight();` | Invoking behaviors, orientation tracking, and 2D spatial navigation. |
| **World 3: Repeat to Win** | 6–8 | **For Loops** | `for (int i = 0; i < n; i++) { }` | Code deduplication, iteration limits, loop bodies, and algorithmic efficiency. |
| **World 4: Think Before Moving** | 9–10 | **Conditional Statements** | `if (isPathClear()) { }` | Decision making, sensory perception, and dynamic branching. |
| **World 5: Debug the Program** | 11–12 | **Debugging & Code Review** | Inspect & fix pre-filled code | Identifying runtime logic errors, off-by-one loop errors, and iterative testing. |

---

## 🏆 8. Scoring System

Scores reward both puzzle-solving capability and coding efficiency:

$$\text{Total Score} = \text{Completion Base} + \text{Stars} + \text{Efficiency Bonus} + \text{No-Hint Bonus} + \text{Speed Bonus}$$

### Scoring Formula Breakdown:
- **Level Completion:** `+100 points` upon reaching the glowing exit tile.
- **Star Collection:** `+25 points` per star collected (Boti automatically collects stars when stepping on them).
- **Efficiency Bonus (up to 50 points):**
  $$\text{Efficiency Points} = \min\left(1.0, \frac{\text{Optimal Instructions}}{\text{Actual Instructions Used}}\right) \times 50$$
- **No-Hint Bonus:** `+20 points` awarded if the level was solved without viewing the hint.
- **Speed Bonus (Competition Mode only, up to 50 points):**
  $$\text{Speed Points} = \max\left(0, 50 - \lfloor \text{Time Taken in Seconds} / 2 \rfloor\right)$$

- **Maximum Points per Level:** $\approx 245\text{ points}$
- **Theoretical Max Total (12 Levels):** $\approx 2,940\text{ points}$

> [!NOTE]
> **Client-Side Verification Notice:** To maintain a fast, zero-dependency browser game, scoring calculations run client-side. For official prize distribution during competitions, tournament organizers can view detailed step-by-step move histories in the **Admin Panel** to verify high scores.

---

## ⏱️ 9. Competition Mode

Designed for classrooms, tournament brackets, and live contests:

- **Official Timed Run:** Each player inputs their unique Nickname (1–15 characters) and receives one official attempt.
- **Configurable Countdown:** 3 minutes default time limit (configurable to 2, 3, or 5 minutes in settings).
- **Automated Submission:** Scores and level stats are automatically saved to the Supabase database as soon as the timer reaches zero or Level 12 is cleared.
- **Integrity Guarantee:** Practice mode scores are flagged and never pollute official tournament rankings.
- **Live Leaderboard:** Players can immediately see their rank, total stars, and efficiency badge on the Global Leaderboard screen.

---

## 🛡️ 10. Admin Panel (`admin.html`)

Organizers have full control over tournament proceedings through a dedicated dashboard:

- **Secure Login:** Authenticate using your Supabase organizer credentials.
- **Real-Time Tournament Statistics:** Live participant count, tournament status, high score, and average points.
- **Leaderboard Management:**
  - Search and filter players by nickname.
  - **Verify (`✓`)**: Mark verified runs for prize qualification.
  - **Flag (`⚠`)**: Flag suspicious times or instruction counts with a recorded reason.
  - **Delete (`✕`)**: Remove test or disqualified entries.
- **Player Inspection Modal:** Click any participant to review their level-by-level stars, instruction count, time spent, and hint usage.
- **Competition Controller:** Toggle active status, change timer durations, set reward thresholds, and edit prize descriptions.
- **CSV Data Export:** Export the complete tournament database with a single click for Excel or reporting.
- **Danger Zone:** Reset tournament database with double confirmation (requires typing `RESET`).

---

## 🎪 11. Event Setup Guide

Follow this checklist to set up a classroom session or live competition:

1. **Before the Event (1–2 Days Ahead):**
   - Configure Supabase and paste credentials into [`supabase.js`](file:///c:/personalvs/codequest/supabase.js).
   - Test admin login at `admin.html`.
   - Run through 1–2 test games to confirm data records properly in the online leaderboard.
2. **Event Day:**
   - Open `admin.html` on the organizer laptop/tablet.
   - Go to **Danger Zone** → Reset Leaderboard to purge pre-event test data.
   - Go to **Competition Settings** → Configure tournament name, time limit (e.g., 3 minutes), and prize pool.
   - Click **Start Competition**.
3. **Shared Device Setup:**
   - Launch `index.html` on the public player laptop(s).
   - Press `F11` in Chrome or Edge to enter clean **Full-Screen Kiosk Mode**.
   - Ensure audio is unmuted at an appropriate volume for visitors.
4. **During the Event:**
   - Keep `admin.html` open on the organizer machine to monitor incoming scores.
   - Encourage players to check their standing on the public leaderboard.
5. **Tournament Wrap-Up:**
   - Open `admin.html` → Click **Stop Competition**.
   - Review the Top 3 players using the Player Details Modal.
   - Click **Export CSV** to save an archival record of all participants.
   - Announce winners and award prizes!

---

## 🔒 12. Security Notes

- **Public Anon Key Safety:** Only the Supabase `anon` public key is placed in frontend JavaScript. This key is safe to expose in browser applications when Row Level Security (RLS) is enabled.
- **Service Role Key Warning:** **Never** place the Supabase `service_role` key in frontend code (`supabase.js`, `script.js`, or `admin.js`). The `service_role` key bypasses RLS policies.
- **Row Level Security (RLS):** 
  - Anonymous visitors can only `INSERT` scores and `SELECT` public leaderboard data.
  - Modifying or deleting scores (`UPDATE`/`DELETE`) and altering competition settings strictly requires authenticated Supabase session tokens.
- **Client-Side Limitation:** Because logic runs in the browser, technically advanced users could theoretically inspect or modify variables in DevTools. Tournament organizers should review top leaderboard runs in the admin panel before handing out major awards.
- **Production Hardening (Optional):** For multi-thousand dollar tournaments, validate scores server-side via Supabase Edge Functions.

---

## 📋 13. Testing Checklist

Use this QA checklist before opening the booth to visitors:

- [ ] **Level Loading:** All 12 levels load correctly from the level selector.
- [ ] **Level Solvability:** Each level is solvable using the optimal solutions below.
- [ ] **Collectibles:** Stars trigger chime sound and increment star counter upon contact.
- [ ] **Collision Detection:** Boti cannot pass through solid walls or out-of-bounds boundaries.
- [ ] **Score Formula:** Scores calculate correctly per level based on moves, stars, and hints.
- [ ] **No Duplicate Points:** Replaying an already-cleared level does not inflate the total tournament score.
- [ ] **Practice Mode:** Practice mode operates with no timer restrictions and unlimited retries.
- [ ] **Competition Mode:** Timer initiates on Level 1 and displays continuous countdown.
- [ ] **Auto-Submission:** Scores auto-submit smoothly when time reaches `00:00` or Level 12 finishes.
- [ ] **Leaderboard Sorting:** Scoreboard accurately ranks players by score descending and time ascending.
- [ ] **Achievement Badges:** Badges unlock and trigger notification banners at required milestones.
- [ ] **Nickname Validation:** Rejects empty names, excessive lengths (>15 chars), and whitespace-only names.
- [ ] **Audio Engine:** Sound mute button toggles all Web Audio sound generation immediately.
- [ ] **Screen Resolution:** Game canvas and panels fit comfortably within 1366×768 resolution.
- [ ] **Admin Authentication:** Login accepts valid Supabase admin credentials and rejects invalid attempts.
- [ ] **Admin Moderation:** Organizers can verify (`✓`), flag (`⚠`), and delete (`✕`) player submissions.
- [ ] **CSV Export:** Clicking Export CSV produces a valid, downloadable `.csv` file.
- [ ] **Config Synchronization:** Changes in admin settings update time limits and contest states.
- [ ] **Leaderboard Reset:** Purging leaderboard requires entering confirmation text (`RESET`).
- [ ] **Demo Mode Fallback:** Game functions flawlessly with localStorage when internet/Supabase is disconnected.
- [ ] **Session Refresh:** Starting a new player session properly clears previous game states and queues.

---

## 💡 14. Level Solutions (Spoilers)

Use these verified solutions to test and calibrate every level:

### World 1: First Steps
- **Level 1 ("Hello, Boti!"):**
  ```text
  MOVE, MOVE, MOVE
  ```
- **Level 2 ("Star Path"):**
  ```text
  MOVE, MOVE, MOVE, MOVE, MOVE
  ```

### World 2: Turn & Explore
- **Level 3 ("The L-Turn"):**
  ```text
  MOVE, MOVE, TURN_RIGHT, MOVE, MOVE
  ```
- **Level 4 ("The U-Bend"):**
  ```text
  MOVE, MOVE, TURN_RIGHT, MOVE, MOVE, TURN_RIGHT, MOVE, MOVE
  ```
- **Level 5 ("Zigzag"):**
  ```text
  MOVE, TURN_RIGHT, MOVE, TURN_LEFT, MOVE, TURN_RIGHT, MOVE, TURN_LEFT, MOVE, TURN_RIGHT, MOVE, TURN_LEFT
  ```

### World 3: Repeat to Win
- **Level 6 ("The Long Corridor"):**
  ```text
  REPEAT (8 times) {
    MOVE
  }
  ```
- **Level 7 ("Square Dance"):**
  ```text
  REPEAT (4 times) {
    MOVE, MOVE, TURN_RIGHT
  }
  ```
- **Level 8 ("Spiral In"):**
  ```text
  REPEAT (3 times) {
    MOVE, MOVE, TURN_RIGHT
  }, MOVE, MOVE
  ```

### World 4: Think Before Moving
- **Level 9 ("Which Way?"):**
  ```text
  IF_PATH_CLEAR {
    MOVE
  }, TURN_RIGHT, MOVE, MOVE
  ```
- **Level 10 ("Maze Runner"):**
  ```text
  REPEAT (6 times) {
    IF_PATH_CLEAR {
      MOVE
    }, TURN_RIGHT
  }
  ```

### World 5: Debug the Program
- **Level 11 ("Bug Hunt"):**
  - *Bug:* Initial code contains an incorrect turn (`TURN_LEFT` instead of `TURN_RIGHT`).
  - *Fixed Solution:*
    ```text
    MOVE, MOVE, TURN_RIGHT, MOVE, MOVE
    ```
- **Level 12 ("Final Debug"):**
  - *Bug:* Initial code has an off-by-one repeat count and an extraneous forward movement.
  - *Fixed Solution:*
    ```text
    REPEAT (3 times) {
      MOVE, MOVE, TURN_RIGHT
    }
    ```

---

## 🛠️ 15. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Game won't load / Blank screen** | Opening file via `file://` protocol | Run using VS Code **Live Server** (`http://127.0.0.1:5500`) instead of double-clicking `index.html`. |
| **Leaderboard not saving online** | Supabase credentials missing or invalid | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in [`supabase.js`](file:///c:/personalvs/codequest/supabase.js). Ensure `supabase-schema.sql` was executed. |
| **Admin login fails** | User not created in Supabase Auth | Navigate to Supabase → Authentication → Users → Add User to create admin credentials. |
| **Styles look misaligned or broken** | Browser cache holding outdated CSS | Perform a hard refresh using `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac). |
| **No sound effects playing** | Browser autoplay policy / Muted | Click anywhere on the webpage to grant audio context permissions. Check the top-bar mute button. |
| **Database returns 403 or RLS error** | Missing Row Level Security policies | Re-run the policies section from [`supabase-schema.sql`](file:///c:/personalvs/codequest/supabase-schema.sql) in the Supabase SQL Editor. |

---

## 🎖️ 16. Credits

- **Event:** Created as an interactive Java learning game
- **Core Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+), Web Audio API
- **Backend Infrastructure:** [Supabase](https://supabase.com) (PostgreSQL Database & Auth)
- **Typography:** [Inter](https://fonts.google.com/specimen/Inter) by Rasmus Andersson (Google Fonts)
- **Icons & Visuals:** Pure CSS vector styling and Unicode emojis

---

## 📄 17. License

This project is licensed under the **MIT License** — you are free to modify, expand, and utilize it for classrooms, programming workshops, and hackathons!
