import type { AnalysisResult } from "@/types/analysis";

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const laptopHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (!laptopHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(configured)) return window.location.origin;
  return configured.replace(/\/$/, "");
}

export class ApiError extends Error {}

export async function analyzeText(text: string, includeResponse: boolean): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${apiOrigin()}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, include_response: includeResponse }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detail = typeof payload?.detail === "string" ? payload.detail : "Analysis failed";
      throw new ApiError(detail);
    }
    return response.json() as Promise<AnalysisResult>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Analysis timed out. Check that the API is running and try again.");
    }
    throw new ApiError("Could not reach the analysis API. Check your connection and try again.");
  } finally {
    window.clearTimeout(timeout);
  }
}
