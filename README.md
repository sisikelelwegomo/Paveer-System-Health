# Paveer System Health

Production-ready status page for monitoring uptime, logging incidents, and notifying users when systems go down or recover.

## What this is

This project builds a public-facing status page that shows:

- Current system status (Operational / Degraded / Down)
- Historical incidents (with timestamps, descriptions, and resolution notes)
- Real-time updates based on uptime checks and incident tracking

Incident tracking is handled via incident.io.

## Core features

- Uptime monitoring for a target URL (e.g., https://paveer.com)
- Automatic incident creation/updates in incident.io
- Public status page UI with current status + incident history
- Email notifications for DOWN and RECOVERED events (with timestamps)
- Failure simulation support to prove detection and logging

## Tech stack

- Status page: Next.js
- Hosting: Cloudfare or vercel
- Incident management: incident.io
- Email provider: (fill in) SendGrid / Mailgun / SES / etc.

## Local setup

1. Clone the repo
2. Install dependencies (based on the chosen stack)
3. Configure environment variables (see below)
4. Start the dev server

## Configuration

Create an environment file (example keys below) and provide values for your setup:

- `MONITOR_TARGET_URL` — URL to monitor
- `CHECK_INTERVAL_SECONDS` — how often to run checks
- `INCIDENT_IO_API_KEY` — incident.io API token
- `INCIDENT_IO_WORKSPACE` — workspace identifier (if required by your integration)
- `EMAIL_FROM` — sender address
- `EMAIL_TO` — recipient address(es)
- `EMAIL_PROVIDER_API_KEY` — API key for your mailing provider

## Testing failure scenarios

Recommended demonstrations:

- Force the monitored endpoint to return 5xx or time out
- Verify an incident is created with a start timestamp and description
- Restore the endpoint
- Verify the incident is updated/closed with an end timestamp and resolution
- Confirm DOWN and RECOVERED emails are sent with timestamps

## Deployment

Deploy the status page so it is publicly accessible (e.g., `status.<your-domain>.com`).

Deployment checklist:

- Environment variables set in the hosting platform
- Monitoring job runs on schedule (or via a serverless/cron provider)
- Status page is reachable publicly and stable

## Deliverables

- Live status page URL: (fill in)
- Public GitHub repository: https://github.com/sisikelelwegomo/Paveer-System-Health
- Evidence of testing and incident logging: (fill in)
- Email notification examples with timestamps: (fill in)

