# White-Label EV Charging App: Rethinking the Three Styles from the User Up

Perspective: senior product manager with product-design lens. Features and screens already built are deliberately ignored. Evidence labels: **[Research]** from sources listed at the end, **[Reviews]** from the App Store review analysis in `docs/competitor-audit`, **[PM judgment]** my recommendation, not proven.

## 1. The real problem

Iris is SaaS sold to many charging operators (tenants). Today every tenant gets the same app with a new logo and colour. Tenants say: "we look like everyone else."

**Research confirms this is an industry-wide gap, not a bug:**
- White-label vendors typically offer logo, colour scheme, custom domain, and sometimes QR codes and back-office branding; deeper changes depend on the vendor's roadmap. [Research: Codibly, ChargePanel, AMPECO]
- Theming systems layer core → brand → white-label, but almost always change only colour and typography. Layout and navigation usually stay fixed. [Research: Brad Frost, Engineering11]
- 72% of EV drivers have no preferred public charging provider, so brand loyalty is unclaimed. A distinctive app is a competitive lever. [Research: Arthur D. Little]

**Reframe:** the problem is not "three skins." It is that tenants need different *experiences for different kinds of drivers*, built on one reliable core. Visual style should be the *consequence* of who the tenant serves.

## 2. What users need (the part that must not change)

Driver segments [Research: University of Melbourne via RenewEconomy / The Driven, BCG]:

| Segment | Share (where known) | What they care about |
|---|---|---|
| Cost-sensitive planners / calculators | ~27% | Price, timing, savings |
| Convenience-first / flexibility seekers | ~19% (plus others) | Fast, near, no thinking; decide on the go |
| Range seekers | Skews high income | Speed, range confidence, premium |
| Indifferent late adopters | ~8% | Charging should work like refuelling |
| Public-only vs home-charging access | BCG archetypes | Public-only drivers depend on the network daily; home-charging drivers use it on trips |

What actually breaks trust, from 947 recent App Store reviews [Reviews]:
1. Money: wallet top-up then cannot charge, double billing, missing refunds (22–30% of 1–2★ reviews in Zeon, Statiq, ChargeZone).
2. Not knowing if a charger works, and blaming the app for hardware faults.
3. Start-session failure (Statiq 28%, ChargeZone 22% of 1–2★).
4. Support that is absent or itself broken.
5. App stability (47% of EZ Charge 1–2★).

### Non-negotiable core (identical in every style and every tenant)

These are guardrails. Tenants can restyle them, never remove or hide them.

| Core job | Guardrail |
|---|---|
| "Is there a working charger near me?" | Live status with last-updated time |
| "Start charging without failure" | Start in two taps or fewer; clear reason on failure |
| "Know what I will pay and what I paid" | Price before start, itemised receipt, wallet balance always visible |
| "Stop and leave safely" | Always-visible Stop with plain confirmation |
| "Fix it when it goes wrong" | Help reachable in one tap and inline at every failure; refund status visible |
| "AI assistant" | Available in every style (see section 6) |

## 3. What tenants can differentiate: seven axes

White-label today stops at axis 1. The opportunity is axes 2–7. [PM judgment]

| # | Axis | Tenant can change | Cost to build |
|---|---|---|---|
| 1 | Brand identity | Logo, colour, type, icons, radius | Low (tokens) |
| 2 | **Home composition** | What the first screen leads with (map, wallet, vehicle, assistant, offers) | Medium (layout presets) |
| 3 | **Information density** | Simple (few elements) to rich (data heavy) | Medium |
| 4 | **Voice and tone** | Plain, warm, premium, playful; microcopy and error wording | Low (content config) |
| 5 | **Interaction feel** | Motion, haptics, sound, transition style | Medium |
| 6 | **Value proposition and loyalty** | Savings, rewards, membership, community, status | Medium–High |
| 7 | **How the app learns the user** | Onboarding questions, signals used, personalisation | Medium |

Axis 7 is the answer to "find the unique way to understand user needs": each style learns the driver differently (section 5).

## 4. Three style archetypes defined by the driver they serve

