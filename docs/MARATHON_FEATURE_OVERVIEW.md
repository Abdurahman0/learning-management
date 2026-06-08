# Marathon Feature — What's New

## What Is Marathon?

Marathon is a structured, multi-day study programme inside IELTS Master. Instead of jumping between random practice tests, a student enrolls in a Marathon and follows a day-by-day plan — like a fitness programme, but for IELTS preparation.

Each Marathon is created by an admin, has a fixed number of days (e.g. 30 days), and each day contains reading passages, listening parts, plain-text study content, and optional external resource links. Students unlock each new day automatically as time passes — enroll today, Day 1 unlocks today, Day 2 unlocks tomorrow, and so on.

---

## Who Is It For?

- **Students** who want structured, long-term IELTS preparation instead of ad-hoc practice
- **Premium students** can be given access to exclusive Marathons
- **Admins** create, manage, and monitor all Marathon content and enrollments

---

## Key Concepts

### The Marathon
- Has a title, description, difficulty level, and category (Reading-focused, Listening-focused, or Mixed)
- Set to a specific number of days (e.g. 7, 14, 30 days)
- Can be **visible** or **hidden** — hidden Marathons don't appear to students
- Can be **premium-only** — only users with a premium account can access it
- Can have an optional enrollment cap (e.g. max 200 students)
- Can belong to a **Series** (a collection of related Marathons, e.g. "Cambridge Band 7 Path")

### Marathon Days
- Each Marathon automatically creates one Day per day count when it's set up
- Each day can contain:
  - A **title** and plain-text **study content** (instructions, tips, notes from the admin)
  - **External links** — a list of URLs with titles (e.g. a YouTube video, a BBC article)
  - **Reading passages** — IELTS-style reading texts with questions, scored
  - **Listening parts** — IELTS-style audio with questions, scored
- Days can be marked as **bonus days** — bonus days don't block finishing the Marathon

### Enrollment
- A student self-enrolls with one tap
- Their **Day 1** starts from the day they enrolled
- The system automatically calculates which day the student is currently on based on calendar dates
- Enrollment tracks: current streak, longest streak, days missed, total score, progress percentage

### Completing a Day
- A day is considered completable only if it has at least one active reading passage or listening part
- To mark a day complete, the student must first finish all reading/listening attempts on that day
- Once all are done, they tap "Mark as Complete"
- This triggers: streak update, score accumulation, badge checks, and Marathon completion check

### Marathon Completion
- When a student completes all non-bonus, completable days, the Marathon is marked as finished
- `is_finished_marathon = true` on their enrollment record

---

## Gamification

### Streaks
- Every time a student completes a day, their **daily streak** increments
- If they skip a day (miss completing the previous day before moving on), the streak resets to 1
- The **longest streak** is always preserved even if the current streak resets
- Each Marathon has a **streak goal** (e.g. 7 days). Hitting the goal awards a badge

### Badges Awarded
| Badge | When |
|---|---|
| **Marathon Finisher** | Completes all days in a Marathon |
| **Perfect Marathon Day** | All attempts on a day score band 9.0 |
| **7-Day Marathon Streak** | Streak reaches or exceeds the Marathon's streak goal |
| **Marathon Speed Runner** | Finishes the Marathon before the total number of days has elapsed |

### Leaderboard
- Each Marathon has its own leaderboard
- Ranked by total score, then by streak
- Students can see where they stand among all enrolled participants

### Notes
- Students can write a personal note on each day they've accessed
- Notes are private and per-student

---

## What Changed in the System

1. **New feature: Marathon** — entirely new section of the platform
2. **Premium users** — the user model now has an `is_premium` field, used to gate premium Marathons
3. **Content isolation** — Reading passages and Listening parts used in Marathons are kept separate from regular practice test content. They won't appear in the regular content bank or practice test management screens
4. **New badges** — four new badge types added for Marathon-specific achievements
5. **All existing features unchanged** — regular practice tests, attempts, scoring, and content bank work exactly as before

---

## Admin Capabilities

- Create and manage Marathons (title, days, difficulty, visibility, premium gate, enrollment cap)
- Manage Marathon Series (group related Marathons)
- Edit each day's content, external links, passages, and listening parts
- Assign/remove reading passages and listening parts to specific days
- View all enrollments per Marathon
- View the leaderboard for any Marathon

---

## Student Capabilities

- Browse available Marathons (filtered by premium status)
- Enroll in a Marathon with one action
- View their unlocked days and progress
- Read study content and external links for each day
- Complete reading and listening attempts within a day
- Mark a day as complete once all attempts are done
- Write personal notes per day
- View their enrollment progress, streak, and score
- See the Marathon leaderboard (enrolled students only)
