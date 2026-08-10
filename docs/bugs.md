# Al-Habl — Master Bug-Fix & Production Readiness Prompt

You are the **senior full-stack engineer responsible for taking Al-Habl from its current state to a production-ready MVP**.

Al-Habl is a Qur’an-centered reflection and study-circle platform. The current codebase contains several bugs identified during a review meeting with Quran.Foundation. Your job is to **inspect the existing implementation, identify the root causes, fix the bugs properly, and verify the fixes end-to-end**.

Do **not** blindly patch symptoms. Understand the existing architecture, data flow, state management, API integrations, authentication, database schema, responsive layouts, and AI/tool wiring before making changes.


---# 4. BUG #2 — UI Controls Invisible/Inaccessible on Smaller Screens

## Problem

Some important UI controls are not visible or accessible on smaller screen sizes.

Reported around:

* 33:05

This is a production-blocking responsive-design issue.

## Required behavior

All essential functionality must remain accessible across supported viewport sizes.

Test at minimum:

* 320px width
* 360px width
* 375px width
* 390px width
* 414px width
* 768px width
* desktop widths

## Investigate

Find controls that disappear because of:

* overflow hidden
* fixed widths
* absolute positioning
* incorrect z-index
* flexbox shrinking
* grid constraints
* viewport height assumptions
* media-query mistakes
* elements extending outside the viewport
* mobile navigation problems
* buttons being covered by other elements
* horizontal scrolling
* sticky/fixed elements
* responsive typography
* insufficient touch target size

Do not simply shrink everything.

## Required UX standards

Essential controls must:

* remain visible
* remain reachable
* not overlap
* not be clipped
* not require impossible horizontal scrolling
* have reasonable touch targets
* maintain readable text
* maintain visual hierarchy

Where necessary, redesign the mobile interaction rather than forcing the desktop layout into a smaller viewport.

## Acceptance criteria

For each major page:

* No essential control is clipped.
* No important button disappears.
* No content causes unintended horizontal scrolling.
* Menus/modals remain usable.
* Verse controls remain accessible.
* AI controls remain accessible.
* Profile controls remain accessible.
* Circle controls remain accessible.
* Mobile layouts do not overlap or break.

Use responsive browser/devtools testing or an equivalent method if available.

THE APP SHOULD WORK FINE IN ALL DEVICES
---

# 5. BUG #3 — Translation and Tafsir Render as Raw HTML

## Problem

Translation and tafsir content is currently being rendered as raw/unformatted HTML.

Reported around:

* 39:53

Instead of displaying clean formatted content, users may see HTML markup directly.

## Required behavior

Translation and tafsir must render as properly formatted, readable content.

For example:

* paragraphs should display as paragraphs
* emphasis should display correctly
* lists should display correctly
* line breaks should behave appropriately
* links should be handled safely
* formatting should match Al-Habl's design system

## Investigate

Determine:

1. What format the API returns.
2. Whether content contains HTML.
3. Whether the content is escaped incorrectly.
4. Whether the frontend is treating HTML as plain text.
5. Whether HTML is being injected incorrectly.
6. Whether the backend transforms the content.
7. Whether Markdown/HTML conversion is happening.
8. Whether the current renderer is appropriate.

Do not assume the content format.

## Security requirement

Treat all externally sourced HTML as potentially unsafe.

Do NOT introduce an XSS vulnerability simply to make the formatting work.

If HTML rendering is required:

* sanitize content using an appropriate existing project dependency where possible
* allow only safe tags/attributes
* prevent script injection
* prevent dangerous URLs
* do not render arbitrary unsanitized HTML

## Acceptance criteria

Translation:

* No raw HTML tags are visible.
* Formatting is readable.
* Content is correctly displayed.

Tafsir:

* No raw HTML tags are visible.
* Paragraphs/formatting are preserved appropriately.
* Content remains readable on mobile and desktop.

Test with:

* normal content
* paragraphs
* emphasized content
* links
* line breaks
* malformed/unexpected content
* potentially malicious HTML

---

# 6. BUG #4 — Profile Streak & Activity Logging

## Problem

Profile streak and activity values are incorrect, missing, blank, or otherwise not displaying reliably.

Reported around:

* 43:09
* 43:12

## Required behavior

The profile should accurately represent user activity.

Investigate the entire activity pipeline:

**User action → event creation → API → database → aggregation → profile API → frontend → display**

## Investigate

