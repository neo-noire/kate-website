# Kate’s dance coaching website

A personal website for a ballroom dance coach, combining a compact marketing landing page with an online course library and a student learning dashboard.

**Current status:** a Next.js App Router + TypeScript app that reproduces the bilingual design prototype with static data, plus real accounts (email and password, Google once its keys are added) stored in Neon Postgres. There is still no payment, email or video delivery; course enrollments, progress and notes are demo data in the browser. `RITMO` is a placeholder brand; the coach’s final branding, biography, photography, course content and prices still need to be supplied.

## Run the app

Requires Node.js 20.9 or later and a Postgres database for accounts.

```sh
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate           # creates the auth tables
npm run dev        # http://localhost:3000 (redirects to /en or /uk)
npm run lint
npm run typecheck
npm run build      # production build; public pages are prerendered for both locales
```

Routes:

| Route | What it is |
| --- | --- |
| `/en`, `/uk` | Landing page: hero, program catalog with filters, approach, newsletter, FAQ |
| `/{lang}/programs/{program}` and `/{lang}/programs/{program}/{dance}` | Dance tabs and the three packages for one dance, with demo enrollment |
| `/{lang}/sign-in`, `/{lang}/sign-up` | Account pages (email and password; a Google button appears once Google keys are configured) |
| `/{lang}/dashboard` | Student dashboard: lessons, placeholder player, progress and notes. Signed-out visitors are redirected to sign in |
| `/api/auth/*` | Better Auth endpoints |

`/` and any path without a language prefix redirect to the visitor’s language (a saved choice in the `NEXT_LOCALE` cookie first, then the browser’s `Accept-Language`, else English).

Code layout:

