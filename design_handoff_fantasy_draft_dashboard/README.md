# Handoff: Fantasy Premier League Draft Dashboard

## Overview

A desktop web dashboard for a six-manager **Fantasy Premier League draft league** (head-to-head format: each gameweek every manager plays one opponent, 3 points for a win, 1 for a draw). It answers, at a glance: who is winning, who is collapsing, who is lucky, and who wasted points on their bench.

Three tabs:

1. **Overview** — league-wide state of play.
2. **Managers** — per-manager profile page (deep-linked from any standings row).
3. **Fixtures** — results, projections, head-to-head matrix, results archive.

The season shown is mid-season: **gameweek 14 of 38**.

## About the Design Files

`Fantasy Draft Dashboard.dc.html` (plus its runtime `support.js`) is a **design reference created in HTML** — a working prototype of the intended look, data model and behavior. It is **not production code to copy**. The task is to recreate these designs in the target codebase's existing environment (React, Vue, Svelte, SwiftUI, etc.) using its established component library, styling approach and data layer. If no environment exists yet, pick the most appropriate framework for the project and implement there.

All numbers in the prototype are **fabricated but internally consistent**: per-gameweek scores are the only raw input, and fixtures, W/D/L, league points, table position history, form and rank movement are all *derived* from them via a round-robin fixture generator. Wire the real data source to the same derivation and everything recomputes.

## Fidelity

**High fidelity.** Final colors, typography, spacing, and interaction behavior. Recreate pixel-accurately using the codebase's own primitives. Charts are hand-built SVG + CSS in the prototype; substituting an equivalent charting library is fine as long as the visual result matches (see per-chart specs below).

---

## Data model

### Raw input (per manager)

| Field | Type | Notes |
|---|---|---|
| `key` | string | 3-letter code, e.g. `CAD` — used for avatars and axis labels |
| `name` | string | Team name, e.g. "Ctrl Alt Defeat" |
| `manager` | string | Human name, e.g. "Mitchell L." |
| `hue` | number | OKLCH hue used to derive the manager's brand color |
| `points[]` | number[] | Fantasy points scored per gameweek (length = gameweeks played) |
| `benchWasted` | number | Season total of points scored by benched players |
| `luckIndex` | number | Signed: points scored minus points needed to beat that week's opponent, summed |
| `positionMix` | [number,number,number,number] | Share of points from GK / DEF / MID / FWD, sums to 1 |
| `squad[]` | {position, name, points}[] | Top 6 contributors, descending |
| `titleProbability` | number | Percent, assigned by current rank (36 / 27 / 17 / 11 / 6 / 3) |

Prototype dataset (6 managers × 14 gameweeks):

```
CAD Ctrl Alt Defeat    Mitchell L.  hue 145  54 41 63 49 58 45 71 52 60 38 66 57 49 62
HAO Haaland Oates      Priya N.     hue 200  48 59 44 66 51 62 39 68 47 55 58 50 64 43
VAR Vardy Party        Dev S.       hue 258  61 37 52 45 69 41 55 48 63 50 42 59 46 57
SON Sonny Delight      Tom B.       hue 318  39 55 48 58 43 66 50 44 57 61 47 53 38 60
BWU Bench Warmers Utd  Aisha K.     hue 35   45 48 39 52 47 44 58 41 50 46 53 40 55 42
SAL Salah-mander       Rory M.      hue 88   36 44 51 38 55 47 42 53 39 58 45 49 43 50

benchWasted  CAD 64  HAO 88  VAR 41  SON 112  BWU 73  SAL 96
luckIndex    CAD +38 HAO -12 VAR +5  SON -29  BWU +21 SAL -23
positionMix  CAD .10/.26/.42/.22  HAO .12/.30/.35/.23  VAR .09/.24/.40/.27
             SON .13/.29/.38/.20  BWU .11/.33/.34/.22  SAL .10/.27/.36/.27
```

Draft pick value (steals / busts), each `{pick, player, position, managerKey, vsExpected}`:

