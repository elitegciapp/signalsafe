import { useState } from "react";

export function useVerificationGate(verdict: string) {
  const [verified, setVerified] = useState(false);

  const blocked = verdict === "HIGH_RISK" && !verified;

  return {
    verified,
    setVerified,
    blocked
  };
}
