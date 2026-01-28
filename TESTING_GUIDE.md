# Software Testing Guide - Serenity Project

A comprehensive testing reference for the Serenity cleaning service app.
Every command is explained so you understand what it does and why.

---

## Table of Contents

1. [Prerequisites - Starting the Environment](#1-prerequisites---starting-the-environment)
2. [Database Testing](#2-database-testing)
3. [API Testing with cURL](#3-api-testing-with-curl)
4. [Complete Booking Workflow Test](#4-complete-booking-workflow-test)
5. [The New Awaiting Confirmation Flow](#5-the-new-awaiting-confirmation-flow)
6. [Negative / Edge Case Testing](#6-negative--edge-case-testing)
7. [Authentication & Security Testing](#7-authentication--security-testing)
8. [WebSocket / Real-Time Testing](#8-websocket--real-time-testing)
9. [Frontend Testing](#9-frontend-testing)
10. [Performance & Load Testing](#10-performance--load-testing)
11. [Code Quality & Static Analysis](#11-code-quality--static-analysis)
12. [Database Integrity Checks](#12-database-integrity-checks)
13. [Docker / Production Testing](#13-docker--production-testing)
14. [Automated Test Suite (Jest)](#14-automated-test-suite-jest)
15. [Test Reporting Cheatsheet](#15-test-reporting-cheatsheet)

---

## 1. Prerequisites - Starting the Environment

Before any testing, you need the services running.

### Start the database containers
```bash
docker start serenity-postgres serenity-redis
```
**What it does:**
- Starts two Docker containers: PostgreSQL (the database) and Redis (caching/sessions).
- These must be running before the backend can connect.
- `docker start` resumes stopped containers. If they don't exist yet, use the docker-compose commands below.

### Verify containers are running
```bash
docker ps --filter name=serenity
```
**What it does:**
- `docker ps` lists running containers.
- `--filter name=serenity` shows only containers with "serenity" in the name.
- You should see both `serenity-postgres` and `serenity-redis` with status "Up".

**What to check:** The STATUS column should say "Up X minutes/hours", NOT "Exited".

### Start the backend server
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm run dev
```
**What it does:**
- `npm run dev` runs the script defined in `package.json` → `ts-node-dev --respawn --transpile-only src/server.ts`
- `ts-node-dev` runs TypeScript directly without compiling first, and auto-restarts on file changes.
- The server starts on port 5000.

**What to check:** You should see a message like "Server running on port 5000" and no errors.

### Start the frontend server (in a separate terminal)
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/frontend && npm run dev
```
**What it does:**
- Starts the Next.js development server on port 3000 (or next available).
- Provides hot module replacement — changes appear instantly in the browser.

### Quick health check
```bash
curl -s http://localhost:5000/api/auth/me | head -c 200
```
**What it does:**
- `curl -s` makes an HTTP request silently (no progress bar).
- Hitting `/api/auth/me` without a token should return an authentication error — that's GOOD. It means the server is running and responding.
- `head -c 200` limits output to first 200 characters (prevents huge responses flooding your terminal).

**Expected:** Something like `{"success":false,"message":"No token provided"}` — this means the server is alive and auth is working.

---

## 2. Database Testing

### Open Prisma Studio (visual database browser)
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npx prisma studio
```
**What it does:**
- Opens a web-based GUI at `http://localhost:5555`.
- Lets you browse all tables, view records, edit data, and filter.
- Extremely useful for verifying that API calls actually changed the database.

**When to use:** When you want to visually verify data after running tests.

### Query the database directly via command line
```bash
docker exec -it serenity-postgres psql -U serenity -d serenity
```
**What it does:**
- `docker exec` runs a command inside a running container.
- `-it` makes it interactive (you can type SQL commands).
- `psql` is the PostgreSQL command-line client.
- `-U serenity` connects as user "serenity".
- `-d serenity` connects to database "serenity".

**You're now in a SQL shell.** Type SQL commands followed by `;`:

### Check the BookingStatus enum has our new value
```sql
SELECT enum_range(NULL::public."BookingStatus");
```
**What it does:**
- Shows all values in the `BookingStatus` enum.
- You should see: `{PENDING,CONFIRMED,IN_PROGRESS,AWAITING_CONFIRMATION,COMPLETED,CANCELLED,REFUNDED}`
- This verifies the migration ran correctly.

### Count bookings by status
```sql
SELECT status, COUNT(*) FROM bookings GROUP BY status ORDER BY status;
```
**What it does:**
- Groups all bookings by their status and counts each group.
- Useful to get a quick overview of test data state.

### Find all bookings in AWAITING_CONFIRMATION
```sql
SELECT id, status, "userId", "cleanerId", "completedAt" FROM bookings WHERE status = 'AWAITING_CONFIRMATION';
```
**What it does:**
- Finds bookings stuck in the new status.
- `"completedAt"` should be NULL (it gets set only when the customer confirms).
- Note: PostgreSQL requires double quotes for camelCase column names.

### Check notifications were created
```sql
SELECT id, type, title, message, "userId", "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 10;
```
**What it does:**
- Shows the 10 most recent notifications.
- After a "complete" action, you should see type `BOOKING_AWAITING_CONFIRMATION`.
- After a "confirm-completion", you should see type `BOOKING_COMPLETED`.

### Exit the SQL shell
```sql
\q
```

---

## 3. API Testing with cURL

cURL is the most fundamental API testing tool. Every tester should master it.

### Anatomy of a cURL command
```
curl -X POST              → HTTP method (GET, POST, PATCH, DELETE)
     -H "Header: Value"   → Set a header (like Authorization)
     -d '{"key":"val"}'   → Request body (JSON data)
     -s                   → Silent mode (no progress bar)
     -w "\n%{http_code}"  → Print HTTP status code at the end
     URL                  → The endpoint to hit
```

### Register a test user
```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@example.com",
    "password": "Test12345",
    "firstName": "Test",
    "lastName": "User"
  }' | python3 -m json.tool
```
**What it does:**
- `POST /api/auth/register` creates a new user account.
- `-H "Content-Type: application/json"` tells the server we're sending JSON.
- `-d '{...}'` is the JSON body with user details.
- `| python3 -m json.tool` pretty-prints the JSON response (makes it readable).
- The `\` at end of lines is a line continuation — it's still one command.

**What to check:** Response should have `"success": true` and return user data with an ID.

### Login and capture the token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "Test12345"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo $TOKEN
```
**What it does:**
- Sends a login request and extracts the `accessToken` from the JSON response.
- `TOKEN=$(...)` captures the output into a shell variable called `TOKEN`.
- The `python3 -c "..."` part is a one-liner that parses JSON and pulls out the token.
- `echo $TOKEN` prints the token so you can verify it was captured.

**Why this matters:** Almost every endpoint requires authentication. By storing the token in a variable, we can reuse it in all subsequent commands.

**Alternative (simpler but requires jq):**
```bash
# Install jq first: sudo apt install jq
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test123@example.com", "password": "Test12345"}' \
  | jq -r '.data.accessToken')
```
`jq` is a command-line JSON processor. `-r` outputs raw strings without quotes.

### Login as cleaner (for dual-role testing)
```bash
CLEANER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "cleaner@example.com", "password": "Cleaner123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo $CLEANER_TOKEN
```
**What it does:** Same as above but logs in as the cleaner account. Now you have two tokens to simulate both sides of the booking.

### Get current user info (verify token works)
```bash
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```
**What it does:**
- `GET /api/auth/me` returns the currently authenticated user's profile.
- `Bearer $TOKEN` is the standard JWT authentication header format.
- This verifies the token is valid and identifies which user it belongs to.

**What to check:** Should return the user's name, email, and role.

---

## 4. Complete Booking Workflow Test

This is an end-to-end test of the entire booking lifecycle. Run these in order.

### Step 1: Customer creates a booking
```bash
BOOKING_ID=$(curl -s -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cleanerId": "PASTE_CLEANER_PROFILE_ID_HERE",
    "scheduledDate": "2026-02-15",
    "scheduledTime": "10:00",
    "duration": 3,
    "cleaningType": "REGULAR",
    "address": "123 Test Street",
    "city": "Athens",
    "state": "AT",
    "zipCode": "10001"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

echo "Created booking: $BOOKING_ID"
```
**What it does:**
- Creates a booking as the customer.
- Captures the booking ID into `$BOOKING_ID` for use in later steps.
- The pricing (subtotal, fees, tax) is calculated server-side from the cleaner's hourly rate.

**What to check:**
- Status should be `PENDING`
- Pricing fields should be populated
- A notification should be created for the cleaner

### Step 2: Cleaner confirms the booking
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/confirm \
  -H "Authorization: Bearer $CLEANER_TOKEN" | python3 -m json.tool
```
**What it does:** The cleaner accepts the booking request. Status: `PENDING` → `CONFIRMED`.

**What to check:** `confirmedAt` should now have a timestamp.

### Step 3: Cleaner starts the job
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/start \
  -H "Authorization: Bearer $CLEANER_TOKEN" | python3 -m json.tool
```
**What it does:** Cleaner begins the cleaning. Status: `CONFIRMED` → `IN_PROGRESS`.

**What to check:** `startedAt` should now have a timestamp.

### Step 4: Cleaner marks job as complete
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -H "Authorization: Bearer $CLEANER_TOKEN" | python3 -m json.tool
```
**What it does:** Cleaner says "I'm done". Status: `IN_PROGRESS` → `AWAITING_CONFIRMATION`.

**What to check:**
- Status should be `AWAITING_CONFIRMATION` (NOT `COMPLETED`)
- `completedAt` should still be NULL
- A notification with type `BOOKING_AWAITING_CONFIRMATION` should exist for the customer

### Step 5: Customer confirms completion
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/confirm-completion \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```
**What it does:** Customer confirms the job was done properly. Status: `AWAITING_CONFIRMATION` → `COMPLETED`.

**What to check:**
- Status should be `COMPLETED`
- `completedAt` should now have a timestamp
- The cleaner's `totalBookings` should have incremented by 1
- A notification with type `BOOKING_COMPLETED` should exist for the cleaner

### Verify the cleaner's stats incremented
```bash
curl -s http://localhost:5000/api/cleaners/me/stats \
  -H "Authorization: Bearer $CLEANER_TOKEN" | python3 -m json.tool
```

---

## 5. The New Awaiting Confirmation Flow

### Test the DISPUTE path (alternative to confirming)

First, create a new booking and advance it to AWAITING_CONFIRMATION (repeat Steps 1-4 above), then:

```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/dispute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "The kitchen was not cleaned properly"}' | python3 -m json.tool
```
**What it does:** Customer disputes — job goes back to `IN_PROGRESS` so the cleaner can address the issue.

**What to check:**
- Status should be `IN_PROGRESS` (reverted from AWAITING_CONFIRMATION)
- A notification with type `BOOKING_DISPUTED` should exist for the cleaner
- The notification message should include the reason

### After dispute, cleaner can mark complete again
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -H "Authorization: Bearer $CLEANER_TOKEN" | python3 -m json.tool
```
**What it does:** Re-enters the confirmation cycle. This verifies the dispute → re-complete → confirm loop works.

---

## 6. Negative / Edge Case Testing

These tests verify the system REJECTS invalid operations. **Expecting errors is correct here.**

### 6.1 Wrong user tries to confirm completion (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/confirm-completion \
  -H "Authorization: Bearer $CLEANER_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**What it does:** The cleaner tries to confirm completion (only the customer should be able to).

**Expected:** HTTP 403 and message "Only the customer can confirm completion".

### 6.2 Wrong user tries to dispute (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/dispute \
  -H "Authorization: Bearer $CLEANER_TOKEN" \
  -d '{"reason": "test"}' \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 403 — only customers can dispute.

### 6.3 Confirm completion on wrong status (should fail)
```bash
# Try to confirm-completion on a PENDING booking
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/confirm-completion \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 400 — cannot confirm completion unless status is `AWAITING_CONFIRMATION`.

### 6.4 Complete a booking that isn't IN_PROGRESS (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -H "Authorization: Bearer $CLEANER_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 400 if the booking isn't in `IN_PROGRESS` status.

### 6.5 Access without authentication (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 401 — no token provided.

### 6.6 Access with invalid token (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -H "Authorization: Bearer invalid_token_here_12345" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 401 — invalid token.

### 6.7 Non-existent booking (should fail)
```bash
curl -s -X POST http://localhost:5000/api/bookings/nonexistent_id_123/complete \
  -H "Authorization: Bearer $CLEANER_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 404 — booking not found.

### 6.8 Double completion (idempotency check)
```bash
# After the cleaner already marked complete (status is AWAITING_CONFIRMATION),
# try to complete again:
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/complete \
  -H "Authorization: Bearer $CLEANER_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 400 — status is AWAITING_CONFIRMATION, not IN_PROGRESS.

### 6.9 Double confirm (idempotency check)
```bash
# After customer already confirmed (status is COMPLETED),
# try to confirm again:
curl -s -X POST http://localhost:5000/api/bookings/$BOOKING_ID/confirm-completion \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 400 — cannot confirm a COMPLETED booking.

---

## 7. Authentication & Security Testing

### 7.1 Test registration validation
```bash
# Missing required fields
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "bad@example.com"}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 400 — missing password, firstName, lastName.

### 7.2 Test duplicate email registration
```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "Test12345",
    "firstName": "Duplicate",
    "lastName": "User"
  }' -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** Error — email already exists.

### 7.3 Test wrong password login
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test123@example.com", "password": "WrongPassword"}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 401 — invalid credentials.

### 7.4 Test expired token (manual)
```bash
# Copy your token, wait for it to expire (1 hour), then:
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer PASTE_EXPIRED_TOKEN_HERE" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 401 — token expired.

### 7.5 Test refresh token flow
```bash
# After login, you get both accessToken and refreshToken
REFRESH_TOKEN="paste_refresh_token_here"

curl -s -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | python3 -m json.tool
```
**Expected:** New access token returned.

### 7.6 SQL injection attempt (should be safe with Prisma)
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "\" OR 1=1 --", "password": "anything"}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** Normal auth failure (401), NOT a database error. Prisma uses parameterized queries which prevent SQL injection.

### 7.7 XSS payload in user input (should be stored safely)
```bash
curl -s -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cleanerId": "CLEANER_ID",
    "scheduledDate": "2026-03-01",
    "scheduledTime": "10:00",
    "duration": 2,
    "cleaningType": "REGULAR",
    "address": "<script>alert(1)</script>",
    "city": "Test",
    "state": "TS",
    "zipCode": "12345"
  }' | python3 -m json.tool
```
**What to check:** The address should be stored as plain text, not executed. When rendered on the frontend, React auto-escapes HTML by default.

---

## 8. WebSocket / Real-Time Testing

### Install wscat (WebSocket testing tool)
```bash
npm install -g wscat
```
**What it does:** Installs `wscat` globally — a command-line tool for connecting to WebSocket servers, similar to how cURL works for HTTP.

### Connect to the Socket.io server
```bash
wscat -c "ws://localhost:5000/socket.io/?EIO=4&transport=websocket"
```
**What it does:**
- Opens a WebSocket connection to the Socket.io server.
- `EIO=4` specifies Engine.IO protocol version 4.
- `transport=websocket` forces WebSocket (instead of HTTP polling).

**Note:** Socket.io uses a custom protocol on top of WebSocket. For proper testing, a browser-based approach or a Node script is more reliable:

### Node.js Socket.io test script
```bash
node -e "
const { io } = require('socket.io-client');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Join as the customer user
  socket.emit('join', 'PASTE_CUSTOMER_USER_ID');
  console.log('Joined user room');
});

socket.on('booking-status-changed', (data) => {
  console.log('=== BOOKING STATUS CHANGED ===');
  console.log('Booking ID:', data.bookingId);
  console.log('New Status:', data.status);
  console.log('Notification:', data.notification.title);
  console.log('Message:', data.notification.message);
  console.log('==============================');
});

socket.on('disconnect', () => console.log('Disconnected'));
console.log('Listening for events... (press Ctrl+C to stop)');
"
```
**What it does:**
- Connects to the Socket.io server as a customer.
- Joins the user's room (so they receive personal notifications).
- Listens for `booking-status-changed` events.
- When the cleaner marks a job complete, you'll see the event printed in real-time.

**How to test:**
1. Run this script in one terminal (as the customer).
2. In another terminal, use cURL to mark a booking as complete (as the cleaner).
3. The script should immediately print the notification.

---

## 9. Frontend Testing

### Build the frontend (catches TypeScript errors)
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/frontend && npm run build
```
**What it does:**
- Compiles the entire Next.js app for production.
- TypeScript errors, import errors, and build failures will surface here.
- This is a critical gate — if it doesn't build, it can't deploy.

**What to check:** Should complete with "Compiled successfully" and no errors.

### Run TypeScript type checking only
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/frontend && npx tsc --noEmit
```
**What it does:**
- `tsc` is the TypeScript compiler.
- `--noEmit` means "check types but don't generate JavaScript files".
- Faster than a full build when you only want to verify type correctness.

**Common issues caught:** Missing properties on interfaces (like when we added `AWAITING_CONFIRMATION` to the status type).

### Run the linter
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/frontend && npm run lint
```
**What it does:**
- Runs ESLint to find code quality issues, unused variables, missing dependencies, etc.
- Next.js includes sensible defaults.

### Backend linting
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm run lint
```

### Backend TypeScript compilation check
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm run build
```
**What it does:** Compiles backend TypeScript to JavaScript. Any type errors will fail the build.

---

## 10. Performance & Load Testing

### Install Apache Bench (comes with most Linux distros)
```bash
sudo apt install apache2-utils
```

### Basic load test on a GET endpoint
```bash
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/bookings
```
**What it does:**
- `ab` is Apache Bench, a simple HTTP load testing tool.
- `-n 100` total number of requests to make.
- `-c 10` number of concurrent (simultaneous) requests.
- `-H` adds a header (our auth token).

**Key metrics to check:**
| Metric | Good Value |
|--------|------------|
| Requests per second | > 50 for API endpoints |
| Time per request (mean) | < 200ms |
| Failed requests | 0 |
| Non-2xx responses | 0 |

### Test rate limiting
```bash
for i in $(seq 1 20); do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}'
  echo ""
done
```
**What it does:**
- `for i in $(seq 1 20)` loops 20 times.
- `seq 1 20` generates numbers 1 through 20.
- `-o /dev/null` discards the response body.
- `-w "%{http_code}"` prints only the HTTP status code.
- `echo -n` prints without a newline; `echo ""` adds a newline after.

**Expected:** First requests return 401 (wrong password), then at some point you should start getting 429 (Too Many Requests) because of rate limiting on auth routes.

**Why this matters:** Rate limiting prevents brute-force attacks on login endpoints.

---

## 11. Code Quality & Static Analysis

### Check for TODO/FIXME/HACK comments
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.ts" --include="*.tsx" \
  /home/menelaosas/Documents/Projects/cleaner_book_app/backend/src \
  /home/menelaosas/Documents/Projects/cleaner_book_app/frontend/src
```
**What it does:**
- `grep -rn` searches recursively with line numbers.
- `\|` is OR in grep (finds any of these patterns).
- `--include` limits to TypeScript files only.
- These comments often indicate unfinished work or known issues.

### Check for hardcoded secrets
```bash
grep -rn "password\|secret\|api_key\|apikey" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  /home/menelaosas/Documents/Projects/cleaner_book_app/backend/src \
  /home/menelaosas/Documents/Projects/cleaner_book_app/frontend/src
```
**What it does:** Scans for potentially hardcoded credentials. Any matches should be environment variables, not literal strings.

### Check that .env files are NOT committed
```bash
git ls-files | grep -i "\.env"
```
**What it does:**
- `git ls-files` lists all files tracked by git.
- If any `.env` files appear, they've been committed — this is a security risk.

**Expected:** No output (meaning no .env files are tracked).

### Verify .gitignore is working
```bash
git status --ignored --short | grep "\.env"
```
**What it does:** Shows ignored files. `.env` and `.env.local` should appear with `!!` prefix (meaning they exist but are ignored).

---

## 12. Database Integrity Checks

### Connect to the database
```bash
docker exec -it serenity-postgres psql -U serenity -d serenity
```

### Check for orphaned bookings (bookings with no valid user)
```sql
SELECT b.id, b."userId"
FROM bookings b
LEFT JOIN users u ON b."userId" = u.id
WHERE u.id IS NULL;
```
**What it does:** Finds bookings where the customer user has been deleted but the booking still exists. Should return 0 rows if referential integrity is maintained.

### Check for orphaned bookings (no valid cleaner)
```sql
SELECT b.id, b."cleanerId"
FROM bookings b
LEFT JOIN users u ON b."cleanerId" = u.id
WHERE u.id IS NULL;
```

### Verify pricing calculations are correct
```sql
SELECT id,
  "hourlyRate",
  "totalHours",
  subtotal,
  "serviceFee",
  tax,
  "totalAmount",
  ROUND(("hourlyRate" * "totalHours")::numeric, 2) AS expected_subtotal,
  ROUND(("hourlyRate" * "totalHours" * 0.15)::numeric, 2) AS expected_fee,
  ROUND(("hourlyRate" * "totalHours" * 0.08)::numeric, 2) AS expected_tax
FROM bookings
WHERE subtotal != ROUND(("hourlyRate" * "totalHours")::numeric, 2);
```
**What it does:** Finds bookings where the subtotal doesn't match hourly rate x hours. Should return 0 rows.

### Check for reviews on non-completed bookings (data integrity)
```sql
SELECT r.id, r."bookingId", b.status
FROM reviews r
JOIN bookings b ON r."bookingId" = b.id
WHERE b.status != 'COMPLETED';
```
**What it does:** Reviews should only exist for completed bookings. Any results indicate a logic bug.

### Check notification counts per type
```sql
SELECT type, COUNT(*) FROM notifications GROUP BY type ORDER BY COUNT(*) DESC;
```
**What it does:** Overview of all notification types generated. Useful for verifying the new notification types exist.

---

## 13. Docker / Production Testing

### Build production containers
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app && docker-compose -f docker-compose.prod.yml up -d --build
```
**What it does:**
- `-f docker-compose.prod.yml` specifies the production compose file.
- `up` creates and starts containers.
- `-d` runs in detached mode (background).
- `--build` forces a fresh build of the Docker images.

### View production logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```
**What it does:**
- Shows logs from all containers.
- `-f` follows (streams new logs in real-time, like `tail -f`).
- Press `Ctrl+C` to stop following.

### Check container resource usage
```bash
docker stats --no-stream
```
**What it does:**
- Shows CPU, memory, network, and disk I/O for each container.
- `--no-stream` shows a single snapshot instead of live updates.

**What to check:** Memory usage should be reasonable (not continuously growing which would indicate a memory leak).

### Stop production containers
```bash
docker-compose -f docker-compose.prod.yml down
```
**What it does:** Stops and removes all containers defined in the compose file. Data in volumes is preserved.

---

## 14. Automated Test Suite (Jest)

### Run all backend tests
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm test
```
**What it does:**
- Runs Jest in watch mode — reruns tests when files change.
- Press `a` to run all tests, `q` to quit, `f` to run only failed tests.

### Run tests once (for CI/CD)
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm run test:ci
```
**What it does:**
- `--ci` runs tests once and exits (no watch mode).
- Used in CI/CD pipelines (GitHub Actions).
- Returns exit code 0 if all pass, 1 if any fail.

### Run a specific test file
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npx jest booking.test.ts --verbose
```
**What it does:**
- Runs only tests in `booking.test.ts`.
- `--verbose` shows each individual test case name and result.

### Run tests matching a pattern
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npx jest --testPathPattern="auth" --verbose
```
**What it does:** Runs only test files with "auth" in their path.

### Run tests with coverage report
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npx jest --coverage
```
**What it does:**
- Runs all tests AND generates a code coverage report.
- Shows percentage of lines, branches, functions, and statements covered.
- Creates an HTML report in `coverage/lcov-report/index.html`.

**Coverage metrics:**
| Metric | What it measures | Good target |
|--------|-----------------|-------------|
| Statements | % of code statements executed | > 80% |
| Branches | % of if/else paths tested | > 70% |
| Functions | % of functions called | > 80% |
| Lines | % of code lines executed | > 80% |

---

## 15. Test Reporting Cheatsheet

### Quick full-system smoke test (run all at once)
```bash
echo "=== 1. Backend builds ===" && \
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && npm run build && \
echo "=== 2. Backend lint ===" && \
npm run lint && \
echo "=== 3. Frontend builds ===" && \
cd /home/menelaosas/Documents/Projects/cleaner_book_app/frontend && npm run build && \
echo "=== 4. Frontend lint ===" && \
npm run lint && \
echo "=== ALL CHECKS PASSED ==="
```
**What it does:**
- Runs 4 checks in sequence. If any fails, the chain stops.
- `&&` ensures each step only runs if the previous succeeded.
- A quick way to verify the whole project is in good shape before pushing.

### Save test results to a file
```bash
cd /home/menelaosas/Documents/Projects/cleaner_book_app/backend && \
npx jest --ci --verbose 2>&1 | tee test-results.txt
```
**What it does:**
- `tee` splits output: shows it on screen AND saves to `test-results.txt`.
- `2>&1` captures both stdout and stderr.
- Useful for attaching test results to bug reports or PRs.

---

## Test Scenarios Matrix

Use this table to track manual test execution:

| # | Scenario | Method | Endpoint | Expected Status | Expected Result |
|---|----------|--------|----------|----------------|-----------------|
| 1 | Register new user | POST | /api/auth/register | 201 | User created |
| 2 | Register duplicate email | POST | /api/auth/register | 400 | Error |
| 3 | Login valid credentials | POST | /api/auth/login | 200 | Tokens returned |
| 4 | Login wrong password | POST | /api/auth/login | 401 | Error |
| 5 | Get profile with token | GET | /api/auth/me | 200 | User data |
| 6 | Get profile without token | GET | /api/auth/me | 401 | Error |
| 7 | Create booking | POST | /api/bookings | 201 | Booking PENDING |
| 8 | Create booking missing fields | POST | /api/bookings | 400 | Error |
| 9 | Cleaner confirms booking | POST | /api/bookings/:id/confirm | 200 | CONFIRMED |
| 10 | Customer tries to confirm booking | POST | /api/bookings/:id/confirm | 403 | Error |
| 11 | Cleaner starts job | POST | /api/bookings/:id/start | 200 | IN_PROGRESS |
| 12 | Start non-confirmed booking | POST | /api/bookings/:id/start | 400 | Error |
| 13 | Cleaner completes job | POST | /api/bookings/:id/complete | 200 | AWAITING_CONFIRMATION |
| 14 | Complete non-in-progress booking | POST | /api/bookings/:id/complete | 400 | Error |
| 15 | Customer confirms completion | POST | /api/bookings/:id/confirm-completion | 200 | COMPLETED |
| 16 | Cleaner tries to confirm completion | POST | /api/bookings/:id/confirm-completion | 403 | Error |
| 17 | Confirm already completed | POST | /api/bookings/:id/confirm-completion | 400 | Error |
| 18 | Customer disputes | POST | /api/bookings/:id/dispute | 200 | IN_PROGRESS |
| 19 | Cleaner tries to dispute | POST | /api/bookings/:id/dispute | 403 | Error |
| 20 | Dispute non-awaiting booking | POST | /api/bookings/:id/dispute | 400 | Error |
| 21 | Dispute → re-complete → confirm | POST | multiple | 200 | COMPLETED |
| 22 | Cancel pending booking | POST | /api/bookings/:id/cancel | 200 | CANCELLED |
| 23 | Cancel completed booking | POST | /api/bookings/:id/cancel | 400 | Error |
| 24 | Non-existent booking | POST | /api/bookings/fake/complete | 404 | Error |
| 25 | Socket notification on complete | WS | booking-status-changed | - | Customer notified |
| 26 | Socket notification on confirm | WS | booking-status-changed | - | Cleaner notified |
| 27 | Socket notification on dispute | WS | booking-status-changed | - | Cleaner notified |
| 28 | Rate limiting on auth | POST | /api/auth/login (x20) | 429 | Too many requests |
| 29 | SQL injection attempt | POST | /api/auth/login | 401 | Normal error |
| 30 | List upcoming includes AWAITING | GET | /api/bookings?upcoming=true | 200 | Includes AWAITING_CONFIRMATION |
