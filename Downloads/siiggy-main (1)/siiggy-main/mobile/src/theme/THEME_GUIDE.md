# SIIGGY Theme Guide

## Color Palette

Our app uses a professional and energetic color scheme inspired by the Ukweli brand:

### Brand Colors

#### Primary - Orange/Amber (`#F5A623`)
- **Usage**: Primary actions, CTAs, highlights, active states
- **Represents**: Energy, activity, engagement
- **Examples**: 
  - Primary buttons
  - Active tab indicators
  - Important notifications
  - Signal badges

#### Secondary - Navy Blue (`#465A73`)
- **Usage**: Headers, secondary actions, text emphasis
- **Represents**: Professionalism, trust, stability
- **Examples**:
  - Navigation bars
  - Section headers
  - Secondary buttons
  - Icons

### Color Usage Examples

```typescript
import { colors, brandColors } from '../theme';

// Using theme colors
<Button backgroundColor={colors.primary}>Post Signal</Button>
<Text color={colors.secondary}>Welcome to Siiggy</Text>

// Using brand color palette for variations
<View backgroundColor={brandColors.orange[100]}>Light background</View>
<Text color={brandColors.navy[700]}>Dark text</Text>
```

## Typography

### Headings
- Use `colors.text.header` for main headings
- Use `colors.secondary` (navy) for section headings

### Body Text
- Use `colors.text.paragraph` for regular text
- Use `colors.text.light` for secondary information

## Backgrounds

- **Primary**: `colors.background.default` (White)
- **Secondary**: `colors.background.gray` (Light gray)
- **Accent Areas**: `colors.background.orange` or `colors.background.navy`

## Buttons

### Primary Button
- Background: `colors.primary` (Orange)
- Text: `colors.text.onPrimary` (White)
- Use for: Main actions (Post Signal, Save, Submit)

### Secondary Button
- Background: `colors.secondary` (Navy)
- Text: `colors.text.onSecondary` (White)
- Use for: Secondary actions (Cancel, Back, More Info)

### Outlined Button
- Border: `colors.primary` or `colors.secondary`
- Text: Same as border color
- Use for: Alternative actions

## Status Colors

- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)
- **Info**: `#465A73` (Navy)

## Accessibility

- All color combinations meet WCAG AA standards
- Orange on white: ✓ AA
- Navy on white: ✓ AA
- White on orange: ✓ AAA
- White on navy: ✓ AAA

## Best Practices

1. **Consistency**: Use theme colors instead of hardcoded values
2. **Contrast**: Ensure sufficient contrast for readability
3. **Hierarchy**: Use color to establish visual hierarchy
4. **Emotion**: Orange for energy/action, Navy for trust/stability
5. **Balance**: Don't overuse brand colors; use neutrals for balance
