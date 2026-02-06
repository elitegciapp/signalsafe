export type Channel = "email" | "text" | "unknown";

export function detectChannel(message: string): Channel {
  const lower = message.toLowerCase();

  if (lower.includes("@") && lower.includes(".com")) return "email";

  if (
    lower.includes("text me") ||
    lower.includes("sms") ||
    lower.includes("mobile") ||
    lower.includes("cell")
  )
    return "text";

  return "unknown";
}
