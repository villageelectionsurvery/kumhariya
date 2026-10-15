---
name: Gram Panchayat Kumhariya Civic System
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
  secondary: '#2a6b2c'
  on-secondary: '#ffffff'
  secondary-container: '#acf4a4'
  on-secondary-container: '#307231'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f1500'
  on-tertiary-container: '#c76c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acf4a4'
  secondary-fixed-dim: '#91d78a'
  on-secondary-fixed: '#002203'
  on-secondary-fixed-variant: '#0c5216'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system establishes a high-trust, non-partisan digital interface for rural and semi-urban civic governance, built specifically for the Gram Panchayat Kumhariya Election (ग्राम पंचायत कुम्हारिया चुनाव).

### Brand Personality & Emotional Impact
- **Impartial & Authoritative:** Conveys strict institutional neutrality, stability, and democratic transparency. No candidate or party bias is present in the visual weight.
- **Accessible & Empowering:** Designed for citizens across varying literacy levels, older voters, and low-connectivity environments. Clarity precedes ornamentation.
- **Dignified Civic Pride:** Employs subtle Indian sovereign motifs using disciplined, muted civic tones rather than bright or aggressive campaign pigments.

### Design Movement
- **Modern Civic Functionalism:** A clean, structural approach balancing disciplined institutional structure with tactile mobile ergonomics.
- **Tactile Legibility:** Large tap regions (minimum 48px to 56px), pronounced active-state feedback, uncrowded line layouts, and robust visual anchors (seals, stamps, status pills) that make electoral processes unhurried, understandable, and verifiable.

## Colors

The color palette is built on strict institutional restraint, incorporating the national civic tri-color balance in sober, non-partisan hues paired with a deep authoritative slate core.

### Palette Architecture
- **Civic Slate (Primary - `#0F172A`):** Used for primary headings, high-contrast actions, key navigation bars, and top-tier administrative framing. Replaces pure black to avoid harsh digital fatigue.
- **Sober Forest Green (Secondary - `#1B5E20` / `#2E7D32`):** Symbolizes civic renewal, verified status, confirmed ballots, and official ratification. Used purposefully to highlight approved candidacies and successful voter verification.
- **Deep Muted Saffron / Ochre (Tertiary - `#D97706` / `#E65100`):** Used sparingly as an institutional alert, ongoing timeline state, active voting indicator, and civic seal accent. Kept strictly tempered to prevent association with partisan party hues.
- **Clean Off-White Canvas (`#F8FAFC` to `#FFFFFF`):** High-reflectance, glare-free background that enhances readability in outdoor sunlight on mobile displays.
- **Borders & Separators (`#E2E8F0`):** Subtle structural delimiters that define spatial regions without cluttering dense text scripts like Devanagari.

### Accessible Contrast Governance
- Text over base surfaces retains a minimum contrast ratio of 7:1 for body copy and 4.5:1 for graphical anchors.
- Statuses never rely solely on color; every status color pairing is strictly coupled with an explicit text label in Devanagari and an unambiguous icon.

## Typography

The typography system is engineered around **Noto Sans Devanagari**, selected for its horizontal clarity, robust rendering of conjunct consonants (संयुक्ताक्षर), and consistent baseline alignment across low-end mobile viewports.

### Devanagari Spatial Principles
- **Elevated Line Heights:** Hindi typography demands approximately 15–20% taller line heights than standard Latin scripts to avoid matra clipping (ऊर्ध्व मात्रा एवं हलंत). Line heights are set intentionally generous.
- **Clear Weight Steps:** Body copy is restricted to Regular (400) for unhindered optical spacing, while section headers and candidate names use Semi-Bold (600) and Bold (700) to ensure immediate visual hierarchy on smaller devices.
- **Anti-Collapsing Hierarchy:** In voter identification sheets and candidate rosters, serial numbers (क्रम संख्या) and ward demarcations (वार्ड क्र.) preserve explicit tabular numbers (`tnum`) for effortless alignment.

## Layout & Spacing

A mobile-first responsive grid system guarantees complete utility on handheld hardware used by field presiding officers, booth level officers (BLO), and village electors.

### Grid Rules
- **Mobile (< 640px):** Single-column stack with an authoritative sticky status header, 16px (`1rem`) outer margins, and 16px (`1rem`) gutters. Touch target paths retain a full horizontal sweep.
- **Tablet (640px – 1024px):** 6-column layout with 24px margins, allowing split-card comparisons for ward listings and candidate profiles.
- **Desktop (≥ 1025px):** 12-column layout capped at a max-width of 1180px, maintaining focused administrative verification consoles and clean analytical overviews.

