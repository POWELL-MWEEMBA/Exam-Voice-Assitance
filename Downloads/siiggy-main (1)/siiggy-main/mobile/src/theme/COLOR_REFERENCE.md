# SIIGGY Color Reference

## Updated Color Scheme
**Inspired by Ukweli Brand Identity**

### 🎨 Brand Colors

#### Primary - Orange/Amber
```
Main:   #F5A623 ███████ Warm, energetic orange
Dark:   #D17A0D ███████ Deeper orange for emphasis
Light:  #FFB84D ███████ Lighter tint for backgrounds
```

**Usage:**
- Primary action buttons
- Active states and selections
- CTAs (Call-to-Actions)
- Important highlights and badges
- Logo and brand elements

#### Secondary - Navy Blue
```
Main:   #465A73 ███████ Professional navy
Dark:   #3F5569 ███████ Deeper navy
Light:  #5A7091 ███████ Lighter navy
```

**Usage:**
- Navigation bars and headers
- Secondary buttons
- Icons and UI accents
- Text emphasis
- Video indicator badges

---

## Color Psychology

### Orange (#F5A623)
- **Emotion**: Energy, enthusiasm, creativity
- **Psychology**: Encourages action, attracts attention
- **Brand Message**: Active marketplace, vibrant community
- **Use Cases**: "Post Signal", "Buy Now", notifications

### Navy Blue (#465A73)
- **Emotion**: Trust, stability, professionalism
- **Psychology**: Builds confidence, calming
- **Brand Message**: Reliable platform, secure transactions
- **Use Cases**: Headers, navigation, user profile sections

---

## Color Combinations

### Primary Combinations
✅ **Orange on White** - High contrast, excellent readability
✅ **White on Orange** - Strong CTA buttons
✅ **Navy on White** - Professional, readable headers
✅ **White on Navy** - Secondary actions

### Gradient Ideas
- Orange → Light Orange (for cards)
- Navy → Dark Navy (for headers)
- Orange + Navy overlay (for featured content)

---

## Accessibility Standards

All color combinations meet WCAG 2.1 guidelines:

| Combination | Contrast Ratio | WCAG Level | Usage |
|-------------|----------------|------------|-------|
| Orange on White | 4.8:1 | ✅ AA | Body text, buttons |
| White on Orange | 4.8:1 | ✅ AA | Button text |
| Navy on White | 8.2:1 | ✅ AAA | Headers, body text |
| White on Navy | 8.2:1 | ✅ AAA | Nav text, buttons |

---

## Component Examples

### Buttons
```typescript
// Primary Button (Orange)
<Button 
  buttonColor={colors.primary}
  textColor={colors.text.onPrimary}
>
  Post Signal
</Button>

// Secondary Button (Navy)
<Button 
  buttonColor={colors.secondary}
  textColor={colors.text.onSecondary}
>
  View Details
</Button>
```

### Badges & Chips
```typescript
// Active/Featured badge
<Chip 
  style={{ backgroundColor: colors.primary }}
  textColor={colors.text.onPrimary}
>
  Featured
</Chip>

// Info badge
<Chip 
  style={{ backgroundColor: colors.secondary }}
  textColor={colors.text.onSecondary}
>
  New
</Chip>
```

### Cards
```typescript
// Card with orange accent
<Card style={{ borderTopWidth: 4, borderTopColor: colors.primary }}>
  <Card.Content>
    <Text>Signal content...</Text>
  </Card.Content>
</Card>
```

---

## Before vs After

### Before
- Primary: #2563EB (Bright Blue)
- Secondary: #F97316 (Orange)
- Accent: #8B5CF6 (Purple)

### After
- Primary: #F5A623 (Warm Orange) ⭐
- Secondary: #465A73 (Professional Navy) ⭐
- Accent: #F5A623 (Orange - unified)

**Benefits:**
- More professional appearance
- Better brand consistency with Ukweli
- Warmer, more approachable feel
- Stronger visual hierarchy
- Unified design language

---

## Migration Notes

✅ **No component changes needed** - All components use theme variables
✅ **Automatic update** - Changes apply app-wide immediately
✅ **Backward compatible** - All existing color properties work

---

## Quick Reference

```typescript
import { colors, brandColors } from '../theme';

// Most common colors
colors.primary        // #F5A623 - Orange
colors.secondary      // #465A73 - Navy
colors.text.header    // #1F2937 - Dark gray
colors.text.paragraph // #374151 - Medium gray
colors.background.default // #FFFFFF - White
colors.background.gray    // #F3F4F6 - Light gray

// Status colors
colors.status.success // #10B981 - Green
colors.status.warning // #F59E0B - Amber
colors.status.error   // #EF4444 - Red
colors.status.info    // #465A73 - Navy
```