- `src/content/catalog.ts`: programs, dances, packages and lessons with stable, untranslated IDs.
- `messages/{en,uk}.json`: all copy, in ICU message format, loaded with [next-intl](https://next-intl.dev). Plurals use ICU (`{count, plural, one {# урок} few {# уроки} many {# уроків} other {…}}`) and prices use the shared `eur` number format.
- `src/i18n/`: next-intl routing, request config and locale-aware `Link`/`useRouter`. `npm run typecheck` fails if a locale’s messages are missing or have extra keys compared with English, and message keys used in code are type-checked.
- `src/app/[lang]/`: routes; the root layout sits under `[lang]` so `<html lang>`, metadata and `hreflang` links are per locale.
- `src/lib/auth/`: [Better Auth](https://better-auth.com) server config, React client and the safe post-sign-in redirect. `src/proxy.ts` redirects signed-out visitors away from the dashboard; the dashboard page checks the session again on the server.
- `src/db/`: Drizzle schema and client (`pg` driver). Migrations live in `drizzle/`; `npm run db:generate` creates one from schema changes and `npm run build` applies pending ones before building (on Vercel the build fails if the database is not connected).
- `src/lib/demo-store.ts`: the prototype-only `localStorage` store (key `ritmo-demo-v2`) for enrollments, progress and notes. Replace with database-backed records when payments arrive.
- `src/app/globals.css`: the prototype’s stylesheet, ported with its class names intact. Form fields are at least 16px so iOS Safari does not zoom in on focus.
- Icons come from [Lucide](https://lucide.dev) (`lucide-react`), not Unicode symbols, which iOS renders as emoji.

### Adding a language

1. Add its code to `locales` and a picker label to `localeLabels` in `src/i18n/routing.ts`.
2. Copy `messages/en.json` to `messages/<code>.json` and translate it.
3. Add the new file to the key check in `src/i18n/messages-shape.ts`, then run `npm run typecheck`.

Pages for the new locale are prerendered automatically, and redirects, `hreflang` links and the language picker pick it up from the routing config.

Accounts are real: passwords are hashed by Better Auth and sessions are stored in Postgres. Enrollments, progress, notes and requests are still stored only in this browser’s `localStorage`. Nothing is sent to a coach or email provider. Demo data can be cleared through **About demo data** in the footer.

### Accounts and environment variables

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Added by the Vercel Neon integration (pooled for the app, direct for migrations) |
| `BETTER_AUTH_SECRET` | A random secret, set in Vercel for production and preview |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. From a Google Cloud OAuth client; the Google button appears after the next deploy |
| `ADMIN_EMAILS` | Comma-separated emails of the accounts that can manage courses, e.g. `kate@example.com,me@example.com` |

For Google, create an OAuth client of type *Web application* and add the redirect URI `https://<site host>/api/auth/callback/google` for each host people sign in on (for now `https://katematus-website.vercel.app`). Signing in with Google links to an existing email-and-password account with the same address.

Password reset and email verification need an email provider (Resend) and are not set up yet ([#6](https://github.com/neo-noire/kate-website/issues/6)).

### Courses and admin

The catalog lives in the database. A **program** (e.g. Beginner 1.0) holds one **course** per dance, each with its **lessons**, and has **pricing tiers** (e.g. Solo, Personal, Mentorship). A student buys one course at one tier.

Admins (the `ADMIN_EMAILS` accounts) manage it at `/en/admin`, linked from their dashboard as "Manage courses": edit text in each language, set prices, paste YouTube links for lessons, mark free previews, publish programs and give students access by email. Until Stripe checkout exists, giving access there is how a student gets a course.

- Lesson videos are YouTube embeds (use unlisted videos). A paid lesson's video id is sent only when its owner presses play, but anyone holding an unlisted link can still watch it.
- The first time a student plays a paid lesson of a course is saved on their purchase and shown on the admin page; refunds are only possible before then (free previews don't count).
- Access lasts 3 months from purchase (`ACCESS_MONTHS` in `src/lib/catalog/access.ts`). Expired courses leave the student's dashboard, and giving access again renews it.
- Text a student reads is stored per language; English is required and other languages fall back to it.
- Public pages are cached and refreshed as soon as an admin saves a change.
- The first migrations seed the prototype's programs, tiers and lesson outlines (no videos) so the site isn't empty.

### Legal pages

`/terms`, `/privacy` and `/refunds` (in every language) are linked from the footer, and sign-up links to the first two. The texts live in `src/content/legal/` (`en.ts`, `uk.ts`; a language without a translation shows English). The terms follow Ontario law; the legal business name and contact email in `src/content/legal/business.ts` are placeholders until Kate confirms them. Each page shows a draft notice until `reviewed` is set to `true` there, after the texts have been checked by someone qualified. Bump `lastUpdated` whenever a text changes.

## The original prototype

[`prototype/ritmo.html`](./prototype/ritmo.html) is the original single-file prototype, kept for reference. Open it directly in a browser; it needs no build or network. The app above reproduces it, with these deliberate differences:

- Package selection is a page per program and dance instead of a dialog, so each is linkable and indexable.
- Switching language loads the other locale’s URL; half-filled forms and unsaved lesson notes are not kept.
- The demo player is replaced by real YouTube lessons, and the catalog comes from the database instead of fixed program data.
- The language picker lives in the header only, not inside dialogs.
- The private-lesson request flow is removed. The site sells courses only; private sessions included in a package are booked on a separate platform. The "Let's plan your first step" button still opens a contact form.

## Product goal and audience

Help prospective students understand the coach’s approach, find a suitable course and choose the amount of personal support they want. After enrolling, students should be able to access their purchased lessons, track their progress and arrange any private sessions included in their package.

The public experience should stay compact: a landing page with the coach’s introduction, program overview, calls to action, newsletter/contact form and concise FAQ. Detailed course selection and the authenticated learning experience can live on separate routes.

## Course structure

The hierarchy is **program → dance/course → four video lessons**. A package is selected for a specific dance/course, not automatically for the entire program.

| Program | Dances / courses | Lessons per dance | Total lessons | Status |
| --- | --- | --- | --- | --- |
| Intro to Latin 1.0 | Cha-cha-cha, Samba, Rumba | 4 | 12 | Confirmed structure |
| Intro to Latin 2.0 | 3 dances; exact selection to confirm | 4 | 12 | Prototype reuses the Intro 1.0 dances provisionally |
| Beginner 1.0 | 5 dances; exact selection to confirm | 4 | 20 | Prototype uses Cha-cha-cha, Samba, Rumba, Paso doble and Jive |
| Beginner 2.0, 3.0, 4.0 and later levels | 5 dances per level; curriculum to confirm | 4 | 20 per level | Planned progression; prototype examples only |
| Salsa | Scope to confirm | 4 in the prototype | 4 in the prototype | Illustrative additional offering |

The working interpretation of Beginner is **five dances with four lessons each**, rather than five lessons total. Confirm this before building the production catalog.

Completing a program means completing every lesson in every constituent dance. Purchasing or completing one dance does not unlock or complete the whole program. Whole-program bundles and level prerequisites have not been decided.

### Packages for each dance

| Package | Includes | Prototype price |
| --- | --- | --- |
| Solo | Four video lessons | €39 |
| Personal | Four video lessons + one private lesson | €89 |
| Mentorship | Four video lessons + four private lessons | €219 |

Package names, euro prices and the 50-minute private-session duration are design examples, not confirmed commercial terms. Currency, pricing, access duration, refunds and package upgrades must be agreed before launch.

## Planned production experience

1. **Discover:** learn about the coach, browse programs, compare dances and packages, subscribe or ask a question.
2. **Enroll:** select a dance and package, create/sign into an account, complete a real checkout and receive course access after verified payment.
3. **Learn:** view purchased courses, select a lesson, watch its video, read its description and practice guidance, save notes and track completion across devices.
4. **Get support:** request or book a private session using the purchased package’s allowance; display pending, confirmed, cancelled and completed session states.
5. **Manage content:** give the coach a practical way to maintain course descriptions, lesson videos, pricing and availability. The editor/CMS approach remains open.

English and Ukrainian should cover the entire experience. Keep stable program, dance, lesson and package IDs separate from translated labels. Preserve user-authored notes, progress and in-progress forms when switching language. For production public pages, consider locale routes such as `/en` and `/uk`, translated metadata and `hreflang` links.

## Framework direction

**Working recommendation: Next.js App Router with TypeScript**, because the intended product includes a public site and an interactive, authenticated student application with purchases, private videos, persistent progress and booking flows. The proposed stack and providers, with costs, are recorded in [docs/decisions/0001-stack-and-providers.md](./docs/decisions/0001-stack-and-providers.md) (accepted 2026-10-11).

| Option | Fit for this project | Considerations |
| --- | --- | --- |
| Astro | Strong option for a landing page and content-heavy catalog | Interactive islands and on-demand rendering can support a dashboard and authentication too; it is not limited to static sites |
| Next.js | Suggested option for the combined marketing site and student application | Provides a shared React application model for interactive UI and server-side workflows; keep public pages statically rendered where practical |

Both can be hosted on Vercel. Framework choice does not remove the need for a database, authentication, payments, email delivery, video hosting or a booking integration.

Relevant documentation: [Next.js App Router](https://nextjs.org/docs/app), [Next.js authentication](https://nextjs.org/docs/app/guides/authentication), [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/), [Astro authentication](https://docs.astro.build/en/guides/authentication/), [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Hosting and cost expectations

Vercel’s free Hobby plan is restricted to **non-commercial personal use**. Its commercial-use examples include advertising a product or service for sale, not just accepting payment on the site. Therefore the planned trainer business site and paid-course offering should budget for an eligible paid plan rather than assume free Vercel hosting. A genuinely non-commercial personal demo may qualify for Hobby, subject to its terms and usage limits.

See [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines). Hosting terms were checked on October 10, 2026 and should be checked again when deploying.

Domain registration, database/auth services, email, payment processing and video storage/delivery may introduce separate costs. Choose these services after requirements and the expected budget are confirmed. Do not put paid lesson videos into public pages or rely on client-side hiding for access control; production playback should check enrollment on the server and use access-controlled video delivery.

The repository is connected to a Vercel project: every push to `main` deploys production and other branches get preview deployments.

## Suggested implementation plan

1. Confirm the coach’s brand and content, all curricula, commercial terms, locale requirements and hosting budget.
2. Decide Astro versus Next.js and select the required service providers. Record the decision in this README or an architecture decision document.
3. ~~Preserve the prototype as `prototype/ritmo.html` and scaffold the framework with components, static data and translation dictionaries.~~ Done.
4. Build localized public pages, then connect the newsletter and contact forms to real delivery with consent handling and validation.
5. Add authentication, database-backed student records, verified purchase entitlements and account recovery.
6. Integrate real course videos, lesson notes and progress; authorize access to both pages and video playback.
7. ~~Add private-session booking.~~ Dropped: the site sells courses only, and private sessions are booked on a separate platform.
8. Verify mobile/desktop layouts, keyboard access, translations, enrollment/payment behavior and access permissions before production launch.

Potential domain entities: `Program`, `DanceCourse`, `Lesson`, `Package`, `User`, `Enrollment`, `Order`, `LessonProgress`, `LessonNote` and `PrivateSession`. Keep program membership, lesson ordering and package session allowances explicit. Service providers, schema details and the coach’s administration workflow remain to be decided.

## Validation of the design baseline

The prototype was checked in Chrome for course/package selection, demo enrollment, playback controls, progress, notes, subscription and booking requests. Language checks covered the landing page, package dialogs, sign-in, enrollment, contact, dashboard and data dialog, including switching languages with filled forms and unsaved notes. English layouts were checked at widths of 360, 390, 768 and 1440 pixels.

These checks describe the design baseline. They are not a production test suite; framework implementation should add tests for real enrollment, authorization, payment webhooks, progress persistence and booking allowances.

## Assets and references

- Embedded ballroom photograph: [Unsplash source](https://unsplash.com/photos/POoF2Wv6ACU). Replace with the coach’s own approved imagery when available.
- Design research: [Kayla Itsines](https://kaylaitsines.com/about) for a personal coach presentation and [Alo Moves](https://www.alomoves.com/) for a course-library experience.
- The RITMO name, lesson descriptions and course artwork are prototype material. Final identity and copy need approval.
