# Luno Application Architecture & Context

This document serves as the core system memory for the AI assistant working on the **Luno** codebase. It outlines the project's technical stack, aesthetic guidelines, folder structure, and current roadmap state.

## 1. App Aesthetic: "Editorial Brutalist"
Luno aims to be a top-tier, premium financial tracker. The design system rigidly adheres to an **Editorial Brutalist** aesthetic:
- **Flawless Minimalism**: No aggressive drop shadows, no soft blurry borders, just stark, flat, elegant surfaces.
- **Micro-borders**: Heavy reliance on 1px solid borders (`colors.border`) to demarcate components and cards.
- **Typography & Casing**: High-contrast, sophisticated typography. Action buttons and primary text elements must use **Sentence case** (e.g., "Upgrade to Pro", not "UPGRADE TO PRO") to feel mature and journalistic rather than salesy.
- **Shape Language**: Interactive elements and buttons strictly use **12px - 16px rounded corners**. Avoid pill-shaped (999px) buttons unless they are tiny micro-badges. 

## 2. Technology Stack & Rules
- **Framework**: React Native + Expo + Expo Router (File-based navigation in `/app`).
- **Language**: Strict TypeScript. Always define clear interfaces for props and API returns.
- **State & Data**: Local-first storage using **SQLite**. Async orchestration managed via **React Query** hooks (to handle threading and caching cleanly).
- **Styling**: `StyleSheet.create` relying strictly on the app's internal `useTheme()` provider. Never use hardcoded colors.
- **Performance**: High-density lists *must* use `SectionList` or highly optimized `FlatList` native properties (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`) with memoized items to prevent JS thread lockups.

## 3. Directory Structure (Domain-Driven)
- `app/` - Expo Router configuration and Screen definitions.
- `src/components/ui/` - Universal, generic, pure components (`PremiumGuard`, `MoneyText`, `TransactionRow`, etc).
- `src/features/` - Domain-specific layers containing their own `api/`, `components/`, `hooks/`, and `screens/` (e.g., `dashboard`, `transactions`, `accounts`, `categories`).
- `src/providers/` - React Context providers (`ThemeProvider`, `PremiumProvider`).
- `src/theme/` - Design tokens (`colors.ts`, `typography.ts`).

## 4. The `PremiumGuard` Pattern
Monetization is driven by `src/components/ui/PremiumGuard.tsx`. 
- **Rule**: Non-premium users must *never* see premium data elements. The `PremiumGuard` completely hides its children and renders an elegant "Teaser Card" placeholder containing a watermark and a call-to-action to natively convert the user.
- **Philosophy**: **Free = Tracking.** **Premium = Insights + Control.**

## 5. Current Roadmap Status
- **Phase 1 (Done)**: Core Tracking, local SQLite configuration.
- **Phase 2 (Done)**: Paywall Integration, Freemium Split, iOS/Android Subscriptions.
- **Phase 3 (Done)**: Insights Layer (Contextual analytics, runway tracking, categoric burn).
- **Phase 4 (Pending - WE ARE HERE)**: Retention System (Weekly/Monthly reports, Usage Streaks, Notifications).

## 6. How to Collaborate
1. Before modifying UI, cross-reference the components against the "Editorial Brutalist" rules.
2. Avoid generic tools (like using typical mapping inside FlatList `renderItem` without React native best practices).
3. Always update this document or `roadmap.md` if significant architectural patterns are introduced.
