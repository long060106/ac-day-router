# AC Day Router

Zone-batched dispatch for a one-owner AC/HVAC shop in South Florida
(Miami-Dade, Broward, south Palm Beach).

The owner takes the calls and sends 1–2 techs per job. He never scheduled, so he
crossed the same 50-mile corridor several times a day. This app batches a day's
work into one geographic zone, orders the stops so attic and roof work happens
before the heat, and gives him a page he can read out loud on the phone.

## How it works

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
| `app.js` | All logic — zones, durations, heat cutoffs, routing, call sheet |
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

## Deploying a change

`service-worker.js` starts with a `VERSION` string, and that string is the cache
name. **Bump it on every deploy.** If you don't, phones that already installed the
app keep serving the previous build out of cache and your fix never arrives.

```
var VERSION = "2026-09-10a";   // <- change this, then commit and push
```

Page loads are network-first, so a bumped version reaches him the next time he
opens the app with a signal. Everything else is served from cache first.

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
- [ ] **03** Storage upgrade — IndexedDB or `sql.js`, plus `navigator.storage.persist()`
- [ ] **04** Backup — 7-day nag banner, `navigator.share()` to the iOS share sheet, restore via file picker