```
steals  4.02 V. Okonkwo    FWD CAD +61
        6.05 A. Delacroix  MID HAO +54
        5.01 N. Rojas      MID VAR +43
        8.03 Z. Bahri      DEF BWU +31
busts   1.02 E. Thorsby    FWD SON -58
        1.05 K. Adjei      MID SAL -47
        2.01 H. Brandt     MID BWU -35
        2.04 M. Sørensen   DEF HAO -22
```

Squads (position, player, season points) — top six per manager:

```
CAD  FWD V. Okonkwo 142 · MID R. Salcedo 118 · MID T. Bergqvist 96 · DEF K. Mbaye 81 · DEF J. Prieto 64 · GK L. Havránek 52
HAO  MID A. Delacroix 131 · FWD S. Adeyemi 109 · MID P. Voronin 94 · DEF M. Falkner 86 · FWD D. Amoako 71 · GK O. Renard 58
VAR  MID N. Rojas 127 · FWD H. Lindqvist 102 · DEF C. Oyelaran 88 · MID B. Kovač 79 · DEF E. Marchetti 63 · GK F. Duarte 49
SON  FWD I. Traoré 121 · MID G. Whitlock 104 · MID Y. Sagara 85 · DEF R. Vlašić 77 · DEF A. Ferreira 60 · GK T. Nyström 54
BWU  MID L. Ashworth 112 · DEF Z. Bahri 93 · FWD M. Kolar 84 · MID S. Ibori 72 · DEF J. Lindberg 58 · GK P. Castellan 47
SAL  FWD D. Ogundipe 108 · MID V. Petrossian 91 · MID C. Halloran 80 · DEF N. Ekström 69 · DEF W. Bassey 55 · GK R. Sadiku 44
```

### Derived values (compute, don't store)

**Fixture generator** — circle method for 6 teams, 5 distinct rounds cycling every 5 gameweeks. For round `r` (0–4):

```
rotation = [0, 1+((0+r)%5), 1+((1+r)%5), 1+((2+r)%5), 1+((3+r)%5), 1+((4+r)%5)]
pairs    = [[rot[0],rot[5]], [rot[1],rot[4]], [rot[2],rot[3]]]
```

Gameweek `g` uses round `g % 5`. Each pairing's winner is whoever scored more that gameweek; equal scores are a draw.

From that: `wins/draws/losses`, `leaguePoints` (3/1/0), `results[]` (`W`/`D`/`L` per gameweek), `opponent[]`, cumulative points, and **table position per gameweek** (sort by league points, tie-break on cumulative fantasy points).

Other derived fields: `rank`, `previousRank` (last gameweek), `rankFiveGameweeksAgo`, `form` (last 5 results), `currentStreak` (e.g. `3W`), `averagePerGameweek`, `bestGameweek`, `worstGameweek`.

---

## Screens / Views

### Global chrome (all tabs)

- App shell: `max-width:1400px; min-width:1340px; margin:0 auto; padding:20px; background:#0b0b0c; border-radius:22px; border:1px solid rgba(255,255,255,.08)`. Page background `#08080a`. **The `min-width` matters** — every inner grid is sized for ~1340px; below that the page must scroll horizontally, not compress (a fluid shell collapses the standings name column).
- Top bar, `display:flex; justify-content:space-between; align-items:center`:
  - Left: logo lozenge — `padding:10px 18px 10px 12px; background:#141416; border-radius:999px`, containing a 26×26 `border-radius:8px` mint (`#7bdcb5`) square with `JD` in 700 11px (color `#08150f`), then wordmark "JointDraft" 600 16px `#f4f4f2`, `letter-spacing:-.01em`.
  - Nav pill group: `padding:5px; background:#141416; border-radius:999px; gap:4px`. Items **Overview · Managers · Fixtures**, each `padding:9px 18px; border-radius:999px; font:500 13.5px Barlow`. Active: `background:#f4f4f2; color:#111`. Inactive: transparent, `color:rgba(255,255,255,.6)`, hover `#f4f4f2`.
  - Right: a "Season ▾" pill (`padding:10px 18px; background:#141416; border-radius:999px; font:500 13px; color:rgba(255,255,255,.6)`) and a 38px circular avatar filled with the **selected manager's** color, showing their 3-letter code in 700 12px `#0b0b0c`.

