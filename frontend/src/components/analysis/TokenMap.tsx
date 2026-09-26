import { LANGUAGE_STYLES } from "@/lib/constants";
import type { AnalysisResult } from "@/types/analysis";

export function TokenMap({ result }: { result: AnalysisResult }) {
  return (
    <section className="result-card">
      <div className="card-heading">
        <div><span className="section-number">03</span><h2>Code-switch map</h2></div>
        <div className="legend">
          {["en", "te", "hi", "technical", "unknown"].map((language) => (
            <span key={language}><i style={{ background: LANGUAGE_STYLES[language].color }} />{LANGUAGE_STYLES[language].label}</span>
          ))}
        </div>
      </div>
      <div className="token-map">
        {result.tokens.map((token) => {
          const style = LANGUAGE_STYLES[token.language] ?? LANGUAGE_STYLES.unknown;
          return (
            <div className={`token-chip ${token.category === "punctuation" ? "punctuation" : ""}`} key={`${token.index}-${token.text}`} style={{ "--token-color": style.color, "--token-bg": style.bg } as React.CSSProperties}>
              <span>{token.text}</span>
              {token.category !== "punctuation" && <small>{style.label}</small>}
            </div>
          );
        })}
      </div>
      <p className="card-note">Technical terms and uncertain tokens do not create artificial switch boundaries.</p>
    </section>
  );
}
