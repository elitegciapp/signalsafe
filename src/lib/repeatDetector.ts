import { getHistory } from "./historyStore";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string) {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));

  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;

  return intersection / union;
}

export function findRepeatScam(message: string) {
  const history = getHistory();
  const current = normalize(message);

  for (const item of history) {
    if (item.verdict !== "HIGH_RISK") continue;

    const past = normalize(item.message);
    const score = similarity(current, past);

    if (score > 0.6) {
      return item;
    }
  }

  return null;
}
