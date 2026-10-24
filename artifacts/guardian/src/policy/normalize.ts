/**
 * Text normalization for policy matching.
 *
 * `display` keeps the original wording (NFKC, invisible characters removed);
 * `folded` is lower-cased, de-obfuscated text the rules run against.
 */
export interface NormalizedText {
  display: string;
  folded: string;
}

const INVISIBLE = /[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD]/g;
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

export function normalizeText(input: string): NormalizedText {
  const display = input.normalize("NFKC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  let folded = display
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"');
  // De-leet only real words (2+ letters), so "225 lbs", "5x5", "3x10" and "1rm" survive.
  folded = folded.replace(/[a-z0-9@$!]+/g, (word) => {
    const letters = word.replace(/[^a-z]/g, "").length;
    if (letters < 2 || !/[0-9@$!]/.test(word) || /^\d+(?:x\d+)+$/.test(word) || /^\d+[a-z]{1,3}$/.test(word)) return word;
    return word.replace(/[0-9@$!]/g, (c) => LEET[c] ?? c);
  });
  // Collapse stretched letters ("gearrrr" -> "gearr") and spaced-out words ("s t e r o i d s").
  folded = folded.replace(/([a-z])\1{2,}/g, "$1$1");
  folded = folded.replace(/\b(?:[a-z] ){3,}[a-z]\b/g, (m) => m.replace(/ /g, ""));
  return { display, folded };
}

/** Usernames: treat separators as spaces so rules can see words. */
export function normalizeUsername(input: string): NormalizedText {
  return normalizeText(input.replace(/[._\-]+/g, " "));
}
