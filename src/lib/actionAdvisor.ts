export function getActionSteps(verdict: string) {
  if (verdict === "HIGH_RISK") {
    return [
      "Do NOT send money or information",
      "Contact the organization using a trusted phone number",
      "Do not reply to the message",
      "Preserve the message as evidence",
      "Notify your bank or security team if funds were requested",
    ];
  }

  if (verdict === "VERIFY") {
    return [
      "Verify using a known phone number or official website",
      "Do not use contact info provided in the message",
      "Wait before taking action",
    ];
  }

  return ["No immediate risk detected", "Proceed normally but stay cautious"];
}
