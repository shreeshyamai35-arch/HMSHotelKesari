---
name: Kesari Hospitality Suite
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#7c580f'
  on-secondary: '#ffffff'
  secondary-container: '#ffcc7a'
  on-secondary-container: '#79550b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#f0bf6e'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1440px
  sidebar-width: 260px
  gutter: 20px
---

## Brand & Style

The design system is engineered for high-stakes hospitality management, prioritizing trust, efficiency, and professional rigor. The brand personality is **Corporate/Modern**—it balances the authoritative stability of a financial tool with the warm, premium service expectations of the luxury hotel industry.

The visual narrative avoids unnecessary flourishes, focusing instead on data density and clarity. It evokes an emotional response of "calm under pressure," providing a reliable environment for managers to oversee complex operations, guest logistics, and financial reporting. The style utilizes a structured grid, refined tonal layering, and precise typography to signify a premium SaaS experience.

## Colors

This design system utilizes a sophisticated palette centered on **Deep Navy (Midnight)** to establish corporate authority and stability. **Champagne Gold** serves as the primary accent, used sparingly to denote premium features, "Gold" status tiers, or primary calls to action, grounding the digital experience in the physical luxury of the hotel.

**Slate Grays** handle the heavy lifting for UI borders, secondary text, and inactive states, ensuring the interface remains unobtrusive. The color mode is strictly **Light**, mimicking professional paper reports and architectural blueprints, providing maximum legibility for daytime office use. 

Semantic colors for status (Working, Full, Low) are calibrated for high accessibility while maintaining the muted, professional tone of the suite.

## Typography

**Inter** is the sole typeface for this design system, chosen for its exceptional legibility in data-heavy environments and its neutral, systematic character. 

- **Headlines:** Use a tighter letter-spacing and heavier weights to create a strong visual anchor for page sections.
- **Body Text:** Standard weight (400) is used for all guest information and report descriptions to ensure long-term reading comfort.
- **Labels:** Small caps or medium weights are utilized for table headers and status badges to differentiate them from interactive text.
- **Numbers:** Tabular lining should be enabled via OpenType features to ensure that columns of figures in financial tables align perfectly for easier scanning.

## Layout & Spacing

The design system employs a **Fixed Grid** layout for the main content area, flanked by a persistent sidebar for primary navigation. This 12-column system ensures consistency across report dashboards.

- **Desktop:** 240px Sidebar + 12 Column Grid with 24px gutters and 32px outer margins.
- **Tablet:** 80px Collapsed Sidebar + 8 Column Grid with 16px gutters and 24px margins.
- **Mobile:** Single column fluid layout with 16px safe-area margins.

Spacing follows a strict **4px baseline grid**. Components like data tables use condensed vertical padding (8px) to increase information density, while dashboard cards use more generous internal padding (24px) to create breathing room between high-level metrics.

## Elevation & Depth

To maintain a clean, corporate aesthetic, this design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Level 0 (Background):** Slate-50 (#F8FAFC) - The canvas for the application.
2.  **Level 1 (Cards/Containers):** White (#FFFFFF) with a 1px Slate-200 border. No shadow. Used for primary content blocks.
3.  **Level 2 (Dropdowns/Modals):** White with a soft, multi-layered "Ambient Shadow" (0px 4px 20px rgba(15, 23, 42, 0.08)) to suggest temporary overlay without feeling "heavy."
4.  **Active State:** Elements like selected sidebar items use a subtle 2px left-border accent in Champagne Gold.

Depth is communicated through color contrast (Canvas vs. Surface) rather than physical simulation.

## Shapes

The shape language is **Soft**. A 0.25rem (4px) base radius is applied to buttons, input fields, and small UI components. This choice maintains the architectural feel of a professional tool while subtly softening the user experience.

- **Standard Elements (Buttons/Inputs):** 4px (rounded-sm)
- **Containers (Cards/Modals):** 8px (rounded-md)
- **Status Badges:** 100px (fully rounded/pill) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Deep Navy background, White text. 4px radius. High contrast.
- **Secondary:** White background, Slate-200 border, Navy text.
- **Accent (Premium):** Gold background, Navy text. Reserved for guest upgrades or "VIP" actions.

### Data Tables
- **Headers:** Slate-50 background, uppercase Label-SM text, 1px bottom border.
- **Rows:** 48px height, subtle Slate-50 hover state.
- **Alignment:** Financial data is always right-aligned; status labels are center-aligned.

### Status Badges
- Small, pill-shaped markers using 10% opacity of the status color for the background and 100% opacity for the text. 
- *Labels:* "Working", "Full", "Low", "Available", "Maintenance".

### Input Fields & Checklists
- **Inputs:** 1px Slate-300 borders that transition to 1px Navy on focus. Labels are positioned above the field.
- **Checklists:** Square checkboxes with a 2px radius. When checked, they fill with Navy and a White checkmark.

### Dashboard Cards
- High-level metrics (e.g., Occupancy Rate) use Headline-LG for the value and Label-MD for the descriptor. 
- Include a small sparkline or percentage indicator for trend visualization.

### Room Status Matrix
- A specialized grid component representing hotel floors. Each "cell" is a square with color-coded borders indicating occupancy status, providing a bird's-eye view of the property.