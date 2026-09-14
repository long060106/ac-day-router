# AC Day Router

Zone-batched dispatch for a one-owner AC/HVAC shop in South Florida
(Miami-Dade, Broward, south Palm Beach).

The owner takes the calls and sends 1–2 techs per job. He never scheduled, so he
crossed the same 50-mile corridor several times a day. This app batches a day's
work into one geographic zone, orders the stops so attic and roof work happens
before the heat, and gives him a page he can read out loud on the phone.

## How it works

- **New call in 30 seconds.** He pastes whatever the customer texted. The app reads the
  address, city, phone, where the unit is and what's wrong, then asks one question per
  screen for whatever it could not read — never more than four answers to choose from.
  Every call is treated as an emergency, because people only call when the AC is broken.
- **Finished jobs are kept.** "Done" moves a job to a Finished list instead of deleting
  it; Undo puts it back.
- **Zone days.** One corridor zone per weekday. Emergencies break the rule; nothing else does.
- **Hot places early.** The forecast high sets a cutoff time; attic and roof jobs are routed before it.
- **Honest time blocks.** Symptom sets the base minutes; access, tonnage and crew size stretch it.
- **Call sheet.** One stop at a time, in route order, in large type, phrased the way you'd say it
  out loud — `1477 NW 40th Ter` reads as "fourteen seventy-seven Northwest fortieth Terrace".

## Deliberate non-features

No server, no accounts, no login, no sync, no encryption, no routing API, no push
notifications. One person uses this, on one iPhone. Everything lives in that
browser; GitHub Pages holds the code and never touches the data.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Markup only, plus the links to everything else |
| `style.css` | All styling |
| `app.js` | All logic — zones, durations, heat cutoffs, routing, reading pasted texts, new-call questions, call sheet |
| `manifest.json` | Makes it installable to the iPhone home screen |
| `service-worker.js` | Caches the app so it opens with no signal |
| `icons/` | Home-screen icons (regenerate with `python make_icons.py`) |

## Why the manifest matters

iOS Safari deletes script-writable storage (which is where the jobs live) after
7 days of not visiting the site in Safari — Apple's Intelligent Tracking
Prevention. A page added to the home screen as a standalone web app is exempt.
So the app **must** be installed via Share → Add to Home Screen, and opened from
that icon, or a quiet week will wipe the board.

<https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/>

## Where the data lives

IndexedDB is the store of record; localStorage is kept as a mirror. Both are
written on every save, and on boot the newer of the two wins. IndexedDB was
chosen over `sql.js` because SQLite-in-WebAssembly is a megabyte of download
that still has to persist its database file into IndexedDB anyway — a lot of
machinery to run queries nobody needs against a few hundred rows.

The mirror is deliberate rather than leftover. The data is a few kilobytes and
it is his entire business, so a second copy that survives one store being
cleared is worth more than a tidy single-store cutover.

Every job carries a `status` — `open` or `done`. Jobs saved before Stage 05 have no
status, because back then "Done" deleted them; `hydrate()` reads a missing status as
`open` on every load, so old records and old backup files need no migration step.
A half-entered new call is kept separately under `acdayrouter.draft` in localStorage,
so a second call interrupting the first does not lose it.

Boot order matters and is easy to break: the examples are **not** seeded until
IndexedDB has been read. Seeding earlier would call `saveLocal()` and overwrite
real jobs in IndexedDB with sample data on any phone where localStorage had
been cleared but IndexedDB survived.

## Backup, three ways

Losing the phone is the only remaining way to lose his work, so there are three
routes out of it, in descending order of how much discipline they need.

1. **Save a backup file** hands a real `.json` to the iOS share sheet, which
   reaches Files, iCloud Drive, Google Drive and Mail. **Restore from a file**
   reads one back through the native file picker. Both are exact, round-trip
   safe, and restore settings as well as jobs.
2. **The nag banner** appears on the Today tab once a backup is 7 days old, or
   has never been made. It stays silent while the board holds nothing but the
   example jobs — nagging about sample data is how you teach someone to ignore
   a warning. "Later" snoozes it 3 days.
3. **Week view** is the backup that needs no discipline at all. He screenshots
   it and iOS syncs his photos to iCloud by itself. It is not restorable by the
   app, but every field needed to rebuild a call by hand is printed on it, which
   is the point: it survives him never once tapping "save a backup".

## Deploying a change

`service-worker.js` starts with a `VERSION` string, and that string is the cache
name. **Bump it on every deploy.** If you don't, phones that already installed the
app keep serving the previous build out of cache and your fix never arrives.

```
var VERSION = "2026-09-10a";   // <- change this, then commit and push
```

Page loads are network-first, so a bumped version reaches him the next time he
opens the app with a signal. Everything else is served from cache first, which
means **a deploy takes two launches to appear**: the first launch fetches the new
files into a fresh cache, the second runs them. That is the deliberate trade —
network-first on every file would hang on a weak signal instead of failing fast,
and weak signal is his normal working condition.

## Running it locally

```
python -m http.server 8127
```

Then open <http://localhost:8127>. Open it over `http://`, not by
double-clicking the file — `file://` breaks the manifest and storage behaves
differently there.

## Build stages

- [x] **00** Validate — run real calls through the prototype for a week
- [x] **01** Own page + home-screen icon (file split, manifest, call sheet)
- [x] **02** Works with no signal — `service-worker.js`, tested in airplane mode
- [x] **03** Storage upgrade — IndexedDB, plus `navigator.storage.persist()`
- [x] **04** Backup — 7-day nag banner, `navigator.share()` to the iOS share sheet, restore via file picker, screenshottable Week view
- [x] **05** Job status instead of deletion, paste-a-text intake, one question per screen
- [ ] **06** Scheduler — as soon as possible, grouped by area each day, new calls placed on the best truck
- [ ] **07** After checking the AC — fixed / part / new unit, morning pickups, replacements per day
