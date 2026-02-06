export function generateReply(verdict: string) {
  if (verdict === "HIGH_RISK") {
    return `For security reasons I will not send any funds or personal information.

I will contact the company directly using the official phone number on file to verify this request.

Do not contact me again regarding this matter.`;
  }

  if (verdict === "VERIFY") {
    return `Before proceeding I need to verify this request through an official contact channel.

Please provide your company name and I will call the publicly listed number to confirm.`;
  }

  return `Thank you. I will review and follow up if needed.`;
}
