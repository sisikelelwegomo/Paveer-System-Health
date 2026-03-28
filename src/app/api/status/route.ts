import { NextResponse } from "next/server";
import { getIncidentsLast24Hours, getState } from "@/lib/monitor-state";
import type { StatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  const state = getState();
  const incidents = getIncidentsLast24Hours();

  const response: StatusResponse = {
    status: state.currentStatus,
    monitoredUrl: state.monitoredUrl,
    lastCheckedAt: state.lastCheckedAt,
    lastStateChangeAt: state.lastStateChangeAt,
    downtimeStartedAt: state.downtimeStartedAt,
    lastLatencyMs: state.lastLatencyMs,
    activeIncidentId: state.activeIncidentId,
    incidents,
  };

  return NextResponse.json(response);
}
