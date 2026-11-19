---
name: AidLocate
description: A clear, station-display-inspired interface for public-safety tasks.
colors:
  ink: "#000000"
  paper: "#ffffff"
  surface: "#ffffff"
  surface-muted: "#f2f2f2"
  text: "#111111"
  muted: "#4a4a4a"
  border: "#cccccc"
  green: "#a3e635"
  green-dark: "#365314"
  green-hover: "#84cc16"
  green-light: "#a3e635"
  green-soft: "#ecfccb"
  red: "#c62828"
  red-dark: "#a61f24"
  red-soft: "#fde8e8"
  on-dark-muted: "#e6e6e6"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(58px, 7.2vw, 92px)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  sm: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: "54px"
---

# Design System: AidLocate

## Overview

**Creative North Star: "Mumbai Platform Display"**

AidLocate borrows the direct hierarchy of a contemporary Mumbai suburban railway display: strong condensed headlines, aligned information rows, a black-and-white field, and deliberate lime and red signals. The reference is an information system, not a station replica; the interface uses no invented routes or nostalgic decoration.

The interface is an operational tool for people who may be using a phone in a public place and under time pressure. Keep actions easy to scan, make location data legible, and make uncertainty visible. Bright lime identifies actions and selected states; red is reserved for urgent and error states. Kit coordinates are sample records, so their labels and markers stay monochrome and never suggest availability.

**Key Characteristics:**
- High-contrast, code-led hierarchy with Barlow Condensed display type.
- Flat white surfaces framed by fine dividers rather than stacked rounded cards.
- Bright lime for primary actions and selected states; red for urgent and error states.
- Compact navigation and aligned destination-style result rows.

## Colors

Black and white establish the field; bright lime and red are reserved for actions and urgent feedback.

