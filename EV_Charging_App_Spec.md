# EV Charging Mobile App - Product Specification & Development Guide

## 1. Project Overview
This document outlines the requirements and roadmap for developing a **React Native** mobile application for Electric Vehicle (EV) charging. The app is designed specifically for **4-wheeler EVs** (excluding two-wheelers) and must provide a premium, end-to-end charging experience. It will be built using **Expo** for easy testing via Expo Go.

## 2. Technical Requirements
- **Framework:** React Native (Expo SDK).
- **Language:** TypeScript (preferred) or JavaScript.
- **Compatibility:** iOS and Android.
- **Responsiveness:** Fully responsive layouts adapting to various screen sizes (phones/tablets).
- **Theming:**
    - Native support for **System Light/Dark Mode**.
    - User-toggleable theme preference within the app.
    - Consistent color palette with high contrast and accessibility compliance.
- **Performance:** Fast load times, smooth animations (60fps), and optimized map rendering.

## 3. Core Features & User Flow

### 3.1. Authentication
- **Login Page:**
    - Secure user authentication (Email/Password, Social Login, or OTP).
    - "Forgot Password" flow.
    - Seamless onboarding for new users.

### 3.2. Vehicle Management
- **Vehicle Selection:**
    - Users must select their EV model to filter compatible chargers.
    - Ability to add multiple vehicles (Make, Model, Year, Battery Capacity, Connector Type).
- **Vehicle Details:**
    - Display specifications of the selected vehicle (Max charging speed, Plug type).

### 3.3. Charging Station Discovery
- **Map & List View:**
    - Interactive map showing charger locations.
    - Filter options: Connector type (CCS2, CHAdeMO, Type 2), Availability, Fast/Slow charging, Price.
- **Station Details:**
    - **Location:** Address, distance, and navigation link.
    - **Availability:** Real-time status of chargers (Available, Occupied, Out of Order).
    - **Pricing:** Clear cost per kWh or per minute.
    - **Amenities:** Icons for nearby facilities (Restroom, Cafe, Wi-Fi, Mall).
    - **Timings:** Opening and closing hours.
    - **Photos:** Field to display station images.

### 3.4. Charging Process (End-to-End)
- **QR Scanner:**
    - Integrated camera scanner to scan the QR code on the charging gun/connector.
    - Manual entry option for Charger ID.
- **Connector Validation:**
    - Auto-verify if the scanned connector matches the user's selected vehicle.
    - Display connector details (Power output, Voltage, Current).
- **Pre-Charge Checks:**
    - Estimated cost calculations.
    - Wallet balance check (if applicable).
- **Charging Session:**
    - **Live Dashboard:**
        - **Charging Curve Graph:** Visual representation of charging speed (kW) over time/SoC.
        - Real-time data: State of Charge (SoC %), Time Elapsed, Energy Delivered (kWh), Current Cost.
    - **Controls:** "Stop Charging" button with confirmation safety.

### 3.5. Post-Charging
- **Session Summary:**
    - Total energy, total time, final cost.
    - Charging curve summary.
- **Payment:**
    - Integrated payment gateway or wallet deduction.
    - Invoice/Receipt generation.

## 4. Design & UI/UX Guidelines
- **Aesthetics:** Modern, clean, and tech-forward "EV" aesthetic (e.g., green/blue accents).
- **Navigation:** Intuitive bottom tab bar or drawer navigation.
- **Feedback:** Clear success/error messages (toasts) and loading states.
- **Animations:** Smooth transitions between screens; animated charts for charging status.

## 5. Development Milestones
1.  **Setup:** Initialize Expo project with TypeScript and Navigation.
2.  **UI Implementation:** Build static screens (Login, Map, Details, Charging) with Theming.
3.  **Core Logic:** Implement Vehicle selection state, Mock data for stations.
4.  **Scanner Integration:** Implement `expo-camera` or `expo-barcode-scanner`.
5.  **Charts:** Integrate a charting library (e.g., `react-native-chart-kit` or `victory-native`) for the charging curve.
6.  **Testing:** Verify responsiveness and Dark/Light mode on Expo Go.

## 6. Testing & Deliverables
- **Platform:** Run and test exclusively on **Expo Go**.
- **Checklist:**
    - [ ] Login flow works.
    - [ ] Station data displays correctly.
    - [ ] Scanner detects QR codes.
    - [ ] Charging graph renders and updates.
    - [ ] Dark/Light mode toggle switches correctly.
