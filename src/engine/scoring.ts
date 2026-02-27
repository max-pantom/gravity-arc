import type { MemoryUnit, Connection, Event } from "@/lib/db/schema";

export const RECENCY_HALFLIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const VISIT_WEIGHT = 0.25;
export const CONNECTION_WEIGHT = 0.25;
export const EDIT_WEIGHT = 0.25;
export const RECENCY_WEIGHT = 0.25;

export function recencyDecay(timestamp: number): number {
  const age = Date.now() - timestamp;
  return Math.exp(-(age * Math.LN2) / RECENCY_HALFLIFE_MS);
}

export function computeEnergyScore(
  memory: MemoryUnit,
  events: Event[],
  linkCount: number
): number {
  const viewCount = events.filter((e) => e.event_type === "view" || e.event_type === "revisit").length;
  const editCount = events.filter((e) => e.event_type === "edit").length;
  const linkEvents = events.filter((e) => e.event_type === "link").length;

  const recency = recencyDecay(memory.last_accessed);
  const visitScore = Math.min(1, (viewCount + 1) * 0.1);
  const connectionScore = Math.min(1, (linkCount + linkEvents) * 0.15);
  const editScore = Math.min(1, (editCount + 1) * 0.2);

  return (
    RECENCY_WEIGHT * recency +
    VISIT_WEIGHT * visitScore +
    CONNECTION_WEIGHT * connectionScore +
    EDIT_WEIGHT * editScore
  );
}

export function computeAttentionScore(
  memory: MemoryUnit,
  events: Event[],
  connections: Connection[]
): number {
  const recentEvents = events.filter((e) => Date.now() - e.timestamp < 24 * 60 * 60 * 1000);
  const recentViews = recentEvents.filter((e) => e.event_type === "view" || e.event_type === "revisit").length;
  const recentEdits = recentEvents.filter((e) => e.event_type === "edit").length;

  const connectionStrength = connections.reduce((sum, c) => sum + c.strength, 0);
  const baseAttention = Math.min(1, (recentViews + recentEdits * 2) * 0.2);
  const connectionBoost = Math.min(0.5, connectionStrength * 0.1);

  return baseAttention + connectionBoost;
}

export function computeRecallScore(
  memory: MemoryUnit,
  energyScore: number,
  attentionScore: number,
  connectionOverlap: number
): number {
  const base = (energyScore + attentionScore) / 2;
  const overlapBoost = Math.min(0.3, connectionOverlap * 0.1);
  return Math.min(1, base + overlapBoost);
}
