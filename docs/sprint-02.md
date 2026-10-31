# PUNTO. — DESIGN SPRINT 02
## Complete the Interactive MVP Prototype

Continue working on the **existing PUNTO Artifact**. Do not create a new unrelated project or redesign the brand.

You already have the approved PUNTO Brand Manual, the approved visual identity board and the original Master Design Brief. These remain the sources of truth.

The current "02 · Grupo" design is a strong starting point. Preserve its visual direction: deep navy backgrounds, coral highlights, warm cream, expressive lime and lilac cards, Sora and Inter typography, oversized numbers and a contemporary social-sports aesthetic.

**Our objective is now to complete and refine the first six flagship screens as one consistent, interactive iOS product prototype.**

## Phase 1 — Refine the existing Group screen

Keep the existing four sections: Resumen, Ranking, Partidos and Duplas.

Improve the header's vertical efficiency, reduce unnecessary spacing and avoid duplicated "Registrar partido" actions.

Make sure rankings clearly communicate positions, win percentages, match counts and provisional players.

Preserve the expressive rivalry and duo highlights.

Do not remove or redesign existing components that are already working well.

## Phase 2 — Complete the six flagship screens

### 01 — Inicio

Create a visually compelling home screen showing:

- Personalized greeting.
- Global win percentage.
- Total matches.
- Current streak.
- Last match.
- A meaningful statistical highlight.
- Recent group activity.
- Access to groups and match registration.

It should feel like a personalized social sports experience, not a corporate analytics dashboard.

### 02 — Grupo

Use and refine the existing screen.

Ensure the four internal tabs have consistent spacing, typography, styling and interactions.

### 03 — Registrar partido

Create a complete functional prototype flow:

1. Select group.
2. Select four distinct players from the group.
3. Assign partners to two teams.
4. Choose match format.
5. Enter set scores.
6. Validate the score.
7. Confirm the result.

Allow guest players.

Support single-set, best-of-three and deciding supertiebreak formats.

Reject duplicate participants, incomplete scores and invalid results.

Make this flow extremely intuitive and touch-friendly.

### 04 — Resultado

This should be one of the strongest visual moments in PUNTO.

Show:
- Winning and losing pairs.
- Large final score.
- Short celebration.
- An accurate relevant statistic.
- A beautifully designed social sharing card.
- Actions to share or return to the group.

Use expressive branding without overwhelming the information.

### 05 — Perfil global

Show the player's identity and consolidated performance across all groups.

Include:
- Avatar and name.
- Total matches.
- Wins and losses.
- Win percentage.
- Current streak.
- Match history.
- Groups.
- Frequent partners.
- Relevant rivalries.

Make the distinction between global and group-specific statistics unmistakable.

### 06 — Cara a cara

Design an outstanding player comparison experience.

Include:
- Two players.
- Strong VS visual composition.
- Direct confrontations.
- Victories for each.
- Win percentages.
- Recent meetings.
- Contextual group selection.
- Shareable result card.

The screen should communicate friendly competition and real history.

## Phase 3 — Connect everything

The prototype must use working navigation between screens.

At a minimum, demonstrate this journey:

**Inicio → Grupo → Registrar partido → Resultado → Grupo actualizado → Cara a cara → Perfil.**

Use a persistent shared state during the prototype session.

When a user records a new match:

- Add it to match history.
- Update affected player statistics.
- Recalculate group rankings.
- Recalculate relevant duo statistics.
- Recalculate relevant head-to-head results.
- Update global profiles.
- Ensure all linked screens display consistent data.

Do not hardcode contradictory statistics in different components.

For prototype purposes, these computations may be implemented locally, with a clear separation between data, calculations and presentation.

## Phase 4 — UX states

Include functional representative states for:

- New users with no match history.
- Groups without results.
- Players with fewer than five matches.
- Guest players.
- Players without direct confrontation history.
- Invalid match scores.
- Successful match registration.
- Editable historical matches.
- Loading and error states.

Do not fabricate statistical insights when data is insufficient.

## Phase 5 — Design system and quality

Preserve and expand the existing reusable components.

Define consistent:
- Colors and semantic tokens.
- Typography.
- Spacing.
- Border radii.
- Buttons.
- Cards.
- Player avatars.
- Ranking rows.
- Match cards.
- Statistics.
- Navigation.
- Modal interactions.

Design at a modern iPhone reference size and verify reasonable adaptability to smaller devices and safe areas.

Maintain accessible contrast, readable text, minimum 44-point touch targets and clear loading and error feedback.

Keep all user-facing copy in natural Argentine Spanish.

## Phase 6 — Developer readiness

The eventual production stack is React Native, Expo, TypeScript and Supabase.

Do not build the production backend now.

Instead, keep the prototype's component structure, data models and visual assets organized so that a coding agent can implement the approved design efficiently.

Clearly separate:
- UI components.
- Demo data.
- Statistical calculations.
- Navigation logic.
- Visual assets.
- Design tokens.

Document anything that might require a different implementation approach in React Native.

## Strict scope

Do not add court booking, payments, social feeds, live chat, AI sports analysis, tournament brackets or advanced ranking algorithms.

Do not introduce a mascot.

Do not change the brand identity.

Do not produce static screens with non-functional buttons and present them as an interactive prototype.

Do not overwrite the existing Group design with an unrelated layout.

## Final deliverable

Deliver one coherent, navigable PUNTO prototype with all six flagship screens, functional interactions, consistent demonstration data and reusable design components.

Provide a concise review of the design decisions and any known limitations.

Make the complete project exportable for external review, ideally as source files or a single ZIP, not isolated exports of individual screens.

**The goal is an exceptionally polished consumer app prototype that we can review and approve before beginning production development with Claude Code.**