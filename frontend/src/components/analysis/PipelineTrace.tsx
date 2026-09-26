import { Check, ChevronRight } from "lucide-react";

import type { AnalysisResult } from "@/types/analysis";

export function PipelineTrace({ result }: { result: AnalysisResult }) {
  return (
    <section className="result-card pipeline-card">
      <div className="card-heading"><div><span className="section-number">06</span><h2>Processing trace</h2></div><span className="trace-time">Deterministic baseline</span></div>
      <div className="pipeline-track">
        {result.pipeline.map((stage, index) => (
          <div className="pipeline-stage" key={stage.key}>
            <span className="stage-check"><Check size={13} /></span>
            <div><strong>{stage.label}</strong><small>{stage.summary}</small></div>
            {index < result.pipeline.length - 1 && <ChevronRight className="stage-arrow" size={15} />}
          </div>
        ))}
      </div>
    </section>
  );
}
