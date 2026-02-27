import type {
  MemoryUnit,
  MemoryType,
  MemoryMetadata,
  Connection,
  ConnectionKind,
  Event,
  EventType,
} from "@/lib/db/schema";
import {
  DB_NAME,
  DB_VERSION,
  MEMORIES_STORE,
  CONNECTIONS_STORE,
  EVENTS_STORE,
} from "@/lib/db/schema";

const LEGACY_CARDS_STORE = "cards";
const LEGACY_CONNECTIONS_STORE = "connections";
const LEGACY_VISITS_STORE = "visits";

async function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("IndexedDB not available");
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const oldVersion = e.oldVersion;

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
          const store = db.createObjectStore(MEMORIES_STORE, { keyPath: "id" });
          store.createIndex("created_at", "created_at", { unique: false });
          store.createIndex("updated_at", "updated_at", { unique: false });
          store.createIndex("recall_score", "recall_score", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
        if (!db.objectStoreNames.contains(CONNECTIONS_STORE)) {
          const store = db.createObjectStore(CONNECTIONS_STORE, { keyPath: "id" });
          store.createIndex("from", "from", { unique: false });
          store.createIndex("to", "to", { unique: false });
        }
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const store = db.createObjectStore(EVENTS_STORE, { keyPath: "id" });
          store.createIndex("memory_id", "memory_id", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      }

      if (oldVersion >= 2 && db.objectStoreNames.contains(LEGACY_CARDS_STORE)) {
        db.deleteObjectStore(LEGACY_CARDS_STORE);
      }
      if (oldVersion >= 2 && db.objectStoreNames.contains(LEGACY_CONNECTIONS_STORE)) {
        db.deleteObjectStore(LEGACY_CONNECTIONS_STORE);
      }
      if (oldVersion >= 2 && db.objectStoreNames.contains(LEGACY_VISITS_STORE)) {
        db.deleteObjectStore(LEGACY_VISITS_STORE);
      }
    };
  });

  if (db.version >= 2 && db.version < 4 && db.objectStoreNames.contains(LEGACY_CARDS_STORE)) {
    await migrateV1ToV2(db);
    db.close();
    return openDB();
  }

  return db;
}