Check:

* activity table/schema
* user IDs
* authentication identity mapping
* timestamps
* timezone handling
* duplicate activity records
* missing activity records
* database writes
* API response structure
* frontend state
* loading states
* null handling
* date calculations
* streak calculation
* timezone boundaries
* consecutive-day logic

## Streak requirements

Define the existing intended streak behavior from the code/product implementation before modifying it.

Then ensure:

* today's activity is correctly recognized
* yesterday/today relationships work correctly
* multiple activities on the same day don't incorrectly inflate streaks
* duplicate events don't create incorrect streaks
* missed days correctly break the streak where intended
* timezone behavior is consistent
* newly created users don't show misleading values
* users with no activity receive an appropriate zero/empty state

Do not silently change the product definition of a streak.

## Activity logging

Verify that relevant user actions are actually recorded.

Check both:

* creation
* retrieval

Do not only fix the profile UI if the underlying database records are missing.

## Acceptance criteria

Test at minimum:

### New user

Expected:

* no false activity
* appropriate zero/empty state

### One activity today

Expected:

* activity appears
* streak is correct

### Multiple activities today

Expected:

* streak does not artificially increase multiple times

### Activity today + yesterday

Expected:

* consecutive streak works correctly

### Activity with missed day

Expected:

* streak behavior matches product rules

### Existing user

Expected:

* historical records are not corrupted

---

For every referenced tool, document internally:

| Tool | Defined? | Registered? | Callable? | API works? | AI receives result? |
| ---- | -------- | ----------- | --------- | ---------- | ------------------- |

Fix every broken link in this chain.


Test:

* verse lookup
* translation retrieval
* tafsir retrieval
* AI question about selected verse
* AI question requiring Quran grounding
* invalid verse
* unavailable API
* tool timeout
* malformed tool response

Verify that the AI's answer actually uses the retrieved data.

---

# 8. BUG #6 — Circle Feature Missing Essential Controls

## Status

Post-MVP / lower priority.

Do not allow this work to delay the P0 fixes.

The circle system currently lacks important functionality such as:

* member management
* privacy settings
* configurable reflection timelines

## Required future implementation

Audit the current circle architecture and identify the minimum changes needed to support:

### Member management

Potential capabilities:

* view members
* remove members where authorized
* manage roles
* distinguish owner/admin/member

### Privacy

Potential settings:

* public/private circle
* invite-only access
* join permissions
* visibility controls

### Reflection timelines

Allow circles to configure appropriate reflection periods/timelines rather than forcing a fixed workflow.

## Important

Do not fully implement this feature unless explicitly instructed after P0 bugs are resolved.

For now:

* document current limitations
* identify architectural requirements
* avoid breaking the existing circle functionality

---

# 9. BUG #7 — QuranReflect Reflection/Ayah Mismatch

## Status

Investigation required.

Reported around:

* 50:11

Basit reported that a reflection displayed a different ayah than expected on QuranReflect.com.

Asma confirmed that this appeared to be a bug.

## Required investigation

Do not assume which system is responsible.

Trace:

```text
Al-Habl verse
        ↓
Reflection creation
        ↓
Stored verse reference
        ↓
API/database
        ↓
QuranReflect integration
        ↓
Displayed verse
```

Check:

* surah IDs
* ayah numbers
* verse keys
* translations
* reflection IDs
* URL parameters
* serialization/deserialization
* API mappings
* caching
* stale state
* database records
* QuranReflect integration

Determine whether the mismatch originates from:

1. Al-Habl
2. QuranReflect
3. the integration layer
4. incorrect stored data
5. frontend rendering
6. caching/state

## Important

Do not change production behavior based on assumptions.

First reproduce and isolate the issue.

If the issue is confirmed to originate outside Al-Habl:

* document the evidence
* identify the exact integration contract/problem
* prepare a clear report for Basit/the relevant team

---

# 10. Testing Strategy

Do not consider a bug fixed merely because the code compiles.

For every P0 issue:

### Step 1 — Reproduce

Confirm the original failure.

### Step 2 — Diagnose

Identify the root cause.

### Step 3 — Fix

Implement the smallest robust solution.

### Step 4 — Regression test

Verify that existing functionality still works.

### Step 5 — Edge cases

Test realistic failure conditions.

### Step 6 — Production build

Run the project's lint/typecheck/build/test commands.

---

# 11. Required Verification Matrix

Create an internal verification matrix similar to:

