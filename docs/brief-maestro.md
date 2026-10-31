# PUNTO. — MASTER DESIGN BRIEF
## Product Design, UX/UI & Interactive Prototype
**Version 1.0 | iOS-first | Argentina | October 2026**

## 00. YOUR ROLE AND MISSION

Act as an exceptional multidisciplinary product design team composed of:

- Senior Product Designer specializing in consumer mobile apps.
- UX Architect experienced in social and gamified products.
- Visual Design Director specializing in memorable digital identities.
- iOS Interaction Designer.
- Design Systems Lead.
- Product Design Engineer focused on developer handoff.

Your mission is to design **PUNTO.**, a distinctive, beautiful, highly usable iPhone application for amateur padel players.

You are not designing a generic sports analytics dashboard. You are creating a social consumer product that turns padel matches between friends into statistics, rivalries, achievements and shared history.

The application must feel like a real, polished, App Store-ready consumer product, not a SaaS dashboard, presentation, speculative concept or collection of unrelated mockups.

**Your first task is to establish the design system and create an interactive prototype of six core screens. Do not start production development or attempt to generate every screen before the first design review.**

Work proactively and make thoughtful design decisions within this specification. Do not ask unnecessary questions. If a minor detail is unspecified, choose a sensible default and document it.

---

# 01. REFERENCE MATERIAL AND BRAND FIDELITY

You will receive two mandatory references:

**Reference A — Approved Brand Identity Image**

A visual identity board for PUNTO containing the selected wordmark direction, color palette, photographic style, mobile interfaces, social cards, typography, iconography and graphic elements.

This is the PRIMARY VISUAL REFERENCE.

Use it to understand the approved aesthetic, composition, energy, contrast, photographic direction, typography and overall personality.

Do not copy the illustrated phone screens literally. They communicate visual direction, not final UX or accurate product logic.

**Reference B — PUNTO Brand Identity Manual v1.0**

The written manual defines positioning, tone of voice, color codes, typography, visual principles and brand applications.

Treat both references as mandatory inputs.

If they conflict, follow the exact design tokens and written functional rules in this brief while preserving the visual spirit of the reference image.

The original brand identity is still being finalized. Treat the supplied wordmark as the selected direction, not necessarily a production-ready vector asset.

Do not invent or add a registered trademark symbol.

## Approved design direction: SOCIAL SCORE

PUNTO should feel:

- Social and playful.
- Competitive without being aggressive.
- Expressive and memorable.
- Contemporary and youth-oriented.
- Emotionally engaging.
- Premium in execution, but not corporate or cold.
- Distinctively Argentine in communication.
- Built around typography, oversized numbers, statistics and shared experiences.

It must feel fundamentally different from traditional padel club management software.

Do not imitate another app's proprietary visual elements. Pasito is inspiration for approachable and expressive communication, not a template to reproduce.

---

# 02. PRODUCT DEFINITION

## Product name
PUNTO.

## Main tagline
Cada partido cuenta.

## Supporting brand line
La cancha tiene memoria.

## Product statement

PUNTO is a social padel app that allows amateur players to register matches, maintain a personal playing history, participate in private groups, track statistics, discover rivalries and share results with friends.

The core idea is simple:

**Every match becomes part of a larger story.**

## Target audience

Primary users:
- Amateur padel players in Argentina.
- Approximately 18–35 years old as the initial design audience, but the product must remain usable by older players.
- People who play regularly with friends.
- Groups of approximately 4–16 recurring players.
- Competitive enough to care about results, but not necessarily professional or tournament players.
- Frequent WhatsApp users.

Secondary users:
- People who belong to multiple padel groups.
- Friends who want to track their performance over time.
- Group organizers who regularly register results.

## Central product promise

PUNTO answers questions like:

- Who has won the most?
- Who is the best performing player in our group?
- Who is on a winning streak?
- Who do I play best with?
- Which player consistently beats me?
- What happened the last time we played?
- How has my performance evolved?
- Which pair is currently dominating?

The answers must be understandable, statistically accurate and enjoyable to explore.

---

# 03. PRODUCT ARCHITECTURE

The application has three fundamental entities:

## A. GLOBAL PLAYER PROFILE

Every registered user has one personal identity.

The global profile aggregates every valid match that user has participated in across their groups.

