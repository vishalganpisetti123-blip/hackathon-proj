"use client";

import { Clock3, Languages, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { clearHistory, readHistory } from "@/lib/history";
import type { HistoryEntry } from "@/types/analysis";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const task = window.setTimeout(() => setEntries(readHistory()), 0);
    return () => window.clearTimeout(task);
  }, []);

  function clear() {
    clearHistory();
    setEntries([]);
  }

  return (
    <main className="content-page">
      <header className="page-title-row">
        <div><span className="section-kicker"><span>H</span> Local workspace</span><h1>Analysis history</h1><p>Your latest 20 analyses stay in this browser only.</p></div>
        {entries.length > 0 && <button className="secondary-button" onClick={clear}><Trash2 size={15} /> Clear history</button>}
      </header>
      {entries.length ? (
        <div className="history-list">
          {entries.map((entry) => (
            <article key={entry.id}>
              <div className="history-meta"><span><Clock3 size={13} />{new Date(entry.timestamp).toLocaleString()}</span><span><Languages size={13} />{entry.result.detected_languages.join(" + ") || "Unknown"}</span></div>
              <h2>{entry.result.original_text}</h2>
              <p>{entry.result.normalized_meaning}</p>
              <div><span>{entry.result.intent.label}</span><span>{entry.result.code_switching.switch_count} switches</span></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state page-empty"><Clock3 size={28} /><strong>No analyses yet</strong><p>Run an analysis and it will be saved here on this device.</p></div>
      )}
    </main>
  );
}
