# MediQueue

MediQueue is a modern outpatient queue management system designed to reduce physical waiting room congestion and improve patient flow.

It provides:

- a patient-facing check-in and live queue tracker
- a staff dashboard for real-time queue operations
- automated email alerts when patients are near the front of the queue

## Why MediQueue

Traditional OPD queues often require patients to wait onsite for long periods with little visibility into progress. MediQueue shifts this experience to a live digital workflow where patients can monitor queue movement remotely and arrive closer to consultation time.

## Core Features

- **Self check-in kiosk flow** for new patient registration
- **Live queue tracking** by 6-character token code
- **Staff control dashboard** for:
  - doctor selection
  - doctor status updates (available, busy, on break)
  - waiting list management (call, skip, complete)
  - quick desk walk-in check-in
- **Dynamic wait estimates** based on doctor consultation pace
- **Email notifications** sent when a patient is close to being called
- **Printable receipts + QR code** for quick queue lookup

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend / Realtime DB:** Convex
- **Auth:** Clerk (configured for staff sign-in routes)
- **Email Provider:** Resend
- **Icons/UI:** Lucide React

## Application Routes

- `/` - landing page + token-based queue lookup
- `/checkin` - patient self check-in
- `/q/[code]` - patient live status page
- `/staff/dashboard` - staff operations dashboard
- `/sign-in` and `/sign-up` - authentication routes

## Quick Start

### 1) Clone and install dependencies

```bash
git clone https://github.com/Abivarman123/mediqueue.git
cd mediqueue
npm install
```

### 2) Configure environment variables

Create a local environment file (for example `.env.local`) and copy values from `.env.example`:

```bash
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
RESEND_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/staff/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/staff/dashboard
```

### 3) Start Convex and the app

Run Convex in one terminal:

```bash
npx convex dev
```

Run Next.js in another terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start Next.js development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Email Alert Behavior

- When `RESEND_API_KEY` is configured, alerts are sent via Resend.
- When it is not configured, the app logs a mock "email sent" message and still marks notifications as sent in the database for development flow testing.

## Project Structure

```text
MediQueue/
  src/
    app/
      page.tsx                 # Landing + token lookup
      checkin/page.tsx         # Patient check-in
      q/[code]/page.tsx        # Live queue status by token
      staff/dashboard/page.tsx # Staff control dashboard
  convex/
    doctors.ts                 # Doctor queries/mutations
    queues.ts                  # Queue logic
    notifications.ts           # Email alert action
    seed.ts                    # Demo data seeding
  .env.example
  LICENSE
```

## Deployment Notes

Production app: [https://mediqueuesl.vercel.app](https://mediqueuesl.vercel.app)

- Deploy the frontend on Vercel (or any Next.js-compatible host).
- Configure all required environment variables in your deployment platform.
- Ensure Convex deployment values (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`) match the target environment.
- Set `APP_URL` on your Convex deployment so email alert links point at the live site:
  `npx convex env set APP_URL https://mediqueuesl.vercel.app`
- In the [Clerk Dashboard](https://dashboard.clerk.com), add `https://mediqueuesl.vercel.app` under **Domains** (and keep `http://localhost:3000` for local dev).
- For production email delivery, set a valid `RESEND_API_KEY` and verified sender domain.

## Contributing

Contributions are welcome. For substantial changes, please open an issue first to discuss scope and approach.

## License

This project is licensed under the **MIT License**.

See [LICENSE](./LICENSE) for full text.