It includes:
- Name.
- Profile picture.
- Global matches played.
- Global wins and losses.
- Global win percentage.
- Sets won and lost.
- Current winning or losing streak.
- Personal match history.
- Groups.
- Frequent partners.
- Frequent opponents.
- Relevant personal records.

All aggregated statistics must be derived from actual matches.

## B. PRIVATE GROUPS

Users can belong to multiple groups simultaneously.

Each group has:
- Group name.
- Optional cover or avatar.
- Member list.
- Guest players.
- Match history.
- Group ranking.
- Group-specific statistics.
- Pair combinations.
- Head-to-head comparisons.

Group statistics are independent from other groups.

Example:

A user can rank second in "Los del Jueves" while ranking first in "Los Pibes".

The user's global profile aggregates both groups.

## C. MATCHES

Matches are the source of truth for all statistics.

Every match has:
- One originating group.
- Four distinct participants.
- Two teams of two players.
- Match date.
- Match format.
- Set scores.
- Winning team.
- Creation and correction metadata.

A match must never be counted twice in the global profile.

For the MVP, a match belongs to exactly one group.

Independent matches outside groups are not part of the initial release.

---

# 04. FUNCTIONAL RULES AND STATISTICAL LOGIC

These rules are mandatory. Do not design interactions that contradict them.

## 4.1 Match creation

A registered group member can create a match.

The match creation flow consists of:

1. Select group, preselected when entering from a group.
2. Select four distinct players.
3. Assign two players to Team A and two to Team B.
4. Choose match format.
5. Enter set scores.
6. Review and confirm.
7. View the completed result.

Group members may include guest placeholders without registered accounts.

Prevent selecting the same player twice.

The match date defaults to today but can be changed to register historical games.

## 4.2 Supported match formats

The MVP supports:

- Single-set matches.
- Best-of-three-set matches.
- Best of three with a deciding supertiebreak instead of the third set.

The interface must adapt to the chosen format.

For standard sets, support valid padel-style scores such as 6–0 through 6–4, 7–5 and 7–6, including their reversed forms.

For a deciding supertiebreak, support scores of at least 10 points with a two-point winning margin.

The resulting winner must be unambiguous.

Do not include point-by-point scoring, golden point tracking or individual shot statistics.

## 4.3 Global statistics

Global statistics include all valid, non-duplicated matches played by the registered user across private groups.

Wins + losses must equal total completed matches played.

Win percentage = wins / matches played × 100.

Display whole-number percentages in primary UI, with a consistent rounding convention.

The full match count must remain accessible.

## 4.4 Group ranking

The initial ranking is based on match win percentage within that group.

Rules:
- Minimum five completed matches to qualify for the consolidated ranking.
- Players below five matches are shown separately as provisional.
- Order qualified players by win percentage.
- First tiebreaker: total wins.
- Second tiebreaker: sets won percentage, when available.
- If still tied, use a stable deterministic order and visually communicate ties appropriately.
- Always show the number of matches played.

Do not invent a performance rating or Elo score.

Do not confuse a group's ranking position with a player's global ranking. There is no universal global ranking in MVP v1.

## 4.5 Rivalries

Individual head-to-head statistics count completed matches in which two players participated on opposite teams.

Matches where they were partners do not count as head-to-head confrontations.

Display:
- Shared confrontations.
- Wins for each player.
- Win percentages.
- Relevant recent history.

Allow users to choose group-specific comparisons.

Avoid declaring someone superior from an insufficient sample.

## 4.6 Duos

Pair statistics count completed matches in which the two selected players played on the same team.

Show:
- Matches together.
- Wins and losses.
- Win percentage.
- Recent performance.

Mark low-sample statistics as provisional.

Use three shared matches as the initial threshold for highlighting a "top duo"; still allow inspection of smaller samples.

## 4.7 Streaks

Calculate streaks from completed matches in chronological order.

Use a deterministic order for matches recorded on the same date.

A current winning streak ends when the player loses a match; a losing streak ends when the player wins.

Editing a historical result must trigger recalculation.

## 4.8 Guest players

A group administrator or authorized member can add a guest player by name without requiring registration.

Guest players:
- Can appear in matches.
- Can be included in group statistics.
- Do not have a verified global account automatically.
- Can later be associated with a registered user through an explicit, verified linking process.

Do not automatically merge profiles based solely on matching names.

The interface must clearly distinguish registered users from guests.

