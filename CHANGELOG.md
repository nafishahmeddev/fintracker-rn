# Changelog

All notable changes to **Luno** will be documented in this file.

## [1.0.2] - 2026-04-14

### ⚡ Intelligence & Retention Phase
This update marks the completion of Phase 3 (Insights) and Phase 4 (Retention), bridging the gap between passive tracking and active financial intelligence.

### Added
- **Dashboard Insights (Pro)**: A new real-time analysis engine on the dashboard. Get instant feedback on spending spikes, saving alerts, and weekly performance trends.
- **Weekly & Monthly Reports (Pro)**: High-production-value financial journals and audits. Includes sector breakdowns, net position summaries, and savings rate comparisons.
- **Persistence Streaks (Free)**: New "Streak" tracking in the Reports hub to motivate daily consistency and tracking discipline.
- **Smart Notification System**: Precision-timed reminders to ensure no transaction goes unrecorded.

### Changed
- **Timezone Resilience Architecture**: Replaced manual date calculations with `date-fns` logic for perfect accuracy across all timezones.
- **Strict Typing Engine**: Massive internal refactoring to ensure 100% type safety and zero "patch" logic in core services.
- **Editorial UI 2.0**: Refined the Brutalist design with improved hierarchy, spacing, and bolder typography.
- **Premium Structure**: Aligned feature gating with the "Free = Tracking, Premium = Insights + Control" strategy.

### Fixed
- Fixed timezone-shifted streaks where transactions near midnight were incorrectly attributed.
- Resolved edge cases in percentage growth calculations (0 to X transitions).
- Eliminated several UI-side potential crashes during data fetching.

---

## [1.0.1] - 2026-04-12
### Added
- Paywall infrastructure and "Pro" plan integration.
- Analytics engine (Savings rate, Daily burn, Runway).
- Advanced filter support.

## [1.0.0] - 2026-04-10
### Added
- Initial release.
- Core transaction tracking.
- Brutalist UI foundation.
- Multi-account support.
