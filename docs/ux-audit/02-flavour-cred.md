# Flavour module 2: CRED style (`dev/cred-style`)

Run after the [core kit](00-core-audit.md). Build identity: dark, premium, "neo-brutalist" feel with 3D drop-plate tab dock (`Neo3DIcon`), `CredButton`, `CredCard`, `CredBadge`, theme-matched login button, and light/dark theming. Standard bento-style screens: no chat assistant, no mascot.

## What is different from the other flavours

| Area | CRED-specific element |
|---|---|
| Navigation | Floating 3D dock with a raised centre **Scan** action |
| Surfaces | Cards with hard edges, depth and shadow slabs |
| Actions | Tactile `CredButton` with press depth |
| Tone | Premium, minimal copy, confident |

## Key audit questions

**Understanding**
1. "Which action looks like the most important one on each screen?"
2. "Which elements look tappable but you weren't sure about?" (3D plates can read as decoration.)
3. "How did you know which tab you were on?"
4. "Does this feel like a payments/finance app or a charging app? Does that matter?"

**Behaviour tasks (add to T1–T12)**

| # | Task | Notes to record |
|---|---|---|
| C-1 | Without hints, name the five tabs | Matches against labels, tests H1 |
| C-2 | Start charging from the centre button | First-tap success |
| C-3 | Read the price breakdown on Station Details | Tariff, GST, idle fee comprehension |
| C-4 | Use the filter sheet (connector + amenities) | Finds amenities toggles |
| C-5 | Do T3–T10 in dark and light themes | Contrast/legibility complaints |

**Scored statements (1–5)**
- CR1 The tab bar made the main actions obvious.
- CR2 The centre Scan button was the natural way to start charging.
- CR3 Buttons and cards told me what was tappable.
- CR4 The look felt premium and trustworthy for payments.
- CR5 Text was easy to read in both themes.
- CR6 The style felt consistent from login to receipt.

## Flavour-specific hypotheses

| # | Hypothesis | Risk |
|---|---|---|
| CR-H1 | The icon-only or stylised dock labels ("Sessions" tab opens Vehicles) mislead users | High |
| CR-H2 | Depth/shadow styling reduces contrast in light mode | Medium |
| CR-H3 | Premium look raises trust for wallet and payment, but only if flows are real (wallet alert is a stub) | High |
| CR-H4 | Hard-edged cards plus dense info on Station Details (tariff, grace period, amenities) cause overload | Medium |
| CR-H5 | Raised Scan button is discovered quickly, but the manual-CPID fallback is not | Medium |
| CR-H6 | Login button theming matches the style, but returning-user speed is unmeasured | Low |

## Flavour metrics

| Metric | How | Target |
|---|---|---|
| Tab label accuracy | % who correctly predict each tab | ≥ 80% |
| Scan-to-start time | T7 median | ≤ 90 s |
| Tap-affordance errors | taps on non-interactive elements | ≤ 1 per task |
| Light vs dark legibility | mean CR5 split by theme | no gap > 0.5 |
| Trust (CR4) | mean | ≥ 4.0 |

## Instrument additions

`dock_tab_tapped{tab}` · `scan_fab_tapped` · `theme_changed{light|dark}` · `dead_tap{screen,element}` (taps not handled) · `station_section_viewed{tariff|amenities|grace}`

## Verdict template

- Strongest flows: ___
- Style issues causing errors: ___
- Keep / change / remove: ___
