# Frontend UI Guide

## Purpose

This document explains how the frontend UI is structured in the app, how shared components are used, how each screen is laid out and styled, and how navigation works. Color values are intentionally excluded.

## App Shell

- Platform: React Native with Expo
- Navigation: `@react-navigation/native`, native stack, and bottom tabs
- Typography: Red Hat Display is loaded globally in `App.tsx`
- Theme mode: light and dark themes are provided through `ThemeContext`
- Safe areas: handled with `react-native-safe-area-context`

The active app shell is:

1. `Login`
2. `MainTabs`
3. `TaskDetails`
4. `AssetScan`
5. `Notification`
6. `Language`
7. `CreateTask`

## Active Navigation Structure

### Stack Navigation

The root stack lives in `App.tsx`.

- `Login` is the initial route.
- `MainTabs` is the main authenticated shell.
- `CreateTask` opens as a transparent modal with a slide-up animation.
- Detail screens hide the native header and render custom headers inside each screen.

### Bottom Tab Navigation

The tab shell uses a custom tab bar instead of the default React Navigation tab bar.

Tabs:

- `Map`
- `Work`
- `Scan`
- `Profile`

Behavior:

- `Map` opens `MapScreen`
- `Work` opens `ProjectDetailScreen`
- `Scan` is a placeholder tab that intercepts press and redirects to `AssetScanScreen`
- `Profile` opens `ProfileScreen`

### Custom Bottom Bar

The navbar is defined by `AppTabBar` in `App.tsx`.

Structure:

- One rounded main tab container
- Four tab buttons distributed evenly
- A separate floating add button to the right

Interaction rules:

- Focused tabs change icon and label emphasis
- The bar respects bottom safe-area insets
- The floating add button opens `CreateTask`
- Labels use uppercase-heavy bold display styling through the global font system

Layout characteristics:

- Positioned absolutely at the bottom
- Rounded, elevated container
- Large touch targets
- Separate CTA button rather than placing the add action inside the tab row

## Theme and Style Tokens

Core style tokens live in `src/styles/futurist.ts`.

### Typography

Defined tokens:

- `h1`: large page hero headings
- `h2`: section and card titles
- `h3`: medium card titles and strong labels
- `body`: default paragraph and input text
- `bodyStrong`: stronger body emphasis
- `label`: compact uppercase labels and chips
- `caption`: secondary metadata

### Spacing

The app uses a small token set:

- `xs`
- `sm`
- `md`
- `lg`
- `xl`
- `xxl`

In practice, most screens use manual numeric spacing close to:

- `16` to `24` for horizontal padding
- `10` to `18` for gaps between controls
- `14` to `18` for card padding

### Radius

Rounded corners are used throughout.

Common shapes:

- Inputs and small controls: around `12`
- Cards: around `14` to `18`
- Bottom sheets: `24`
- Pills and badges: high-radius chip styling

### Elevation and Shadows

Most surfaces use:

- soft card shadows
- elevated floating actions
- slightly stronger shadow on overlays and modal sheets

This creates a layered UI without relying on borders alone.

## Shared UI Components

### `NeonButton`

Used for:

- primary actions
- secondary actions
- destructive actions

Behavior:

- minimum height of `56`
- rounded rectangle shape
- haptic feedback on press
- text uses `h3`

Variants:

- `primary`
- `secondary`
- `danger`

### `NeonInput`

Used for:

- login form fields
- any labeled text entry that needs a reusable wrapper

Behavior:

- uppercase label above the field
- focus state changes surface treatment and elevation
- text uses `body`
- wrapper height is consistent with buttons

### `GlassCard`

Used as a generic elevated surface.

Behavior:

- rounded card shell
- standard inner padding
- shared shadow treatment

### `Logo`

Used in:

- login screen
- dashboard screen

It is a static SVG brand mark.

## UI Context Providers

### `ThemeContext`

Controls:

- `mode`
- `setMode`
- `isDark`
- theme color object

UI impact:

- every screen reads from theme context for backgrounds, text, borders, surfaces, overlays, and icon treatment

### `LanguageContext`

Controls the selected language option and drives the language setting screens and profile preview.

### `SessionContext`