For the prototype, show the invitation and linking flow conceptually, without pretending that identity verification is implemented.

## 4.9 Corrections and privacy

Only authorized group members can create or edit records according to the role system.

Design an initial simple permission model:
- Group administrator.
- Regular group member.
- Guest placeholder.

For MVP, an administrator can correct or delete any group result; a regular member can correct their own entries within the allowed rules.

The interface must confirm destructive actions.

Users see detailed private group information only for groups they belong to.

A player's complete global history is private by default. Other group members may see that player's group-specific records and statistics.

Sharing any result externally requires an explicit action.

Include account deletion and settings entry points.

---

# 05. VISUAL IDENTITY

## Color tokens

Use these exact starting values:

Primary Navy: #19283B
Punto Coral: #FF7855
Warm Cream: #FFF8ED
Match Lime: #DCEB82
Social Lilac: #B9A6F2
Graphite: #394457

You may derive neutral surface and border colors if needed.

Do not introduce unrelated primary colors.

## Typography

Display headings: Sora Bold / ExtraBold.
UI and body: Inter Regular / Medium / Semibold.

Use large, expressive typography.

For numeric comparisons, prefer tabular numerals.

Avoid excessive small labels.

## General visual approach

Follow the approved reference image closely:

- Deep navy as a defining structural color.
- Large off-white typography.
- Vibrant coral primary actions.
- Lime and lilac statistical cards.
- Warm cream for contrasting content surfaces.
- Bold, confident layouts.
- Large percentages and match scores.
- Realistic amateur padel photography in selected moments.
- Rounded components with consistent radii.
- Contemporary icons with coherent stroke weight.
- High-contrast information hierarchy.

The app may be dark-dominant with selected warm cream surfaces.

Do not automatically make every screen entirely dark. Use controlled contrast and variety while keeping a unified product.

The app must look playful without looking childish.

## Graphic elements

Use:
- Oversized numbers.
- Simple directional arrows.
- Abstract points and lines.
- Subtle court-line references.
- Ranking markers.
- Modular cards.
- Lightweight patterns.
- Clear VS compositions.

Avoid:
- Generic padel racket logos.
- Mascots or cartoon characters.
- Neon gradients.
- Glassmorphism everywhere.
- Generic SaaS cards.
- Dense analytical dashboards.
- Overly formal athletic branding.
- Overdecorated interfaces.

## Photography

Use natural, authentic padel moments:
- Friends between matches.
- Amateur doubles play.
- Outdoor and indoor courts.
- Celebrations.
- Candid sports moments.

Do not use recognizable professionals or celebrity likenesses without suitable rights.

If production assets are not available, use clearly labeled placeholders or suitable licensed images in the prototype.

## Brand voice

All user-facing copy must be written in natural Argentine Spanish.

Short, playful and clear.

Examples:
- "Cada partido cuenta."
- "La cancha tiene memoria."
- "Que hablen los números."
- "Hay historial."
- "Se viene revancha."
- "La dupla del momento."
- "Partido cargado."
- "Sumá a los tuyos."

Humor should appear in contextual highlights, not in security notices, destructive confirmations or serious errors.

Never invent statistics simply to create funny copy.

---

# 06. INFORMATION ARCHITECTURE

Use four primary bottom navigation destinations:

1. INICIO
2. GRUPOS
3. PARTIDO
4. PERFIL

The PARTIDO action should be visually emphasized with Punto Coral.

The bottom navigation must feel native to iOS and respect safe areas.

Do not add additional main tabs.

Detailed views, such as player comparisons or match details, are accessed contextually.

Secondary tabs inside a group can be used when appropriate.

Avoid confusing global statistics with group-specific data.

Always make the current statistical context clear.

---

# 07. SCREEN INVENTORY

The complete MVP design scope consists of 12 main screens.

### SCREEN 01 — WELCOME / AUTHENTICATION

Purpose: Introduce PUNTO and begin authentication.

Include:
- Large brand wordmark.
- "Cada partido cuenta."
- Strong photography.
- Brief product statement.
- Create account.
- Sign in.
- Email-based authentication flow.

The first impression must feel energetic and premium.

### SCREEN 02 — FIRST-TIME SETUP

Purpose: Help the user create a profile and join the product.

Include:
- Name.
- Optional profile picture.
- Create a group.
- Join a group through an invitation.
- An option to explore an empty personal area without a group.

