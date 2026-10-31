# ArenaX features

What the app can do today, where each feature lives in the code, and what is planned.
Updated after every change. Daily log: [progress.md](progress.md).

**Live:** frontend https://arenax-frontend.onrender.com · backend https://arenax-server-v75s.onrender.com

**Stack:**
- Backend: Express 5, Mongoose 9 (MongoDB), Socket.io, Gemini (AI coach), ImageKit (photos), Gmail SMTP (email codes).
- Frontend: React 19, Vite, Tailwind CSS v4, lucide-react icons.

## End goal

> Draft from what has been built so far. Edit this to match your vision.

ArenaX is one place for grassroots sport in India, where:
- **athletes** find and book the right coach, track how they improve (Athlete DNA), build a portfolio verified by their coaches, and enter tournaments;
- **coaches** get discovered, run their sessions and calendar, and see stats on their athletes;
- **brands** find verified, career-ready athletes to sponsor.

For now the app is free. There are no payments; Pro features are on a waitlist.

## Roles

| Role | Who | Signs in at |
|---|---|---|
| Athlete (`learner`) | players looking for coaching | `/login`, `/register` |
| Coach (`coach`) | coaches offering sessions | `/login`, `/register` |
| Brand | sponsors looking for talent | `/brand/login` |
| Admin (`admin`) | ArenaX team | `/login` → `/admin` |

## Features

Status: ✅ done · 🟡 partly done · ⏳ planned

### Accounts and sign-in
| Feature | Status | Where |
|---|---|---|
| Email sign-up (Gmail only) with an emailed confirmation code, show/hide password | ✅ | `auth.controller.js`, `emailCode.*`, `pages/Register.jsx`, `VerifyEmailStep.jsx` |
| Continue with Google (sign-in and sign-up, with a role picker) | ✅ | `useGoogleAuth.js`, `GoogleSignInButton.jsx`, `GoogleRolePicker.jsx` |
| "Joining as" Learner / Coach / Brand | ✅ | `JoinAsPicker.jsx` |
| Private accounts with follow requests | ✅ | `follow.model.js` (pending/accepted), `useFollowRequests.js` |
| Delete account (removes everything linked to it) | ✅ | `accountDeletion.util.js`, `pages/Settings.jsx` |
| Privacy Policy and Terms pages | ✅ | `pages/Privacy.jsx`, `pages/Terms.jsx` |
| Admin dashboard (list and delete users) | ✅ | `pages/AdminDashboard.jsx`, `user.routes.js` |

### Social feed
| Feature | Status | Where |
|---|---|---|
| Home feed: For you / Following / Coaches tabs, Latest sort | ✅ | `pages/Feed.jsx`, `post.controller.js` |
| Posts with up to 4 photos, location, hashtags | ✅ | `pages/NewPost.jsx`, `CreatePost.jsx`, `ImageCarousel.jsx` |
| Like, comment, reply to comments, save, share | ✅ | `PostCard.jsx`, `CommentsPanel.jsx`, `pages/SavedPosts.jsx` |
| Follow users; follower/following lists | ✅ | `follow.controller.js`, `FollowButton.jsx`, `FollowListModal.jsx` |
| Notifications bell | ✅ | `NotificationBell.jsx` |

