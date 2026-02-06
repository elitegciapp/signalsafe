import { Channel } from "./channelDetector";

export function recommendVerification(channel: Channel, highRisk: boolean) {
  if (highRisk) return "phone";

  if (channel === "email") return "phone";
  if (channel === "text") return "email";

  return "phone";
}
