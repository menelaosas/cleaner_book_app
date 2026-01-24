# 🏡 Serenity - Professional Home Cleaning Service Platform

<div align="center">

![Serenity Logo](https://via.placeholder.com/200x200/1b6a6a/ffffff?text=Serenity)

**Connect homeowners with trusted, verified cleaning professionals**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### For Customers
- 🔍 **Smart Search** - Find verified cleaners in your area
- 📅 **Real-time Booking** - Check availability and book instantly
- 💳 **Secure Payments** - Stripe integration for safe transactions
- ⭐ **Reviews & Ratings** - Read verified customer reviews
- 💬 **In-app Messaging** - Communicate directly with cleaners
- 📱 **Mobile Responsive** - Works perfectly on all devices

### For Cleaning Professionals
- 👤 **Professional Profiles** - Showcase experience and specialties
- 📊 **Dashboard** - Manage bookings and earnings
- 🗓️ **Availability Management** - Set your schedule flexibly
- 💰 **Transparent Pricing** - Set your own rates
- 🔔 **Instant Notifications** - Never miss a booking request
- ✅ **Verification System** - Build trust with customers

### For Administrators
- 📈 **Analytics Dashboard** - Track platform performance
- 👥 **User Management** - Verify and manage users
- 💸 **Payment Processing** - Monitor transactions
- 🛡️ **Security Controls** - Platform-wide security management

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (React 18) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Query
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.io Client
- **Payments:** Stripe Elements

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Cache:** Redis
- **Auth:** JWT + OAuth (Google, Apple)
- **Real-time:** Socket.io
- **Email:** SendGrid
- **SMS:** Twilio
- **Payments:** Stripe
- **Storage:** AWS S3

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (optional)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Web App │  │  Mobile  │  │   PWA    │  │  Admin   │   │
│  │ (Next.js)│  │  (React) │  │          │  │  Panel   │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
└────────┼─────────────┼─────────────┼─────────────┼─────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │      Nginx (Reverse Proxy)        │
         │    SSL/TLS, Load Balancing        │
         └─────────────┬───────────────┬─────┘
                       │               │
         ┌─────────────▼──────┐ ┌─────▼──────────────┐
         │   Next.js Server   │ │   Express API      │
         │   (SSR/Static)     │ │   (REST + WS)      │
         └────────────────────┘ └──────┬─────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
         ┌──────▼──────┐    ┌─────────▼────────┐   ┌────────▼────────┐
         │ PostgreSQL  │    │      Redis       │   │   Socket.io     │
         │  Database   │    │   Cache/Queue    │   │   Real-time     │
         └─────────────┘    └──────────────────┘   └─────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
         ┌──────▼──────┐    ┌─────────▼────────┐   ┌────────▼────────┐
         │   Stripe    │    │    SendGrid      │   │     AWS S3      │
         │  Payments   │    │     Email        │   │  File Storage   │
         └─────────────┘    └──────────────────┘   └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/serenity-app.git
cd serenity-app
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Set up environment variables**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

4. **Start databases with Docker**
```bash
docker-compose up -d postgres redis
```

5. **Run database migrations**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

6. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## 💻 Development

### Project Structure

```
serenity-app/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── public/            # Static files
│
├── backend/               # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utilities
│   │   └── config/        # Configuration
│   └── prisma/            # Database schema
│
├── docker/                # Docker configurations
├── .github/               # GitHub Actions
└── docs/                  # Documentation
```

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run prisma:studio # Open Prisma Studio
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript check
```

### Database Management

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/logout          # Logout user
POST   /api/auth/verify-email    # Verify email
POST   /api/auth/forgot-password # Request password reset
POST   /api/auth/reset-password  # Reset password
POST   /api/auth/refresh-token   # Refresh access token
GET    /api/auth/me              # Get current user
```

### User Endpoints

```
GET    /api/users/:id            # Get user profile
PATCH  /api/users/:id            # Update user profile
DELETE /api/users/:id            # Delete user account
GET    /api/users/:id/bookings   # Get user bookings
```

### Cleaner Endpoints

```
GET    /api/cleaners             # List cleaners (search/filter)
GET    /api/cleaners/:id         # Get cleaner profile
POST   /api/cleaners             # Create cleaner profile
PATCH  /api/cleaners/:id         # Update cleaner profile
GET    /api/cleaners/:id/reviews # Get cleaner reviews
GET    /api/cleaners/:id/availability # Get availability
POST   /api/cleaners/:id/availability # Update availability
```

### Booking Endpoints

```
POST   /api/bookings            # Create booking
GET    /api/bookings/:id        # Get booking details
PATCH  /api/bookings/:id        # Update booking
DELETE /api/bookings/:id        # Cancel booking
POST   /api/bookings/:id/confirm # Confirm booking
POST   /api/bookings/:id/complete # Complete booking
```

### Payment Endpoints

```
POST   /api/payments/create-intent    # Create payment intent
POST   /api/payments/confirm           # Confirm payment
POST   /api/payments/webhook           # Stripe webhook
GET    /api/payments/:id               # Get payment details
```

### Review Endpoints

```
POST   /api/reviews                    # Create review
GET    /api/reviews/:id                # Get review
PATCH  /api/reviews/:id                # Update review
DELETE /api/reviews/:id                # Delete review
```

For complete API documentation, visit: http://localhost:5000/api-docs

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Quick Deploy with Docker

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Variables

Required environment variables for production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SENDGRID_API_KEY` - SendGrid API key
- See `.env.example` for complete list

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Tailwind CSS for the utility-first CSS framework
- All our contributors and supporters

## 📞 Support

- **Documentation:** [docs.serenity.app](https://docs.serenity.app)
- **Email:** support@serenity.app
- **Discord:** [Join our community](https://discord.gg/serenity)
- **GitHub Issues:** [Report bugs](https://github.com/yourusername/serenity-app/issues)

---

<div align="center">

Made with ❤️ by the Serenity Team

[Website](https://serenity.app) • [Documentation](https://docs.serenity.app) • [Blog](https://blog.serenity.app)

</div>
