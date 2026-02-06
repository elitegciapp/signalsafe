import { expect, test } from "@playwright/test";

test("HIGH_RISK requires verification before copy", async ({ page }) => {
  const highRiskMessage =
    "URGENT: Final notice. This is your bank. Pay via gift card within 24 hours or your account will be closed.";

  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "test-request-id",
        verdict: "HIGH_RISK",
        riskScore: 85,
        categories: ["Urgency/Pressure", "Payment Trap", "Impersonation"],
        summary: "High likelihood of scam indicators: urgency + risky payment + impersonation.",
        redFlags: [
          "Uses urgency/pressure language to force quick action.",
          "Requests high-risk payment method (gift card, wire, crypto, etc.).",
          "Potential impersonation of an authority/brand.",
        ],
        recommendedActions: [
          "Do not click links or send money.",
          "Independently verify the sender using a known phone number or official website.",
          "If this involves a financial account, contact your bank directly.",
        ],
      }),
    });
  });

  await page.goto("/");

  await page.getByPlaceholder("Paste text here…").fill(highRiskMessage);
  await page.getByRole("button", { name: "Analyze risk" }).click();

  const verdictBlock = page.getByText("Verdict").locator("..");
  await expect(verdictBlock.getByText("HIGH_RISK", { exact: true })).toBeVisible();

  // Gate shows up for HIGH_RISK
  const verifyCheckbox = page.getByRole("checkbox");
  await expect(verifyCheckbox).toBeVisible();
  await expect(
    page.getByText("Actions are locked until verification")
  ).toBeVisible();

  const copyReply = page.getByRole("button", { name: "Copy Reply" });
  const copyReport = page.getByRole("button", { name: "Copy Report" });

  await expect(copyReply).toBeDisabled();
  await expect(copyReport).toBeDisabled();

  // Incident report is generated
  await expect(page.getByText("Incident Report", { exact: true })).toBeVisible();
  const incidentReportBox = page.locator('textarea[rows="10"]');
  await expect(incidentReportBox).toHaveValue(/FRAUD INCIDENT REPORT/i);

  // Verify unlocks copy actions
  await verifyCheckbox.check();
  await expect(copyReply).toBeEnabled();
  await expect(copyReport).toBeEnabled();

  // Clicking copy shouldn't throw (clipboard permission granted via config)
  await copyReply.click();
  await copyReport.click();
});
