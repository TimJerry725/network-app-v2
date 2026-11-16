# EV Charging Network Apps: Competitor Audit (Zeon, Statiq, Tata Power EZ Charge, ChargeZone)

Built from public internet sources only (store listings, review aggregators, industry reports). No Iris app code or data was used.

## Evidence quality: read this first

No published UX audit of Zeon, Statiq, Tata Power EZ Charge or ChargeZone exists. What is public:
- Store listings and vendor blog posts (feature claims, not independent evidence).
- Small or inconsistent rating counts (see table below).
- Industry-level studies of other EV apps (J.D. Power, Spirii, Futurice, a Swedish thesis), usable as proxies, not as findings about these four apps.

Anything marked **[Unverified]** needs checking by reading the Play Store and App Store 1–2★ reviews directly, or by running the user test kit in section 6.

| App | Rating evidence found | Reliability |
|---|---|---|
| Zeon Charging | iOS India 4.7 (3,854 ratings) per App Store schema; other storefronts 4.2 (12) and 4.9 (16); Android ≈4.2–5.0 | Conflicting, sample sizes uneven |
| Tata Power EZ Charge | Android 3.2 (5 reviews, ~508K installs) or iOS 4.0 (16) | Very small samples |
| Statiq | No rating figures retrieved | None |
| ChargeZone | Not retrieved | None |

> **Update 2026-11-12:** real App Store (India) reviews have now been pulled and coded; see section 7. Where section 7 conflicts with the web-search findings above it, section 7 wins. Google Play reviews were NOT pulled (no public API), so Android-only issues are still missing.

## 1. Flavour A: How users understand the app (mental model)

| Finding | Evidence | App(s) |
|---|---|---|
| Users expect one job: find a charger, start, stop, pay. Zeon's own store copy frames it exactly this way (locate and navigate, start/stop, live status, trip planner, invoices, credit balance). | Zeon App Store listing | Zeon |
| Fragmentation is the core confusion. Each network needs its own app or prepaid account, and drivers cross-check aggregators for availability, then operator apps for pricing. | The Core, Mint | All |
| Wallet balance is a recurring comprehension failure: a Zeon reviewer reported the app showed the full wallet amount although it had been consumed by charging. | Review excerpt via search [Unverified, single review] | Zeon |
| Trust is damaged when app data is wrong: poor maintenance, supply issues and inaccurate app data erode trust. | Down To Earth | Industry |
| Public-charging users rank "chargers that work" and "easy authentication" as top needs; they also want real-time info and session transparency beyond showing availability. | Spirii survey | Industry |

**Implied mental model to design for:** "Show me a working charger, let me start in seconds, tell me honestly what it costs, and don't surprise me with my balance."

## 2. Flavour B: How the flow works (journey and breakdown points)

Common journey across Zeon, Statiq, EZ Charge: Install → Sign-in (OTP) → Find station (map/list/trip) → Check availability and tariff → Scan or select connector → Start → Live status → Stop/auto-stop → Invoice/wallet debit.

| Step | Reported or documented friction | Source | Confidence |
|---|---|---|---|
| Sign-in | Login failures and crashes are the top themes in EV charging app reviews; a Statiq reviewer reported the country selector not enabled at login | Futurice, App Store review | Medium (other apps) / Low (Statiq) |
| Start | Zeon reviewer: session stopped without explanation at a mall (Mysore) and Start stayed greyed out after a wallet top-up | Review excerpt | Low, single review |
| During session | Connection drops and delayed updates are the leading complaint category for EV apps (37% of non-Tesla EV app users, J.D. Power) | J.D. Power 2025 | Medium (not charging-network specific) |
| Payment | Wallet/payment problems are a standard complaint theme (Freshmile, BC Hydro reports) | Kimola reports | Medium (other apps) |
| Grievance | A government EV app is planned to push complaint handling onto operators, signalling that in-app support is weak today | Mint | Medium |

**Where to look first (highest-risk steps):** sign-in, start-after-top-up, mid-session stop explanation, post-session balance accuracy.

## 3. Flavour C: Most-used features (usage and demand)

No network publishes per-feature usage. Best available proxies:

