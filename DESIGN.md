# Design System: Playful Retro-Futurism (Orbital Ion Deck)
**Standard:** stitch-design-taste + ui-styling + ui-ux-pro-max  
**Platform:** React Native (Expo) • Mobile iOS & Android  
**Revision:** v3.0 (Tactile Aerospace & Cockpit Telemetry)

---

## Configuration Dials

| Dial | Level | Description |
| :--- | :---: | :--- |
| **Creativity** | `9 / 10` | High-agency, tactile flight cockpit, bespoke vector instruments, inline telemetry badges, CRT scanlines, and friendly companion mascot. |
| **Density** | `7 / 10` | Cockpit instrument density. High-signal telemetry data (volts, kW, SoC, time-to-full) balanced with accessible `48px` minimum touch targets. |
| **Variance** | `8 / 10` | Bold asymmetric layouts, bento flight tiles, offset status readouts, and non-repetitive card structures. |
| **Motion Intent** | `8 / 10` | Spring-based tactile physics (`stiffness: 120, damping: 18`), perpetual telemetry micro-loops (pulsing status LEDs, rotating orbital rings, thruster levitation). |

---

## 1. Visual Theme & Atmosphere

**"Orbital Ion Deck" — 1980s NASA Apollo and Cassette-Futurism meets sleek 2026 EV mobility.**

Unlike generic corporate EV apps (flat white cards, boring map pins, generic sans-serif), this app transforms electric vehicle charging into an immersive, tactile space-flight cockpit. The visual atmosphere evokes:
- **Mechanical Avionics Panels:** Deep aerospace surfaces (`#07111F`, `#0B1E3B`, `#142C50`) with recessed bezels, chamfered corners, subtle 1px cyan/electric border seams, and technical corner crosshairs (`+` / `⌞ ⌟`).
- **Tactile Push Controls:** Physical rocker and capsule buttons with specular sheen highlights, spring depression haptics, and bold high-contrast typography.
- **Precision Telemetry Instrumentation:** Real-time data readouts formatted in `Space Grotesk`, segmented digital meters, technical unit badges (`[480V // 150kW]`, `SYS:OK`), and CRT phosphor micro-accents.
- **Friendly Cosmonaut Copilot "Volt":** An expressive vector chibi robot companion that assists the driver with charging diagnostics, navigation tips, and error recovery.

The result is tactile, functional, visually unforgettable, and completely different from any other EV app.

---

## 2. Color Palette & Roles

Strict color calibration. No murky purples, no oversaturated AI gradient soup, no washed-out grays.

| Token Name | Hex Code | Functional Role |
| :--- | :--- | :--- |
| **Deep Space Canvas** | `#07111F` | Deepest background layer, CRT scanline backdrops, bottom sheets |
| **Flight Deck Navy** | `#0B1E3B` | Primary screen canvas, header banners, tab bar background |
| **Avionics Surface** | `#142C50` | Elevated telemetry cards, modal sheets, filter pods |
| **Recessed Well** | `#091629` | Inset data displays, gauge wells, input fields |
| **Structural Seam** | `#263F60` | 1px border dividers, mechanical frame lines |
| **Seam Highlight** | `rgba(34, 211, 238, 0.28)` | Active card borders, focused reticle seams |
| **Electric Blue** | `#3B82F6` | Primary CTAs, high-energy buttons, active tab indicators |
| **Neon Cyan** | `#22D3EE` | Orbital rings, radar sweeps, telemetry labels, glowing reticles |
| **Plasma Mint** | `#22D3A7` | Live charging states, connector available status, cost savings |
| **Solar Gold** | `#FBBF24` | Rapid DC charging, warning indicators, power badges |
| **Lunar Cream** | `#F8FAFC` | Primary high-contrast text, prominent metrics, lightning bolts |
| **Slate Telemetry** | `#B7C8E2` | Secondary labels, technical units, supporting documentation |
| **Muted Sensor** | `#64748B` | Disabled controls, inactive markers, placeholder text |

### Banned Colors
- **BANNED:** AI Purple / Magenta Neon soup (`#7C3AED`, `#8B5CF6` gradients)
- **BANNED:** Pure Black (`#000000`) — use `#07111F` or `#091629`
- **BANNED:** Flashing rainbow gradients — limit active accents to max 2 simultaneously

---

## 3. Typographic Architecture

Loaded and rendered natively via `@expo-google-fonts/sora` and `@expo-google-fonts/space-grotesk`:

1. **Primary Display & Headings:** `Sora`
   - **Display Hero:** `Sora-Bold` / `Sora-ExtraBold`, letter-spacing `-0.5px`
   - **Card Titles & Section Headers:** `Sora-Bold`, uppercase with tracking `+0.8px` (e.g., `"STATION TELEMETRY // MATRIX"`)
   - **Primary Action Text:** `Sora-Bold` (`15px`, uppercase, tracking `+0.5px`)

2. **Technical Telemetry & Numerals:** `Space Grotesk`
   - **Battery SOC & Hero Numbers:** `SpaceGrotesk-Bold` (`36px` - `48px`, tabular figures)
   - **Power (kW), Energy (kWh), Tariffs (₹):** `SpaceGrotesk-Bold` (`18px` - `24px`)
   - **Technical Meta Badges:** `SpaceGrotesk-Medium` (`11px` - `13px`)

