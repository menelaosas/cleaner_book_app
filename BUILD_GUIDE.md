# Build Guide - Serenity Project (From Scratch)

Every command you would need to build this entire project from zero, explained in detail.

---

## Table of Contents

1. [System Prerequisites](#1-system-prerequisites)
2. [Project Scaffolding](#2-project-scaffolding)
3. [Backend Setup (Express + TypeScript)](#3-backend-setup-express--typescript)
4. [Database Setup (PostgreSQL + Redis with Docker)](#4-database-setup-postgresql--redis-with-docker)
5. [Prisma ORM Setup](#5-prisma-orm-setup)
6. [Frontend Setup (Next.js + TypeScript)](#6-frontend-setup-nextjs--typescript)
7. [Tailwind CSS Setup](#7-tailwind-css-setup)
8. [Environment Variables](#8-environment-variables)
9. [Running the Development Servers](#9-running-the-development-servers)
10. [Git & GitHub Setup](#10-git--github-setup)
11. [Docker Production Setup](#11-docker-production-setup)
12. [CI/CD with GitHub Actions](#12-cicd-with-github-actions)
13. [Useful Day-to-Day Commands](#13-useful-day-to-day-commands)
14. [Troubleshooting](#14-troubleshooting)
15. [Full Command Reference Table](#15-full-command-reference-table)

---

## 1. System Prerequisites

These are the tools that must be installed on your machine before anything else.

### Install Node.js (version 20+)
```bash
# Option A: Using nvm (Node Version Manager) — RECOMMENDED
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
**What it does:**
- `curl -o-` downloads a script from the internet and outputs it to stdout.
- `| bash` pipes that script into bash to execute it.
- `nvm` lets you install and switch between multiple Node.js versions.

```bash
# Close and reopen your terminal, then:
nvm install 20
nvm use 20
```
**What it does:**
- `nvm install 20` downloads and installs Node.js version 20 (latest minor).
- `nvm use 20` activates it for the current terminal session.

```bash
# Option B: Using apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
**What it does:**
- Downloads NodeSource's setup script that adds their repository to apt.
- `-fsSL`: `-f` fail silently on HTTP errors, `-s` silent, `-S` show errors, `-L` follow redirects.
- `sudo -E` runs as root while preserving environment variables.
- `sudo apt install -y nodejs` installs Node.js. `-y` auto-confirms "yes" to prompts.

### Verify Node.js and npm
```bash
node -v
npm -v
```
**What it does:**
- `-v` (or `--version`) prints the installed version.
- You need Node.js >= 20.0.0 and npm >= 10.0.0 for this project.
- `node` is the JavaScript runtime. `npm` is the package manager that comes with it.

### Install Docker
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
```
**What it does:**
- `sudo apt update` refreshes the list of available packages from repositories.
- `docker.io` is the Docker container engine.
- `docker-compose-plugin` adds `docker compose` command for multi-container setups.
- `&&` chains commands — the second only runs if the first succeeds.

```bash
# Add your user to the docker group (so you don't need sudo every time)
sudo usermod -aG docker $USER
```
**What it does:**
- `usermod` modifies a user account.
- `-aG docker` appends (`-a`) the user to the `docker` group (`-G`).
- `$USER` is a shell variable containing your username.
- **You must log out and back in** for this to take effect.

### Verify Docker
```bash
docker --version
docker compose version
```

### Install Git
```bash
sudo apt install -y git
git --version
```

### Configure Git identity
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```
**What it does:**
- `--global` sets this for all repositories on your machine (stored in `~/.gitconfig`).
- Without `--global`, it would only apply to the current repo (stored in `.git/config`).
- Git requires name and email to create commits — this is who shows up as the author.

---

## 2. Project Scaffolding

### Create the project directory structure
```bash
mkdir -p cleaner_book_app/{backend,frontend,docker}
cd cleaner_book_app
```
**What it does:**
- `mkdir` creates directories.
- `-p` creates parent directories if they don't exist AND doesn't error if the directory already exists.
- `{backend,frontend,docker}` is **brace expansion** — bash expands this to three separate arguments: `cleaner_book_app/backend`, `cleaner_book_app/frontend`, `cleaner_book_app/docker`.
- `cd` changes into the new directory.

### Initialize the root project
```bash
git init
```
**What it does:** Creates a `.git/` directory, turning this folder into a git repository. This is where git stores all version history.

### Create the .gitignore file
```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/
out/

# Prisma
prisma/migrations/*.sql.pending

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# TypeScript
*.tsbuildinfo

# Misc
.cache/
tmp/
EOF
```
**What it does:**
- `cat > file << 'EOF'` is a **heredoc redirect** — writes everything between `<< 'EOF'` and `EOF` into the file.
- `>` overwrites the file (use `>>` to append).
- The single quotes around `'EOF'` prevent variable expansion (e.g., `$HOME` stays literal, not expanded).
- `.gitignore` tells git which files/folders to NEVER track.

**Why each entry matters:**
| Pattern | Why ignored |
|---------|-------------|
| `node_modules/` | Dependencies — huge folder, recreated by `npm install` |
| `.env` | Contains secrets (passwords, API keys) |
| `dist/`, `.next/` | Build output — regenerated by `npm run build` |
| `.DS_Store` | macOS hidden files — not code |
| `coverage/` | Test coverage reports — generated, not source code |

---

## 3. Backend Setup (Express + TypeScript)

### Initialize the backend package
```bash
cd backend
npm init -y
```
**What it does:**
- `npm init` creates a `package.json` file — the project's manifest that lists dependencies, scripts, and metadata.
- `-y` answers "yes" to all questions (uses defaults). Without it, npm asks you for name, version, description, etc.

### Install production dependencies
```bash
npm install express cors helmet compression morgan cookie-parser dotenv \
  jsonwebtoken bcryptjs express-rate-limit express-validator \
  @prisma/client redis socket.io stripe winston aws-sdk @sendgrid/mail
```
**What it does:**
- `npm install` downloads packages from the npm registry and saves them to `node_modules/`.
- Each package is added to the `dependencies` section of `package.json`.
- The `\` at the end of the line is a line continuation — it's still one command.

**What each package does:**

| Package | Purpose |
|---------|---------|
| `express` | Web framework — handles HTTP requests, routing, middleware |
| `cors` | Cross-Origin Resource Sharing — allows the frontend (port 3000) to call the backend (port 5000) |
| `helmet` | Security headers — adds HTTP headers that protect against common attacks (XSS, clickjacking, etc.) |
| `compression` | Gzip compression — makes API responses smaller and faster |
| `morgan` | HTTP request logger — logs every request (method, URL, status, time) |
| `cookie-parser` | Parses cookies from HTTP requests |
| `dotenv` | Loads `.env` file variables into `process.env` |
| `jsonwebtoken` | JWT creation and verification for authentication |
| `bcryptjs` | Password hashing — never store passwords in plain text |
| `express-rate-limit` | Rate limiting — prevents brute-force and DDoS attacks |
| `express-validator` | Input validation — sanitize and validate request data |
| `@prisma/client` | Database ORM — type-safe database queries |
| `redis` | Redis client — for caching and session management |
| `socket.io` | WebSocket library — real-time bidirectional communication |
| `stripe` | Payment processing SDK |
| `winston` | Logging library — structured logs with levels (info, warn, error) |
| `aws-sdk` | AWS services (S3 for file uploads) |
| `@sendgrid/mail` | Email sending service |

### Install development dependencies
```bash
npm install -D typescript ts-node ts-node-dev @types/node @types/express \
  @types/cors @types/compression @types/morgan @types/cookie-parser \
  @types/bcryptjs @types/jsonwebtoken \
  prisma eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  jest ts-jest prettier
```
**What it does:**
- `-D` (or `--save-dev`) saves packages to `devDependencies` — they're only needed during development, not in production.

**What each package does:**

| Package | Purpose |
|---------|---------|
| `typescript` | The TypeScript compiler itself (`tsc` command) |
| `ts-node` | Runs TypeScript directly without compiling first |
| `ts-node-dev` | Like `ts-node` but auto-restarts on file changes (like nodemon for TypeScript) |
| `@types/*` | Type definitions — TypeScript needs these to understand JavaScript libraries |
| `prisma` | Prisma CLI — for migrations, generating client, studio |
| `eslint` | Linter — finds code quality issues |
| `@typescript-eslint/*` | ESLint plugins that understand TypeScript syntax |
| `jest` | Testing framework |
| `ts-jest` | Lets Jest run TypeScript test files |
| `prettier` | Code formatter — consistent style across the team |

**Why separate dependencies and devDependencies?**
- In production, you run `npm install --production` (or `npm ci --omit=dev`) which skips devDependencies.
- This makes the production Docker image smaller and faster.

### Initialize TypeScript configuration
```bash
npx tsc --init
```
**What it does:**
- `npx` runs a locally-installed binary (here, the TypeScript compiler).
- `--init` creates a `tsconfig.json` file with all available options (most commented out).
- `tsconfig.json` configures how TypeScript compiles your code.

**Key options we set in tsconfig.json:**

| Option | Value | Why |
|--------|-------|-----|
| `target` | `ES2020` | What JavaScript version to compile to. ES2020 is modern and supported by Node 20. |
| `module` | `commonjs` | Module system. Node.js uses CommonJS (`require()`). |
| `outDir` | `./dist` | Where compiled JavaScript goes. |
| `rootDir` | `./src` | Where your TypeScript source files are. |
| `strict` | `true` | Enables all strict type-checking. Catches more bugs. |
| `esModuleInterop` | `true` | Allows `import express from 'express'` instead of `import * as express`. |
| `sourceMap` | `true` | Generates `.map` files for debugging — maps compiled JS back to original TS. |

### Create the source directory structure
```bash
mkdir -p src/{config,routes,controllers,services,middleware}
```
**What it does:** Creates the backend folder structure in one command using brace expansion.

```
src/
├── config/        # Environment validation, database connection
├── routes/        # URL route definitions (/api/bookings, /api/auth, etc.)
├── controllers/   # Request handlers (receive request, call service, send response)
├── services/      # Business logic (calculations, validations, database queries)
└── middleware/     # Middleware functions (auth check, error handling, rate limiting)
```

### Add scripts to package.json
```bash
npm pkg set scripts.dev="ts-node-dev --respawn --transpile-only src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.lint="eslint src --ext .ts"
npm pkg set scripts.test="jest --watchAll"
npm pkg set scripts.test:ci="jest --ci"
npm pkg set scripts.prisma:generate="prisma generate"
npm pkg set scripts.prisma:migrate="prisma migrate dev"
npm pkg set scripts.prisma:studio="prisma studio"
npm pkg set scripts.prisma:seed="ts-node prisma/seed.ts"
npm pkg set scripts.format="prettier --write \"src/**/*.ts\""
```
**What it does:**
- `npm pkg set` modifies `package.json` from the command line.
- These define the `npm run <script>` commands.

**What each script does:**

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `ts-node-dev --respawn --transpile-only src/server.ts` | Runs the server in development mode with auto-restart. `--respawn` restarts on crash. `--transpile-only` skips type checking for speed. |
| `build` | `tsc` | Compiles TypeScript to JavaScript in the `dist/` folder. |
| `start` | `node dist/server.js` | Runs the compiled production server. |
| `lint` | `eslint src --ext .ts` | Checks code quality. `--ext .ts` tells ESLint to check TypeScript files. |
| `test` | `jest --watchAll` | Runs tests and watches for changes. |
| `test:ci` | `jest --ci` | Runs tests once (for CI pipelines). |
| `prisma:generate` | `prisma generate` | Regenerates the Prisma Client after schema changes. |
| `prisma:migrate` | `prisma migrate dev` | Creates and applies database migrations. |
| `prisma:studio` | `prisma studio` | Opens the visual database browser. |
| `prisma:seed` | `ts-node prisma/seed.ts` | Populates the database with initial test data. |
| `format` | `prettier --write "src/**/*.ts"` | Auto-formats all TypeScript files. `--write` modifies files in place. |

---

## 4. Database Setup (PostgreSQL + Redis with Docker)

### Create the docker-compose.yml file
```bash
cd /path/to/cleaner_book_app

cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: serenity-postgres
    environment:
      POSTGRES_USER: serenity
      POSTGRES_PASSWORD: password
      POSTGRES_DB: serenity
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: serenity-redis
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF
```
**What it does:**
- Defines two services (containers) that Docker will manage together.
- `docker-compose.yml` is the standard name Docker Compose looks for.

**Line-by-line explanation:**

| Line | Meaning |
|------|---------|
| `image: postgres:15-alpine` | Use PostgreSQL version 15 based on Alpine Linux (small image, ~80MB vs ~400MB). |
| `container_name: serenity-postgres` | Give the container a friendly name instead of a random hash. |
| `POSTGRES_USER: serenity` | Create a database user called "serenity". |
| `POSTGRES_PASSWORD: password` | Set the password. (Only for development — use secrets in production.) |
| `POSTGRES_DB: serenity` | Automatically create a database called "serenity" on first start. |
| `ports: "5433:5432"` | Map host port 5433 to container port 5432. Why 5433? To avoid conflict if you have PostgreSQL installed locally on 5432. Format: `"HOST:CONTAINER"`. |
| `volumes: postgres_data:/var/lib/postgresql/data` | Persist database data in a Docker volume. Without this, data is lost when the container stops. |
| `image: redis:7-alpine` | Redis version 7 on Alpine Linux. |
| `ports: "6380:6379"` | Redis mapped to 6380 to avoid conflicts. |

### Start the database containers
```bash
docker compose up -d
```
**What it does:**
- `docker compose up` creates and starts all services defined in `docker-compose.yml`.
- `-d` (detached) runs in the background. Without it, the terminal is taken over by container logs.

### Verify containers are running
```bash
docker ps
```
**What it does:**
- Lists all running containers.
- You should see `serenity-postgres` and `serenity-redis` with status "Up".

**Columns explained:**
| Column | Meaning |
|--------|---------|
| CONTAINER ID | Unique hash identifier |
| IMAGE | Which Docker image it's running |
| COMMAND | The command running inside the container |
| STATUS | "Up 5 minutes" = running. "Exited" = stopped. |
| PORTS | Port mappings (host → container) |
| NAMES | The friendly name we gave it |

### Stop and start containers (later use)
```bash
docker compose stop          # Stops containers but keeps them (data preserved)
docker compose start         # Starts stopped containers
docker compose down          # Stops AND removes containers (data in volumes preserved)
docker compose down -v       # Stops, removes, AND deletes volumes (ALL DATA LOST)
```

**The difference matters:**
| Command | Containers | Volumes (data) |
|---------|-----------|----------------|
| `stop` | Paused | Preserved |
| `down` | Deleted | Preserved |
| `down -v` | Deleted | **DELETED** |

### Test the database connection manually
```bash
docker exec -it serenity-postgres psql -U serenity -d serenity -c "SELECT version();"
```
**What it does:**
- `docker exec` runs a command inside a running container.
- `-it` makes it interactive with a terminal.
- `psql` is the PostgreSQL command-line client.
- `-U serenity` connects as user "serenity".
- `-d serenity` connects to database "serenity".
- `-c "SELECT version();"` runs a single SQL command and exits.

**Expected output:** PostgreSQL version info, confirming the database is alive.

### Test Redis connection
```bash
docker exec -it serenity-redis redis-cli ping
```
**What it does:** Sends a PING to Redis. **Expected:** `PONG` — means Redis is alive.

---

## 5. Prisma ORM Setup

### Initialize Prisma
```bash
cd backend
npx prisma init
```
**What it does:**
- Creates a `prisma/` directory with `schema.prisma` (the database schema file).
- Creates a `.env` file with a placeholder `DATABASE_URL`.
- `schema.prisma` is where you define your database models (tables), enums, and relations.

### Understanding schema.prisma syntax

The schema has three sections:

```prisma
// 1. Generator — tells Prisma what client code to generate
generator client {
  provider = "prisma-client-js"     // Generate JavaScript/TypeScript client
}

// 2. Datasource — which database to connect to
datasource db {
  provider = "postgresql"           // Database type
  url      = env("DATABASE_URL")    // Read URL from environment variable
}

// 3. Models — your database tables
model User {
  id        String   @id @default(cuid())   // Primary key, auto-generated
  email     String   @unique                 // Unique constraint
  name      String
  createdAt DateTime @default(now())         // Auto-set on create
  updatedAt DateTime @updatedAt              // Auto-set on update

  bookings  Booking[]                        // One-to-many relation

  @@index([email])                           // Database index for faster queries
  @@map("users")                             // Actual table name in PostgreSQL
}
```

### Create and apply a migration
```bash
npx prisma migrate dev --name init
```
**What it does:**
1. Reads `schema.prisma` and compares it to the current database state.
2. Generates a SQL migration file in `prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql`.
3. Applies that SQL to the database (creates/alters tables).
4. Regenerates the Prisma Client (`@prisma/client`).

**The `--name init` part:** Gives the migration a human-readable name. The full folder name becomes something like `20260127120000_init`.

**When to run this:** Every time you change `schema.prisma` — add a model, add a field, change a type, add an enum value.

### Regenerate Prisma Client (without migrating)
```bash
npx prisma generate
```
**What it does:**
- Reads `schema.prisma` and regenerates the TypeScript client in `node_modules/@prisma/client`.
- This is the code you import with `import { PrismaClient } from '@prisma/client'`.
- Run this after pulling changes that include schema changes, even without migrating.

### Apply migrations to an existing database (production)
```bash
npx prisma migrate deploy
```
**What it does:**
- Applies all pending migrations that haven't been run yet.
- Unlike `migrate dev`, it does NOT generate new migrations — it only applies existing ones.
- Safe for production. `migrate dev` is for development only (it can reset data).

### Reset the database (DESTRUCTIVE)
```bash
npx prisma migrate reset
```
**What it does:**
- Drops the entire database.
- Recreates it from scratch.
- Re-applies all migrations.
- Runs the seed script if one exists.
- **ALL DATA IS LOST.** Only use in development.

### Open Prisma Studio
```bash
npx prisma studio
```
**What it does:**
- Opens a web GUI at `http://localhost:5555`.
- Lets you browse, filter, edit, and delete records visually.
- Reads the schema to show proper field types and relations.

### Seed the database with test data
```bash
npx prisma db seed
```
**What it does:**
- Runs the seed script defined in `package.json` (`ts-node prisma/seed.ts`).
- Populates the database with initial data (test users, sample bookings, etc.).
- The seed file is a TypeScript script that uses Prisma Client to insert records.

### View the migration history
```bash
npx prisma migrate status
```
**What it does:**
- Shows which migrations have been applied and which are pending.
- Useful for debugging when the database is out of sync with the schema.

---

## 6. Frontend Setup (Next.js + TypeScript)

### Create the Next.js application
```bash
cd /path/to/cleaner_book_app
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
**What it does:**
- `create-next-app@14` uses Next.js version 14 scaffolding tool.
- `frontend` is the directory name.

**Flags explained:**

| Flag | What it does |
|------|-------------|
| `--typescript` | Sets up TypeScript configuration (tsconfig.json, .tsx files) |
| `--tailwind` | Pre-configures Tailwind CSS with PostCSS |
| `--eslint` | Sets up ESLint with Next.js rules |
| `--app` | Uses the App Router (newer) instead of Pages Router (older) |
| `--src-dir` | Puts source code in `src/` directory instead of root |
| `--import-alias "@/*"` | Lets you import like `@/components/Button` instead of `../../components/Button` |

### Install additional frontend dependencies
```bash
cd frontend

npm install axios react-hot-toast socket.io-client \
  react-hook-form @hookform/resolvers zod \
  @stripe/stripe-js @stripe/react-stripe-js \
  @tanstack/react-query @tanstack/react-query-devtools \
  date-fns lucide-react next-themes \
  class-variance-authority clsx tailwind-merge zustand
```
**What each package does:**

| Package | Purpose |
|---------|---------|
| `axios` | HTTP client — makes API calls to the backend. Simpler than `fetch()` with better error handling and interceptors. |
| `react-hot-toast` | Toast notification library — shows success/error pop-ups. |
| `socket.io-client` | WebSocket client — connects to the backend's Socket.io server for real-time features. |
| `react-hook-form` | Form handling — manages form state, validation, and submission without re-renders. |
| `@hookform/resolvers` | Connects react-hook-form to validation libraries (like Zod). |
| `zod` | Schema validation — define data shapes and validate input with TypeScript support. |
| `@stripe/stripe-js` | Stripe.js loader for payment processing on the client. |
| `@stripe/react-stripe-js` | React components for Stripe (card input, payment form). |
| `@tanstack/react-query` | Server state management — caching, refetching, and syncing server data. |
| `@tanstack/react-query-devtools` | Browser DevTools for React Query — inspect queries and cache. |
| `date-fns` | Date utility library — format, parse, compare dates. Lighter than Moment.js. |
| `lucide-react` | Icon library — clean, consistent SVG icons as React components. |
| `next-themes` | Dark mode support — handles theme switching and system preference detection. |
| `class-variance-authority` | CSS variant management — create component variants (sizes, colors) cleanly. |
| `clsx` | Conditional classnames — cleaner way to combine CSS classes: `clsx('base', isActive && 'active')`. |
| `tailwind-merge` | Smart Tailwind class merging — resolves conflicts (e.g., `p-2 p-4` → `p-4`). |
| `zustand` | State management — lightweight alternative to Redux for global state. |

### Install frontend dev dependencies
```bash
npm install -D @types/react @types/react-dom @types/node \
  prettier prettier-plugin-tailwindcss \
  autoprefixer postcss tailwindcss
```
**What each package does:**

| Package | Purpose |
|---------|---------|
| `@types/*` | TypeScript type definitions for React and Node |
| `prettier` | Code formatter |
| `prettier-plugin-tailwindcss` | Sorts Tailwind classes in a consistent order |
| `autoprefixer` | PostCSS plugin — adds vendor prefixes (`-webkit-`, `-moz-`) for browser compatibility |
| `postcss` | CSS transformation tool — pipeline that processes CSS through plugins |
| `tailwindcss` | Utility-first CSS framework |

### Create the frontend directory structure
```bash
mkdir -p src/{app,components/ui,contexts,lib,hooks,types}
```
**What it does:** Creates the frontend source structure:

```
src/
├── app/           # Next.js App Router — each folder is a URL route
│   ├── page.tsx           # → localhost:3000/
│   ├── login/page.tsx     # → localhost:3000/login
│   └── dashboard/page.tsx # → localhost:3000/dashboard
├── components/    # Reusable React components
│   └── ui/        # Base UI components (Button, Card, Badge, etc.)
├── contexts/      # React contexts (AuthContext, SocketContext)
├── lib/           # Utility functions, API client setup
├── hooks/         # Custom React hooks
└── types/         # TypeScript type definitions
```

---

## 7. Tailwind CSS Setup

If you used `--tailwind` with `create-next-app`, this is already done. But here's what each config file does:

### tailwind.config.ts
```bash
cat > tailwind.config.ts << 'TAILWIND_EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1b6a6a',
        'primary-light': '#2c8585',
      },
    },
  },
  plugins: [],
};

export default config;
TAILWIND_EOF
```
**Key options explained:**

| Option | Purpose |
|--------|---------|
| `content` | Tells Tailwind which files to scan for class names. It removes unused CSS classes in production (called "purging"). If a file isn't listed here, its Tailwind classes won't work in production. |
| `darkMode: 'class'` | Dark mode activates when `<html class="dark">` is present (controlled by `next-themes`). Alternative: `'media'` uses the OS preference. |
| `theme.extend.colors` | Adds custom colors. `primary` means you can use `text-primary`, `bg-primary`, `border-primary`, etc. |

### postcss.config.js
```bash
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```
**What it does:**
- PostCSS is a CSS transformation pipeline. It processes your CSS through plugins.
- `tailwindcss` plugin transforms `@tailwind` directives into actual CSS utility classes.
- `autoprefixer` plugin adds vendor prefixes: `display: flex` → `display: -webkit-flex; display: flex`.

### Add Tailwind directives to your CSS
```bash
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```
**What each directive does:**
- `@tailwind base` — Injects Tailwind's reset/normalize styles (consistent baseline across browsers).
- `@tailwind components` — Injects any component classes defined with `@apply` in plugins.
- `@tailwind utilities` — Injects all utility classes (`flex`, `p-4`, `text-red-500`, etc.).

---

## 8. Environment Variables

### Create the backend .env file
```bash
cat > backend/.env << 'EOF'
PORT=5000
DATABASE_URL=postgresql://serenity:password@localhost:5433/serenity?schema=public
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
FRONTEND_URL=http://localhost:3002
REDIS_URL=redis://localhost:6380
EOF
```
**Line-by-line:**

| Variable | Purpose |
|----------|---------|
| `PORT=5000` | Which port the Express server listens on. |
| `DATABASE_URL` | PostgreSQL connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`. Port 5433 matches our Docker mapping. |
| `JWT_SECRET` | Secret key for signing access tokens. Must be a long random string in production. |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens. Different from access token secret for security. |
| `FRONTEND_URL` | CORS origin — only this URL can call the API. Prevents unauthorized websites from using your API. |
| `REDIS_URL` | Redis connection string. Port 6380 matches our Docker mapping. |

### Create the frontend .env.local file
```bash
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF
```
**Important:**
- `NEXT_PUBLIC_` prefix is required for variables that need to be accessible in the browser.
- Without this prefix, the variable is only available server-side (for security).
- `.env.local` is the standard name for local environment overrides in Next.js. It's automatically loaded and should be in `.gitignore`.

### Generate secure secrets (for production)
```bash
# Generate a random 64-character hex string
openssl rand -hex 32
```
**What it does:**
- `openssl rand` generates cryptographically secure random bytes.
- `-hex` outputs them as hexadecimal characters.
- `32` means 32 bytes = 64 hex characters.
- Use this output as your `JWT_SECRET` and `JWT_REFRESH_SECRET` in production.

---

## 9. Running the Development Servers

### Start everything (the daily workflow)
```bash
# Terminal 1: Start databases
cd /path/to/cleaner_book_app
docker compose up -d

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### Verify everything is connected
```bash
# Check databases
docker ps --filter name=serenity --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
**What it does:**
- `--format` customizes the output using Go template syntax.
- `{{.Names}}` is the container name, `{{.Status}}` is the status, `{{.Ports}}` shows port mappings.
- `table` adds column headers.

```bash
# Check backend is responding
curl -s http://localhost:5000/api/auth/me | head -c 100
```

```bash
# Check frontend is responding
curl -s http://localhost:3000 | head -c 100
```

### Kill a process using a specific port (if "port already in use")
```bash
# Find what's using port 5000
lsof -i :5000
```
**What it does:**
- `lsof` means "list open files" (in Unix, network connections are files).
- `-i :5000` filters to processes using port 5000.
- Shows PID (process ID), user, and command.

```bash
# Kill the process using port 5000
kill $(lsof -t -i :5000)
```
**What it does:**
- `lsof -t` outputs only the PID (just the number).
- `$(...)` captures that PID.
- `kill` sends a termination signal to that process.
- If it doesn't work, use `kill -9` (force kill).

---

## 10. Git & GitHub Setup

### Generate an SSH key
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```
**What it does:**
- `ssh-keygen` generates a new SSH key pair.
- `-t ed25519` specifies the algorithm. Ed25519 is modern, fast, and secure.
- `-C "email"` adds a comment (label) to identify the key.
- You'll be asked where to save it (press Enter for default `~/.ssh/id_ed25519`).
- You'll be asked for a passphrase (optional extra security).

**This creates two files:**
| File | Purpose |
|------|---------|
| `~/.ssh/id_ed25519` | **Private key** — NEVER share this. It's your identity. |
| `~/.ssh/id_ed25519.pub` | **Public key** — Add this to GitHub. It's safe to share. |

### Add the key to the SSH agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```
**What it does:**
- `ssh-agent` is a background process that holds your private keys in memory.
- `eval "$(ssh-agent -s)"` starts the agent and sets environment variables.
- `ssh-add` adds your private key to the agent so you don't need to enter the passphrase every time.

### Copy the public key to add to GitHub
```bash
cat ~/.ssh/id_ed25519.pub
```
Then go to https://github.com/settings/ssh/new and paste it.

### Test the SSH connection to GitHub
```bash
ssh -T git@github.com
```
**What it does:**
- `-T` disables terminal allocation (we just want to test, not open a shell).
- **Expected:** `Hi username! You've successfully authenticated, but GitHub does not provide shell access.`

### Create a GitHub repository (with GitHub CLI)
```bash
# Install GitHub CLI first:
sudo apt install gh
gh auth login

# Create the repo:
gh repo create cleaner_book_app --public --source=. --remote=origin --push
```
**What it does:**
- `gh repo create` creates a new repository on GitHub.
- `--public` makes it public (use `--private` for private).
- `--source=.` uses the current directory as the source.
- `--remote=origin` adds the GitHub URL as the "origin" remote.
- `--push` pushes the current branch immediately.

### Or manually (without gh CLI)
```bash
# 1. Create the repo on github.com/new first, then:
git remote add origin git@github.com:yourusername/cleaner_book_app.git
git branch -M main
git add -A
git commit -m "Initial commit"
git push -u origin main
```

### Create a feature branch
```bash
git checkout -b feature/booking-confirmation
```
**What it does:**
- `checkout -b` creates a new branch AND switches to it.
- `feature/booking-confirmation` is the branch name. The `feature/` prefix is a naming convention.

**Common branch naming conventions:**
| Prefix | Use case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `hotfix/` | Urgent production fixes |
| `refactor/` | Code restructuring |
| `docs/` | Documentation changes |

### See all branches
```bash
git branch -a
```
**What it does:**
- `git branch` lists local branches.
- `-a` (all) includes remote branches too (prefixed with `remotes/origin/`).
- The current branch is marked with `*`.

### Switch between branches
```bash
git checkout main
git checkout feature/booking-confirmation
```

### Merge a branch into main
```bash
git checkout main
git merge feature/booking-confirmation
```
**What it does:**
- First switch to `main` (the target branch).
- `merge` combines the feature branch's changes into `main`.
- If there are no conflicts, it creates a merge commit automatically.

### Delete a branch (after merging)
```bash
git branch -d feature/booking-confirmation           # Delete locally
git push origin --delete feature/booking-confirmation  # Delete on GitHub
```
**What it does:**
- `-d` deletes a branch (only if it's been merged).
- `-D` (capital) force-deletes even if not merged.
- `push origin --delete` removes the branch from the remote.

### View what changed
```bash
git diff                    # Unstaged changes (working directory vs staging area)
git diff --staged           # Staged changes (staging area vs last commit)
git diff main..feature/x    # Difference between two branches
git diff HEAD~3..HEAD       # Last 3 commits
```
**What it does:**
- Shows line-by-line additions (`+` green) and removals (`-` red).
- `HEAD` is the latest commit. `HEAD~3` is 3 commits ago.
- `..` means "from A to B".

### Undo changes
```bash
git checkout -- path/to/file.ts    # Discard changes in a specific file (before staging)
git restore path/to/file.ts        # Same as above (modern syntax)
git reset HEAD path/to/file.ts     # Unstage a file (keep changes in working directory)
git restore --staged path/to/file  # Same as above (modern syntax)
```

### Stash changes (save for later)
```bash
git stash                  # Save current changes and clean working directory
git stash list             # See all stashes
git stash pop              # Apply the most recent stash and remove it
git stash apply            # Apply the most recent stash but keep it in the list
git stash drop             # Delete the most recent stash
```
**When to use:** You're working on a feature but need to switch branches quickly. Stash saves your work without committing.

---

## 11. Docker Production Setup

### Create the backend Dockerfile
```bash
cat > docker/backend.Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/server.js"]
EOF
```
**This is a multi-stage build. Line-by-line:**

| Line | Purpose |
|------|---------|
| `FROM node:20-alpine AS builder` | Start from Node.js 20 on Alpine Linux. Name this stage "builder". |
| `WORKDIR /app` | Set the working directory inside the container. All subsequent commands run here. |
| `COPY package*.json ./` | Copy `package.json` and `package-lock.json`. The `*` matches both files. |
| `RUN npm ci` | Install dependencies. `ci` (clean install) is faster and more reliable than `install` — it uses the lockfile exactly. |
| `COPY backend/ ./` | Copy all source code. This is separate from `package.json` because of Docker layer caching — if dependencies don't change, Docker reuses the cached layer. |
| `RUN npx prisma generate` | Generate the Prisma client. |
| `RUN npm run build` | Compile TypeScript to JavaScript. |
| `FROM node:20-alpine` | **Second stage** — fresh, clean image. |
| `COPY --from=builder` | Copy only what we need from the builder stage. The builder stage (with dev dependencies, source code, TypeScript) is discarded. |
| `EXPOSE 5000` | Document that this container listens on port 5000. (Informational only — doesn't actually open the port.) |
| `CMD ["node", "dist/server.js"]` | The command to run when the container starts. |

**Why multi-stage?** The final image only has compiled JavaScript and production dependencies. It's smaller (no TypeScript compiler, no source code) and more secure.

### Create the frontend Dockerfile
```bash
cat > docker/frontend.Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
EOF
```
**Same multi-stage pattern.** Next.js standalone output is a self-contained server.

### Build and run production containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
**What it does:**
- `-f docker-compose.prod.yml` uses the production compose file (has all services: postgres, redis, backend, frontend, nginx).
- `--build` forces Docker to rebuild images even if they exist (picks up code changes).
- `-d` runs in background.

### View production logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
**What it does:**
- `logs` shows container output.
- `-f` follows (streams live logs).
- `backend` filters to just the backend service. Omit to see all services.

### Rebuild a single service
```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```
**What it does:** Only rebuilds and restarts the backend container. Other services keep running.

### Run a database migration inside the container
```bash
docker exec serenity-backend npx prisma migrate deploy
```
**What it does:** Applies pending migrations inside the running backend container.

---

## 12. CI/CD with GitHub Actions

### Understanding the workflow file
The file at `.github/workflows/deploy.yml` runs automatically when you push code.

```bash
mkdir -p .github/workflows
```

**Key concepts:**
- **Workflow:** An automated process defined in YAML. Triggered by events (push, PR, schedule).
- **Job:** A set of steps that runs on a virtual machine (runner).
- **Step:** A single task (run a command, use an action).

### Trigger the workflow manually (for testing)
```bash
gh workflow run deploy.yml
```
**What it does:** Manually triggers the CI/CD pipeline without pushing code.

### View workflow runs
```bash
gh run list --limit 5
```
**What it does:** Shows the last 5 workflow runs with their status (success/failure).

### View a specific run's logs
```bash
gh run view <run-id> --log
```
**What it does:** Shows the full output of a workflow run — useful for debugging failures.

---

## 13. Useful Day-to-Day Commands

### Watch for TypeScript errors while coding
```bash
cd backend && npx tsc --watch --noEmit
```
**What it does:**
- `--watch` continuously monitors for file changes.
- `--noEmit` only checks types without generating JavaScript.
- Keeps running and reports errors as you save files.

### Format all code
```bash
cd backend && npm run format
cd frontend && npm run format
```
**What it does:** Runs Prettier on all source files. Fixes indentation, quotes, semicolons, line length, etc.

### Check what npm packages are outdated
```bash
cd backend && npm outdated
cd frontend && npm outdated
```
**What it does:**
- Shows a table of packages with current, wanted, and latest versions.
- **Current:** What you have installed.
- **Wanted:** Latest version that satisfies your `package.json` range.
- **Latest:** The absolute latest version.

### Update packages
```bash
npm update                # Update to latest within semver range
npm update express        # Update a specific package
npm install express@5     # Install a specific major version
```

### Check for security vulnerabilities
```bash
npm audit
```
**What it does:**
- Scans your dependencies for known security vulnerabilities.
- Shows severity (low, moderate, high, critical) and affected packages.

```bash
npm audit fix             # Auto-fix vulnerabilities where possible
npm audit fix --force     # Fix even if it requires major version bumps (risky)
```

### Clear npm cache (when things get weird)
```bash
npm cache clean --force
```
**What it does:** Deletes the npm cache (`~/.npm`). Useful when packages seem corrupted or installs fail for no reason.

### Delete node_modules and reinstall (nuclear option)
```bash
rm -rf node_modules package-lock.json
npm install
```
**What it does:**
- `rm -rf` deletes recursively (`-r`) and forcefully (`-f`) without confirmation.
- Deleting `package-lock.json` means npm resolves fresh versions.
- `npm install` recreates everything from scratch.

**When to use:** When nothing else works — dependency conflicts, phantom errors, corrupted installs.

### Check disk usage of node_modules
```bash
du -sh backend/node_modules frontend/node_modules
```
**What it does:**
- `du` = disk usage.
- `-s` summary (total only, not every subfolder).
- `-h` human-readable sizes (MB, GB instead of bytes).

---

## 14. Troubleshooting

### "Port already in use"
```bash
lsof -i :5000           # Find what's using port 5000
kill -9 $(lsof -t -i :5000)  # Force kill it
```

### "Cannot find module" error
```bash
cd backend && npm install    # Reinstall dependencies
npx prisma generate          # Regenerate Prisma client
```

### Database connection refused
```bash
docker ps                    # Check if containers are running
docker compose up -d         # Start them if not
docker logs serenity-postgres  # Check for database errors
```

### Prisma migration drift (schema out of sync)
```bash
npx prisma migrate dev       # Creates a new migration to fix drift
# OR if you want to start fresh:
npx prisma migrate reset     # WARNING: deletes all data
```

### "ENOSPC: no space left on device" (Docker eating disk)
```bash
docker system df             # Show Docker disk usage
docker system prune -a       # Remove ALL unused images, containers, volumes
```
**Warning:** `prune -a` deletes everything not currently in use. Your data in named volumes is preserved, but unused images are deleted (they'll be re-downloaded on next build).

### Check Node.js memory usage
```bash
node --max-old-space-size=4096 dist/server.js
```
**What it does:** Increases Node.js heap memory limit to 4GB (default is ~1.5GB). Useful if you get "JavaScript heap out of memory" errors.

---

## 15. Full Command Reference Table

### System Setup
| Command | Purpose |
|---------|---------|
| `nvm install 20` | Install Node.js 20 |
| `sudo apt install docker.io` | Install Docker |
| `sudo usermod -aG docker $USER` | Add user to Docker group |
| `ssh-keygen -t ed25519` | Generate SSH key |

### Project Init
| Command | Purpose |
|---------|---------|
| `mkdir -p project/{backend,frontend}` | Create project structure |
| `npm init -y` | Initialize package.json |
| `npx tsc --init` | Initialize TypeScript |
| `npx create-next-app@14 frontend` | Create Next.js app |
| `npx prisma init` | Initialize Prisma |

### Dependencies
| Command | Purpose |
|---------|---------|
| `npm install <pkg>` | Install production dependency |
| `npm install -D <pkg>` | Install dev dependency |
| `npm ci` | Clean install from lockfile (CI/production) |
| `npm update` | Update within semver range |
| `npm audit` | Check for vulnerabilities |
| `npm outdated` | Show outdated packages |

### Database
| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Start PostgreSQL + Redis |
| `docker compose stop` | Stop containers |
| `npx prisma migrate dev --name X` | Create & apply migration |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma migrate reset` | Reset database (destructive) |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open visual DB browser |
| `npx prisma db seed` | Seed with test data |
| `npx prisma migrate status` | Check migration status |

### Development
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (backend or frontend) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm test` | Run tests (watch mode) |
| `npm run test:ci` | Run tests once |
| `npx tsc --noEmit` | Type check only |
| `npx tsc --watch --noEmit` | Type check continuously |

### Git
| Command | Purpose |
|---------|---------|
| `git init` | Initialize repository |
| `git add -A` | Stage all changes |
| `git commit -m "msg"` | Create commit |
| `git push -u origin main` | Push (first time) |
| `git push` | Push (subsequent) |
| `git checkout -b branch` | Create & switch branch |
| `git merge branch` | Merge branch |
| `git branch -d branch` | Delete branch |
| `git stash` / `git stash pop` | Save/restore work in progress |
| `git diff` | View changes |
| `git log --oneline -10` | View recent commits |

### Docker
| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Start services |
| `docker compose down` | Stop & remove services |
| `docker compose down -v` | Stop, remove, delete data |
| `docker compose logs -f` | Follow logs |
| `docker ps` | List running containers |
| `docker exec -it name cmd` | Run command in container |
| `docker system prune -a` | Clean up disk space |

### Debugging
| Command | Purpose |
|---------|---------|
| `lsof -i :PORT` | Find process on port |
| `kill -9 PID` | Force kill process |
| `docker logs container` | View container logs |
| `curl -s URL` | Test API endpoint |
| `npm cache clean --force` | Clear npm cache |
| `rm -rf node_modules && npm install` | Fresh reinstall |
