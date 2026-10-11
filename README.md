# Kate’s dance coaching website

A personal website for a ballroom dance coach, combining a compact marketing landing page with an online course library and a student learning dashboard.

**Current status:** a clickable, bilingual design prototype. The production framework and service providers have not been selected or installed. `RITMO` is a placeholder brand; the coach’s final branding, biography, photography, course content and prices still need to be supplied.

## Try the prototype

Open [`index.html`](./index.html) in a browser. It is a single, self-contained file with inline CSS, JavaScript and an embedded photograph. No installation, build or internet connection is required for the interface.

Alternatively, serve the repository locally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Use **Preview a lesson** to explore the dashboard immediately, or choose a program, dance and package to test enrollment. The **EN / UA** selector is available in the header and dialogs. English is the default; the selected language is remembered in the browser.

The prototype includes:

- Responsive black and red landing page, course catalog and expandable program list.
- Dance selection and three package options for each dance.
- Demo sign-in and enrollment forms, newsletter subscription and contact form.
- Student dashboard with lesson titles, descriptions, practice suggestions and notes.
- A silent, animated 30-second footwork placeholder with playback, seeking and speed controls; it is not a real instructional video.
- Lesson completion tracking and demo requests for private coaching sessions.
- English and Ukrainian copy, including forms, dialogs, accessibility labels and feedback messages.

Names, emails, notes, progress and requests are stored only in this browser’s `localStorage`. Nothing is sent to a coach or email provider. There is no real authentication, payment, protected video delivery or confirmed appointment. Do not use the prototype as a production account or order system. Demo data can be cleared through **About demo data** in the footer; the language preference is retained.

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

**Working recommendation: Next.js App Router with TypeScript**, because the intended product includes a public site and an interactive, authenticated student application with purchases, private videos, persistent progress and booking flows. The proposed stack and providers, with costs, are recorded in [docs/decisions/0001-stack-and-providers.md](./docs/decisions/0001-stack-and-providers.md) (awaiting approval).

| Option | Fit for this project | Considerations |
| --- | --- | --- |
| Astro | Strong option for a landing page and content-heavy catalog | Interactive islands and on-demand rendering can support a dashboard and authentication too; it is not limited to static sites |
| Next.js | Suggested option for the combined marketing site and student application | Provides a shared React application model for interactive UI and server-side workflows; keep public pages statically rendered where practical |

Both can be hosted on Vercel. Framework choice does not remove the need for a database, authentication, payments, email delivery, video hosting or a booking integration.

Relevant documentation: [Next.js App Router](https://nextjs.org/docs/app), [Next.js authentication](https://nextjs.org/docs/app/guides/authentication), [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/), [Astro authentication](https://docs.astro.build/en/guides/authentication/), [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Hosting and cost expectations

Vercel’s free Hobby plan is restricted to **non-commercial personal use**. Its commercial-use examples include advertising a product or service for sale, not just accepting payment on the site. Therefore the planned trainer business site and paid-course offering should budget for an eligible paid plan rather than assume free Vercel hosting. A genuinely non-commercial personal demo may qualify for Hobby, subject to its terms and usage limits.

See [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines). Hosting terms were checked on October 10, 2026 and should be checked again when deploying.

Domain registration, database/auth services, email, payment processing and video storage/delivery may introduce separate costs. Choose these services after requirements and the expected budget are confirmed. Do not put paid lesson videos into this public HTML file or rely on client-side hiding for access control; production playback should check enrollment on the server and use access-controlled video delivery.

This commit does not create a Vercel project or deploy a website. The current HTML can be served by a static host; no framework migration is needed merely to review the design.

## Suggested implementation plan

1. Confirm the coach’s brand and content, all curricula, commercial terms, locale requirements and hosting budget.
2. Decide Astro versus Next.js and select the required service providers. Record the decision in this README or an architecture decision document.
3. Preserve the current `index.html` as `prototype/ritmo.html` before scaffolding the chosen framework. Extract reusable layout, typography, colors, course cards, dialogs and translation dictionaries into maintainable components and data files.
4. Build localized public pages, then connect the newsletter and contact forms to real delivery with consent handling and validation.
5. Add authentication, database-backed student records, verified purchase entitlements and account recovery.
6. Integrate real course videos, lesson notes and progress; authorize access to both pages and video playback.
7. Add private-session requests or booking, enforce session allowances and give the coach a confirmation workflow.
8. Verify mobile/desktop layouts, keyboard access, translations, enrollment/payment behavior and access permissions before production launch.

Potential domain entities: `Program`, `DanceCourse`, `Lesson`, `Package`, `User`, `Enrollment`, `Order`, `LessonProgress`, `LessonNote` and `PrivateSession`. Keep program membership, lesson ordering and package session allowances explicit. Service providers, schema details and the coach’s administration workflow remain to be decided.

## Validation of the design baseline

The prototype was checked in Chrome for course/package selection, demo enrollment, playback controls, progress, notes, subscription and booking requests. Language checks covered the landing page, package dialogs, sign-in, enrollment, contact, dashboard and data dialog, including switching languages with filled forms and unsaved notes. English layouts were checked at widths of 360, 390, 768 and 1440 pixels.

These checks describe the design baseline. They are not a production test suite; framework implementation should add tests for real enrollment, authorization, payment webhooks, progress persistence and booking allowances.

## Assets and references

- Embedded ballroom photograph: [Unsplash source](https://unsplash.com/photos/POoF2Wv6ACU). Replace with the coach’s own approved imagery when available.
- Design research: [Kayla Itsines](https://kaylaitsines.com/about) for a personal coach presentation and [Alo Moves](https://www.alomoves.com/) for a course-library experience.
- The RITMO name, lesson descriptions and course artwork are prototype material. Final identity and copy need approval.
