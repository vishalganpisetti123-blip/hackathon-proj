import { Bot, ShieldAlert } from "lucide-react";

import type { AnalysisResult } from "@/types/analysis";

import { DeveloperJson } from "./DeveloperJson";
import { IntentEntities } from "./IntentEntities";
import { LanguageSummary } from "./LanguageSummary";
import { MeaningPanel } from "./MeaningPanel";
import { PipelineTrace } from "./PipelineTrace";
import { TokenMap } from "./TokenMap";

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <div className="results-stack">
      <LanguageSummary result={result} />
      <TokenMap result={result} />
      <MeaningPanel result={result} />
      <IntentEntities result={result} />
      {result.response && <section className="response-card"><Bot size={19} /><div><span>Optional response</span><p>{result.response}</p></div></section>}
      <PipelineTrace result={result} />
      <DeveloperJson result={result} />
      <div className="caveat"><ShieldAlert size={15} /><span>{result.caveats.join(" ")}</span></div>
    </div>
  );
}
