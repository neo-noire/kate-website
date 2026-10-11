# 0001: Framework, hosting and service providers

- **Status:** Accepted by the owner on 2026-10-11, except the Stripe checkout mode (one open question below)
- **Date:** 2026-10-11
- **Prices and terms checked:** 2026-10-11, from each provider's own pricing or documentation page linked below. Re-check before signing up.

## Context

- Kate's business is registered and pays tax in **Canada**.
- The site **sells courses only**. Private sessions and their scheduling stay on a separate platform the business already uses; this site does not book or track them.
- The site is not public yet. Paid hosting starts when it begins taking payments.

## Decision

| Concern | Choice | Cost |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Free |
| Hosting | Vercel: Hobby while private, **Pro before taking payments** | $0, then $20/month |
| Database | Neon Postgres (Free plan), accessed with Drizzle ORM | $0 |
| Authentication | Better Auth (open-source library, users and sessions stored in Neon) | $0 |
| Payments | Stripe Checkout + webhooks (account the business already has) | Per sale only |
| Lesson video | Mux Video with signed playback | ≈ $0–3/month |
| Email (transactional and newsletter) | Resend Free | $0 |
| Content editing | Course data in the repo for v1; CMS decided later | $0 |

**Fixed cost once public: about $20–25/month plus a domain.** Stripe takes a percentage of each sale (see Payments).

### Open question: does the site still sell packages that include private lessons?

The prototype's Personal and Mentorship packages bundle video lessons with private lessons. The answer decides how Stripe is set up:

- **Video courses only:** use **Stripe Managed Payments** (recommended). Stripe becomes the legal seller and collects and files VAT/GST/sales tax worldwide.
- **Packages still include private lessons:** use **standard Stripe Checkout** (Kate is the seller) and handle tax registrations with an accountant, because Managed Payments excludes live 1-1 coaching.

## Why

### Framework: Next.js

The product is half marketing site and half logged-in application: purchases, entitlement checks before video playback, and progress and notes synced across devices. Next.js gives one React model for UI, server actions and route handlers, and public pages (landing, catalog, FAQ) stay statically rendered. Better Auth, Stripe, Mux Player and React Email all document Next.js as a first-class target. Astro was the alternative and remains fine for a pure marketing site, but most of the effort here sits in the logged-in half.

### Hosting: Vercel

