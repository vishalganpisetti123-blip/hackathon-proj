import type { Metadata } from "next";

import { AnalysisWorkbench } from "@/components/analyzer/AnalysisWorkbench";

export const metadata: Metadata = { title: "Judge demo — Polyglot Pulse" };

export default function DemoPage() {
  return <AnalysisWorkbench demoMode />;
}
