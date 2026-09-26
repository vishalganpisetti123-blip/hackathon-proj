"use client";

import { Check, Clipboard, Code2, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { AnalysisResult } from "@/types/analysis";

export function DeveloperJson({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="json-card">
      <button className="json-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span><Code2 size={17} /> Developer JSON <small>schema v{result.schema_version}</small></span>
        <ChevronDown size={17} className={open ? "rotate" : ""} />
      </button>
      {open && (
        <div className="json-body">
          <button type="button" onClick={copy}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? "Copied" : "Copy"}</button>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