| Rank | Feature | Evidence of importance |
|---|---|---|
| 1 | Reliable start/stop and live status | Core promise in every listing; "working chargers" is #1 in Spirii survey |
| 2 | Station finder with real-time availability | Aggregator dependence (PlugShare) shows existing apps fall short |
| 3 | Pricing and invoices/receipts | Zeon and Tata Power highlight invoices; GST receipts matter in India |
| 4 | Wallet/credit balance | Prominent in Zeon; also the main complaint |
| 5 | Navigation to station | In Zeon's core description |
| 6 | Trip planner | Offered by Zeon, but J.D. Power: 44% of non-Tesla EV app users have never used trip planning |
| 7 | Scheduled charging, in-app payment on OEM apps | 43% never scheduled; 54% never paid via manufacturer apps: desirable but unused |

**Takeaway:** features that guarantee a successful session are used most and judged hardest; planning and scheduling features are wanted but under-used.

## 4. Side-by-side snapshot

| Dimension | Zeon | Statiq | Tata Power EZ Charge | ChargeZone |
|---|---|---|---|---|
| Core flow | Locate, start/stop, live status, invoices, credit | Find, pay, review (vendor claim) | Pay for sessions, receipts in app, EZ Charge card | [Not retrieved] |
| Trip planner | Yes | [Unverified] | [Unverified] | [Unverified] |
| Wallet | Yes (complaints) | [Unverified] | Card + app | [Unverified] |
| Known complaints | Wallet display, session stop, missing features vs rivals | Login country selector (1 review) | "Frequent maintenance issues" claim, unsourced uptime figures | None found |
| Evidence strength | Low–Medium | Low | Low | None |

## 5. Gaps and what the Iris app should learn

1. Make wallet balance and pending deductions unambiguous after each session.
2. Explain every stop reason (user stop, charger fault, full battery, wallet limit).
3. Treat sign-in and first start as the critical path; keep OTP login simple.
4. Show verified availability, with last-updated time to avoid the "inaccurate app data" trust problem.
5. Keep planning features secondary to session reliability.

## 6. Next step: fill the evidence gap

To turn this into a true audit:
1. Export 200+ Play Store and App Store reviews per app, code them by flow step (login, find, start, live, stop, pay, support).
2. Run 5-user task tests per app using tasks: find a charger, start a session, read the cost, stop, find the invoice.
3. Compare completion rate, time and errors with a SUS score.

## Sources

