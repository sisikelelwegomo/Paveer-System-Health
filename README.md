# Paveer System Health

A status page that monitors uptime for **[paveer.com](https://paveer.com)**, logs incidents locally (in-memory), and notifies users when the system goes down or recovers.

**Live status page:** https://status.sisikelelwegomo.com *(fill in)*
**Public repository:** https://github.com/sisikelelwegomo/Paveer-System-Health

---

## What this monitors

This system performs continuous uptime checks against **https://paveer.com** and reports:

- Current system status (Operational / Degraded / Down)
- Historical incidents from the past 24 hours, with timestamps and descriptions
- Real-time recovery status when paveer.com comes back online

---

## Features

- HTTP uptime monitoring for https://paveer.com on a configurable interval
- Local incident logging (in-memory) with timestamps
- Public status page showing current status and recent incident history (last 24 hours)
- Email alerts (DOWN and RECOVERED) with timestamps via EmailJS
- Failure simulation support for testing detection and logging end-to-end

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Status page UI | Next.js | Fast UI iteration, built-in API routes, deploys easily |
| Hosting | Vercel | Best-in-class Next.js support, straightforward CI/CD |
| Email alerts | EmailJS | Simple email sending via template-based API, suitable for low-volume status alerts |

---

## Architecture

```
+-------------------+
| End users         |
+---------+---------+
          | HTTPS
          v
+-------------------+        +--------------------+
| Next.js status UI  | -----> | Status API routes  |
| (public website)   |        | (/api/...)         |
+---------+---------+        +---------+----------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
          +-------------------+                   +-------------------+
          | Local incidents   |                   | App storage       |
          | (in-memory)       |                   | (optional cache)  |
          +---------+---------+                   +-------------------+
                    ^
                    | creates/updates incidents
      +-------------+-----------------------------+
      | Monitoring job (scheduled)               |
      | - HTTP checks → https://paveer.com       |
      | - state transitions + incident updates   |
      +-------------+-----------------------------+
                    |
                    v
          +-------------------+
          | EmailJS           |
          | (DOWN/RECOVERED)  |
          +-------------------+
```

### Data flow

1. Monitoring job runs every `CHECK_INTERVAL_SECONDS` and performs an HTTP check against https://paveer.com
2. Results map to a status:
   - **Operational** — checks succeed within SLO threshold
   - **Degraded** — high latency or intermittent errors
   - **Down** — repeated failures or hard timeouts
3. On state change:
   - Incident created/updated in the local incident log
   - Email sent via EmailJS with timestamp and status change
4. Status page reads the local incident log and renders current state + incident history

### Reliability design

- **Flap prevention** — requires N consecutive failures before marking DOWN, and N consecutive successes before marking RECOVERED
- **Idempotency** — monitoring job stores the active incident ID so re-runs don't duplicate incidents
- **Observability** — lightweight log of check results and state transitions for debugging

---

## Local setup

### Prerequisites

- Node.js 18+
- An EmailJS account (service + template configured)
- (Optional) A cron provider for scheduled monitoring in production

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/sisikelelwegomo/Paveer-System-Health.git
cd Paveer-System-Health

# 2. Install dependencies
cd web
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# 4. Start the development server
npm run dev
```

The status page will be available at http://localhost:3000.

To trigger a monitoring check locally:

```bash
curl -X POST http://localhost:3000/api/monitor
```

---

## Environment variables

Create `web/.env.local` (or set these in your hosting platform):

```env
# Monitoring
MONITOR_TARGET_URL=https://paveer.com
CHECK_INTERVAL_SECONDS=60

# Email (EmailJS)
EMAIL_PROVIDER=emailjs
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
EMAIL_FROM=your_sender_email
EMAIL_TO=your_recipient_email
```

A `.env.example` file with all required keys (no values) is included in the repository.

---

## Email notifications

Alerts are sent via EmailJS when paveer.com changes state:

- **DOWN email** — sent when the site fails N consecutive checks
- **RECOVERED email** — sent when the site passes N consecutive checks after being down

**Email format:**

- **Subject:** `Paveer System Health: DOWN` or `Paveer System Health: RECOVERED`
- **Body:** Monitored URL (https://paveer.com), timestamp, new status

### EmailJS setup

1. Create an EmailJS account at https://www.emailjs.com
2. Create an Email Service (Gmail/Outlook/custom SMTP provider)
3. Create an Email Template with variables for status alerts (status, monitored_url, timestamp, downtime_duration, to_email)
4. Copy the service ID, template ID, and keys into your environment variables

---

## Simulating failures

To test the full detection and alerting pipeline:

```bash
cd web

# Trigger a real check (use a scheduler/cron to call this in production)
curl -X POST http://localhost:3000/api/monitor

# Simulate a DOWN event
curl -X POST http://localhost:3000/api/admin -H "Content-Type: application/json" -d "{\"action\":\"simulate-down\"}"

# Simulate RECOVERED
curl -X POST http://localhost:3000/api/admin -H "Content-Type: application/json" -d "{\"action\":\"simulate-recover\"}"
```

**What to verify after a failure simulation:**

- DOWN email received with correct timestamp
- RECOVERED email received with correct timestamp

---

## Deployment

The status page is deployed to Vercel and publicly accessible at:

**https://status.sisikelelwegomo.com** *(fill in)*

### Deployment checklist

- [ ] Environment variables set in Vercel (not committed to the repo)
- [ ] Monitoring job scheduled (via Vercel Cron, GitHub Actions, or a cron provider)
- [ ] Status page is publicly reachable and returns HTTP 200
- [ ] Test DOWN → RECOVERED cycle verified on the live deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Deliverables

| Item | Link |
|---|---|
| Live status page | *(fill in)* |
| Public GitHub repository | https://github.com/sisikelelwegomo/Paveer-System-Health |
| Incident log evidence | *(fill in — screenshot)* |
| DOWN email example | *(fill in — screenshot with timestamp)* |
| RECOVERED email example | *(fill in — screenshot with timestamp)* |

---

## References

- [EmailJS](https://www.emailjs.com) — email sending service
- [paveer.com](https://paveer.com) — monitored target
