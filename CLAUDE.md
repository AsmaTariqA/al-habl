PROMPT FOR CLAUDE CODE — Fix AppShell Responsive Layout Bugs

CONTEXT:
The file is src/components/circle/AppShell.tsx (or wherever it actually 
lives in this repo — locate it first). It renders a left sidebar, a 
center content column, and an optional right panel (used on the Circle 
page for the members list).

BUGS TO FIX (reproduce by resizing the browser window through these 
widths — especially watch the range 900px–1280px):

1. BUG: Right panel (Circle Members list) disappears between roughly 
   900px–1280px width. It currently only shows via an `xl:flex` class 
   (1280px+), so in the 900–1279px range it's not rendered as a side 
   panel — but it's ALSO not correctly appearing in its "stacked below 
   content" fallback position. Instead it seems to render awkwardly 
   after/inside the wrong part of the layout (reported as appearing 
   "before/after the reflection box" unpredictably). 
   
   FIX: There should be exactly two states, with no gap between them:
   - Below 1280px (xl): right panel renders as a full-width block, 
     clearly stacked BELOW all main content (after the reflection 
     composer, as the last element on the page)
   - At 1280px+ (xl): right panel renders as a fixed-width column to 
     the right of center content
   Audit the current conditional rendering (`xl:hidden` / `hidden xl:flex` 
   classes) and make sure there is no width range where the panel is 
   simply missing from the DOM or visually orphaned.

2. BUG: Center content (the ayah card, lens tabs, reflection feed) is 
   NOT horizontally centered between the left sidebar and the edge of 
   the viewport (or right panel, when visible). There is a visible gap 
   on the LEFT side of the content column, making it look squeezed and 
   off-center rather than evenly balanced.

   FIX: The center content column must be truly centered in the 
   available space (viewport width minus sidebar minus right panel, 
   when applicable) at ALL widths above the sidebar's own breakpoint 
   (768px/md), not just above xl. Use a proper flex layout (flex-1 + 
   justify-center on the container, with a max-width + w-full on the 
   inner content div) rather than manual padding/margin offsets, since 
   padding-based centering is what caused this bug originally.

3. GENERAL REQUIREMENT: Test and confirm correct behavior at these 
   specific widths, and report what you see at each: 768px, 900px, 
   1000px, 1100px, 1280px, 1440px, 1920px. At every width:
   - Sidebar (240px) is either hidden (<768px) or fixed-left (≥768px)
   - Center content is visually centered in the remaining space, with 
     no lopsided gap on either side
   - Right panel is either: hidden and content isn't reserving space 
     for it (<768px, no bottom-nav-covered overlap), stacked full-width 
     below main content (768px–1279px), or a fixed right column 
     (≥1280px) — with NO width range where it's missing entirely or 
     misplaced

DO NOT:
- Do not use fixed pixel padding to "fake" centering — use flexbox's 
  actual centering (justify-center / mx-auto within a flex/grid parent)
- Do not change the sidebar's own behavior or breakpoint (768px/md is 
  correct and should stay)
- Do not change what's rendered INSIDE the right panel (member list 
  content) — only fix its layout positioning and responsive visibility

AFTER FIXING:
Show me the diff of what changed in AppShell.tsx (and any other file you 
had to touch), and confirm you tested the specific width range 900px–1280px 
where the bug was most visible, since that's the range currently broken.