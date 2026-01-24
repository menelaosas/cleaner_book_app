# Serenity - Home Cleaning Service App

## 🏗️ Project Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (React 18) - Server-side rendering & optimal performance
- TypeScript - Type safety
- Tailwind CSS - Styling (already implemented)
- Zustand - State management
- React Query - Server state management
- Axios - HTTP client
- React Hook Form - Form handling
- Zod - Schema validation

**Backend:**
- Node.js 20+
- Express.js - API framework
- TypeScript
- PostgreSQL 15 - Primary database
- Prisma - ORM
- Redis - Caching & sessions
- JWT - Authentication
- Socket.io - Real-time features

**Infrastructure:**
- Docker & Docker Compose
- Nginx - Reverse proxy
- PM2 - Process management
- GitHub Actions - CI/CD

**Services:**
- Stripe - Payment processing
- SendGrid - Email notifications
- Twilio - SMS notifications
- AWS S3 - File storage
- Cloudflare - CDN & DDoS protection

## 📁 Directory Structure

```
serenity-app/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & config
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema
│   └── package.json
│
├── shared/                  # Shared types & constants
│   └── types/
│
├── docker/                  # Docker configurations
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── nginx.conf
│
├── .github/                 # CI/CD workflows
│   └── workflows/
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## 🔑 Key Features

### User Features
- ✅ User registration & authentication
- ✅ Email verification
- ✅ Social login (Google, Apple)
- ✅ Browse & search cleaners
- ✅ View cleaner profiles & reviews
- ✅ Real-time availability calendar
- ✅ Book cleaning sessions
- ✅ Secure payments
- ✅ Chat with cleaners
- ✅ Rate & review
- ✅ Booking history

### Cleaner Features
- ✅ Professional profile setup
- ✅ Availability management
- ✅ Service area configuration
- ✅ Accept/decline bookings
- ✅ Earnings dashboard
- ✅ Customer reviews
- ✅ Real-time notifications

### Admin Features
- ✅ User management
- ✅ Cleaner verification
- ✅ Analytics dashboard
- ✅ Payment processing
- ✅ Dispute resolution

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing (bcrypt)
- Rate limiting
- CORS configuration
- SQL injection prevention (Prisma)
- XSS protection
- CSRF tokens
- Input validation & sanitization
- HTTPS enforcement
- Security headers (Helmet.js)

## 🚀 Performance Optimizations

- Next.js Image optimization
- Code splitting & lazy loading
- Redis caching
- Database indexing
- CDN for static assets
- Gzip compression
- HTTP/2
- Service workers (PWA)
- Database connection pooling