| Bug                     | Reproduced | Root cause identified | Fixed | Tested | Regression checked |
| ----------------------- | ---------- | --------------------- | ----- | ------ | ------------------ |
| Verse context reset     | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| Mobile controls         | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| Raw HTML                | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| Profile streak/activity | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| AI tool wiring          | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| Circle controls         | ☐          | ☐                     | ☐     | ☐      | ☐                  |
| QuranReflect mismatch   | ☐          | ☐                     | ☐     | ☐      | ☐                  |

Do not mark an item complete without actual verification.

---

# 12. Code Quality Requirements

While fixing the bugs:

* Remove dead code only when directly related to the fix.
* Avoid duplicate logic.
* Avoid unnecessary abstraction.
* Keep functions/components understandable.
* Handle loading/error/empty states.
* Validate API inputs.
* Validate API outputs.
* Use proper TypeScript types if the project uses TypeScript.
* Avoid `any` unless genuinely necessary.
* Avoid silently swallowing errors.
* Add useful logging where debugging requires it.
* Never expose secrets or API keys.
* Never hardcode credentials.
* Never commit `.env` secrets.
* Preserve existing authentication/security behavior.
* Sanitize external content.
* Respect existing API rate limits.

---

# 13. Database Safety

Before modifying database-related logic:

1. Inspect the current schema.
2. Understand existing production data.
3. Avoid destructive migrations.
4. Avoid deleting historical activity data.
5. Make migrations backwards-compatible where possible.
6. Handle existing null/invalid records safely.
7. Do not reset production tables.
8. Do not modify historical user activity merely to make the UI look correct.

If a migration is genuinely required, explain why before applying it.

---

# 14. API Integration Safety

For every external API integration:

* inspect the existing API contract
* validate responses
* handle timeout/errors
* handle rate limits
* handle missing fields
* avoid assuming response shape
* preserve source identifiers
* avoid silently substituting incorrect data

Especially verify all Quran-related integrations.

---

# 15. Responsive QA

After fixing the UI issue, inspect the application at:

* 320 × 568
* 360 × 800
* 375 × 812
* 390 × 844
* 414 × 896
* 768 × 1024
* 1024 × 768
* desktop/larger screens

Check:

* navigation
* verse selection
* AI interface
* translation
* tafsir
* profile
* circles
* modals
* buttons
* forms
* scrolling
* sticky elements

No essential interaction should become inaccessible.

---

# 16. Final Production Audit

Before declaring the work complete, verify:

### AI

* [ ] Verse context persists after refresh
* [ ] AI receives the correct selected verse
* [ ] Tools are actually wired
* [ ] Tool responses reach the AI
* [ ] AI does not fabricate source usage
* [ ] Quran grounding works

### Quran content

* [ ] Translation renders correctly
* [ ] Tafsir renders correctly
* [ ] No raw HTML appears
* [ ] External content is sanitized
* [ ] Verse identifiers remain correct

### Profile

* [ ] Activity is recorded
* [ ] Activity is retrieved
* [ ] Streak is calculated correctly
* [ ] Empty states work
* [ ] Timezone behavior is consistent

### Responsive UI

* [ ] Mobile controls visible
* [ ] No clipped controls
* [ ] No unintended horizontal overflow
* [ ] Touch interactions work
* [ ] AI interface works on mobile

### Circles

* [ ] Existing circle functionality remains intact
* [ ] Missing feature requirements documented
* [ ] No P0 work is blocked by circle expansion

### QuranReflect

* [ ] Mismatch investigated
* [ ] Root cause identified if reproducible
* [ ] Integration behavior documented

---

# 17. Final Response Format

When you finish, do NOT simply say "fixed."

Provide a concise engineering report containing:

## A. Bugs Fixed

For each P0 bug:

* Original problem
* Root cause
* What was changed
* Files/components affected
* How it was tested

## B. Bugs Not Fully Resolved

Clearly list anything that could not be fixed and explain why.

## C. QuranReflect Investigation

State:

* whether the mismatch was reproduced
* where the mismatch originates
* whether it is an Al-Habl issue or external integration issue
* recommended next action

## D. Circle Feature

Document what remains intentionally deferred.

## E. Verification

Report:

* tests run
* lint/typecheck results
* production build result
* responsive testing performed
* API/integration testing performed

## F. Remaining Risks

List any known production risks honestly.

---

# FINAL INSTRUCTION