Show how a group can start with guests who do not have accounts.

Do not make the user complete an excessive questionnaire.

### SCREEN 03 — HOME

Purpose: Make users want to open PUNTO repeatedly.

Include:
- Personalized greeting.
- Global win percentage.
- Total matches.
- Current streak.
- Recent match.
- Highlighted statistic, when supported by the data.
- Quick access to groups.
- Clear registration action.

Prioritize interesting insights over generic dashboard widgets.

When there are no matches, display an inviting empty state rather than zero-filled analytical cards.

### SCREEN 04 — MY GROUPS

Purpose: Manage and access different padel communities.

Include:
- Group cards.
- Group name.
- Member count.
- Recent activity.
- User's position when qualified.
- Create group.
- Join via invitation.

Show multiple groups with clearly distinct identities.

### SCREEN 05 — GROUP DETAIL

Purpose: Act as the social home of a private group.

Include:
- Group name and identity.
- Members and invitations.
- Summary.
- Ranking.
- Match history.
- Duos.
- Relevant rivalry insights.
- Register match.

Suggested internal sections:
- Resumen.
- Ranking.
- Partidos.
- Duplas.

Use concise, comprehensible hierarchy.

The ranking must differentiate qualified and provisional players.

### SCREEN 06 — REGISTER MATCH

Purpose: Register a match as fast as reasonably possible.

Include:
- Group selector.
- Match date.
- Four player selections.
- Team assignment.
- Match format.
- Set input.
- Score validation.
- Confirmation.

Use large touch targets and efficient controls.

The flow should be achievable in approximately 30–45 seconds once the group and players already exist. Treat this as a usability target to test, not a guaranteed measured performance result.

Avoid keyboard-heavy experiences where useful selectors can simplify entry.

### SCREEN 07 — MATCH RESULT / CELEBRATION

Purpose: Reward the user immediately after recording a match.

Include:
- Winning team.
- Losing team.
- Large match score.
- Small celebratory motion or graphical response.
- One relevant statistic if data supports it.
- Share result.
- View match detail.
- Return to group.

Design an expressive, branded share card.

The user should feel that registering a result was worthwhile.

### SCREEN 08 — MATCH DETAIL

Purpose: Inspect an existing result.

Include:
- Date.
- Group.
- Four players.
- Team composition.
- Set scores.
- Winner.
- Relevant statistics.
- Authorized edit action.
- Confirmation for deletion.

### SCREEN 09 — MY GLOBAL PROFILE

Purpose: Give the user a compelling picture of their personal history.

Include:
- Profile photo and name.
- Global overview.
- Matches.
- Wins and losses.
- Win rate.
- Current streak.
- Groups.
- Recent matches.
- Frequent partners and rivals.
- Personal records.

Communicate that this is the user's global profile, not the profile of one group.

### SCREEN 10 — OTHER PLAYER PROFILE

Purpose: Explore someone else's visible performance.

Include:
- Player identity.
- Shared group context.
- Matches and performance inside the relevant group.
- Shared history.
- Access to head-to-head comparison.

Do not expose full private global history without permission.

### SCREEN 11 — HEAD TO HEAD

Purpose: Create one of the most distinctive and shareable PUNTO experiences.

Include:
- Two player identities.
- A prominent VS treatment.
- Total direct confrontations.
- Wins for each.
- Percentages.
- Recent direct meetings.
- A memorable but accurate headline.
- Sharing action when appropriate.

Make this screen visually exceptional.

Avoid misleading comparisons or exaggerated conclusions from tiny samples.

### SCREEN 12 — DUOS

Purpose: Show how players perform together.

Include:
- Pair combinations.
- Matches together.
- Wins.
- Win percentage.
- Group filters.
- Partner detail.
- Qualified and provisional pairings.

This should celebrate successful doubles partnerships.

---

# 08. FIRST DESIGN ITERATION — SIX PRIORITY SCREENS

Do not generate the entire screen inventory immediately.

First establish the design system and create these six screens:

1. HOME.
2. GROUP DETAIL.
3. REGISTER MATCH.
4. MATCH RESULT.
5. GLOBAL PROFILE.
6. HEAD TO HEAD.

These are the flagship screens.

Together they must communicate:
- The brand personality.
- The main user experience.
- The visual hierarchy.
- The social nature of the product.
- The statistical system.
- The core interaction pattern.

