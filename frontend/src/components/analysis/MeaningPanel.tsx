import { ArrowRight, Languages, Quote } from "lucide-react";

import type { AnalysisResult } from "@/types/analysis";

export function MeaningPanel({ result }: { result: AnalysisResult }) {
  const transliterations = result.tokens.filter((token) => token.transliterated);
  return (
    <div className="meaning-grid">
      <section className="result-card meaning-card">
        <div className="card-heading compact">
          <div><span className="section-number">04</span><h2>Normalized meaning</h2></div>
          <Quote size={18} />
        </div>
        <blockquote>{result.normalized_meaning}</blockquote>
        <div className="original-line"><span>Normalized text</span>{result.normalized_text}</div>
      </section>

      <section className="result-card transliteration-card">
        <div className="card-heading compact">
          <div><span className="section-number">05</span><h2>Transliteration</h2></div>
          <Languages size={18} />
        </div>
        {transliterations.length ? (
          <div className="transliteration-list">
            {transliterations.slice(0, 5).map((token) => (
              <div className="transliteration-row" key={token.index}>
                <b>{token.text}</b><ArrowRight size={14} /><strong>{token.native_form}</strong><span>{token.meaning}</span>
              </div>
            ))}
          </div>
        ) : <p className="empty-inline">No known Latin transliterations in this input.</p>}
      </section>
    </div>
  );
}
