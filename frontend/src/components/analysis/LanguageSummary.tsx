import type { AnalysisResult } from "@/types/analysis";

const DISTRIBUTION_COLORS: Record<string, string> = {
  English: "#6de8ff",
  Telugu: "#bdfa59",
  Hindi: "#ff79c9",
};

export function LanguageSummary({ result }: { result: AnalysisResult }) {
  return (
    <section className="result-card language-summary">
      <div className="card-heading">
        <div><span className="section-number">02</span><h2>Language signal</h2></div>
        <span className="heuristic-pill">Heuristic analysis</span>
      </div>
      <div className="signal-layout">
        <div className="dominant-block">
          <span className="eyebrow">Dominant language</span>
          <strong>{result.dominant_language}</strong>
          <span>{result.detected_languages.length} languages detected</span>
        </div>
        <div className="distribution">
          {Object.entries(result.language_distribution).map(([language, share]) => (
            <div className="distribution-row" key={language}>
              <div><span>{language}</span><b>{Math.round(share * 100)}%</b></div>
              <div className="bar"><span style={{ width: `${share * 100}%`, background: DISTRIBUTION_COLORS[language] }} /></div>
            </div>
          ))}
        </div>
        <div className="switch-stat">
          <span className="eyebrow">Switch boundaries</span>
          <strong>{String(result.code_switching.switch_count).padStart(2, "0")}</strong>
          <span>{result.code_switching.detected ? "Code-switching detected" : "Single-language sequence"}</span>
        </div>
      </div>
    </section>
  );
}
