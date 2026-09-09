# Handoff prompt — AC Day Router, Stage 01 (repo + file split)

Paste everything in the "PROMPT TO PASTE" section below into Claude Code, in an empty
project folder, to pick up exactly where this Cowork session left off. This file also
carries the background so Claude Code doesn't have to guess at decisions that were
already made.

---

## What this project is

A South Florida AC/HVAC contractor (a friend of the user, Long) takes calls and
dispatches 1-2 workers per job across Miami-Dade, Broward, and South Palm Beach, but
never schedules — he crisscrosses the same corridor repeatedly, wasting drive time and
gas. Long is building him a scheduling/dispatch tool as a favor, and using it as a test
case for his own "Niche Launch" business project.

The tool ("AC Day Router") already exists as a single working HTML file
(`ac-day-router.html`, included alongside this prompt) with all the real logic built
in: zone-based dispatch batching (one geographic corridor zone per weekday instead of
real-time route optimization — no API key, no cost), symptom-based job duration
estimates (base time × access-location × unit-size × crew-size multipliers), heat-safety
cutoffs for attic/roof work driven by forecast high temperature, and an honest
before/after mileage comparison (zone-batched vs. call-order dispatch).

## Non-negotiable architecture decisions — do not revisit these

These were deliberately decided after working through several options. Don't propose
alternatives unless something below turns out to be technically impossible.

- **No server, no accounts, no login, no sync, no encryption.** Only one person — the
  contractor himself ("the boss") — ever touches the phone or the app. His workers never
  use it; he dispatches them by phone call and learns job status by calling them. Since
  there is only ever one device and one user, there is nothing to sync and nothing to
  authenticate. This is also *why* Long structurally cannot see the contractor's
  customer data — there's no server for it to pass through.
- **Single device, offline-first, iPhone.** The contractor uses an iPhone, doesn't use
  WhatsApp (phone calls only), and knows how to use Google Drive. All data lives in the
  browser on that one phone.
- **Static hosting only.** GitHub Pages, because it's free, permanent, and holds code —
  never data.
- **No "Copy for WhatsApp" button.** The current prototype has one; it's dead weight
  because the contractor's world runs on phone calls, not text. Delete it in this stage.
- **Replace it with a "Call sheet" view instead.** One job at a time, large type, in
  route order, phrased the way the contractor would say it out loud on the phone — e.g.
  *"Baptiste, Coral Springs, fourteen seventy-seven Northwest Fortieth Terrace, attic
  unit, gate code four four one two, dog in the yard."* A "next" button advances to the
  next stop. He holds the phone to his ear and reads it to the worker.
- **Do not rewrite any app logic in this stage.** Only move code around (splitting one
  file into three) and add the two small additions below. The zone logic, duration
  math, and heat-safety rules are already correct and tested — don't touch them.

## The full build plan (for context — only Stage 01 is in scope right now)

1. **Stage 00 (done/in progress):** Validate — install the existing prototype to the
   home screen via Safari, run real calls with it for a week, back up manually at the
   end of the week.
2. **Stage 01 (THIS STAGE):** Your own page, and the home screen icon.
3. **Stage 02:** Works with no signal — add `service-worker.js` so the app opens with
   zero bars, tested via airplane mode.
4. **Stage 03:** Storage upgrade — move off `localStorage` to IndexedDB or `sql.js`
   (SQLite compiled to WebAssembly), add `navigator.storage.persist()`.
5. **Stage 04:** Backup — a nag banner after 7 days of no backup, `navigator.share()`
   with a `File` object to hand a backup file to the native iOS share sheet (Drive,
   Files, Mail all work from there), tested restore via a file picker, plus a
   screenshottable Week view as an auto-iCloud-synced fallback backup.

Explicit non-goals for the whole project: no login, no encryption, no tech
roles/permissions, no real Google/Apple Maps routing API, no native iOS app, no direct
Google Drive API integration (OAuth verification overhead isn't worth it — the iOS share
sheet already reaches Drive), no push notifications.

## Why Stage 01 matters specifically

Safari on iOS deletes script-writable storage (which is what `localStorage` currently
uses) after 7 days of the site not being opened in Safari itself — this is Apple's
Intelligent Tracking Prevention (ITP) policy. **The one exemption: a page that's been
added to the home screen as a standalone web app is exempt from that 7-day deletion.**
That's why `manifest.json` with `"display": "standalone"` has to happen now, in this
stage, before the contractor starts relying on the app for real — not later. Source:
https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/

---

## PROMPT TO PASTE INTO CLAUDE CODE

```
I'm building a small offline-only web app for a friend who runs an AC/HVAC repair
business in South Florida. It's a single working HTML file right now
(ac-day-router.html, in this folder) with all its logic already built and tested —
zone-based dispatch batching, symptom-based job duration math, heat-safety cutoffs for
attic/roof work. I want to learn how to do this myself, so walk me through it step by
step and explain each command — don't just do it all for me silently. I know C, so feel
free to use split-file / header-vs-implementation analogies where they help.

Hard constraints, already decided, don't revisit them:
- No server, no accounts, no login, no database, no sync. Only one person (the
  business owner) ever uses this app, on his own iPhone. His workers never touch it —
  he dispatches them by phone call.
- Static hosting on GitHub Pages only.
- Don't rewrite any of the app's logic in this pass. Only reorganize files and add the
  two specific things listed below.

What I need done in this session (this is "Stage 01" of a longer plan):

1. Help me create a new GitHub repository for this project (walk me through the GitHub
   side — account/repo creation — since you can't do that part for me) and enable
   GitHub Pages on it so I get a permanent free URL.

2. Split ac-day-router.html into three files: index.html, style.css, and app.js.
   Move the <style> block into style.css and link it. Move the <script> block into
   app.js and link it. index.html should end up just markup plus those two links.
   Confirm the app still works exactly the same after the split — don't change any
   logic, variable names, or behavior while moving code.

3. Add a manifest.json file (roughly 15 lines) that gives the app a name, an icon, and
   "display": "standalone", and link it from index.html. This is the important part:
   iOS Safari deletes local storage after 7 days of the site not being opened directly
   in Safari, UNLESS the page has been added to the home screen as a standalone app —
   which this manifest is what enables. No service worker yet — that's a later stage,
   and it's fine for the app to still need a signal/connection to open for now.

4. Delete the "Copy for WhatsApp" button and its handler from the current app (search
   app.js for it — it copies a day's job list as text). Replace it with a "Call sheet"
   view: a full-screen view showing one job at a time in the day's route order, in
   large type, phrased like something you'd say out loud on a phone call — customer
   name, city, address, symptom, access location (attic/roof/yard/inside), and any
   notes — with a "Next" button that advances to the next job in the route. This is
   because the business owner dispatches his workers verbally by phone call, never by
   text.

After each step, tell me exactly how to verify it worked (e.g., "open index.html
locally and check X", "push and visit the Pages URL and check Y") before moving to the
next step. Ask me before doing anything destructive like git resets or force pushes.
```

---

## Before you paste this in

1. Put `ac-day-router.html` (delivered alongside this file) into a new empty folder on
   your computer — that folder is what you'll open Claude Code in.
2. Have a GitHub account ready (github.com — free). Claude Code can talk you through
   creating the repository itself if you don't have one yet.
3. Open Claude Code in that folder and paste the block above.

Once Stage 01 is done and pushed to GitHub Pages, come back to this conversation (or
send me the Pages URL) and I'll review it before you move on to Stage 02 (the offline
service worker).
