# Luno - AI Agent Instructions

A React Native financial tracker built with Expo, following an "Editorial Brutalist" design system.

## Quick Commands

```bash
# Dev server
npm start              # Expo dev server (iOS/Android/web)
npm run ios            # Start with iOS simulator
npm run android        # Start with Android emulator

# Database (Drizzle ORM + SQLite)
npm run db:generate    # Generate migrations after schema changes
npm run db:studio      # Open Drizzle Studio for local DB inspection

# Quality
npm run lint           # ESLint via expo config
```

## Architecture

**Stack**: React Native 0.81 + Expo 54 + Expo Router 6 + TypeScript (strict)
**Data**: SQLite local-first via `expo-sqlite`, Drizzle ORM, React Query for async state
**Routing**: File-based in `/app` - `(main)` has tab nav, `(onboarding)` flow, `premium.tsx` standalone

### Directory Ownership

- `app/` - Expo Router screens and layouts
- `src/features/{domain}/` - Domain-driven modules (dashboard, transactions, accounts, categories, insights, reports)
- `src/components/ui/` - Universal components: `PremiumGuard`, `MoneyText`, `TransactionRow`, `KPICard`, etc.
- `src/providers/` - Context providers: `ThemeProvider`, `PremiumProvider`, `QueryProvider`, `DatabaseProvider`
- `src/theme/` - Design tokens: `colors.ts`, `typography.ts`
- `src/db/` - Schema and migrations (Drizzle config at root)

## Critical Patterns

### 1. Theming (Mandatory)

Always use `useTheme()` hook. Never hardcode colors.

```typescript
const { colors } = useTheme();
// colors.background, colors.primary, colors.text, colors.border, etc.
```

### 2. PremiumGuard Pattern

Monetization is enforced via `PremiumGuard` component. **Non-premium users must never see premium data.**

```typescript
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';

<PremiumGuard label="Insights">
  <AdvancedChart data={premiumData} />
</PremiumGuard>
```

### 3. Database Changes

1. Edit `src/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Migrations auto-apply on app start via `DatabaseProvider`

### 4. Styling Rules (Editorial Brutalist)

From `CLAUDE.md` - **cross-reference before UI changes**:
- **Borders**: Use 1px `colors.border` (not drop shadows)
- **Shape**: Buttons/cards use **12px-16px radius** (avoid 999px pill shapes except micro-badges)
- **Text**: **Sentence case** everywhere ("Upgrade to Pro", not "UPGRADE TO PRO")
- **Performance**: High-density lists need `SectionList`/`FlatList` with memoized items + native optimization props

### 5. Path Alias

Use `@/` prefix for imports: `import { useTheme } from '@/src/providers/ThemeProvider'`

## Performance Patterns (Mandatory)

Following React Native best practices for 60fps UI:

### React.memo for All Components

**Every** component must be wrapped with `React.memo`:

```typescript
export const MyComponent = React.memo(function MyComponent(props: Props) {
  // component body
});
```

### useCallback for All Event Handlers

All event handlers must use `useCallback`:

```typescript
const handlePress = useCallback(() => {
  onPress(item);
}, [onPress, item]);

<TouchableOpacity onPress={handlePress} />
```

### useMemo for Expensive Computations

Always memoize:
- Style objects from `createStyles(colors)`
- Color/formatting calculations
- Mapped arrays for rendering
- Derived state

```typescript
const styles = useMemo(() => createStyles(colors), [colors]);

const displayValue = useMemo(() => {
  return formatCurrency(amount, currency);
}, [amount, currency]);
```

### List Optimization

All FlatList/SectionList must have:

```typescript
<FlatList
  data={data}
  renderItem={renderItem}        // memoized callback
  keyExtractor={keyExtractor}     // memoized callback
  getItemLayout={getItemLayout}   // for fixed height items
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

### Context Value Memoization

Always memoize context values:

```typescript
const contextValue = useMemo(() => ({ 
  colors, 
  isDark 
}), [colors, isDark]);
```

## Current Phase

**Phase 4 (In Progress)**: Retention System - Weekly/Monthly reports, Usage Streaks, Notifications

Phases 1-3 are complete: Core tracking, Paywall/Freemium, Insights layer.

## No Test Suite

This project has no automated tests. All verification is manual via the dev server.

## Reference

- Detailed architecture: `CLAUDE.md`
- Database schema: `src/db/schema.ts` (accounts, categories, payments tables with relations)
- Drizzle config: `drizzle.config.ts`
