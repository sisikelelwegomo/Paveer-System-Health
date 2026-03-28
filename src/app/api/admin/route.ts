import { NextRequest, NextResponse } from "next/server";
import { simulateDown, simulateRecover } from "@/lib/monitor";
import { addIncident, resolveIncident } from "@/lib/monitor-state";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const action: string | undefined = body?.action;

    if (action === "simulate-down") {
      await simulateDown();
      return NextResponse.json({ success: true });
    }

    if (action === "simulate-recover") {
      await simulateRecover();
      return NextResponse.json({ success: true });
    }

    if (action === "seed-examples") {
      const now = Date.now();

      const checkoutIncidentId = addIncident({
        title: "Checkout errors preventing payment",
        severity: "major",
        category: "engineering",
        urgency: "high",
        planned: false,
        summary:
          "A subset of users are unable to complete checkout due to repeated 5xx responses.",
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      });

      const riderIncidentId = addIncident({
        title: "Delivery capacity constrained (riders not on shift)",
        severity: "major",
        category: "operational",
        urgency: "high",
        planned: false,
        summary:
          "Delivery times increased significantly due to insufficient rider coverage in multiple regions.",
        createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        status: "resolved",
        resolvedAt: new Date(now - 7.25 * 60 * 60 * 1000).toISOString(),
        resolution: "Shift coverage restored; backlogs cleared; ETAs stabilized.",
      });

      const hotfixId = addIncident({
        title: "Hotfix deployment (planned) to reduce error rate",
        severity: "minor",
        category: "engineering",
        urgency: "high",
        planned: true,
        summary:
          "Planned emergency release to address a known regression before peak traffic.",
        createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
        status: "resolved",
        resolvedAt: new Date(now - 19.5 * 60 * 60 * 1000).toISOString(),
        resolution: "Patch deployed; dashboards confirmed recovery.",
      });

      return NextResponse.json({
        success: true,
        incidents: [checkoutIncidentId, riderIncidentId, hotfixId],
      });
    }

    if (action === "declare-incident") {
      const title: string | undefined = body?.title;
      const summary: string | undefined = body?.summary;
      const severity: "minor" | "major" | "critical" = body?.severity ?? "major";
      const category: "engineering" | "product" | "operational" = body?.category ?? "engineering";
      const urgency: "low" | "high" = body?.urgency ?? "high";
      const planned: boolean = body?.planned ?? false;

      if (!title) {
        return NextResponse.json(
          { success: false, message: "Missing title" },
          { status: 400 },
        );
      }

      const id = addIncident({
        title,
        summary,
        severity,
        category,
        urgency,
        planned,
      });

      return NextResponse.json({ success: true, incidentId: id });
    }

    if (action === "resolve-incident") {
      const incidentId: string | undefined = body?.incidentId;
      const resolution: string | undefined = body?.resolution;
      const cause: string | undefined = body?.cause;

      if (!incidentId) {
        return NextResponse.json(
          { success: false, message: "Missing incidentId" },
          { status: 400 },
        );
      }

      resolveIncident(incidentId, { resolution, cause });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