Create a coherent interactive prototype connecting these screens.

A user should be able to:
- Open the home screen.
- Enter a group.
- Inspect its ranking.
- Start recording a match.
- Complete a simulated valid result.
- See the result confirmation.
- Navigate to a player comparison.
- Return to the global profile.

Use realistic client-side prototype data and working interactions.

No production backend is required at this stage.

**After completing the first six screens, stop and present them for visual and UX review before expanding into the remaining six.**

Do not independently redesign the brand halfway through the project.

---

# 09. DEMONSTRATION DATA

Use a consistent fictional dataset across all six initial screens.

Suggested principal user:

**Tomás "Tomi" González**

Global:
- 22 matches.
- 14 wins.
- 8 losses.
- 64% win rate, rounded.
- Current winning streak: 3.

Group A:
**Los del Jueves**
- 8 members.
- 24 total group matches.
- Tomi: 14 matches, 9 wins, 5 losses.
- Tomi's group win rate: 64%, rounded.
- Tomi's group position: second.

Group B:
**Los Pibes**
- 10 members.
- 12 group matches.
- Tomi: 8 matches, 5 wins, 3 losses.
- Tomi's group win rate: 63%, rounded.

The match data must support the displayed aggregate values.

Create additional players and match records with internally consistent statistics.

You may show a featured rivalry where Tomi leads Nico 8–2, provided the underlying direct-match data supports it.

Use the same names, photos, values, matches and group identities across linked screens.

Do not produce contradictions such as different percentages for the same scope, or matches appearing in a group they do not belong to.

Treat the approved identity board's example numbers as illustrative; this dataset is the functional reference.

---

# 10. DESIGN FOR EMPTY, LOADING AND ERROR STATES

Create representative states for:

### New user
No matches, no groups and no statistics.

### Newly created group
Members exist but no matches have been registered.

### Provisional ranking
Player has fewer than five completed matches.

### No head-to-head history
Two players have never faced each other.

### Guest participant
Player exists in group history without a linked account.

### Invalid match
Duplicate participant, incomplete score or invalid set result.

### Network issue
Submission fails and entered data must be preserved.

### Loading
Use skeletons or lightweight loading treatments without shifting the overall layout excessively.

### Correction
Editing a historical result changes statistical summaries.

### Destructive actions
Request explicit confirmation before deletion.

Make these states visually cohesive with the approved brand.

---

# 11. INTERACTION AND MOTION

PUNTO is a playful consumer app, so interaction quality matters.

Use:
- Subtle number transitions.
- Short confirmation animations.
- Responsive tab selection.
- Smooth card transitions.
- Lightweight celebratory motion.
- Clear loading feedback.
- Small tactile interaction opportunities when appropriate.

Do not use motion for decoration alone.

Any animation should be brief, purposeful and compatible with reduced-motion settings.

The result confirmation is the primary moment where a stronger branded interaction is justified.

---

# 12. IOS QUALITY AND ACCESSIBILITY

Design for a modern iPhone first.

Use a reference viewport around 393 × 852 logical points, and verify adaptability to narrower and larger screens.

Follow native iOS conventions for:
- Safe areas.
- Bottom navigation.
- Navigation headers.
- Modal presentation.
- Back navigation.
- Keyboard interaction.
- Scrolling.
- Share sheet patterns.
- Form validation.

Use touch targets at least 44 × 44 points.

Use readable typography, adaptable text sizing, adequate color contrast and accessible labels.

Avoid relying only on color for wins, losses, ranking changes or errors.

Use iOS-friendly component patterns that can reasonably be implemented in React Native.

The visual identity should be distinctive without sacrificing usability.

---

# 13. REUSABLE COMPONENT SYSTEM

Build and name a coherent system of reusable components.

At minimum:

### Brand components
- BrandWordmark.
- BrandIcon.
- BrandTagline.
- BrandPattern.

### Navigation
- AppTabBar.
- ScreenHeader.
- BackNavigation.
- SectionTabs.

### Player and group
- PlayerAvatar.
- PlayerIdentity.
- PlayerStatCard.
- GroupCard.
- GroupMemberRow.
- GuestPlayerIndicator.

### Statistics
- StatHighlight.
- WinRateCard.
- StreakCard.
- RankingRow.
- RankingTable.
- ProvisionalStatIndicator.
- MatchHistoryRow.
- HeadToHeadSummary.
- DuoStatCard.

