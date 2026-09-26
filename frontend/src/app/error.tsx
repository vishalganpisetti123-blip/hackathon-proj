"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unexpected application error", error);
  }, [error]);

  return (
    <main className="content-page">
      <div className="empty-state page-empty" role="alert">
        <AlertTriangle size={28} />
        <strong>The interface hit an unexpected error</strong>
        <p>Your input has not been sent again. Retry the current view when you are ready.</p>
        <button className="secondary-button" type="button" onClick={reset}><RotateCcw size={15} /> Retry</button>
      </div>
    </main>
  );
}
