# ArenaX progress

Day-by-day log of what changed, newest first. Updated after every change.
Feature list and end goal: [feature.md](feature.md). New session? Start with [session.md](session.md).

## Where we are

- **Current focus:** UI polish after the black + yellow restyle (colours and fonts only; layout stays as it is).
- **Next up:** brand step 2: a "Sent offers" list on the Brand Dashboard (pending / accepted / declined). Then step 3: chat between brand and talent after an offer is accepted.
- **To do on your side:**
  - Render (arenaX-server): set `GMAIL_USER`, `GMAIL_APP_PASSWORD` and `GEMINI_API_KEY`.
  - UptimeRobot: ping `https://arenax-server-v75s.onrender.com/api/health` every 5 minutes so the free server doesn't fall asleep.
  - Google Cloud Console: fill in the Branding URLs (home page, privacy, terms).
- **Known issues:**
  - Old lint errors in `AuthContext`, `BrandAuthContext`, `AdminDashboard`, `BrandDashboard`, `MyDeals` and `Tournament` (setState inside an effect). These existed before the restyle.
- **Offered, not started:**
  - Delete the old content/purchase/subscription collections from the database.
  - Hide email addresses on public profiles.

---

## 2026-10-31 (Sat)
**Brand deals for athletes (brand step 1 of 3)**
- Athletes now see "Brand deals" in the account menu (it was coach-only, so offers brands sent to athletes were never seen). With no offers yet, the page tells athletes that brands can find them once their career readiness reaches 70% on My DNA. Tested: brand sends an offer to an athlete, the athlete opens it from the menu and accepts it.

**Logo without a box**
- Removed the dark rounded box the navbar drew around the logo; the white AX logo now sits directly on the page background.

**New AX logo**
- New "AX" monogram: the A's right leg is also one stroke of the X, and the A's crossbar stops on the X. White on a transparent background (no yellow tile), with an all-white "ARENAX" wordmark (`Logo.jsx`, `LogoMark`).
- The browser-tab icon (`public/favicon.svg`) was still Vite's default purple logo; it is now the AX mark in white on a dark rounded square, so it stays visible on light browser tabs.

## 2026-10-26 (Mon)
**Yellow pills are now outlined**
- Every yellow pill (main buttons such as Search, Book session, Register team, Log in; selected chips; Joining as; the selected booking slot) has no yellow fill any more: a thin (1px) yellow border with white text. On hover it fills solid yellow with black text (counts and icons inside turn black too); clicking darkens it slightly and presses it in. All other pills and chips also press in when clicked. One shared CSS rule: `.btn-dark`, `.btn-lime`, `.chip-active`, `.pill-selected` in `index.css`.

**Fix: Google sign-in button on login and sign-up**
- The button sat in a white box that clashed with the dark page. It is now Google's dark pill style, with no white box, and as wide as the form on every screen (Google allows up to 400px). It re-draws when the screen is resized. Checked on login and sign-up at 1440, 390 and 360px wide.

**Less yellow (Discover and app-wide)**
- Yellow is now kept for the main action and the current selection only (navbar active pill, + button, Search, selected chip, star ratings).
- Discover: search-field icons and the "ArenaX Pro · coming soon" label are grey; Get notified, Ask now, View details and Chat are plain dark buttons; the coach card "Next slot" line is white with only a yellow clock icon.
- App-wide: Follow buttons have a thin light-grey outline with white text (was yellow); initials avatars are shades of grey only (no yellow).

**Fix: broken profile photos**
- When a profile photo link no longer loads (for example the file was deleted), avatars now show the person's initials instead of a broken-image icon with cut-off text. The coach profile card shows the stadium backdrop instead. Tested by making every photo link fail: no broken images left, initials everywhere.

**Navbar active link back to solid yellow**
- The navbar keeps its small solid yellow pill with black text for the active link (the outline style is for buttons and chips only).

**Navbar active link**
- The active navbar link is now a small yellow pill (36px tall, sized to its label) with black text instead of a yellow underline; other links get a dark background on hover.

**Feed hero and session photos**
- New hero banner at the top of the home feed (`FeedHero.jsx`): "Train · Learn · Compete · Grow", "Build a stronger you", Explore coaches → Discover. It is the only new element; nothing else moved.
- Dark photo behind the Upcoming session cards (feed right column, the compact card on smaller screens, Discover).

