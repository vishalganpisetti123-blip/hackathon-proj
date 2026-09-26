import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content-page">
      <div className="empty-state page-empty">
        <strong>That route is not part of the pipeline</strong>
        <p>Return to the analyzer to inspect a multilingual message.</p>
        <Link className="secondary-button" href="/"><ArrowLeft size={15} /> Back to analyzer</Link>
      </div>
    </main>
  );
}
