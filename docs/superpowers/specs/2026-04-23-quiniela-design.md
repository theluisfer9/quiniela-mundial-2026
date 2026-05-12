# Quiniela Mundial 2026 Design Brief

## Feature Summary

`quiniela-mundial-2026` will be a family-first, mobile-first World Cup prediction app for a group of roughly 9 to 16 people. The product should feel like part of the FIFA World Cup 2026 event: cheerful, simple, warm, and sporty, while remaining extremely easy to understand for non-technical users.

The primary experience is a social quiniela where users can quickly see how the family competition is going and immediately jump into making predictions. The UI must feel more like a friendly game than a professional sports analytics app.

## Primary User Action

The single most important action is: `go from the home screen to submitting predictions for the pending matches in under one minute`.

The home screen must make three things obvious at a glance:

1. how the family quiniela is going
2. where the current user stands
3. where to tap to start predicting now

## Design Context

### Users

- Family members participating in a shared World Cup 2026 quiniela
- Expected group size: 9 to 16 people
- Mixed comfort with technology; the app must work for casual users without explanation
- Primary device context: mobile phones

### Brand Personality

- Alegre
- Sencilla
- Deportiva

The product should feel warm, lightweight, and social. It must not feel technical, corporate, dense, or intimidating.

### Emotional Goal

- Immediate understanding on first use
- Friendly excitement tied to the World Cup event
- Light social competition without friction or stress

### Anti-References

- No dark, aggressive sports-app aesthetic
- No SofaScore-like density or complexity
- No widget-heavy dashboard feel
- No childish or caricatured visual direction

## Design Direction

The recommended direction is `Festival Familiar`.

This direction combines a bright, light-first interface with strong tournament energy and playful warmth. It should feel like a family game wrapped in World Cup event identity, not a professional stats platform.

The interface should express:

- high World Cup identity
- low cognitive load
- strong social visibility through the standings table
- fast, obvious access to prediction capture

The visual character should be inspired by FIFA World Cup 2026 identity cues:

- warm light backgrounds
- deep navy instead of black for primary text
- vivid red as the main action color
- green as a supporting accent
- selective use of multicolor 2026-inspired tones as decorative system accents

The app should feel festive, but the layout must stay disciplined. Color carries identity; structure carries clarity.

## Layout Strategy

### Global Approach

The experience is mobile-first with large, readable blocks and generous separation between major sections. The composition should be easy to scan in vertical order and should never require users to interpret dense dashboards or complex navigation.

### Home Screen Hierarchy

The home page should follow this order:

1. `Pronosticar ahora` hero / CTA block
2. large, visually dominant family standings table
3. next closing time or urgency reminder
4. list of pending or upcoming matches

This matches the chosen visual composition: the standings table is the strongest social element, but prediction remains the clearest action.

### Spatial Character

- rounded, friendly surfaces
- balanced density: enough useful information without crowding
- clear vertical rhythm between sections
- strong section titles with personality
- no card overload and no nested dashboard panels

## Key States

### First-Time User

The user sees a short welcome message, a neutral or empty standing state, and an obvious path to make their first predictions. The UI should feel inviting, not incomplete.

If standings are not yet meaningful, the home screen should shift into a hybrid starter state that combines welcome messaging, short guidance, tournament status, and a clear primary CTA. This state should feel intentional and celebratory, not like missing data.

### Pending Predictions

This is the primary state. The home screen highlights how many matches are still missing, provides a strong CTA to predict now, and shows the standings table directly below.

### Up To Date

When all current predictions are complete, the urgency softens. The CTA can shift toward reviewing predictions or checking the standings, while keeping the user engaged with the social competition.

### Locked Matchday

Once a specific match begins, editing for that match is unavailable. The interface pivots toward points, progress, and standings movement, while preserving competitive tension.

### Empty Tournament State

If there are no matches loaded yet, the app explains what will happen next and avoids blank or broken-looking screens.

This state should be led by a blend of welcome/onboarding and tournament-not-started messaging. It should communicate what the quiniela is, what will happen when matches are available, and what the user should expect next, while preserving a strong primary action or expectation-setting block.

## Interaction Model

### Prediction Capture

Prediction entry should feel like progressing through match cards, not filling out a cold form.

