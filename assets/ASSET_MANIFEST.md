# Iris EV Charging Application — Playful Retro-Futurism Asset Manifest

This manifest documents all visual and illustrative assets for the **Playful Retro-Futurism** design system across mobile views and states.

---

## 1. Brand Identity & App Icons

| Asset Name | Component / Path | Format / Dimensions | Intended Screen / State | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Retro App Icon** | `src/components/RetroAppIcon.tsx` | Vector SVG (scalable, 200×200 viewBox) | Splash screen, App launcher, Auth headers | **Implemented** (Interactive vector with radial glow & sparkles) |
| **App Logo** | `assets/logo.svg` | Vector SVG | Authentication, header branding | **Available** in assets |
| **Adaptive Icon** | `assets/adaptive-icon.png` | PNG (1024×1024) | Android adaptive icon | **Available** in assets |
| **Favicon** | `assets/favicon.png` | PNG (48×48) | Web simulator browser tab | **Available** in assets |

---

## 2. Mascot Companion Robot ("Volt")

The chibi astronaut companion robot with glowing star antenna, rounded helmet, navy visor, and EV charging cable gun.

| Expression | Component Prop | Format / Dimensions | Intended Screen / State | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Happy** | `<RetroMascot expression="happy" />` | Vector SVG (200×220 viewBox) | Successful charging start, onboarding, payment receipts | **Implemented** (Curved LED eyes, blush, smile) |
| **Wink** | `<RetroMascot expression="wink" />` | Vector SVG (200×220 viewBox) | Login guidance, driver tips, eco milestone alerts | **Implemented** (Open joyful eye + winking eye) |
| **Chill** | `<RetroMascot expression="chill" />` | Vector SVG (200×220 viewBox) | Active charging monitoring, idle state, history empty state | **Implemented** (Relaxed eye bars, soft smile) |
| **Searching** | `<RetroMascot expression="searching" />` | Vector SVG (200×220 viewBox) | Map charger search, scanning nearby stations | **Implemented** (Concentric radar eyes, radar scan waves) |
| **Charging** | `<RetroMascot expression="charging" />` | Vector SVG (200×220 viewBox) | Inside circular charging gauge, high-power DC boost | **Implemented** (Lightning bolt eyes, green energy aura) |
| **Error / Help** | `<RetroMascot expression="error" />` | Vector SVG (200×220 viewBox) | Dispenser offline, connector fault, payment retry | **Implemented** (Concerned brows, warning sweat drop) |

---

## 3. UI Micro-Illustrations & Custom Vector Badges

| Component / Asset | File Path | Format | Intended Screen / Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Retro Circular Energy Gauge** | `src/components/RetroCircularGauge.tsx` | Animated SVG Dual Ring | `ChargingSessionScreen` hero progress display | **Implemented** (Live pulsing ring, Mint $\rightarrow$ Cyan arc) |
| **Retro Pill Button** | `src/components/RetroButton.tsx` | React Native + LinearGradient | Primary actions across all screens (`RADIUS.button = 16` or `RADIUS.pill = 9999`) | **Implemented** (Gradient + specular sheen + haptics) |
| **CCS2 Connector Pin** | `assets/CCS2.svg` & `src/components/Ccs2Icon.tsx` | Vector SVG | Station details, charger cards, connector filter | **Implemented** |
| **Type 2 Connector Pin** | `assets/Type_2.svg` & `src/components/Type2Icon.tsx` | Vector SVG | AC station details, charger cards | **Implemented** |
| **CHAdeMO Connector Pin** | `assets/CHADeMo.svg` & `src/components/ChademoIcon.tsx` | Vector SVG | Fast DC legacy Japanese EV charging | **Implemented** |
| **DC Charger Map Pin** | `assets/dc_charger_pin.svg` & `src/components/DcPinIcon.tsx` | Vector SVG | Map station markers (60 kW / 150 kW) | **Implemented** |
| **Vehicle Car Pin** | `assets/car.svg` & `src/components/CarPinIcon.tsx` | Vector SVG | Map user GPS vehicle location marker | **Implemented** |

---

## 4. Typography Assets

| Font Family | Weights Loaded | Source | Usage |
| :--- | :--- | :--- | :--- |
| **Sora** | 400, 500, 600, 700, 800 | `@expo-google-fonts/sora` | Primary headings, titles, screen badges, primary CTAs |
| **Space Grotesk** | 400, 500, 600, 700 | `@expo-google-fonts/space-grotesk` | Technical numerals (SoC %, kW speed, ₹ price, distances, coordinates) |