Names are working titles. Each maps to a segment, not to a colour palette. [PM judgment, informed by the segment research]

| | **1. Effortless** | **2. Member** | **3. Cockpit** |
|---|---|---|---|
| Serves | Convenience-first, flexibility seekers, indifferent late adopters, first-time EV owners | Cost-sensitive planners, regular daily chargers, price-aware commuters | Range seekers, EV enthusiasts, long-trip drivers, tech-forward owners |
| Core promise | "Charging as simple as refuelling" | "Every charge is cheaper and rewarded" | "Full control and confidence in your car and trip" |
| Typical tenant | Highway, fuel-station, mall and mass-market operators | Utility, retail, fintech-linked or loyalty-led operators | Premium, OEM-linked, or enthusiast-brand operators |
| Home leads with | One big **Start charging** + nearest working charger | **Wallet, savings and rewards** + nearby cheapest/best-value charger | **Vehicle status, range, route readiness** + station health |
| Density | Low: one decision per screen | Medium: numbers that prove value | High: telemetry, gauges, detail on demand |
| Voice | Plain, reassuring, short | Confident, precise, transparent about money | Expressive, technical, playful |
| Motion | Minimal, fast | Smooth, rewarding moments (savings reveal) | Tactile, instrument-like |
| Loyalty hook | Repeat convenience ("your usual charger") | Points, cashback, tiers, monthly savings | Badges, vehicle history, community, status |
| Risk | Feels generic if brand is weak | Rewards crowd the critical flow | Jargon and decoration hurt novices |
| Existing code to adapt | Base/neutral build | The CRED-style build | The Retro-style build |

AI is not a fourth style. It lives inside all three (section 6).

## 5. The unique way each style understands the user

| | Effortless | Member | Cockpit |
|---|---|---|---|
| Onboarding | Zero questions; ask only phone and vehicle | 3 quick goals: usual place, monthly charging spend, "save or speed?" | Connect or select exact vehicle model and battery; pick charging style |
| Signals learned | Time of day, repeat chargers, home area | Spend, tariff timing, chargers used | Battery use, route patterns, charging speed history |
| Personalisation | "Your usual charger" one-tap repeat; smart default connector | "You saved ₹X this month"; suggest cheaper window or charger | Range-aware stops, charge-to-target suggestions, vehicle health tips |
| Question the app asks itself | "How do we remove one step?" | "Is this driver getting value for money?" | "Does this driver have what they need for the next trip?" |
| Success signal | Time to first charge, repeat rate | Wallet top-up frequency, savings shown, reward redemption | Trips planned, sessions per month, premium plan uptake |

## 6. One feature set, expressed three ways

Every feature exists in all styles. What changes is where it sits, how it speaks and how much it shows.

| Feature | Effortless | Member | Cockpit |
|---|---|---|---|
| Find a working charger | Nearest one, large status chip | Cheapest and best-value ranked, price on pin | Station health LEDs and speed on pin, filter by car |
| Start charging | Giant primary button, scan or auto-detect | Scan with price and savings shown before start | Pre-charge checks (connector, wallet, plug) before start |
| Live session | One big number: cost and time left | Cost, savings vs petrol, reward earned | Full telemetry: kW, V, A, SoC curve |
| Wallet | Small chip, top-up in one tap | Hero card with holds, ledger, dispute | Compact balance with auto top-up rules |
| Receipt | Short, plain | Itemised GST, savings, rewards | Detailed with energy curve and CO₂ |
| Support | Single Help button, human handoff | Dispute-this-charge on any transaction | Diagnostic coach explains the fault |
| Trip planning | Optional card | "Cheapest route" option | Range-aware route with charging stops |
| Loyalty | Repeat-charger shortcut | Rewards, tiers, referral | Badges, vehicle history, community |
| **AI assistant** | Short answers, actions only ("Start at my usual") | Money-aware ("Why was I charged this?", "Cheapest charger now") | Technical ("Will I make it to Pune at 20%?") |

**AI rules for all styles:** only use live data (no invented prices or range), always offer a human route for payment or safety issues, show what it did, and let the driver bypass it. Tone and defaults come from the tenant's style and voice config. [PM judgment, informed by trust failures in Reviews]

