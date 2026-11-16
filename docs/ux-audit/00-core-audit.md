# Iris EV Charging App: User Understanding & Usage Audit (Core Kit)

Shared by all three flavours: [AI](01-flavour-ai.md) · [CRED](02-flavour-cred.md) · [Retro](03-flavour-retro.md).
Run this core kit with every participant, then add the flavour module for the build they used.

## 0. Why this audit exists

The repo has no analytics SDK and no real user data (stations are mock/Google Places, sessions are simulated in `ChargingContext`). This kit **creates** that data. It answers three questions:

1. **Understanding**: do users grasp what the app does and how the flow works?
2. **Usage**: which features do they actually use, and in what order?
3. **Flavour effect**: does the visual/interaction style (AI chat, CRED, Retro) help or hurt 1 and 2?

## 1. Method (≈ 45 min per participant)

| Step | Time | Output |
|---|---|---|
| A. Pre-screen | 3 min | EV ownership, charging frequency, apps used today |
| B. First-impression test (no guidance) | 5 min | Unprompted description of the app, 5-second recall |
| C. Task run (section 4) | 20 min | Success, time, errors, hesitation per task |
| D. Feature usage survey (section 5) | 7 min | Frequency + importance ranking |
| E. Comprehension & trust questions (section 6) | 7 min | 1–5 scores + quotes |
| F. SUS + flavour module | 3 min | Score |

**Sample:** 8–10 participants per flavour (min 5). Mix: ≥50% current EV drivers, ≥2 first-time EV users, ≥2 who have used another charging app (Tata Power, Statiq, ChargeZone, etc.). Same device class across flavours. Randomise which flavour each person sees first if testing more than one.

**Ground rules:** think-aloud, moderator never explains UI, record screen and audio with consent, stop a task after 3 min and mark it failed.

## 2. App map (derived from the code)

```
Splash → Login → Main (bottom tabs)
  Map ─────────── StationMapScreen   (map, filters, search, profile entry)
  Trip Planner ── TripPlannerScreen  (route + charging stops, saved trips, filter sheet with amenities)
  Scan ────────── ScanScreen         (QR scan, or manual CPID entry)
  Favorites ───── FavoritesScreen
  Vehicles ────── VehicleListScreen  (tab is LABELLED "Sessions" with a history icon)
Stack screens: StationDetails · Filter · Profile · EditProfile · ChargingSession · Payment
```

**Core journey:** Login → find station (Map / Trip Planner / Favorites) → Station Details (availability, tariff, amenities) → Scan QR or enter CPID → connector/vehicle check → Charging Session (live SoC curve, kW, kWh, cost, stop with confirmation) → Payment/receipt (energy, CGST/SGST, total, CO₂ offset) → back to Map / Scan / Sessions.

**Side journeys:** Add/select vehicle · Favourite a station · Save a trip · Edit profile · Wallet recharge (shown in Station Details) · Idle-fee grace period after charge ends (`PostChargeGraceContext`).

### Audit hypotheses from code review (test these, don't assume)

| # | Hypothesis | Where |
|---|---|---|
| H1 | The 5th tab is routed as `Vehicles` but labelled "Sessions" with a clock icon, so users expecting session history may not find their vehicles, and vice versa | `TabNavigator.tsx` |
| H2 | "Directions" in Station Details only shows an alert ("Navigating to…"), so users expecting turn-by-turn will think it is broken | `StationDetailScreen.tsx:198` |
| H3 | Wallet recharge shows a success alert without a payment step, so trust and credibility are at risk | `StationDetailScreen.tsx:774` |
| H4 | Idle fee/grace period is shown as a tariff row, so users may not notice it until they are penalised | `StationDetailScreen.tsx:839-843` |
| H5 | Users with no vehicle selected may not understand why chargers are filtered or blocked | `VehicleContext` |
| H6 | Manual CPID entry is a secondary path, so users in poor light or with a damaged QR may not find it | `ScanScreen.tsx:735` |
| H7 | Stop-charging confirmation is understood, but users may not know what happens to payment after | `ChargingSessionScreen.tsx:220-247` |
| H8 | Theme/style heavy screens (uppercase labels, telemetry badges) reduce scan speed for first-time users | all flavours |

## 3. First-impression & mental-model questions (Step B)

Ask before any task. Record verbatim.

1. "In your own words, what is this app for?"
2. "What do you think you can do on the first screen after login?"
3. "Point to where you'd go to: find a charger · start charging · see what you paid · save a place · change your car."
4. Show the tab bar for 5 seconds, hide it: "Which tabs do you remember? What do you think each does?"
5. "What do you expect happens when you tap Scan?"
6. "Draw or describe the steps from arriving at a charger to leaving."