**Do not stop at making the UI appear correct.**

The goal is to make Al-Habl **actually reliable at the data, state, API, AI, and UI layers**.

Prioritize correctness over speed.

Fix root causes.

Verify every fix.

Do not fabricate missing information.

Do not assume an external integration works — prove that it works.

Do not mark a bug as resolved until you can reproduce the original failure, demonstrate the fix, and verify that the fix survives realistic edge cases.

Start by auditing the codebase and mapping the architecture. Then reproduce and fix the P0 bugs **in priority order**.




BUG #1
==================================================
23. CRITICAL QURAN.COM AYAH REFERENCE BUG
==================================================

The application is integrated with Quran.com / the connected Quran.com ecosystem.

There is currently a serious synchronization bug involving the selected ayah and posted reflections.

CURRENT BEHAVIOR:

The app has a Daily Rotation ayah.

For example:

Daily Rotation:
Surah Al-Baqarah — Ayah 2

The user can then manually change/select the ayah.

For example:

User selects:
Surah Al-Fatihah — Ayah 7

The application UI correctly reflects the newly selected ayah.

HOWEVER:

When the user posts a reflection about the selected ayah, the reflection is being associated with / sent using the ORIGINAL daily-rotation ayah.

So effectively:

Daily Rotation:
Al-Baqarah 2

↓ user changes ayah ↓

Currently selected:
Al-Fatihah 7

↓ user posts reflection ↓

❌ Quran.com receives/posts the reflection against:
Al-Baqarah 2

instead of:

✅ Al-Fatihah 7


THIS MUST BE FIXED.

==================================================
24. SINGLE SOURCE OF TRUTH FOR THE SELECTED AYAH
==================================================

The currently selected ayah must be the SINGLE SOURCE OF TRUTH for:

- displayed ayah
- ayah reference
- surah number
- ayah number
- verse key
- reflection composer
- reflection submission
- Quran.com synchronization
- Quran.com post/reference
- any metadata associated with the reflection

The Daily Rotation ayah should only provide the INITIAL/default selection.

Once the user manually selects another ayah, the Daily Rotation ayah must no longer be used as the reflection target.

Conceptually:

INITIAL STATE:

selectedAyah = dailyRotationAyah

AFTER USER SELECTS AN AYAH:

selectedAyah = userSelectedAyah

WHEN POSTING:

postReflection(selectedAyah)

NOT:

postReflection(dailyRotationAyah)


==================================================
25. TRACE THE ENTIRE REFLECTION FLOW
==================================================

DO NOT fix only the UI.

Trace the complete flow from:

1. Daily ayah generation/rotation
2. Initial ayah state
3. User selecting/changing an ayah
4. Selected ayah state update
5. Reflection composer
6. Submit/post handler
7. API request
8. Request payload
9. Quran.com integration
10. Quran.com post/reference
11. Any database persistence
12. Any optimistic UI update
13. Any cache/state synchronization

Find where the ORIGINAL daily ayah is being retained.

Look specifically for code patterns such as:

- dailyAyah
- todayAyah
- rotationAyah
- currentAyah
- selectedAyah
- activeAyah
- verse
- verseKey
- surahNumber
- ayahNumber
- reference
- reflectionTarget
- Quran.com API payload
- post payload
- mutation payload
- stale closures
- useCallback dependencies
- useMemo dependencies
- state initialized from daily rotation
- props that still contain the original ayah

Do not assume the problem is in the UI.

The bug may be in the submission handler or API payload.

==================================================
26. CHECK FOR STALE STATE / STALE CLOSURES
==================================================

Pay particular attention to React state and closures.

For example, investigate situations like:

const [selectedAyah, setSelectedAyah] = useState(dailyAyah)

but later:

submitReflection(dailyAyah)

instead of:

submitReflection(selectedAyah)

Also inspect:

- useCallback()
- useMemo()
- useEffect()
- event handlers
- async functions
- mutation functions
- cached values
- refs
- derived state

Make sure the reflection submission always uses the CURRENT selected ayah at the exact moment the user submits.

Do not use an old captured value.

If a callback depends on selectedAyah, make sure its dependency behavior is correct.

==================================================
27. CHECK THE ACTUAL QURAN.COM PAYLOAD
==================================================

Do not assume the frontend state is the problem.

Inspect the actual request being sent when the user posts a reflection.

Determine exactly which ayah identifier is being sent to the backend/Quran.com integration.

