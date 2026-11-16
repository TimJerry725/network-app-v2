# Flavour module 3: Retro-Futurism style (`dev/retro-style`)

Run after the [core kit](00-core-audit.md). Build identity: "Orbital Ion Deck" cockpit theme (see `DESIGN.md` on that branch): bezel cards (`RetroBezelCard`), circular gauges, status LEDs, telemetry badges (e.g. `[480V // 150kW]`, `SYS:OK`), CRT scanline accents, tactile `RetroButton`, and a friendly robot mascot **"Volt"** that helps with diagnostics, tips and error recovery. It also contains the Gemini chat screen and generative widgets.

## What is different from the other flavours

| Area | Retro-specific element |
|---|---|
| Data display | Gauges, LEDs, segmented meters, jargon-heavy badges |
| Guidance | Mascot "Volt" for tips and errors |
| Tone | Cockpit/space vocabulary |
| Density | High (≈ 7/10 per design brief) with 48 px touch targets |

## Key audit questions

**Understanding**
1. "What does the cockpit/space theme tell you this app is for?"
2. "Read me what this gauge/badge means." (Test on SoC, kW, voltage, `SYS:OK`.)
3. "Who is Volt and what would you ask him?"
4. "Did the theme make charging feel easier, more fun or more confusing?"

**Behaviour tasks (add to T1–T12)**

| # | Task | Notes to record |
|---|---|---|
| R1 | During charging, state SoC, power, time left and cost from the gauges only | Accuracy of gauge reading |
| R2 | Explain what a status LED colour means | Colour-meaning match |
| R3 | Trigger an error (invalid CPID) and recover | Does Volt help? |
| R4 | Find help or tips without leaving the flow | Mascot discoverability |
| R5 | Read the receipt and say what you paid | Speed vs other flavours |
| R6 | Use the app for 3 minutes outdoors/bright light (if possible) | Dark theme legibility |

**Scored statements (1–5)**
- RT1 The gauges and badges told me what I needed to know at a glance.
- RT2 I understood the technical labels (V, kW, SoC, `SYS:OK`).
- RT3 The mascot helped me when something went wrong.
- RT4 The theme made charging more enjoyable.
- RT5 The theme made the app feel less serious or less trustworthy for payments.
- RT6 I would keep this theme on for everyday use.

## Flavour-specific hypotheses

| # | Hypothesis | Risk |
|---|---|---|
| RT-H1 | Jargon badges and uppercase telemetry look cool but novice EV users can't decode them | High |
| RT-H2 | High information density slows T8 (reading cost/energy while charging) | High |
| RT-H3 | Perpetual animations (pulsing LEDs, rotating rings) distract and drain battery during long sessions | Medium |
| RT-H4 | Mascot guidance is delightful, but is not reachable at the moment of failure | Medium |
| RT-H5 | Dark, low-key palette hurts outdoor readability | Medium |
| RT-H6 | The playful tone lowers trust at payment and wallet steps | Medium |
| RT-H7 | Highest differentiation and recall, so best brand-memory score | Opportunity |

## Flavour metrics

| Metric | How | Target |
|---|---|---|
| Gauge reading accuracy | % correct in R1 | ≥ 85% |
| Jargon decoding | % of badges correctly explained | ≥ 60% for novices |
| Mascot helpfulness | RT3 mean | ≥ 3.8 |
| Brand recall | unprompted description after 1 day | informational |
| Delight vs trust | RT4 vs RT5 | RT4 − RT5 > 0 |
| Battery/frame impact | % battery per 10 min charge-screen on test device | within 2× of CRED |

## Instrument additions

`mascot_opened` · `mascot_tip_viewed{context}` · `gauge_tapped{type}` · `error_shown{code}` + `error_recovered{code}` · `animation_reduced_motion_on`

## Verdict template

- Delight wins: ___
- Comprehension costs: ___
- Keep / change / remove: ___
