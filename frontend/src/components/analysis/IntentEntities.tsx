import { Boxes, Target } from "lucide-react";

import type { AnalysisResult } from "@/types/analysis";

export function IntentEntities({ result }: { result: AnalysisResult }) {
  return (
    <div className="meaning-grid">
      <section className="result-card intent-card">
        <div className="card-heading compact"><div><Target size={17} /><h2>Intent</h2></div></div>
        <div className="intent-value">
          <strong>{result.intent.label}</strong>
          <span>{Math.round(result.intent.heuristic_confidence * 100)} heuristic score</span>
        </div>
        <p>{result.intent.evidence.join(" · ")}</p>
      </section>
      <section className="result-card entity-card">
        <div className="card-heading compact"><div><Boxes size={17} /><h2>Entities</h2></div></div>
        <div className="entity-list">
          {result.entities.length ? result.entities.map((entity, index) => (
            <div key={`${entity.text}-${index}`}><strong>{entity.text}</strong><span>{entity.type}</span>{entity.normalized_value && <small>{entity.normalized_value}</small>}</div>
          )) : <p className="empty-inline">No supported entities detected.</p>}
        </div>
      </section>
    </div>
  );
}