For example, verify whether the payload contains something conceptually like:

{
  surah: 2,
  ayah: 2
}

when it should contain:

{
  surah: 1,
  ayah: 7
}

for the user's selected Al-Fatihah 7.

Also inspect whether the integration uses:

- verseKey
- ayah number
- surah number
- chapter ID
- verse ID
- Quran.com-specific identifier
- reference string

Do NOT blindly replace identifiers.

Understand which identifier the existing Quran.com integration expects and preserve that existing contract.

==================================================
28. DAILY ROTATION MUST NOT OVERRIDE USER SELECTION
==================================================

The daily rotation is a DEFAULT/INITIAL value.

It must NOT continuously override the user's manually selected ayah.

Check for effects like:

useEffect(() => {
    setSelectedAyah(dailyAyah)
}, [dailyAyah])

If such logic exists, determine whether it is causing the user's selected ayah to be replaced.

Do not remove legitimate daily-rotation behavior.

Instead, ensure that:

- Daily rotation initializes the selection appropriately.
- User selection takes precedence afterward.
- Posting uses the user-selected ayah.
- Daily rotation does not unexpectedly reset the selected ayah.

==================================================
29. REFLECTION DATA MUST CONTAIN THE CORRECT REFERENCE
==================================================

When a reflection is created, make sure the persisted reflection contains the correct ayah reference.

For example:

User selects:

Surah Al-Fatihah
Ayah 7

Reflection:

"My reflection..."

The stored/synchronized reflection should reference:

Al-Fatihah 7

NOT:

Al-Baqarah 2

Verify this at every layer:

UI
↓
React state
↓
submit handler
↓
request payload
↓
backend
↓
database
↓
Quran.com integration

The correct ayah must survive the entire chain.

==================================================
30. DO NOT BREAK QURAN.COM INTEGRATION
==================================================

CRITICAL:

DO NOT replace the existing Quran.com integration.

DO NOT invent a new API.

DO NOT change API endpoints unnecessarily.

DO NOT change authentication.

DO NOT change existing Quran.com identifiers unless the current implementation is demonstrably wrong.

DO NOT remove existing synchronization.

Fix the incorrect ayah reference being passed through the existing integration.

Preserve everything else.

==================================================
31. TEST THIS EXACT SCENARIO
==================================================

After fixing the issue, test this exact flow:

STEP 1:

Open the Circle.

Suppose Daily Rotation shows:

Surah Al-Baqarah — Ayah 2


STEP 2:

Change/select the ayah to:

Surah Al-Fatihah — Ayah 7


STEP 3:

Verify the UI now shows:

Al-Fatihah — 7


STEP 4:

Write a reflection.


STEP 5:

Submit/post the reflection.


STEP 6:

Inspect the request/payload and verify that the reflection references:

Surah Al-Fatihah — Ayah 7


STEP 7:

Verify Quran.com / the connected integration also associates the reflection with:

Al-Fatihah 7


NOT:

Al-Baqarah 2


STEP 8:

Repeat the test with another completely different ayah.

For example:

Al-Ikhlas — Ayah 1

Make sure the previously selected/default ayah is not reused.

==================================================
32. IMPORTANT REGRESSION TEST
==================================================

Also test the opposite case.

If the user does NOT manually change the Daily Rotation ayah:

Daily Rotation:
Al-Baqarah 2

User posts reflection.

Then the reflection SHOULD correctly reference:

Al-Baqarah 2.

Therefore:

DEFAULT SELECTION → Daily Rotation ayah

MANUAL SELECTION → User-selected ayah

POST → Current selected ayah

Never:

POST → Always Daily Rotation ayah

==================================================
33. FINAL RULE FOR THIS BUG
==================================================

DO NOT PATCH THE DISPLAY.

DO NOT HARD-CODE SURAH OR AYAH NUMBERS.

DO NOT SPECIAL-CASE AL-FATIHAH 7.

DO NOT CREATE A SECOND AYAH STATE.

DO NOT DUPLICATE THE AYAH DATA.

DO NOT CHANGE THE QURAN.COM API CONTRACT WITHOUT NEED.

Find the existing source-of-truth problem and fix the data flow.

The selected ayah shown to the user MUST be the same ayah used when creating and synchronizing the reflection.

UI AYAH
=
SELECTED AYAH
=
REFLECTION TARGET
=
API PAYLOAD AYAH
=
QURAN.COM AYAH