### 1. Overview

Vertical stack, all cards `background:#111113; border-radius:20px; padding:22px 24px` unless noted, gaps `14px`.

**a. Orange summary band** — `background:#ff4d16; border-radius:20px; padding:24px 26px`, flex with `align-items:flex-end`.
- Left: eyebrow "Gameweek 14 of 38 · six managers" (400 13px, `rgba(255,255,255,.75)`); headline "The state of play" (600 38px/1.05, `#fff`, `letter-spacing:-.03em`); strap (400 14px/1.45, `rgba(255,255,255,.85)`, `max-width:640px`, `text-wrap:pretty`).
  - Strap copy (banter on): *"Ctrl Alt Defeat lead by {gap} league points, but Mitchell has been living on borrowed fixtures. Salah-mander have now lost {n} of 14."* Generated from data — leader, leader-vs-second league point gap, luckiest manager's first name, last-placed team and its loss count.
  - Neutral variant: *"{leader} top the table on {lp} points from 14 gameweeks. {second} trail by {gap}."*
- Right: two stat chips. "Gap 1st → 2nd" on `rgba(0,0,0,.16)`, `border-radius:14px; padding:14px 18px`, value 600 30px white + "pts" 400 12px. "Title favourite" on `#fff`: label `rgba(0,0,0,.55)`, name 600 20px `#111`, "36% to win it" 600 13px `#ff4d16`.

**b. KPI row** — 4 equal cards, `border-radius:18px; padding:18px 20px`. Each: a 3×14px rounded accent bar + label (400 12.5px `rgba(255,255,255,.45)`); name 600 19px `#f4f4f2` at `margin-top:13px`; value 500 13px in the accent color; note 400 12px `rgba(255,255,255,.35)`.
- League leader (accent `#7bdcb5`) — "{lp} pts · {w}W" / "{total} fantasy points, +{gap} on the chasing pack".
- Biggest riser (5 GW) (accent `#ffc93c`) — "Up {n} to {ordinal}" or "Holding {ordinal}" / "{n}W in the last five gameweeks". Computed over 5 gameweeks and **excluding the leader**.
- Riding their luck (accent `#68b6e8`) — highest luck index excluding the leader / "Wins nothing on merit, wins plenty anyway".
- Robbed (accent `#ff4d16`) — lowest luck index excluding the leader, riser and lucky picks / "Great scores, terrible timing".
- Rule: the four tiles must name four different managers.

**c. Standings + Good vs. Lucky** — `grid-template-columns:1fr 1.05fr; align-items:start`.

*Standings card.* Title 600 17px + hint "click a row for the manager page" (400 12px `rgba(255,255,255,.35)`). Grid `22px 1fr 26px 26px 26px 42px 52px 84px`, `gap:0 9px`. Header row 500 11px `rgba(255,255,255,.35)`, `padding-bottom:10px`, `border-bottom:1px solid rgba(255,255,255,.07)`. Columns: `#`, Manager, W, D, L, Pts, FPL, Form.
Row: `padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); border-radius:10px; cursor:pointer`, hover `background:rgba(255,255,255,.04)`, selected row `background:rgba(255,255,255,.04)`. Contents — rank 600 13px `rgba(255,255,255,.45)`; 30px circular avatar in the manager color with the 3-letter code (700 10px `#0b0b0c`); team name 500 14px `#f4f4f2` with manager name 400 11.5px `rgba(255,255,255,.35)` beneath (both `text-overflow:ellipsis`); rank-delta glyph 500 11px (`▲n` mint `#7bdcb5`, `▼n` `#ff8f6b`, `—` `rgba(255,255,255,.25)`); W 500 13px `.7` alpha, D/L `.4`; league points 600 17px `#f4f4f2` `letter-spacing:-.02em`; fantasy points 500 12.5px `.5`; form = five 15px circles, `gap:4px`, 600 8.5px letter — W `rgba(123,220,181,.18)`/`#7bdcb5`, D `rgba(255,255,255,.1)`/`rgba(255,255,255,.55)`, L `rgba(255,77,22,.18)`/`#ff8f6b`.
Below, separated by `margin-top:20px; padding-top:18px; border-top:1px solid rgba(255,255,255,.07)`: **Title race projection** (600 15px) — six rows, grid `114px 1fr 40px`, name 400 12.5px `.6`, 8px `border-radius:999px` track on `rgba(255,255,255,.06)` filled to `probability / 36 × 100%` in the manager color, value 600 12.5px `#f4f4f2`.

