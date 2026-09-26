"use client";

import { AlertTriangle, AudioLines } from "lucide-react";
import { useEffect, useState } from "react";

import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { EXAMPLES } from "@/lib/constants";
import { analyzeText, ApiError } from "@/lib/api";
import { saveHistory } from "@/lib/history";
import type { AnalysisResult, ExamplePrompt } from "@/types/analysis";

import { AnalyzerInput } from "./AnalyzerInput";

interface Props {
  demoMode?: boolean;
}

export function AnalysisWorkbench({ demoMode = false }: Props) {
  const initial = demoMode ? EXAMPLES[2].text : EXAMPLES[0].text;
  const [text, setText] = useState(initial);
  const [includeResponse, setIncludeResponse] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(nextText = text) {
    if (!nextText.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeText(nextText, includeResponse);
      setResult(analysis);
      saveHistory(analysis);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unexpected analysis error");
    } finally {
      setLoading(false);
    }
  }

  function selectExample(example: ExamplePrompt) {
    setText(example.text);
    if (demoMode) void analyze(example.text);
  }

  useEffect(() => {
    const task = demoMode ? window.setTimeout(() => void analyze(initial), 0) : null;
    return () => {
      if (task !== null) window.clearTimeout(task);
    };
    // Demo mode intentionally runs once on entry; analysis dependencies must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  return (
    <main>
      {demoMode && (
        <div className="demo-banner">
          <span><AudioLines size={16} /> Judge demo mode</span>
          <p>Select a scenario to run the full explainable pipeline instantly.</p>
        </div>
      )}
      <div className="workbench-shell">
        <AnalyzerInput
          text={text}
          examples={EXAMPLES}
          loading={loading}
          includeResponse={includeResponse}
          onTextChange={setText}
          onIncludeResponseChange={setIncludeResponse}
          onAnalyze={() => void analyze()}
          onExample={selectExample}
        />
        {error && <div className="error-state" role="alert"><AlertTriangle size={19} /><div><strong>Analysis unavailable</strong><p>{error}</p></div></div>}
        {loading && <div className="analysis-skeleton" aria-label="Analyzing"><span /><span /><span /></div>}
        {!loading && result ? <AnalysisResults result={result} /> : !error && !loading ? (
          <div className="empty-state">
            <div className="empty-orbit"><span /><AudioLines size={28} /></div>
            <strong>Your language signal will appear here</strong>
            <p>Analyze the sample to see token labels, switch boundaries, native forms, meaning, intent, entities, and JSON.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
