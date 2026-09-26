import type { AnalysisResult, HistoryEntry } from "@/types/analysis";

const STORAGE_KEY = "polyglot-pulse-history";
const MAX_ENTRIES = 20;

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(result: AnalysisResult): void {
  const entries = readHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    result,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...entries].slice(0, MAX_ENTRIES)));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
