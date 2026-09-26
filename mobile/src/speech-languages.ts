export const speechLanguages = [
  { code:'auto', label:'Auto / mixed' },
  { code:'en', label:'English' },
  { code:'hi', label:'हिन्दी' },
  { code:'bn', label:'বাংলা' },
  { code:'mr', label:'मराठी' },
  { code:'te', label:'తెలుగు' },
  { code:'ta', label:'தமிழ்' },
  { code:'zh', label:'中文' },
  { code:'es', label:'Español' },
  { code:'ar', label:'العربية' },
  { code:'fr', label:'Français' },
] as const;
export type SpeechLanguage = (typeof speechLanguages)[number]['code'];