async function migrateV1ToV2(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(
    [LEGACY_CARDS_STORE, LEGACY_CONNECTIONS_STORE, LEGACY_VISITS_STORE, MEMORIES_STORE, CONNECTIONS_STORE],
    "readwrite"
  );

  const [cards, conns, visits] = await Promise.all([
    new Promise<unknown[]>((r, rej) => {
      const req = tx.objectStore(LEGACY_CARDS_STORE).getAll();
      req.onsuccess = () => r(req.result ?? []);
      req.onerror = () => rej(req.error);
    }),
    new Promise<unknown[]>((r, rej) => {
      const req = tx.objectStore(LEGACY_CONNECTIONS_STORE).getAll();
      req.onsuccess = () => r(req.result ?? []);
      req.onerror = () => rej(req.error);
    }),
    new Promise<unknown[]>((r, rej) => {
      const req = tx.objectStore(LEGACY_VISITS_STORE).getAll();
      req.onsuccess = () => r(req.result ?? []);
      req.onerror = () => rej(req.error);
    }),
  ]);

  const visitByCard = new Map<string, number>();
  for (const v of visits as { card_id: string; visited_at: number }[]) {
    const t = v.visited_at ?? 0;
    const cur = visitByCard.get(v.card_id) ?? 0;
    if (t > cur) visitByCard.set(v.card_id, t);
  }

  const memStore = tx.objectStore(MEMORIES_STORE);
  const connStore = tx.objectStore(CONNECTIONS_STORE);

  for (const c of cards as { id: string; type: string; content: string; created_at: number; updated_at: number }[]) {
    const lastAcc = visitByCard.get(c.id) ?? c.updated_at;
    memStore.put({
      id: c.id,
      type: c.type ?? "note",
      content: c.content,
      created_at: c.created_at,
      updated_at: c.updated_at,
      energy_score: 0,
      attention_score: 0,
      recall_score: 0,
      link_count: 0,
      last_accessed: lastAcc,
      status: "active",
    });
  }
  for (const c of conns as { id: string; source_id: string; target_id: string; created_at: number }[]) {
    connStore.put({
      id: c.id,
      from: c.source_id,
      to: c.target_id,
      kind: "reference",
      strength: 1,
      created_at: c.created_at,
    });
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return openDB().then((db) => fn(db).finally(() => db.close()));
}

export async function createMemory(
  content: string,
  type: MemoryType = "note",
  id?: string,
  metadata?: MemoryMetadata
): Promise<MemoryUnit> {
  const now = Date.now();
  const memory: MemoryUnit = {
    id: id ?? crypto.randomUUID(),
    type,
    content,
    created_at: now,
    updated_at: now,
    energy_score: 0,
    attention_score: 0,
    recall_score: 0,
    link_count: 0,
    last_accessed: now,
    status: "active",
    ...(metadata && { metadata }),
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEMORIES_STORE, "readwrite");
      const req = tx.objectStore(MEMORIES_STORE).add(memory);
      req.onsuccess = () => resolve(memory);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getMemory(id: string): Promise<MemoryUnit | null> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const req = db.transaction(MEMORIES_STORE, "readonly").objectStore(MEMORIES_STORE).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function updateMemory(
  id: string,
  updates: Partial<Pick<MemoryUnit, "content" | "type" | "status" | "metadata">>
): Promise<MemoryUnit | null> {
  const memory = await getMemory(id);
  if (!memory) return null;

  const updated: MemoryUnit = {
    ...memory,
    ...updates,
    updated_at: Date.now(),
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const req = db.transaction(MEMORIES_STORE, "readwrite").objectStore(MEMORIES_STORE).put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function deleteMemory(id: string): Promise<boolean> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const req = db.transaction(MEMORIES_STORE, "readwrite").objectStore(MEMORIES_STORE).delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function listMemoriesByCreated(limit = 500): Promise<MemoryUnit[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const store = db.transaction(MEMORIES_STORE, "readonly").objectStore(MEMORIES_STORE);
      const index = store.index("created_at");
      const req = index.openCursor(null, "prev");
      const results: MemoryUnit[] = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getAllMemories(): Promise<MemoryUnit[]> {
  return listMemoriesByCreated(1000);
}

export async function getAllConnections(): Promise<Connection[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const req = db.transaction(CONNECTIONS_STORE, "readonly").objectStore(CONNECTIONS_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getConnectionsForMemory(memoryId: string): Promise<Connection[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const store = db.transaction(CONNECTIONS_STORE, "readonly").objectStore(CONNECTIONS_STORE);
      const fromReq = store.index("from").getAll(memoryId);
      const toReq = store.index("to").getAll(memoryId);

      Promise.all([
        new Promise<Connection[]>((res, rej) => {
          fromReq.onsuccess = () => res(fromReq.result ?? []);
          fromReq.onerror = () => rej(fromReq.error);
        }),
        new Promise<Connection[]>((res, rej) => {
          toReq.onsuccess = () => res(toReq.result ?? []);
          toReq.onerror = () => rej(toReq.error);
        }),
      ]).then(([from, to]) => {
        const seen = new Set<string>();
        const all = [...from, ...to];
        resolve(all.filter((c) => !seen.has(c.id) && (seen.add(c.id), true)));
      });
    });
  });
}

export async function createConnection(
  fromId: string,
  toId: string,
  kind: ConnectionKind = "reference",
  strength = 1,
  id?: string
): Promise<Connection> {
  const conns = await getConnectionsForMemory(fromId);
  const exists = conns.some(
    (c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );
  if (exists) {
    const existing = conns.find(
      (c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
    )!;
    return existing;
  }

  const now = Date.now();
  const connection: Connection = {
    id: id ?? crypto.randomUUID(),
    from: fromId,
    to: toId,
    kind,
    strength,
    created_at: now,
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const req = db.transaction(CONNECTIONS_STORE, "readwrite").objectStore(CONNECTIONS_STORE).add(connection);
      req.onsuccess = () => resolve(connection);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function recordEvent(memoryId: string, eventType: EventType): Promise<void> {
  const event: Event = {
    id: crypto.randomUUID(),
    memory_id: memoryId,
    event_type: eventType,
    timestamp: Date.now(),
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([EVENTS_STORE, MEMORIES_STORE], "readwrite");
      const eventsStore = tx.objectStore(EVENTS_STORE);
      const memoriesStore = tx.objectStore(MEMORIES_STORE);

      eventsStore.add(event);

      const getReq = memoriesStore.get(memoryId);
      getReq.onsuccess = () => {
        const mem = getReq.result;
        if (mem) {
          mem.last_accessed = Date.now();
          memoriesStore.put(mem);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

export async function getEventsForMemory(memoryId: string, limit = 100): Promise<Event[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const store = db.transaction(EVENTS_STORE, "readonly").objectStore(EVENTS_STORE);
      const index = store.index("memory_id");
      const req = index.openCursor(IDBKeyRange.only(memoryId), "prev");
      const results: Event[] = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function searchMemories(query: string, limit = 20): Promise<MemoryUnit[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const all = await listMemoriesByCreated(500);
  const title = (c: MemoryUnit) => c.content.split("\n")[0]?.trim().slice(0, 80) ?? "";
  return all
    .filter(
      (m) =>
        m.content.toLowerCase().includes(q) || title(m).toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function extractTitle(content: string): string {
  return content.split("\n")[0]?.trim().slice(0, 80) ?? "Untitled";
}
