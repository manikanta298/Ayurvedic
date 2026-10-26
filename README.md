# Ayushman Ayurvedic Center — Full-stack application

Complete editable frontend, Node.js backend, SQLite database initialization, appointment enquiry API, staff CLI, and integration tests. There is no `dist` directory and no frontend build step.

## Run locally

Requires Node.js 24.14 or newer in the 24.x release line. SQLite is included in Node; there are no external npm dependencies.

```bash
cp .env.example .env
npm start
```

Open **http://localhost:3000**. Use `npm run dev` for backend watch mode; refresh the browser after frontend edits. Opening the HTML as a local file cannot submit enquiries; run the server.

```bash
npm test
npm run check
```

## Source structure

```text
frontend/
  index.html                 Complete page and enquiry form
  style.css                  Responsive styles, motion, print rules
  app.js                     UI effects and backend form submission
  assets/                    Optimized, self-hosted WebP images
backend/
  server.js                  Configuration, startup, graceful shutdown
  app.js                     HTTP server, API routes, static assets, security headers
  database.js                SQLite schema and idempotent persistence
  validation.js              Shared service choices and server validation
  appointments.js            Staff CLI to review and update enquiries
tests/app.test.js           HTTP and database integration tests
.env.example                Environment template (no credentials)
package.json                 Run and test scripts
Dockerfile                   Optional container deployment
```

## Appointment flow

The visitor consents to storing basic enquiry details, submits the form, and receives an enquiry reference after the backend saves the record. The form has loading, error, retry and success states. Requests are validated server-side, limited to 4 KB, rate-limited and checked against the configured origin. An idempotency key prevents duplicate records after network retries. Names, contact numbers and service choices are never returned through a public listing API.

The optional WhatsApp link includes the enquiry reference only. No WhatsApp message is sent automatically. No email/SMS notification or automatic appointment confirmation is configured. Staff must monitor enquiries using the CLI and contact visitors to confirm availability.

## Staff operations

Run these on the server with authorized filesystem access. They use the same DATABASE_PATH as the application. The listing contains personal contact data; keep its output private.

```bash
npm run appointments -- list
npm run appointments -- status ENQUIRY_UUID contacted
npm run appointments -- status ENQUIRY_UUID confirmed
npm run appointments -- status ENQUIRY_UUID closed
```

Delete records older than your chosen retention period only after reviewing the clinic's retention policy:

```bash
npm run appointments -- purge 90 --confirm
```

This deletion is permanent. There is deliberately no public staff dashboard or unauthenticated record lookup.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| HOST | 127.0.0.1 | Listening address; use 0.0.0.0 inside a container |
| PORT | 3000 | HTTP port |
| PUBLIC_ORIGIN | http://localhost:3000 | Exact browser origin allowed to submit; set your HTTPS domain in production |
| DATABASE_PATH | ./data/ayushman.sqlite | Persistent database file outside the public frontend |
| RATE_LIMIT | 10 | Submissions per direct client IP per 15 minutes |
| NODE_ENV | development | Set production to require HTTPS origin and emit HSTS |

## Deployment

Use a Node.js server/container with a persistent disk. Set NODE_ENV=production and PUBLIC_ORIGIN to the exact HTTPS origin, and terminate TLS at a reverse proxy. The app serves both frontend and API from the same origin. This is a stateful single-instance deployment; plain static hosting and ephemeral serverless filesystems cannot persist this SQLite database.

```bash
docker build -t ayushman-clinic .
docker run --name ayushman-clinic --init -p 127.0.0.1:3000:3000 \
  -e PUBLIC_ORIGIN=https://clinic.example.com \
  -v ayushman-data:/app/data ayushman-clinic
```

Replace the example origin with the real clinic domain, then configure your HTTPS proxy. Docker configuration is provided; it has not been built in this environment.

Use encrypted disks, restricted server access, protected database backups, and a documented retention/deletion policy before collecting real visitor data. SQLite contents are not application-level encrypted. Rate limiting is in memory and uses the direct connection IP; behind a proxy, add per-client limits at the proxy because the app intentionally does not trust arbitrary X-Forwarded-For headers. For multi-instance traffic, replace SQLite with managed database storage and a shared rate limiter.

## API

- GET /api/health — health/database check
- GET /api/services — permitted service names
- POST /api/appointments — create an enquiry

The POST requires Content-Type: application/json, Origin matching PUBLIC_ORIGIN, and an Idempotency-Key containing a UUID v4. Body:

```json
{"name":"Example Visitor","phone":"+91 90000 00000","service":"Ayurvedic consultation","preferredDate":"","consent":true}
```

Returns 201 for new records, 200 for identical retries, 409 for changed data with a reused key, 422 for invalid fields, and 429 for rate-limited requests. Dates are checked in Asia/Kolkata and may be omitted or selected within the next year.

## Content and verification

Clinic history, staffing and service claims follow the client-supplied brief and require clinic record verification before public release. Photography is illustrative, sourced from Unsplash: photo-1466692476868-aef1dfb1e735, photo-1540555700478-4be289fbecef, photo-1544161515-4ab6ce6db874, photo-1608571423902-eed4a5ad8108.

Accessibility features include native timeline disclosures, labels, focus indicators, a skip link, reduced-motion support and a motion pause control. Browser/screen-reader testing and formal WCAG/government audit remain outstanding. Automated tests exercise real HTTP requests and database persistence. The earlier Sites link remains a separate static preview; this repository contains the full-stack server application.
