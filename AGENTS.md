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
- `src/features/{domain}/` - Domain-driven modules (dashboard, transactions, accounts, categories, insights, reports, **backup**, **export**, **filters**, **search**)
- `src/components/ui/` - Universal components: `PremiumGuard`, `MoneyText`, `TransactionRow`, `KPICard`, etc.
- `src/providers/` - Context providers: `ThemeProvider`, `PremiumProvider`, `QueryProvider`, `DatabaseProvider`
- `src/theme/` - Design tokens: `colors.ts`, `typography.ts`, `tokens.ts`
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

## Design System

### Editorial Brutalist Design Language

Luno uses a refined "Editorial Brutalist" aesthetic with strict design tokens:

### Design Tokens

**Spacing Scale (4px base grid):**
```typescript
import { spacing } from '@/src/theme/tokens';

spacing('0')    // 0px
spacing('0.5')  // 2px
spacing('1')    // 4px
spacing('2')    // 8px
spacing('3')    // 12px
spacing('4')    // 16px
spacing('5')    // 20px
spacing('6')    // 24px
spacing('7')    // 32px
spacing('8')    // 40px
spacing('9')    // 48px
```

**Border Radius Scale:**
```typescript
import { radius } from '@/src/theme/tokens';

radius('none')  // 0
radius('xs')    // 4px
radius('sm')    // 8px
radius('md')    // 12px - Buttons, icon boxes
radius('lg')    // 16px - Cards, inputs
radius('xl')    // 20px - Large cards
radius('2xl')   // 24px - Modals
radius('full')  // 999px - Use sparingly (micro-badges only)
```

**Component Size Variants:**
```typescript
import { COMPONENT_SIZES } from '@/src/theme/tokens';

// Buttons: sm (36px), md (48px), lg (56px)
COMPONENT_SIZES.button.md.height           // 48
COMPONENT_SIZES.button.md.paddingHorizontal // 16
COMPONENT_SIZES.button.md.borderRadius        // 16 (lg)
COMPONENT_SIZES.button.md.fontSize            // 16

// Cards: sm (12px padding), md (16px), lg (20px)
COMPONENT_SIZES.card.md.padding        // 16
COMPONENT_SIZES.card.md.borderRadius   // 20 (xl)

// Inputs: sm (40px), md (56px), lg (64px)
COMPONENT_SIZES.input.md.height           // 56
COMPONENT_SIZES.input.md.paddingHorizontal  // 16
COMPONENT_SIZES.input.md.borderRadius       // 16 (lg)
```

**Shadows/Elevation:**
```typescript
import { shadow } from '@/src/theme/tokens';

shadow('none')  // No shadow
shadow('xs')    // Subtle
shadow('sm')    // Cards default
shadow('md')    // Elevated
shadow('lg')    // Modals, FABs
```

**Layout Constants:**
```typescript
import { LAYOUT } from '@/src/theme/tokens';

LAYOUT.screenPadding    // 24px - Standard screen margin
LAYOUT.sectionGap       // 24px - Between sections
LAYOUT.cardGap          // 12px - Between cards
LAYOUT.elementGap       // 8px - Between elements
LAYOUT.minTouchTarget   // 44px - Minimum touch target
```

### Design Rules

1. **Borders**: Use 1px `colors.border` - no drop shadows except on elevated elements
2. **Shape**: 
   - Buttons: 12px-16px radius (`md` to `lg`)
   - Cards: 16px-20px radius (`lg` to `xl`)
   - Never use 999px (pill shapes) except for micro-badges
3. **Text**: Sentence case everywhere ("Upgrade to Pro", not "UPGRADE TO PRO")
4. **Spacing**: Only use token values (4, 8, 12, 16, 20, 24, 32...)

### Example Usage
```typescript
import { spacing, radius, shadow, COMPONENT_SIZES } from '@/src/theme/tokens';

// Card with proper tokens
<View style={{
  padding: spacing('4'),
  borderRadius: radius('xl'),
  backgroundColor: colors.surface,
  ...shadow('sm'),
}} />

// Button following size variant
<TouchableOpacity style={{
  height: COMPONENT_SIZES.button.md.height,
  paddingHorizontal: COMPONENT_SIZES.button.md.paddingHorizontal,
  borderRadius: COMPONENT_SIZES.button.md.borderRadius,
}} />
```

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

**Phase 5 (Done)**: Power Features - Backup/Restore, CSV Export, Advanced Filters, Global Search.
**Phase 6 (Next)**: Polish & Growth - App Store optimisation, onboarding improvements, widget support.

### Phase 5 Features (All Shipped — Premium-gated)

1. **Backup & Restore** (`src/features/backup/`)
   - Full JSON backup: accounts, transactions, categories, settings
   - Cross-platform export: Android (SAF folder picker), iOS (Share sheet)
   - Located in: Settings > Data > Backup & Restore

2. **CSV Export** (`src/features/export/`)
   - Transaction export to CSV for spreadsheets/accounting
   - Filters: Date range, accounts, categories, types
   - Located in: Settings > Data > Export CSV

3. **Advanced Filters** (`src/features/filters/`)
   - Multi-select: Accounts, Categories, Income/Expense types
   - Date range, amount range (min/max), full-text search, sort options
   - Hybrid filtering strategy (server + client-side)
   - Located in: Transactions screen > Filter button

4. **Global Search** (`src/features/search/`)
   - Cross-entity full-text search: transactions, accounts, categories
   - Premium-gated at route level with full-screen upsell gate (`app/search.tsx`)
   - Deep-links: account result → filtered transactions, category result → filtered transactions
   - Located in: Dashboard header search icon / Transactions header search icon

### Key Patterns

**Advanced Filters Architecture:**
```typescript
AdvancedFilterService.toBasicFilters(advancedFilters)
AdvancedFilterService.requiresClientSideFiltering(filters)
AdvancedFilterService.countActiveFilters(filters)

const { transactions, totalCount } = useAdvancedFilters(advancedFilters);
```

**Search Architecture:**
```typescript
// Query
const { data, isFetching } = useGlobalSearch(rawQuery); // 300ms debounce, min 2 chars

// Deep-link into filtered transactions
router.push(`/transactions?accountId=${id}`);
router.push(`/transactions?categoryId=${id}`);
```

**Premium Route Gating Pattern:**
```typescript
// app/some-pro-feature.tsx
export default function Route() {
  const { isPremium } = usePremium();
  return isPremium ? <FeatureScreen /> : <ProGateScreen />;
}
```

**File Export Pattern:**
- Android: `expo-file-system/legacy` StorageAccessFramework
- iOS: `expo-sharing` with cache file

## No Test Suite

This project has no automated tests. All verification is manual via the dev server.

## Reference

- Detailed architecture: `CLAUDE.md`
- Database schema: `src/db/schema.ts` (accounts, categories, payments tables with relations)
- Drizzle config: `drizzle.config.ts`
