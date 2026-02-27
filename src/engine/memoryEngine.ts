import type { MemoryUnit, MemoryType } from "@/lib/db/schema";
import type { Cluster } from "./clustering";
import {
  getAllMemories,
  getAllConnections,
  getEventsForMemory,
  createMemory,
  updateMemory,
  recordEvent,
  createConnection,
  getConnectionsForMemory,
  searchMemories,
  extractTitle,
} from "@/storage/indexedDbAdapter";
import { computeRecallScores, getResurfacingMemories } from "./recall";
import { detectClusters } from "./clustering";

const NOW_DAYS = 2;
const RESURFACING_MIN_SCORE = 0.15;
const RESURFACING_LIMIT = 8;
const NOW_LIMIT = 12;
const CLUSTER_LIMIT = 5;

export interface NowSection {
  memories: MemoryUnit[];
}

export interface ResurfacingSection {
  memories: MemoryUnit[];
}

export interface ClustersSection {
  clusters: Cluster[];
}

export interface HomeState {
  now: NowSection;
  resurfacing: ResurfacingSection;
  clusters: ClustersSection;
  recallScores: Map<string, number>;
  memoriesById: Map<string, MemoryUnit>;
}

export async function getHomeState(): Promise<HomeState> {
  const [memories, connections] = await Promise.all([
    getAllMemories(),
    getAllConnections(),
  ]);

  const eventsByMemory = new Map<string, Awaited<ReturnType<typeof getEventsForMemory>>>();
  await Promise.all(
    memories.map(async (m) => {
      const events = await getEventsForMemory(m.id, 50);
      eventsByMemory.set(m.id, events);
    })
  );

  const recallScores = computeRecallScores({
    memories,
    connections,
    eventsByMemory,
  });

  const nowCutoff = Date.now() - NOW_DAYS * 24 * 60 * 60 * 1000;
  const nowMemories = memories
    .filter((m) => m.updated_at >= nowCutoff || m.created_at >= nowCutoff)
    .sort((a, b) => Math.max(b.updated_at, b.created_at) - Math.max(a.updated_at, a.created_at))
    .slice(0, NOW_LIMIT);

  const resurfacingMemories = getResurfacingMemories(
    memories.filter((m) => !nowMemories.some((n) => n.id === m.id)),
    recallScores,
    RESURFACING_MIN_SCORE,
    RESURFACING_LIMIT
  );

  const clusters = detectClusters(memories, connections, 2, CLUSTER_LIMIT);

  const memoriesById = new Map(memories.map((m) => [m.id, m]));

  return {
    now: { memories: nowMemories },
    resurfacing: { memories: resurfacingMemories },
    clusters: { clusters },
    recallScores,
    memoriesById,
  };
}

export async function createMemoryUnit(
  content: string,
  implicitType?: MemoryType
): Promise<MemoryUnit> {
  const type = implicitType ?? inferType(content);
  return createMemory(content, type);
}

export function inferType(content: string): MemoryType {
  const trimmed = content.trim();
  if (trimmed.startsWith("data:image/")) return "image";
  if (trimmed.length < 140) return "idea";
  if (/^[\s]*[-*]\s+\[[\sx]\]/m.test(trimmed) || /^\d+\.\s+\[[\sx]\]/m.test(trimmed))
    return "project";
  if (/!\[.*?\]\(.*?\)|\.(png|jpg|jpeg|gif|webp|svg)\b/i.test(trimmed)) return "design";
  if (/https?:\/\/\S+/i.test(trimmed)) return "link";
  return "note";
}

export async function recordMemoryView(memoryId: string): Promise<void> {
  await recordEvent(memoryId, "view");
}

export async function recordMemoryEdit(memoryId: string): Promise<void> {
  await recordEvent(memoryId, "edit");
}

export async function recordMemoryLink(memoryId: string): Promise<void> {
  await recordEvent(memoryId, "link");
}

export {
  getMemory,
  updateMemory,
  deleteMemory,
  createConnection,
  getConnectionsForMemory,
  searchMemories,
  extractTitle,
  recordEvent,
} from "@/storage/indexedDbAdapter";