*Good vs. Lucky scatter.* Title 600 17px + pill "bubble = title odds" (`padding:8px 14px; background:#1a1a1d; border-radius:999px; font:500 12px; color:rgba(255,255,255,.55)`). Body copy 400 13px/1.5 `rgba(255,255,255,.4)`, `max-width:520px`: "Vertical: season points. Horizontal: luck index — points scored versus the points needed to beat that week's opponent. Top-left is the most robbed manager in the league; bottom-right is a fraud."
SVG `viewBox="0 0 600 320"`, `width:100%; height:auto`. Crosshair: vertical line x=300 (y 10→304), horizontal y=160 (x 16→584), both `stroke:rgba(255,255,255,.1); stroke-dasharray:3 5`.
Point geometry: `x = 300 + (luck / 40) × 240`, `y = 292 − ((total − minTotal + 20) / (maxTotal − minTotal + 40)) × 258`, bubble radius `14 + titleProbability × 0.6`. Render bubble at 16% opacity in manager color plus a solid 6px core dot.
Labels are **HTML overlays absolutely positioned in percent of the viewBox**, not SVG `<text>` (SVG text cannot host the interpolated spans and renders zero-width). Each: name 500 13.5px `#f4f4f2` + sub 400 11.5px `rgba(255,255,255,.35)` reading "{total} pts · {±luck} luck". Anchor flips by side: `translate(14px,-50%)` when x < 470, else `translate(-100%,-50%) translateX(-14px)`.
Corner chips (`padding:5px 10px; border-radius:999px; background:#17171a; font:500 11px`): top-left "Robbed" `#7bdcb5`, top-right "Deserved" `#ffc93c`, bottom-right "Fraudulent" `#ff4d16`.

**d. Cumulative points race + Table position by gameweek** — `grid-template-columns:1.35fr 1fr`.

*Race chart.* SVG `viewBox="0 0 780 300"`; plot insets left 44, right 98, top 16, bottom 30. `x(i) = 44 + i/(n−1) × 638`; `y(v) = 16 + (1 − v/(maxTotal × 1.04)) × 254`. Horizontal gridlines every 200 points, `stroke:rgba(255,255,255,.06)`. One polyline per manager in its color, `stroke-width:2` (leader `3.2`), opacity `.72` (leader `1`), round joins/caps, plus a 4px end dot.
End labels are HTML overlays (500 12.5px in the manager color) with **collision avoidance**: sort by y, push each label down to keep a **6.2% minimum vertical gap**, then if the last exceeds 94% shift the whole stack up (floor 3%). Without this the six labels overprint — the final totals sit within ~5% of the axis range.
Axis labels are HTML overlays too: y-ticks right-aligned at `x = (44−9)/780`, 400 11px `rgba(255,255,255,.32)`; x-ticks at gameweeks 1,3,5,7,9,11,13,14 centered at the bottom, 400 11px `rgba(255,255,255,.28)`.

*Bump chart.* SVG `viewBox="0 0 560 300"`; insets left 40, right 26, top 22, bottom 28. `x(i) = 40 + i/(n−1) × 494`; `y(rank) = 22 + (rank−1)/5 × 250`. One line per manager, `stroke-width:2.6`, opacity `.9`, ending in a **12px filled circle** with the 3-letter code centered inside it (700 10px `#0b0b0c`, HTML overlay). Row labels 1–6 at left, 400 11px `rgba(255,255,255,.3)`.