3. **Banned Fonts:**
   - **BANNED:** `Inter` (generic template aesthetic)
   - **BANNED:** Generic system serifs (`Times`, `Georgia`)

---

## 4. Reusable Tactile Component Primitives

### 1. `RetroBezelCard`
- Recessed or elevated aerospace card frame (`#142C50`)
- 1px outer seam (`#263F60`) with optional cyan corner crosshairs (`+`)
- Tactile internal padding (`16px` to `20px`) with high contrast text

### 2. `RetroButton`
- Capsule or chamfered action button with specular top highlight
- Electric Blue (`#3B82F6`) to Neon Cyan (`#22D3EE`) gradient or solid flight deck styling
- Active tactile depression (`transform: [{ scale: 0.98 }]`) with medium haptic click
- High-contrast pure white (`#FFFFFF`) label in `Sora`

### 3. `RetroMascot` ("Volt")
- Expressive 6-state vector robot with floating thruster levitation:
  - `happy`: Success banners, completed charge receipts
  - `wink`: Tips, achievements, loyalty perks
  - `chill`: Idle states, vehicle battery standby
  - `searching`: Active radar scanning for superchargers
  - `charging`: Plasma lightning eyes monitoring active ion transfer
  - `error`: Warning brow and sweat drop for station offline / fault

### 4. `RetroCircularGauge` (Ion Reactor Core)
- Dual concentric orbital energy rings with neon cyan & plasma mint gradient
- Real-time battery SOC percentage in center
- Live kWh flow and voltage/amperage telemetry readouts

### 5. `RetroStatusLED`
- Hardware-inspired indicator lamp with glowing outer halo:
  - `AVAILABLE` (Pulsing Plasma Mint `#22D3A7`)
  - `OCCUPIED` (Solid Solar Amber `#FBBF24`)
  - `OFFLINE` (Muted Slate `#64748B`)

---

## 5. Screen Experience Directives

### A. Home & Radar Map (`StationMapScreen.tsx`)
- **Radar Flight Deck Map:** Custom dark navy map tiles with cyan highway vectors and beacon station pins.
- **Avionics Search Bar:** Recessed search console with live GPS position, search icon, and `Trip Planner >` direct route shortcut.
- **Tactile Filter Chips:** Capsule pills with LED dots for `Fastest (DC)`, `Available Now`, `Cheapest`, and `24/7`.
- **Telemetry Station Drawer:** Bottom sheet styled as an avionics flight panel displaying live connector slots, pricing tariff, power rating, and instant "ENGAGE CHARGER" CTA.

### B. Charger Detail Avionics (`StationDetailScreen.tsx`)
- Tactical technical breakdown of charger hardware (CCS2 / Type 2 / CHAdeMO).
- Live connector availability matrix with instant lock/unlock status.
- Pricing breakdown with power delivery curve prediction.
- High-contrast "START CHARGING" button with tactile sheen.

### C. Orbital Docking Reticle (`ScanScreen.tsx`)
- Camera viewfinder framed by animated Neon Cyan targeting brackets (`┌ ┐ └ ┘`).
- Real-time scanline shimmer and audio-visual lock feedback.
- Mascot "Volt" providing scanner tips at bottom.
- Fallback manual charger ID terminal entry.

### D. Active Ion Charging Session (`ChargingSessionScreen.tsx`)
- **Reactor Core Gauge:** Central circular power meter showing real-time SoC %, energy delivered (kWh), current power (kW), and duration.
- **Flight Diagnostics Bento:** 4-cell telemetry grid: Voltage (V), Current (A), Battery Temp (°C), and Cost Accumulation (₹).
- **Tactile Safety Stop:** Red/Amber accented "ABORT / END SESSION" button with tactile confirmation dialog.

### E. Telemetry Logbook (`VehicleListScreen.tsx`)
- Sessions presented as an aerospace flight log with stamped receipts and lifetime energy impact (kWh delivered, money saved, CO2 avoided).
- Filter pills (`ALL`, `DC FAST`, `AC DESTINATION`).
- Interactive modal receipt drilldown with tax breakdown and invoice sharing.

### F. Command Deck & Driver Profile (`ProfileScreen.tsx`)
- Volt welcome header with interactive driver greeting.
- Quick navigation shortcuts: Trip Planner & Saved Favorites.
- Vehicle garage selector with battery status.
- Iris Wallet balance with tactile instant top-up chips.
- Push alerts toggle & legal privacy documentation.

---

## 6. Anti-Patterns & Strict Rules (AI Tells Banned)

1. **NO EMOJIS AS ICONS:** Always use Lucide icons or custom SVG graphics.
2. **NO OVERLAPPING TEXT/CARDS:** Every component has its own clean spatial boundary.
3. **NO GENERIC 3-CARD ROWS:** Use asymmetric 2-column or bento splits.
4. **NO LOW-CONTRAST TEXT:** All text on dark backgrounds must meet WCAG AA (minimum 4.5:1 ratio).
5. **TOUCH TARGET COMPLIANCE:** All interactive elements must have at least `44x44px` hit slop.
6. **NO PLACEHOLDER STRINGS:** Never use "Lorem ipsum", "John Doe", or fake non-working buttons.
7. **NO PURPLE/BLUE NEON SLOP:** Strictly adhere to the Space Blue, Neon Cyan, Plasma Mint, and Solar Gold palette.
