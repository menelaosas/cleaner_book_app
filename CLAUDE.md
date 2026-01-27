# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Serenity is a home cleaning service marketplace connecting homeowners with verified cleaning professionals. It's a full-stack TypeScript application with a Next.js frontend and Express.js backend.

## Development Commands

### Backend (from `/backend`)
```bash
npm run dev              # Start dev server with hot reload (port 5000)
npm run build            # Compile TypeScript
npm run lint             # ESLint
npm test                 # Jest tests (watch mode)
npm test -- auth.test.ts # Run specific test file
npm run prisma:studio    # Database GUI
npm run prisma:migrate   # Create migration
npm run prisma:generate  # Regenerate Prisma client after schema changes
```

### Frontend (from `/frontend`)
```bash
npm run dev         # Start Next.js dev server (port 3000, or next available)
npm run build       # Production build
npm run lint        # ESLint
npm run type-check  # TypeScript validation
```

### Database
```bash
docker start serenity-postgres serenity-redis  # Start database containers
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma migrate reset              # Reset database (destructive)
npx prisma studio                     # Visual database browser
```

### Docker (production)
```bash
docker-compose -f docker-compose.prod.yml up -d --build  # Build and start all services
docker-compose -f docker-compose.prod.yml logs -f        # View logs
```

## Architecture

```
├── frontend/          # Next.js 14 with App Router
│   └── src/
│       ├── app/       # Route pages using App Router conventions
│       │   ├── page.tsx                  # Landing page
│       │   ├── login/                    # User login
│       │   ├── register/                 # User registration
│       │   ├── dashboard/                # Main dashboard (customer/cleaner views)
│       │   ├── cleaners/                 # Browse cleaners list
│       │   ├── cleaners/[id]/            # Cleaner profile detail
│       │   ├── booking/[cleanerId]/      # Create booking form
│       │   ├── bookings/                 # Customer bookings list
│       │   ├── bookings/[id]/review/     # Leave review for completed booking
│       │   ├── messages/                 # Conversations inbox
│       │   ├── messages/[bookingId]/     # Individual conversation
│       │   ├── settings/                 # User profile settings
│       │   ├── cleaner/setup/            # Cleaner onboarding
│       │   ├── cleaner/bookings/         # Cleaner job management
│       │   └── cleaner/earnings/         # Cleaner earnings dashboard
│       ├── components/                   # React components
│       │   ├── Providers.tsx             # App wrapper (auth, toast, etc.)
│       │   └── ui/                       # UI components (toaster)
│       └── contexts/                     # AuthContext for global state

├── backend/           # Express.js API
│   └── src/
│       ├── server.ts  # App class initializes middleware, routes, Socket.io
│       ├── config/    # Environment config validation
│       ├── routes/    # API route definitions
│       │   ├── auth.routes.ts     # Authentication (login, register, etc.)
│       │   ├── user.routes.ts     # User profile CRUD
│       │   ├── cleaner.routes.ts  # Cleaner profiles and search
│       │   ├── booking.routes.ts  # Booking workflow
│       │   ├── review.routes.ts   # Reviews CRUD
│       │   └── message.routes.ts  # Messaging system
│       ├── controllers/ # Request handlers
│       ├── services/  # Business logic
│       └── middleware/ # Auth, error handling, validation
│   └── prisma/
│       └── schema.prisma  # Database models and relations
```

## Key Patterns

**Backend API structure**: Routes at `/api/{resource}` delegate to controllers. The server class (`server.ts`) handles middleware setup including rate limiting (stricter on auth routes), CORS, and Socket.io initialization.

**Authentication**: JWT-based with refresh tokens. Tokens stored in `refresh_tokens` table. Email verification via `verification_tokens` table. Access token expires in 1 hour, refresh token in 7 days.

**Database**: PostgreSQL with Prisma ORM. Key models: User (with CleanerProfile relation), Booking (connects User and Cleaner), Payment (Stripe integration), Review, Message.

**Real-time**: Socket.io for messaging. Users join `user:{id}` rooms; booking participants join `booking:{id}` rooms.

**Frontend state**: AuthContext for user session, axios for API calls with auth headers, react-hot-toast for notifications.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/logout` - Invalidate refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `POST /api/users/:id/change-password` - Change password
- `DELETE /api/users/:id` - Delete account

### Cleaners
- `GET /api/cleaners` - List/search cleaners (supports filters)
- `GET /api/cleaners/:id` - Get cleaner profile with reviews
- `POST /api/cleaners` - Create cleaner profile (become a cleaner)
- `GET /api/cleaners/me` - Get own cleaner profile
- `PATCH /api/cleaners/me` - Update cleaner profile
- `GET /api/cleaners/me/stats` - Get cleaner statistics

### Bookings
- `GET /api/bookings` - Get user's bookings (or cleaner's if role=CLEANER)
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id` - Update booking (reschedule)
- `POST /api/bookings/:id/confirm` - Cleaner confirms booking
- `POST /api/bookings/:id/decline` - Cleaner declines booking
- `POST /api/bookings/:id/start` - Cleaner starts job
- `POST /api/bookings/:id/complete` - Cleaner completes job
- `POST /api/bookings/:id/cancel` - Cancel booking (either party)

### Reviews
- `POST /api/reviews` - Create review for completed booking
- `GET /api/reviews/cleaner/:cleanerId` - Get cleaner's reviews
- `GET /api/reviews/:id` - Get single review
- `PATCH /api/reviews/:id` - Update review (reviewer only)
- `DELETE /api/reviews/:id` - Delete review (reviewer or admin)
- `GET /api/reviews/my-reviews` - Get reviews left by current user

### Messages
- `GET /api/messages` - Get all conversations
- `GET /api/messages/booking/:bookingId` - Get messages for a booking
- `POST /api/messages` - Send a message
- `PATCH /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread message count

## Booking Workflow

1. Customer creates booking (status: PENDING)
2. Cleaner confirms (CONFIRMED) or declines (CANCELLED)
3. On scheduled date, cleaner starts job (IN_PROGRESS)
4. Cleaner completes job (COMPLETED)
5. Customer can leave review after completion

## Pricing Model

- Subtotal = Cleaner hourly rate × duration
- Service fee = 15% of subtotal (platform fee)
- Tax = 8% of subtotal
- Total = subtotal + service fee + tax
- Cleaner receives 85% of total (before tax)

## Test Users

```
Customer: test123@example.com / Test12345
Cleaner: cleaner@example.com / Cleaner123
```

## Environment Variables

Backend (`.env`):
```
PORT=5000
DATABASE_URL=postgresql://serenity:password@localhost:5433/serenity?schema=public
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
FRONTEND_URL=http://localhost:3002
REDIS_URL=redis://localhost:6380
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## CI/CD

GitHub Actions workflow runs on push to `main`/`develop`:
1. Backend: Lint, test with PostgreSQL/Redis services, Prisma migrate
2. Frontend: Lint, type-check, build
3. On `main`: Build Docker images, push to ghcr.io, SSH deploy to production
