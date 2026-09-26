export type LanguageCode = "en" | "hi" | "te" | "ambiguous" | "unknown" | "technical";

export interface LanguageCandidate {
  language: LanguageCode;
  heuristic_score: number;
}

export interface TokenAnalysis {
  index: number;
  text: string;
  language: LanguageCode;
  language_name: string;
  script: "latin" | "devanagari" | "telugu" | "common" | "mixed";
  category: "word" | "technical" | "url" | "number" | "emoji" | "punctuation" | "unknown";
  transliterated: boolean;
  native_form: string | null;
  normalized: string | null;
  meaning: string | null;
  heuristic_confidence: number | null;
  candidates: LanguageCandidate[];
}

export interface AnalysisResult {
  schema_version: string;
  original_text: string;
  normalized_text: string;
  normalized_meaning: string;
  detected_languages: string[];
  dominant_language: string;
  language_distribution: Record<string, number>;
  code_switching: {
    detected: boolean;
    switch_count: number;
    points: Array<{ after_token_index: number; from_language: string; to_language: string }>;
  };
  tokens: TokenAnalysis[];
  intent: { label: string; heuristic_confidence: number; evidence: string[] };
  entities: Array<{ text: string; type: string; normalized_value: string | null; token_indexes: number[] }>;
  pipeline: Array<{ key: string; label: string; status: "completed" | "degraded" | "skipped"; summary: string }>;
  response: string | null;
  caveats: string[];
}

export interface ExamplePrompt {
  id: string;
  label: string;
  text: string;
  note: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  result: AnalysisResult;
}