## 7. How to discover the right style for each tenant

Run before any build for a new tenant (one week):

1. **Tenant brief (30 min):** who are your drivers today, what do you want them to feel, what do you sell besides electricity (retail, parking, loyalty), who are your competitors, what must never happen.
2. **Driver data check:** sessions per user, repeat rate, top-up size, time of day, vehicle mix. This tells which segment dominates.
3. **Pick a primary archetype and one secondary trait** (for example Effortless with a Member loyalty layer).
4. **Configure axes 1–7** from presets, not custom code.
5. **Test with 5 drivers from the tenant's real base** using the task kit in `docs/ux-audit` (T1–T12), then adjust.

## 8. What this means for building

[PM judgment, with the theming research in mind]

- **Three layers in code:** (a) core flows that never change, (b) style presets that change home composition, density, motion, tone, and (c) tenant theme tokens (colour, type, radius, logo, content). Most vendors stop at (c).
- **Component variants, not forks:** the Start button, station card, wallet and session views each get variants per style, sharing logic and tests. Avoid three separate apps.
- **Tenant config over code:** home layout, tone pack, loyalty module on/off, onboarding questions as configuration.
- **Accessibility and safety floors** enforced across all presets (contrast, 48 px targets, reduced motion).
- **One analytics schema** across styles so tenants can be compared fairly.

## 9. Validation and metrics

| Question | Metric | Compare |
|---|---|---|
| Does the style help the right driver? | Time to first charge, task success (T7), SUS | Style vs neutral baseline |
| Does it build loyalty? | 30-day repeat rate, top-up frequency | Before vs after for the tenant |
| Does it protect trust? | Failed-session rate, refund tickets, 1–2★ share | Every style, guardrail check |
| Is the differentiation noticed? | Unaided brand recall after 1 day; "this app feels like [tenant]" agreement | Tenant app vs competitor screenshots |
| Is the build cost sustainable? | Hours to launch a new tenant | Target: config, not code |

## 10. Risks and open questions

- Evidence gap: no source I found quantifies the effect of layout-level white-label variation on retention. Treat the archetypes as hypotheses to test with the first tenants.
- Segment shares come from Australian research; Indian driver mix may differ. Validate with tenant data.
- Style can become decoration. Rule: if a style choice cannot be tied to a driver need, drop it.
- Which tenant is the first test for each archetype? (Decision for you.)

## Sources

- [Codibly: White Label EV Charging Software](https://codibly.com/blog/articles/white-label-ev-charging-software)
- [Codibly: White Label CPO Platform](https://codibly.com/blog/articles/white-label-cpo-platform)
- [AMPECO: white-label vs custom mobile app](https://www.ampeco.com/blog/solving-the-white-label-vs-custom-mobile-app-dilemma-in-ev-charging/)
- [ChargePanel: white-label EV charging platform](https://chargepanel.com/)
- [RenewEconomy: how EV drivers approach charging differently](https://switchedon.reneweconomy.com.au/content/from-cost-to-range-electric-vehicle-drivers-approach-charging-differently)
- [The Driven: modes of EV charging behaviour](https://thedriven.io/2023/09/01/from-cost-sensitive-planners-to-range-seekers-the-multiple-modes-of-ev-charging-behaviour/)
- [BCG: advancing the adoption of electric vehicles](https://bcg.com/publications/2023/advancing-the-adoption-of-electric-vehicles)
- [Arthur D. Little: customer experience drives value in public EV charging](https://adlittle.com/node/24153)
- [Transport Xtra: EV charging, customer loyalty and brand differentiation](https://www.transportxtra.com/publications/transit/news/73685/ev-charging-the-power-to-build-customer-loyalty-and-brand-differentiation)
- [Brad Frost: the many faces of themeable design systems](https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/)
- [Engineering11: theming and white-label](https://docs.engineering11.com/frontend/capabilities/theming)
- Internal: `docs/competitor-audit/EV_CHARGING_COMPETITOR_AUDIT.md` (App Store India review analysis)
