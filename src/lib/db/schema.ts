export type MemoryType =
  | "idea"
  | "project"
  | "note"
  | "design"
  | "experiment"
  | "link"
  | "image";

export type MemoryStatus = "active" | "dormant" | "archived" | "resurfacing";

export interface MemoryMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
}

export interface MemoryUnit {
  id: string;
  type: MemoryType;
  content: string;
  created_at: number;
  updated_at: number;
  energy_score: number;
  attention_score: number;
  recall_score: number;
  link_count: number;
  last_accessed: number;
  status: MemoryStatus;
  metadata?: MemoryMetadata;
}

export type ConnectionKind =
  | "expands"
  | "contradicts"
  | "inspired_by"
  | "next_step"
  | "reference";

export interface Connection {
  id: string;
  from: string;
  to: string;
  kind: ConnectionKind;
  strength: number;
  created_at: number;
}

export type EventType = "view" | "edit" | "link" | "revisit";

export interface Event {
  id: string;
  memory_id: string;
  event_type: EventType;
  timestamp: number;
}

export const DB_NAME = "archive-db";
export const DB_VERSION = 4;
export const MEMORIES_STORE = "memories";
export const CONNECTIONS_STORE = "conns";
export const EVENTS_STORE = "events";
