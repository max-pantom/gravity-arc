import type { MemoryUnit, Connection, Event } from "@/lib/db/schema";
import {
  computeEnergyScore,
  computeAttentionScore,
  computeRecallScore,
} from "./scoring";

export interface RecallInput {
  memories: MemoryUnit[];
  connections: Connection[];
  eventsByMemory: Map<string, Event[]>;
}

export function computeRecallScores(input: RecallInput): Map<string, number> {
  const scores = new Map<string, number>();
  const connectionCountByMemory = new Map<string, number>();
  const connectionsByMemory = new Map<string, Connection[]>();

  for (const c of input.connections) {
    connectionCountByMemory.set(c.from, (connectionCountByMemory.get(c.from) ?? 0) + 1);
    connectionCountByMemory.set(c.to, (connectionCountByMemory.get(c.to) ?? 0) + 1);
    for (const id of [c.from, c.to]) {
      const list = connectionsByMemory.get(id) ?? [];
      list.push(c);
      connectionsByMemory.set(id, list);
    }
  }

  const memoryById = new Map(input.memories.map((m) => [m.id, m]));

  for (const memory of input.memories) {
    const events = input.eventsByMemory.get(memory.id) ?? [];
    const conns = connectionsByMemory.get(memory.id) ?? [];
    const linkCount = connectionCountByMemory.get(memory.id) ?? memory.link_count;

    const energy = computeEnergyScore(memory, events, linkCount);
    const attention = computeAttentionScore(memory, events, conns);

    const connectedIds = new Set<string>();
    for (const c of conns) {
      connectedIds.add(c.from === memory.id ? c.to : c.from);
    }
    let overlap = 0;
    for (const otherId of connectedIds) {
      const otherConns = connectionsByMemory.get(otherId) ?? [];
      const shared = otherConns.filter((c) => {
        const other = c.from === otherId ? c.to : c.from;
        return connectedIds.has(other) && other !== memory.id;
      });
      overlap += shared.length;
    }

    const recall = computeRecallScore(memory, energy, attention, overlap);
    scores.set(memory.id, recall);
  }

  return scores;
}

export function getResurfacingMemories(
  memories: MemoryUnit[],
  recallScores: Map<string, number>,
  minScore: number,
  limit: number
): MemoryUnit[] {
  return memories
    .filter((m) => m.status !== "archived")
    .filter((m) => (recallScores.get(m.id) ?? 0) >= minScore)
    .sort((a, b) => (recallScores.get(b.id) ?? 0) - (recallScores.get(a.id) ?? 0))
    .slice(0, limit);
}