**Score (0–3 each):** purpose stated correctly · journey described in correct order · tab meanings guessed correctly.

## 4. Task script (Step C)

For each: success (0 fail / 1 assisted / 2 clean), time, wrong taps, quote.

| # | Task | Success looks like |
|---|---|---|
| T1 | Log in and describe what you see | Reaches Map without help |
| T2 | Add or choose your car | Vehicle selected, connector type clear |
| T3 | Find the nearest fast charger that fits your car | Uses filter or map, picks CCS2/DC |
| T4 | Check price, availability and amenities of one station | Finds tariff + status in Station Details |
| T5 | Save that station for later | Favourite set; finds it in Favorites |
| T6 | Plan a trip to a city 250 km away and save it | Route with charging stop saved |
| T7 | Start a charge (scan QR or enter CPID `<test id>`) | Session starts |
| T8 | While charging, say how much energy, how long and what it has cost so far | Reads kWh, time, ₹ correctly |
| T9 | Stop charging safely | Confirms stop, reaches summary |
| T10 | Find your receipt and say what the GST was | Finds CGST/SGST rows |
| T11 | Find your past sessions | Locates history (tests H1) |
| T12 | Edit your name or profile details | Saves successfully |

Rank tasks by failure rate × task importance to produce the priority list.

## 5. Feature usage survey (Step D)

Scale for frequency: Never · Rarely · Monthly · Weekly · Almost every charge.

| Feature | Frequency | Importance (1–5) | Understood without help? (Y/N) |
|---|---|---|---|
| Map of stations | | | |
| Filters (connector, speed, price, amenities) | | | |
| Station details (tariff, availability) | | | |
| Trip planner | | | |
| Saved trips | | | |
| Favorites | | | |
| QR scan | | | |
| Manual charger code | | | |
| Live charging curve | | | |
| Stop charging | | | |
| Receipt / GST breakdown | | | |
| Wallet | | | |
| Vehicle management | | | |
| Profile | | | |
| Dark/light theme | | | |
| CO₂ / green energy stats | | | |

Follow-ups:
- "Which one feature would make you keep the app? Which could you delete?"
- "What do you do today that this app should do but doesn't?"
- "At which step were you most unsure what would happen next?"

## 6. Comprehension, trust & clarity (Step E): 1 = strongly disagree, 5 = strongly agree

| ID | Statement |
|---|---|
| C1 | I always knew where I was in the process. |
| C2 | I knew what each button would do before I tapped it. |
| C3 | The names of the tabs matched what I found inside. |
| C4 | I understood what I would be charged and why. |
| C5 | I trusted the app with my payment and wallet. |
| C6 | I felt in control while the car was charging. |
| C7 | Error and empty states told me what to do next. |
| C8 | I could do this again later without help. |
| C9 | The visual style helped me find things faster. |
| C10 | The visual style made things harder to read or understand. |

Plus **SUS (10 items)** and **one-line NPS**: "How likely are you to recommend this app to another EV driver (0–10)?"

## 7. Scoring & report

Compute per flavour:

| Metric | Formula | Target |
|---|---|---|
| Comprehension score | Step B total / max | ≥ 70% |
| Task success rate | clean+assisted/total, clean rate separately | ≥ 85% / ≥ 70% |
| Median time-on-task | per task | T7 ≤ 90 s |
| Error rate | wrong taps per task | ≤ 1.5 |
| Clarity index | mean of C1–C8 | ≥ 4.0 |
| Style fit | C9 − C10 | > 0 |
| SUS | standard | ≥ 70 |
| Feature reach | % using each feature weekly+ | rank order |

**Severity:** 4 blocks a task for ≥30% of users · 3 causes failure or error for some · 2 slows users · 1 cosmetic.

**Report outline:** summary → comprehension findings → ranked feature usage → task heatmap (task × flavour) → issues by severity with evidence → recommendation per flavour → what to instrument (section 8).

## 8. Instrument the app afterwards (so the next audit uses real data)

Minimum events (none exist today):

`app_open` · `login_success` · `vehicle_selected` · `map_filter_applied` · `station_opened{id}` · `favorite_toggled` · `trip_planned` · `trip_saved` · `scan_started` · `scan_method{qr|manual}` · `charge_started` · `charge_stopped{reason}` · `payment_viewed` · `wallet_recharge_tapped` · `tab_viewed{name}` · `error_shown{code}`

Key funnels: Login → Station opened → Scan → Charge started → Payment viewed. Report drop-off per step and per flavour build.

## 9. Appendix: consent text and test data

- Consent: recording purpose, anonymisation, right to stop, data retention (e.g. 90 days).
- Provide a test charger code, a test vehicle and a test account so no personal data is needed.
- Never ask participants to enter real card or bank details.
