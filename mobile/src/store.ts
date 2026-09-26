import * as SQLite from 'expo-sqlite';
import type { SpeechLanguage } from './speech-languages';
import type { TargetLanguage } from './inference';
import type { MeaningReview, TimedPhrase } from './meaning-check';

export type SavedTranscript = { id: string; createdAt: string; updatedAt: string; text: string; original: string; audioUri: string | null; language: SpeechLanguage; detectedLanguage?: string; presentationLanguage: TargetLanguage; presentedText: string; segments?: TimedPhrase[]; meaningReview?: MeaningReview };

const database = SQLite.openDatabaseAsync('fieldproof.db').then(async db => {
  await db.execAsync(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS transcripts (id TEXT PRIMARY KEY, updated_at TEXT NOT NULL, payload TEXT NOT NULL);`);
  return db;
});
let writes: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const task = writes.catch(() => undefined).then(operation);
  writes = task;
  return task;
}
export async function loadTranscript(): Promise<SavedTranscript | null> {
  const row = await (await database).getFirstAsync<{ payload: string }>('SELECT payload FROM transcripts ORDER BY updated_at DESC LIMIT 1');
  return row ? JSON.parse(row.payload) as SavedTranscript : null;
}
export function saveTranscript(transcript: SavedTranscript) {
  const payload = JSON.stringify(transcript);
  return serialize(async () => (await database).runAsync('INSERT OR REPLACE INTO transcripts (id, updated_at, payload) VALUES (?, ?, ?)', transcript.id, transcript.updatedAt, payload));
}
export async function recentTranscripts(): Promise<SavedTranscript[]> {
  const rows = await (await database).getAllAsync<{ payload: string }>('SELECT payload FROM transcripts ORDER BY updated_at DESC LIMIT 30');
  return rows.map(row => JSON.parse(row.payload) as SavedTranscript);
}