### Spacing Principles
- Spacing strictly follows an 8px base rhythm (`0.5rem`, `1rem`, `1.5rem`, `2.25rem`).
- Internal candidate card padding is set to `1.25rem` (20px) to prevent finger overlap when activating selection radios.

## Elevation & Depth

Visual hierarchy leverages structural containment, subtle physical elevation, and high-contrast structural borders to remain visible under direct sunlight during field operations.

### Elevation Levels
- **Ground (Level 0 - `#F8FAFC`):** General application canvas, passive content backing.
- **Surface (Level 1 - `#FFFFFF`):** Base card surfaces, candidate detail tiles, ward rosters. Outlined with a high-durability `1px solid #E2E8F0` border and a faint ambient drop (`box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05)`).
- **Interactive Surface (Level 2):** Selected radio candidate cards and actionable vote components. Elevated with `box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08)` and framed with an active civic border.
- **Critical Overlay (Level 3):** Modal confirmations (पुष्टिकरण विंडो), biometric validation alerts, and final vote review dialogs. Floats over a 60% opacity `#0F172A` backdrop blur with an ambient vertical shadow (`0 16px 32px rgba(15, 23, 42, 0.2)`).

## Shapes

The interface balances modern digital standards with institutional gravity through a calibrated moderate roundedness (Level 2).

### Geometry Guidelines
- **Card and Modal Containers:** Border radius of `0.5rem` (8px) on primary cards, escalating to `1rem` (16px) on confirmation modals and bottom verification sheets.
- **Civic Badges & Status Chips:** Pill-shaped (`9999px`) to create an immediate visual contrast against geometric candidate cards.
- **Interactive Buttons:** `0.5rem` (8px) corner radius, providing crisp rectangular anchoring that signals utility and stability.
- **Candidate Symbol Frames:** Exact squares with a restrained `0.375rem` (6px) inner radius, housing election commission approved election symbols (चुनाव चिन्ह) without clipping icon perimeters.

## Components

### 1. Civic Seal & Ward Badges
- **Panchayat Seal Header:** Circular crest framing featuring the Gram Panchayat Kumhariya insignia, bordered with an institutional double ring in `#0F172A` and muted saffron `#D97706`.
- **Ward Indicators (वार्ड बैज):** High-contrast capsules displaying ward designations (उदा. वार्ड क्रमांक ०४). Surface: `#0F172A`, Text: `#FFFFFF`, weight 700.

### 2. Candidate Selection Radio Cards (प्रत्याशी चयन कार्ड)
- **Structure:** Minimum 68px height touch target. Comprises serial number, candidate name in bold Devanagari, candidate symbol (चिन्ह), and a high-visibility 24px radio control.
- **Unselected State:** White surface `#FFFFFF`, 1.5px border `#E2E8F0`, dark text `#0F172A`.
- **Selected State:** Soft background `#F0FDF4`, border 2px solid `#1B5E20`, checkmark badge activated with deep green indicator.
- **Focus / Keyboard State:** 3px offset ring in `#1B5E20`.

### 3. Action Buttons (कार्यवाही बटन)
- **Primary Civic Action (मतदान पुष्टि / Confirm Vote):** Full-width mobile button, height 52px, surface `#1B5E20`, text `#FFFFFF`, font size 17px Semi-Bold.
- **Secondary Review / Cancel (पुनरावलोकन / रद्द करें):** Height 52px, border 1.5px solid `#64748B`, surface transparent, text `#0F172A`.
- **Disabled State:** Surface `#E2E8F0`, text `#94A3B8`, cursor not allowed.

### 4. Confirmation Modal Pattern (मत पुष्टिकरण संवाद)
- Displays candidate photograph/symbol enlarged in a 72x72px bordered frame.
- Explicit Devanagari confirmation phrasing: "क्या आप [प्रत्याशी का नाम] को अपना मत सुनिश्चित करना चाहते हैं?"
- Dual high-distinction primary and secondary actions with generous tap spacing (16px vertical gap).

### 5. Secure Status Badges (सुरक्षा एवं स्थिति सूचक)
- **Verified / प्रमाणीकृत:** Pill chip in `#DCFCE7` with text `#166534` accompanied by a check icon.
- **In-Progress / मतदान चालू:** Pill chip in `#FEF3C7` with text `#92400E` accompanied by an active pulse indicator.
- **Closed / संपन्न:** Pill chip in `#F1F5F9` with text `#475569`.

### 6. Mobile Electoral Data & Turnout Charts (मतदान प्रतिशत चार्ट)
- Segmented progress bars with 8px height, rounded ends, using sober forest green (`#2E7D32`) for completed turnout against a `#E2E8F0` track.
- Clean numeric labels in bold tabular Devanagari numerals alongside modern Western Arabic numerals for universal comprehension.