Stores the current session display name and email. It is set during login and is intended to support personalized UI text.

## Screen-by-Screen UI

### `LoginScreen`

Purpose:

- simple authentication entry screen

Layout:

- full-height centered form
- safe-area wrapper
- brand block above the card
- one elevated form card containing inputs and the action

Components used:

- `Logo`
- `NeonInput`
- `NeonButton`

Styling pattern:

- centered composition
- single-card form layout
- generous outer padding
- minimal visual noise

### `MapScreen`

Purpose:

- primary field overview screen
- map-first experience with nearby work grouped by station

Layout:

- full-screen map as background layer
- top overlay stack for greeting, work-status toggle, and search
- floating utility buttons on the right
- horizontal card rail near the bottom
- bottom spacing accounts for the custom tab bar

UI sections:

- map canvas
- overlay header panel
- work status segmented toggle: `Away` / `Working`
- search field
- notification shortcut
- recenter/location action
- bottom station rail

Key styling patterns:

- overlay surfaces use translucent panels rather than full opaque cards
- station markers use custom SVG pins
- the bottom rail behaves like a light bottom sheet but stays map-aware
- chips are used heavily for service types

Interaction:

- search filters visible work orders
- tapping markers or bottom cards routes toward the Work tab
- active station state syncs map and card rail

### `ProjectDetailScreen`

This is the current `Work` tab.

Purpose:

- list field work orders
- switch between order view and station summary view
- filter by status, type, site, and free-text query

Layout:

- scroll screen with top search bar
- control row with station view toggle and filter dropdown
- expandable filter menu
- selected-filter chip row
- optional site chip
- results list

View modes:

- order card list
- station summary card list

Order card anatomy:

- type/status chips
- title
- compact info chips for CPID and station
- assignee avatar stack
- action row for accepted work states

Station card anatomy:

- site name
- address
- work count badge

Styling pattern:

- compact operational cards
- dense metadata in chips instead of long paragraphs
- controls sit above content, not inside the header

### `TaskDetailScreen`

Purpose:

- detailed execution screen for a work order
- checklist completion, activity history, attachments, signature, and completion

Layout:

- custom top header with back and action menu
- hero card for work summary
- segmented tab switch between `Tasks` and `Activities`
- scrollable main content
- sticky bottom action row
- floating add button for opening `CreateTask`

Hero card content:

- work title
- address with navigation shortcut
- asset/station chips
- service type/stage chips
- assignee and approver chips

`Tasks` tab:

- checklist cards
- each card shows completion state, title, required/optional label, and appropriate input control
- supports text fields, numeric input, general input, and attachment actions
- signature card
- completion note field

`Activities` tab:

- filter chips
- vertical timeline layout
- icon marker rail
- activity badges and metadata

Supporting overlays:

- attachment action sheet
- action dropdown menu

Footer:

- `Save`
- `Mark Complete`

The complete action is gated by required checklist completion plus signature state.

### `CreateTaskScreen`

Purpose:

- bottom-sheet modal for creating either a checklist or a single task

Presentation:

- transparent modal route
- dimmed backdrop
- bottom sheet with rounded top corners
- keyboard-aware layout

Modes:

- checklist creation flow
- task creation flow

Mode entry:

- the active mode is currently decided by route params and screen defaults
- the file contains setup for more explicit flow switching, but the live modal does not show a visible mode picker

Checklist flow UI:

- work type chips
- station dropdown
- conditional stage dropdown for installation work
- checklist title input
- current task list summary
- inline nested subform for adding tasks to the checklist

Task flow UI:

- task title input
- data type dropdown
- optional option-list builder for radio and multiselect fields

Shared patterns:

- dropdown-style controls
- inline chips for service type selection
- nested task-builder card
- primary footer CTA using `NeonButton`

Important note:

- the file still contains some create-flow state that is not currently rendered in the UI, such as extra toggles and helper fields. The live UI is narrower than the stored state suggests.

### `AssetScanScreen`

Purpose:

- scan or manually enter charger asset IDs

Layout when permission is granted:

- full-screen camera
- darkened overlay
- top header
- centered scan frame
- bottom sheet for manual entry and results

Bottom sheet content:

