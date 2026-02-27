export type CardType =
  | "idea"
  | "project"
  | "note"
  | "design"
  | "experiment"
  | "link";

export interface Card {
  id: string;
  type: CardType;
  content: string;
  created_at: number;
  updated_at: number;
  visit_count: number;
}

export interface Connection {
  id: string;
  source_id: string;
  target_id: string;
  created_at: number;
}

export interface Visit {
  id?: number;
  card_id: string;
  visited_at: number;
}

export const DB_NAME = "archive-db";
export const DB_VERSION = 1;
export const CARDS_STORE = "cards";
export const CONNECTIONS_STORE = "connections";
export const VISITS_STORE = "visits";