[Vercel's Hobby plan is for personal, non-commercial use](https://vercel.com/pricing). A private preview that is not advertised or selling anything can stay on Hobby; move to **Pro ($20/month, includes $20 usage credit)** before the site is public or advertises courses for sale, which Vercel counts as commercial even before payments are switched on.

### Database: Neon over Supabase

Both are hosted, fully managed Postgres: the provider runs the servers, backups, upgrades and connection handling, and we connect with a URL.

- **[Neon](https://neon.com/pricing)** is a serverless Postgres. The Free plan gives 1 GB storage and 100 compute-hours per month per project; compute sleeps after 5 minutes idle and wakes on the next query (a short delay on the first request), and the project is never paused permanently. It has database branching (a copy of the database per preview deployment) and installs from the Vercel Marketplace with environment variables wired in. Paid usage is pay-as-you-go with no monthly minimum ($0.106 per compute-hour, $0.35 per GB-month), likely a few dollars a month for this site.
- **[Supabase](https://supabase.com/pricing)** is Postgres bundled with auth, file storage, realtime and an admin dashboard. Its Free plan **pauses a project after one week of inactivity**, so a live shop would need Pro at **$25/month** from launch. Its bundle mostly duplicates what we already chose (Better Auth for login, Mux for video).

Neon is cheaper for the same database and fits Vercel best. Supabase would be the better pick only if we wanted its table editor as the coach's admin screen. Because both are plain Postgres and Drizzle talks to either, switching later is a connection-string change plus a data export.

### Authentication: Better Auth

Free, open source, stores users and sessions in our own Postgres, and supports email + password, magic links, Google sign-in and password reset (sent through Resend). The Auth.js/NextAuth team [joined Better Auth in September 2025](https://www.better-auth.com/blog/authjs-joins-better-auth) and recommends it for new projects. Keeping users in our database makes "has this student bought this course?" a simple query. Clerk (hosted, prebuilt UI) was the alternative; it adds a vendor and keeps user records outside our database.

### Payments: Stripe

The business already uses Stripe in Canada. Checkout gives a hosted, localized payment page (cards, Apple Pay, Google Pay); a webhook marks the order paid and creates the enrollment.

[Canadian Stripe fees](https://stripe.com/en-ca/pricing): **2.9% + CA$0.30** per sale, **+0.8%** for cards issued outside Canada, **+2%** when currency conversion is needed.

**Tax is the reason to consider Managed Payments.** A Canadian business selling digital courses to consumers abroad can owe that country's VAT; for non-EU sellers the EU and UK generally apply this from the first sale, with no threshold. With a Ukrainian- and English-speaking audience, many buyers are likely in the EU. Options:

- **[Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments/how-it-works.md)** (merchant of record). Available to [Canadian businesses](https://docs.stripe.com/payments/managed-payments/eligibility.md) selling "online courses and training". Stripe calculates, collects, files and remits VAT/GST/sales tax in 80+ countries and handles fraud, disputes and payment support. It costs **3.5% per sale on top of the normal fees**. Customers see the purchase as "Sold through Link", get receipts from Link, and the statement reads `LINK.COM* <descriptor>`. It does not cover products involving "human intervention (such as live 1-1 coaching)".
- **Standard Stripe + Stripe Tax** (0.5% per transaction where registered). Cheaper per sale, but Kate must register and file in each place where tax is owed. Stripe Tax only calculates and reports; filing is still Kate's.

Example on a CA$89 course bought with a foreign card that needs currency conversion: standard ≈ 5.7% + CA$0.30 ≈ CA$5.37; with Managed Payments ≈ 9.2% + CA$0.30 ≈ CA$8.49. The difference (≈ CA$3) is what it costs to not run foreign tax registrations. An accountant should confirm Kate's obligations; this is not tax advice.

### Lesson video: Mux (not raw object storage)

Paid lessons must not be playable by anyone who has the URL. [Mux](https://www.mux.com/pricing.md) converts each upload into adaptive streaming (quality adjusts to the viewer's connection, fast start on phones), generates thumbnails, and supports signed playback: the server checks enrollment and issues a short-lived token for that lesson only. Mux Player has speed controls, matching the prototype. List prices: 1080p encoding free, storage $0.003 per minute per month, first 100,000 delivery minutes per month free. Around 100 ten-minute lessons is about $3/month; 100 students watching 20 lessons each is about 20,000 minutes, inside the free delivery. The Free plan stores only 10 videos, so we use pay-as-you-go.

**Why not Cloudflare R2 or another object store on its own.** [R2](https://developers.cloudflare.com/r2/pricing/) is cheap storage ($0.015/GB-month, 10 GB free, no egress fees), but it only stores and serves files. Serving lessons from it means one fixed-quality MP4 per lesson: a 1080p file stalls on a weak mobile connection, there are no automatic thumbnails or quality levels, and a presigned link can be shared or downloaded until it expires. Adding transcoding ourselves (ffmpeg pipelines, HLS packaging) is real engineering for a saving of about $2/month at this library size. R2 is still a good place for the original master files as a backup, independent of Mux, if we want one.

If we prefer to stay on Cloudflare, Cloudflare Stream (Cloudflare's transcoding product, separate from R2) is the comparable option. Bunny Stream is the low-cost EU-hosted alternative.

### Email: Resend

[Resend Free](https://resend.com/pricing) covers transactional email (sign-in links, password resets, purchase confirmations) up to 3,000 emails/month and 100/day, and newsletter broadcasts to up to 1,000 contacts. Next tiers: transactional Pro $20/month (50,000 emails); marketing $40/month for 5,000 contacts. Templates are React components in the codebase, so English and Ukrainian share one system. Newsletter sign-up needs explicit consent and an unsubscribe link (Canada's CASL and the EU's GDPR both require consent).

### Private sessions: out of scope

The site does not schedule private sessions; that stays on the business's existing platform. If a course purchase should include private lessons, the site can at most show a link to that platform after purchase.

### Content editing

For v1 the catalog (programs, dances, lessons, prices, translations) lives as typed data files in the repository, and lesson video IDs come from Mux. A CMS (for example Sanity, or Keystatic, which edits files in the repo) is a separate decision once the catalog must be edited without a developer.

## Cost summary

| Stage | Fixed monthly | Per sale |
| --- | --- | --- |
| Private preview | $0 (Vercel Hobby, free tiers) | None |
| Public, selling | ≈ $20–25 (Vercel Pro, Mux storage) + domain | 2.9% + CA$0.30, +0.8% foreign card, +2% conversion; +3.5% with Managed Payments |
| Growing (1,000+ newsletter contacts) | ≈ $65–85 (adds Resend marketing $40, Neon usage, more Mux) | Same |

## Consequences

- The next step ("Port the prototype to a real app") scaffolds Next.js App Router + TypeScript on Vercel with `/en` and `/uk` locale routes.
- Accounts needed: Vercel, Neon, Mux, Resend, a domain with DNS access for email, and the existing Stripe account (Managed Payments needs an eligibility review on that account).
- Order fulfilment and video access are enforced on the server; nothing paid ships in client code.
- Remove the prototype's booking and session-allowance features from the production scope.
