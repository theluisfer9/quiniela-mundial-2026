# Quiniela Mundial 2026 Redesign Spec

## Feature Summary

This redesign replaces the current dull, scaffolding-heavy interface with a lively World Cup 2026 product identity. The app should feel social, sporty, and family-friendly across every primary screen, not just the home page.

The redesign applies to the product shell, home screen, family standings, and prediction flow. The goal is not to make one hero section look better in isolation, but to make the full app feel coherent, alive, and clearly tied to the tournament.

## Primary User Action

The primary action remains: `understand the current family competition and start or continue predictions immediately`.

After the redesign, users should feel that:

1. the app belongs to a tournament/event, not a generic dashboard
2. the family standings matter and are fun to check
3. the prediction flow is obvious and easy to continue

## Design Context

### Users

- Family members participating in a World Cup 2026 quiniela
- Mixed technical comfort
- Mobile-first usage
- Small social group where competition should feel fun, not intimidating

### Personality

- Alegre
- Sencilla
- Deportiva

### Anti-Direction

- No gray, lifeless interface
- No sports-data overload similar to SofaScore
- No cold enterprise dashboard look
- No childish caricature or novelty visual system

## Redesign Direction

The approved direction is `Torneo Vivo`.

This means the app should combine:

- sports energy and quick action from betting / picks interfaces like PrizePicks
- standings clarity from sports apps like FotMob
- playful ranking energy from casual-game leaderboard patterns

The result should feel like a family World Cup game with real competitive tension, not a finance dashboard and not a statistics product.

## Visual System

### Palette

Use the official World Cup color references as the basis for the product system:

- `blue / structural`: `#2A398D`
- `red / action`: `#E61D25`
- `green / progress`: `#3CAC3B`
- `light neutral`: `#D1D4D1`
- `dark neutral`: `#474A4A`

### Color Roles

- blue is the dominant structural color
- red is the main CTA and urgency color
- green marks progress, success, and positive momentum
- gray is supporting only, never dominant

### Theme

- light only
- high contrast
- energetic, but not chaotic

### Typography

The approved font direction is:

- `Bricolage Grotesque` for display typography
- `Manrope` for body, labels, navigation, and supporting UI text

#### Usage

- hero headlines
- top 3 leaderboard treatment
- standings headings
- key numeric surfaces such as points, rank, and score entry

should use `Bricolage Grotesque` where emphasis and product identity matter.

Supporting UI text should use `Manrope` so the app remains easy to read for the whole family and never feels overly noisy or stylized.

#### Reasoning

This pairing keeps the app lively and memorable without becoming aggressive or hard to use. It supports the `Torneo Vivo` direction better than a neutral single-font system and gives the product a clearer tournament identity.

### Intensity

The approved intensity is: `viva y deportiva, con bastante contraste`.

The app should feel active and vivid, but the color system must still be disciplined. The goal is strong emotional energy, not noise.

## Layout Strategy

### Global

Every primary surface should feel like part of the same product family:

- bold section headers
- visibly branded surfaces
- rounded blocks with strong contrast
- less empty gray UI, more intentional color usage

### Home Hierarchy

The home page should keep this structure:

1. hero with strong red CTA to predict now
2. personal summary (position, points, pending predictions)
3. top 3 family leaderboard block
4. compact standings table for the rest
5. next closings / upcoming matches
6. direct access to continue predictions

This keeps the home page competitive, useful, and easy to scan.

## Standings Design

### Approved Pattern

Use a `hybrid leaderboard`:

- top 3 gets a special visual treatment
- the rest remains in a compact readable table/list
- the current user row is always highlighted even outside the top 3

### Why

This pattern keeps the app socially exciting without sacrificing clarity.

- the top 3 creates instant emotional energy
- the compact table below keeps the product usable
- the user can locate themselves quickly without reading a full dense board

### Movement Indicators

Rank movement should be visible but lightweight:

- subtle up/down/steady signals
- no noisy animated stat widgets
- enough to reinforce competition without overcomplicating the table

## Prediction Flow Design

### Core Principle

Prediction cards should look like match pieces, not forms.

Each card should make these elements prominent:

- the two teams
- kickoff / lock time
- large score inputs
- save state
- progress through remaining matches

### Interaction Tone

- before prediction is saved: active and high energy
- after save: clear green confirmation
- once locked: calm, read-only, clearly not an error

### Scope Truthfulness

`/pronosticos` only shows the signed-in user's predictions.

The redesign must not imply that this screen reveals other users' picks. Any privacy or kickoff messaging should remain truthful to that route.

## Component-Level Guidance

### Header

- simple, mobile-first
- branded but not heavy
- clear `Inicio` and `Pronósticos`
- account entry always easy to find

### Hero

- compact, not oversized marketing fluff
- strong CTA in red
- supportive blue structure
- immediate explanation of what remains to do

### Upcoming Matches

- readable fixture summary
- enough urgency to act
- clear path to continue prediction on a specific match

### Auth Screens

- same product identity as the main app
- warmer Spanish copy
- no generic SaaS form feel

## Accessibility And Usability

- preserve high legibility at all times
- keep touch targets large
- use semantic table structure for standings
- never rely on color alone to communicate position or save state
- maintain obvious focus states and skip-navigation support already added to the shell

## Recommended Inspiration

Use Lazyweb-derived reference patterns, not direct cloning:

- `fotmob` for clear standings and sports information hierarchy
- `prizepicks` for energetic CTA treatment and onboarding feel
- casual-game leaderboard patterns for top-3 emphasis and competitive delight

The goal is not to imitate any one product exactly. The goal is to synthesize a tournament identity that fits this family quiniela.

## Open Questions

1. How strong should the top-3 visual treatment become before it begins to overpower the rest of the product?
2. Should the home hero include additional event graphics or remain mostly typography-driven?
3. Should the prediction cards eventually include team flags or stay mostly typographic for cleaner contrast?
4. How much motion should be introduced later in the redesign, if any?
