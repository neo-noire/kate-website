# 0001: Framework, hosting and service providers

- **Status:** Proposed (awaiting owner approval; one open question below)
- **Date:** 2026-10-11
- **Prices and terms checked:** 2026-10-11, from each provider's own pricing or documentation page linked below. Re-check before signing up.

## Decision

| Concern | Choice | Fixed cost at launch |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Free |
| Hosting | Vercel Pro | $20/month |
| Database | Neon Postgres (Free plan), accessed with Drizzle ORM | $0 |
| Authentication | Better Auth (open-source library, sessions stored in Neon) | $0 |
| Payments | Stripe Checkout + webhooks, Stripe Tax when VAT registration is needed | Per sale only |
| Lesson video | Mux Video with signed playback | ≈ $0–3/month |
| Email (transactional and newsletter) | Resend Free | $0 |
| Private-session booking | Built into the app (request → coach confirms), no external tool in v1 | $0 |
| Content editing | Course data in the repo for v1; CMS decided later | $0 |

**Expected fixed cost at launch: about $20–25/month plus a domain (≈ €10–15/year).** Stripe takes a percentage of each sale (see Payments).

### Open question that can change the payments choice

**Where is Kate's business registered?** Stripe accepts businesses in the EU, UK, Switzerland, Norway, the US and others, but [not Ukraine](https://stripe.com/global). The prototype prices in euros, so this record assumes an EU-registered business (for example a sole trader in Poland or Germany). If the business is a Ukrainian FOP, Stripe is unavailable and payments need a Ukrainian acquirer instead (for example WayForPay or LiqPay; not yet evaluated). The rest of the stack is unaffected.

## Why

### Framework: Next.js over Astro

