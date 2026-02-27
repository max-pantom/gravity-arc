import type { MemoryUnit, Connection } from "@/lib/db/schema";

export interface Cluster {
  id: string;
  memoryIds: string[];
  label: string;
  density: number;
}

export function detectClusters(
  memories: MemoryUnit[],
  connections: Connection[],
  minClusterSize = 2,
  maxClusters = 5
): Cluster[] {
  const memoryById = new Map(memories.map((m) => [m.id, m]));
  const adjacency = new Map<string, Set<string>>();

  for (const m of memories) {
    adjacency.set(m.id, new Set());
  }
  for (const c of connections) {
    if (memoryById.has(c.from) && memoryById.has(c.to)) {
      adjacency.get(c.from)!.add(c.to);
      adjacency.get(c.to)!.add(c.from);
    }
  }

  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  for (const memory of memories) {
    if (visited.has(memory.id)) continue;

    const component: string[] = [];
    const stack = [memory.id];

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);

      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }

    if (component.length >= minClusterSize) {
      const edges = component.reduce((sum, id) => sum + (adjacency.get(id)?.size ?? 0), 0) / 2;
      const maxEdges = (component.length * (component.length - 1)) / 2;
      const density = maxEdges > 0 ? edges / maxEdges : 0;

      const labels = component
        .map((id) => memoryById.get(id)?.content.split("\n")[0]?.trim().slice(0, 30) ?? "")
        .filter(Boolean);
      const label = labels[0] ?? "Cluster";

      clusters.push({
        id: crypto.randomUUID(),
        memoryIds: component,
        label,
        density,
      });
    }
  }

  return clusters
    .sort((a, b) => b.density - a.density)
    .slice(0, maxClusters);
}