- title and helper text
- manual entry input row
- result card if a cached asset matches
- quick controls for torch and recent asset

Fallback layout when permission is denied:

- centered explanatory content
- manual entry card
- optional result card or error text

Styling pattern:

- camera-first screen with bottom operational sheet
- clear split between scan zone and form zone

### `NotificationScreen`

Purpose:

- notification inbox with filter chips

Layout:

- custom top header with back button, mark-all-as-read action, and unread badge
- horizontal filter chip row
- vertically stacked notification cards

Notification card anatomy:

- unread indicator
- title
- description
- category badge
- timestamp
- star and read-state actions

Styling pattern:

- dense list cards
- compact chip-based classification
- read/unread state is reflected by card treatment instead of separate sections

### `ProfileScreen`

Purpose:

- technician profile and preferences

Layout:

- page title
- profile summary card
- theme selection card
- language navigation card
- logout button

Theme section:

- two equal-width option tiles
- selected tile gets stronger emphasis

Styling pattern:

- settings page built from medium cards
- clear single-column layout

### `LanguageScreen`

Purpose:

- choose application language

Layout:

- custom header
- stacked list of language rows
- fixed footer save button

Row anatomy:

- flag
- language label
- selected/unselected icon on the right

Styling pattern:

- simple settings selector list
- large touch targets

## Additional Screens Present in the Codebase

These screens exist but are not part of the current active navigation shell in `App.tsx`.

### `DashboardScreen`

- futuristic dashboard concept
- logo-led hero
- status badge
- animated scanning line
- metric cards
- quick command buttons

This screen is visually more stylized than the rest of the current app shell and looks like an earlier dashboard concept.

### `ProjectListScreen`

- asset-management style list
- search bar
- sync/offline info card
- asset cards with metadata and actions

This is also not currently wired into the active navigator.

## Repeating UI Patterns

Across the app, the main recurring patterns are:

- full-screen pages with `SafeAreaView`
- custom in-screen headers instead of native headers
- elevated rounded cards
- bold heading plus label typography pairing
- chips for status, type, metadata, and filters
- form controls with consistent height
- bottom sheets for modal flows and mobile-first tasks
- floating action buttons for creation shortcuts

## Navbar and Header Guidance

### Bottom Navbar

Use the current bar when a screen belongs to the persistent app shell.

Key rules:

- keep icons simple and recognizable
- keep labels short
- reserve the floating add button for creation, not navigation
- maintain bottom spacing in content-heavy screens so the bar does not overlap actions

### In-Screen Headers

Used on detail, settings, notification, and scan flows.

Pattern:

- back button on the left
- title or title block in the center/remaining space
- optional action on the right

The app consistently prefers custom headers over default navigator headers so each screen can control spacing and actions precisely.

## Component Usage Guidance

Use:

- `NeonButton` for main actions and standardized button sizing
- `NeonInput` for labeled text entry
- `GlassCard` for reusable elevated content shells
- `FONTS` tokens instead of per-screen custom font definitions
- `ThemeContext` values for all theme-aware styling
- `getServiceTypeColors()` for work-type chips and badges

Avoid:

- hardcoding new typography styles when an existing token fits
- mixing multiple button heights on the same screen
- placing important actions behind the tab bar without extra bottom padding

## Current UI Character

The frontend has a clear mobile field-operations style:

- operational, not marketing-focused
- card-based rather than full-bleed content
- compact metadata expressed through chips and badges
- map and task execution flows are the most mature parts of the UI
- bottom sheets and floating actions are central to the interaction model

## Files to Reference

- `App.tsx`
- `src/styles/futurist.ts`
- `src/styles/workTypeColors.ts`
- `src/context/ThemeContext.tsx`
- `src/components/NeonButton.tsx`
- `src/components/NeonInput.tsx`
- `src/components/GlassCard.tsx`
- `src/components/Logo.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/MapScreen.tsx`
- `src/screens/ProjectDetailScreen.tsx`
- `src/screens/TaskDetailScreen.tsx`
- `src/screens/CreateTaskScreen.tsx`
- `src/screens/AssetScanScreen.tsx`
- `src/screens/NotificationScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/LanguageScreen.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/screens/ProjectListScreen.tsx`
