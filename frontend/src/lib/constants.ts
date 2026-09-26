import type { ExamplePrompt } from "@/types/analysis";

export const EXAMPLES: ExamplePrompt[] = [
  { id: "english-telugu", label: "English + Telugu", text: "Bro rep DBMS exam undha?", note: "Latin Telugu + technical English" },
  { id: "english-hindi", label: "English + Hindi", text: "Kal meeting hai but I haven't prepared anything", note: "Hinglish with an event" },
  { id: "three-language", label: "Three languages", text: "Anna naku rep interview undhi but preparation em cheyalo samajh nahi aa raha", note: "English + Telugu + Hindi" },
  { id: "native-script", label: "Native script", text: "రేపు DBMS exam ఉందా?", note: "Telugu script + English" },
  { id: "phonetic", label: "Spelling by ear", text: "broo raypu exm undhaa?", note: "Phonetic misspellings" },
];

export const LANGUAGE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  en: { label: "EN", color: "#72E6FF", bg: "rgba(30, 181, 215, .13)" },
  te: { label: "TE", color: "#C6F56B", bg: "rgba(166, 218, 64, .13)" },
  hi: { label: "HI", color: "#FF8DD1", bg: "rgba(255, 91, 183, .13)" },
  technical: { label: "TERM", color: "#B7A3FF", bg: "rgba(135, 103, 255, .15)" },
  ambiguous: { label: "AMB", color: "#FFCC66", bg: "rgba(255, 181, 47, .13)" },
  unknown: { label: "?", color: "#8B94A7", bg: "rgba(139, 148, 167, .1)" },
};
