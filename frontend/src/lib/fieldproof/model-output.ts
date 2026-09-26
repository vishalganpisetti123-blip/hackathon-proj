export function parseBrowserTranslation(content: string): string {
  // WebLLM can prepend an empty thinking marker even with thinking disabled.
  const json = content.replace(/^\s*<think>\s*<\/think>\s*/, '');
  let parsed: unknown;
  try { parsed = JSON.parse(json); }
  catch { throw new Error('The local model did not return a complete translation. Retry or choose Original spoken language.'); }
  const translation = (parsed as {translation?: unknown})?.translation;
  if(typeof translation !== 'string' || !translation.trim()) throw new Error('The local model returned no translation.');
  return translation.trim();
}