Each match card should make these elements immediately readable:

- both teams
- date and time
- score inputs with very clear numerals
- autosave state / confirmation feedback
- simple next-step navigation

The mobile flow should favor one match at a time for clarity and comfort.

Predictions should autosave per match card rather than relying on a final batch submission step. The UI must make it obvious when a card is saved, still in progress, or failed to save.

### Standings Table

The family table should be the most visually striking informational block on the home screen.

It should emphasize:

- ranking position
- player name
- points
- movement in the table when relevant
- clear emphasis on the current user row

The table should feel competitive and celebratory, not financial or analytical.

### Social Privacy Rule

The app is social, but prediction privacy is essential before closure.

- standings are visible
- each user can always see their own picks
- other users' picks stay hidden until that specific match starts
- the design must avoid accidentally exposing other users' predictions

Prediction privacy and locking operate at the individual match level.

## Content Requirements

### Tone of Voice

Copy should be close, direct, and friendly. Never technical.

Examples of the intended tone:

- `Te faltan 3 partidos`
- `Pronostica antes del cierre`
- `Vas en 4to lugar`
- `Ya estás al corriente`

### Home Screen Content

The home screen should support:

- primary action copy for prediction
- current standing summary
- short urgency or deadline messaging
- short section labels for standings and upcoming matches

### Prediction Flow Content

The prediction flow should include:

- match labels
- clear input labels or visual score affordances
- save feedback
- progress cues for remaining matches

## Visual System Variables

### Theme

- light only
- bright and warm
- no dark mode in the initial design direction

### Color Strategy

The palette should be derived from FIFA World Cup 2026 brand cues, but translated into a usable product system rather than copied literally everywhere.

Core palette roles:

- `background`: warm off-white
- `foreground`: deep navy
- `primary`: vivid FIFA-style red
- `secondary`: institutional blue / navy range
- `accent`: green with Mexico cue
- `support accents`: controlled touches of purple, orange, aqua, or lime inspired by 2026 campaign graphics

Rules:

- use one dominant color per screen section, not all event colors at once
- multicolor appears as identity garnish, not as constant noise
- avoid pure black and pure white
- maintain strong readability at all times

### Typography Strategy

- display typography with real personality and tournament energy
- body and UI text must stay simple, calm, and highly legible
- scores and numeric values must be instantly readable

Typography should give the app event identity without making the interface feel editorial, technical, or hard to scan.

### Shape Language

- rounded and friendly components
- large touch targets
- inviting, game-like card shapes
- soft edges even in competitive modules like standings

### Graphic Language

- selective use of curves, bands, or separators inspired by the 2026 visual campaign
- decorative graphic language should appear in headers, separators, or emphasis zones
- avoid wallpaper-like decorative overload

### Density

- balanced information density
- clear hierarchy and grouping
- enough information to be useful without reading like a dashboard

## UX Rules

1. The app must feel understandable in seconds.
2. The home screen must always preserve an obvious action path.
3. Social competition should be visible through standings, not through exposed picks.
4. The product should feel like a family game tied to the World Cup event.
5. Avoid any design move that makes the app feel technical, dark, dense, or overly professional.
6. Prediction privacy rules must feel obvious and trustworthy.

## Recommended References For Implementation

- `awesome-design-md/design-md` references that favor cheerful, light, branded surfaces over dark dashboards
- FIFA World Cup 2026 campaign palette and event graphics as inspiration for accents and decorative rhythm
- The existing shared UI primitives in `packages/ui`, but with a custom token layer and stronger visual identity

During implementation, the most relevant design references will be:

- color and contrast guidance
- typography direction for display/body pairing
- responsive/mobile-first layout behavior
- interaction design for one-card-at-a-time prediction flows

## Open Questions

1. Which exact font pairing best expresses `alegre, sencilla, deportiva` without feeling childish or too editorial?
2. How large and expressive should the standings table become on desktop while preserving the mobile-first mental model?
3. Should standings movement be shown through arrows, badges, color shifts, or another lighter-weight signal?
4. How much event-style decorative graphics can be added before the prediction flow starts feeling visually noisy?
5. What is the clearest UI language for communicating per-match lock timing and pick reveal timing to family members?
