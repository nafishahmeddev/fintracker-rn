# 🎨 Luno Design System & Tokens

This document serves as the official design system guideline for the Luno app. Any future UI additions, agentic code generation, or component creation must adhere strictly to these tokens and patterns to maintain the **Editorial Brutalist** aesthetic.

---

## 1. Aesthetic Context & UI Rules
- **Editorial Brutalism**: The app relies heavily on high contrast, strict typographic hierarchy, and "edgeless" boundary illusions. 
- **Borders**: By default, the system uses literal `transparent` borders. Components rely on subtle alpha-channel surface backgrounds (`rgba`) instead of strokes to define spatial areas.
- **Amounts & Money**: Financial numerical data **must always** be rendered using JetBrains Mono for a technical, tabular, precision-oriented feel.
- **Copy & Labels**: Standard text, headings, and copy use Bricolage Grotesque. Look for opportunities to use ALL CAPS for micro-labels and table headings.

---

## 2. Color Palette (`src/theme/colors.ts`)

The system uses a strictly controlled context-based theming approach mapped directly to `ThemePalette`. When styling, always use the dynamically injected `colors` via `useTheme()` instead of hardcoded hex values.

### The Tokens

| Token | Dark Theme Hex | Light Theme Hex | Usage Context |
| :--- | :--- | :--- | :--- |
| **`background`** | `#000100` | `#F6FFF9` | Root view background, the deepest layer. |
| **`card`** | `rgba(255, 255, 255, 0.02)` | `rgba(0, 0, 0, 0.02)` | Subtle bounding areas, standard cards. |
| **`surface`** | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.05)` | Elevated cards, buttons, or interactive zones. |
| **`primary`** | `#B8D641` | `#a6c13a` | The main brand accent (limes/greens). Use for primary buttons, highlights, generic CR actions. |
| **`primaryLight`**| `#cae560` | `#b9d253` | Soft hover states or active gradients. |
| **`primaryDark`** | `#a0c119` | `#8caa14` | Pressed states or strong focus borders. |
| **`secondary`** | `#f9fff3` | `#000100` | Counter-balance color, sharp inverse. |
| **`text`** | `#fbfff3` | `#000100` | Primary reading text, headers, and essential inputs. |
| **`textMuted`** | `#b2bb8b` | `#737a5f` | Secondary text, hints, date formats, subtitles. |
| **`border`** | `transparent` | `transparent` | Edgeless UI approach. |
| **`success`** | `#6BD498` | `#43B875` | Used specifically for **Income (CR)** amounts and upward trends. |
| **`danger`** | `#EF4444` | `#DC2626` | Used specifically for **Expense (DR)** amounts and downward trends. |
| **`warning`** | `#F59E0B` | `#D97706` | Pending, locked, or cautionary actions. |

---

## 3. Typography Rules (`src/theme/typography.ts`)

Typography is the absolute backbone of Luno's interface. 

### Font Families
- **Bricolage Grotesque**: (`@expo-google-fonts/bricolage-grotesque`) The standard font for everything.
- **JetBrains Mono**: (`@expo-google-fonts/jetbrains-mono`) The technical font strictly reserved for numbers and financial strings.

### Font Tokens (Contextual Injection)

| Token | Font Family | Recommended Usage |
| :--- | :--- | :--- |
| **`heading`** | `BricolageGrotesque_700Bold` | Large screen titles, primary dashboard heroes. |
| **`headingRegular`**| `BricolageGrotesque_400Regular` | Softer section transitions and large onboarding messaging. |
| **`regular`** | `BricolageGrotesque_400Regular` | Standard body text, descriptions, lists. |
| **`medium`** | `BricolageGrotesque_500Medium` | Elevated body text (e.g., table cells). |
| **`semibold`** | `BricolageGrotesque_600SemiBold` | Labels, buttons, action items, segment pill text. |
| **`bold`** | `BricolageGrotesque_700Bold` | Emphasized text, strong category names. |
| **`amountRegular`** | `JetBrainsMono_400Regular` | Secondary numbers, percentages, dates. |
| **`amountBold`** | `JetBrainsMono_700Bold` | Core financial readouts, Net Position, Transaction amounts. |

### Size Scale

We use a standard t-shirt sizing system mapped via `TYPOGRAPHY.sizes`.
- **`xs`**: `12px` (Micro-labels, kickers, timestamps)
- **`sm`**: `14px` (Small utility text, metadata)
- **`md`**: `16px` (Default body text, list items)
- **`lg`**: `18px` (Subheaders, prominent interactive text)
- **`xl`**: `20px` (Headers, empty state titles)
- **`xxl`**: `24px` (Dashboard sections, major stat numbers)
- **`xxxl`**: `32px` (Hero metrics, Net Position)

---

## 4. Developer API (React Native/Expo)

When building new components, follow these architectural import rules:

```typescript
// 1. Always use the ThemeProvider context for color resolution
import { useTheme } from '@/src/providers/ThemeProvider';
import { TYPOGRAPHY } from '@/src/theme/typography';

// 2. Wrap components logic
export function MyComponent() {
  const { colors, isDark } = useTheme();
  
  // 3. Inject colors dynamically using a memoized factory pattern
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
       <Text style={styles.title}>Hello World</Text>
    </View>
  )
}

// 4. Stylesheet factory
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    color: colors.text
  }
});
```
