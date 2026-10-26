# ArenaX: start here (new session)

Read this first, then [progress.md](progress.md) (what changed, by day) and [feature.md](feature.md) (every feature and where it lives in the code).

## The app
A sports platform for grassroots sport in India:
- **Athletes** find and book coaches, track their skills (Athlete DNA), build a coach-verified portfolio and enter tournaments.
- **Coaches** get discovered and manage their sessions.
- **Brands** find career-ready athletes to sponsor.

Free for now: there are no payments.

- **Repo:** github.com/tusharsethiya23/ArenaX, branch `main`.
- **Backend** (`Backend/`): Express 5, Mongoose 9 (MongoDB), Socket.io, Gemini AI, ImageKit for photos, nodemailer + Gmail SMTP for email codes.
- **Frontend** (`frontend/`): React 19, Vite, Tailwind CSS v4 (theme tokens in `src/index.css`), lucide-react icons.
- **Run locally:**
  - backend: `cd Backend && npm run dev` (port 5000)
  - frontend: `cd frontend && npm run dev` (port 5173)
- **Demo data:** `npm run seed:demo` / `npm run clear:demo` in `Backend/`. Demo users are `*@demo.arenax`.

## Live and deployment
- **Frontend:** https://arenax-frontend.onrender.com (Render static site, build `npm run build`, root `frontend/`).
- **Backend:** https://arenax-server-v75s.onrender.com (Render web service, Singapore, root `Backend/`, start `node server.js`; `package.json` has no `start` script). Health check: `/api/health`.
- Pushing to `main` redeploys both.
- **Secrets** live only in `Backend/.env` / `frontend/.env` (gitignored) and in Render's environment settings. Never commit them.

**Backend env vars** (names only):

| Purpose | Variables |
|---|---|
| Database and auth | `MONGO_URI`, `JWT_SECRET` |
| Google sign-in | `GOOGLE_CLIENT_ID` |
| Email | `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| AI coach | `GEMINI_API_KEY`, optional `GEMINI_MODEL`, `AI_RATE_LIMIT` |
| Photos | `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` |
| CORS | `CLIENT_URLS` (extra allowed origins, comma-separated) |
| Time zone | `APP_TIMEZONE` (default `Asia/Kolkata`) |

**Frontend env vars:** `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_CONTACT_EMAIL`.

## UI rules
- **Colours:**
  - page `#0A0A0A`; cards `#121212` with a `white/8` border and `rounded-2xl`; inner items and inputs `#1A1A1A`
  - brand yellow `#FFC21A` (borders, accents, key words); secondary text `#A1A1A1`
  - no glass, blur, gradients or glows
- **Colours carry meaning:**
  - like and alerts: red `#EF4444`
  - confirmed, completed, online, up: green `#22C55E`
  - pending, upcoming: amber `#F59E0B`
  - cancelled, down: red
  - verified: blue `#3B82F6`
  - saved: yellow
  - decorative icons: neutral or yellow, never blue, green or red
- **Fonts:** Bebas Neue (uppercase headings and big numbers, key word in yellow); Inter for body text.
- **Photos:** only the theme backdrop photos (`StadiumArt`, `.photo` class) are black and white. Photos people upload (profile pictures, posts, listings) always keep their original colours. New theme photos must be free Unsplash photos (not Unsplash+) with dark or black backgrounds, added to `public/images/CREDITS.md`, and placed behind an existing card (`isolate` on the card, `<StadiumArt className="-z-10" />`) without moving anything.
- **Pills and buttons:** no yellow fills. Primary buttons and selected pills have a thin 1px yellow border with white text (`.btn-dark`, `.chip-active`, `.pill-selected`). On hover they fill solid yellow with black text; clicking darkens them slightly and presses them in (`active:scale-95`). Exception: the navbar active link is a small solid yellow pill with black text. Solid yellow stays only on the logo, the round + buttons, dots, progress bars and toggles.
- **Layout is fixed.** Change colours and fonts only. Don't move components or change the navbar or profile menu without asking first.

## Key decisions
- **No payments.** Everyone is on `plan: "free"`, and `canAccess()` decides what each user can use (`frontend/src/utils/access.js`, `Backend/utils/access.util.js`). Pro features are on a waitlist (`/pro`). Arena Points replace money as the reward.
- **Email:** Gmail SMTP through nodemailer. Sign-up only accepts Gmail addresses, confirmed with an emailed code. Moving to Brevo was mentioned but not decided.
- **Sidebar layout reverted (2026-10-26):** the user wants theme changes only.
- **Messages:** direct messages only between users who follow each other. The bell shows notifications only; messages have their own button.

## Working rules for Claude
- Never commit or push. After each change:
  - give the git commands and a **short** commit message;
  - check that no `.env` file gets staged.
- Work one step at a time. Finish a step, give the push commands, and wait for the user to say "next".
- After every change, update `progress.md` (an entry under today's date, plus "Where we are") and `feature.md` (feature rows and status).
- Answers should be short and plain: what changed, how it was checked, then the push commands.
- Don't repeat secrets or the user's email address.

## Next task
- **Not decided yet.** Ask the user. Open questions:
  - Switch email to Brevo, or stay on Gmail?
  - What were features #3, #6 and #7 from the original list?
  - Confirm or edit the end goal in `feature.md`.