**e. Bottom row** — `grid-template-columns:1fr 1fr 1.4fr`.
- *Bench points wasted*: rows `92px 1fr 34px`, sorted descending. Name 400 12.5px `.6`; 9px pill track `rgba(255,255,255,.06)` filled to `bench / maxBench` in `#ff4d16`; value 600 12.5px `.6`. Caption (banter): "{manager} has left an entire extra manager's worth of points on the sofa."
- *Where the points come from*: legend of four 8px dots + labels (GK `#e6c34a`, DEF `#68b6e8`, MID `#7bdcb5`, FWD `#ff4d16`); then per manager a 14px `border-radius:999px` stacked bar, `gap:2px`, each segment width = position share, showing the segment's point total centered (600 9px `rgba(11,11,12,.8)`).
- *Draft pick value* (`background:#141416`): header + "vs. expected" pill. Two labelled groups — "Steals" (500 11.5px `#7bdcb5`) and "Busts" (`#ff4d16`). Each row grid `38px 1fr 104px 1fr 46px`: pick number 400 11.5px `.35`; player 500 13.5px `#f4f4f2` with position 400 10.5px `.3`; manager 400 11.5px in the manager color; an 8px pill bar (steals fill from left in mint scaled to +61 max; busts fill from the **right** in `#ff4d16` scaled to |−58| max); delta 600 12px in the accent.

### 2. Managers

`grid-template-columns:300px 1fr; gap:14px; align-items:start`.

**Left — manager list.** Card title "Managers" 600 15px, sub "Ranked by league points" 400 12px `.35`. Six selectable rows, `grid-template-columns:34px 1fr 48px; padding:11px 12px; border-radius:14px; cursor:pointer`; unselected `background:#17171a; border:1px solid transparent`; selected `background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.14)`; hover `rgba(255,255,255,.05)`. 34px avatar; name 500 13.5px; "{ordinal} · {lp} pts" 400 11px `.35`; luck 600 12px, mint when > +8, `#ff8f6b` when < −8, else `rgba(255,255,255,.45)`.

**Right — profile.**
- *Header card* (flex, `align-items:flex-end`): 56px avatar (700 16px code); "{ordinal} of 6 · {W}W {D}D {L}L" 400 12.5px `.4`; name 600 30px/1.05 `letter-spacing:-.025em`; "{manager} · {verdict}" 400 13px `.45`.
  Verdict copy (banter): rank ≤ 2 → "Insufferable, and entitled to it"; rank ≥ 5 → "Rebuilding. Allegedly."; else "Quietly hanging around the play-off places". Neutral: "{lp} league points from 14 gameweeks".
  Right: five stat chips, `background:#17171a; border-radius:14px; padding:13px 16px; min-width:96px`, each a 3×12px accent bar + label (400 11.5px `.45`) and value 600 24px `letter-spacing:-.025em`: League pts (`#7bdcb5`), Fantasy pts (`#ffc93c`), Avg / GW (`#68b6e8`), Luck (mint if ≥ 0 else `#ff4d16`), Bench lost (`#ff4d16`).
- *Points per gameweek* (`1.5fr`): title + hint "bar colour = H2H result · dashed = league average". 210px-tall flex row, `gap:7px`; each column is value label (500 11px `.5`) / bar / gameweek number (400 10px `.3`). Bar height = `points / maxLeagueGameweekScore`, `border-radius:6px 6px 3px 3px`; color = manager color on a win, `rgba(255,255,255,.28)` on a draw, `rgba(255,77,22,.55)` on a loss. A dashed `rgba(255,255,255,.3)` line sits at `bottom: average/max × 100%`. Legend beneath: "Won the week / Drew / Lost".
- *Squad contribution* (`1fr`): rows `32px 1fr 1.05fr 40px` — position code 500 10.5px in the position color, player 500 13.5px, 8px pill bar scaled to the top contributor, points 600 12.5px `.65`. Footer note (banter): "{topPlayer} is carrying this squad on his back. {bench} points have died on the bench — roughly {bench/avg} gameweeks' worth of shrugging."
- *Points by position* (`1.1fr`): four blocks, `align-items:end`, container height 190px. Block height = `66 + share/maxShare × 112` px, `border-radius:12px; padding:13px`, showing percent (600 16px) top and "{n} pts" (500 12px, 75% opacity) bottom; fills in order GK `#ff4d16` (white text), DEF `#ffc93c` (`#1a1207`), MID `#f4f4f2` (`#111`), FWD `rgba(255,255,255,.14)` (`rgba(255,255,255,.65)`). Caption below each, centered 400 12.5px `.45`.
- *Draft board* (`background:#141416`): "Draft board · {name}"; rows `44px 1fr 60px` — "Pick 4.02" 400 11.5px `.35`; player 500 13.5px + position; verdict line "Above/Below expectation for the slot" 400 11px `.35`; delta 600 14px mint or `#ff4d16`. Empty state: "No standout picks — Drafted exactly to expectation, which is its own kind of tragedy". Footer strip (`border-top:1px solid rgba(255,255,255,.06)`, `gap:22px`): Best gameweek (600 22px `#7bdcb5`), Worst gameweek (`#ff4d16`), Current run (`#f4f4f2`, e.g. `2W`).