### Primary
- **AidLocate Lime** (#a3e635): Primary action fill and high-visibility accents.
- **Lime Hover** (#84cc16): Primary action hover state.
- **Deep Lime** (#365314): Text links, focus rings, and borders requiring stronger contrast.
- **Soft Lime** (#ecfccb): Selected rows and non-urgent success feedback.

### Secondary
- **Emergency Red** (#c62828): Reserved for SOS actions, urgent warnings, and emergency map markers.

### Neutral
- **Red Soft** (#fde8e8): Error and emergency context surfaces, paired with explicit text.
- **Black** (#000000): Header, title bands, sample markers, and high-priority text.
- **White** (#ffffff): Default canvas and primary surfaces.
- **Neutral Gray** (#f2f2f2): Quiet grouped areas and secondary control states.
- **Text** (#111111): Primary body copy.
- **Muted Text** (#4a4a4a): Supporting copy, captions, and secondary data.
- **Divider** (#cccccc): Row separators and panel borders.
- **On-Black Muted** (#e6e6e6): Supporting copy on dark surfaces.

**The Sample-Is-Not-Status Rule.** Lime marks actions and selected states, red marks urgent or error states, and monochrome labels identify unverified sample records. No color implies that a first-aid kit is confirmed available.

## Typography

**Display Font:** Barlow Condensed (with sans-serif fallback)
**Body Font:** IBM Plex Sans (with sans-serif fallback)
**Label/Mono Font:** IBM Plex Sans; tabular numerals are used for IDs and distances.

**Character:** Barlow Condensed gives task titles a decisive display-board rhythm. IBM Plex Sans keeps controls, caveats, and location details clear at small sizes.

### Hierarchy
- **Display** (600, `clamp(58px, 7.2vw, 92px)`, 0.92 line-height): Home headline, with short, intentional line breaks.
- **Headline** (600, `clamp(38px, 5vw, 58px)`, 0.98 line-height): Page titles on the dark title band.
- **Title** (600, 21–34px, near 1.05 line-height): Result names, section headings, and selected-location details.
- **Body** (400, 12–16px, 1.5–1.7 line-height): Keep explanatory copy to a readable measure, generally below 68ch.
- **Label** (700, 9–13px, 0.04–0.09em, uppercase when identifying a record type): IDs, data state, and compact navigation.

**The Data-First Type Rule.** Use condensed display type for hierarchy, never for caveats, forms, or long location text.

## Layout

The desktop shell uses a centered 1280px maximum container and compact, task-oriented bands. On `/find`, search, category, location action, and the sample-data caveat precede a two-column results-and-map workspace. The map and result list stay visible together, and selecting a row recenters the map while marking that row. On mobile, controls and caveat stay first, followed by the map and then the result list. Other routes reuse the same dark page-title band, surface colors, and divider rhythm. Common spacing steps are 8, 12, 16, 24, and 32px.

## Elevation & Depth

Surfaces are flat at rest. Borders, tonal changes, and alignment separate groups; restrained offset shadows are reserved for map markers and map controls so they remain legible above map tiles. Focus is communicated with a visible, high-contrast outline, not a soft glow.

### Shadow Vocabulary
- **Map marker:** `0 3px 12px rgba(0, 0, 0, .32)`; separates the marker from variable map imagery.
- **Map controls:** `0 2px 9px rgba(0, 0, 0, .15)`; keeps the map legend readable above tiles.

## Shapes

Panels, buttons, and inputs are square-edged or use a restrained 2px corner. Rows are separated with thin rules instead of card stacks. Circular geometry is reserved for point markers and live-location indicators.

## Components

### Buttons
- **Shape:** Square-edged with a slight 2px corner on the brand mark; controls use 0–2px corners.
- **Primary:** Bright lime fill with black text, 10px 16px padding, and compact semibold labels.
- **Hover / Focus:** A small lift on hover; lime deepens. Keyboard focus uses a 3px deep-lime outline with 3px offset.
- **Secondary:** White surface with black text and a visible dark-neutral border.
- **Danger:** Emergency red with white text, reserved for SOS and destructive actions.

### Chips
- **Style:** Sample-record labels use black text and monochrome markers; no lime verified/available state.
- **State:** Selected result rows receive a pale lime wash and deep-lime border; unselected rows remain white.

### Cards / Containers
- **Corner Style:** Flat or 2px corners; no rounded-card grid.
- **Background:** White surfaces for results and forms, a white page canvas, and black title and hero bands.
- **Shadow Strategy:** No resting card shadow; use borders and tonal layering. Map controls are the exception.
- **Border:** Fine neutral divider; selected result rows use a stronger deep-lime border.
- **Internal Padding:** 12–24px for working panels; compact rows use 8–16px.

### Inputs / Fields
- **Style:** White surface, black text, square corners, and a clear neutral stroke.
- **Focus:** 3px high-contrast outline with a 3px offset.
- **Error / Disabled:** Errors use dark red on pale red; disabled controls retain their shape and reduce opacity.

### Navigation
- **Style:** Black bar, compact IBM Plex Sans links, bright-lime active underline, and a high-contrast lime account action with black text. On mobile, links move into a dark, vertically stacked menu with an account action.

### Destination Result Row
The signature first-aid row pairs a small sample label and tabular kit ID with a prominent place name, floor/location details, distance, and explicit map/details/directions actions. Selecting it highlights the row and recenters the adjacent map. Map markers and legend call out that coordinates are unverified samples.

## Do's and Don'ts

### Do:
- **Do** put the task, location action, and sample-data caveat before the `/find` map and results.
- **Do** use Barlow Condensed for short display headlines and IBM Plex Sans for operational copy.
- **Do** keep IDs and distances tabular and aligned for quick comparison.
- **Do** label sample coordinates directly wherever kit results or markers appear.

### Don't:
- **Don't** use lime or red to imply a kit is stocked, verified, or available.
- **Don't** invent real transit routes, locations, facility claims, or delivery states.
- **Don't** rebuild pages from repeated rounded icon cards or decorative gradients.
- **Don't** hide the sample-data caveat below the map or result list.
