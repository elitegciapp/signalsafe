export function generateSafeReply(verdict: string, channel: string | null) {
  if (verdict === "HIGH_RISK") {
    return "For security reasons I will verify this request using the official contact information on record.";
  }

  if (verdict === "VERIFY") {
    if (channel === "email")
      return "Thanks — I will confirm this through the known phone number before proceeding.";

    if (channel === "text")
      return "I will verify this request via the official email on file before taking action.";

    return "I will independently verify this request before proceeding.";
  }

  return "Thank you — I will review and follow up if needed.";
}