The product is half marketing site and half logged-in application: purchases, entitlement checks before video playback, progress and notes synced across devices, booking requests with allowances, and a coach-facing confirmation view. Astro can do all of this with server rendering and islands, but most of the effort would sit in the interactive, authenticated half, where Next.js gives one React model for UI, server actions and route handlers. Public pages (landing, catalog, FAQ) stay statically rendered in Next.js, so the Astro performance advantage for marketing pages is mostly preserved. The libraries chosen below (Better Auth, Stripe, Mux Player, Resend's React Email) all document Next.js as a first-class target.

Astro remains a reasonable choice if the scope shrinks to a marketing site that links out to a hosted course platform.

### Hosting: Vercel Pro

The site advertises and sells Kate's services, so it is commercial, and Vercel's [Hobby plan is for personal, non-commercial use](https://vercel.com/pricing). [Vercel Pro](https://vercel.com/pricing) is $20/month for one developer seat and includes $20 of usage credit, which a site of this size is unlikely to exceed.

Considered: **Cloudflare Workers** ([$5/month paid plan](https://developers.cloudflare.com/workers/platform/pricing/), generous free tier) running Next.js through the OpenNext adapter. It is cheaper, but adapter quirks would cost more development time than the $15/month saved. Revisit if hosting cost becomes a concern.

### Database: Neon

Postgres fits the relational model in the README (Program, DanceCourse, Lesson, Package, Enrollment, Order, LessonProgress, LessonNote, PrivateSession). [Neon Free](https://neon.com/pricing) gives 1 GB storage and 100 compute-hours per month per project and scales to zero after 5 minutes idle; it does not pause the project permanently. When traffic grows, the Launch plan is pay-as-you-go with no monthly minimum ($0.106 per compute-hour, $0.35 per GB-month), likely a few dollars a month for this site. It installs from the Vercel Marketplace with environment variables wired in.

Considered: **Supabase** (Postgres + auth + storage in one). Its [Free plan pauses a project after one week of inactivity](https://supabase.com/pricing), which is unacceptable for a live shop, so production would need Pro at $25/month from day one. It becomes the better choice only if we want its admin UI and row-level security as the main access-control mechanism.

### Authentication: Better Auth

Free, open source, stores users and sessions in our own Postgres, and supports email + password, magic links, Google sign-in and password reset (sent through Resend). The Auth.js/NextAuth team [joined Better Auth in September 2025](https://www.better-auth.com/blog/authjs-joins-better-auth) and recommends it for new projects. Keeping users in our database makes entitlement checks a simple join with no third-party round trip.

Considered: **Clerk** (hosted, fastest to set up, prebuilt UI) adds a vendor and per-user pricing at scale and puts user records outside our database. **Supabase Auth** only makes sense together with Supabase as the database.

### Payments: Stripe Checkout (Kate as merchant)

Stripe Checkout gives a hosted, localized payment page (cards, Apple Pay, Google Pay); a webhook marks the order paid and creates the enrollment. Fees on an [Irish account](https://stripe.com/ie/pricing), similar elsewhere in the EU: **1.5% + €0.25** for standard EEA cards, 2.5% + €0.25 for UK cards, 3.15% + €0.25 for other international cards. On an €89 package with an EEA card that is about €1.59.

**VAT:** selling to consumers in other EU countries, Kate may need to charge their VAT once cross-border sales pass the EU threshold, through the OSS scheme. Stripe Tax handles calculation for 0.5% per transaction where registered. An accountant should confirm Kate's obligations; this is not legal or tax advice.

**Why not a merchant of record** (a provider that becomes the legal seller and handles VAT for you): the Personal and Mentorship packages include live private lessons, and both main options exclude human-delivered services.

- [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments/eligibility.md) supports online courses but states that a product involving "human intervention (such as live 1-1 coaching)" does not qualify.
- [Paddle](https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle) prohibits "human services that are not related to a software offering", naming coaching.

Splitting video-only sales onto a merchant of record and private lessons onto Stripe would mean two checkouts and two sets of webhooks for little gain at this scale.

### Lesson video: Mux

Paid lessons must not be playable by anyone with the URL. [Mux](https://www.mux.com/pricing.md) supports signed playback: the server checks the student's enrollment and issues a short-lived token for that lesson only. Its Mux Player component works in Next.js with speed controls, matching the prototype. Costs at list price: 1080p encoding free, storage $0.003 per minute per month, first 100,000 delivery minutes per month free. A library of ~100 ten-minute lessons is about $3/month in storage, and 100 students watching 20 lessons each is about 20,000 minutes, well inside the free delivery. The Free plan stores only 10 videos, so we will use pay-as-you-go.

Considered: **Bunny Stream** ([pricing](https://bunny.net/docs/stream/pricing)), roughly $0.01/GB storage and $0.01/GB delivery in Europe with storage in Frankfurt, likely cheaper at scale and EU-hosted. It is a sound fallback; Mux wins on signed-playback developer experience. **Vimeo** and **YouTube unlisted** do not give per-student access control we can enforce server-side.

### Email: Resend

[Resend Free](https://resend.com/pricing) covers transactional email (sign-in links, password resets, purchase receipts, booking confirmations) up to 3,000 emails/month and 100/day, and marketing broadcasts to up to 1,000 newsletter contacts. Paid tiers when needed: transactional Pro $20/month (50,000 emails); marketing $40/month for 5,000 contacts. Templates are written as React components in the same codebase, so both languages share one system. Newsletter sign-up needs explicit consent and an unsubscribe link (GDPR).

If Kate wants to write newsletters in a visual editor without developer help, a dedicated newsletter tool (MailerLite, Brevo) can replace the marketing half later; the sign-up form would post there instead.

### Booking: built in

Session allowances (1 private lesson in Personal, 4 in Mentorship) must be enforced against purchases, which an external scheduler cannot do on its own. v1 keeps the prototype's flow: the student requests a time, the app checks the remaining allowance, Kate confirms or proposes another time from a simple coach page, and both receive an email. Statuses follow the README: pending, confirmed, cancelled, completed.

Considered: **Cal.com** ([Free for individuals](https://cal.com/pricing), with calendar sync). Worth adding later for Kate's availability and calendar invites, linked from the app after the allowance check. Calendly has similar trade-offs and is not needed for v1.

### Content editing

For v1 the catalog (programs, dances, lessons, packages, translations) lives as typed data files in the repository, and lesson video IDs come from Mux. This keeps the build simple while the curriculum is still being confirmed. A CMS (for example Sanity, or Keystatic, which edits files in the repo) is a separate decision once Kate needs to edit content without a developer.

## Cost summary

| Stage | Fixed monthly | Per sale |
| --- | --- | --- |
| Launch (low traffic) | ≈ $20–25 (Vercel Pro, Mux storage) + domain | Stripe 1.5% + €0.25 (EEA cards), +0.5% if Stripe Tax is used |
| Growing (≈ 1,000+ newsletter contacts, steady sales) | ≈ $70–90 (adds Resend marketing $40, Neon Launch usage, more Mux) | Same |

## Consequences

- The next step ("Port the prototype to a real app") scaffolds Next.js App Router + TypeScript, deploys to Vercel Pro, and uses `/en` and `/uk` locale routes.
- Accounts needed before payments go live: Vercel (Pro), Neon, Stripe (in Kate's business name and country), Mux, Resend, a domain with DNS access for email sending.
- Video access, order fulfilment and session allowances are enforced on the server; nothing paid is shipped in client code.
- If Kate's business turns out to be Ukrainian, only the payments section changes.
