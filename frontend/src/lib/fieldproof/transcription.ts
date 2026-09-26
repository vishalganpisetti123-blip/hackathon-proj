export type SpeechLanguage = 'auto' | 'en' | 'hi' | 'te' | 'bn' | 'mr' | 'ta' | 'zh' | 'es' | 'ar' | 'fr';
export type PresentationLanguage = Exclude<SpeechLanguage, 'auto'> | 'original';
export type SpeechModel = 'base' | 'small' | 'telugu' | 'hindi' | 'tamil' | 'bengali' | 'marathi';
export const bundledSpecialists = process.env.NEXT_PUBLIC_BUNDLED_SPECIALISTS !== '0';
export function availableSpeechModel(model: SpeechModel): SpeechModel {
  return !bundledSpecialists && model !== 'base' && model !== 'small' ? 'small' : model;
}
export type SpeechChunk = { text: string; timestamp: [number | null, number | null] };
export type TranscriptResult = { text: string; chunks: SpeechChunk[]; language: SpeechLanguage; model: SpeechModel };
export type TranscriptDraft = { id: string; createdAt: string; updatedAt: string; text: string; original: string; audio: Blob | null; chunks: SpeechChunk[]; language: SpeechLanguage; model: SpeechModel; presentationLanguage: PresentationLanguage; presentedText: string; detectedLanguage?: string; meaningReview?: MeaningReview };
export const languageOptions = [{ value: 'auto', label: 'Auto / mixed languages' }, { value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी · Hindi' }, { value: 'te', label: 'తెలుగు · Telugu' }, { value: 'bn', label: 'বাংলা · Bengali' }, { value: 'mr', label: 'मराठी · Marathi' }, { value: 'ta', label: 'தமிழ் · Tamil' }, { value: 'zh', label: '中文 · Mandarin' }, { value: 'es', label: 'Español · Spanish' }, { value: 'ar', label: 'العربية · Arabic' }, { value: 'fr', label: 'Français · French' }] as const;
export const presentationOptions = [{value:'original',label:'Original spoken language'}, ...languageOptions.filter(option => option.value !== 'auto').map(option => ({value:option.value,label:option.value === 'en' ? 'English · recommended' : option.label}))] as const;
export function freshTranscript(): TranscriptDraft { return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), text: '', original: '', audio: null, chunks: [], language: 'auto', model: 'small', presentationLanguage: 'en', presentedText: '' }; }
export function presentedTranscript(draft: TranscriptDraft): string { return (draft.presentationLanguage ?? 'en') === 'original' ? draft.text : draft.presentedText ?? ''; }
export function speechCacheKey(model: SpeechModel) { return model === 'base' ? 'fieldproof-speech-prepared' : `fieldproof-speech-${model}-prepared`; }
export function sentenceSegments(text: string): string[] {
  return [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].map(item => item.segment.trim()).filter(Boolean);
}
import type { MeaningReview } from './meaning-check';