- [Zeon Charging, App Store](https://apps.apple.com/in/app/zeon-charging/id1539882735)
- [Zeon Charging reviews, marlvel.ai](https://marlvel.ai/apps/zeon-charging/reviews) (aggregator, low reliability)
- [Futurice: EV charging apps](https://futurice.com/blog/ev-charging-apps)
- [Down To Earth: making charging easy and reliable in India](https://www.downtoearth.org.in/energy/to-truly-electrify-personal-mobility-india-must-make-charging-easy-reliable-and-accessible-for-all)
- [The Core: Indian EV owners forced into hundreds of apps](https://www.thecore.in/business/indian-ev-owners-forced-hundreds-mobile-apps-heres-why-2386520)
- [Bolt.earth: best EV charging apps in India](https://bolt.earth/blog/best-ev-charging-apps-in-india-2026-guide)
- [Tata Power EZ Charge, App Store](https://apps.apple.com/in/app/id1496350476)
- [Statiq, Google Play](https://play.google.com/store/apps/details?id=com.statiq)
- [J.D. Power 2025 US OEM EV App Report](https://www.jdpower.com/business/press-releases/2025-us-oem-ev-app-report)
- [Spirii: what makes a good charging experience](https://www.spirii.com/en/resources/blog/what-makes-a-good-charging-experience-we-asked-spirii-go-users)
- [Kimola: BC Hydro EV app feedback](https://kimola.com/reports/bc-hydro-ev-app-feedback-report-insights-solutions-app-store-ca-155654)

## 7. Review evidence: Apple App Store India (pulled 2026-11-12)

**Method:** public Apple customer-review RSS feed, most recent first, up to 10 pages per app. Each review was coded by keyword into flow steps (a review can hit several). This is **iOS India only**, and it is a sample of the most recent reviews, not all of them. Keyword coding is approximate; counts show direction, not precise rates. Raw data and script are kept in the session scratchpad and are not part of the repo.

| App | Reviews coded | Date span | Avg (sample) | Store rating (all-time) | 1–2★ share | 5★ share |
|---|---|---|---|---|---|---|
| Zeon Charging | 92 | Jun 2021 – Nov 2026 | 3.75 | 4.7 (3,854) | 29% | 64% |
| Statiq | 225 | Apr 2021 – Nov 2026 | 3.76 | 4.75 (5,969) | 29% | 62% |
| Tata Power EZ Charge | 500 | Mar 2024 – Nov 2026 | 3.48 | 4.40 (4,458) | 33% | 50% |
| ChargeZone | 130 | Nov 2022 – Nov 2026 | 3.98 | 4.75 (5,421) | 21% | 65% |

Recent reviews are markedly worse than the all-time ratings. The 1★ reviews are polarised: almost all negatives are 1★, not 2–3★.

### Where 1–2★ reviews cluster (share of that app's 1–2★ reviews mentioning the step)

| Flow step | Zeon (27) | Statiq (65) | EZ Charge (165) | ChargeZone (27) |
|---|---|---|---|---|
| App bugs / performance | 22% | 23% | **47%** | 26% |
| Start session | 15% | 28% | 18% | 22% |
| Wallet / payment / refund | **22%** | **26%** | 12% | **30%** |
| Support | 11% | 20% | 16% | **33%** |
| Find station / map / availability | 7% | 17% | 10% | 19% |
| During session / stop | 15% | 9% | 11% | 0% |
| Login / OTP | 4% | 9% | 13% | 11% |

### Findings per app (with real review evidence)

**Zeon** (low sample: 92)
- Strength: ~1 in 4 positive reviews cite ease of use; ~1 in 5 cite fast charging.
- Pain: charger stopping/slow charging (hardware experience blamed on the app), wallet billing and support non-response.
- Evidence: Aug 2026, wallet double-charged for its own session and another customer's; support email unanswered over a week and toll-free call unhelpful.

**Statiq**
- Strength: ease of use is the top positive theme (about 1 in 4 positive reviews).
- Pain: non-working chargers with no assistance, money stuck in wallet, poor customer service, a buggy update (Oct 2026), "poor UI, confusing hardware setup" (Sep 2026), unreadable charger displays on a 2,200 km trip.
- Pattern: users who recharged their wallet then could not charge anywhere, a trust-breaking sequence.

**Tata Power EZ Charge** (largest and worst-rated recent sample)
- Pain is dominantly **app quality**: nearly half the 1–2★ reviews mention bugs, crashes or errors; 81 of 500 reviews overall mention bugs.
- Start failures: "error occurred while charger reservation" on every attempt (Oct 2026); "configuration missing" with no charger name (Nov 2026); session starts and ends in one second when the gun is plugged in (Sep 2026).
- Stuck sessions needing customer support to "kill the session", and balance errors despite sufficient funds.
- Support itself broken: in-app grievance form and customer-care call both erroring (Oct 2026).

**ChargeZone**
- Strength: highest sample average; good infrastructure noted even in 1★ reviews.
- Pain: refunds not returned (Lucknow, Jul 2026), booking conflict ("time booked by someone else" / "already booked") that blocked charging while wallet money was recharged and not refunded, charger location not showing, and a deleted EV voucher that cannot be re-added with no workaround.
- Missing feature signal: users complain **advance booking was removed** (Apr 2026), showing booking is valued.

### Cross-app patterns (what users actually experience)

1. **Money trust is the sharpest failure:** wallet top-up followed by inability to charge, double billing, delayed or missing refunds (all four apps).
2. **Support is the second-order failure:** each negative incident is amplified by no reply, or the support channel itself failing (EZ Charge, Zeon, ChargeZone, Statiq).
3. **Hardware blame lands on the app:** non-working or slow chargers produce 1★ app reviews; users cannot tell app, charger or network faults apart. Clear fault messaging is a design opportunity.
4. **Start-session is the highest-friction step** for Statiq and ChargeZone; **app stability** is the top issue for EZ Charge.
5. **Ease of use is the main thing users praise** across all four, so a simple flow is a competitive baseline, not a differentiator.
6. **Booking/reservation** is valued but fragile (ChargeZone's removal and conflict reports).

### Impact on the three audit lenses

- **Understanding:** users judge the app by whether the charger and wallet worked, not by UI. Make cause of failure explicit (charger fault vs payment vs network).
- **Flow:** the critical path is wallet top-up → start → stop → balance reconciliation. Test it first.
- **Most used / valued features:** start/stop with live status, wallet, station availability, and booking; trip planning does not appear as a theme in reviews.

### Limits

- App Store India only; Google Play (the larger Android base) not covered.
- Sample is the recent tail, skewed negative by the reviewers' motivation.
- Keyword coding over-counts generic words (for example "charge", "update"); read the quoted examples as the real evidence.
- Not covered: Jio-bp pulse, Ather Grid, Kazam, Bolt.Earth and others.

### Additional sources

- [Zeon Charging reviews feed (Apple RSS)](https://itunes.apple.com/in/rss/customerreviews/id=1539882735/sortby=mostrecent/json)
- [Statiq reviews feed](https://itunes.apple.com/in/rss/customerreviews/id=1520534378/sortby=mostrecent/json)
- [Tata Power EZ Charge reviews feed](https://itunes.apple.com/in/rss/customerreviews/id=1496350476/sortby=mostrecent/json)
- [ChargeZone reviews feed](https://itunes.apple.com/in/rss/customerreviews/id=1627426498/sortby=mostrecent/json)

## 8. Feature placement: first screen vs More page (user and CPO view)

Derived from section 7 review evidence plus the flows in sections 2–3. CPO = charge point operator. Priority: **P0** must be on first screen, **P1** one tap away (tab or sheet), **P2** inside More.

| Feature | User importance | CPO importance | Placement | Why (evidence) |
|---|---|---|---|---|
| Nearby stations map with live status (available / busy / faulty) | Very high | Very high | **First screen (P0)** | "Station not working", "charger location not showing"; status honesty cuts wasted trips and 1★ reviews. CPO: drives utilisation |
| Scan QR / enter charger ID (Start) | Very high | Very high | **First screen (P0), primary button** | Start session is the top friction step (Statiq 28%, ChargeZone 22%); CPO revenue begins here |
| Active session card (live kWh, cost, stop) | Very high while charging | High | **First screen (P0), appears only when charging** | Stuck/ended-in-a-second sessions; users need visibility and a clear stop |
| Wallet balance + Add money | Very high | Very high | **First screen (P0), compact chip** | Wallet issues are the #1 trust failure (22–30% of 1–2★ in Zeon, Statiq, ChargeZone); CPO wants float and repeat top-ups |
| Search + filters (connector, speed, price, amenities) | High | Medium | **First screen (P0) as search bar; filters in a sheet** | Users filter by vehicle fit; sheet keeps screen clean |
| Selected vehicle / connector match | High | Medium | **P1, chip on first screen, manage in More** | Prevents wrong-connector starts; edit rarely |
| Station details (tariff, idle fee, amenities, hours) | High | High | **P1, opens on station tap** | "Tax is more", surprise charges; CPO needs idle-fee disclosure to avoid disputes |
| Fault / issue report on a station | Medium | Very high | **P1 inside station details and session screen** | Hardware blame hits app ratings; CPO gets uptime data and faster fixes |
| Booking / reserve a charger | Medium–high | High | **P1, button in station details** | ChargeZone users miss it when removed; conflicts must be handled with refunds |
| Trip planner | Medium | Medium | **P1 tab or Explore card** | Not a theme in any review; wanted by long-trip users (2,200 km complaint) |
| Favorites | Medium | Low–Medium | **P1 tab or inside Map** (heart on station) | Convenience; supports retention |
| Charging history and invoices (GST) | Medium–high | High | **P1 tab or Profile top item** | Billing disputes and refunds; CPO reduces support tickets |
| Help / support (chat, call, ticket status) | High when failing | Very high | **P1 persistent "Help" entry plus contextual link on failed start/payment** | Support failures amplify every incident; deflecting tickets cuts CPO cost |
| Refund / failed transaction status | High | High | **P1 under History / Wallet** | "Money stuck", "refund not received" |
| Notifications (charge complete, idle fee warning) | Medium | High | **P1 settings toggle in More; alerts themselves are pushed** | Idle-fee warnings reduce penalties and free up bays |
| Offers, rewards, referral | Low–Medium | High | **P2 More (one banner at most on first screen)** | Not mentioned in reviews; CPO acquisition lever, shouldn't crowd critical actions |
| CO₂ / green energy stats | Low | Low (marketing) | **P2 More** or inside receipt | Not a review theme |
| Profile, edit details, KYC | Low frequency | Medium | **P2 More** | Rare task |
| Manage vehicles (add / edit / delete) | Medium once | Medium | **P2 More** | Note ChargeZone bug: deleted vehicle cannot be re-added; test this flow |
| Language, theme (light / dark), units | Low | Low | **P2 More** | Set once |
| FAQs, terms, privacy, about, app version | Low | Medium (compliance) | **P2 More** | Compliance, rarely opened |

### Resulting layout

**First screen:** map with live status → search bar and filter button → wallet chip → floating Scan button (primary) → active-session card when charging → Help icon.

**Bottom tabs (P1):** Map · Trips · Scan · Favorites · History (invoices, refunds).

**More page (P2):** Profile · Vehicles · Offers and referral · CO₂ stats · Notifications · Language and theme · FAQs and legal · About.

### Decision rules

- Anything involved in starting, stopping or paying for a session goes on the first screen or inside that flow.
- Anything that protects money trust (wallet, refund status, invoices) is never buried in More.
- Anything set once (profile, language, theme) or marketing-led (offers, CO₂) goes in More.
- Support is always reachable in one tap and appears inline at failure points.

### Confidence

Medium. Placement follows what review data shows hurts users most, not tap analytics. Validate with the task tests and event instrumentation from the earlier kit. Reviews do not mention offers, CO₂ or trip planner, so their low placement is partly an absence-of-evidence call.

## 9. Three flavours: shared core plus unique features per flavour

Same backbone in all three (section 8 P0/P1 items). Each flavour then adds its own signature features, which are NOT in the other two. Placement: **First** = first screen, **Tap** = one tap away, **More** = More page.

### 9.0 Shared core (identical in all flavours)

| Feature | Placement |
|---|---|
| Station map with live status | First (AI: second tab, see 9.1) |
| Scan QR / charger ID (Start) | First, primary |
| Active session card with Stop | First, only while charging |
| Wallet balance + Add money | First, chip |
| Search + filter sheet | First |
| Station details, fault report, booking | Tap |
| History, invoices, refund status | Tap |
| Help / support (always reachable) | Tap, persistent |
| Profile, vehicles, language, theme, legal | More |

### 9.1 Flavour 1: AI (chat-first)

First screen = prompt bar with suggestion chips, plus the Start button and wallet chip. Map is one tap away.

| Unique feature | Placement | User value | CPO value | Review pain it answers |
|---|---|---|---|---|
| Assistant prompt bar ("Find a fast charger near me") | First | High | High | Hard-to-find working chargers; removes filter fiddling |
| "Why did my session stop?" explainer (charger fault vs wallet vs network) | First (chip) and inside session | Very high | Very high | Hardware blamed on the app; stuck/stopped sessions; cuts tickets |
| Wallet and refund Q&A ("Where is my refund?") with ticket status | Tap (inside chat) | Very high | Very high | Money stuck, refunds missing, support unreachable |
| Generative widgets (nearest DC, route with stops, range, last receipt) | Inside chat | High | Medium | Replaces trip planner and history lookups |
| Start by voice or text ("Start charging at CPID 1234") | Tap | Medium | High | Start-session friction |
| Smart trip assistant (range-aware stops) | Tap | Medium–high | Medium | Long-trip failures (2,200 km complaint) |
| Proactive nudges (idle-fee warning, session done) | Pushed | Medium | High | Frees bays, avoids disputes |
| AI / Bento mode switch | More | Low | Low | Preference only |
| Chat history and AI privacy settings | More | Low | Medium | Compliance |

Risks to design out: made-up prices or range (use only live data), chat as the only path (always keep Scan and map reachable), and a human handoff when the assistant cannot resolve a payment issue.

### 9.2 Flavour 2: CRED (rewards, finance-grade trust)

First screen = wallet and rewards header, map or station carousel, centre Scan button.

| Unique feature | Placement | User value | CPO value | Review pain it answers |
|---|---|---|---|---|
| Wallet hero card with live balance, pending holds and last transaction | First | Very high | Very high | Wallet shows wrong balance; double billing |
| Rewards coins / cashback on each session | First (badge) | Medium–high | Very high | Retention and repeat top-ups |
| Transaction ledger with itemised GST and instant "dispute this charge" | Tap | Very high | High | Double billing, refund delays; cuts support cost |
| Spend and savings summary (monthly kWh, ₹, vs petrol) | Tap | Medium | Medium | Cost transparency ("tax is more") |
| Membership tiers (priority booking, lower tariff, idle-fee waiver) | Tap | Medium | Very high | Revenue and loyalty |
| Auto top-up with limit and refund-to-source | Tap | High | High | Wallet friction |
| Streaks and milestones | More | Low–medium | Medium | Engagement |
| Referral | More | Low | High | Acquisition |
| Offers and partner perks | More (one banner on first screen) | Low–medium | High | Monetisation |

Risks: reward UI crowding the Start button, and reward promises the operator cannot honour. Premium look raises expectations that payments never fail.

### 9.3 Flavour 3: Retro / cockpit (telemetry and companion)

First screen = vehicle dashboard (battery gauge, range), Volt mascot tip strip, station radar map, Start button.

| Unique feature | Placement | User value | CPO value | Review pain it answers |
|---|---|---|---|---|
| Vehicle dashboard gauges (SoC, range, charge target) | First | High | Medium | Users unsure when to charge |
| Live session telemetry (kW, V, A, time to full, cost) | First while charging | High | Medium | Sessions that stall or end in one second look obviously wrong |
| Station health LEDs (green / amber / red with last-checked time) | First, on map pins | Very high | Very high | Non-working chargers; trust in availability |
| Volt mascot as fault coach ("Charger X is offline, try bay 2 or report") | Tap, contextual on errors | High | High | Error messages unexplained; support load |
| Pre-charge diagnostics (connector match, plug seated, wallet check) | Tap, before start | High | High | Failed starts, wrong connector |
| Missions and badges (first fast charge, 10 sessions) | Tap | Low–medium | Medium | Engagement |
| CO₂ odometer / eco score | More | Low | Low (marketing) | Brand story |
| Vehicle health log (charge cycles, battery notes) | More | Low–medium | Low | Retention |
| Cockpit theme intensity, sound, haptics, reduced motion | More | Low | Low | Accessibility and battery use |

Risks: jargon badges that novices cannot decode, animation draining battery during long sessions, and playful tone near payments (keep wallet and refunds in plain language).

### 9.4 Quick comparison

| Dimension | AI | CRED | Retro |
|---|---|---|---|
| Hero of first screen | Prompt bar | Wallet and rewards | Vehicle gauges and station radar |
| Main differentiator | Explains and resolves | Trust in money, loyalty | Visible status, coaching |
| Review pain mainly attacked | Support and failed sessions | Wallet, billing, refunds | Charger status, start failures |
| Best CPO outcome | Lower ticket volume | Higher repeat revenue | Higher uptime visibility and utilisation |
| Biggest design risk | Chat hides core actions | Rewards crowd the flow | Theme hurts clarity |

### 9.5 Build order suggestion

1. Build the shared core first, including wallet reconciliation, refund status and in-flow support (sections 8 and 9.0).
2. Then add the single flavour feature that answers the loudest review pain: AI "why did it stop", CRED ledger with dispute, Retro station health LEDs.
3. Add the rest of each flavour's unique features after the signature one works.

Confidence is medium. Placement and value ratings come from review themes (section 7) and have not been validated with usage data; check them with the task tests and event plan from the earlier kit.
