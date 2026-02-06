import { TrustedContact } from "./contacts";

export function findRelevantContact(contacts: TrustedContact[], message: string) {
  const lower = message.toLowerCase();

  let best: TrustedContact | null = null;
  let bestScore = 0;

  for (const c of contacts) {
    let score = 0;

    if (c.name && lower.includes(c.name.toLowerCase())) score += 5;
    if (c.notes && lower.includes(c.notes.toLowerCase())) score += 3;

    // industry keywords
    const keywords = ["bank", "title", "closing", "escrow", "attorney", "lender"];
    if (
      keywords.some(
        (k) =>
          lower.includes(k) &&
          (c.notes?.toLowerCase().includes(k) || c.name?.toLowerCase().includes(k))
      )
    ) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}
