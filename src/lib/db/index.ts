import type { Card, CardType, Connection, Visit } from "./schema";
import {
  DB_NAME,
  DB_VERSION,
  CARDS_STORE,
  CONNECTIONS_STORE,
  VISITS_STORE,
} from "./schema";

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CARDS_STORE)) {
        const cardsStore = db.createObjectStore(CARDS_STORE, { keyPath: "id" });
        cardsStore.createIndex("created_at", "created_at", { unique: false });
        cardsStore.createIndex("updated_at", "updated_at", { unique: false });
      }
      if (!db.objectStoreNames.contains(CONNECTIONS_STORE)) {
        const connStore = db.createObjectStore(CONNECTIONS_STORE, {
          keyPath: "id",
        });
        connStore.createIndex("source_id", "source_id", { unique: false });
        connStore.createIndex("target_id", "target_id", { unique: false });
      }
      if (!db.objectStoreNames.contains(VISITS_STORE)) {
        const visitsStore = db.createObjectStore(VISITS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        visitsStore.createIndex("card_id", "card_id", { unique: false });
      }
    };
  });
}

function withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return openDB().then((db) => {
    return fn(db).finally(() => db.close());
  });
}

export async function createCard(
  content: string,
  type: CardType = "note",
  id?: string
): Promise<Card> {
  const now = Date.now();
  const card: Card = {
    id: id ?? crypto.randomUUID(),
    type,
    content,
    created_at: now,
    updated_at: now,
    visit_count: 0,
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, "readwrite");
      const store = tx.objectStore(CARDS_STORE);
      const req = store.add(card);
      req.onsuccess = () => resolve(card);
      req.onerror = () => reject(req.error);
    });
  });
}

function ensureCardType(card: Card): Card {
  if (!card.type) return { ...card, type: "note" };
  return card;
}

export async function getCard(id: string): Promise<Card | null> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, "readonly");
      const req = tx.objectStore(CARDS_STORE).get(id);
      req.onsuccess = () => {
        const c = req.result ?? null;
        resolve(c ? ensureCardType(c) : null);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function updateCard(
  id: string,
  updates: { content?: string; type?: CardType }
): Promise<Card | null> {
  const card = await getCard(id);
  if (!card) return null;

  const updated: Card = {
    ...card,
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.type !== undefined && { type: updates.type }),
    updated_at: Date.now(),
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, "readwrite");
      const req = tx.objectStore(CARDS_STORE).put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function deleteCard(id: string): Promise<boolean> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, "readwrite");
      const req = tx.objectStore(CARDS_STORE).delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function listCardsByCreated(limit = 100): Promise<Card[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, "readonly");
      const store = tx.objectStore(CARDS_STORE);
      const index = store.index("created_at");
      const req = index.openCursor(null, "prev");
      const results: Card[] = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && results.length < limit) {
          results.push(ensureCardType(cursor.value));
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function searchCards(query: string, limit = 20): Promise<Card[]> {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const all = await listCardsByCreated(500);
  return all
    .filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        extractTitle(c.content).toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function extractTitle(content: string): string {
  const firstLine = content.split("\n")[0]?.trim() ?? "";
  return firstLine.slice(0, 80) || "Untitled";
}

export async function connectionExists(
  sourceId: string,
  targetId: string
): Promise<boolean> {
  const conns = await getConnectionsForCard(sourceId);
  return conns.some(
    (c) =>
      (c.source_id === sourceId && c.target_id === targetId) ||
      (c.source_id === targetId && c.target_id === sourceId)
  );
}

export async function createConnection(
  sourceId: string,
  targetId: string,
  id?: string
): Promise<Connection> {
  const exists = await connectionExists(sourceId, targetId);
  if (exists) {
    const conns = await getConnectionsForCard(sourceId);
    const existing = conns.find(
      (c) =>
        (c.source_id === sourceId && c.target_id === targetId) ||
        (c.source_id === targetId && c.target_id === sourceId)
    );
    return existing!;
  }

  const now = Date.now();
  const connection: Connection = {
    id: id ?? crypto.randomUUID(),
    source_id: sourceId,
    target_id: targetId,
    created_at: now,
  };

  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONNECTIONS_STORE, "readwrite");
      const store = tx.objectStore(CONNECTIONS_STORE);
      const req = store.add(connection);
      req.onsuccess = () => resolve(connection);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getConnectionsForCard(cardId: string): Promise<Connection[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONNECTIONS_STORE, "readonly");
      const store = tx.objectStore(CONNECTIONS_STORE);
      const indexSrc = store.index("source_id");
      const indexTgt = store.index("target_id");
      const req1 = indexSrc.getAll(cardId);
      const req2 = indexTgt.getAll(cardId);

      Promise.all([
        new Promise<Connection[]>((res, rej) => {
          req1.onsuccess = () => res(req1.result ?? []);
          req1.onerror = () => rej(req1.error);
        }),
        new Promise<Connection[]>((res, rej) => {
          req2.onsuccess = () => res(req2.result ?? []);
          req2.onerror = () => rej(req2.error);
        }),
      ]).then(([fromSource, fromTarget]) => {
        const seen = new Set<string>();
        const all = [...fromSource, ...fromTarget];
        resolve(all.filter((c) => !seen.has(c.id) && (seen.add(c.id), true)));
      });
    });
  });
}

export async function recordVisit(cardId: string): Promise<void> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CARDS_STORE, VISITS_STORE], "readwrite");
      const cardsStore = tx.objectStore(CARDS_STORE);
      const visitsStore = tx.objectStore(VISITS_STORE);

      const getReq = cardsStore.get(cardId);
      getReq.onsuccess = () => {
        const card = getReq.result;
        if (card) {
          card.visit_count = (card.visit_count ?? 0) + 1;
          cardsStore.put(card);
        }
        visitsStore.add({ card_id: cardId, visited_at: Date.now() } as Visit);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

export async function getAllCards(): Promise<Card[]> {
  return listCardsByCreated(1000);
}

export async function getAllConnections(): Promise<Connection[]> {
  return withDB((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONNECTIONS_STORE, "readonly");
      const req = tx.objectStore(CONNECTIONS_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getRelatedCards(
  cardId: string,
  limit = 10
): Promise<Card[]> {
  const connections = await getConnectionsForCard(cardId);
  const relatedIds = new Set<string>();
  for (const c of connections) {
    const other = c.source_id === cardId ? c.target_id : c.source_id;
    relatedIds.add(other);
  }

  if (relatedIds.size === 0) return [];

  const all = await listCardsByCreated(200);
  const related = all.filter((c) => relatedIds.has(c.id));
  return related.slice(0, limit);
}
