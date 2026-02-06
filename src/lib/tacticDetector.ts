export type ScamTactic = "urgency" | "authority" | "threat" | "payment";

const patterns: Record<ScamTactic, string[]> = {
  urgency: ["immediately", "right now", "urgent", "asap", "today only", "act fast"],

  authority: [
    "closing department",
    "bank",
    "title company",
    "irs",
    "attorney",
    "manager",
  ],

  threat: [
    "account suspended",
    "legal action",
    "penalty",
    "late fee",
    "locked",
    "terminated",
  ],

  payment: ["wire", "transfer", "send funds", "bitcoin", "gift cards", "new account"],
};

export function detectTactics(message: string): ScamTactic[] {
  const text = message.toLowerCase();
  const hits: ScamTactic[] = [];

  for (const tactic in patterns) {
    const words = patterns[tactic as ScamTactic];
    if (words.some((w) => text.includes(w))) {
      hits.push(tactic as ScamTactic);
    }
  }

  return hits;
}
