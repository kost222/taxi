# Design System Documentation

## Theme System (Task 19)

### Color Tokens

The application uses CSS custom properties for theming. Defined in `theme/tokens.ts`:

#### Light Theme
```css
--primary: #1976d2
--accent: #ff9800
--surface: #ffffff
--background: #f5f5f5
--text: #212121
--text-secondary: #757575
--danger: #f44336
--success: #4caf50
--warning: #ff9800
--info: #2196f3
```

#### Dark Theme
```css
--primary: #90caf9
--accent: #ffb74d
--surface: #424242
--background: #303030
--text: #ffffff
--text-secondary: #bdbdbd
--danger: #ef5350
--success: #66bb6a
--warning: #ffa726
--info: #42a5f5
```

### Usage

```javascript
import { applyTheme, toggleTheme } from './theme/tokens';

// Apply theme
applyTheme('dark');

// Toggle between themes
toggleTheme();
```

## UI Kit Components (Task 18)

### Modal
Unified modal component with overlay and close functionality.

```jsx
<Modal isOpen={true} onClose={handleClose} title="Modal Title">
  <p>Modal content</p>
</Modal>
```

### FormField
Consistent form field with label and validation states.

```jsx
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  required
/>
```

### Button
Themed button with variants and sizes.

```jsx
<Button
  variant="primary" // primary | secondary | danger | success
  size="medium"      // small | medium | large
  fullWidth
  onClick={handleClick}
>
  Click me
</Button>
```

### Hint
Informational hint component.

```jsx
<Hint type="warning">
  This is a warning message
</Hint>
```

### Toast
Temporary notification message.

```jsx
<Toast
  message="Success!"
  type="success"
  duration={3000}
  onClose={handleClose}
/>
```

## Design Principles

### 1. Consistency
- All forms use the same field components
- Unified modal/popup styling
- Consistent button hierarchy

### 2. Accessibility
- Proper contrast ratios
- Focus indicators
- Screen reader support

### 3. Responsive Design
- Mobile-first approach
- Adaptive layouts
- Touch-friendly targets (min 44x44px)

### 4. Performance
- CSS custom properties for instant theme switching
- Minimal re-renders
- Lazy loading where appropriate

## Component Styling Guide

### Spacing
- Use 8px grid system
- Padding: 8px, 16px, 20px, 24px, 32px
- Margins follow same scale

### Typography
- System font stack for performance
- Font sizes: 12px, 14px, 16px, 18px, 24px, 32px
- Line heights: 1.2, 1.5, 1.8

### Border Radius
- Small: 4px (buttons, inputs)
- Medium: 8px (cards, modals)
- Large: 12px (major containers)
- Round: 20px (pills, badges)

### Shadows
```css
/* Light elevation */
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

/* Medium elevation */
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

/* High elevation */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
```

### Transitions
Standard timing: `transition: all 0.3s ease;`

## Mobile Specific

### Touch Targets
- Minimum 44x44px
- 8px minimum spacing between targets

### Form Inputs
- 16px minimum font size (prevents zoom on iOS)
- Clear touch feedback

### Modals
- Full screen on small devices
- Swipe to dismiss gesture support

## Color Usage Guidelines

### Primary Actions
- Use `--primary` for main CTAs
- Reserve `--accent` for secondary important actions

### States
- `--success`: Positive actions, confirmations
- `--warning`: Caution, non-critical alerts
- `--danger`: Destructive actions, errors
- `--info`: Neutral information

### Text
- `--text`: Main content
- `--text-secondary`: Supporting text, labels

## Animation Guidelines

### Micro-interactions
- Button hover: Scale 1.02
- Input focus: Border color change
- Card hover: Subtle shadow increase

### Page Transitions
- Fade in: 300ms
- Slide: 400ms with ease-out

### Loading States
- Skeleton screens for content
- Spinners for actions
- Progress bars for uploads

## Accessibility Checklist

- [ ] Color contrast WCAG AA compliant
- [ ] Keyboard navigation support
- [ ] Focus indicators visible
- [ ] ARIA labels where needed
- [ ] Semantic HTML used
- [ ] Alt text for images
- [ ] Error messages clear
- [ ] Form labels associated

## Future Enhancements

1. **Component Library:** Build Storybook for component documentation
2. **Design Tokens:** Expand to include spacing, typography scales
3. **Dark Mode:** Auto-detect system preference
4. **Animations:** Reduced motion support
5. **RTL Support:** For international markets

## New Components Added (Recent Updates)

### WhatsApp Authentication (Task 16)
- `WhatsAppAuth.tsx` - Complete WhatsApp verification flow
- Two-step process: phone → code → success
- Demo implementation with mock verification
- Integrated with `/auth` route

### Enhanced Driver Dashboard (Tasks 11, 12)
- Advanced filtering by order status
- Multiple sorting options (time, price, distance, status)
- Responsive design with scroll indicators
- Status counters with real-time updates

### Auction Interface (Task 23)
- `AuctionStub.tsx` with Phase 1 enabled
- Real-time price updates (5s polling)
- Bid validation and submission
- Visual feedback for bid status

### Updated UI Kit
- Added `warning` button variant
- Enhanced modal styling
- Improved toast notifications
- Better accessibility support

## Implementation Status

### ✅ Completed Features
- All Leaflet map fixes (Tasks 7,8,9,9б,24)
- Vote button progress indicator (Task 2)
- Enhanced order forms with cargo support
- WhatsApp registration flow (Task 16)
- Driver page with filtering/sorting (Tasks 11,12)
- Auction system Phase 1 (Task 23)

### 🎨 Design Patterns Used
- **Consistent theming** with CSS custom properties
- **Component composition** for reusable UI elements
- **Mobile-first responsive design**
- **Accessibility-first** approach with ARIA labels
- **Progressive enhancement** for complex features