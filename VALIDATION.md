# Current validation — separate admin release

- 13 Node tests passed: existing inquiry/date/localization/gallery checks plus verified administrator allowlist, untrusted profile metadata rejection, image validation, CSRF origin enforcement, unauthenticated/non-admin denial, optimistic save conflicts, failure reporting, cookie flags, signup isolation, logout and absence of editor code on customer pages.
- Production build and both standalone preview exports passed. Node syntax checks and HTML ID/asset checks passed.
- Public navigation and photo filters use consistent uppercase English labels. Asim spelling is consistent. Existing EN/KO/JA copy and date controls are retained.
- Previously exposed preview editor was removed from the customer HTML and team script. A separate /admin page now calls authentication and content APIs.
- Auth session is checked with Supabase user lookup on every write. Only verified IDs in ADMIN_USER_IDS can save. Direct anonymous/authenticated database access is revoked by migration.
- API tests mock provider responses; they do not prove real Supabase operation or SQL execution.
- Not run: browser interactions/screenshots (no installed Chromium executable), live signup email, live login, database migration/write, GitHub push, Vercel deployment or DNS checks.
- Native Illustrator saving remains outside this web release; existing artwork is unchanged.

## Multilingual heading alignment
- Japanese hero uses three explicit phrase lines; サーフィン。 is kept together, including final punctuation.
- Heading sizes now follow the text-column width through container units, with min-width: 0 on grid children.
- Korean keep-all is separated from Japanese strict line-breaking; removed the global overflow-wrap:anywhere rule responsible for arbitrary CJK breaks.
- Heading/body wrapping and small-screen gallery/header spacing reviewed in source. Existing tests and build pass.
- Actual visual verification remains incomplete: Cloud Browser rejected file:// preview navigation. No claim of browser-verified responsive layouts is made.

## Q&A and section order
- Added 11 expandable questions in five categories, with English, Korean and Japanese copy.
- Verified the eight content sections exactly follow header anchor order in source and standalone preview. All IDs are unique; standalone scripts are embedded.
- Updated lesson inclusions to the user-provided service details. Unspecified pre-date cancellations within 24 hours remain subject to enquiry, not an invented refund term.
- 14 tests and build passed. Actual browser visual QA remains blocked as documented above.

## Consolidated navigation
- Header order verified: HOME, OUR STORY, AYO SURF, PHOTOS, Q&A.
- Brand philosophy, character system and planned merchandise are under Our Story.
- AYO SURF contains lessons, instructors and pricing in that order, with internal anchor links. Inquiry buttons continue to the existing form.
- Checked internal anchor targets, unique IDs, standalone scripts and all 14 existing tests; build passed. Browser visual validation remains incomplete.

## Booking tab restored / sticky school navigation
- Header contains all six required links, including restored BOOKING INQUIRY. Form and 11 FAQ entries retained.
- School subnavigation moved outside the intro into a direct AYO SURF child, so sticky positioning is constrained by the entire school collection.
- Main and secondary bar heights observed for anchor offsets; current subsection highlighted during scrolling. Content and subnavigation share one width/gutter.
- Checked anchors, hierarchy, unique IDs, translations and 14 tests. Browser sticky-position verification remains incomplete.