### Match
- PlayerSelector.
- TeamAssignment.
- MatchFormatSelector.
- SetScoreInput.
- MatchSummary.
- MatchResultCard.

### System states
- EmptyState.
- LoadingState.
- ErrorState.
- ConfirmationModal.
- ShareCard.

Define variants where needed.

Keep spacing, corner radii, typography, interactions, colors and iconography consistent.

Do not recreate a visually different component for each screen.

---

# 14. DEVELOPER HANDOFF REQUIREMENTS

The approved design will be implemented using:

- React Native.
- Expo.
- TypeScript.
- Expo Router.
- Supabase for authentication and data storage.

You are responsible for design and prototype quality, not for building the production application at this stage.

However, all design decisions should be implementable using this stack.

Avoid creating interactions that require unnecessary proprietary native technology or complex custom rendering.

Prepare the design for Claude Code with:

1. Named screen hierarchy.
2. Reusable components.
3. Design tokens.
4. Typography specifications.
5. Spacing and sizing guidelines.
6. Color usage.
7. Assets and image references.
8. Interactive states.
9. Navigation flows.
10. Form validation behaviors.
11. Empty and error states.
12. Responsive behavior.
13. Accessibility considerations.
14. Notes on any decisions that could be technically expensive.
15. Clear identification of mocked data versus real product requirements.

Make it easy for a coding agent to recreate the approved experience without inventing design decisions.

Preserve the editable design and prototype as the source of truth. Do not replace them with static screenshots.

---

# 15. SCOPE MANAGEMENT

The MVP must remain realistic for a solo founder using AI-assisted development with a limited API credit budget.

Therefore, do not design or introduce:

- Court reservations.
- Club administration.
- Payments or subscriptions.
- Live chat.
- Public social feeds.
- Public worldwide leaderboards.
- Tournament brackets.
- Complex Elo matchmaking.
- AI-generated sports analysis.
- Video analysis.
- Wearable integrations.
- Automated ball-by-ball tracking.
- Advanced push notification systems.
- Android-specific experiences.
- A complex admin dashboard.

These may be future product opportunities but are not part of the first release.

Prefer a polished, coherent core experience over a broad application with unfinished flows.

---

# 16. DESIGN QUALITY BAR

The result should be visually comparable in quality, clarity and refinement to outstanding modern consumer apps.

Every screen must demonstrate:
- A strong hierarchy.
- Clear user intent.
- Meaningful content.
- Distinctive but consistent branding.
- Excellent use of typography.
- Thoughtful spacing.
- Functional interactions.
- Reliable responsive behavior.
- Accessible contrast and controls.
- Consistent data.

Avoid generic template aesthetics.

Avoid visual clutter.

Do not create beautiful statistics that cannot be explained or calculated.

Do not use lorem ipsum.

Do not introduce new features merely to fill space.

The design should feel as though an experienced product team has intentionally refined every important decision.

---

# 17. REQUIRED FIRST DELIVERABLE

For the first iteration, deliver:

**A. Brand-to-product interpretation**

Briefly explain how you translated the approved identity into a mobile UI.

**B. Design system**

Color tokens, typography, spacing, radius, shadows, icons and component foundations.

**C. Six flagship screens**

Home, Group Detail, Register Match, Match Result, Global Profile and Head to Head.

**D. Interactive prototype**

Working navigation and representative interactions between those screens.

**E. Representative edge states**

At least:
- No history.
- Provisional ranking.
- Invalid match.
- Successful match recording.
- Empty rivalry.

**F. Design review notes**

A concise summary of:
- Key UX decisions.
- Visual system decisions.
- Any product-rule ambiguity.
- Potential implementation challenges.
- Opportunities for refinement.

Do not begin production implementation.

Do not automatically generate the remaining six screens.

Pause at the first design milestone and allow the founder to review the direction.

---

# 18. FINAL CREATIVE PRINCIPLE

PUNTO is not a statistics database with a colorful interface.

It is a social experience that makes amateur padel more memorable, competitive and fun.

A user should open the app and immediately understand:

"This is where all our matches live."

They should be able to register a result effortlessly, discover something interesting about their history and share it with friends.

The visual identity must support this feeling at every step.

**PUNTO.**
**Cada partido cuenta.**

Begin by analyzing the supplied references, establishing the design system and producing the six interactive flagship screens.