### Coaching
| Feature | Status | Where |
|---|---|---|
| Discover coaches: search by sport, city and level; sort; filters | ✅ | `pages/Discover.jsx`, `CoachCard.jsx` |
| Coach profile card with slot booking | ✅ | `CoachProfileCard.jsx`, `SlotPicker.jsx`, `slots.util.js` |
| Bookings: request, confirm, cancel, reschedule, complete, rate | ✅ | `booking.controller.js`, `components/calendar/` |
| Calendar with real session dates and Add to Google Calendar (feature #4) | ✅ | `pages/Calendar.jsx` |
| Chat for confirmed bookings (real time, Socket.io) | ✅ | `pages/Chat.jsx`, `message.*`, `socket.js` |
| My Athletes (coach view) | ✅ | `pages/MyAthletes.jsx` |
| Coach stats: rating, endorsements, achievements, completion rate | ✅ | `analytics.controller.js`, `StatsPanel.jsx` |
| Verified coaches (badge) | ✅ | `coachVerification.util.js`, `VerifiedBadge.jsx` |

### Athlete development
| Feature | Status | Where |
|---|---|---|
| Athlete DNA: 6 skills vs goal, career readiness, plan, progress chart (feature #1) | ✅ | `dna.util.js`, `dna.controller.js`, `pages/AthleteDna.jsx`, `components/dna/` |
| Coach matching from DNA gaps (feature #2) | ✅ | `match.util.js`, `MatchCard.jsx`, `MatchBadge.jsx` |
| Drill library with levels (beginner → advanced) | ✅ | `utils/drills.js`, `DrillLibrary.jsx` |
| Portfolio of achievements with coach verification (feature #5) | ✅ | `achievement.*`, `components/portfolio/` |
| AI coach chat (Gemini, rate-limited) (feature #8) | ✅ | `ai.controller.js`, `pages/AiAssistant.jsx`, `AiAssistantButton.jsx` |
| Features #3, #6, #7 from the original feature list | ❓ | Not recorded in the repo. Tell me what they are and I'll add them here. |

### Community and engagement
| Feature | Status | Where |
|---|---|---|
| Direct messages between users who follow each other | ✅ | `directMessage.*`, `pages/Messages.jsx`, `pages/DirectChat.jsx` |
| Messages button with a people-count badge | ✅ | `MessagesButton.jsx`, `useInbox.js` |
| Arena Points: daily check-in streak, points for sessions, posts and referrals | ✅ | `points.util.js`, `pointsLog.model.js`, `PointsCard.jsx`, `DailyCheckIn.jsx` |
| Invite friends (referral link) | ✅ | `utils/invite.js` |
| Founding Member badge | ✅ | `FoundingBadge.jsx` |
| Tournaments: list, register a team | ✅ | `tournament.*`, `team.model.js`, `pages/Tournament.jsx` |
| Gear marketplace: list an item, contact the seller (no payments) | ✅ | `listing.*`, `pages/MarketPlace.jsx` |

### Brands
| Feature | Status | Where |
|---|---|---|
| Brand login and dashboard: talent search (DNA readiness ≥ 70) | ✅ | `brand.*`, `pages/BrandDashboard.jsx` |
| Deals: brands send offers (a message, no money) to coaches and athletes; they accept or decline under "Brand deals" | ✅ | `deal.*`, `pages/MyDeals.jsx` |
| Brand sees the status of offers it sent (Sent offers tab) | ✅ | `GET /api/deals/sent`, `pages/BrandDashboard.jsx` |
| Chat between brand and talent after an offer is accepted | ⏳ | planned |
| Athlete spotlight on Discover | ✅ | `spotlight.*`, `pages/Discover.jsx` |

### Pro (no payments yet)
| Feature | Status | Where |
|---|---|---|
| Pro waitlist page ("coming soon") | ✅ | `pages/ProComingSoon.jsx`, `waitlist.*` |
| Feature gates (`plan: "free"` + `canAccess`) | ✅ | `utils/access.js` (frontend), `access.util.js` with `requireAccess` (backend), `ProGate.jsx` |
| Video technique analysis, deeper DNA insights, priority booking | ⏳ | listed on the Pro page |

### Look and feel
| Feature | Status | Where |
|---|---|---|
| Black + yellow theme, Bebas Neue headings, Inter body text, black-and-white theme backdrops (uploaded photos keep their colours) | ✅ | `index.css` (`@theme` tokens), `index.html` |
| Colours by meaning: like red, verified blue, statuses amber/green/red | ✅ | `index.css`, `utils/sessions.js` |
| Dark sports photos behind existing cards (auth banner, Discover hero and promo, feed profile card, upcoming session cards, tournament cards by sport) | ✅ | `StadiumArt.jsx`, `public/images/` (credits in `CREDITS.md`) |
| Home feed hero banner ("Build a stronger you", Explore coaches) | ✅ | `FeedHero.jsx`, `pages/Feed.jsx` |
| Phone layout: bottom tab bar, no sideways scrolling | ✅ | `MobileTabBar.jsx` |
| In-app popups and toasts (no browser alerts) | ✅ | `DialogHost.jsx`, `utils/dialogs.js` |
| Profile photo crop and zoom before upload | ✅ | `PhotoCropper.jsx` |

## Folder structure

```
ArenaX/
├── Backend/                 Express API (server.js mounts every /api/* route)
│   ├── config/              ImageKit setup
│   ├── controllers/         one file per area (auth, booking, post, dna, ai, ...)
│   ├── middlewares/         auth (protect, optionalProtect), admin, upload
│   ├── models/              Mongoose models (user, booking, post, follow, ...)
│   ├── routes/              *.routes.js, mounted under /api
│   ├── scripts/             demo data: seed / clear (npm run seed:demo, clear:demo)
│   └── utils/               business logic (dna, match, points, slots, email, ...)
├── frontend/                React app (Vite)
│   ├── public/images/       theme photos (credits in CREDITS.md)
│   └── src/
│       ├── pages/           one file per route
│       ├── components/      shared UI (+ calendar/, dna/, portfolio/)
│       ├── hooks/           data hooks (useInbox, usePoints, useSharedResource, ...)
│       ├── context/         AuthContext, BrandAuthContext
│       ├── utils/           helpers (access, format, sessions, tones, ...)
│       ├── api/             axios client
│       └── index.css        theme tokens and component classes
├── session.md               start here in a new session
├── feature.md               this file
└── progress.md              daily progress log
```
