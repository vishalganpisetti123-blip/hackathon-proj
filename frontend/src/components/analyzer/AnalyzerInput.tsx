"use client";

import { CornerDownLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import type { ExamplePrompt } from "@/types/analysis";

interface Props {
  text: string;
  examples: ExamplePrompt[];
  loading: boolean;
  includeResponse: boolean;
  onTextChange: (value: string) => void;
  onIncludeResponseChange: (value: boolean) => void;
  onAnalyze: () => void;
  onExample: (example: ExamplePrompt) => void;
}

export function AnalyzerInput({
  text,
  examples,
  loading,
  includeResponse,
  onTextChange,
  onIncludeResponseChange,
  onAnalyze,
  onExample,
}: Props) {
  return (
    <section className="input-panel" aria-labelledby="input-heading">
      <div className="section-kicker"><span>01</span> Input signal</div>
      <div className="input-heading-row">
        <div>
          <h1 id="input-heading">Understand language<br />the way people use it.</h1>
          <p>Mixed scripts, spelling by ear, slang and all.</p>
        </div>
        <div className="live-badge"><span /> Local text pipeline</div>
      </div>

      <div className="composer">
        <textarea
          aria-label="Mixed-language sentence"
          maxLength={1000}
          placeholder="Type the message exactly as you received it…"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onAnalyze();
          }}
        />
        <div className="composer-footer">
          <span className="character-count">{text.length} / 1000</span>
          <Link className="icon-button" href="/transcribe" title="Open the local speech transcriber">Use voice</Link>
        </div>
      </div>

      <div className="example-list" aria-label="Example inputs">
        {examples.map((example) => (
          <button key={example.id} type="button" onClick={() => onExample(example)}>
            {example.label}
          </button>
        ))}
      </div>

      <div className="action-row">
        <label className="response-toggle">
          <input
            type="checkbox"
            checked={includeResponse}
            onChange={(event) => onIncludeResponseChange(event.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true"><span /></span>
          Draft a style-aware response
        </label>
        <button className="analyze-button" type="button" onClick={onAnalyze} disabled={loading || !text.trim()}>
          {loading ? <><span className="spinner" /> Analyzing signal</> : <><Sparkles size={17} /> Analyze <CornerDownLeft size={15} /></>}
        </button>
      </div>
    </section>
  );
}
