import { Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Polyglot Pulse home">
        <span className="brand-mark"><Activity size={18} /></span>
        <span>Polyglot <strong>Pulse</strong></span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/analyze">Analyze</Link>
        <Link href="/transcribe">Transcribe</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/history">History</Link>
        <Link href="/about">How it works</Link>
      </nav>
      <Link className="api-link" href="/transcribe">Start speaking <ArrowUpRight size={14} /></Link>
    </header>
  );
}