**Dark theme photos behind existing cards**
- Added 10 free Unsplash photos with dark, black backgrounds. They sit behind cards that already existed, so nothing moved: the login/sign-up banner, the Discover search card and promo card, the home feed profile card, and every tournament card (a photo per sport: cricket, football, badminton, basketball, boxing, tennis; a night stadium for the rest). Removed the 6 old photos. Credits are in `frontend/public/images/CREDITS.md`.

**Uploaded photos in colour again**
- Profile pictures, post photos, marketplace photos and the photo cropper show original colours again. Only the theme backdrop photos (login banner, coach profile background) stay black and white.

**Project docs**
- Added `session.md`: a handoff for new sessions (app, stack, deploy and env var names, UI rules, key decisions, working rules, next task).
- Added `feature.md` (features, where they live in the code, end goal, folder structure) and this `progress.md`. Both get updated after every change from now on.

**Removed money, added engagement**
- Removed prices and payments everywhere.
- Added Arena Points (daily check-in streak, points for sessions, posts and invites), drill levels, a Founding Member badge, a Pro waitlist page and a gear marketplace with "Contact seller".
- Added feature gates: every user is on `plan: "free"`, and `canAccess` controls what each one can use.

**Black + yellow restyle**
- **Step 1:** black + yellow theme, Bebas Neue headings, flat cards (no glass, blur or glows), black-and-white photos, colours by meaning (like red, verified blue, statuses amber/green/red).
- **Step 2:** new left sidebar and top bar. **Reverted the same day**, because the restyle should change colours only, not move components.
- Recoloured decorative icons, hashtags and initials avatars, so blue, green and red only appear where they mean something. Recoloured the DNA progress chart to yellow.
- Login/sign-up banner on phones now uses the Bebas heading font.

## 2026-10-25 (Sun)
- **Messaging:**
  - Direct messages between users who follow each other.
  - A Messages button in the navbar with a people-count badge; the notification bell no longer shows messages.
- **Profile:**
  - Crop and zoom the profile photo before upload.
  - The saved user's photo and name stay in sync with the server.
- **Popups:**
  - In-app popups and toasts replace browser alerts.
  - Red for destructive actions (delete account, log out).
  - The notifications panel stays on screen on phones.
- **Navbar and Discover:**
  - The navbar hides while scrolling down.
  - Equal-width links with the Post button centred.
  - Discover's top coaches show 3 per row on large screens.
- **Themes:** dark glass theme, then the "Smoke + Ember" palette, with coloured icons and selected states.
- **Deploy and speed:**
  - New Render setup: static frontend, backend in Singapore.
  - Fewer, faster API requests.
  - Google sign-in tolerates stray spaces or quotes in `GOOGLE_CLIENT_ID`.

## 2026-10-24 (Sat)
- **Core features:**
  - Athlete DNA dashboard (#1).
  - Coach matching from DNA gaps (#2).
  - Calendar with real session dates, reschedule and completion (#4).
  - Portfolio with coach verification (#5).
  - AI coach with Gemini (#8).
- **Social:**
  - Posts API, feed homepage, likes, comments, replies, saves.
  - Follow users and a Following feed.
  - Private accounts with follow requests.
- **Discover:** redesigned, with a coach profile card for slot booking.
- **Sign-in:**
  - Continue with Google.
  - Gmail-only sign-up confirmed by an emailed code.
  - "Joining as" Learner / Coach / Brand.
  - Privacy and Terms pages.
- **Fixes:**
  - Deleting an account removes everything linked to it.
  - No sideways scrolling on phones.
  - Login/sign-up layout on phones.
  - The live frontend can call the API.
- **Look:** light lime theme; themed dropdowns replace native selects.
- **Speed:** pages load on demand, halving the first download.
- **Demo data:** seed and clear scripts (`npm run seed:demo` / `clear:demo`).

## 2026-10-09 (Fri)
- Brand login, brand dashboard and a coach deals page.
- Tournaments backend.
- Fixed route mounts in `server.js`.

## 2026-10-07 (Wed)
- Real-time chat (Socket.io) for confirmed bookings.
- Analytics dashboard: rating, endorsements, achievements, completion rate.

## 2026-10-06 (Tue)
- Google OAuth turned off for now; back to the standard login screen.

## 2026-10-03 (Sat)
- Admin role and admin dashboard: list users, delete any user.
- Account deletion route.
- CORS allows the local frontend during development.

## 2026-10-02 (Fri)
- Booking list shows the profile photo and a clickable name.

## 2026-09-05 (Sat)
- First commit: ArenaX V1–V3.
- First deploy to Render (fixed the allowed Vite host and the routes).
