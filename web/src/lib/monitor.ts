import {
  addIncident,
  clearDowntimeStartedAt,
  forceStatus,
  getState,
  recordFailure,
  recordSuccess,
  resolveIncident,
  setActiveIncidentId,
  setMonitoredUrl,
} from "@/lib/monitor-state";
import type { SystemStatus } from "@/lib/types";
import { formatDuration, sendDownEmail, sendRecoveredEmail } from "@/lib/emailjs";

type MonitorRunResult = {
  ok: boolean;
  status: SystemStatus;
  changed: boolean;
  message: string;
};

function getTargetUrl(): string {
  return process.env.MONITOR_TARGET_URL ?? "https://paveer.com";
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "paveer-system-health/1.0",
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function runMonitorOnce(): Promise<MonitorRunResult> {
  const targetUrl = getTargetUrl();
  setMonitoredUrl(targetUrl);

  const start = Date.now();

  try {
    const res = await fetchWithTimeout(targetUrl, 10_000);
    const latencyMs = Date.now() - start;

    const ok = res.ok;
    const transition = ok ? recordSuccess(latencyMs) : recordFailure();

    await handleTransitions(transition.previousStatus, transition.nextStatus, targetUrl);

    return {
      ok,
      status: transition.nextStatus,
      changed: transition.changed,
      message: ok ? "Check succeeded" : `Check failed with status ${res.status}`,
    };
  } catch {
    const transition = recordFailure();
    await handleTransitions(transition.previousStatus, transition.nextStatus, targetUrl);

    return {
      ok: false,
      status: transition.nextStatus,
      changed: transition.changed,
      message: "Check failed (timeout or network error)",
    };
  }
}

async function handleTransitions(
  previousStatus: SystemStatus,
  nextStatus: SystemStatus,
  monitoredUrl: string,
): Promise<void> {
  if (previousStatus === nextStatus) return;

  const state = getState();

  if (previousStatus !== "down" && nextStatus === "down") {
    const incidentId = addIncident({
      title: "Paveer.com outage",
      severity: "major",
      summary: "Automatic detection: repeated failed checks.",
    });
    setActiveIncidentId(incidentId);
    await sendDownEmail(monitoredUrl, new Date());
    return;
  }

  if (previousStatus === "down" && nextStatus !== "down") {
    const now = new Date();
    const start =
      state.downtimeStartedAt != null
        ? new Date(state.downtimeStartedAt)
        : state.activeIncidentId
          ? new Date(
              state.incidents.find((i) => i.id === state.activeIncidentId)?.createdAt ??
                now.toISOString(),
            )
          : null;
    const downtimeDuration = start ? formatDuration(start, now) : "Unknown";

    if (state.activeIncidentId) {
      resolveIncident(state.activeIncidentId, {
        resolution: "Automatic recovery detected: checks succeeded again.",
      });
      setActiveIncidentId(null);
    }

    await sendRecoveredEmail(monitoredUrl, now, downtimeDuration);
    clearDowntimeStartedAt();
  }
}

export async function simulateDown(): Promise<void> {
  const monitoredUrl = getTargetUrl();
  setMonitoredUrl(monitoredUrl);
  forceStatus("down");

  const incidentId = addIncident({
    title: "Paveer.com outage (simulated)",
    severity: "major",
    summary: "Manual simulation triggered for testing.",
  });
  setActiveIncidentId(incidentId);
  await sendDownEmail(monitoredUrl, new Date());
}

export async function simulateRecover(): Promise<void> {
  const monitoredUrl = getTargetUrl();
  setMonitoredUrl(monitoredUrl);

  const state = getState();
  const now = new Date();
  const start =
    state.downtimeStartedAt != null
      ? new Date(state.downtimeStartedAt)
      : state.activeIncidentId
        ? new Date(
            state.incidents.find((i) => i.id === state.activeIncidentId)?.createdAt ??
              now.toISOString(),
          )
        : null;
  const downtimeDuration = start ? formatDuration(start, now) : "Unknown";

  if (state.activeIncidentId) {
    resolveIncident(state.activeIncidentId, {
      resolution: "Manual simulation: recovery triggered.",
    });
    setActiveIncidentId(null);
  }

  forceStatus("operational");
  await sendRecoveredEmail(monitoredUrl, now, downtimeDuration);
  clearDowntimeStartedAt();
}