### 3. Fixtures

- *Gameweek 14 results* (`1fr`, paired with Upcoming): title + "Final" pill. Three fixture rows on `#17171a`, `border-radius:14px; padding:14px 16px`, grid `1fr 96px 1fr`: home block (28px avatar + name 500 13.5px), centered scoreline (two 600 21px numbers `letter-spacing:-.02em` split by an en dash `rgba(255,255,255,.25)`), away block mirrored right-aligned. Winner's name and score `#f4f4f2`; loser's `rgba(255,255,255,.4)`.
- *Upcoming* (`1fr`): title + "win probability from last-5 form". Three gameweek groups (15, 16, 17), each labelled 500 11.5px `.4`, containing three rows grid `1fr 132px 1fr`: names 500 13px `rgba(244,244,242,.85)` (right one right-aligned) and a split 8px `border-radius:999px` bar, `gap:2px` — left segment in the home color at `p%`, right in the away color at 55% opacity — with both percentages beneath (500 10.5px `.4`). Probability = `avgLast5(home) / (avgLast5(home) + avgLast5(away))`, rounded; the pair sums to 100.
- *Head-to-head record*: grid `190px repeat(6,1fr)`, `gap:6px`. Header row = 3-letter codes centered in each manager's color (600 11px). Each body row starts with a 24px avatar + name, then six cells `padding:11px 0; border-radius:10px; font:500 12px`, text `W–D–L` for the row manager against that column. Cell tint: ahead → `rgba(123,220,181,.13)` / `#7bdcb5`; behind → `rgba(255,77,22,.13)` / `#ff8f6b`; level → `rgba(255,255,255,.05)` / `rgba(255,255,255,.6)`; diagonal → `—` on `rgba(255,255,255,.02)`.
- *Results archive* (`background:#141416`): title + "last six gameweeks · winner in white". Six equal cards on `#17171a`, `border-radius:14px; padding:14px`: "GW{n}" 500 11.5px `.4`, then three compact lines — 6px color dot + code, scoreline "{a}–{b}" 500 11.5px `.6`, code + dot mirrored. Winner code `#f4f4f2`, loser `rgba(255,255,255,.4)`.

---

## Interactions & Behavior

- **Tab nav** — three views, `Overview` default. Pure client state; no data refetch.
- **Standings row click** → sets the selected manager *and* switches to the Managers tab (deep link into the profile).
- **Manager list click** → sets the selected manager; the profile, position blocks and draft board all re-read.
- **Hover** — standings rows `rgba(255,255,255,.04)`; manager list rows `rgba(255,255,255,.05)`; nav items brighten to `#f4f4f2`. No transition durations are specified in the prototype; if the codebase has a standard hover transition (≈120–150ms ease-out on background/color), apply it.
- No loading, error, or empty states beyond the "no standout picks" draft-board fallback. Data is static in the prototype — add skeletons per the codebase's conventions when wiring to a real API.
- **Responsive**: desktop-only by design. The shell has a hard 1340px floor and scrolls horizontally below it. A mobile layout is out of scope and would need a separate design pass.
- **Copy tone toggle** — a `banter` boolean (default true) swaps the strap, KPI notes, bench caption, manager verdict and squad note between cheeky and neutral phrasings. Worth keeping as a config flag if the app has a "serious mode"; otherwise ship the banter copy.

