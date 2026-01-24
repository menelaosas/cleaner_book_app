# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Serenity is a home cleaning service marketplace connecting homeowners with verified cleaning professionals. It's a full-stack TypeScript application with a Next.js frontend and Express.js backend.

## Development Commands

### Backend (from `/backend`)
```bash
npm run dev              # Start dev server with hot reload
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
npm run dev         # Start Next.js dev server (port 3000)
npm run build       # Production build
npm run lint        # ESLint
npm run type-check  # TypeScript validation
```

### Database
```bash
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
│       ├── components/ # React components (Providers.tsx wraps app)
│       └── contexts/  # AuthContext, SocketContext for global state
│
├── backend/           # Express.js API
│   └── src/
│       ├── server.ts  # App class initializes middleware, routes, Socket.io
│       ├── config/    # Environment config validation
│       ├── routes/    # API route definitions
│       ├── controllers/ # Request handlers
│       ├── services/  # Business logic (to be created)
│       └── middleware/ # Auth, error handling, validation
│   └── prisma/
│       └── schema.prisma  # Database models and relations
```

## Key Patterns

**Backend API structure**: Routes at `/api/{resource}` delegate to controllers. The server class (`server.ts`) handles middleware setup including rate limiting (stricter on auth routes), CORS, and Socket.io initialization.

**Authentication**: JWT-based with refresh tokens. Tokens stored in `refresh_tokens` table. Email verification via `verification_tokens` table.

**Database**: PostgreSQL with Prisma ORM. Key models: User (with CleanerProfile relation), Booking (connects User and Cleaner), Payment (Stripe integration), Review, Message.

**Real-time**: Socket.io for messaging. Users join `user:{id}` rooms; booking participants join `booking:{id}` rooms.

**Frontend state**: Zustand for client state, React Query for server state, React Hook Form + Zod for forms.

## API Endpoints Pattern

- Auth: `/api/auth/{register,login,logout,verify-email,forgot-password,reset-password,refresh-token,me}`
- Users: `/api/users/{id}`
- Cleaners: `/api/cleaners` (list/search), `/api/cleaners/{id}` (profile), `/api/cleaners/{id}/availability`
- Bookings: `/api/bookings` CRUD + `/api/bookings/{id}/{confirm,complete}`
- Payments: `/api/payments/{create-intent,confirm,webhook}`
- Reviews/Messages: Standard CRUD

## Environment

Requires Node.js 20+. Backend needs `DATABASE_URL` (PostgreSQL) and `JWT_SECRET` at minimum. See `backend/src/config/config.ts` for all environment variables. Copy `.env.example` to `.env` for local development.

## CI/CD

GitHub Actions workflow runs on push to `main`/`develop`:
1. Backend: Lint, test with PostgreSQL/Redis services, Prisma migrate
2. Frontend: Lint, type-check, build
3. On `main`: Build Docker images, push to ghcr.io, SSH deploy to production