## State Management

```
selectedManagerIndex : number   // 0–5, default 0 (league leader)
activeTab            : 'Overview' | 'Managers' | 'Fixtures'   // default 'Overview'
banter               : boolean  // default true
```

Everything else is derived from the raw dataset — no other stateful values. Data fetching, if any: one call for managers + per-gameweek scores; fixtures, standings, form and rank history are computed client-side from that.

## Design Tokens

**Color**

| Token | Value | Use |
|---|---|---|
| page | `#08080a` | body background |
| shell | `#0b0b0c` | app container |
| card | `#111113` | standard card |
| card-alt | `#141416` | secondary card, nav/logo pill |
| inset | `#17171a` | nested tile, fixture row, list item |
| inset-alt | `#1a1a1d` / `#1c1c20` | pills inside cards |
| ink | `#f4f4f2` | primary text, active nav fill |
| ink-on-light | `#111` | text on light fills |
| accent-orange | `#ff4d16` | hero band, losses, busts, bench waste, FWD |
| accent-mint | `#7bdcb5` | wins, steals, positive luck, MID |
| accent-amber | `#ffc93c` | secondary highlight, DEF |
| accent-blue | `#68b6e8` | tertiary highlight, DEF legend |
| accent-gold | `#e6c34a` | GK |
| loss-text | `#ff8f6b` | negative text on dark |
| Text alphas | `rgba(255,255,255,)` at `.85 .7 .6 .55 .5 .45 .4 .35 .3 .28 .25` | descending hierarchy |
| Hairlines | `rgba(255,255,255,.08)` shell border, `.07` section rule, `.06` inner rule, `.05` row rule | |
| Manager colors | `oklch(0.78 0.15 <hue>)` with hues 145, 200, 258, 318, 35, 88 | one per manager; identical L and C so no manager reads louder |

**Typography** — Barlow 400/500/600/700 (Google Fonts) for everything; IBM Plex Mono 400/500 is loaded and available for numeric/label accents.
Scale in use: 38/30 (page + profile headlines, 600, `letter-spacing:-.03em`/`-.025em`), 24/21 (stat values, 600, `-.02em`), 19/17 (card titles + KPI names, 600, `-.01em`), 14/13.5/13 (body + rows, 400–500), 12.5/12/11.5 (labels, 400–500), 11/10.5/10/9/8.5 (micro labels + chart ticks). Line-height 1 for figures, 1.15 for tight names, 1.4–1.55 for prose. `text-wrap:pretty` on the strap and long notes.

**Spacing** — 4 / 6 / 7 / 9 / 10 / 11 / 12 / 14 / 16 / 18 / 20 / 22 / 24 / 26 px. Card padding `22px 24px`; card gap `14px`; grid gutters `9–12px`.

**Radius** — 999px pills/avatars · 22px shell · 20px cards · 18px KPI cards · 14px inset tiles · 12px position blocks · 10px cells/rows · 8px logo mark · `6px 6px 3px 3px` bars · 3px accent bars.

**Elevation** — none. Depth comes from the background stack (`#0b0b0c → #111113 → #17171a`) and hairline borders. No shadows anywhere.

## Assets

None. No images, no icon set, no logos — the wordmark is type, avatars are colored circles with 3-letter codes, and the `▾ ▲ ▼ — –` glyphs are text characters. All charts are hand-built SVG plus CSS bars. If the codebase has an icon library, the `▾` chevrons and dot markers are the only candidates for substitution.

## Files

- `Fantasy Draft Dashboard.dc.html` — the full design: markup, inline styles, dataset and all derivation logic (fixture generator, standings, chart geometry, copy generation). Open it directly in a browser to interact with all three tabs.
- `support.js` — the prototype's runtime. Required only to view the HTML; **not** something to port.
